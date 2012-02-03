#!/usr/bin/perl -w

# prepareLocalHMDB.pl
# A Perl script to download/parse specific data from NCBI to create the species and gene
# tables in the KUPKB_Vis database
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 31 - 01 - 2012 (dd - mm - yyyy)
# Last Update : XX - XX - XXXX (dd - mm - yyyy)
# Version     : 1.0

use strict;
use Getopt::Long;
use DBI;
use File::Temp;
use File::Spec;
use LWP::UserAgent;
use POSIX qw(floor ceil);

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "mirna2table.pl";
our $input; 	 # Input path containing downloaded files OR the bareword "download"
our $paramfile;  # YAML parameters file
our @dbdata;	 # Username and password for the DB to avoid hardcoding
our $silent = 0; # Display verbose messages
our $waitbar;    # Use a waitbar for parsing?
our $help = 0;   # Help?

# Check for the presence of YAML, required!!!
&tryModule("YAML");

# Check inputs
&checkInputs;

# Record progress...
my $date = &now;
disp("$date - Started...");
disp("Building the mirna to gene target table in KUPKB_Vis...");

# Read the parameters file
use YAML qw(LoadFile Dump);
my ($pfh,$phref);
if ($paramfile)
{
	eval
	{
		open ($pfh,"<",$paramfile);
		$phref = LoadFile($pfh);
		close($pfh);
	};
	if ($@)
	{
		disp("Bad parameter file! Will try to load defaults...");
		$phref = &loadDefaultParams();
	}
}
else { $phref = &loadDefaultParams(); } # Not given

# Proceed with data reading/downloading
my %sfhash;
if ($input =~ m/download/i) # Case where we download from HTTP
{
	use Archive::Extract;
	use Net::FTP;

	my ($s,$f,$ftp,$tmpdir,$tmpzip,$ae,$ok);
	my ($pref,$suff) = ("arch.v5.txt.",".zip");
	$ftp = Net::FTP->new("ftp.ebi.ac.uk",Debug => 0) or die "\nCannot connect to FTP: $@","\n";
	$ftp->login("anonymous") or die "\nCannot login ",$ftp->message,"\n";
	$ftp->binary; # Saves a lot of trouble...

	$tmpdir = File::Temp->newdir();
	foreach $s (@{$phref->{"species"}})
	{
		disp("Getting miRNA targets for species $f from EBI FTP server...");
		$f = lc($s);
		if ($f =~ m/^canis*/) # Dirty hack... hope someday to fix it...
		{
			$f = $pref."canis_familiaris".$suff;
		}
		else
		{
			$f =~ s/ /_/g;
			$f = $pref.$f.$suff;
		}
		$tmpzip = File::Spec->catfile($tmpdir,$f);
		$ftp->get("/pub/databases/microcosm/v5/".$f,$tmpzip) or die "FTP get failed ",$ftp->message,"\n";
		disp("Uncompressing...");
		$ae = Archive::Extract->new(archive => $tmpzip);
		$ok = $ae->extract(to => $tmpdir) or die $ae->error,"\n";
		$f =~ s/^arch\.|\.zip$//;
		$sfhash{lc($s)} = File::Spec->catfile($tmpdir,$f);
	}

	$input = $tmpdir;
}
elsif (-d $input)
{
	my ($s,$f);
	my ($pref,$suff) = ("arch.v5.txt.",".zip");
	my @files;
	eval
	{
		require File::List;
		my $search = new File::List($input);
		@files  = @{$search->find("\.txt\.")};
	};
	if ($@)
	{
		@files = &listRecurse($input);
	}
	foreach $f (@files)
	{
		$s = lc($f);
		$s =~ s/^v\d?\.txt\.//;

		# FIXME!!! sfhash has to be constructed somehow...
		if ($f =~ m/^canis*/) # Dirty hack... hope someday to fix it...
		{
			$f = $pref."canis_familiaris".$suff;
		}
		else
		{
			$f =~ s/ /_/g;
			$f = $pref.$f.$suff;
		}
	}
}

# In the case of input being a directory or having downloaded and passed to next argument
if (-d $input)
{
	# Create a hash of existing species in the database so that we can record the tax_id in
	# the database
	my %sphash = &getSpeciesHash();
	my %enhash = &getEnsemblSpeciesHash(\%sfhash);
	#my %enhash = ("homo sapiens" => "v5.txt.homo_sapiens");
	# Create a hash of uncompressed files and species --DONE
	# Using this hash and a loop:
	#	Read for each file in a hash mirBase IDs and ensembl transcripts
	#	Collect the ensembl transcripts and run biomart XML to retrieve genes and proteins
	#	Put them in a hash with keys the transcripts
	# Using the created hashes insert records in the table
	# Table will be (Increment, miRNA, Gene, Protein, Species)

	# General variables
	my ($line,$len,$sp,$file,$xml,$tmpfh,$i);
	my (@columns,@mirnas,@transcripts,@orgtranscripts);
	my %fields;
	my $c = 0;
	
	foreach $sp (keys(%sfhash))
	{
		disp($sp);
		my (%seen,%tran2gene,%tran2prot,%mirnatargets);
		
		$file = $sfhash{$sp};
		disp("Reading target file $file...");
		$len = &countLines($file) if ($waitbar);
		&waitbarInit if ($waitbar);
		open(TARGET,$file);
		while($line = <TARGET>)
		{
			$c++;
			&waitbarUpdate($c,$len) if ($waitbar);
			next if ($line =~ m/^#+/g);
			$line =~ s/\r|\n$//g;
			@columns = split(/\t/,$line);
			push(@{$mirnatargets{$columns[1]}},$columns[11]);
		}
		close(TARGET);

		# Create unique Ensembl transcript targets as because each miRNA might target a
		# different sequence of the transcript, we end up in duplicates
		# Also, get the transcripts for the species under consideration
		@mirnas = keys(%mirnatargets);
		for ($i=0; $i<@mirnas; $i++)
		{
			@transcripts = @{$mirnatargets{$mirnas[$i]}};
			%seen = &unique(@transcripts);
			$mirnatargets{$mirnas[$i]} = keys(%seen);
			push(@orgtranscripts,@{$mirnatargets{$mirnas[$i]}});
		}

		# Now launch Biomart service request
		%seen = &unique(@orgtranscripts);
		$xml = &getXMLQuery($enhash{$sp},keys(%seen));
		
		my $path="http://www.biomart.org/biomart/martservice?";
		my $request = HTTP::Request->new("POST",$path,HTTP::Headers->new(),'query='.$xml."\n");
		my $ua = LWP::UserAgent->new;
		my $response;

		# We need to put data in a temporary file because it's scrambled by asynchronicity
		$tmpfh = File::Temp->new(DIR => $input,SUFFIX => ".ens");
		$ua->request($request,
						sub
						{   
							my ($data,$response) = @_;
							if ($response->is_success)
							{
								print $tmpfh "$data";
							}
							else
							{
								warn ("Problems with the web server: ".$response->status_line);
							}
						},1000);

		seek($tmpfh,0,SEEK_SET);
		while ($line = <$tmpfh>)
		{
			$line =~ s/\r|\n$//g;
			@columns = split(/\t/,$line);
			$tran2gene{$columns[0]} = $columns[1];
			$tran2prot{$columns[0]} = $columns[2];
		}

		&printHash(%tran2gene);
		#&insertInteraction(\%fields);
	}
}

$date = &now;
disp("$date - Finished!\n");


# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("input|i=s" => \$input,
			   "param|p=s" => \$paramfile,
    		   "dbdata|d=s{,}" => \@dbdata,
    		   "waitbar|w" => \$waitbar,
    		   "silent|s" => \$silent,
    		   "help|h" => \$help);
    # Check if the required arguments are set
    if ($help)
    {
    	&programUsage;
    	exit;
    }
    $stop .= "--- Please specify input path or download ---\n" if (!$input);
    $stop .= "--- Please provide database connection data ---\n" if (!@dbdata);
    $stop .= "--- --dbdata should be consisted of two strings! ---\n"
		if (@dbdata && $#dbdata+1 != 2);
    if ($stop)
    {
            print "\n$stop\n";
            print "Type perl $scriptname --help for help in usage.\n\n";
            exit;
    }
    disp("Parameter file not given... Will try to load defaults...") if (!$paramfile);
}

sub insertTarget
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"mirna_id"} = $conn->quote($fields{"mirna_id"});
	$fields{"ensembl_gene"} = $conn->quote($fields{"ensembl_gene"});
	$fields{"ensembl_protein"} = $conn->quote($fields{"ensembl_protein"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `mirna_to_ensembl` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub getSpeciesHash
{
	my %out;
	my $href;
	
	my $conn = &openConnection(@dbdata);
	my $query = "SELECT `tax_id`,`name` FROM `species`;";
	my $sth = $conn->prepare($query) or die "\nCouldn't prepare query: ".$conn->errstr;
	$sth->execute() or die "\nCouldn't execute query: ".$conn->errstr;
	while ($href = $sth->fetchrow_hashref)
	{
		$out{$href->{"name"}} = $href->{"tax_id"}
	}
	$sth->finish();
	&closeConnection($conn);
	
	return(%out);
}

sub getEnsemblSpeciesHash
{
	my %dbhash = %{$_[0]};
	my %enhash;

	my ($s,$pre,$su);
	my @spl;
	
	my @species = keys(%dbhash);
	foreach my $s (@species)
	{
		$s = lc($s);
		@spl = split(" ",$s);
		$pre = shift @spl;
		$pre = substr($pre,0,1);
		$su = pop(@spl);
		$enhash{$s} = $pre.$su."_gene_ensembl";
	}

	return(%enhash);
}
		

sub stripQuotes
{
	my $string = shift;
	$string =~ s/^\"+//;
	$string =~ s/\"+$//;
	return $string;
}

sub listRecurse
{
    my $path = shift @_;

    opendir (DIR, $path) or die "\nUnable to open $path: $!\n";
    my @files =
        # Third: Prepend the full path
        map { $path . '/' . $_ }
        # Second: take out '.' and '..'
        grep { !/^\.{1,2}$/ }
        # First: get all files
        readdir (DIR);
    closedir (DIR);
    for (@files)
    {
        if (-d $_)
        {
            push @files, listRecurse ($_);
        }
    }
    return @files;
}

sub loadDefaultParams
{
	my %h = ("FTP" => "ftp.ncbi.nlm.nih.gov",
			 "gene" => {
						"DATA" => [
									"gene2accession.gz",
									"gene2ensembl.gz",
									"gene2go.gz",
									"gene_refseq_uniprotkb_collab.gz",
									{
										"GENE_INFO" => {
											"Mammalia" => [
															"All_Mammalia.gene_info.gz"
														]
													}
									}
								],
							
				},
			 "pub" => {
						"taxonomy" => [
										"taxdump.tar.gz"
									]
				},
			 "species" => [
							"Homo sapiens",
							"Mus musculus",
							"Rattus norvegicus",
							"Canis lupus familiaris"
					],
			 "DESCRIPTION" => "/media/HD5/Work/TestGround/experiment_descriptions.xls",
			 "DATA" => "/media/HD5/Work/TestGround/datasets",
			 "INTERACTION_PATH" => "download",
			 "GENE_PATH" => "download",
			 "MIRNA_PATH" => "download"
		);
	return(\%h);
}

sub openConnection
{
    use DBI;
    
    my ($username,$password) = @_;
    my $hostname = "localhost";
    my $database = "KUPKB_Vis";
    
    my $conn = DBI->connect("dbi:mysql:database=$database;host=$hostname;port=3306",$username,$password);
    
    return $conn;
}

sub closeConnection
{
    use DBI;
    
    my $conn = shift @_;
    $conn->disconnect;
}

sub waitbarInit
{
	my $initlen = shift @_;
	$initlen = 50 if (!$initlen);
	my $printlen = ' 'x$initlen;
	print "\nProgress\n";
	print "|$printlen|\n";
	print("|");
}

sub waitbarUpdate
{
	my ($curr,$tot,$waitbarlen) = @_;
	$waitbarlen = 50 if (!$waitbarlen);
	my $step;
	if ($tot > $waitbarlen)
	{
		$step = ceil($tot/$waitbarlen);
		print "#" if ($curr%$step == 0);
	}
	else
	{
		$step = floor($waitbarlen/$tot);
		print "#" x $step;
	}
	if ($curr == $tot)
	{
		my $rem;
		($tot > $waitbarlen) ? ($rem = $waitbarlen - floor($tot/$step)) : 
		($rem = $waitbarlen - $tot*$step);
		($rem != 0) ? (print "#" x $rem."|\n") : print "|\n";
	}
}

sub initFields
{
	my %out = ("mirna_id" => "",
			   "ensembl_gene" => "",
			   "ensembl_protein" => "",
			   "species" => "NULL");
	return(%out);
}

sub getXMLQuery
{
	my $species = shift @_;
	my $query = join(",",@_);
	
	my $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n".
			  "<!DOCTYPE Query>".
			  "<Query virtualSchemaName = \"default\" formatter = \"TSV\" header = \"0\" uniqueRows = \"0\" count = \"\" datasetConfigVersion = \"0.6\" >\n".
			  "<Dataset name = \"$species\" interface = \"default\" >\n".
			  "<Filter name = \"ensembl_transcript_id\" value = \"$query\" />\n".
			  "<Attribute name = \"ensembl_transcript_id\" />\n".
			  "<Attribute name = \"ensembl_gene_id\" />\n".
			  "<Attribute name = \"ensembl_peptide_id\" />\n".
			  "</Dataset>\n".
			  "</Query>\n";
	return($xml);
}

sub unique
{
	my @list = @_;
	my (%seen,$item);
	foreach $item (@list) 
	{
		$seen{$item}++;
	}
	return(%seen);
}

sub now
{
	my $format = shift @_;
	$format = "human" if (!$format);
	my ($sec,$min,$hour,$day,$month,$year) = localtime(time);
	$year += 1900;
	$month++;
	$month = "0".$month if (length($month)==1);
	$day = "0".$day if (length($day)==1);
	$hour = "0".$hour if (length($hour)==1);
	$min = "0".$min if (length($min)==1);
	$sec = "0".$sec if (length($sec)==1);
	($format ne "machine") ? (return($day."/".$month."/".$year." ".$hour.":".$min.":".$sec)) :
	(return($year.$month.$day.$hour.$min.$sec));
}

sub countLines
{
	open(IN,$_[0]) or die "\nThe file $_[0] does not exist!\n\n";
	my $totlines = 0;
	$totlines += tr/\n/\n/ while sysread(IN,$_,2**16);
	close(IN);
	return $totlines;
}

sub disp
{
	print "\n@_" if (!$silent);
}

sub tryModule
{
	my $module = shift @_;
	eval "require $module";
	if ($@)
	{
		my $killer = "Module $module is required to continue with the execution. If you are in\n". 
					 "Windows and you have ActiveState Perl installed, use the Package Manager\n".
					 "to get the module. If you are under Linux, log in as a super user (or use\n".
					 "sudo under Ubuntu) and type \"perl -MCPAN -e shell\" (you will possibly have\n".
					 "to answer some questions). After this type \"install $module\" to install\n".
					 "the module. If you don't know how to install the module, contact your\n".
					 "system administrator.";
		die "\n$killer\n\n";
	}
}

sub programUsage 
{
	# The look sucks here but it is actually good in the command line
	my $usagetext = << "END";
	
$scriptname
Create the interactions table in KUPKB_Vis database.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --input dir/flag --param parameter_file.yml [OPTIONS]

--- Required ---
  --input|i		dir/flag	Program input. It can be the word download
			to build everything fetching files in real time or the
			interactions file downloaded manually (for the adventurous only!)
			which can be seen in the YAML parameters file.
  --dbdata|d		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.			
--- Optional ---
  --param|p		A YAML parameters file containing FTP locations, species
			and other information (see the example). If not given, some
			defaults will be used.
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --waitbar|w		Display a waitbar for long operations.
  --help|h		Display this help text.
	
This program builds the species and genes tables in the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

sub printHash
{
	my %h = %{$_[0]};
	print "\n-------------------- Begin hash contents --------------------\n";
	foreach my $k (keys(%h))
	{
		print "$k\t$h{$k}\n";
	}
	print "-------------------- End hash contents --------------------\n";
}

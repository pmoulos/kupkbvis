#!/usr/bin/perl -w

# prepareLocalHMDB.pl
# A Perl script to download/parse specific data from NCBI to create the species and gene
# tables in the KUPKB_Vis database
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 17 - 11 - 2011 (dd - mm - yyyy)
# Last Update : XX - XX - XXXX (dd - mm - yyyy)
# Version     : 1.0

use strict;
use Getopt::Long;
use DBI;
use File::Temp;
use File::Spec;
use POSIX qw(floor ceil);

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "string2table.pl";
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
disp("Building the protein-protein interaction table in KUPKB_Vis...");

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
if ($input =~ m/download/i) # Case where we download from HTTP
{
	use Archive::Extract;
	use LWP::Simple;

	my $staticURL = "http://string-db.org/newstring_download/protein.actions.v9.0.txt.gz";
	our $tmpdir = File::Temp->newdir();
	my $tmpzip = File::Spec->catfile($tmpdir,"ppis.gz");
	disp("Downloading protein-protein interactions file... It might take some time...");
	my $tmp = getstore($staticURL,$tmpzip);
	disp("Uncompressing...");
	my $ae = Archive::Extract->new(archive => $tmpzip);
	my $ok = $ae->extract(to => $tmpdir) or die $ae->error,"\n";

	$input = File::Spec->catfile($tmpdir,"ppis");
}

# In the case of input being a directory or having downloaded and passed to next argument
if (-f $input)
{
	# General variables
	my ($line,$len,$mats);
	my (@columns,@contents,@spids);
	my %fields;
	my $c = 0;
	$len = &countLines($input) if ($waitbar);

	# We have to read the species ids from the database...
	@spids = &getTaxID();
	$mats = join("|",@spids);

	disp("Building the interactions table from file $input for species in the database...");
	&waitbarInit if ($waitbar);
	open(PPIS,$input);
	while($line = <PPIS>)
	{
		$c++;
		&waitbarUpdate($c,$len) if ($waitbar);
		next if ($line !~ m/^($mats)/); # Oblivion if not to species...
		
		%fields = &initFields();
		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		@contents = split(/\./,$columns[0]);
		$fields{"source"} = $contents[1];
		@contents = split(/\./,$columns[1]);
		$fields{"target"} = $contents[1];
		$fields{"interaction"} = $columns[2];
		$fields{"species"} = $contents[0];
		
		&insertInteraction(\%fields);
	}
	close(PPIS);
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

sub insertInteraction
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"source"} = $conn->quote($fields{"source"});
	$fields{"interaction"} = $conn->quote($fields{"interaction"});
	$fields{"target"} = $conn->quote($fields{"target"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `interactions` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub getTaxID
{
	my @out;
	my $href;
	
	my $conn = &openConnection(@dbdata);
	my $query = "SELECT `tax_id` FROM `species`;";
	my $sth = $conn->prepare($query) or die "\nCouldn't prepare query: ".$conn->errstr;
	$sth->execute() or die "\nCouldn't execute query: ".$conn->errstr;
	while ($href = $sth->fetchrow_hashref)
	{
		push(@out,$href->{"tax_id"});
	}
	$sth->finish();
	&closeConnection($conn);
	
	return(@out);
}

sub stripQuotes
{
	my $string = shift;
	$string =~ s/^\"+//;
	$string =~ s/\"+$//;
	return $string;
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
			 "GENE_PATH" => "download"
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
	my %out = ("source" => "",
			   "interaction" => "",
			   "target" => "",
			   "species" => "NULL");
	return(%out);
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

#!/usr/bin/perl -w

# ncbi2table.pl
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
our $scriptname = "ncbi2table.pl";
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

# So it might not get out of scope...
our $tmpdir;

# Record progress...
my $date = &now;
disp("$date - Started...");
disp("Building the species and gene tables in KUPKB_Vis...");

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
if ($input =~ m/download/i) # Case where we download from FTP
{
	use Archive::Extract;
	use Net::FTP;

	my ($f,$ftp,$tmpzip,$ae,$ok);
	$ftp = Net::FTP->new("ftp.ncbi.nlm.nih.gov",Debug => 0) or die "\nCannot connect to FTP: $@","\n";
	$ftp->login("anonymous") or die "\nCannot login ",$ftp->message,"\n";
	$ftp->binary; # Saves a lot of trouble...

	$tmpdir = File::Temp->newdir();
	foreach $f (@{$phref->{"gene"}->{"DATA"}})
	{
		next if (ref($f) eq "HASH");
		disp("Getting file $f from NCBI FTP server...");
		$tmpzip = File::Spec->catfile($tmpdir,$f);
		$ftp->get("/gene/DATA/".$f,$tmpzip) or die "FTP get failed ",$ftp->message,"\n";
		disp("Uncompressing...");
		$ae = Archive::Extract->new(archive => $tmpzip);
		$ok = $ae->extract(to => $tmpdir) or die $ae->error,"\n";
	}
	foreach $f (@{$phref->{"gene"}->{"DATA"}[4]->{"GENE_INFO"}->{"Mammalia"}})
	{
		disp("Getting file $f from NCBI FTP server...");
		$tmpzip = File::Spec->catfile($tmpdir,$f);
		$ftp->get("/gene/DATA/GENE_INFO/Mammalia/".$f,$tmpzip) or die "FTP get failed ",$ftp->message,"\n";
		disp("Uncompressing...");
		$ae = Archive::Extract->new(archive => $tmpzip);
		$ok = $ae->extract(to => $tmpdir) or die $ae->error,"\n";
	}
	foreach $f (@{$phref->{"pub"}->{"taxonomy"}})
	{
		disp("Getting file $f from NCBI FTP server...");
		$tmpzip = File::Spec->catfile($tmpdir,$f);
		$ftp->get("/pub/taxonomy/".$f,$tmpzip) or die "FTP get failed ",$ftp->message,"\n";
		disp("Uncompressing...");
		$ae = Archive::Extract->new(archive => $tmpzip);
		$ok = $ae->extract(to => $tmpdir) or die $ae->error,"\n";
	}
	$ftp->quit;
	
	# Go to the next conditional, avoid repeating code for DB, split etc.
	$input = $tmpdir;
}

# In the case of input being a directory or having downloaded and passed to next argument
if (-d $input)
{
	# General variables
	my ($line,$sp_input,$g2a_input,$g2e_input,$g2g_input,$mam_input,$r2u_input);
	my ($sp_len,$g2a_len,$g2e_len,$g2g_len,$mam_len,$r2u_len);
	my $c = 0;
	my @columns;
	my (%spids,%fields);
	my @species = @{$phref->{"species"}};
	for (my $i=0; $i<@species; $i++) { $species[$i] = lc($species[$i]); }
	$sp_input = File::Spec->catfile($input,"names.dmp");
	$g2a_input = File::Spec->catfile($input,"gene2accession");
	$g2e_input = File::Spec->catfile($input,"gene2ensembl");
	$g2g_input = File::Spec->catfile($input,"gene2go");
	$mam_input = File::Spec->catfile($input,"All_Mammalia.gene_info");
	$r2u_input = File::Spec->catfile($input,"gene_refseq_uniprotkb_collab");

	# Waitbar stuff...
	if ($waitbar)
	{
		$sp_len = &countLines($sp_input);
		$g2a_len = &countLines($g2a_input);
		$g2e_len = &countLines($g2e_input);
		$g2g_len = &countLines($g2g_input);
		$mam_len = &countLines($mam_input);
		$r2u_len = &countLines($r2u_input);
	}
	
	# Deal with species first
	disp("Building Species table from file $sp_input...");
	disp("Requested species: ".join(", ",@species));
	&waitbarInit if ($waitbar);
	open(SPECIES,$sp_input);
	while ($line = <SPECIES>)
	{
		$c++;
		&waitbarUpdate($c,$sp_len) if ($waitbar);
		
		%fields = &initFields("species");
		$line =~ s/\t\|\r|\t\|\n$//g; # Slightly modified for this file...
		$line = lc($line);
		@columns = split(/\t\|\t/,$line);
		$columns[1] = &stripQuotes($columns[1]);
		if ($columns[1] ~~ @species && $columns[3] eq "scientific name")
		{
			$fields{"tax_id"} = $columns[0];
			$fields{"name"} = $columns[1];
			&insertSpecies(\%fields);
			$spids{$columns[0]} = 1;
		}
	}
	close(SPECIES);
	$c = 0;
	
	# Build genes table
	disp("Building Genes table from file $mam_input...");
	&waitbarInit if ($waitbar);
	open(GENES,$mam_input);
	while ($line = <GENES>)
	{
		$c++;
		&waitbarUpdate($c,$mam_len) if ($waitbar);

		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		next if (!$spids{$columns[0]}); # Skip if not in the requested species
		
		%fields = &initFields("genes");
		$fields{"entrez_id"} = $columns[1];
		$fields{"gene_symbol"} = $columns[2];
		$fields{"synonyms"} = $columns[4];
		$fields{"dbXrefs"} = $columns[5];
		$fields{"chromosome"} = $columns[6];
		$fields{"description"} = $columns[8];
		$fields{"species"} = $columns[0];
		&insertGene(\%fields);
	}
	close(GENES);
	$c = 0;

	# Build the entrez_to_ensembl table
	disp("Building Entrez to Ensembl table from file $g2e_input...");
	&waitbarInit if ($waitbar);
	open(GENE2ENS,$g2e_input);
	while ($line = <GENE2ENS>)
	{
		$c++;
		&waitbarUpdate($c,$g2e_len) if ($waitbar);

		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		next if (!$spids{$columns[0]}); # Skip if not in the requested species
		
		%fields = &initFields("entrez_to_ensembl");
		$fields{"entrez_id"} = $columns[1];
		$fields{"ensembl_gene"} = $columns[2];
		$fields{"ensembl_protein"} = $columns[6];
		$fields{"species"} = $columns[0];
		&insertE2E(\%fields);
	}
	close(GENE2ENS);
	$c = 0;

	# Build the entrez_to_go table
	disp("Building Entrez to GO table from file $g2g_input...");
	&waitbarInit if ($waitbar);
	open(GENE2GO,$g2g_input);
	while ($line = <GENE2GO>)
	{
		$c++;
		&waitbarUpdate($c,$g2g_len) if ($waitbar);

		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		next if (!$spids{$columns[0]}); # Skip if not in the requested species
		
		%fields = &initFields("entrez_to_go");
		$fields{"entrez_id"} = $columns[1];
		$fields{"go_id"} = $columns[2];
		$fields{"go_term"} = $columns[5];
		$fields{"pubmed"} = $columns[6];
		$fields{"category"} = $columns[7];
		$fields{"species"} = $columns[0];
		&insertE2G(\%fields);
	}
	close(GENE2GO);
	$c = 0;
	
	# Suck in refseq2uniprot file
	disp("Reading RefSeq to UniProt relations from file $r2u_input...");
	&waitbarInit if ($waitbar);
	my %ref2uni;
	open(REF2UNI,$r2u_input);
	while ($line = <REF2UNI>)
	{
		$c++;
		&waitbarUpdate($c,$r2u_len) if ($waitbar);
		
		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		push(@{$ref2uni{$columns[0]}},$columns[1]);
	}
	close(REF2UNI);
	$c = 0;

	# Read from gene2accession so as to create the relationships
	disp("Building EntrezID to UniProt table...");
	disp("Reading file $g2a_input...");
	&waitbarInit if ($waitbar);
	my %seen;
	open(GENE2ACC,$g2a_input);
	$line = <GENE2ACC>; # To oblivion because of comment...
	while ($line = <GENE2ACC>)
	{
		$c++;
		&waitbarUpdate($c,$g2a_len) if ($waitbar);

		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		next if (!$spids{$columns[0]}); # Skip if not in the requested species
		next if ($columns[5] eq "-"); # Skip if no corresponding RefSeq
		
		%fields = &initFields("entrez_to_uniprot");
		$columns[5] =~ s/\..*$//; # Remove version
		if ($ref2uni{$columns[5]})
		{
			foreach my $rec (@{$ref2uni{$columns[5]}})
			{
				$fields{"entrez_id"} = $columns[1];
				$fields{"uniprot_id"} = $rec;
				&insertE2U(\%fields) if (!$seen{$columns[1]."_".$rec});
				$seen{$columns[1]."_".$rec}++;
			}
		}
	}
	close(GENE2ACC);
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

sub insertSpecies
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"name"} = $conn->quote($fields{"name"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `species` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertE2U
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"uniprot_id"} = $conn->quote($fields{"uniprot_id"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `entrez_to_uniprot` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertE2E
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
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
	
	my $iq = "INSERT INTO `entrez_to_ensembl` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertE2G
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"go_id"} = $conn->quote($fields{"go_id"});
	$fields{"go_term"} = $conn->quote($fields{"go_term"});
	$fields{"pubmed"} = $conn->quote($fields{"pubmed"});
	$fields{"category"} = $conn->quote($fields{"category"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `entrez_to_go` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertGene
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"entrez_id"} = $conn->quote($fields{"entrez_id"});
	$fields{"gene_symbol"} = $conn->quote($fields{"gene_symbol"});
	$fields{"synonyms"} = $conn->quote($fields{"synonyms"});
	$fields{"dbXrefs"} = $conn->quote($fields{"dbXrefs"});
	$fields{"description"} = $conn->quote($fields{"description"});
	$fields{"chromosome"} = $conn->quote($fields{"chromosome"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `genes` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
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
	use Switch;

	my $type = shift @_;
	my %out;

	switch($type)
	{
		case /species/i
		{
			%out = ("tax_id" => "NULL",
					"name" => "");
		}
		case /genes/i
		{
			%out = ("entrez_id" => "NULL",
					"gene_symbol" => "",
					"synonyms" => "",
					"dbXrefs" => "",
					"chromosome" => "",
					"description" => "",
					"species" => "NULL");
		}
		case /entrez_to_uniprot/i
		{
			%out = ("entrez_id" => "NULL",
					"uniprot_id" => "");
		}
		case /entrez_to_ensembl/i
		{
			%out = ("entrez_id" => "NULL",
					"ensembl_gene" => "",
					"ensembl_protein" => "",
					"species" => "NULL");
		}
		case /entrez_to_go/i
		{
			%out = ("entrez_id" => "NULL",
					"go_id" => "",
					"go_term" => "",
					"pubmed" => "",
					"category" => "",
					"species" => "NULL");
		}
	}
	
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
	my $totlines=0;
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
Create the species, genes and entrez_to_uniprot tables of KUPKB_Vis database.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --input dir/flag --param parameter_file.yml [OPTIONS]

--- Required ---
  --input|i		dir/flag	Program input. It can be the word download
			to build everything fetching files in real time or a path
			containing the necessary inputs (for the adventurous only!)
			which can be seen in the YAML parameters file.
  --dbdata|d		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.
--- Optional ---
  --param|p		A YAML parameters file containing FTP locations, species
			and other information (see the example).
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --waitbar|w		Display a waitbar for long operations.
  --help|h		Display this help text.
	
This program builds the species and genes tables in the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

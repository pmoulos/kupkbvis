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

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "visdbBuild.pl";
our $paramfile;  # YAML parameters file including file locations etc.
our @dbdata;	 # Username and password for the DB to avoid hardcoding
our $silent = 0; # Display verbose messages
our $waitbar;    # Use the waitbar feature of sub-scripts?
our $help = 0;   # Help?

# This script must be run as root in order to effectively create the index
die "\n\nYou must run this script as root or sudoer!\n\n" if ($> != 0);

# Check for the presence of required modules
&tryModule("YAML");
# Check inputs
&checkInputs;

# Record progress...
my $date = &now;
disp("$date - Started...");
disp("Building the KUPKB_Vis database...");

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

my ($schemaOK,$ncbiOK,$stringOK,$descriptionOK,$datasetOK,$keggOK,$mirnaOK,$indexOK,$daemonOK);
$schemaOK = $ncbiOK = $stringOK = $descriptionOK = $datasetOK = $keggOK = $mirnaOK = $indexOK = $daemonOK = -1;

# Do the job... -create the schema first
$schemaOK = system("perl createSchema.pl --dbdata $dbdata[0] $dbdata[1]");
disp("================================================================================\n");
# Build the sub-background knowledge
if ($schemaOK==0)
{
	$ncbiOK = system("perl ncbi2table.pl --input $phref->{\"GENE_PATH\"} --param $paramfile --dbdata $dbdata[0] $dbdata[1] --waitbar $waitbar");
	disp("================================================================================\n");
}
if ($ncbiOK==0)
{
	$stringOK = system("perl string2table.pl --input $phref->{\"INTERACTION_PATH\"} --dbdata $dbdata[0] $dbdata[1] --waitbar $waitbar");
	disp("================================================================================\n");
}
# Build the data tables
if ($stringOK==0)
{
	$descriptionOK = system("perl data2table.pl --input $phref->{\"DESCRIPTION\"} --mode description --dbdata $dbdata[0] $dbdata[1] --curators $phref->{\"CURATORS\"}");
	disp("================================================================================\n");
}
if ($descriptionOK==0)
{
	$datasetOK = system("perl data2table.pl --input $phref->{\"DATA\"} --mode dataset --dbdata $dbdata[0] $dbdata[1] --type excel");
	disp("================================================================================\n");
}
# Build the KEGG tables
if ($datasetOK==0)
{
	$keggOK = system("perl kegg2table.pl --param $paramfile --dbdata $dbdata[0] $dbdata[1]");
	disp("================================================================================\n");
}
# Build the miRNA tables
if ($keggOK==0)
{
	$mirnaOK = system("perl mirna2table.pl --input $phref->{\"MIRNA_PATH\"} --param $paramfile --dbdata $dbdata[0] $dbdata[1]");
	disp("================================================================================\n");
}
# Finally, build the index and relaunch the search daemon
if ($mirnaOK==0)
{
	if (!-e $phref->{"INDEX_PATH"}) { &createIndexConf($phref->{"INDEX_PATH"}); }
	$indexOK = system("/usr/local/bin/indexer --config $phref->{\"INDEX_PATH\"} --all");
	if ($indexOK==0)
	{
		$daemonOK = system("/usr/bin/searchd --stop");
		if ($daemonOK==0) # Daemon was running, let's restart it with new index file
		{
			$daemonOK = system("/usr/bin/searchd -c $phref->{\"INDEX_PATH\"}");
		}
		else # Error, daemon was not running, start it anyway
		{
			$daemonOK = system("/usr/bin/searchd -c $phref->{\"INDEX_PATH\"}");
		}
	}
	disp("================================================================================\n");
}
$date = &now;
($datasetOK==0 && $indexOK==0 && $daemonOK==0) ? (disp("$date - Finished!\n\n")) : (disp("$date - Error occurred!\n\n")) ;


# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("param|p=s" => \$paramfile,
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
			 "MIRNA_PATH" => "download",
			 "INDEX_PATH" => "/etc/sphinxsearch/kupkbvis_sphinx.conf",
			 "CURATORS" => "/media/HD5/Work/TestGround/contr_emails.txt"
		);
	return(\%h);
}

sub createIndexConf
{
	my $confile = $_;
	open(CONF,">$confile");
	my $conf =
	"source kupkbvis_entrez\n".
	"{\n".
	"\ttype = mysql\n".
	"\tsql_host = localhost\n".
	"\tsql_user = $dbdata[0]\n".
	"\tsql_pass = $dbdata[1]\n".
	"\tsql_db = KUPKB_Vis\n".
	"\tsql_port = 3306\n".
	"\tsql_sock = /var/run/mysqld/mysqld.sock\n".
	"\tmysql_connect_flags\t= 32\n".
	"\tsql_query = \\\n".
	"\t\tSELECT entrez_id, \\\n".
	"\t\t\tCONVERT(entrez_id,CHAR(16)) AS entrez_str, \\\n".
	"\t\t\tgene_symbol, description, species.tax_id AS species \\\n".
	"\t\tFROM genes INNER JOIN species \\\n".
	"\t\tON genes.species=species.tax_id\n".
	"\tsql_attr_uint = species\n".
	"\tsql_query_info = \\\n".
	"\t\tSELECT entrez_id, gene_symbol, description, species.name AS name \\\n".
	"\t\tFROM genes INNER JOIN species ON genes.species=species.tax_id \\\n".
	"\t\tWHERE entrez_id=\$id\n".
	"}\n\n".
	"source kupkbvis_ensembl\n".
	"{\n".
	"\ttype = mysql\n".
	"\tsql_host = localhost\n".
	"\tsql_user = $dbdata[0]\n".
	"\tsql_pass = $dbdata[1]\n".
	"\tsql_db = KUPKB_Vis\n".
	"\tsql_port = 3306\n".
	"\tsql_sock = /var/run/mysqld/mysqld.sock\n".
	"\tmysql_connect_flags\t= 32\n".
	"\tsql_query = \\\n".
	"\t\tSELECT id, \\\n".
	"\t\t\tCONVERT(entrez_id,CHAR(16)) AS entrez_str, \\\n".
	"\t\t\tensembl_gene, ensembl_protein, species \\\n".
	"\t\tFROM entrez_to_ensembl\n".
	"\tsql_attr_uint = species\n".
	"\tsql_query_info = \\\n".
	"\t\tSELECT * FROM entrez_to_ensembl WHERE id=\$id\n".
	"}\n\n".
	"source kupkbvis_mirna\n".
	"{\n".
	"\ttype = mysql\n".
	"\tsql_host = localhost\n".
	"\tsql_user = $dbdata[0]\n".
	"\tsql_pass = $dbdata[1]\n".
	"\tsql_db = KUPKB_Vis\n".
	"\tsql_port = 3306\n".
	"\tsql_sock = /var/run/mysqld/mysqld.sock\n".
	"\tmysql_connect_flags\t= 32\n".
	"\tsql_query = \\\n".
	"\t\tSELECT id, \\\n".
	"\t\t\tmirna_id, species.name AS name \\\n".
	"\t\tFROM mirna_to_ensembl INNER JOIN species \n".
	"\t\tGROUP BY mirna_id ORDER BY id\n".
	"\tsql_attr_uint = species\n".
	"\tsql_query_info = \\\n".
	"\t\tSELECT mirna_id, species FROM mirna_to_ensembl ON mirna_to_ensembl.species=species.tax_id \\\n".
	"\t\tWHERE mirna_to_ensembl.id=\$id\n".
	"}\n\n".
	"source kupkbvis_uniprot\n".
	"{\n".
	"\ttype = mysql\n".
	"\tsql_host = localhost\n".
	"\tsql_user = $dbdata[0]\n".
	"\tsql_pass = $dbdata[1]\n".
	"\tsql_db = KUPKB_Vis\n".
	"\tsql_port = 3306\n".
	"\tsql_sock = /var/run/mysqld/mysqld.sock\n".
	"\tmysql_connect_flags\t= 32\n".
	"\tsql_query = \\\n".
	"\t\tSELECT id, \\\n".
	"\t\t\tCONVERT(entrez_id,CHAR(16)) AS entrez_str, uniprot_id \\\n".
	"\t\tFROM entrez_to_uniprot\n".
	"\tsql_query_info = \\\n".
	"\t\tSELECT * FROM entrez_to_uniprot WHERE id=\$id\n".
	"}\n\n".
	"index kupkbvis_entrez\n".
	"{\n".
	"\tsource = kupkbvis_entrez\n".
	"\tpath = /media/HD2/mysql/sphinx_index/kupkbvis_entrez\n".
	"\tdocinfo = extern\n".
	"\tmlock = 0\n".
	"\tmorphology = stem_en\n".
	"\tmin_stemming_len = 2\n".
	"\tmin_word_len = 2\n".
	"\tmin_prefix_len = 0\n".
	"\tmin_infix_len = 3\n".
	"\tcharset_type = sbcs\n".
	"\tenable_star = 1\n".
	"\thtml_strip = 0\n".
	"}\n\n".
	"index kupkbvis_ensembl\n".
	"{\n".
	"\tsource = kupkbvis_ensembl\n".
	"\tpath = /media/HD2/mysql/sphinx_index/kupkbvis_ensembl\n".
	"\tdocinfo = extern\n".
	"\tmlock = 0\n".
	"\tmorphology = stem_en\n".
	"\tmin_stemming_len = 3\n".
	"\tmin_word_len = 3\n".
	"\tmin_prefix_len = 0\n".
	"\tmin_infix_len = 5\n".
	"\tcharset_type = sbcs\n".
	"\tenable_star = 1\n".
	"\thtml_strip = 0\n".
	"}\n\n".
	"index kupkbvis_mirna\n".
	"{\n".
	"\tsource = kupkbvis_mirna\n".
	"\tpath = /media/HD2/mysql/sphinx_index/kupkbvis_mirna\n".
	"\tdocinfo = extern\n".
	"\tmlock = 0\n".
	"\tmorphology = stem_en\n".
	"\tmin_stemming_len = 3\n".
	"\tmin_word_len = 3\n".
	"\tmin_prefix_len = 0\n".
	"\tmin_infix_len = 4\n".
	"\tcharset_type = sbcs\n".
	"\tenable_star = 1\n".
	"\thtml_strip = 0\n".
	"}\n\n".
	"index kupkbvis_uniprot\n".
	"{\n".
	"\tsource = kupkbvis_uniprot\n".
	"\tpath = /media/HD2/mysql/sphinx_index/kupkbvis_uniprot\n".
	"\tdocinfo = extern\n".
	"\tmlock = 0\n".
	"\tmorphology = stem_en\n".
	"\tmin_stemming_len = 2\n".
	"\tmin_word_len = 2\n".
	"\tmin_prefix_len = 0\n".
	"\tmin_infix_len = 3\n".
	"\tcharset_type = sbcs\n".
	"\tenable_star = 1\n".
	"\thtml_strip = 0\n".
	"}\n\n".
	"indexer\n".
	"{\n".
	"\tmem_limit = 1024M\n".
	"\tmax_iops = 256\n".
	"}\n\n".
	"searchd\n".
	"{\n".
	"\tlog = /media/HD2/mysql/sphinx_index/searchd.log\n".
	"\tquery_log = /var/log/sphinxsearch/query.log\n".
	"\tlisten = 60000\n".
	"\tpid_file = /var/run/searchd.pid\n".
	"}\n";
	print CONF $conf;
	close(CONF);
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
	
This program wraps the rest building scripts and builds the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

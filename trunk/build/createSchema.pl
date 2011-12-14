#!/usr/bin/perl -w

# prepareLocalHMDB.pl
# A Perl script to create the MySQL schema for KUPKB_Vis
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 14 - 11 - 2011 (dd - mm - yyyy)
# Last Update : XX - XX - XXXX (dd - mm - yyyy)
# Version     : 1.0

use strict;
use Getopt::Long;
use DBI;

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "createSchema.pl";
our @dbdata;	  # Username and password for the DB to avoid hardcoding
our $silent = 0;  # Display verbose messages
our $help = 0;    # Help?

# Check inputs
&checkInputs;

# Do the job
disp("Creating KUPKB_Vis schema...");
&createDB();
disp("KUPKB_Vis schema created!\n");


# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("dbdata|d=s{,}" => \@dbdata,
    		   "silent|s" => \$silent,
    		   "help|h" => \$help);
    # Check if the required arguments are set
    if ($help)
    {
    	&programUsage;
    	exit;
    }
    $stop .= "--- --dbdata should be consisted of two strings! ---\n"
		if (@dbdata && $#dbdata+1 != 2);
    if ($stop)
    {
            print "\n$stop\n";
            print "Type perl $scriptname --help for help in usage.\n\n";
            exit;
    }
}

sub createDB
{
	my $crq = "CREATE DATABASE `KUPKB_Vis` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;";
	my $drq = "DROP DATABASE `KUPKB_Vis`";
	my $conn = DBI->connect("dbi:mysql:;host=localhost;port=3306",$dbdata[0],$dbdata[1]);
	
	if (&checkExistence("KUPKB_Vis")) # Drop if already exists
	{
		$conn->do($drq);
		$conn->do($crq);
	}
	else { $conn->do($crq); }
	&closeConnection($conn);
	$conn = undef;

	# Create the tables now
	$conn = &openConnection();

	my $st_cq = "CREATE TABLE `species` (
				`tax_id` INT(10) UNSIGNED NOT NULL,
				`name` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
				PRIMARY KEY (`tax_id`)
				) ENGINE = INNODB;";

	my $dd_cq = "CREATE TABLE `dataset_descriptions` (
				`experiment_name` VARCHAR(200) NOT NULL,
				`display_name` VARCHAR(200) NULL,
				`external_link` VARCHAR(200) NULL,
				`pubmed_id` INT(10) UNSIGNED NULL,
				`title` TEXT NULL ,
				`journal` VARCHAR(200) NULL,
				`date_added` DATE NULL,
				`curators` VARCHAR(200) NULL,
				`curators_contact` VARCHAR(200) NULL,
				`experiment_name_original_case` VARCHAR(200) NOT NULL,
				PRIMARY KEY (`experiment_name`)
				) ENGINE = INNODB;";
	
	my $gt_cq = "CREATE TABLE `genes` (
				`entrez_id` INT(16) UNSIGNED NOT NULL,
				`gene_symbol` VARCHAR(32) NULL,
				`synonyms` VARCHAR(200) NULL,
				`dbXrefs` VARCHAR(200) NULL,
				`chromosome` VARCHAR(16) NULL,
				`description` VARCHAR(400) NULL,
				`species` INT(10) UNSIGNED NOT NULL,
				PRIMARY KEY (`entrez_id`),
				FOREIGN KEY (`species`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";

	my $ia_cq = "CREATE TABLE `interactions` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`source` VARCHAR(32) NOT NULL,
				`interaction` VARCHAR(32) NOT NULL,
				`target` VARCHAR(32) NOT NULL,
				`species` INT(10) UNSIGNED NOT NULL,
				FOREIGN KEY (`species`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT,
				INDEX `source` (`source`),
				INDEX `target` (`target`)
				) ENGINE = INNODB;";

	my $ds_cq = "CREATE TABLE `datasets` (
				`experiment_id` VARCHAR(200) NOT NULL,
				`compound_list` VARCHAR(32) NOT NULL,
				`experiment_assay` VARCHAR(200) NULL,
				`preanalytical_technique` VARCHAR(200) NULL,
				`experiment_analysis` VARCHAR(200) NULL,
				`pmid` INT(10) UNSIGNED NULL,
				`external_link` VARCHAR(200) NULL,
				`geo_acc` VARCHAR(64) NULL,
				`role_0` VARCHAR(32) NULL,
				`experiment_condition_0` VARCHAR(64) NULL,
				`species_0` VARCHAR(64) NULL,
				`biomaterial_0` VARCHAR(64) NULL,
				`maturity_0` VARCHAR(64) NULL,
				`disease_0` VARCHAR(200) NULL,
				`laterality_0` VARCHAR(64) NULL,
				`severity_0` VARCHAR(64) NULL,
				`role_1` VARCHAR(32) NULL,
				`experiment_condition_1` VARCHAR(64) NULL,
				`species_1` VARCHAR(64) NULL,
				`biomaterial_1` VARCHAR(64) NULL,
				`maturity_1` VARCHAR(64) NULL,
				`disease_1` VARCHAR(200) NULL,
				`laterality_1` VARCHAR(64) NULL,
				`severity_1` VARCHAR(64) NULL,
				`experiment_description` TEXT NULL,
				PRIMARY KEY (`experiment_id`)
				) ENGINE = INNODB;";

	my $dt_cq = "CREATE TABLE `data` (
				`record_id` VARCHAR(21) NOT NULL,
				`dataset_id` VARCHAR(200) NOT NULL,
				`gene_symbol` VARCHAR(32) NULL,
				`entrez_gene_id` INT(16) NULL,
				`uniprot_id` VARCHAR(16) NULL,
				`hmdb_id` VARCHAR(9) NULL,
				`microcosm_id` VARCHAR(32) NULL,
				`expression_strength` VARCHAR(16) NULL,
				`differential_expression_analyte_control` VARCHAR(16) NULL,
				`ratio` DOUBLE(16,5) NULL,
				`pvalue` DOUBLE(12,8) NULL,
				`fdr` DOUBLE NULL,
				PRIMARY KEY (`record_id`),
				FOREIGN KEY (`dataset_id`) REFERENCES datasets(`experiment_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";
				
	my $eu_cq = "CREATE TABLE `entrez_to_uniprot` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`entrez_id` INT(16) UNSIGNED NOT NULL,
				`uniprot_id` VARCHAR(16) NULL,
				INDEX `entrez_id` (`entrez_id`)
				) ENGINE = INNODB;";
				
	my $ee_cq = "CREATE TABLE `entrez_to_ensembl` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`entrez_id` INT(16) UNSIGNED NOT NULL,
				`ensembl_gene` VARCHAR(32) NULL,
				`ensembl_protein` VARCHAR(32) NULL,
				`species` INT(10) UNSIGNED NOT NULL,
				FOREIGN KEY (`species`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";

	my $eg_cq = "CREATE TABLE `entrez_to_go` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`entrez_id` INT(16) UNSIGNED NOT NULL,
				`go_id` VARCHAR(10) NOT NULL,
				`go_term` VARCHAR(200) NULL,
				`pubmed` VARCHAR(200) NULL,
				`category` VARCHAR(10) NULL,
				`species` INT(10) UNSIGNED NOT NULL,
				FOREIGN KEY (`species`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";

	my $ng_cq = "CREATE TABLE `ncbitax_to_keggtax` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`ncbi_tax_id` INT(10) UNSIGNED NOT NULL,
				`kegg_tax_id` VARCHAR(10) NOT NULL,
				`kegg_tax_code` VARCHAR(3) NOT NULL,
				`kegg_tax_name` VARCHAR(200) NOT NULL,
				INDEX `kegg_tax_code` (`kegg_tax_code`),
				FOREIGN KEY (`ncbi_tax_id`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";

	my $ke_cq = "CREATE TABLE `kegg_pathways` (
				`pathway_id` VARCHAR(16) NOT NULL PRIMARY KEY,
				`name` VARCHAR(200) NULL,
				`class` VARCHAR(200) NULL,
				`organism` VARCHAR(3) NOT NULL,
				FOREIGN KEY (`organism`) REFERENCES ncbitax_to_keggtax(`kegg_tax_code`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";

	my $pm_cq = "CREATE TABLE `pathway_members` (
				`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				`pathway_id` VARCHAR(16) NULL,
				`kegg_member` VARCHAR(16) NOT NULL,
				`entrez_member` INT(16) UNSIGNED NOT NULL,
				`species` INT(10) UNSIGNED NOT NULL,
				FOREIGN KEY (`species`) REFERENCES species(`tax_id`)
				ON DELETE RESTRICT ON UPDATE RESTRICT
				) ENGINE = INNODB;";
			
	$conn->do($st_cq);
	$conn->do($dd_cq);
	$conn->do($gt_cq);
	$conn->do($ia_cq);
	$conn->do($ds_cq);
	$conn->do($dt_cq);
	$conn->do($eu_cq);
	$conn->do($ee_cq);
	$conn->do($eg_cq);
	$conn->do($ng_cq);
	$conn->do($ke_cq);
	$conn->do($pm_cq);
	
	&closeConnection($conn);
}

sub checkExistence
{
	my $dbcheck = shift @_;
	my $out = 1;
	
	my $conn = DBI->connect("dbi:mysql:database=information_schema;host=localhost;port=3306",$dbdata[0],$dbdata[1]);
	my $query = "SELECT `SCHEMA_NAME` FROM `SCHEMATA` WHERE `SCHEMA_NAME` = \"$dbcheck\"";
	my $sth = $conn->prepare($query);
	$sth->execute();
	$out = 0 if (!$sth->rows());
	$sth->finish();
	&closeConnection($conn);
	
	return($out);
}

sub openConnection
{   
    my $hostname = "localhost";
    my $database = "KUPKB_Vis";
    
    my $conn = DBI->connect("dbi:mysql:database=$database;host=$hostname;port=3306",$dbdata[0],$dbdata[1]);
    
    return $conn;
}

sub closeConnection
{ 
    my $conn = shift @_;
    $conn->disconnect();
}

sub disp
{
	print "\n@_" if (!$silent);
}

sub programUsage 
{
	# The look sucks here but it is actually good in the command line
	my $usagetext = << "END";
	
$scriptname
Create the KUPKB_Vis database schema.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --dbdata username password [OPTIONS]

--- Required ---
  --dbdata|b		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.
--- Optional ---
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --help|h		Display this help text.
	
The main output of the program is a database or split metabocards.

END
	print $usagetext;
	exit;
}

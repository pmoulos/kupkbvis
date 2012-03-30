#!/usr/bin/perl -w

# dbIndexBuild.pl
# A Perl script to create table indexes in the KUPKB_Vis database
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 29 - 03 - 2012 (dd - mm - yyyy)
# Last Update : XX - XX - XXXX (dd - mm - yyyy)
# Version     : 1.0

use strict;
use Getopt::Long;
use DBI;

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "dbIndexBuild.pl";
our @dbdata;	 # Database name, username and password for the DB to avoid hardcoding
our $silent = 0; # Display verbose messages
our $help = 0;   # Help?

# Check inputs
&checkInputs;

# Record progress...
my $date = &now;
disp("$date - Started...");
disp("Adding table indexes in $dbdata[0]...");
my $conn = &openConnection(@dbdata);

my @iq;
$iq[0] = "ALTER TABLE `genes` ADD INDEX `gene_symbol` (`gene_symbol`)";
$iq[1] = "ALTER TABLE `interactions` ADD INDEX `source` (`source`)";
$iq[2] = "ALTER TABLE `interactions` ADD INDEX `target` (`target`)";
$iq[3] = "ALTER TABLE `data` ADD INDEX `entrez_gene_id` (`entrez_gene_id`)";
$iq[4] = "ALTER TABLE `data` ADD INDEX `uniprot_id` (`uniprot_id`)";
$iq[5] = "ALTER TABLE `entrez_to_uniprot` ADD INDEX `entrez_id` (`entrez_id`)";
$iq[6] = "ALTER TABLE `mirna_to_ensembl` ADD INDEX `mirna_id` (`mirna_id`)";
#$iq[7] = "ALTER TABLE `ncbitax_to_keggtax` ADD INDEX `kegg_tax_code` (`kegg_tax_code`)";
foreach my $q (@iq)
{
	$conn->do($q);
}

&closeConnection($conn);
$date = &now;
disp("$date - Finished!\n");


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
    $stop .= "--- Please provide database connection data ---\n" if (!@dbdata);
    $stop .= "--- --dbdata should be consisted of three strings! ---\n"
		if (@dbdata && $#dbdata+1 != 3);
    if ($stop)
    {
            print "\n$stop\n";
            print "Type perl $scriptname --help for help in usage.\n\n";
            exit;
    }
}

sub openConnection
{
    use DBI;
    
    my ($database,$username,$password) = @_;
    my $hostname = "localhost";
    
    my $conn = DBI->connect("dbi:mysql:database=$database;host=$hostname;port=3306",$username,$password);
    
    return $conn;
}

sub closeConnection
{
    use DBI;
    
    my $conn = shift @_;
    $conn->disconnect;
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

sub programUsage 
{
	# The look sucks here but it is actually good in the command line
	my $usagetext = << "END";
	
$scriptname
Create the indexes in KUPKB_Vis database tables.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --input dir/flag [OPTIONS]

--- Required ---
  --dbdata|d		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.			
--- Optional ---
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --help|h		Display this help text.
	
This program builds the table indexes in the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

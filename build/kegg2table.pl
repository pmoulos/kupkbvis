#!/usr/bin/perl -w

# kegg2table.pl
# A Perl script to construct the kegg_to_entrez table in the KUPKB_Vis database
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 21 - 11 - 2011 (dd - mm - yyyy)
# Last Update : 18 - 09 - 2013 (dd - mm - yyyy)
# Version     : 1.1

use strict;
use Getopt::Long;
use File::Temp;
use LWP;
use POSIX qw(floor
 			 ceil);
 			 
# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "kegg2table.pl";
our $paramfile;   # YAML parameters file
our @dbdata;	  # Database name, username and password for the DB to avoid hardcoding
our $ref;		  # Import reference pathways too?
our $silent = 0;  # Display verbose messages
our $help = 0;    # Help?

# Check for the presence of YAML, required!!!
&tryModule("YAML");
&tryModule("URI");

# Check inputs
&checkInputs;

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

my $date = &now;
disp("$date - Started...");

my @organisms = @{$phref->{"species"}};
my ($i,$j,$m,$n,$pid,$truncpid,$truncdef,$pnumber,$cuge,$pathways,$genes,$tmpfh,$tmpfhg,$line);
my (@columns,@nc2kgdata);
my (%nc2kg_fields,%path_fields,%member_fields);
my %refhash;

disp("Building the NCBI to KEGG taxonomy, KEGG pathways and memberships tables...");
my $tmpdir = File::Temp->newdir();
my $ua = LWP::UserAgent->new;
my ($request,$response);

disp("Retrieving reference pathways...");
%nc2kg_fields = &initFields("ncbitax_to_keggtax");
$nc2kg_fields{"ncbi_tax_id"} = 999999;
$nc2kg_fields{"kegg_tax_id"} = "genome:T01";
$nc2kg_fields{"kegg_tax_code"} = "map";
$nc2kg_fields{"kegg_tax_name"} = "Reference";
&insertMap(\%nc2kg_fields);

$pathways = "http://rest.kegg.jp/list/pathway";
$request = HTTP::Request->new("POST",$pathways,HTTP::Headers->new());
$tmpfh = File::Temp->new(DIR => $tmpdir,SUFFIX => ".kegg");
$ua->request($request,sub {   
	my ($data,$response) = @_;
	if ($response->is_success) {
		print $tmpfh "$data";
	}
	else {
		warn ("Problems with the web server: ".$response->status_line);
	}
},1000);
seek($tmpfh,0,SEEK_SET);
while ($line = <$tmpfh>)
{
	$line =~ s/\r|\n$//g;
	@columns = split(/\t/,$line);
	%path_fields = &initFields("kegg_pathways");
	$truncpid = $pid = $columns[0];
	$truncpid =~ s/path://;
	$path_fields{"pathway_id"} = $truncpid;
	$pnumber = $truncpid;
	$pnumber =~ s/map//;
	$truncdef = $columns[1];
	$truncdef =~ s/(\s*\-\s*)([A-Za-z0-9]*\s*)*\(([A-Za-z0-9]*\s*)*\)//;
	$path_fields{"name"} = $truncdef;
	$path_fields{"class"} = getClassFromPathway($columns[0]);
	$path_fields{"organism"} = "map";
	disp("Inserting $truncpid to KEGG pathways table...");
	&insertPathway(\%path_fields);
	$refhash{$pnumber} = ();
}
close($tmpfh);

foreach my $org (@organisms)
{
	disp("Retrieving general data for $org...");
	@nc2kgdata = getTaxDataFromOrganism($org);

	if($nc2kgdata[0]) # If empty DO NOT continue, will crash the whole thing...
	{
		%nc2kg_fields = &initFields("ncbitax_to_keggtax");
		$nc2kg_fields{"ncbi_tax_id"} = $nc2kgdata[2];
		$nc2kg_fields{"kegg_tax_id"} = $nc2kgdata[0];
		$nc2kg_fields{"kegg_tax_code"} = $nc2kgdata[1];
		$nc2kg_fields{"kegg_tax_name"} = $nc2kgdata[3];
		disp("Inserting $org to NCBI to KEGG taxonomy table...");
		&insertMap(\%nc2kg_fields);

		disp("Retrieving pathways for $org...");
		$pathways = "http://rest.kegg.jp/list/pathway/".$nc2kg_fields{"kegg_tax_code"};
		$request = HTTP::Request->new("POST",$pathways,HTTP::Headers->new());
		$tmpfh = File::Temp->new(DIR => $tmpdir,SUFFIX => ".kegg");
		$ua->request($request,sub {   
			my ($data,$response) = @_;
			if ($response->is_success) {
				print $tmpfh "$data";
			}
			else {
				warn ("Problems with the web server: ".$response->status_line);
			}
		},1000);
		seek($tmpfh,0,SEEK_SET);
		while ($line = <$tmpfh>)
		{
			$line =~ s/\r|\n$//g;
			@columns = split(/\t/,$line);
			%path_fields = &initFields("kegg_pathways");
			$truncpid = $pid = $columns[0];
			$truncpid =~ s/path://;
			$path_fields{"pathway_id"} = $truncpid;
			$truncdef = $columns[1];
			$truncdef =~ s/(\s*\-\s*)([A-Za-z0-9]*\s*)*\(([A-Za-z0-9]*\s*)*\)//;
			$path_fields{"name"} = $truncdef;
			$path_fields{"class"} = getClassFromPathway($columns[0]);
			$path_fields{"organism"} = $nc2kg_fields{"kegg_tax_code"};
			$pnumber = $truncpid;
			$pnumber =~ s/$nc2kg_fields{"kegg_tax_code"}//;
			push(@{$refhash{$pnumber}},$truncpid) if (exists($refhash{$pnumber}));
			&insertPathway(\%path_fields);

			disp("Inserting genes in $pid in pathway members table...");
			# REST may fail... We need to repeat the request until it is successful...
			# For the time being, the most error prone process is the genes retrieval for
			# the large(?) number of pathwats for each organism...
			my $gotit = 0;
			my $giveup = 10;
			my $tries = 1;
			my $uri;
			while (!$gotit && $tries<=$giveup)
			{
				$uri = "http://rest.kegg.jp/link/genes/$truncpid";
				$request = HTTP::Request->new("POST",$uri,HTTP::Headers->new());
				$tmpfhg = File::Temp->new(DIR => $tmpdir,SUFFIX => ".genes.kegg");
				$ua->request($request,sub {
					my ($genes,$response) = @_;
					if ($response->is_success) {
						$gotit = 1;
						print $tmpfhg "$genes";
					}
					else {
						warn ("Problems with the web server: ".$response->status_line);
						disp("--- Failed to get data for $truncpid! Retry $tries out of $giveup...");
						$tries++;
						$gotit = 0;
					}
				},1000);
			}

			if ($gotit)
			{
				seek($tmpfhg,0,SEEK_SET);
				while (my $geneline = <$tmpfhg>)
				{
					$geneline =~ s/\r|\n$//g;
					@columns = split(/\t/,$geneline);
					%member_fields = &initFields("pathway_members");
					$member_fields{"pathway_id"} = $path_fields{"pathway_id"};
					$cuge = $columns[1];
					if ($cuge =~ m/$nc2kg_fields{"kegg_tax_code"}/) # They are not consistent! :@
					{
						$member_fields{"kegg_member"} = $cuge;
						$cuge =~ s/$nc2kg_fields{"kegg_tax_code"}://;
						$member_fields{"entrez_member"} = $cuge;
					}
					else
					{
						$member_fields{"kegg_member"} = $nc2kg_fields{"kegg_tax_code"}.":".$cuge;
						$member_fields{"entrez_member"} = $cuge;
					}
					$member_fields{"species"} = $nc2kg_fields{"ncbi_tax_id"};
					# The are some tRNA and RNA genes which do not have an Entrez ID...
					&insertMember(\%member_fields) if ($member_fields{"entrez_member"} !~ m/[a-z]/i);
				}
			}
			else { &deathByREST; }
			close($tmpfhg)
		}
		close($tmpfh);
	}
	else { disp("Nothing found for $org! Moving to next organism..."); }
}

disp("Mapping organism pathways to reference pathways...");
&buildReferenceMap(\%refhash);

if ($ref) {} # NYI, we have to figure out what may happen with the foreign keys...

$date = &now;
disp("$date - Finished!\n");

sub getTaxDataFromOrganism
{
	my $query = $_[0];
	my ($uri,$str);
	my $gotit = 0;
	my $giveup = 10;
	my $tries = 1;
	my $ua = LWP::UserAgent->new;
	my ($request,$response);
	my (@firstpart,@secondpart);
	
	while (!$gotit && $tries<=$giveup)
	{
		$uri = "http://rest.kegg.jp/find/genome/$query";
		$request = HTTP::Request->new("POST",$uri,HTTP::Headers->new());
		$ua->request($request,sub {
			my ($str,$response) = @_;
			if ($response->is_success) {
				$gotit = 1;
				return 0 if (!$str);
				my @result = split(", ",$str);
				@firstpart = split(" ",$result[0]);
				@secondpart = split("; ",$result[2]);
				$secondpart[1] =~ s/\r|\n$//g; # There is a new line...
			}
			else {
				warn ("Problems with the web server: ".$response->status_line);
				disp("--- Failed to get data for $query! Retry $tries out of $giveup...");
				$tries++;
				$gotit = 0;
			}
		},1024);
	}
	&deathByREST if (!$gotit);
	return (@firstpart,@secondpart);
}

sub getClassFromPathway
{
	my $entry = shift @_;
	my ($uri,$str,$spos,$epos,$class);
	my $gotit = 0;
	my $giveup = 10;
	my $tries = 1;
	my $ua = LWP::UserAgent->new;
	my ($request,$response);
	
	while (!$gotit && $tries<=$giveup)
	{
		$uri = "http://rest.kegg.jp/get/$entry";
		$request = HTTP::Request->new("POST",$uri,HTTP::Headers->new());
		$ua->request($request,sub {   
			my ($str,$response) = @_;
			if ($response->is_success) {
				$gotit = 1;
				$spos = index($str,"CLASS");
				$class = "-";
				if ($spos != -1) {
					$epos = index($str,"\n",$spos);
					$class = substr($str,$spos+5,$epos-$spos-5);
					$class =~ s/^\s+//;
					$class =~ s/\s+$//;
				}
			}
			else {
				warn ("Problems with the web server: ".$response->status_line);
				disp("--- Failed to get data for $entry! Retry $tries out of $giveup...");
				$tries++;
				$gotit = 0;
			}
		},8192);
	}
	&deathByREST if (!$gotit);
	return($class);
}

# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("param|p=s" => \$paramfile,
    		   "dbdata|d=s{,}" => \@dbdata,
    		   "reference|r" => \$ref,
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
    disp("Parameter file not given... Will try to load defaults...") if (!$paramfile);
}

sub insertMap
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"kegg_tax_id"} = $conn->quote($fields{"kegg_tax_id"});
	$fields{"kegg_tax_code"} = $conn->quote($fields{"kegg_tax_code"});
	$fields{"kegg_tax_name"} = $conn->quote($fields{"kegg_tax_name"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `ncbitax_to_keggtax` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	#disp($iq);
	
	&closeConnection($conn);
}

sub insertPathway
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"pathway_id"} = $conn->quote($fields{"pathway_id"});
	$fields{"name"} = $conn->quote($fields{"name"});
	$fields{"class"} = $conn->quote($fields{"class"});
	$fields{"organism"} = $conn->quote($fields{"organism"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `kegg_pathways` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	#disp($iq);
	
	&closeConnection($conn);
}

sub insertMember
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"pathway_id"} = $conn->quote($fields{"pathway_id"});
	$fields{"kegg_member"} = $conn->quote($fields{"kegg_member"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `pathway_members` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	#disp($iq);
	
	&closeConnection($conn);
}

sub buildReferenceMap
{
	my %hash = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my ($key,$map,$way,$iq);

	foreach $key (keys(%hash))
	{
		$map = "map".$key;
		$map = $conn->quote($map);
		foreach $way (@{$hash{$key}})
		{
			$way = $conn->quote($way);
			$iq = "INSERT INTO `kegg_reference` (`ref_id`,`path_id`) ".
				  "VALUES (".$map.",".$way.");";
			$conn->do($iq);
		}
	}
	
	&closeConnection($conn);
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

sub initFields
{
	use Switch;

	my $type = shift @_;
	my %out;

	switch($type)
	{
		case /ncbitax_to_keggtax/i
		{
			%out = ("ncbi_tax_id" => "NULL",
					"kegg_tax_id" => "",
					"kegg_tax_code" => "",
					"kegg_tax_name" => "");
		}
		case /kegg_pathways/i
		{
			%out = ("pathway_id" => "",
					"name" => "",
					"class" => "",
					"organism" => "");
		}
		case /pathway_members/i
		{
			%out = ("pathway_id" => "",
					"kegg_member" => "",
					"entrez_member" => "",
					"species" => "NULL");
		}
	}
	
	return(%out);
}

sub loadDefaultParams
{
	my %h = ("DBNAME" => "KUPKB_Vis",
			 "FTP" => "ftp.ncbi.nlm.nih.gov",
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
			 "INDEX_HOME" => "/media/HD2/mysql/sphinx_index/",
			 "CURATORS" => "/media/HD5/Work/TestGround/contr_emails.txt"
		);
	return(\%h);
}

sub now
{
	my ($sec,$min,$hour,$day,$month,$year) = localtime(time);
	$year += 1900;
	$month++;
	$month = "0".$month if (length($month)==1);
	$day = "0".$day if (length($day)==1);
	$hour = "0".$hour if (length($hour)==1);
	$min = "0".$min if (length($min)==1);
	$sec = "0".$sec if (length($sec)==1);
	return($day."/".$month."/".$year." ".$hour.":".$min.":".$sec);
}

sub deathByREST
{
	my $d = &now;
	die "\n$d - REST calls failed!!! Please rerun the program... :-(\n\n";
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
Create the KEGG table in KUPKB_Vis database.

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
  --reference|r		Import also the reference pathways? (NYI!)
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --help|h		Display this help text.
	
This program builds the species and genes tables in the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

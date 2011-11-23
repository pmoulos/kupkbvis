#!/usr/bin/perl -w

# desc2table.pl
# A Perl script to fill the local KUPKB_Vis database tables dataset_descriptions and datasets
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 09 - 11 - 2011 (dd - mm - yyyy)
# Last Update : 16 - 11 - 2011 (dd - mm - yyyy)
# Version     : 1.0

use strict;
use File::Basename;
use Getopt::Long;
use Switch;

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "desc2html.pl";
our @input;	         # Input files (must be of same type)
our $type="";        # Excel or delimited text?
our $mode;		     # Convert experiment sheet, dataset description
our $outpath = "";   # Path to write the output file in case of not direct insertion
our $curators = "";  # File with the list of curators and their mails
our @dbdata;	     # Username and password for the DB to avoid hardcoding
our $updatedb;		 # Update the local DB with new datasets?
our $silent = 0;     # Display verbose messages
our $help = 0;       # Help?

# Check inputs
&checkInputs;

# Check for Regexp::Common
if ($mode eq "data")
{
	eval
	{
		require Regexp::Common;
	};
	if ($@)
	{
		my $butcher = "Module Regexp::Common is required to continue running the program.\n".
					  "If you have ActiveState Perl installed, use the Package Manager to get\n".
					  "the module. If you don't know how to install the package, sort the files\n".
					  "using another tool like Excel or contact your system administrator.";
		die "\n$butcher\n\n";
	}
}

# Database connection
our $conn;
# A universal counter for the fill of the table data in function parse(Excel|Test)Data
our $UNIVERSAL_COUNTER = 0;

if ($type eq "excel")
{
	eval
	{
		require Spreadsheet::ParseExcel;
	};
	if ($@)
	{
		my $killer = "Module Spreadsheet::ParseExcel is required to continue running the program.\n".
					 "If you have ActiveState Perl installed, use the Package Manager to get\n".
					 "the module. If you don't know how to install the package, sort the files\n".
					 "using another tool like Excel or contact your system administrator.";
		die "\n$killer\n\n";
	}
	
	for (my $i=0; $i<@input; $i++)
	{
		switch ($mode)
		{
			case /description/i
			{
				disp("Inserting experiment descriptions from Excel file $input[$i] to database...");
				&parseExcelDescription($input[$i])
			}
			case /dataset/i
			{
				if (-d $input[$i])
				{
					my @files;
					eval
					{
						require File::List;
						my $search = new File::List($input[$i]);
						@files  = @{$search->find("\.xls\$")};
					};
					if ($@)
					{
						@files = &listRecurse($input[$i]);
					}
					for (my $j=0; $j<@files; $j++)
					{
						disp("Inserting dataset attributes from Excel file $files[$j] to database...");
						&parseExcelDataset($files[$j]);
					}
				}
				else
				{
					disp("Inserting dataset attributes from Excel file $input[$i] to database...");
					&parseExcelDataset($input[$i]);
				}
			}
			case /data/i
			{
				if (-d $input[$i])
				{
					my @files;
					eval
					{
						require File::List;
						my $search = new File::List($input[$i]);
						@files  = @{$search->find("\.xls\$")};
					};
					if ($@)
					{
						@files = &listRecurse($input[$i]);
					}
					for (my $j=0; $j<@files; $j++)
					{
						disp("Inserting data from Excel file $files[$j] to database...");
						&parseExcelData($files[$j]);
					}
				}
				else
				{
					disp("Inserting data from Excel file $input[$i] to database...");
					&parseExcelData($input[$i]);
				}
			}
		}
	}
}
elsif ($type eq "text")
{
	for (my $i=0; $i<@input; $i++)
	{
		switch ($mode)
		{
			case /description/i
			{
				disp("Inserting experiment descriptions from text file $input[$i] to database...");
				&parseTextDescription($input[$i]);
			}
			case /dataset/i
			{
				if (-d $input[$i])
				{
					my @files;
					eval
					{
						require File::List;
						my $search = new File::List($input[$i]);
						@files  = @{$search->find("\.txt\$")};
					};
					if ($@)
					{
						@files = &listRecurse($input[$i]);
					}
					for (my $j=0; $j<@files; $j++)
					{
						disp("Inserting dataset attributes from text file $files[$j] to database...");
						&parseTextDataset($files[$j]);
					}
				}
				else
				{
					disp("Inserting dataset attributes from text file $input[$i] to database...");
					&parseTextDataset($input[$i]);
				}
			}
			case /data/i
			{
				if (-d $input[$i])
				{
					my @files;
					eval
					{
						require File::List;
						my $search = new File::List($input[$i]);
						@files  = @{$search->find("\.xls\$")};
					};
					if ($@)
					{
						@files = &listRecurse($input[$i]);
					}
					for (my $j=0; $j<@files; $j++)
					{
						disp("Inserting data from text file $files[$j] to database...");
						&parseTextData($files[$j]);
					}
				}
				else
				{
					disp("Inserting data from text file $input[$i] to database...");
					&parseTextData($input[$i]);
				}
			}
		}
	}
}

disp("Finished!\n\n");


sub parseExcelDescription
{
	use Spreadsheet::ParseExcel;

	my $in = shift @_;
	
	my %cur;
	%cur = &parseCurators($curators) if ($curators);
	
	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);

	my $wsheet = $wbook->{Worksheet}[0];
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();
	my %fieldstxt = &initDescFields("txt");
	my %fieldspos = &initDescFields("num");
	my @manfields = ("experiment_name","display_name","title","journal","experiment_name_original_case");
	my ($i,$j,$cell,$value);
	
	# Deal with header and check if all necessary field names are there... stop if corrupt...
	for ($j=$colmin; $j<=$colmax; $j++)
	{
		$cell = $wsheet->get_cell(0,$j);
		$value = $cell->value() if ($cell);
		if ($value)
		{
			$value = lc($value);
			$value =~ s/-//g;
			$value =~ s/\s+/_/g;
			$fieldstxt{$value} = "visited";
			$fieldspos{$value} = $j;
		}
		$value = undef;
	}
	foreach my $key (keys(%fieldstxt))
	{
		if ($fieldstxt{$key} ne "visited")
		{
			($key ~~ @manfields) ? 
			(die "\nMandatory field $key is missing from dataset description file $in... Can't continue!\n\n") :
			(disp("Field $key is missing but is not mandatory... Will be assumed empty..."));
		}
	}

	# Deal with the actual data
	my %sopdleif = reverse(%fieldspos);
	for ($i=1; $i<=$rowmax; $i++)
	{
		# Clear the hash for each line
		my %fieldstxt = &initDescFields("txt");
		for ($j=$colmin; $j<=$colmax; $j++)
		{
			$value = undef;
			$cell = $wsheet->get_cell($i,$j);
			$value = $cell->value() if ($cell);
			if ($value)
			{
				$value = &stripQuotes($value);
				$fieldstxt{$sopdleif{$j}} = $value;
			}
		}

		# Fix date for proper importing
		($fieldstxt{"date_added"}) ? ($fieldstxt{"date_added"} = $fieldstxt{"date_added"}." 01") :
		($fieldstxt{"date_added"} = "january 1999 01"); # A plasmatic fill date
		# Truncate the _assay thing
		$fieldstxt{"experiment_name"} =~ s/_assay$// if ($fieldstxt{"experiment_name"});
		$fieldstxt{"experiment_name_original_case"} =~ s/_assay$// if ($fieldstxt{"experiment_name_original_case"});
		
		# The check for e-mail...
		if ($fieldstxt{"curators"})
		{
			if (%cur)
			{
				my @contrs = split(/\|/,$fieldstxt{"curators"});
				my @clinks;
				foreach my $c (@contrs)
				{
					$c = &capEachWord(&trim($c));
					push(@clinks,$cur{$c});
				}
				$fieldstxt{"curators_contact"} = join(" and ",@clinks);
			}
			else { $fieldstxt{"curators_contact"} = ""; }
		}
		else { $fieldstxt{"curators_contact"} = ""; }

		# --------------------------------------------------------------------------------
		# Dirty hack for the authors/journal problem, until it is fixed...
		($fieldstxt{"authors"}) ? ($fieldstxt{"journal"} = $fieldstxt{"authors"}) :
		($fieldstxt{"journal"} = "");
		delete $fieldstxt{"authors"};
		# --------------------------------------------------------------------------------
		&insertDescription(\%fieldstxt);
	}
	# There are empty lines whose fix is not evident in Excel reading...
	&fixDescriptionEmptyLine(); 
	
	disp("Done! Dataset descriptions inserted to database!");
}

sub parseExcelDataset
{
	use Spreadsheet::ParseExcel;

	my $in = shift @_;

	# We have to first open the Excel file because we need the experiment name inside
	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);
	my $wsheet = $wbook->{Worksheet}[0];
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();

	# Expected fields
	my %visited = ("experiment_id" => 0,
				   "compound_list" => 0,
				   "experiment_assay" => 0,
				   "preanalytical_technique" => 0,
				   "experiment_analysis" => 0,
				   "pmid" => 0,
				   "external_link" => 0,
				   "geo_acc" => 0,
				   "role" => 0,
				   "experiment_condition" => 0,
				   "species" => 0,
				   "biomaterial" => 0,
				   "maturity" => 0,
				   "disease" => 0,
				   "laterality" => 0,
				   "severity" => 0,
				   "experiment_description" => 0);
	my %fields = ("experiment_id" => "",
				  "compound_list" => "",
				  "experiment_assay" => "",
				  "preanalytical_technique" => "",
				  "experiment_analysis" => "",
				  "pmid" => "NULL",
				  "external_link" => "",
				  "geo_acc" => "",
				  "role_0" => "",
				  "experiment_condition_0" => "",
				  "species_0" => "",
				  "biomaterial_0" => "",
				  "maturity_0" => "",
				  "disease_0" => "",
				  "laterality_0" => "",
				  "severity_0" => "",
				  "role_1" => "",
				  "experiment_condition_1" => "",
				  "species_1" => "",
				  "biomaterial_1" => "",
				  "maturity_1" => "",
				  "disease_1" => "",
				  "laterality_1" => "",
				  "severity_1" => "",
				  "experiment_description" => "");

	my $rmax = 50; # Max rows to check
	my $rc = 0;
	my ($cell,$param,$value,$nv);
	my @params = keys(%visited);
	while($rc <= $rowmax && $rc <= $rmax)
	{
		$param = undef;
		$value = undef;
		$cell = $wsheet->get_cell($rc,0);
		$param = $cell->value() if ($cell);
		if ($param)
		{
			$param = lc($param);
			$param =~ s/ /_/g;
			if ($param ~~ @params)
			{
				$visited{$param}++;
				$cell = $wsheet->get_cell($rc,1);
				$value = $cell->value() if ($cell);
				if ($value)
				{
					$value = &stripQuotes($value);
					switch($param)
					{
						case /experiment_id|compound_list|experiment_assay|preanalytical_technique|
							|experiment_analysis|pmid|external_link|geo_acc|experiment_description/
						{
							$fields{$param} = $value;
						}
						case /role|experiment_condition|species|biomaterial|maturity|disease|laterality|severity/
						{
							$nv = --$visited{$param};
							$fields{$param."_".$nv} = $value;
						}
					}
				}
			}
		}
		$rc++;
	}
	&insertAttributes(\%fields);
	
	disp("Done! Dataset $in properties inserted to database!");
}

sub parseExcelData
{
	use Spreadsheet::ParseExcel;

	my $in = shift @_;
	
	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);

	my $wsheet = $wbook->{Worksheet}[0];
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();

	my %fields = &initDataFields();
	my ($i,$j,$cell,$param,$value,$rowstart);

	# Get the experiment_id to fill foreign key
	my $rc = 0;
	my $foreign = "";
	while($rc <= $rowmax && $rc <= 10)
	{
		$param = undef;
		$value = undef;
		$cell = $wsheet->get_cell($rc,0);
		$param = $cell->value() if ($cell);
		if ($param)
		{
			$param = lc($param);
			$param =~ s/ /_/g;
			if ($param =~ /experiment_id/)
			{
				$cell = $wsheet->get_cell($rc,1);
				$value = $cell->value() if ($cell);
				if ($value)
				{
					$foreign = lc(&stripQuotes($value));
					last;
				}
			}
		}
		$rc++;
	}
	
	# Read from lines (25-35)x(2-5) matrix so as to determine the data starting row (column should
	# always be the second one with the above order (%fields) after record_id
	my @matchfields = keys(%fields);
	OUTER: for ($i=24; $i<=34; $i++)
		{
			for ($j=1; $j<=5; $j++)
			{
				$cell = $wsheet->get_cell($i,$j);
				$value = $cell->value() if ($cell);
				if ($value)
				{
					$value = lc($value);
					$value =~ s/-//g;
					$value =~ s/\s+/_/g;
					if ($value ~~ @matchfields)
					{
						$rowstart = $i;
						last OUTER;
					}
				}
			}
		}
	die "\nFile $in does not seem to be a valid dataset file... Can't continue!\n\n" if (!$rowstart);

	# Deal with the actual data
	for ($i=$rowstart+1; $i<=$rowmax; $i++)
	{
		# Increase the universal counter
		$UNIVERSAL_COUNTER++;

		# Clear the hash for each line
		my %fields = &initDataFields();

		$fields{"record_id"} = "KUPKBVis_".&zeroFill($UNIVERSAL_COUNTER,12);
		$fields{"dataset_id"} = $foreign;

		# gene_symbol
		$value = undef;
		$cell = $wsheet->get_cell($i,1);
		$value = $cell->value() if ($cell);
		$fields{"gene_symbol"} = &stripQuotes($value) if ($value);

		# entrez_gene_id
		$value = undef;
		$cell = $wsheet->get_cell($i,2);
		$value = $cell->value() if ($cell);
		$fields{"entrez_gene_id"} = &trim(&stripQuotes($value)) if ($value);
			
		# uniprot_id
		$value = undef;
		$cell = $wsheet->get_cell($i,3);
		$value = $cell->value() if ($cell);
		$fields{"uniprot_id"} = &stripQuotes($value) if ($value);

		# hmdb_id
		$value = undef;
		$cell = $wsheet->get_cell($i,4);
		$value = $cell->value() if ($cell);
		$fields{"hmdb_id"} = &stripQuotes($value) if ($value);

		# microcosm_id
		$value = undef;
		$cell = $wsheet->get_cell($i,5);
		$value = $cell->value() if ($cell);
		$fields{"microcosm_id"} = &stripQuotes($value) if ($value);

		# expression_strength
		$value = undef;
		$cell = $wsheet->get_cell($i,6);
		$value = $cell->value() if ($cell);
		$fields{"expression_strength"} = &stripQuotes($value) if ($value);

		# differential_expression_analyte_control
		$value = undef;
		$cell = $wsheet->get_cell($i,7);
		$value = $cell->value() if ($cell);
		$fields{"differential_expression_analyte_control"} = &stripQuotes($value) if ($value);

		# ratio
		$value = undef;
		$cell = $wsheet->get_cell($i,8);
		$value = $cell->value() if ($cell);
		$fields{"ratio"} = &trim(&stripQuotes($value)) if ($value);
		
		# pvalue
		$value = undef;
		$cell = $wsheet->get_cell($i,9);
		$value = $cell->value() if ($cell);
		$fields{"pvalue"} = &parseReal(&trim(&stripQuotes($value))) if ($value);

		# fdr
		$value = undef;
		$cell = $wsheet->get_cell($i,10);
		$value = $cell->value() if ($cell);
		$fields{"fdr"} = &parseReal(&trim(&stripQuotes($value))) if ($value);

		&insertData(\%fields);
	}
	
	disp("Done! Data inserted to database!");
}

sub parseTextDescription	
{
	#use Encode::Detect::Detector;
	
	my $in = shift @_;
	
	my %cur;
	%cur = &parseCurators($curators) if ($curators);
	
	#open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";
	open(INPUT,$in) or die "\nThe file $in does not exist!\n";

	my ($i,$line,$hline,$len);
	my (@fields,@lines);
	my %fieldstxt = &initDescFields("txt");
	my %fieldspos = &initDescFields("num");
	my @manfields = ("experiment_name","display_name","title","journal","experiment_name_original_case");

	# Deal with header and check if all necessary field names are there... stop if corrupt...
	$hline = <INPUT>;
	#my $det = Encode::Detect::Detector->detect($hline);
	@fields = split(/\t/,$hline);
	$len = @fields;
	for($i=0; $i<$len; $i++)
	{
		if ($fields[$i])
		{
			$fields[$i] = lc(&trim($fields[$i]));
			$fields[$i] =~ s/-//g;
			$fields[$i] =~ s/\s+/_/g;
			$fieldstxt{$fields[$i]} = "visited";
			$fieldspos{$fields[$i]} = $i;
		}
	}
	foreach my $key (keys(%fieldstxt))
	{
		if ($fieldstxt{$key} ne "visited")
		{
			($key ~~ @manfields) ? 
			(die "\nMandatory field $key is missing from dataset description file $in... Can't continue!\n\n") :
			(disp("Field $key is missing but is not mandatory... Will be assumed empty..."));
		}
	}

	# Deal with rest of the data
	my %sopdleif = reverse(%fieldspos);
	while ($line = <INPUT>)
	{
		next if ($line =~ m/^(\s)*$/);
		$line =~ s/\r|\n$//g;
		@fields = split(/\t/,$line);
		# Clear the hash for each line
		my %fieldstxt = &initDescFields("txt");
		
		# Strip left-over double quotes
		for ($i=0; $i<@fields; $i++)
		{
			if ($fields[$i])
			{
				$fields[$i] = &stripQuotes($fields[$i]);
				$fieldstxt{$sopdleif{$i}} = $fields[$i];
			}
		}
		
		# Fix date for proper importing
		($fieldstxt{"date_added"}) ? ($fieldstxt{"date_added"} = $fieldstxt{"date_added"}." 01") :
		($fieldstxt{"date_added"} = "january 1999 01"); # A plasmatic fill date
		# Truncate the _assay thing
		$fieldstxt{"experiment_name"} =~ s/_assay$// if ($fieldstxt{"experiment_name"});
		$fieldstxt{"experiment_name_original_case"} =~ s/_assay$// if ($fieldstxt{"experiment_name_original_case"});
		
		# The check for e-mail...
		if ($fieldstxt{"curators"})
		{
			if (%cur)
			{
				my @contrs = split(/\|/,$fieldstxt{"curators"});
				my @clinks;
				foreach my $c (@contrs)
				{
					$c = &capEachWord(&trim($c));
					push(@clinks,$cur{$c});
				}
				$fieldstxt{"curators_contact"} = join(" and ",@clinks);
			}
			else { $fieldstxt{"curators_contact"} = ""; }
		}
		else { $fieldstxt{"curators_contact"} = ""; }

		# --------------------------------------------------------------------------------
		# Dirty hack for the authors/journal problem, until it is fixed...
		($fieldstxt{"authors"}) ? ($fieldstxt{"journal"} = $fieldstxt{"authors"}) :
		($fieldstxt{"journal"} = "");
		delete $fieldstxt{"authors"};
		# --------------------------------------------------------------------------------
		&insertDescription(\%fieldstxt);
	}
	close(INPUT);
	
	disp("Done! Dataset descriptions inserted to database!");
}

sub parseTextDataset
{
	my $in = shift @_;

	#open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";
	open(INPUT,$in) or die "\nThe file $in does not exist!\n";

	# Expected fields
	my %visited = ("experiment_id" => 0,
				   "compound_list" => 0,
				   "experiment_assay" => 0,
				   "preanalytical_technique" => 0,
				   "experiment_analysis" => 0,
				   "pmid" => 0,
				   "external_link" => 0,
				   "geo_acc" => 0,
				   "role" => 0,
				   "experiment_condition" => 0,
				   "species" => 0,
				   "biomaterial" => 0,
				   "maturity" => 0,
				   "disease" => 0,
				   "laterality" => 0,
				   "severity" => 0,
				   "experiment_description" => 0);
	my %fields = ("experiment_id" => "",
				  "compound_list" => "",
				  "experiment_assay" => "",
				  "preanalytical_technique" => "",
				  "experiment_analysis" => "",
				  "pmid" => "NULL",
				  "external_link" => "",
				  "geo_acc" => "",
				  "role_0" => "",
				  "experiment_condition_0" => "",
				  "species_0" => "",
				  "biomaterial_0" => "",
				  "maturity_0" => "",
				  "disease_0" => "",
				  "laterality_0" => "",
				  "severity_0" => "",
				  "role_1" => "",
				  "experiment_condition_1" => "",
				  "species_1" => "",
				  "biomaterial_1" => "",
				  "maturity_1" => "",
				  "disease_1" => "",
				  "laterality_1" => "",
				  "severity_1" => "",
				  "experiment_description" => "");

	# Deal with the actual contents
	my ($i,$line,$nv);
	my $rmax = 50; # Max rows to check
	my $rc = 0;
	my @columns;
	my @params = keys(%visited);
	while ($line = <INPUT>)
	{
		last if ($rc==$rmax);
		next if ($line =~ m/^(\s)*$/);
		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		if ($columns[0])
		{
			$columns[0] = lc($columns[0]);
			$columns[0] =~ s/ /_/g;
			if ($columns[0] ~~ @params)
			{
				$visited{$columns[0]}++;
				if ($columns[1])
				{
					$columns[1] = &stripQuotes($columns[1]);
					switch($columns[0])
					{
						case /experiment_id|compound_list|experiment_assay|preanalytical_technique|
							|experiment_analysis|pmid|external_link|geo_acc|experiment_description/
						{
							$fields{$columns[0]} = $columns[1];
						}
						case /role|experiment_condition|species|biomaterial|maturity|disease|laterality|severity/
						{
							$nv = --$visited{$columns[0]};
							$fields{$columns[0]."_".$nv} = $columns[1];
						}
					}
				}
			}
		}
		$rc++;
	}
	&insertAttributes(\%fields);
	
	disp("Done! Dataset $in properties inserted to database!");
}

sub parseTextData
{
	my $in = shift @_;
	
	#open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";
	open(INPUT,$in) or die "\nThe file $in does not exist!\n";

	my %fields = &initDataFields();
	my ($i,$line,$rowstart);
	my @columns;

	# Get the experiment_id to fill foreign key
	my $rc = 0;
	my $foreign = "";
	while($line = <INPUT>)
	{
		last if ($rc==10);
		next if ($line =~ m/^(\s)*$/);
		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		if ($columns[0])
		{
			$columns[0] = lc($columns[0]);
			$columns[0] =~ s/ /_/g;
			if ($columns[0] =~ /experiment_id/)
			{
				$foreign = lc(&stripQuotes($columns[1]));
				last;
			}
		}
		$rc++;
	}

	# Send some lines to oblivion...
	while ($rc<25)
	{
		$line = <INPUT>;
		$rc++;
	}
	
	# Read from lines (25-35)x(2-5) matrix so as to determine the data starting row (column should
	# always be the second one with the above order (%fields) after record_id
	my @matchfields = keys(%fields);
	OUTER: while ($line = <INPUT>)
		{
			$rc++;
			last if ($rc==35);
			next if ($line =~ m/^(\s)*$/);
			$line =~ s/\r|\n$//g;
			@columns = split(/\t/,$line);
			for ($i=1; $i<=5; $i++)
			{
				$columns[$i] = lc($columns[$i]);
				$columns[$i] =~ s/-//g;
				$columns[$i] =~ s/\s+/_/g;
				if ($columns[$i] ~~ @matchfields)
				{
					$rowstart = $rc;
					last OUTER;
				}
			}
		}
	die "\nFile $in does not seem to be a valid dataset file... Can't continue!\n\n" if (!$rowstart);

	# Go to the beginning
	seek(INPUT,0,0);
	$rc = 0;
	# Re-send some lines to oblivion...
	while ($rc<=$rowstart)
	{
		$line = <INPUT>;
		$rc++;
	}
	# Deal with the actual data
	while ($line = <INPUT>)
	{
		$line =~ s/\r|\n$//g;
		@columns = split(/\t/,$line);
		
		# Increase the universal counter
		$UNIVERSAL_COUNTER++;

		# Clear the hash for each line
		my %fields = &initDataFields();
		
		$fields{"record_id"} = "KUPKBVis_".&zeroFill($UNIVERSAL_COUNTER,12);
		$fields{"dataset_id"} = $foreign;
		$fields{"gene_symbol"} = &stripQuotes($columns[1]) if ($columns[1]); # gene_symbol
		$fields{"entrez_gene_id"} = &trim(&stripQuotes($columns[2])) if ($columns[2]); # entrez_gene_id
		$fields{"uniprot_id"} = &stripQuotes($columns[3]) if ($columns[3]); # uniprot_id
		$fields{"hmdb_id"} = &stripQuotes($columns[4]) if ($columns[4]); # hmdb_id
		$fields{"microcosm_id"} = &stripQuotes($columns[5]) if ($columns[5]); # microcosm_id
		$fields{"expression_strength"} = &stripQuotes($columns[6]) if ($columns[6]); # expression_strength
		$fields{"differential_expression_analyte_control"} = &stripQuotes($columns[7]) if ($columns[7]); # differential_expression_analyte_control
		$fields{"ratio"} = &trim(&stripQuotes($columns[8])) if ($columns[8]); # expression_strength
		$fields{"pvalue"} = &parseReal(&trim(&stripQuotes($columns[9]))) if ($columns[9]); # expression_strength
		$fields{"fdr"} = &parseReal(&trim(&stripQuotes($columns[10]))) if ($columns[10]); # fdr

		&insertData(\%fields);
	}
	
	disp("Done! Data inserted to database!");
}

# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("input|i=s{,}" => \@input,
    		   "type|t=s" => \$type,
    		   "mode|m=s" => \$mode,
    		   "curators|r=s" => \$curators,
    		   "dbdata|d=s{,}" => \@dbdata,
    		   "silent|s" => \$silent,
    		   "help|h" => \$help);
    # Check if the required arguments are set
    if ($help)
    {
    	&programUsage;
    	exit;
    }
    $stop .= "--- Please specify input(s) ---\n" if (!@input);
    # Check conversion mode
	if ($mode ne "description" && $mode ne "dataset" &&$mode ne "data")
	{
		disp("--mode should be one of \"description\", \"dataset\" or \"data\"!");
		print "Type perl $scriptname --help for help in usage.\n\n";
		exit;
	}
    $stop .= "--- --input must not be a directory in case of description conversion ---\n"
		if (-d $input[0] && $mode eq "description");
	$stop .= "--- --dbdata should be consisted of two strings! ---\n"
		if (@dbdata && $#dbdata+1 != 2);
	$stop .= "--- --type must be specified if a directory is given for conversion ---\n"
		if (-d $input[0] && !$type);
    if ($stop)
    {
            print "\n$stop\n";
            print "Type perl $scriptname --help for help in usage.\n\n";
            exit;
    }
	# Check file type
	if ($type ne "text" && $type ne "excel")
	{
		disp("--type not given... Will try to guess by extension!");
		$type = &determineType($input[0]);
	}
}

sub determineType
{
	my $in = shift @_;
	my ($base,$dir,$ext) = fileparse($in,'\..*?');
	($ext =~ m/xls/i) ? (return "excel") : (return "text");
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

sub initDescFields
{
	my $type = shift @_;
	my %out;

	if ($type eq "txt")
	{
		%out = ("experiment_name" => "",
				"display_name" => "",
				"external_link" => "",
				"pubmed_id" => "NULL",
				"title" => "",
				"journal" => "",
				"date_added" => "",
				"curators" => "",
				"experiment_name_original_case" => "");
	}
	elsif ($type eq "num")
	{
		my $lo = -999; # To ensure uniqueness of keys in case of reversal
		%out = ("experiment_name" => $lo+1,
				"display_name" => $lo+2,
				"external_link" => $lo+3,
				"pubmed_id" => $lo+4,
				"title" => $lo+5,
				"journal" => $lo+6,
				"date_added" => $lo+7,
				"curators" => $lo+8,
				"experiment_name_original_case" => $lo+9);
	}

	return(%out);
}

sub initDataFields
{
	my %out = ("record_id" => "",
			   "dataset_id" => "",
			   "gene_symbol" => "",
			   "entrez_gene_id" => "NULL",
			   "uniprot_id" => "",
			   "hmdb_id" => "",
			   "microcosm_id" => "",
			   "expression_strength" => "",
			   "differential_expression_analyte_control" => "",
			   "ratio" => "NULL",
			   "pvalue" => "NULL",
			   "fdr" => "NULL");
	return(%out);
}

sub parseCurators
{
	my $in = shift @_;
	my %chash;
	open(IN,$in);
	my $header = <IN>; # Skip header
	while (my $line = <IN>)
	{
		$line =~ s/\r|\n$//g;
		my @f = split(/\t/,$line);
		$f[0] = &capEachWord($f[0]);
		$chash{$f[0]} = "\<a href=\"mailto:$f[1]\"\>$f[0]\</a\>";
	}
	close(IN);
	return %chash;
}

sub capEachWord
{
	my $in = shift @_;
	$in =~ s/(\w+)/\u\L$1/g;
	return $in;
}

sub disp
{
	print "\n@_" if (!$silent);
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

sub insertDescription
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"experiment_name"} = $conn->quote($fields{"experiment_name"});
	$fields{"display_name"} = $conn->quote($fields{"display_name"});
	$fields{"external_link"} = $conn->quote($fields{"external_link"});
	$fields{"title"} = $conn->quote($fields{"title"});
	#$fields{"authors"} = $conn->quote($fields{"authors"});
	$fields{"journal"} = $conn->quote($fields{"journal"});
	$fields{"date_added"} = "STR_TO_DATE('".$fields{"date_added"}."', '\%M \%Y \%d')";
	$fields{"curators"} = $conn->quote($fields{"curators"});
	$fields{"curators_contact"} = $conn->quote($fields{"curators_contact"});
	$fields{"experiment_name_original_case"} = $conn->quote($fields{"experiment_name_original_case"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `dataset_descriptions` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertAttributes
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);

	my @keylist = keys(%fields);
	my @is = grep { $keylist[$_] =~ /pmid/ } 0..$#keylist;
	splice(@keylist,$is[0],1);

	foreach my $k (@keylist)
	{
		$fields{$k} = $conn->quote($fields{$k});
	}
	$fields{"experiment_id"} = lc($fields{"experiment_id"});
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `datasets` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	
	&closeConnection($conn);
}

sub insertData
{
	my %fields = %{$_[0]};
	my $conn = &openConnection(@dbdata);
	my (@field,@value);
	
	$fields{"record_id"} = $conn->quote($fields{"record_id"});
	$fields{"dataset_id"} = $conn->quote($fields{"dataset_id"});
	$fields{"gene_symbol"} = $conn->quote($fields{"gene_symbol"});
	$fields{"uniprot_id"} = $conn->quote($fields{"uniprot_id"});
	$fields{"hmdb_id"} = $conn->quote($fields{"hmdb_id"});
	$fields{"microcosm_id"} = $conn->quote($fields{"microcosm_id"});
	$fields{"expression_strength"} = $conn->quote($fields{"expression_strength"});
	$fields{"differential_expression_analyte_control"} = $conn->quote($fields{"differential_expression_analyte_control"});
	
	foreach my $key (keys(%fields))
	{
		if ($key)
		{
			push(@field,"`".$key."`");
			push(@value,$fields{$key});
		}
	}
	
	my $iq = "INSERT INTO `data` (".join(", ",@field).") ".
			 "VALUES (".join(", ",@value).");";
	$conn->do($iq);
	#print "\n$iq\n";
	
	&closeConnection($conn);
}

sub fixDescriptionEmptyLine
{
	my $conn = &openConnection(@dbdata);
	my $dq = "DELETE FROM `dataset_descriptions` ".
			 "WHERE (`experiment_name` = '' AND `display_name` = '' AND `experiment_name_original_case` = '');";
	$conn->do($dq);
	&closeConnection($conn);
}

sub stripQuotes
{
	my $string = shift;
	$string =~ s/^\"+//;
	$string =~ s/\"+$//;
	return $string;
}

sub trim
{
	my $string = shift;
	$string =~ s/^\s+//;
	$string =~ s/\s+$//;
	return $string;
}

sub zeroFill
{
	my ($n,$len) = @_;
	my $diff = $len - length($n);
	return($n) if $diff <= 0;
	return(('0'x$diff).$n);
}

sub parseReal
{
	use Regexp::Common;
	my $v = shift @_;
	$v =~ s/,/./;
	my @p = $v =~ m/$RE{num}{real}/g;
	$p[0] = sprintf("%.9f",$p[0]);
	return($p[0]);
}

sub programUsage 
{
	# The look sucks here but it is actually good in the command line
	my $usagetext = << "END";
	
$scriptname
KUPKB_Vis database building block for experiment discriptions and dataset
attributes.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --input input(s) --mode conversion_mode [OPTIONS]

--- Required ---
  --input|i  file(s)	Input files
  --mode|m  String	Mode of conversion. Could be "description" or "dataset"
--- Optional ---
  --type|t  string	File type, excel or text. Can be inferred from
			extension but it is not the safest way. It defaults to text.
  --curators|u	A tab delimited text file with a list of curators and
			their e-mails to create links. If not given, links will not
			be created. Useful only if --mode is "description"
  --dbdata|b		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --help|h		Display this help text.
	
The program inserts KUPKB experiment descriptions file and attributes of
individual datasets in the KUPKB_Vis database.

END
	print $usagetext;
	exit;
}

# DEBUG
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

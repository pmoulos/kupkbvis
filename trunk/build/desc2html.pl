#!/usr/bin/perl -w

# desc2table.pl
# A Perl script (fill)
#
# Author      : Panagiotis Moulos (pmoulos@eie.gr)
# Created     : 14 - 11 - 2011 (dd - mm - yyyy)
# Last Update : XX - XX - XXXX (dd - mm - yyyy)
# Version     : 1.0

use strict;
use File::Basename;
use Getopt::Long;
use Switch;

# Make sure output is unbuffered
select(STDOUT);
$|=1;

# Set defaults
our $scriptname = "desc2table.pl";
our @input;	         # Input files (must be of same type)
our $type="";        # Excel or delimited text?
our $mode;		     # Convert experiment sheet, dataset description or general conversion
our $css = "";       # Link to external css style sheet
our $curators = "";  # File with the list of curators and their mails
our $p2i = "images"; # Path to where images are located
our $outpath = "";   # Path to where all converted HTML output will be written
our @dbdata;	     # Username and password for the DB to avoid hardcoding
our $updatedb;		 # Update the local DB with paths to HTML?
our $sortable;		 # Create sortable tables?
our $silent = 0;     # Display verbose messages
our $help = 0;       # Help?

# Check inputs
&checkInputs;

# Database connection
our $conn;
$conn = openConnection(@dbdata) if (@dbdata);

if ($type eq "excel")
{
	eval
	{
		require Spreadsheet::ParseExcel;
	};
	if ($@)
	{
		my $killer = "Module Spreadsheet::ParseExcel is required to continue with file sorting.\n".
					 "If you have ActiveState Perl installed, use the Package Manager to get\n".
					 "the module. If you don't know how to install the package, sort the files\n".
					 "using another tool like Excel or contact your system administrator.";
		die "\n$killer\n\n";
	}
	
	for (my $i=0; $i<@input; $i++)
	{
		disp("Converting Excel file(s) $input[$i] to HTML...");
		switch ($mode)
		{
			case /total/i
			{
				&constructExcelTotal($input[$i])
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
						disp("Converting Excel file $files[$j] to HTML...");
						&constructExcelDataset($files[$j]);
					}
				}
				else
				{
					&constructExcelDataset($input[$i])
				}
			}
			case /general/i
			{
				&constructExcelGeneral($input[$i])
			}
		}
	}	
}
elsif ($type eq "text")
{
	for (my $i=0; $i<@input; $i++)
	{
		disp("Converting Excel file $input[$i] to HTML...");
		switch ($mode)
		{
			case /total/i
			{
				&constructTextTotal($input[$i])
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
						&constructTextDataset($files[$j]);
					}
				}
				else
				{
					&constructTextDataset($input[$i])
				}
			}
			case /general/i
			{
				&constructTextGeneral($input[$i])
			}
		}
	}
}

disp("Finished!\n\n");


sub constructExcelTotal
{
	use Spreadsheet::ParseExcel;

	my $in = shift @_;
	my ($output,$expname) = &createOutput($in);
	my %cur;
	my $createsort;

	($sortable) ? ($createsort = "class=\"sortable\"") : ($createsort="");
	%cur = &parseCurators($curators) if ($curators);
	
	my $headstr = &printHeader("KUPKB datasets description").
				  "\<table $createsort\>\n";

	#open(OUTPUT,">$output");
	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<h1 align=center>KUPKB datasets description\</h1>\n";

	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);

	my $wsheet = $wbook->{Worksheet}[0];
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();
	
	my ($i,$j,$class,$cell,$value);
	my $counter = 0;
	
	# Deal with header
	print OUTPUT "\<tr\>\n";
	for ($j=$colmin; $j<=$colmax; $j++)
	{
		$cell = $wsheet->get_cell(0,$j);
		$value = $cell->value() if ($cell);
		if ($value)
		{
			$value = &capEachWord($value);
			print OUTPUT "\<th\>$value\</th\>\n";
		}
		else { $value = undef; }
	}
	print OUTPUT "\<\/tr\>\n";

	# Deal with the actual data
	for ($i=1; $i<=$rowmax; $i++)
	{
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		print OUTPUT "\<tr class=$class\>\n";
		for ($j=$colmin; $j<5; $j++)
		{
			$value = undef;
			$cell = $wsheet->get_cell($i,$j);
			$value = $cell->value() if ($cell);
			if ($value)
			{
				$value = &stripQuotes($value) if ($value);
				print OUTPUT "\<td\>$value\</td\>\n";
			}
			else
			{
				print OUTPUT "\<td\>\</td\>\n";
			}
		}
		$value = undef;
		# If not empty, print external link
		$cell = $wsheet->get_cell($i,5);
		$value = $cell->value() if ($cell);
		($value) ? (print OUTPUT "\<td\>\<a href=\"$value\" target=\"_blank\">$value</a>\</td\>\n") :
		(print OUTPUT "\<td\>\</td\>\n");
		# If not empty, print pubmed id
		$value = undef;
		$cell = $wsheet->get_cell($i,6);
		$value = $cell->value() if ($cell);
		($value) ? (print OUTPUT "\<td\>\<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/$value\" target=\"_blank\">$value</a>\</td\>\n") :
		(print OUTPUT "\<td\>\</td\>\n");
		for ($j=7; $j<10; $j++)
		{
			$value = undef;
			$cell = $wsheet->get_cell($i,$j);
			$value = $cell->value() if ($cell);
			($value) ? (print OUTPUT "\<td>$value\</td\>\n") : (print OUTPUT "\<td\>\</td\>\n");
		}
		# The check for e-mail...
		$value = undef;
		$cell = $wsheet->get_cell($i,10);
		$value = $cell->value() if ($cell);
		if ($value)
		{
			if (%cur)
			{
				my @contrs = split(/\|/,$value);
				my @clinks;
				foreach my $c (@contrs)
				{
					$c = &capEachWord(&trim($c));
					push(@clinks,$cur{$c});
				}
				print OUTPUT "\<td\>",join(" and ",@clinks),"\</td\>\n";	
			}
			else
			{
				$value =~ s/\|/and/g;
				$value = &capEachWord($value);
			}
		}
		else
		{
			print OUTPUT "\<td\></td\>\n";
		}
		print OUTPUT "\<\/tr\>\n";
		$counter++;
	}

	my $tailstr = "\</table\>\n".
				  "\<br/\>\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");
}

sub constructExcelDataset
{
	use Spreadsheet::ParseExcel;

	my $in = shift @_;

	# We have to first open the Excel file because we need the experiment name inside
	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);
	my $wsheet = $wbook->{Worksheet}[0];
	my $tcell = $wsheet->get_cell(0,1);
	my $expname = $tcell->value() if ($tcell);

	# Julie's request
	my $tablename;
	if ($conn)
	{
		$tablename = &getDisplayName($conn,lc($expname));
		$tablename = "information" if (!$tablename);
	}
	else
	{
		disp("Database connection elements not given... Datasets will be given a general name...");
		$tablename = "information";
	}

	# ...and name accordingly
	my @temp = &createOutput($in,$outpath);
	my $output = $temp[0];
	my ($base,$dir) = fileparse($output,'\..*?');
	$output = $dir.$expname.".html";

	my $headstr = &printHeader("KUPKB dataset $tablename").
				  "\<table class=\"dataset\"\>\n";

	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<tr\>\<td colspan=2 style=\"background-color:#FFFDBF\"\><h1 align=center>KUPKB dataset $tablename\</h1>\<\/tr\>\<\/td\>\n";
	#FF8E8E
	
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();
	
	my ($i,$j,$class,$cell,$value);
	my $counter = 0;
	
	# Construct a header
	print OUTPUT "\<tr\>\n";
	print OUTPUT "\<th\>Attribute\</th\>\n";
	print OUTPUT "\<th\>Value\</th\>\n";
	print OUTPUT "\<\/tr\>\n";

	# Deal with the actual contents
	my $wasempty;
	for ($i=1; $i<=25; $i++)
	{
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		$value = undef;
		$cell = $wsheet->get_cell($i,0);
		$value = $cell->value() if ($cell);
		if ($value)
		{
			$value = &stripQuotes($value) if ($value);
			$wasempty = 0;
			# We have to put it here because else it prints a td which spoils the appearance
			print OUTPUT "\<tr class=$class\>\n"; 
			print OUTPUT "\<td width=\"15%\"\>\<strong\>$value\<\/strong\>\</td\>\n";
			$counter++; # Only if not empty should counter proceed
		}
		else { $wasempty = 1; }
		if (!$wasempty) # Ths poutanas...
		{
			$value = undef;
			$cell = $wsheet->get_cell($i,1);
			$value = $cell->value() if ($cell);
			if ($value)
			{
				$value = &stripQuotes($value) if ($value);
				print OUTPUT "\<td width=\"85%\"\>$value\</td\>\n";
			}
			else
			{
				# Dirty way of making Mozilla and IE show borders
				print OUTPUT "\<td\>&nbsp;\</td\>\n";
			}
		}
		print OUTPUT "\<\/tr\>\n";
	}

	my $tailstr = "\</table\>\n".
				  "\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");

	if ($updatedb)
	{
		disp("Updating also local links database...");
		&updatePath($conn,$expname,$output);
	}
}

sub constructExcelGeneral
{
	use Spreadsheet::ParseExcel;

	my ($in,$displayname,$rowrange,$colrange) = @_;
	$displayname = "KUPKB info" if (!$displayname);
	
	my ($output,$expname) = &createOutput($in);
	$expname = $displayname if ($displayname eq "KUPKB info");

	my $headstr = &printHeader($displayname).
				  "\<table\>\n";

	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<tr\>\<td colspan=2 style=\"background-color:#FFFDBF\"\><h1 align=center>$expname\</h1>\<\/tr\>\<\/td\>\n";


	my $eobj = new Spreadsheet::ParseExcel;
	my $wbook = $eobj->Parse($in);
	die $eobj->error(), ".\n" if (!defined $wbook);

	my $wsheet = $wbook->{Worksheet}[0];
	my ($rowmin,$rowmax) = $wsheet->row_range();
	my ($colmin,$colmax) = $wsheet->col_range();
	
	my ($i,$j,$class,$cell,$value);
	my $counter = 0;
	$colmax = $colrange if ($colrange);
	$rowmax = $rowrange if ($rowrange);
	
	# Deal with header
	print OUTPUT "\<tr\>\n";
	for ($j=$colmin; $j<=$colmax; $j++)
	{
		$cell = $wsheet->get_cell(0,$j);
		$value = $cell->value() if ($cell);
		if ($value)
		{
			$value = &capEachWord($value);
			print OUTPUT "\<th\>$value\</th\>\n";
		}
		else { $value = undef; }
	}
	print OUTPUT "\<\/tr\>\n";

	# Deal with the actual contents
	for ($i=1; $i<=$rowmax; $i++)
	{
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		print OUTPUT "\<tr class=$class\>\n";
		for ($j=$colmin; $j<=$colmax; $j++)
		{
			$value = undef;
			$cell = $wsheet->get_cell($i,$j);
			$value = $cell->value() if ($cell);
			if ($value)
			{
				$value = &stripQuotes($value) if ($value);
				print OUTPUT "\<td\>$value\</td\>\n";
			}
			else
			{
				print OUTPUT "\<td\>\</td\>\n";
			}
		}
		print OUTPUT "\<\/tr\>\n";
		$counter++;
	}

	my $tailstr = "\</table\>\n".
				  "\<br/\>\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");
}

sub constructTextTotal
{
	my $in = shift @_;
	my ($output,$expname) = &createOutput($in);
	my %cur;
	my $createsort;

	($sortable) ? ($createsort = "class=\"sortable\"") : ($createsort="");
	%cur = &parseCurators($curators) if ($curators);
	
	my $headstr = &printHeader("KUPKB datasets description").
				  "\<table\>\n";

	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<h1 align=center>KUPKB datasets description\</h1>\n";

	open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";

	my ($i,$line,$hline,$len,$class);
	my $counter = 0;
	my (@fields,@lines);
	
	$hline = <INPUT>;
	@fields = split(/\t/,$hline);
	$len = @fields;
	print OUTPUT "\<tr\>\n";
	for($i=0; $i<$len; $i++)
	{
		$fields[$i] = &capEachWord($fields[$i]);
		print OUTPUT "\<th\>$fields[$i]\</th\>\n";
	}
	print OUTPUT "\<\/tr\>\n";
	
	while ($line = <INPUT>)
	{
		$line =~ s/\r|\n$//g;
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		print OUTPUT "\<tr class=$class\>\n";
		@fields = split(/\t/,$line);
		# Strip left-over double quotes
		for ($i=0; $i<@fields; $i++)
		{
			$fields[$i] = &stripQuotes($fields[$i]) if ($fields[$i]);
		}
		for($i=0; $i<5; $i++)
		{
			($fields[$i]) ? (print OUTPUT "\<td\>$fields[$i]\</td\>\n") :
			(print OUTPUT "\<td\>\</td\>\n");
		}
		# If not empty, print external link
		($fields[5]) ? (print OUTPUT "\<td\>\<a href=\"$fields[5]\" target=\"_blank\">$fields[5]</a>\</td\>\n") :
		(print OUTPUT "\<td\>\</td\>\n");
		# If not empty, print pubmed id
		($fields[6]) ? (print OUTPUT "\<td\>\<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/$fields[6]\" target=\"_blank\">$fields[6]</a>\</td\>\n") :
		(print OUTPUT "\<td\>\</td\>\n");
		for($i=7; $i<10; $i++)
		{
			($fields[$i]) ? (print OUTPUT "\<td>$fields[$i]\</td\>\n") :
			(print OUTPUT "\<td\>\</td\>\n");
		}
		if ($fields[10])
		{
			if (%cur)
			{
				my @contrs = split(/\|/,$fields[10]);
				my @clinks;
				foreach my $c (@contrs)
				{
					$c = &capEachWord(&trim($c));
					#push(@clinks,"\<a href=\"mailto:$cur{$c}\"\>$c\</a\>");
					push(@clinks,$cur{$c});
				}
				print OUTPUT "\<td\>",join(" and ",@clinks),"\</td\>\n";	
			}
			else
			{
				$fields[10] =~ s/\|/and/g;
				$fields[10] = &capEachWord($fields[10]);
			}
		}
		else
		{
			print OUTPUT "\<td\></td\>\n";
		}
		print OUTPUT "\<\/tr\>\n";
		$counter++;
	}
	
	close(INPUT);

	my $tailstr = "\</table\>\n".
				  "\<br/\>\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");
}

sub constructTextDataset
{
	my $in = shift @_;

	# We have to open before in order to get experiment name
	open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";
	my @ffields = split(/\t/,<INPUT>);
	my $expname = $ffields[1];

	# Julie's request
	my $tablename;
	if ($conn)
	{
		$tablename = &getDisplayName($conn,lc($expname));
	}
	else
	{
		disp("Database connection elements not given... Datasets will be given a general name...");
		$tablename = "information";
	}
	
	# ...and name accordingly
	my @temp = &createOutput($in,$outpath);
	my $output = $temp[0];
	my ($base,$dir) = fileparse($output,'\..*?');
	$output = $dir.$expname.".html";

	# Go to beginning of file
	sysseek(INPUT,0,0);

	my $headstr = &printHeader("KUPKB dataset $tablename").
				  "\<table class=\"dataset\"\>\n";

	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<tr\>\<td colspan=2 style=\"background-color:#FFFDBF\"\><h1 align=center>KUPKB dataset $tablename\</h1>\<\/tr\>\<\/td\>\n";

	# Construct a header
	print OUTPUT "\<tr\>\n";
	print OUTPUT "\<th\>Attribute\</th\>\n";
	print OUTPUT "\<th\>Value\</th\>\n";
	print OUTPUT "\<\/tr\>\n";

	#Skip ExperimentID
	my $junk = <INPUT>;
	# Deal with the actual contents
	my ($i,$line,$class);
	my @fields;
	my $counter = 0;
	my $wasempty;
	while ($line = <INPUT> || $counter <= 25)
	{
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		$line =~ s/\r|\n$//g;
		@fields = split(/\t/,$line);
		if ($fields[0])
		{
			$fields[0] = &stripQuotes($fields[0]) if ($fields[0]);
			$wasempty = 0;
			# We have to put it here because else it prints a td which spoils the appearance
			print OUTPUT "\<tr class=$class\>\n"; 
			print OUTPUT "\<td width=\"15%\"\>\<strong\>$fields[0]\<\/strong\>\</td\>\n";
			$counter++; # Only if not empty should counter proceed
		}
		else { $wasempty = 1; }
		if (!$wasempty) # Ths poutanas...
		{
			if ($fields[1])
			{
				$fields[1] = &stripQuotes($fields[1]) if ($fields[1]);
				print OUTPUT "\<td width=\"85%\"\>$fields[1]\</td\>\n";
			}
			else
			{
				# Dirty way of making Mozilla and IE show borders
				print OUTPUT "\<td\>&nbsp;\</td\>\n";
			}
		}
		print OUTPUT "\<\/tr\>\n";
	}

	my $tailstr = "\</table\>\n".
				  "\<br/\>\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");
	
	if ($updatedb)
	{
		disp("Updating also local links database...");
		&updatePath($expname,$output);
	}
}

sub constructTextGeneral
{
	use constant INF => 9**9**9;

	my ($in,$displayname,$rowrange,$colrange) = @_;
	$displayname = "KUPKB info" if (!$displayname);
	
	my ($output,$expname) = &createOutput($in);
	$expname = $displayname if ($displayname eq "KUPKB info");

	my $headstr = &printHeader($displayname).
				  "\<table\>\n";

	open(OUTPUT,">:utf8",$output);
	print OUTPUT "$headstr";
	print OUTPUT "\<tr\>\<td colspan=2 style=\"background-color:#FFFDBF\"\><h1 align=center>$expname\</h1>\<\/tr\>\<\/td\>\n";

	open(INPUT,"<:encoding(utf8)",$in) or die "\nThe file $in does not exist!\n";

	my ($i,$line,$hline,$len,$class,$rowmax,$colmax);
	my $counter = 0;
	$colmax = $colrange if ($colrange);
	($rowrange) ? ($rowmax = $rowrange) : ($rowmax = INF);
	my (@fields,@lines);
	
	$hline = <INPUT>;
	@fields = split(/\t/,$hline);
	($colmax) ? ($len = $colmax) : ($len = @fields);
	print OUTPUT "\<tr\>\n";
	for($i=0; $i<$len; $i++)
	{
		$fields[$i] = &stripQuotes($fields[$i]);
		$fields[$i] = &capEachWord($fields[$i]);
		print OUTPUT "\<th\>$fields[$i]\</th\>\n";
	}
	print OUTPUT "\<\/tr\>\n";
	
	while ($line = <INPUT> || $counter <= $rowmax)
	{
		$line =~ s/\r|\n$//g;
		($counter%2 == 0) ? ($class = "even") : ($class = "odd");
		print OUTPUT "\<tr class=$class\>\n";
		@fields = split(/\t/,$line);
		# Strip left-over double quotes
		for ($i=0; $i<$len; $i++)
		{
			$fields[$i] = &stripQuotes($fields[$i]) if ($fields[$i]);
			($fields[$i]) ? (print OUTPUT "\<td\>$fields[$i]\</td\>\n") :
			(print OUTPUT "\<td\>\</td\>\n");
		}
		print OUTPUT "\<\/tr\>\n";
		$counter++;
	}
	
	close(INPUT);

	my $tailstr = "\</table\>\n".
				  "\<br/\>\<br/\>\n".
				  &printFooter;
				  
	print OUTPUT "$tailstr";
	close(OUTPUT);
	disp("Done! Output generated in $output");
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

# Process inputs
sub checkInputs
{
    my $stop;
    GetOptions("input|i=s{,}" => \@input,
    		   "type|t=s" => \$type,
    		   "mode|m=s" => \$mode,
    		   "css|c=s" => \$css,
    		   "curators|r=s" => \$curators,
    		   "pathimage|a=s" => \$p2i,
    		   "outpath|o=s" => \$outpath,
    		   "dbdata|d=s{,}" => \@dbdata,
    		   "updatedb|u" => \$updatedb,
    		   "sortable|e" => \$sortable,
    		   "silent|s" => \$silent,
    		   "help|h" => \$help);
    # Check if the required arguments are set
    if ($help)
    {
    	&programUsage;
    	exit;
    }
    $stop .= "--- Please specify input(s) ---\n" if (!@input);
    $stop .= "--- Please specify conversion mode ---\n" if (!$mode);
    $stop .= "--- --input must not be a directory in case of total or general conversion ---\n"
		if (-d $input[0] && $mode && ($mode eq "total" || $mode eq "general"));
	$stop .= "--- --dbdata should be consisted of two strings! ---\n"
		if (@dbdata && $#dbdata+1 != 2);
	$stop .= "--- --dbdata MUST be given with --updatedb switch! ---\n" if ($updatedb && !@dbdata);
	$stop .= "--- --type must be specified if a directory is given for conversion ---\n"
		if (-d $input[0] && !$type);
    if ($stop)
    {
            print "\n$stop\n";
            print "Type perl $scriptname --help for help in usage.\n\n";
            exit;
    }
    # Check conversion mode
	if ($mode ne "total" && $mode ne "dataset" && $mode ne "general")
	{
		disp("--mode should be one of \"total\", \"dataset\" or \"general\"!");
		print "Type perl $scriptname --help for help in usage.\n\n";
		exit;
	}
	# Check file type
	if ($type ne "text" && $type ne "excel")
	{
		disp("--type not given... Will try to guess by extension!");
		$type = &determineType($input[0]);
	}
	# Check if output path exists
	if ($outpath && ! -d $outpath)
	{
		disp("The given output path $outpath does not exist... Ignoring...");
		$outpath = "";
	}
}

sub createOutput
{
	my ($in,$outpath) = @_;
	my ($base,$dir) = fileparse($in,'\..*?');
	my @out;
	if ($outpath)
	{
		@out = ($outpath.$base.".html",$base);
	}
	else
	{
		@out = ($dir.$base.".html",$base);
	}
	return @out;
}

sub trim
{
	my $string = shift;
	$string =~ s/^\s+//;
	$string =~ s/\s+$//;
	return $string;
}

sub stripQuotes
{
	my $string = shift;
	$string =~ s/^\"+//;
	$string =~ s/\"+$//;
	return $string;
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

sub disp
{
	print "\n@_" if (!$silent);
}

sub printHeader
{
	my $tit = shift @_;
	$tit = "KUPKB info" if(!$tit);
	my ($stylestr,$stable);	
	($css) ? ($stylestr = "\<link rel=StyleSheet href=\"$css\" type=\"text/css\" media=screen>\n") :
	($stylestr = &constructStyleSheet);
	($sortable) ? ($stable = "\<script src=\"sorttable.js\"\>\<\/script\>\n") : ($stable = "");

	my $header = "\<html\>\n".
				 "\<head\>\n".
				 "\<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\n".
				 "\<link rel=\"icon\" href=\"$p2i/justkidney.ico\" type=\"image/x-icon\" />\n".
				 "\<title\>$tit\</title\>\n".
				 $stylestr.$stable.
				 "\</head\>\n".
				 "\<body\>\n";
	return $header;
}

sub printFooter
{
	my $footer = "\<div class=\"footer\"\>\n".
        "<p class=\"disclaimer\">The Kidney and Urinary Pathway Knowledge Base has been developed in collaboration between the \<a href=\"http://renalfibrosis.free.fr\" target=\"_blank\"\>Renal Fibrosis Laboratory\</a\> at INSERM, France and the \<a href=\"http://intranet.cs.man.ac.uk/bhig/\" target=\"_blank\">Bio-health Informatics Group\</a\> at the University of Manchester, UK. This work has been funded by \<a href=\"http://www.e-lico.eu\" target=\"_blank\"\>e-LICO project\</a\>, an EU-FP7 Collaborative Project (2009-2012) Theme ICT-4.4: Intelligent Content and Semantics.\</p\>\n".
        "\<div class=\"logos\">\n".
        "\<a href=\"http://renalfibrosis.free.fr\" target=\"_blank\"><img class=\"logo\" src=\"$p2i/logorflab.jpg\" border=\"0\"\>\</a\>\n".
        "\<a href=\"http://intranet.cs.man.ac.uk/bhig\" target=\"_blank\"><img class=\"logo\" src=\"$p2i/BHIG.png\" border=\"0\" \>\</a\>\n".
        "\<a href=\"http://www.inserm.fr\" target=\"_blank\"\>\<img class=\"logo\" style=\"width:180px;\" src=\"$p2i/inserm-logo.png\" border=\"0\"\>\</a\>\n".
        "\<a href=\"http://www.manchester.ac.uk\" target=\"_blank\"><img class=\"logo\" style=\"height:40px;\" src=\"$p2i/logomanchester.gif\" border=\"0\"\>\</a\>\n".
        "\<a href=\"http://www.e-lico.eu\" target=\"_blank\"><img class=\"logo\" style=\"width:40px;\" src=\"$p2i/elico-logo.png\" border=\"0\"\>\</a\>\n".
        "\</div>\n".
        "\</div>\n".
        "\</body\>\n".
		"\</html\>\n";
     return $footer;
}

sub constructStyleSheet
{
	my $outstr = "\<style type = \"text/css\"\>\n".
		"body { background:white;\n".
		"color: #7F7F7F;\n".
		"font-family: Arial Unicode MS, Arial, sans-serif;\n".
		"font-size: small;\n".
		"line-height: 1.7em; }\n".
	"h1 { padding-top:20px;\n".
		"font-size: 2em;\n".
		"font-weight: bold;\n".
		"color: #434041;\n".
		"text-align: center; }\n".
	".ikupHomeText { padding:5px;\n".
		"margin:5px;\n".
		"width:50%;\n".
		"font-size:12px; }\n".
	".mainPageTitle { margin: 6em 7.5em;\n".
		 "position:absolute;\n".
		 "left:225px;\n".
		 "top:0;\n".
		 "height: 90px; }\n".
	".footer { padding-left:30px;\n".
		"width:900px; }\n".
	".disclaimer { font-size:0.8em; }\n".
	".logos { width:900px;\n".
		"text-align:center; }\n".
	".logo { padding:10px;\n".
		"width:95px;\n".
		"height:45px; }\n".
	"table { margin: 5em;\n".
		"font-size: 1em; }\n".
	"table.sortable { margin: 5em;\n".
		"font-size: 1em; }\n".
	"table.sortable th { padding: .3em;\n".
		"color: white;\n".
		"background-color:gray;\n".
		"text-align: left;\n".
		"border-color: lime;\n".
		"border-width: 1px }\n".
	"table.dataset { width: 60%;\n".
		"margin-left: 10%;\n".
		"margin-right: 30%;\n".
		#"border-collapse: collapse;\n".
		"font-size: 1em; }\n".
	"th { padding: .3em;\n".
		"color: white;\n".
		"background-color:gray;\n".
		"text-align: left;\n".
		"border-color: lime;\n".
		"border-width: 1px }\n".
	"tr {}\n".
	"tr.odd { background-color: #ECECEC; }\n".
	"tr.even { }\n".
	"td { padding: .3em; border: 1px #ccc solid; }\n".
	".generalText { width:800px; }\n".
	".navtext {\n".
	"width:250px;\n".
	"font-size:8pt;\n".
	"border-width:2px;\n".
	"border-style:outset;\n".
	"border-color:darkgray;\n".
	"layer-background-color:lightyellow;\n".
	"background-color:lightyellow;\n".
	"color:black; }\n".
	"\</style\>\n";
	return $outstr;
}

sub openConnection
{
    use DBI;
    
    my ($username,$password) = @_;
    my $hostname = "localhost";
    my $database = "kupkb_links";
    
    my $conn = DBI->connect("dbi:mysql:database=$database;host=$hostname;port=3306",$username,$password);
    
    return $conn;
}

sub closeConnection
{
    use DBI;
    
    my $conn = shift @_;
    $conn->disconnect;
}

sub updatePath
{
    use DBI;
    
    my ($conn,$id,$path) = @_;
    my $query = "UPDATE `experiment_descriptions` SET `path_to_HTML`=\"$path\" WHERE experiment_name_original=\"$id\"";
    
    my $UpdateRecord = $conn->do($query);
    
    ($UpdateRecord) ? (disp("Success\n")) : (disp("Failure $DBI::errstr\n"));
}

sub getDisplayName
{
    use DBI;
    use DBD::mysql;
    
    my ($conn,$id) = @_;
    my @dnames;
    my $query = "SELECT `display_name` FROM `experiment_descriptions` WHERE experiment_name=\"$id\"";
    
    my $qh = $conn->prepare($query);
    $qh->execute();
    
    if ($qh)
    {
		@dnames = $qh->fetchrow_array();
		disp("Success\n");
	}
	else { disp("Failure $DBI::errstr\n"); }
	
	return $dnames[0];
}

sub programUsage 
{
	# The look sucks here but it is actually good in the command line
	my $usagetext = << "END";
	
$scriptname
General 2HTML converter for various KUPKB info files.

Author : Panagiotis Moulos (pmoulos\@eie.gr)

Main usage
$scriptname --input input(s) --mode conversion_mode [OPTIONS]

--- Required ---
  --input|i  file(s)	Input files
  --mode|m  String	Mode of conversion. Could be "total", "dataset"
			or "general".
--- Optional ---
  --type|t  string	File type, excel or text. Can be inferred from
			extension but it is not the safest way. It defaults to txt.
  --curators|u	A tab delimited text file with a list of curators and
			their e-mails to create links. If not given, links will not
			be created.
  --css|c		Link to external css stylesheet. If not provided, some
			defaults created by the script will be used.
  --pathimage|m		Path to where the images in the document are located
			relative to the place that the document is placed.
  --dbdata|b		Connection data for the local database. It should
			be a vector of length two containing a username and
			a password.
  --updatedb|u		Update local DB for iKUP browser. LOCAL USE ONLY!!!
  --silent|s		Use this option if you want to turn informative 
  			messages off.
  --help|h		Display this help text.
	
The main output of the program is KUPKB description files in html format.

END
	print $usagetext;
	exit;
}

# Maybe useful junk
#open(OUTPUT,">$output");
#binmode(OUTPUT,":utf8");
#open(INPUT,$in) or die "\nThe file $in does not exist!\n";
#binmode(INPUT,":encoding(utf8)");

## Old construct CSS, now we drop skin
#sub constructStyleSheet
#{
	#my $outstr = "\<style type = \"text/css\"\>\n".
		#"body { background:white;\n".
		#"color: #7F7F7F;\n".
		#"font-family: Arial Unicode MS, Arial, sans-serif;\n".
		#"font-size: small;\n".
		#"line-height: 1.7em;\n".
		#"background: url($p2i/up-left-corner.png) no-repeat top left,\n".
		#"url($p2i/bottom-left-corner.png) no-repeat bottom left,\n".
		#"url($p2i/up-right-corner.png) no-repeat top right;\n".
		#"url($p2i/up-left-corner.png) no-repeat top left; }\n".
	#"h1 { padding-top:20px;\n".
		#"font-size: 2em;\n".
		#"font-weight: bold;\n".
		#"color: #434041;\n".
		#"text-align: center; }\n".
	#".ikupHomeText { padding:5px;\n".
		#"margin:5px;\n".
		#"width:50%;\n".
		#"font-size:12px; }\n".
	#".mainPageTitle { margin: 6em 7.5em;\n".
		 #"position:absolute;\n".
		 #"left:225px;\n".
		 #"top:0;\n".
		 #"height: 90px; }\n".
	#".footer { padding-left:30px;\n".
		#"width:900px; }\n".
	#".disclaimer { font-size:0.8em; }\n".
	#".logos { width:900px;\n".
		#"text-align:center; }\n".
	#".logo { padding:10px;\n".
		#"width:95px;\n".
		#"height:45px; }\n".
	#"table { margin: 5em;\n".
		#"font-size: 1em; }\n".
	#"table.sortable { margin: 5em;\n".
		#"font-size: 1em; }\n".
	#"table.sortable th { padding: .3em;\n".
		#"color: white;\n".
		#"background-color:gray;\n".
		#"text-align: left;\n".
		#"border-color: lime;\n".
		#"border-width: 1px }\n".
	#"table.dataset { width: 60%;\n".
		#"margin-left: 10%;\n".
		#"margin-right: 30%;\n".
		##"border-collapse: collapse;\n".
		#"font-size: 1em; }\n".
	#"th { padding: .3em;\n".
		#"color: white;\n".
		#"background-color:gray;\n".
		#"text-align: left;\n".
		#"border-color: lime;\n".
		#"border-width: 1px }\n".
	#"tr {}\n".
	#"tr.odd { background-color: #ECECEC; }\n".
	#"tr.even { }\n".
	#"td { padding: .3em; border: 1px #ccc solid; }\n".
	#".generalText { width:800px; }\n".
	#".navtext {\n".
	#"width:250px;\n".
	#"font-size:8pt;\n".
	#"border-width:2px;\n".
	#"border-style:outset;\n".
	#"border-color:darkgray;\n".
	#"layer-background-color:lightyellow;\n".
	#"background-color:lightyellow;\n".
	#"color:black; }\n".
	#"\</style\>\n";
	#return $outstr;
#}

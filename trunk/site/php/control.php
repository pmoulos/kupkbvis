<?php
	include('connection.php');
	include('queries.php');	
	
	#include('test.php'); # Test

	if ($_REQUEST['species'])
	{
		$species = (int)$_POST['species'];
		$genes = $_POST['genes'];
		$genes = json_decode($genes,$assoc=TRUE);
		$entrez = getEntrezFromSymbol($genes,$species);
		if (empty($entrez))
		{
			$result = '';
			echo json_encode($result,JSON_FORCE_OBJECT);
		}
		else 
		{
			$dataset = getDatasetID($entrez);
			$disease = initDisease($dataset);
			$location = initLocation($dataset);
			$display = initDataset($dataset);
			$result = array("disease" => $disease, "location" => $location, "dataset" => $display);
			echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
		}
	}
	
	if ($_REQUEST['disease']) {}
	if ($_REQUEST['location']) {}
	if ($_REQUEST['dataset']) {}
	
	function initSpecies()
	{		
		$conn = open_connection();
		global $init_species;
		$result = mysql_query($init_species,$conn);
		while (list($id,$name) = mysql_fetch_array($result))
		{
		    $species[$id] = $name;
		}
		close_connection($conn);
		return($species);	
	}
	
	function getEntrezFromSymbol($genes,$species)
	{					
		$conn = open_connection();
		global $entrez_from_symbol_1,$entrez_from_symbol_2;
		$query = $entrez_from_symbol_1.'(\''.implode("', '",$genes).'\')'.$entrez_from_symbol_2.$species;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
		    $entrez[] = $row[0];
		}		
		close_connection($conn);
		return($entrez);
	}
	
	function getEntrezFromProtein() {}
	
	function getDatasetID($entrez)
	{			
		global $dataset_id_1,$dataset_id_2;
				
		if(is_array($entrez) && !empty($entrez))
		{
			$conn = open_connection();			
			$tmp_list = '('.implode(", ",$entrez).')';			
			$query = $dataset_id_1.$tmp_list.$dataset_id_2.$tmp_list;
			$result = mysql_query($query,$conn);
			while ($row = mysql_fetch_array($result,MYSQL_NUM))
			{
			    $dataset[] = $row[0];
			}
			close_connection($conn);
			return($dataset);
		}
		else 
		{
			die("Input is not an array or something bad happenned!");
		}
	}
	
	function initLocation($dataset) 
	{
		global $init_location;
		
		if(is_array($dataset) && !empty($dataset))
		{	
			$conn = open_connection();			
			$tmp_list = '(\''.implode("', '",$dataset).'\')';			
			$query = $init_location.$tmp_list;
			$result = mysql_query($query,$conn);
			while (list($r_0,$r_1) = mysql_fetch_array($result))
			{
			    $b_0[] = $r_0;
				$b_1[] = $r_1;
			}
			close_connection($conn);
			
			# Remove empty rows for each of $b_0, $b_1 and merge
			$location = array_merge(array_filter($b_0),array_filter($b_1));
			return($location);
		}
		else 
		{
			die("Input is not an array or something bad happenned!");
		}
	}
	
	function initDisease($dataset) 
	{
		global $init_disease;
		
		if(is_array($dataset) && !empty($dataset))
		{	
			$conn = open_connection();			
			$tmp_list = '(\''.implode("', '",$dataset).'\')';			
			$query = $init_disease.$tmp_list;
			$result = mysql_query($query,$conn);
			while (list($r_0,$r_1) = mysql_fetch_array($result))
			{
			    $d_0[] = $r_0;
				$d_1[] = $r_1;
			}
			close_connection($conn);
			
			# Remove empty rows for each of $d_0, $d_1 and merge
			$disease = array_merge(array_filter($d_0),array_filter($d_1));
			return($disease);
		}
		else 
		{
			die("Input is not an array or something bad happenned!");
		}
	}
	
	function initDataset($dataset) 
	{
		global $init_dataset;
		
		if(is_array($dataset) && !empty($dataset))
		{	
			$conn = open_connection();			
			$tmp_list = '(\''.implode("', '",$dataset).'\')';			
			$query = $init_dataset.$tmp_list;
			$result = mysql_query($query,$conn);
			while (list($n,$d) = mysql_fetch_array($result))
			{
			    $dname[$n] = utf8_encode($d);
			}
			close_connection($conn);
			return($dname);
		}
		else 
		{
			die("Input is not an array or something bad happenned!");
		}
	}
	
	function initGO() {}
	function initKEGG() {}
	function updateLocDataDisease() {}
	function updateDisDataLocation() {}
	function getRegulation() {}
	
?>
<?php

session_start();

include('connection.php');
include('queries.php');	

//include('test.php'); # Test

# Response to Select species dropdown list or the GO button
if ($_REQUEST['species'])
{
    $species = (int)$_REQUEST['species'];
	$genes = $_REQUEST['genes'];
	$genes = json_decode($genes,$assoc=TRUE);
    $entrez = getEntrezFromSymbol($genes,$species);
	if (empty($entrez))
	{
		$resultKUPKB = array();
	}
	else 
	{
		$dataset = getDatasetID($entrez);
		if (empty($dataset))
		{
			$resultKUPKB = array();
			echo json_encode($resultKUPKB,JSON_FORCE_OBJECT);
		}
		else 
		{
			$disease = initDisease($dataset);
			$location = initLocation($dataset);
			$display = initDataset($dataset);
			$resultKUPKB = array("disease" => $disease, "location" => $location, "dataset" => $display);
		}
		$go = initGO($entrez);
		$kegg = initKEGG($entrez);
		//$mirna = initmiRNA($entrez);
		$resultOther = array("go" => $go, "kegg" => $kegg);
		
		$result = array_merge($resultKUPKB,$resultOther);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
    
	$_SESSION['species'] = $species;
	$_SESSION['entrez'] = $entrez;
}

# Response to Select disease dropdown list
if ($_REQUEST['disease'])
{
	$disease = $_REQUEST['disease'];
	$entrez = $_SESSION['entrez'];
	if (empty($entrez))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		$result = updateLocDataDisease($entrez,$disease);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

# Response to Select location dropdown list
if ($_REQUEST['location'])
{
	$location = $_REQUEST['location'];
	$entrez = $_SESSION['entrez'];
	if (empty($entrez))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		$result = updateDisDataLocation($entrez,$location);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

if ($_REQUEST['dataset']) {}

if ($_REQUEST['network']) // The network!
{
	$entrez = $_SESSION['entrez'];
	$proteins = getEnsemblFromEntrez($entrez);
	$schema = initDataSchema();
	$nodes = initNodes($entrez);
	$edges = initEdges($proteins);
	$resultNetwork = array("dataSchema" => $schema, "data" => array("nodes" => $nodes, "edges" => $edges));
	#echo json_encode($resultNetwork,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	echo json_encode($resultNetwork,JSON_NUMERIC_CHECK);
}

if ($_REQUEST['suggest_term'])
{		
	$term = $_REQUEST['suggest_term'];
	$species = (int)$_REQUEST['suggest_species'];
	$result = getAutocompGenes($term,$species);
	echo json_encode($result,JSON_FORCE_OBJECT);
}

#################################### DEBUG ###########################################
if ($_REQUEST['json_debug'])
{		
	$json_debug = $_REQUEST['json_debug'];
    $path = (strtoupper(substr(PHP_OS,0,3)) === 'WIN') ? 'C:\Temp\json_network.json' :
        '/media/HD5/Work/TestGround/PHPCounter/json_network.json';
	$file = fopen($path,'w+');
	fwrite($file,json_encode($json_debug,JSON_NUMERIC_CHECK));
	fclose($file);
	chown($path,"panos");
}
######################################################################################

# FUNCTIONS	

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
	$list_of_genes = is_array($genes) ? implode("', '",$genes) : $genes;
	$query = $entrez_from_symbol_1.'(\''.$list_of_genes.'\')'.$entrez_from_symbol_2.$species;
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$entrez[] = $row[0];
	}		
	close_connection($conn);
	return($entrez);
}

function getEnsemblFromEntrez($entrez)
{
	global $ensembl_from_entrez;
	$ensembl = array();
	$conn = open_connection();
	$gene_list = '('.implode(", ",$entrez).')';
	$query = $ensembl_from_entrez.$gene_list;
	$result = mysql_query($query,$conn);
	while (list($ez,$el) = mysql_fetch_array($result))
	{
		$ensembl[$ez] = $el;
	}		
	close_connection($conn);
	return($ensembl);
}

function getEntrezFromProtein() {}

function getDatasetID($entrez)
{
	global $dataset_id_1,$dataset_id_2;
	$dataset = array();		
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
	}
	return($dataset);
}

function initLocation($dataset) 
{
	global $init_location;
	$location = array();
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
	}
	return($location);
}

function initDisease($dataset) 
{
	global $init_disease;
	$disease = array();
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
	}
	return($disease);
}

function initDataset($dataset) 
{
	global $init_dataset;
	$dname = array();
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
	}
	return($dname);
}

function initGO($entrez)
{
	global $init_go_1,$init_go_2;
	$goterms = array();
	if(is_array($entrez) && !empty($entrez))
	{
		$conn = open_connection();
		$gene_list = '('.implode(", ",$entrez).')';
		$query = $init_go_1.$gene_list.$init_go_2;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$cat) = mysql_fetch_array($result))
		{
			$goterms[$cat][$id] = $name;
		}
		close_connection($conn);
	}
	return($goterms);
}

function initKEGG($entrez)
{
	global $init_kegg_1,$init_kegg_2;
	$keggs = array();
	if(is_array($entrez) && !empty($entrez))
	{
		$conn = open_connection();
		$gene_list = '('.implode(", ",$entrez).')';
		$query = $init_kegg_1.$gene_list.$init_kegg_2;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$class) = mysql_fetch_array($result))
		{			    
			$keggs[$class][$id] = $name;
		}
		close_connection($conn);
	}
	return($keggs);
}

function updateLocDataDisease($genes,$disease) 
{
	global $update_locdata_disease_1,$update_locdata_disease_2_1,$update_locdata_disease_2_2,$update_locdata_disease_3;
	global $update_locdata_disease_4,$update_locdata_disease_5_1,$update_locdata_disease_5_2,$update_locdata_disease_6;
	
	if(is_array($genes) && !empty($genes))
	{
		$conn = open_connection();
		#$gene_list = '(\''.implode("', '",$genes).'\')';
		$gene_list = '('.implode(", ",$genes).')';
		$query = $update_locdata_disease_1.$gene_list.$update_locdata_disease_2_1.$disease.$update_locdata_disease_2_2.$disease.
				 $update_locdata_disease_3.$update_locdata_disease_4.$gene_list.
				 $update_locdata_disease_5_1.$disease.$update_locdata_disease_5_2.$disease.$update_locdata_disease_6;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$b_0,$b_1) = mysql_fetch_array($result))
		{
			$dataset_name[$id] = utf8_encode($name);
			$loc_0[] = $b_0;
			$loc_1[] = $b_1;
		}
		close_connection($conn);
	}
		
	# Remove empty rows for each of $loc_0, $loc_1 and merge
	$location = array_merge(array_filter($loc_0),array_filter($loc_1));
	return(array("dataset" => $dataset_name, "location" => $location)); 
}

function updateDisDataLocation($genes,$location)
{
	global $update_disdata_location_1,$update_disdata_location_2_1,$update_disdata_location_2_2,$update_disdata_location_3;
	global $update_disdata_location_4,$update_disdata_location_5_1,$update_disdata_location_5_2,$update_disdata_location_6;
	
	if(is_array($genes) && !empty($genes))
	{
		$conn = open_connection();
		#$gene_list = '(\''.implode("', '",$genes).'\')';
		$gene_list = '('.implode(", ",$genes).')';
		$query = $update_disdata_location_1.$gene_list.$update_disdata_location_2_1.$location.$update_disdata_location_2_2.$location.
				 $update_disdata_location_3.$update_disdata_location_4.$gene_list.
				 $update_disdata_location_5_1.$location.$update_disdata_location_5_2.$location.$update_disdata_location_6;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$d_0,$d_1) = mysql_fetch_array($result))
		{
			$dataset_name[$id] = utf8_encode($name);
			$dis_0[] = $d_0;
			$dis_1[] = $d_1;
		}
		close_connection($conn);
	}
		
	# Remove empty rows for each of $dis_0, $dis_1 and merge
	$disease = array_merge(array_filter($dis_0),array_filter($dis_1));
	return(array("dataset" => $dataset_name, "disease" => $disease));
}

function getRegulation() {}

function getAutocompGenes($term,$species)
{		
	global $auto_genes_1,$auto_genes_2;
	$conn = open_connection();
	if ($species==999999 || empty($species) || $species=="")
	{
		$query = $auto_genes_1.'\'%'.$term.'%\'';
	}
	else { $query = $auto_genes_1.'\'%'.$term.'%\''.$auto_genes_2.$species; }
	$result = mysql_query($query,$conn);
	while (list($g,$d,$n) = mysql_fetch_array($result))
	{
		$opts[] = $g." - ".$d." - ".$n;
	}		
	close_connection($conn);
	return($opts);
}

function initNodes($entrez)
{
	global $init_nodes;
	$nodes = array();
	$conn = open_connection();
	$gene_list = '('.implode(", ",$entrez).')';
	$query = $init_nodes.$gene_list;
	$result = mysql_query($query,$conn);
	while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
	{
		$nodes[] = array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
						 "strength" => "", "expression" => "",
						 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
						 "object_type" => "gene");
	}
	close_connection($conn);
	return($nodes);
}

function initEdges($ensembl)
{
	global $init_edges_1,$init_edges_2;
	$edges = array();
	if(is_array($ensembl) && !empty($ensembl))
	{
		$conn = open_connection();
		$pro_list = '(\''.implode("', '",$ensembl).'\')';
		$query = $init_edges_1.$pro_list.$init_edges_2.$pro_list;
		$result = mysql_query($query,$conn);
		while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		{
			$edges[] = array("id" => $id, "target" => $target, "source" => $source, "interaction" => $interaction);
		}
		/*while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		{
			$edges[$interaction][] = array("id" => $id, "target" => $target, "source" => $source);
		}*/
	}
	return($edges);
}

function initDataSchema()
{
	$node_schema = array();
	$node_schema[] = array("name" => "label", "type" => "string");
	$node_schema[] = array("name" => "entrez_id", "type" => "int");
	$node_schema[] = array("name" => "strength", "type" => "string");
	$node_schema[] = array("name" => "expression", "type" => "string");
	$node_schema[] = array("name" => "ratio", "type" => "number");
	$node_schema[] = array("name" => "pvalue", "type" => "number");
	$node_schema[] = array("name" => "fdr", "type" => "number");
	$node_schema[] = array("name" => "object_type", "type" => "string");

	$edge_schema = array();
	$edge_schema[] = array("name" => "interaction", "type" => "string");

	return(array("nodes" => $node_schema, "edges" => $edge_schema));
}

?>

<?php

session_start();

include('connection.php');
include('queries.php');
include('sphinxapi.php');
include('utils.php');

/*# Get the application root
if ($_POST['root'])
{
	echo get_server_root();
}*/

# Response to Select species dropdown list or the GO button
if ($_REQUEST['species'])
{
    $species = $_REQUEST['species'];
	$genes = $_REQUEST['genes'];
	$genes = json_decode($genes,$assoc=TRUE);
    $entities = getSymbolFromAnyAndMiRNA($genes);
    $entrez = getEntrezFromSymbol($entities['symbol'],$species);
    //$entrez = $entities['entrez'];
    $mirna_in = $entities['mirna'];
    
	if (empty($entrez) && empty($mirna_in))
	{
		$resultKUPKB = array();
	}
	else
	{
		if (!empty($entrez))
		{
			$dataset = getDatasetID($entrez);
			if (empty($dataset))
			{
				$resultKUPKB = array();
			}
			else 
			{
				$disease = initDisease($dataset);
				$location = initLocation($dataset);
				$display = initDataset($dataset);
				$resultKUPKB = array("disease" => $disease, "location" => $location, "dataset" => $display);
			}
			$ms = count($species) > 1 ? TRUE : FALSE;
			$go = initGO($entrez);
			$kegg = initKEGG($entrez,$ms);
			$mirna = initmiRNA($entrez);
			$resultOther = array("go" => $go, "kegg" => $kegg, "mirna" => $mirna);
		}
		else
		{
			$resultKUPKB = array();
			$resultOther = array();
		}

		if (!empty($mirna_in))
		{
			$dataset_mirna = getMiRNADatasetID($mirna_in);
			if (empty($dataset_mirna))
			{
				$resultMiRNA = array();
			}
			else 
			{
				$disease_mirna = initMiRNADisease($dataset_mirna);
				$location_mirna = initMiRNALocation($dataset_mirna);
				$display_mirna = initMiRNADataset($dataset_mirna);
				$resultMiRNA = array("disease_mirna" => $disease_mirna, "location_mirna" => $location_mirna, "dataset_mirna" => $display_mirna);
			}
		}
		else
		{
			$resultMiRNA = array();
		}

		$result = array_merge($resultKUPKB,$resultOther,$resultMiRNA);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
		
		/*if (empty($resultKUPKB))
		{
			echo json_encode($resultOther,JSON_FORCE_OBJECT);
		}
		else
		{
			$result = array_merge($resultKUPKB,$resultOther);
			echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
		}*/

		# The proteins right now so as to assign to session (useful for calling neighbors)
		$proteins = getEnsemblFromEntrez($entrez);
		# A hack for later speed
		$kupkb_sym2ent = allKUPKBSymbols2Entrez();
	}
    
	$_SESSION['species'] = $species;
	$_SESSION['entrez'] = $entrez;
	$_SESSION['mirna'] = $mirna_in;
	$_SESSION['proteins'] = $proteins;
	$_SESSION['symbol2entrez'] = $kupkb_sym2ent[$species];
}

# Response to Select disease dropdown list
if ($_REQUEST['disease'])
{
	$disease = $_REQUEST['disease'];
	$loc = $_REQUEST['loc'];
	$entrez = $_SESSION['entrez'];
	$ehack = $_SESSION['symbol2entrez'];
	if (empty($loc) || is_null($loc) || $loc == "") { $loc = ""; }
	if (empty($entrez))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		//$result = updateLocDataDisease($entrez,$disease);
		$tmp = array_intersect($entrez,$ehack);
		$flag = empty($tmp) ? FALSE : TRUE;
		$result = updateDataOnLocationAndDisease($entrez,$disease,$loc,$flag);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

# Response to Select location dropdown list
if ($_REQUEST['location'])
{
	$location = $_REQUEST['location'];
	$dis = $_REQUEST['dis'];
	$entrez = $_SESSION['entrez'];
	$ehack = $_SESSION['symbol2entrez'];
	if (empty($dis) || is_null($dis) || $dis == "") { $dis = ""; }
	if (empty($entrez))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		//$result = updateDisDataLocation($entrez,$location);
		$tmp = array_intersect($entrez,$ehack);
		$flag = empty($tmp) ? FALSE : TRUE;
		$result = updateDataOnLocationAndDisease($entrez,$dis,$location,$flag);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

if ($_REQUEST['dataset'])
{
	$dataset = $_REQUEST['dataset'];
	$location = $_REQUEST['location_data'];
	$disease = $_REQUEST['disease_data'];
	$annotation = $_REQUEST['annotation'];
	$genes = $_SESSION['entrez'];
	$result = getRegulation($genes,$dataset,$disease,$location,$annotation);
	//echo json_encode($result | JSON_NUMERIC_CHECK);
	echo json_encode($result);
}

# Response to Select disease mirna dropdown list
if ($_REQUEST['disease_mirna'])
{
	$disease = $_REQUEST['disease_mirna'];
	$loc = $_REQUEST['loc_mirna'];
	$mirna = $_SESSION['mirna'];
	if (empty($loc) || is_null($loc) || $loc == "") { $loc = ""; }
	if (empty($mirna))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		//$result = updateMiRNALocDataDisease($mirna,$disease);
		$result = updateMiRNADataOnLocationAndDisease($mirna,$disease,$loc);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

# Response to Select location mirna dropdown list
if ($_REQUEST['location_mirna'])
{
	$location = $_REQUEST['location_mirna'];
	$dis = $_REQUEST['dis_mirna'];
	$mirna = $_SESSION['mirna'];
	if (empty($dis) || is_null($dis) || $dis == "") { $dis = ""; }
	if (empty($mirna))
	{
		$result = array();
		echo json_encode($result,JSON_FORCE_OBJECT);
	}
	else 
	{
		//$result = updateMiRNADisDataLocation($mirna,$location);
		$result = updateMiRNADataOnLocationAndDisease($mirna,$dis,$location);
		echo json_encode($result,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	}
}

if ($_REQUEST['dataset_mirna'])
{
	$dataset = $_REQUEST['dataset_mirna'];
	$location = $_REQUEST['location_mirna_data'];
	$disease = $_REQUEST['disease_mirna_data'];
	$annotation = $_REQUEST['annotation'];
	$mirnas = $_SESSION['mirna'];
	$result = getMiRNARegulation($mirnas,$dataset,$disease,$location,$annotation);
	echo json_encode($result);
}

if ($_REQUEST['remove_mirna'])
{
	$remove_mirna = $_REQUEST['remove_mirna'];
	$current_mirna = $_SESSION['mirna'];
	$remove_mirna = json_decode($remove_mirna,$assoc=TRUE);
	$stay_mirna = array_diff($current_mirna,$remove_mirna);
	if (!empty($stay_mirna))
	{
		$dataset_mirna = getMiRNADatasetID($stay_mirna);
		if (empty($dataset_mirna))
		{
			$resultMiRNA = array();
		}
		else
		{
			$disease_mirna = initMiRNADisease($dataset_mirna);
			$location_mirna = initMiRNALocation($dataset_mirna);
			$display_mirna = initMiRNADataset($dataset_mirna);
			$resultMiRNA = array("disease_mirna" => $disease_mirna, "location_mirna" => $location_mirna, "dataset_mirna" => $display_mirna);
		}
	}
	else
	{
		$resultMiRNA = array();
	}

	$_SESSION['mirna'] = $stay_mirna;
	echo json_encode($resultMiRNA,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
}

if ($_REQUEST['add_mirna'])
{
	# They have been already added to the session because of getmirnaElements function
	$add_mirna = $_SESSION['mirna'];
	if (!empty($add_mirna))
	{
		$dataset_mirna = getMiRNADatasetID($add_mirna);
		if (empty($dataset_mirna))
		{
			$resultMiRNA = array();
		}
		else
		{
			$disease_mirna = initMiRNADisease($dataset_mirna);
			$location_mirna = initMiRNALocation($dataset_mirna);
			$display_mirna = initMiRNADataset($dataset_mirna);
			$resultMiRNA = array("disease_mirna" => $disease_mirna, "location_mirna" => $location_mirna, "dataset_mirna" => $display_mirna);
		}
	}
	else
	{
		$resultMiRNA = array();
	}
	echo json_encode($resultMiRNA,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
}

# Response to gene symbol request
if ($_REQUEST['symbol'])
{
	$symbols = getSymbolFromEntrez($_SESSION['entrez']);
	$mirnas = empty($_SESSION['mirna']) ? array() : $_SESSION['mirna'];
	if (!is_array($mirnas)) { $mirnas = array($mirnas); }
	echo json_encode(array_merge($symbols,$mirnas));
}

# Response to AJAX network construction
if ($_REQUEST['network']) // The network!
{
	$score = $_REQUEST['score'];
	$entrez = $_SESSION['entrez'];
	$mirna = $_SESSION['mirna'];
	$proteins = $_SESSION['proteins'];
	$species = $_SESSION['species'];
	$ms = count($species) > 1 ? TRUE : FALSE;
	$schema = initDataSchema();
	$nodes = initNodes($entrez,$mirna,$ms);
	$edges = initEdges($proteins,$score,$ms);

	# Add additional input miRNA edges if any
	if (!empty($mirna))
	{
		$mir_els = getmirnaElements($mirna,$proteins);
		foreach ($mir_els as $key => $value)
		{
			if ($value['group'] === "edges")
			{
				$edges[] = $value['data'];
			}
		}
	}
	
	$resultNetwork = array("dataSchema" => $schema, "data" => array("nodes" => $nodes, "edges" => $edges));
	#echo json_encode($resultNetwork,JSON_NUMERIC_CHECK);
	echo json_encode($resultNetwork);
}

# Response to Select GO terms multi-select list
if ($_REQUEST['go'])
{
	$proteins = $_SESSION['proteins'];
	$species = $_SESSION['species'];
	$gots = $_REQUEST['go'];
	$gots = json_decode($gots,$assoc=TRUE);
	$ms = count($species) > 1 ? TRUE : FALSE;
	$elements = getGOElements($gots,$proteins,$ms);
	echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to Select KEGG pathways multi-select list
if ($_REQUEST['kegg'])
{
    $proteins = $_SESSION['proteins'];
    $species = $_SESSION['species'];
    $keggs = $_REQUEST['kegg'];
    $keggs = json_decode($keggs,$assoc=TRUE);
    $ms = count($species) > 1 ? TRUE : FALSE;
    $elements = getKEGGElements($keggs,$proteins,$ms);
    echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to Select miRNA multi-select list
if ($_REQUEST['mirna'])
{
    $proteins = $_SESSION['proteins'];
    $species = $_SESSION['species'];
    $mirnas = $_REQUEST['mirna'];
    $mirnas = json_decode($mirnas,$assoc=TRUE);
    $ms = count($species) > 1 ? TRUE : FALSE;
    $elements = getmiRNAElements($mirnas,$proteins,$ms);
    echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to get neighbor queries
if ($_REQUEST['level'])
{
	$level = $_REQUEST['level'];
	$node = $_REQUEST['node'];
	$nodes = $_REQUEST['nodes'];
	$ns = $_REQUEST['ns'];
	$es = $_REQUEST['es'];
	$cdata = $_REQUEST['currset'];
	$score = $_REQUEST['score'];
	$species = $_SESSION['species'];
	$ms = count($species) > 1 ? TRUE : FALSE;
	$node = json_decode($node,$assoc=TRUE);
	$nodes = json_decode($nodes,$assoc=TRUE);
	$cdata = json_decode($cdata,$assoc=TRUE);
	$elements = getNeighbors($node,$nodes,$level,$ns,$es,$cdata,$score,$ms);
	echo json_encode($elements);
	//echo json_encode($elements['elements']);
}

# Response to gene node selection
if ($_REQUEST['gene_data'])
{
    $the_gene = $_REQUEST['gene_data'];
    $gene_data = getGeneData($the_gene,$_SESSION['species']);
    echo json_encode($gene_data,JSON_NUMERIC_CHECK);
}

# Response to dataset report request
if ($_REQUEST['dataset_report'])
{
    $the_dataset = $_REQUEST['dataset_report'];
    $report = getDatasetReport($the_dataset);
    echo json_encode($report);
}

# Response to gene to gene or pathway to gene edge selection
if ($_REQUEST['target_data'])
{
	$the_target = $_REQUEST['target_data'];
    $the_source = $_REQUEST['source_data'];
    $the_data = is_null($the_source) ? getPathway2GeneData($the_target) :
		getGene2GeneData($the_source,$the_target);
    echo json_encode($the_data,JSON_NUMERIC_CHECK);
}

if ($_REQUEST['suggest_term'])
{		
	$term = $_REQUEST['suggest_term'];
	$species = $_REQUEST['suggest_species'];
	try
	{
		$result = getIndexedGenes($term,$species);
	}
	catch(Exception $e) // Safety swicth in case the indexer fails!
	{
		$result = getAutocompGenes($term,$species);
	}
	echo json_encode($result,JSON_FORCE_OBJECT);
}

if ($_GET['export'])
{
	$type = $_GET['export'];
	$data = file_get_contents("php://input");
	switch($type)
	{
		case "png":
			header('Content-type: image/png');
			break;
		case "pdf":
			header('Content-type: application/pdf');
			break;
		case "svg":
			header('Content-type: image/svg+xml');
			break;
		case "xgmml":
			header('Content-type: text/xml');
			break;
		case "graphml":
			header('Content-type: text/xml');
			break;
		case "sif":
			header('Content-type: text/plain');
			break;
    }
    # Force the browser to download the file
    $suff = date('YmdHis');
    header('Content-disposition: attachment; filename="network'.$suff.'.'.$type .'"');
    # Send the data to the browser:
    print $data;
}

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

function getSymbolFromAnyAndMiRNA($terms)
{					
	global $symbol_from_any_1,$symbol_from_any_3;
	global $symbol_from_any_2_1,$symbol_from_any_2_2,$symbol_from_any_2_3,$symbol_from_any_2_4,$symbol_from_any_2_5;
	global $union_mirna;
	global $mirna_from_input_1,$mirna_from_input_2;
	$symbol = array();
	$mirna = array();
	
	$conn = open_connection();
	$list_of_genes = is_array($terms) ? implode("', '",$terms) : $terms;
	# Gene part
	$query = $symbol_from_any_1.
			 $symbol_from_any_2_1.'(\''.$list_of_genes.'\')'.
			 $symbol_from_any_2_2.'(\''.$list_of_genes.'\')'.
			 $symbol_from_any_2_3.'(\''.$list_of_genes.'\')'.
			 $symbol_from_any_2_4.'(\''.$list_of_genes.'\')'.
			 $symbol_from_any_2_5.'(\''.$list_of_genes.'\')'.
			 $symbol_from_any_3;
	# miRNA part
	$query .= $union_mirna.
			  $mirna_from_input_1.'(\''.$list_of_genes.'\')'.$mirna_from_input_2;
	$result = mysql_query($query,$conn);
	while (list($entity,$sym,$type) = mysql_fetch_array($result))
	{
		if ($type == "gene")
		{
			$symbol[] = $sym;
		}
		else if ($type == "mirna")
		{
			$mirna[] = $entity;
		}
	}
	close_connection($conn);
	return(array("symbol" => $symbol, "mirna" => $mirna));
}

function getSymbolFromEntrez($entrez)
{					
	global $symbol_from_entrez;
	$symbol = array();
	$conn = open_connection();
	$list_of_genes = is_array($entrez) ? implode(", ",$entrez) : $entrez;
	$query = $symbol_from_entrez.'('.$list_of_genes.')';
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$symbol[] = $row[0];
	}		
	close_connection($conn);
	return($symbol);
}

function getEntrezFromSymbol($genes,$species)
{					
	global $entrez_from_symbol_1,$entrez_from_symbol_2;
	$conn = open_connection();
	$list_of_genes = is_array($genes) ? implode("', '",$genes) : $genes;
	$list_of_species = is_array($species) ? implode(", ",$species) : $species;
	$query = $entrez_from_symbol_1.'(\''.$list_of_genes.'\')'.$entrez_from_symbol_2.'('.$list_of_species.')';
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
	global $dataset_id_1,$dataset_id_2,$dataset_id_3;
	$dataset = array();		
	if(is_array($entrez) && !empty($entrez))
	{
		$conn = open_connection();			
		$tmp_list = '('.implode(", ",$entrez).')';			
		$query = $dataset_id_1.$tmp_list.$dataset_id_2.$tmp_list.$dataset_id_3.$tmp_list;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$dataset[] = $row[0];
		}
		close_connection($conn);
	}
	return($dataset);
}

function getMiRNADatasetID($mirna)
{
	global $mirna_dataset_id;
	$dataset = array();
	if (!is_array($mirna)) { $mirna = array($mirna); }
	if(!empty($mirna))
	{
		$conn = open_connection();			
		$tmp_list = '(\''.implode("', '",$mirna).'\')';			
		$query = $mirna_dataset_id.$tmp_list;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$dataset[] = $row[0];
		}
		close_connection($conn);
	}
	return($dataset);
}

function updateDataOnLocationAndDisease($genes,$disease,$location,$hackflag) 
{
	global $update_locdisdata_1,$update_locdisdata_3,$update_locdisdata_5,$update_locdisdata_7;
	global $update_locdisdata_2_1,$update_locdisdata_2_2,$update_locdisdata_2_3,$update_locdisdata_2_4;
	global $update_locdisdata_4_1,$update_locdisdata_4_2,$update_locdisdata_4_3,$update_locdisdata_4_4;
	global $update_locdisdata_6_1,$update_locdisdata_6_2,$update_locdisdata_6_3,$update_locdisdata_6_4;
	$dataset_name = array("none" => "---no dataset selected---");
	
	if(!empty($genes))
	{
		$conn = open_connection();
		$gene_list = is_array($genes) ? '('.implode(", ",$genes).')' : '('.$genes.')';
		$disease_list = is_array($disease) ? '(\''.implode("', '",$disease).'\')' : '(\''.$disease.'\')';
		$location_list = is_array($location) ? '(\''.implode("', '",$location).'\')' : '(\''.$location.'\')';
		if (!empty($disease) && !empty($location))
		{	
			$query = $update_locdisdata_1.$gene_list.
					 $update_locdisdata_2_1.$disease_list.$update_locdisdata_2_2.$disease_list.
					 $update_locdisdata_2_3.$location_list.$update_locdisdata_2_4.$location_list.
					 $update_locdisdata_3.$gene_list.
					 $update_locdisdata_4_1.$disease_list.$update_locdisdata_4_2.$disease_list.
					 $update_locdisdata_4_3.$location_list.$update_locdisdata_4_4.$location_list;
			if ($hackflag)
			{
				$query = $query.
						 $update_locdisdata_5.$gene_list.
						 $update_locdisdata_6_1.$disease_list.$update_locdisdata_6_2.$disease_list.
						 $update_locdisdata_6_3.$location_list.$update_locdisdata_6_4.$location_list;
			}
			$query = $query.$update_locdisdata_7;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
				$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
				$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
				$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
				$loc_0[$b_0] = $bc_0;
				$loc_1[$b_1] = $bc_1;
				$dis_0[$d_0] = $dc_0;
				$dis_1[$d_1] = $dc_1;
			}
			$location_return = array_merge($loc_0,$loc_1);
			$disease_return = array_merge($dis_0,$dis_1);
			natcasesort($location_return);
			natcasesort($disease_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "disease" => $disease_return, "location" => $location_return));
		}
		else if (!empty($disease) && empty($location))
		{
			$query = $update_locdisdata_1.$gene_list.
					 $update_locdisdata_2_1.$disease_list.$update_locdisdata_2_2.$disease_list.
					 $update_locdisdata_3.$gene_list.
					 $update_locdisdata_4_1.$disease_list.$update_locdisdata_4_2.$disease_list;
			if ($hackflag)
			{
				$query = $query.
						 $update_locdisdata_5.$gene_list.
						 $update_locdisdata_6_1.$disease_list.$update_locdisdata_6_2.$disease_list;
			}
			$query = $query.$update_locdisdata_7;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
				$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
				$loc_0[$b_0] = $bc_0;
				$loc_1[$b_1] = $bc_1;
			}
			$location_return = array_merge($loc_0,$loc_1);
			natcasesort($location_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "location" => $location_return));
		}
		else if (empty($disease) && !empty($location))
		{
			$update_locdisdata_2_3 = substr($update_locdisdata_2_3,1,strlen($update_locdisdata_2_3)-1);
			$update_locdisdata_4_3 = substr($update_locdisdata_4_3,1,strlen($update_locdisdata_4_3)-1);
			$update_locdisdata_6_3 = substr($update_locdisdata_6_3,1,strlen($update_locdisdata_6_3)-1);
			$query = $update_locdisdata_1.$gene_list.
					 $update_locdisdata_2_3.$location_list.$update_locdisdata_2_4.$location_list.
					 $update_locdisdata_3.$gene_list.
					 $update_locdisdata_4_3.$location_list.$update_locdisdata_4_4.$location_list;
			if ($hackflag)
			{
				$query = $query.
						 $update_locdisdata_5.$gene_list.
						 $update_locdisdata_6_3.$location_list.$update_locdisdata_6_4.$location_list;
			}
			$query = $query.$update_locdisdata_7;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
				$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
				$dis_0[$d_0] = $dc_0;
				$dis_1[$d_1] = $dc_1;
			}
			$disease_return = array_merge($dis_0,$dis_1);
			natcasesort($disease_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "disease" => $disease_return));
		}
		/*else
		{
			$update_locdisdata_3 = substr($update_locdisdata_3,1,strlen($update_locdisdata_3)-1);
			$update_locdisdata_5 = substr($update_locdisdata_5,1,strlen($update_locdisdata_5)-1);
			$query = $update_locdisdata_1.$gene_list.
					 $update_locdisdata_3.$gene_list;
			if ($hackflag)
			{
				$query = $query.$update_locdisdata_5.$gene_list;
			}
		}*/
		close_connection($conn);
	}
}

function updateMiRNADataOnLocationAndDisease($mirnas,$disease,$location) 
{
	global $update_mirna_dislocdata_1,$update_mirna_dislocdata_3;
	global $update_mirna_dislocdata_2_1,$update_mirna_dislocdata_2_2;
	global $update_mirna_dislocdata_2_3,$update_mirna_dislocdata_2_4;

	$dataset_name = array("none" => "---no dataset selected---");
	if (!is_array($mirnas)) { $mirnas = array($mirnas); }

	if(!empty($mirnas))
	{
		$conn = open_connection();
		$mirna_list = is_array($mirnas) ? '(\''.implode("', '",$mirnas).'\')' : '(\''.$mirnas.'\')';
		$disease_list = is_array($disease) ? '(\''.implode("', '",$disease).'\')' : '(\''.$disease.'\')';
		$location_list = is_array($location) ? '(\''.implode("', '",$location).'\')' : '(\''.$location.'\')';
		if (!empty($disease) && !empty($location))
		{	
			$query = $update_mirna_dislocdata_1.$mirna_list.
					 $update_mirna_dislocdata_2_1.$disease_list.$update_mirna_dislocdata_2_2.$disease_list.
					 $update_mirna_dislocdata_2_3.$location_list.$update_mirna_dislocdata_2_4.$location_list.
					 $update_mirna_dislocdata_3;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
				$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
				$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
				$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
				$loc_0[$b_0] = $bc_0;
				$loc_1[$b_1] = $bc_1;
				$dis_0[$d_0] = $dc_0;
				$dis_1[$d_1] = $dc_1;
			}
			$location_return = array_merge($loc_0,$loc_1);
			$disease_return = array_merge($dis_0,$dis_1);
			natcasesort($location_return);
			natcasesort($disease_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "disease" => $disease_return, "location" => $location_return));
		}
		else if (!empty($disease) && empty($location))
		{
			$query = $update_mirna_dislocdata_1.$mirna_list.
					 $update_mirna_dislocdata_2_1.$disease_list.$update_mirna_dislocdata_2_2.$disease_list.
					 $update_mirna_dislocdata_3;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
				$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
				$loc_0[$b_0] = $bc_0;
				$loc_1[$b_1] = $bc_1;
			}
			$location_return = array_merge($loc_0,$loc_1);
			natcasesort($location_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "location" => $location_return));
		}
		else if (empty($disease) && !empty($location))
		{
			$update_mirna_dislocdata_2_3 = substr($update_mirna_dislocdata_2_3,1,strlen($update_mirna_dislocdata_2_3)-1);
			$query = $update_mirna_dislocdata_1.$mirna_list.
					 $update_mirna_dislocdata_2_3.$location_list.$update_mirna_dislocdata_2_4.$location_list.
					 $update_mirna_dislocdata_3;
			$result = mysql_query($query,$conn);
			while (list($id,$name,$d_0,$d_1,$b_0,$b_1) = mysql_fetch_array($result))
			{
				$dataset_name[$id] = utf8_encode($name);
				$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
				$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
				$dis_0[$d_0] = $dc_0;
				$dis_1[$d_1] = $dc_1;
			}
			$disease_return = array_merge($dis_0,$dis_1);
			natcasesort($disease_return);
			natcasesort($dataset_name);
			return(array("dataset" => $dataset_name, "disease" => $disease_return));
		}
		/*else
		{
			$update_mirna_dislocdata_3 = substr($update_mirna_dislocdata_3,1,strlen($update_mirna_dislocdata_3)-1);
			$query = $update_mirna_dislocdata_1.$mirna_list.$update_mirna_dislocdata_3;
		}*/
		close_connection($conn);
	}
}

function getRegulation($genes,$dataset,$disease,$location,$annotation)
{
	global $get_coloring_1,$get_coloring_3,$get_coloring_5,$get_coloring_7;
	global $get_coloring_2_1,$get_coloring_2_2,$get_coloring_2_3,$get_coloring_2_4,$get_coloring_2_5;
	global $get_coloring_4_1,$get_coloring_4_2,$get_coloring_4_3,$get_coloring_4_4,$get_coloring_4_5;
	global $get_coloring_6_1,$get_coloring_6_2,$get_coloring_6_3,$get_coloring_6_4,$get_coloring_6_5;
	$color_data = array();

	if(!empty($genes) && !empty($dataset))
	{
		# When we have a multiple select list, the incoming result is an array
		if (!is_array($dataset)) { $dataset = array($dataset); }
		$dataset = '(\''.implode("', '",$dataset).'\')';

		$conn = open_connection();
		$gene_list = is_array($genes) ? '('.implode(", ",$genes).')' : '('.$genes.')';
		$disease_list = is_array($disease) ? '(\''.implode("', '",$disease).'\')' : '(\''.$disease.'\')';
		$location_list = is_array($location) ? '(\''.implode("', '",$location).'\')' : '(\''.$location.'\')';
		if (!empty($disease) && !empty($location))
		{	
			$query = $get_coloring_1.$gene_list.$get_coloring_2_1.$dataset.
					 $get_coloring_2_2.$disease_list.$get_coloring_2_3.$disease_list.
					 $get_coloring_2_4.$location_list.$get_coloring_2_5.$location_list.
					 $get_coloring_3.$gene_list.$get_coloring_4_1.$dataset.
					 $get_coloring_4_2.$disease_list.$get_coloring_4_3.$disease_list.
					 $get_coloring_4_4.$location_list.$get_coloring_4_5.$location_list.
					 $get_coloring_5.$gene_list.$get_coloring_6_1.$dataset.
					 $get_coloring_6_2.$disease_list.$get_coloring_6_3.$disease_list.
					 $get_coloring_6_4.$location_list.$get_coloring_6_5.$location_list.
					 $get_coloring_7;
		}
		else if (!empty($disease) && empty($location))
		{
			$query = $get_coloring_1.$gene_list.$get_coloring_2_1.$dataset.
					 $get_coloring_2_2.$disease_list.$get_coloring_2_3.$disease_list.
					 $get_coloring_3.$gene_list.$get_coloring_4_1.$dataset.
					 $get_coloring_4_2.$disease_list.$get_coloring_4_3.$disease_list.
					 $get_coloring_5.$gene_list.$get_coloring_6_1.$dataset.
					 $get_coloring_6_2.$disease_list.$get_coloring_6_3.$disease_list.
					 $get_coloring_7;
		}
		else if (empty($disease) && !empty($location))
		{
			$get_coloring_2_4 = substr($get_coloring_2_4,1,strlen($get_coloring_2_4)-1);
			$get_coloring_4_4 = substr($get_coloring_4_4,1,strlen($get_coloring_4_4)-1);
			$get_coloring_6_4 = substr($get_coloring_6_4,1,strlen($get_coloring_6_4)-1);
			$query = $get_coloring_1.$gene_list.$get_coloring_2_1.$dataset.
					 $get_coloring_2_4.$location_list.$get_coloring_2_5.$location_list.
					 $get_coloring_3.$gene_list.$get_coloring_4_1.$dataset.
					 $get_coloring_4_4.$location_list.$get_coloring_4_5.$location_list.
					 $get_coloring_5.$gene_list.$get_coloring_6_1.$dataset.
					 $get_coloring_6_4.$location_list.$get_coloring_6_5.$location_list.
					 $get_coloring_7;
		}
		else
		{
			$get_coloring_3 = substr($get_coloring_3,1,strlen($get_coloring_3)-1);
			$get_coloring_5 = substr($get_coloring_5,1,strlen($get_coloring_5)-1);
			$query = $get_coloring_1.$gene_list.$get_coloring_2_1.$dataset.
					 $get_coloring_3.$gene_list.$get_coloring_4_1.$dataset;
					 $get_coloring_5.$gene_list.$get_coloring_6_1.$dataset;
		}
		//echo $query;
		$result = mysql_query($query,$conn);
		while (list($record_id,$dataset_id,$display_name,$d0,$d1,$b0,$b1,$cpl,$entrez_id,$sym,$expr_strength,$expr_de,$ratio,$pvalue,$fdr) = mysql_fetch_array($result))
		{
			if (preg_match('/^protein/i',$cpl))
			{
				$type = "protein";
			}
			else if (preg_match('/^phospho/i',$cpl))
			{
				$type = "phosphoprotein";
			}
			else
			{
				$type = "gene";
			}
			if ($annotation['disease'] == 1)
			{
				/*if (isAnomaly($dataset_id)) { $dep1 = $d1; }
				else { $dep1 = empty($d0) ? $d1 : $d0; }*/
				$dep1 = empty($d1) ? $d0 : $d1;
				$dep1 = empty($dep1) ? "" : $dep1."\n";
			}
			else { $dep1 = ""; }
			if ($annotation['location'] == 1)
			{
				//$dep2 = empty($b0) ? $b1 : $b0;\
				$dep2 = empty($b1) ? $b0 : $b1;
				$dep2 = empty($dep2) ? "" : $dep2."\n";
			} else { $dep2 = ""; }
			if ($annotation['type'] == 1)
			{
				$dep3 = $type."\n";
			} else { $dep3 = ""; }
			$dep4 = $annotation['dataset'] == 1 ? utf8_encode($display_name) : "";
			$desc = $dep1.$dep2.$dep3.$dep4;
			//$type = preg_match('/protein/i',$cpl) ? "protein" : "gene";
			$color_data[] = array("entrez_id" => $entrez_id, "gene_symbol" => strtolower($sym), "strength" => $expr_strength, 
								  "expression" => $expr_de, "ratio" => $ratio, "pvalue" => $pvalue, "fdr" => $fdr, 
								  "dataset_id" => $dataset_id,"custom" => $desc, "type" => $type);
		}
		close_connection($conn);
	}

	return($color_data);
}

function getMiRNARegulation($mirnas,$dataset,$disease,$location,$annotation)
{
	global $get_mirna_coloring_1,$get_mirna_coloring_3;
	global $get_mirna_coloring_2_1,$get_mirna_coloring_2_2,$get_mirna_coloring_2_3,$get_mirna_coloring_2_4,$get_mirna_coloring_2_5;
	$color_data = array();

	if(!empty($mirnas) && !empty($dataset))
	{
		# When we have a multiple select list, the incoming result is an array
		if (!is_array($dataset)) { $dataset = array($dataset); }
		$dataset = '(\''.implode("', '",$dataset).'\')';

		$conn = open_connection();
		$mirna_list = is_array($mirnas) ? '(\''.implode("', '",$mirnas).'\')' : '(\''.$mirnas.'\')';
		$disease_list = is_array($disease) ? '(\''.implode("', '",$disease).'\')' : '(\''.$disease.'\')';
		$location_list = is_array($location) ? '(\''.implode("', '",$location).'\')' : '(\''.$location.'\')';
		if (!empty($disease) && !empty($location))
		{	
			$query = $get_mirna_coloring_1.$mirna_list.$get_mirna_coloring_2_1.$dataset.
					 $get_mirna_coloring_2_2.$disease_list.$get_mirna_coloring_2_3.$disease_list.
					 $get_mirna_coloring_2_4.$location_list.$get_mirna_coloring_2_5.$location_list.
					 $get_mirna_coloring_3;
		}
		else if (!empty($disease) && empty($location))
		{
			$query = $get_mirna_coloring_1.$mirna_list.$get_mirna_coloring_2_1.$dataset.
					 $get_mirna_coloring_2_2.$disease_list.$get_mirna_coloring_2_3.$disease_list.
					 $get_mirna_coloring_3;
		}
		else if (empty($disease) && !empty($location))
		{
			$get_mirna_coloring_2_4 = substr($get_mirna_coloring_2_4,1,strlen($get_mirna_coloring_2_4)-1);
			$query = $get_mirna_coloring_1.$mirna_list.$get_mirna_coloring_2_1.$dataset.
					 $get_mirna_coloring_2_4.$location_list.$get_mirna_coloring_2_5.$location_list.
					 $get_mirna_coloring_3;
		}
		else
		{
			$get_mirna_coloring_3 = substr($get_mirna_coloring_3,1,strlen($get_mirna_coloring_3)-1);
			$query = $get_mirna_coloring_1.$mirna_list.$get_mirna_coloring_2_1.$dataset.
					 $get_mirna_coloring_3;
		}
		$result = mysql_query($query,$conn);
		while (list($record_id,$dataset_id,$display_name,$d0,$d1,$b0,$b1,$microcosm_id,$expr_strength,$expr_de,$ratio,$pvalue,$fdr) = mysql_fetch_array($result))
		{
			if ($annotation['disease'] == 1)
			{
				$dep1 = empty($d0) ? $d1 : $d0;
				$dep1 = empty($dep1) ? "" : $dep1."\n";
			}
			else { $dep1 = ""; }
			if ($annotation['location'] == 1)
			{
				$dep2 = empty($b0) ? $b1 : $b0;
				$dep2 = empty($dep2) ? "" : $dep2."\n";
			} else { $dep2 = ""; }
			$dep3 = $annotation['type'] == 1 ? "miRNA\n" : "";
			$dep4 = $annotation['dataset'] == 1 ? utf8_encode($display_name) : "";
			$desc = $dep1.$dep2.$dep3.$dep4;
			$type = "mirna";
			$color_data[] = array("entrez_id" => $microcosm_id, "strength" => $expr_strength, "expression" => $expr_de,
								  "ratio" => $ratio, "pvalue" => $pvalue, "fdr" => $fdr, "dataset_id" => $dataset_id,
								  "custom" => $desc, "type" => $type);
		}
		close_connection($conn);
	}

	return($color_data);
}

# Old function but we are keeping it for possible future or machine based incompatibilities
# with the sphinx indexer
function getAutocompGenes($term,$species)
{		
	global $auto_genes_1,$auto_genes_2;
	$conn = open_connection();
	if ($species==999999 || empty($species) || $species=="")
	{
		$query = $auto_genes_1.'\'%'.$term.'%\'';
	}
	else
	{
		$list_of_species = is_array($species) ? implode(", ",$species) : $species;
		$query = $auto_genes_1.'\'%'.$term.'%\''.$auto_genes_2.'('.$species.')';
	}
	$result = mysql_query($query,$conn);
	while (list($g,$d,$n) = mysql_fetch_array($result))
	{
		$opts[] = $g." - ".$d." - ".$n;
	}
	close_connection($conn);
	return($opts);
}

function getGOElements($gots,$ensembl,$ms)
{
	global $get_go_1,$get_go_2;
	global $init_super_edge_hash;
	$go_nodes = array();
	$go_edges = array();
	$visited_go = array();
	$visited_rel = array();
	$eshash = array();
	if(!empty($ensembl) && !empty($gots))
	{
		$conn = open_connection();			
		$protein_list = is_array($ensembl) ? implode("', '",$ensembl) : $ensembl;
		$go_list = is_array($gots) ? implode("', '",$gots) : $gots;	
		$query = $get_go_1.'(\''.$protein_list.'\')'.$get_go_2.'(\''.$go_list.'\')';
		$result = mysql_query($query,$conn);
		while (list($edge_id,$entrez_id,$go_id,$go_term,$category,$pubmed,$protein) = mysql_fetch_array($result))
		{
			if ($visited_go[$go_id] != 1)
			{
				$go_nodes[] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
									"data" => array("id" => $go_id, "label" => $go_term, "entrez_id" => $go_id,
													"strength" => "", "expression" => "",
													"ratio" => 999, "pvalue" => 999, "fdr" => 999,
													"object_type" => strtolower($category), "custom" => $protein));
				$visited_go[$go_id] = 1;
			}
			if ($visited_rel[$edge_id] != 1) // Some pubmeds can cause damage
			{
				$link = $pubmed === "-" ? "" : "http://www.ncbi.nlm.nih.gov/pubmed/".$pubmed;
				$go_edges[] = array("group" => "edges",
									"data" => array("id" => $edge_id, "target" => $protein, "source" => $go_id,
													"interaction" => "go", "custom" => $link));
				$visited_rel[$edge_id] = 1;
			}
		}

		if ($ms)
		{
			$query = $init_super_edge_hash.'(\''.$protein_list.'\')';
			$result = mysql_query($query,$conn);
			while(list($pro,$sym) = mysql_fetch_array($result))
			{
				$sehash[$pro] = $sym;
			}
			foreach ($go_nodes as $gn)
			{
				$go_edges[] = array("group" => "edges",
								    "data" => array( "id" => $gn['data']['id']."_to_".$sehash[$gn['data']['custom']],
								    "target" => $sehash[$gn['data']['custom']], "source" => $gn['data']['id'],
								    "label" => "go","interaction" => "supergo", "custom" => $gn['data']['label']));
			}
		}
		close_connection($conn);
	}
	return(array_merge($go_nodes,$go_edges));
}

function getKEGGElements($keggs,$ensembl,$ms)
{
    global $get_kegg_1,$get_kegg_2;
    global $get_kegg_multi_1,$get_kegg_multi_2;
    global $init_super_edge_hash;
    $kegg_nodes = array();
    $kegg_edges = array();
    $visited_kegg = array();
    $visited_rel = array();
    $sehash = array();
    if(!empty($ensembl) && !empty($keggs))
    {
        $conn = open_connection();
        $protein_list = is_array($ensembl) ? implode("', '",$ensembl) : $ensembl;
        $kegg_list = is_array($keggs) ? implode("', '",$keggs) : $keggs;    
        $query = !$ms ? $get_kegg_1.'(\''.$protein_list.'\')'.$get_kegg_2.'(\''.$kegg_list.'\')' :
			$get_kegg_multi_1.'(\''.$protein_list.'\')'.$get_kegg_multi_2.'(\''.$kegg_list.'\')';
        $result = mysql_query($query,$conn);
        while (list($edge_id,$entrez_id,$kegg_id,$kegg_name,$kegg_class,$protein) = mysql_fetch_array($result))
        {
            if ($visited_kegg[$kegg_id] != 1)
            {
				// OK, I am exploiting the text type of "strength" to avoid an AJAX call just to get
				// the KEGG class for displaying KEGG node properties
                $kegg_nodes[] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
                                      "data" => array("id" => $kegg_id, "label" => $kegg_name, "entrez_id" => $kegg_id,
                                                      "strength" => $kegg_class, "expression" => "",
                                                      "ratio" => 999, "pvalue" => 999, "fdr" => 999,
                                                      "object_type" => "pathway", "custom" => $protein));
                $visited_kegg[$kegg_id] = 1;
            }
            if ($visited_rel[$edge_id] != 1) // Just in case... to be removed...
            {
                $kegg_edges[] = array("group" => "edges",
                                      "data" => array("id" => $edge_id, "target" => $protein, "source" => $kegg_id,
                                      "interaction" => "kegg", "custom" => $kegg_name));
                $visited_rel[$edge_id] = 1;
            }
        }

        if ($ms)
		{
			$query = $init_super_edge_hash.'(\''.$protein_list.'\')';
			$result = mysql_query($query,$conn);
			while(list($pro,$sym) = mysql_fetch_array($result))
			{
				$sehash[$pro] = $sym;
			}
			foreach ($kegg_nodes as $kn)
			{
				$kegg_edges[] = array("group" => "edges",
									  "data" => array( "id" => $kn['data']['id']."_to_".$sehash[$kn['data']['custom']],
									  "target" => $sehash[$kn['data']['custom']], "source" => $kn['data']['id'],
									  "label" => "kegg","interaction" => "superkegg", "custom" => $kn['data']['label']));
			}
		}
		
        close_connection($conn);
    }
    return(array_merge($kegg_nodes,$kegg_edges));
}

function getmirnaElements($mirnas,$ensembl,$ms)
{
	global $get_mirna_1,$get_mirna_2;
	global $init_super_edge_hash;
	$session_mirna = $_SESSION['mirna'];
	$mirna_nodes = array();
	$mirna_edges = array();
	$visited_mirna = array();
	$visited_rel = array();
	$ehash = array();
	if(!empty($ensembl) && !empty($mirnas))
    {
        $conn = open_connection();
        $protein_list = is_array($ensembl) ? implode("', '",$ensembl) : $ensembl;
        $mirna_list = is_array($mirnas) ? implode("', '",$mirnas) : $mirnas;    
        $query = $get_mirna_1.'(\''.$protein_list.'\')'.$get_mirna_2.'(\''.$mirna_list.'\')';
        $result = mysql_query($query,$conn);
        while (list($edge_id,$mirna_id,$protein) = mysql_fetch_array($result))
        {
            if ($visited_mirna[$mirna_id] != 1)
            {
                $mirna_nodes[] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
                                       "data" => array("id" => $mirna_id, "label" => $mirna_id, "entrez_id" => $mirna_id,
                                                       "strength" => "", "expression" => "",
                                                       "ratio" => 999, "pvalue" => 999, "fdr" => 999,
                                                       "object_type" => "mirna", "custom" => $protein));
                $visited_mirna[$mirna_id] = 1;
                # For coloring issues!
                if (!in_array($mirna_id,$session_mirna)) { $session_mirna[] = $mirna_id; }
            }
            if ($visited_rel[$edge_id] != 1) // Just in case... to be removed...
            {
                $mirna_edges[] = array("group" => "edges",
                                       "data" => array("id" => $edge_id, "target" => $protein, "source" => $mirna_id,
													   "interaction" => "mirna", "custom" => $mirna_id));
                $visited_rel[$edge_id] = 1;
            }
        }

        if ($ms)
		{
			$query = $init_super_edge_hash.'(\''.$protein_list.'\')';
			$result = mysql_query($query,$conn);
			while(list($pro,$sym) = mysql_fetch_array($result))
			{
				$sehash[$pro] = $sym;
			}
			foreach ($mirna_nodes as $mn)
			{
				$mirna_edges[] = array("group" => "edges",
									   "data" => array( "id" => $mn['data']['id']."_to_".$sehash[$mn['data']['custom']],
									   "target" => $sehash[$mn['data']['custom']], "source" => $mn['data']['id'],
									   "label" => "mirna","interaction" => "supermirna", "custom" => ""));
			}
		}
        close_connection($conn);
    }
    $_SESSION['mirna'] = $session_mirna;
    return(array_merge($mirna_nodes,$mirna_edges));
}

# node: the selected ones to fetch their neighbors
# nodes: all the current nodes in the network
# level: the depth of neighborhood
function getNeighbors($node,$nodes,$level,$ns,$es,$datasets,$score,$ms)
{
	global $get_neighbors_1,$get_neighbors_2,$get_neighbors_3,$get_neighbors_4;
	global $get_add_nodes_1,$get_add_nodes_2,$get_add_edges_1,$get_add_edges_2;
	global $init_super_edge_hash;
	$neighbors = array();
	$add_nodes = array();
	$add_edges = array();
	$super = array();
	$adj = array();
	$sehash = array();
	$eshash = array();
	$tmpedges = array();
	$supedges = array();
	$interaction_hash = array("binding" => "binding", "ptmod" => "modification",
							  "expression" => "expression", "activation" => "activation",
							  "inhibition" => "inhibition");

	if (!isset($level)) { $level = 1; }
	if (!isset($ns)) { $ns = "kupkb"; }
	if (!isset($es)) { $es = "all"; }
	
	if(!empty($node) && !empty($nodes))
	{
		if (!is_array($node)) { $node = array($node); } # Good for level>1 use
		if (!is_array($nodes)) { $nodes = array($nodes); } # ...as above...
		
		$conn = open_connection();

		# Firstly get the neighbors
		$selected_list = implode("', '",$node);
		//$all_list = implode("', '",$nodes);
		// Correct in the case that the user calls 2nd neighbors after calling first neighbors
		// We should always start finding neighbors by excluding the session genes
		$all_list = implode("', '",$_SESSION['proteins']); 
		$query = $get_neighbors_1.'(\''.$selected_list.'\')'.$get_neighbors_2.'(\''.$all_list.'\')'.$get_neighbors_3.($score*1000).$get_neighbors_4;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$neighbors[] = $row[0];
		}

		if ($level > 1) # Not the best implementation, but for now it's OK...
		{
			$lev = 2;
			while ($lev <= $level)
			{
				# Append the nth level neighbors to the initial node query and re-run
				$neighbors[] = $node;
				$nodes = array_merge($nodes,$neighbors);
				$node = $neighbors;
				$selected_list = implode("', '",$node);
				$all_list = implode("', '",$nodes);
				$query = $get_neighbors_1.'(\''.$selected_list.'\')'.$get_neighbors_2.'(\''.$all_list.'\')'.$get_neighbors_3.($score*100).$get_neighbors_4;
				$result = mysql_query($query,$conn);
				while ($row = mysql_fetch_array($result,MYSQL_NUM))
				{
					$neighbors[] = $row[0];
				}
				$lev++;
			}
		}

		# Although there is nothing gained as KUPKB contains microarray datasets, therefore
		# whole genomes so neighbors will exist anyway, unless we make them dataset specific
		if ($ns == "kupkb")
		{
			$kupkbprots = getAllKUPKBGenesAsProteins($datasets,$conn);
			$neighbors = array_intersect($neighbors,$kupkbprots);
		}
		
		# Keep in mind! The cytoscapeweb node and edge queries need to be run only once!
		# Now fire more queries to get the network elements
		$neighbor_list = implode("', '",$neighbors);
		$query = $get_add_nodes_1.'(\''.$neighbor_list.'\')'.$get_add_nodes_2.'(\''.$neighbor_list.'\')';
		$result = mysql_query($query,$conn);
		while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
		{
			$ilabel = strtolower($label);
			$super[$ilabel][] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
									  "data" => array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
													  "strength" => "", "expression" => "",
													  "ratio" => 999, "pvalue" => 999, "fdr" => 999,
													  "object_type" => "gene", "dataset_id" => "", "custom" => ""));
		}
		if ($ms)
		{
			foreach ($super as $key => $value)
			{
				$size = count($super[$key]);
				$add_nodes[] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
									 "data" => array("id" => $key, "label" => $key, "entrez_id" => $key,
									 "strength" => "", "expression" => "",
									 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
									 "object_type" => "supergene", "dataset_id" => "", "custom" => ""));
				for ($i=0; $i<$size; $i++)
				{
					$newdata = array_merge($value[$i]['data'],array("parent" => $key));
					$value[$i]['data'] = $newdata;
					$add_nodes[] = $value[$i];
				}
			}
		}
		else
		{
			foreach ($super as $key => $value)
			{
				$add_nodes[] = $value[0];
			}
		}

		# TODO:
		# An extra query to find the homologues in multi-species so as to extrapolate
		# relationships and also visualize the additional nodes
		# Get symbols, entrez etc. of the added nodes and seek them through entrez_to_ensembl table
		# Create a new ensembl => symbol hash
		# Array diff the keys of the new hash with the existing neighbors to get the added ones
		# Based on the remaining ensembl, add new nodes with parents from the hash

		if ($level == 1) { $nodes = array_merge($nodes,$neighbors); } // Else already done
		$all_list = implode("', '",$nodes); // Must be redefined, $_SESSION['proteins'] no longer enough...
		if ($es == "all")
		{
			$query = $get_add_edges_1.'(\''.$all_list.'\')'.$get_add_edges_2.'(\''.$all_list.'\')';
		}
		else if ($es == "selected")
		{
			$query = $get_add_edges_1.'(\''.$selected_list.'\')'.$get_add_edges_2.'(\''.$neighbor_list.'\')'.
					 ' UNION '.
					 $get_add_edges_1.'(\''.$neighbor_list.'\')'.$get_add_edges_2.'(\''.$selected_list.'\')';
		}
		$result = mysql_query($query,$conn);
		while (list($target,$source,$interaction) = mysql_fetch_array($result))
		{
			$adj[$interaction][$source][$target] = 1;
		}

		$interactions = array_keys($adj);
		foreach ($interactions as $i)
		{
			$sources = array_keys($adj[$i]);
			foreach ($sources as $s)
			{
				$targets = array_keys($adj[$i][$s]);
				foreach ($targets as $t)
				{
					if ($adj[$i][$s][$t] === 1 && $adj[$i][$t][$s] === 1)
					{
						$add_edges[] = array("group" => "edges",
											 "data" => array("id" => $s."_to_".$t."_".$i,"target" => $t, "source" => $s,
															 "directed" => false, "label" => $interaction_hash[$i],
															 "interaction" => $i, "custom" => ""));
						$adj[$i][$s][$t] = 0;
						$adj[$i][$t][$s] = 0;
					}
					else if ($adj[$i][$s][$t] === 1 && $adj[$i][$t][$s] !== 1)
					{
						$add_edges[] = array("group" => "edges",
											 "data" => array("id" => $s."_to_".$t."_".$i,"target" => $t, "source" => $s,
															 "directed" => true, "label" => $interaction_hash[$i],
															 "interaction" => $i, "custom" => ""));
						$adj[$i][$s][$t] = 0;
					}
					else if ($adj[$i][$s][$t] !== 1 && $adj[$i][$t][$s] === 1)
					{
						$add_edges[] = array("group" => "edges",
											 "data" => array("id" => $t."_to_".$s."_".$i,"target" => $s, "source" => $t,
															 "directed" => true, "label" => $interaction_hash[$i],
															 "interaction" => $i, "custom" => ""));
						$adj[$i][$t][$s] = 0;
					}
				}
			}
		}
		# Now the super edges...
		if ($ms)
		{
			if ($es == "all")
			{
				$query = $init_super_edge_hash.'(\''.$all_list.'\')';
			}
			else if ($es == "selected")
			{
				$query = $init_super_edge_hash.'(\''.$selected_list.'\','.'\''.$neighbor_list.'\')';
			}
			$result = mysql_query($query,$conn);
			while(list($pro,$sym) = mysql_fetch_array($result))
			{
				$sehash[$pro] = $sym;
				$eshash[$sym] = 0;
			}

			 # Full of dirty hacks...
			foreach($sehash as $k => $v)
			{
				$eshash[$v]++;
			}
			foreach ($add_edges as $compedge)
			{
				$edge = $compedge['data'];
				if ($eshash[$sehash[$edge['source']]] >= 1 && $eshash[$sehash[$edge['target']]] >= 1)
				{
					$tmpedges[] = array("group" => "edges",
										"data" => array("id" => $sehash[$edge['source']]."_to_".$sehash[$edge['target']]."_super".$edge['interaction'],
														"target" => $sehash[$edge['target']], "source" => $sehash[$edge['source']],
														"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
														"interaction" => "super".$edge['interaction'], "custom" => ""));
				}
				else if ($eshash[$sehash[$edge['source']]] == 1 && $eshash[$sehash[$edge['target']]] > 1)
				{
					$tmpedges[] = array("group" => "edges",
										"data" => array("id" => $edge['source']."_to_".$sehash[$edge['target']]."_super".$edge['interaction'],
														"target" => $sehash[$edge['target']], "source" => $edge['source'],
														"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
														"interaction" => "super".$edge['interaction'], "custom" => ""));
				}
				else if ($eshash[$sehash[$edge['source']]] > 1 && $eshash[$sehash[$edge['target']]] == 1)
				{
					$tmpedges[] = array("group" => "edges",
										"data" => array("id" => $sehash[$edge['source']]."_to_".$edge['target']."_super".$edge['interaction'],
														"target" => $edge['target'], "source" => $sehash[$edge['source']],
														"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
														"interaction" => "super".$edge['interaction'], "custom" => ""));
				}
			}
			foreach ($tmpedges as $edge)
			{
				if (!isset($seen[$edge['data']['id']]))
				{
					$supedges[] = $edge;
					$seen[$edge['data']['id']] = 1;
				}
			}
		}
	}
	close_connection($conn);

	if (empty($supedges))
	{
		return(array_merge($add_nodes,$add_edges));
	}
	else
	{
		return(array_merge($add_nodes,array_merge($add_edges,$supedges)));
	}
	//return(array("elements" => array_merge($add_nodes,$add_edges), "entrez" => $new_entrez));
}

function getGeneData($gene,$species_id)
{
	global $get_gene;
	$species = array();

	// Get the species text from the DB
	$species_list = is_array($species_id) ? implode(", ",$species_id) : $species_id;
	$conn = open_connection();
	$query = 'SELECT `name` FROM `species` WHERE `tax_id` IN '.'('.$species_list.')';
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$species[] = $row[0];
	}		
	close_connection($conn);

	foreach ($species as $k => $v)
	{
		$species[$k] = ucfirst(implode("_",explode(" ",$v)));
	}

	// Go on...
	$gene_data = array();
	if(!empty($gene))
    {
		$conn = open_connection();
		$query = $get_gene.$gene;
		$result = mysql_query($query,$conn);
		while(list($synonym,$dbXref,$chrom,$desc) = mysql_fetch_array($result))
		{
			$external = array();
			$synonyms = implode(", ",explode("|",$synonym));
			$dbXrefs = explode("|",$dbXref);
			foreach ($dbXrefs as $key => $val)
			{
				$refs = explode(":",$val);
				switch($refs[0])
				{
					case "HGNC":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://www.genenames.org/data/hgnc_data.php?hgnc_id=".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "MIM":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://www.omim.org/entry/".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "Ensembl":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://www.ensembl.org/".$species."/Gene/Summary?g=".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "HPRD":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://www.hprd.org/summary?hprd_id=".$refs[1]."&isoform_id=".$refs[1]."_1&isoform_name=Isoform_1\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "Vega":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://vega.sanger.ac.uk/".$species."/Gene/Summary?g=".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "MGI":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://www.informatics.jax.org/searches/accession_report.cgi?id=mgi:".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
					case "RGD":
						$external[$refs[0]][] = "<a class=\"infolink\" href=\"http://rgd.mcw.edu/rgdweb/report/gene/main.html?id=".$refs[1]."\" target=\"_blank\">".$refs[1]."</a>";
						break;
				}
			}

			foreach ($external as $key => $val)
			{
				$external[$key] = implode(", ",$val)."<br/>";
			}

			$chromosome = $chrom;
			$description = $desc;
		}
		// We expect only one result because of Entrez ID, so outside the loop
		$gene_data = array("synonyms" => $synonyms, "external" => $external, "chromosome" => $chromosome, "description" => $description);
		close_connection($conn);
		
		return($gene_data);
	}		
}

function getGene2GeneData($source,$target)
{
	global $get_edge_1,$get_edge_2,$get_edge_3,$get_edge_4,$get_edge_5;
	$response = array();
	$score = array();
	if (!empty($source) && !empty($target))
	{	
		$conn = open_connection();
		$query = $get_edge_1.'\''.$source.'\''.$get_edge_2.'\''.$target.'\''.
				 $get_edge_3.'\''.$source.'\''.$get_edge_4.'\''.$target.'\''.
				 $get_edge_5;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$response[] = $row[0];
			$score[] = $row[1];
		}		
		close_connection($conn);
	}
	return(array("source" => $response[0], "target" => $response[1], "score" => $score[0]));
}

function getPathway2GeneData($ensembl_node)
{
	global $get_edge_1;
	if (!empty($ensembl_node))
	{	
		$conn = open_connection();
		$query = $get_edge_1.'\''.$ensembl_node.'\'';
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$response = $row[0];
		}		
		close_connection($conn);
	}
	return(array("target" => $response));
}

function getDatasetReport($dataset)
{
	global $dataset_report;
	$report = array();
	if (!empty($dataset))
	{
		$conn = open_connection();
		$query = $dataset_report.'\''.$dataset.'\'';
		$result = mysql_query($query,$conn);
		/*while($row = mysql_fetch_array($result,MYSQL_NUM)) // Should be one
		{
			for ($i=0; $i<mysql_num_fields($result); $i++)
			{
				$report[mysql_field_name($result,$i)] = $row[$i];
			}
		}*/
		while(list($dname,$exp0,$sp0,$b0,$d0,$s0,$exp1,$b1,$d1,$s1,$sp1,$assay,$pmid,$elink,$geo,$desc) = mysql_fetch_array($result))
		{
			$report['display_name'] =  empty($dname) || $dname == "NULL" ? "&nbsp;" : utf8_encode($dname);
			$report['experiment_condition_0'] = empty($exp0) || $exp0 == "NULL" ? "&nbsp;" : $exp0;
			$report['biomaterial_0'] =  empty($b0) || $b0 == "NULL" ? "&nbsp;" : $b0;
			$report['disease_0'] = empty($d0) || $d0 == "NULL" ? "&nbsp;" : $d0;
			$report['severity_0'] = empty($s0) || $s0 == "NULL" ? "&nbsp;" : $s0;
			$report['experiment_condition_1'] = empty($exp1) || $exp1 == "NULL" ? "&nbsp;" : $exp1;
			$report['biomaterial_1'] = empty($b1) || $b1 == "NULL" ? "&nbsp;" : $b1;
			$report['disease_1'] = empty($d1) || $d1 == "NULL" ? "&nbsp;" : $d1;
			$report['severity_1'] = empty($s1) || $s1 == "NULL" ? "&nbsp;" : $s1;
			$report['species'] = empty($sp0) || $sp0 == "NULL" ? $sp1 : $sp0;
			$report['experiment_assay'] = empty($assay) || $assay == "NULL" ? "&nbsp;" : $assay;
			$report['pmid'] = empty($pmid) || $pmid == "NULL" ? "&nbsp;" :
				"<a class=\"infolink-d\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=".$pmid."\" target=\"_blank\">".$pmid."</a>";
			$report['external_link'] = empty($elink) || $elink == "NULL" ? "&nbsp;" :
				"<a class=\"infolink-d\" href=\"".$elink."\" target=\"_blank\">here</a>";
			$report['geo_acc'] = empty($geo) || $geo == "NULL" ? "&nbsp;" :
				"<a class=\"infolink-d\" href=\"".$geo."\" target=\"_blank\">GEO</a>";
			$report['experiment_description'] = empty($desc) || $desc == "NULL" ? "&nbsp;" : utf8_encode($desc);
		}
		close_connection($conn);
	}
	return($report);
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
			$rc_0 = $r_0 === "" ? "-data with no location associated-" : $r_0;
			$rc_1 = $r_1 === "" ? "-data with no location associated-" : $r_1;
			$b_0[$r_0] = $rc_0;
			$b_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		
		# Remove empty rows for each of $b_0, $b_1 and merge
		//$location = array_merge(array_filter($b_0),array_filter($b_1));
		$location = array_merge($b_0,$b_1);
		natcasesort($location);
	}
	return($location);
}

function initDisease($dataset) 
{
	global $init_disease;
	$disease = array();
	if(!empty($dataset))
	{	
		$conn = open_connection();			
		$dataset_list = is_array($dataset) ? '(\''.implode("', '",$dataset).'\')' : '\''.$dataset.'\'';
		$query = $init_disease.$dataset_list;
		$result = mysql_query($query,$conn);
		while (list($r_0,$r_1) = mysql_fetch_array($result))
		{
			$rc_0 = $r_0 === "" ? "-data with no disease associated-" : $r_0;
			$rc_1 = $r_1 === "" ? "-data with no disease associated-" : $r_1;
			$d_0[$r_0] = $rc_0;
			$d_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		# Remove empty rows for each of $d_0, $d_1 and merge
		//$disease = array_merge(array_filter($d_0),array_filter($d_1));
		$disease = array_merge($d_0,$d_1);
		natcasesort($disease);
	}
	return($disease);
}

function initDataset($dataset) 
{
	global $init_dataset;
	$dname = array("none" => "---no dataset selected---");
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
		natcasesort($dname);
	}
	return($dname);
}

function initMiRNALocation($dataset)
{
	global $init_mirna_location;
	$location = array();
	if(!empty($dataset))
	{	
		$conn = open_connection();			
		$dataset_list = is_array($dataset) ? '(\''.implode("', '",$dataset).'\')' : '\''.$dataset.'\'';
		$query = $init_mirna_location.$dataset_list;
		$result = mysql_query($query,$conn);
		while (list($r_0,$r_1) = mysql_fetch_array($result))
		{
			$rc_0 = $r_0 === "" ? "-data with no location associated-" : $r_0;
			$rc_1 = $r_1 === "" ? "-data with no location associated-" : $r_1;
			$b_0[$r_0] = $rc_0;
			$b_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		$location = array_merge($b_0,$b_1);
		natcasesort($location);
	}
	return($location);
}

function initMiRNADisease($dataset)
{
	global $init_mirna_disease;
	$disease = array();
	if(!empty($dataset))
	{	
		$conn = open_connection();			
		$dataset_list = is_array($dataset) ? '(\''.implode("', '",$dataset).'\')' : '\''.$dataset.'\'';
		$query = $init_mirna_disease.$dataset_list;
		$result = mysql_query($query,$conn);
		while (list($r_0,$r_1) = mysql_fetch_array($result))
		{
			$rc_0 = $r_0 === "" ? "-data with no disease associated-" : $r_0;
			$rc_1 = $r_1 === "" ? "-data with no disease associated-" : $r_1;
			$d_0[$r_0] = $rc_0;
			$d_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		$disease = array_merge($d_0,$d_1);
		natcasesort($disease);
	}
	return($disease);
}

function initMiRNADataset($dataset)
{
	global $init_mirna_dataset;
	$dname = array("none" => "---no dataset selected---");
	if(!empty($dataset))
	{	
		$conn = open_connection();
		$dataset_list = is_array($dataset) ? '(\''.implode("', '",$dataset).'\')' : '\''.$dataset.'\'';
		$query = $init_mirna_dataset.$dataset_list;
		$result = mysql_query($query,$conn);
		while (list($n,$d) = mysql_fetch_array($result))
		{
			$dname[$n] = utf8_encode($d);
		}
		close_connection($conn);
		natcasesort($dname);
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

		foreach ($goterms as $cat => $ids)
		{
			natcasesort($goterms[$cat]);
		}
	}
	return($goterms);
}

function initKEGG($entrez,$multi)
{
	global $init_kegg_1,$init_kegg_2;
	global $init_kegg_multi_1,$init_kegg_multi_2;
	$keggs = array();
	if(is_array($entrez) && !empty($entrez))
	{
		$conn = open_connection();
		$gene_list = '('.implode(", ",$entrez).')';
		$query = $multi ? $init_kegg_multi_1.$gene_list.$init_kegg_multi_2 : $init_kegg_1.$gene_list.$init_kegg_2;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$class) = mysql_fetch_array($result))
		{			    
			$keggs[$class][$id] = $name;
		}
		close_connection($conn);

		foreach ($keggs as $class => $ids)
		{
			natcasesort($keggs[$class]);
		}
	}
	return($keggs);
}

function initmiRNA($entrez)
{
	global $init_mirna;
	$mirnas = array();
	if(is_array($entrez) && !empty($entrez))
	{
		$conn = open_connection();
		$gene_list = '('.implode(", ",$entrez).')';
		$query = $init_mirna.$gene_list;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{			    
			$mirnas[$row[0]] = $row[0];
		}
		close_connection($conn);
		natcasesort($mirnas);
	}
	return($mirnas);
}

function initNodes($entrez,$mirna,$ms)
{
	global $init_nodes_1,$init_nodes_2;
	$nodes = array();
	$super = array();
	$results = array();
	
	$conn = open_connection();
	$gene_list = '('.implode(", ",$entrez).')';
	$query = $init_nodes_1.$gene_list.$init_nodes_2;
	$result = mysql_query($query,$conn);

	while (list($id,$label,$entrez_id,$source,$target) = mysql_fetch_array($result))
	{
		$results[$entrez_id][] = array("id" => $id, "label" => $label, "source" => $source, "target" => $target);
	}

	foreach ($results as $e => $h)
	{
		if (count($h) > 1)
		{
			foreach ($h as $hit)
			{
				if (!is_null($hit['source']) && !is_null($hit['target']))
				{
					$ilabel = strtolower($hit['label']);
					$super[$ilabel][] = array("id" => $hit['id'], "label" => $hit['label'], "entrez_id" => (string)$e,
											  "strength" => "", "expression" => "",
											  "ratio" => 999, "pvalue" => 999, "fdr" => 999,
											  "object_type" => "gene", "dataset_id" => "", "custom" => "");
				}
			}
		}
		else
		{
			$ilabel = strtolower($h[0]['label']);
			$super[$ilabel][] = array("id" => $h[0]['id'], "label" => $h[0]['label'], "entrez_id" => (string)$e,
									  "strength" => "", "expression" => "",
									  "ratio" => 999, "pvalue" => 999, "fdr" => 999,
									  "object_type" => "gene", "dataset_id" => "", "custom" => "");
		}
	}

	if ($ms)
	{
		foreach ($super as $key => $value)
		{
			$size = count($super[$key]);
			$nodes[] = array("id" => $key, "label" => $key, "entrez_id" => "",
							 "strength" => "", "expression" => "",
							 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
							 "object_type" => "supergene", "dataset_id" => "", "custom" => "");
			for ($i=0; $i<$size; $i++)
			{
				$nodes[] = array_merge($value[$i],array("parent" => $key));
			}
		}
	}
	else
	{
		foreach ($super as $key => $value)
		{
			$nodes[] = $value[0];
		}
	}

	if (!empty($mirna))
	{
		global $init_mirna_nodes;
		if (!is_array($mirna)) { $mirna = array($mirna); }
		$mirna_list = '(\''.implode("', '",$mirna).'\')';
		$query = $init_mirna_nodes.$mirna_list;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{			    
			$nodes[] = array("id" => $row[0], "label" => $row[0], "entrez_id" => $row[0],
							 "strength" => "", "expression" => "",
							 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
							 "object_type" => "mirna", "custom" => "");
		}
	}
	
	close_connection($conn);
	//return(array("nodes" => $nodes, "ms" => $multi));
	return($nodes);
}

function initEdges($ensembl,$score,$ms)
{
	global $init_edges_1,$init_edges_2,$init_edges_3,$init_super_edge_hash;
	$predges = array();
	$adj = array();
	$edges = array();
	$sehash = array();
	$eshash = array();
	$tmpedges = array();
	$supedges = array();
	$seen = array();
	$interaction_hash = array("binding" => "binding", "ptmod" => "modification",
							  "expression" => "expression", "activation" => "activation",
							  "inhibition" => "inhibition","superbinding" => "binding",
							  "superptmod" => "modification","superexpression" => "expression",
							  "superactivation" => "activation","superinhibition" => "inhibition");
	if(is_array($ensembl) && !empty($ensembl))
	{
		$conn = open_connection();
		$pro_list = '(\''.implode("', '",$ensembl).'\')';
		$query = $init_edges_1.$pro_list.$init_edges_2.$pro_list.$init_edges_3.($score*1000);
		$result = mysql_query($query,$conn);
		while (list($target,$source,$interaction) = mysql_fetch_array($result))
		{
			$adj[$interaction][$source][$target] = 1;
		}

		$interactions = array_keys($adj);
		foreach ($interactions as $i)
		{
			$sources = array_keys($adj[$i]);
			foreach ($sources as $s)
			{
				$targets = array_keys($adj[$i][$s]);
				foreach ($targets as $t)
				{
					if ($adj[$i][$s][$t] === 1 && $adj[$i][$t][$s] === 1)
					{
						$edges[] = array("id" => $s."_to_".$t."_".$i,"target" => $t, "source" => $s,
										 "directed" => false, "label" => $interaction_hash[$i],
										 "interaction" => $i, "custom" => "");
						$adj[$i][$s][$t] = 0;
						$adj[$i][$t][$s] = 0;
					}
					else if ($adj[$i][$s][$t] === 1 && $adj[$i][$t][$s] !== 1)
					{
						$edges[] = array("id" => $s."_to_".$t."_".$i,"target" => $t, "source" => $s,
										 "directed" => true, "label" => $interaction_hash[$i],
										 "interaction" => $i, "custom" => "");
						$adj[$i][$s][$t] = 0;
					}
					else if ($adj[$i][$s][$t] !== 1 && $adj[$i][$t][$s] === 1)
					{
						$edges[] = array("id" => $t."_to_".$s."_".$i,"target" => $s, "source" => $t,
										 "directed" => true, "label" => $interaction_hash[$i],
										 "interaction" => $i, "custom" => "");
						$adj[$i][$t][$s] = 0;
					}
				}
			}
		}

		# Now the super edges...
		if ($ms)
		{
			$query = $init_super_edge_hash.$pro_list;
			$result = mysql_query($query,$conn);
			while(list($pro,$sym) = mysql_fetch_array($result))
			{
				$sehash[$pro] = $sym;
				$eshash[$sym] = 0;
			}
			 # Full of dirty hacks...
			foreach($sehash as $k => $v)
			{
				$eshash[$v]++;
			}
			foreach ($edges as $edge)
			{
				if ($eshash[$sehash[$edge['source']]] >= 1 && $eshash[$sehash[$edge['target']]] >= 1)
				{
					$tmpedges[] = array("id" => $sehash[$edge['source']]."_to_".$sehash[$edge['target']]."_super".$edge['interaction'],
										"target" => $sehash[$edge['target']], "source" => $sehash[$edge['source']],
										"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
										"interaction" => "super".$edge['interaction'], "custom" => "");
				}
				else if ($eshash[$sehash[$edge['source']]] == 1 && $eshash[$sehash[$edge['target']]] > 1)
				{
					$tmpedges[] = array("id" => $edge['source']."_to_".$sehash[$edge['target']]."_super".$edge['interaction'],
										"target" => $sehash[$edge['target']], "source" => $edge['source'],
										"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
										"interaction" => "super".$edge['interaction'], "custom" => "");
				}
				else if ($eshash[$sehash[$edge['source']]] > 1 && $eshash[$sehash[$edge['target']]] == 1)
				{
					$tmpedges[] = array("id" => $sehash[$edge['source']]."_to_".$edge['target']."_super".$edge['interaction'],
										"target" => $edge['target'], "source" => $sehash[$edge['source']],
										"directed" => true, "label" => $interaction_hash["super".$edge['interaction']],
										"interaction" => "super".$edge['interaction'], "custom" => "");
				}
			}
			foreach ($tmpedges as $edge)
			{
				if (!isset($seen[$edge['id']]))
				{
					$supedges[] = $edge;
					$seen[$edge['id']] = 1;
				}
			}
		}

		close_connection($conn);
	}
	return(array_merge($edges,$supedges));
}

function initDataSchema()
{
	$node_schema = array();
	$node_schema[] = array("name" => "label", "type" => "string");
	$node_schema[] = array("name" => "entrez_id", "type" => "string");
	$node_schema[] = array("name" => "strength", "type" => "string");
	$node_schema[] = array("name" => "expression", "type" => "string");
	$node_schema[] = array("name" => "ratio", "type" => "number");
	$node_schema[] = array("name" => "pvalue", "type" => "number");
	$node_schema[] = array("name" => "fdr", "type" => "number");
	$node_schema[] = array("name" => "object_type", "type" => "string");
	$node_schema[] = array("name" => "dataset_id", "type" => "string");
	$node_schema[] = array("name" => "custom", "type" => "string");
	//$node_schema[] = array("name" => "userdata", "type" => "string");

	$edge_schema = array();
	$edge_schema[] = array("name" => "label", "type" => "string");
	$edge_schema[] = array("name" => "interaction", "type" => "string");
	$edge_schema[] = array("name" => "custom", "type" => "string");

	return(array("nodes" => $node_schema, "edges" => $edge_schema));
}

function initLayoutOpts()
{
	$layout_opts = array("ForceDirected" => "Force Directed", "Circle" => "Circle",
						 "Radial" => "Radial", "Tree" => "Tree");
	return($layout_opts);
}

function getIndexedGenes($term,$species)
{
	global $auto_genes,$auto_ensembl,$auto_mirna,$auto_uniprot;

	if (isset($species))
	{
		$species = is_array($species) ? $species : array($species);
	}
	
	$cl = new SphinxClient();
	$cl->SetServer("localhost",60001);
	$cl->SetLimits(0,100);
	$cl->SetMatchMode(SPH_MATCH_ANY);
	if (isset($species)) { $cl->SetFilter("species",$species); }
	else { $cl->ResetFilters(); }
	
	$cl->AddQuery("*".$term."*","kupkbvis_entrez");
	$cl->AddQuery("*".$term."*","kupkbvis_ensembl");
	$cl->AddQuery("*".$term."*","kupkbvis_mirna");
	$cl->ResetFilters();
	$cl->AddQuery("*".$term."*","kupkbvis_uniprot");
	$result = $cl->RunQueries();

	if ( $result === false )
	{
		echo "Query failed: " . $cl->GetLastError() . ".\n";
	}
	else // 0 => Genes, 1 => Ensembl, 2 => miRNA, 3 => Uniprot
	{
		$genes_arr = $result[0];
		$entrez_to_ensembl_arr = $result[1];
		$mirna_arr = $result[2];
		$entrez_to_uniprot_arr = $result[3];
		$gene_match = array();
		$ensembl_match = array();
		$mirna_match = array();
		$uniprot_match = array();
		$suggestions = array();

		$conn = open_connection();
		
		if (!empty($genes_arr['matches']))
		{
			foreach ($genes_arr['matches'] as $doc => $docinfo)
			{
				$gene_match[] = $doc;
			}
			$gene_list = '('.implode(", ",$gene_match).')';
			$query = $auto_genes.$gene_list;
			$query_result = mysql_query($query,$conn);
			while (list($e,$g,$d,$n) = mysql_fetch_array($query_result))
			{
				$suggestions[] = $e." - ".$g." - ".$d." - ".$n;
			}
		}
		if (!empty($entrez_to_ensembl_arr['matches']))
		{
			foreach ($entrez_to_ensembl_arr['matches'] as $doc => $docinfo)
			{
				$ensembl_match[] = $doc;
			}
			$ensembl_list = '('.implode(", ",$ensembl_match).')';
			$query = $auto_ensembl.$ensembl_list;
			$query_result = mysql_query($query,$conn);
			while (list($e,$eg,$ep,$d,$n) = mysql_fetch_array($query_result))
			{
				$suggestions[] = $e." - ".$eg." - ".$ep." - ".$d." - ".$n;
			}
		}
		if (!empty($mirna_arr['matches']))
		{
			foreach ($mirna_arr['matches'] as $doc => $docinfo)
			{
				$mirna_match[] = $doc;
			}
			$mirna_list = '('.implode(", ",$mirna_match).')';
			$query = $auto_mirna.$mirna_list;
			$query_result = mysql_query($query,$conn);
			while (list($m,$n) = mysql_fetch_array($query_result))
			{
				$suggestions[] = $m." - ".$n;
			}
		}
		if (!empty($entrez_to_uniprot_arr['matches']))
		{
			foreach ($entrez_to_uniprot_arr['matches'] as $doc => $docinfo)
			{
				$uniprot_match[] = $doc;
			}
			$uniprot_list = '('.implode(", ",$uniprot_match).')';
			$query = $auto_uniprot.$uniprot_list;
			$query_result = mysql_query($query,$conn);
			while (list($e,$u,$g,$d) = mysql_fetch_array($query_result))
			{
				$suggestions[] = $e." - ".$u." - ".$g." - ".$d;
			}
		}

		close_connection($conn);
	}
	
	return($suggestions);
}

function allKUPKBSymbols2Entrez()
{
	global $allkupkb_symbols,$allkupkb_symbols2entrez;
	$symbols = array();
	$kupkb_s2e = array();
	
	$conn = open_connection();
	$query = $allkupkb_symbols;
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$symbols[] = $row[0];
	}

	$symbol_list = '(\''.implode("', '",$symbols).'\')';
	$query = $allkupkb_symbols2entrez.$symbol_list;
	$result = mysql_query($query,$conn);
	while (list($e,$s) = mysql_fetch_array($result))
	{
		$kupkb_s2e[$s][] = $e;
	}
	close_connection($conn);

	return($kupkb_s2e);
}

function getAllKUPKBGenesAsProteins($did,$conn)
{
	global $allkupkb2protein_1,$allkupkb2protein_2,$allkupkb2protein_3,$allkupkb2protein_4,$allkupkb2protein_5;
	global $allkupkbsymbols2protein;
	$species = $_SESSION['species'];
	$ks2e = $_SESSION['symbol2entrez'];
	$prots = array();
	$outside = TRUE;
	if (!$conn) { $outside = FALSE; }

	$d_list = is_array($did) ? '(\''.implode("', '",$did).'\')' : '\''.$did.'\'';
	$s_list = is_array($species) ? '('.implode(", ",$species).')' : '('.$species.')';
	if (!$outside) { $conn = open_connection(); } # else opened, called from outside
	$query = $allkupkb2protein_1.$d_list.$allkupkb2protein_2.$s_list.
			 $allkupkb2protein_3.$d_list.$allkupkb2protein_4.$s_list.
			 $allkupkb2protein_5;
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$prots[] = $row[0];
	}
	
	if (!empty($k2se))
	{
		$query = $allkupkbsymbols2protein;
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$prots[] = $row[0];
		}
	}

	if (!$outside) { close_connection($conn); }
	return($prots);
}

/*
function getEntrezFromAnyAndMiRNA($terms,$species)
{					
	global $entrez_from_any_1,$entrez_from_any_3,$entrez_from_any_4;
	global $entrez_from_any_2_1,$entrez_from_any_2_2,$entrez_from_any_2_3,$entrez_from_any_2_4,$entrez_from_any_2_5;
	global $union_mirna;
	global $mirna_from_input_1,$mirna_from_input_2,$mirna_from_input_3;
	$symbol = array();
	$mirna = array();
	
	$conn = open_connection();
	$list_of_genes = is_array($terms) ? implode("', '",$terms) : $terms;
	# Gene part
	$query = $entrez_from_any_1.
			 $entrez_from_any_2_1.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_2.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_3.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_4.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_5.'(\''.$list_of_genes.'\')';
	if (isset($species))
	{
		$list_of_species = is_array($species) ? implode(", ",$species) : $species;
		$query .= $entrez_from_any_3.'('.$list_of_species.')'.$entrez_from_any_4;
	}
	else
	{
		$query .= $entrez_from_any_4;
	}
	# miRNA part
	$query .= $union_mirna.
			  $mirna_from_input_1.'(\''.$list_of_genes.'\')';
	if (isset($species))
	{
		$list_of_species = is_array($species) ? implode(", ",$species) : $species;
		$query .= $mirna_from_input_2.'('.$list_of_species.')'.$mirna_from_input_3;
	}
	else
	{
		$query .= $mirna_from_input_3;
	}
	echo $query;
	$result = mysql_query($query,$conn);
	while (list($entity,$sym,$type) = mysql_fetch_array($result))
	{
		if ($type == "gene")
		{
			$symbol[] = $sym;
		}
		else if ($type == "mirna")
		{
			$mirna[] = $entity;
		}
	}
	close_connection($conn);
	return(array("symbol" => $symbol, "mirna" => $mirna));
}

function updateLocDataDisease($genes,$disease) 
{
	global $update_locdata_disease_1,$update_locdata_disease_2_1,$update_locdata_disease_2_2,$update_locdata_disease_3;
	global $update_locdata_disease_4,$update_locdata_disease_5_1,$update_locdata_disease_5_2,$update_locdata_disease_6;
	$dataset_name = array("none" => "---no dataset selected---");
	
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
			$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
			$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
			$loc_0[$b_0] = $bc_0;
			$loc_1[$b_1] = $bc_1;
		}
		close_connection($conn);
	}
		
	# Remove empty rows for each of $loc_0, $loc_1 and merge
	//$location = array_merge(array_filter($loc_0),array_filter($loc_1));
	$location = array_merge($loc_0,$loc_1);
	return(array("dataset" => $dataset_name, "location" => $location)); 
}

function updateDisDataLocation($genes,$location)
{
	global $update_disdata_location_1,$update_disdata_location_2_1,$update_disdata_location_2_2,$update_disdata_location_3;
	global $update_disdata_location_4,$update_disdata_location_5_1,$update_disdata_location_5_2,$update_disdata_location_6;
	$dataset_name = array("none" => "---no dataset selected---");
	
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
			$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
			$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
			$dis_0[$d_0] = $dc_0;
			$dis_1[$d_1] = $dc_1;
		}
		close_connection($conn);
	}
		
	# Remove empty rows for each of $dis_0, $dis_1 and merge
	//$disease = array_merge(array_filter($dis_0),array_filter($dis_1));
	$disease = array_merge($dis_0,$dis_1);
	return(array("dataset" => $dataset_name, "disease" => $disease));
}

function updateMiRNALocDataDisease($mirnas,$disease) 
{
	global $update_mirna_locdata_disease_1;
	global $update_mirna_locdata_disease_2_1,$update_mirna_locdata_disease_2_2;
	global $update_mirna_locdata_disease_3;
	$dataset_name = array("none" => "---no dataset selected---");
	if (!is_array($mirnas)) { $mirnas = array($mirnas); }
	
	if(!empty($mirnas))
	{
		$conn = open_connection();
		$mirna_list = '(\''.implode("', '",$mirnas).'\')';
		$query = $update_mirna_locdata_disease_1.$mirna_list.
				 $update_mirna_locdata_disease_2_1.$disease.
				 $update_mirna_locdata_disease_2_2.$disease.
				 $update_mirna_locdata_disease_3;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$b_0,$b_1) = mysql_fetch_array($result))
		{
			$dataset_name[$id] = utf8_encode($name);
			$bc_0 = $b_0 === "" ? "-data with no location associated-" : $b_0;
			$bc_1 = $b_1 === "" ? "-data with no location associated-" : $b_1;
			$loc_0[$b_0] = $bc_0;
			$loc_1[$b_1] = $bc_1;
		}
		close_connection($conn);
	}

	$location = array_merge($loc_0,$loc_1);
	return(array("dataset" => $dataset_name, "location" => $location)); 
}

function updateMiRNADisDataLocation($mirnas,$location)
{
	global $update_mirna_disdata_location_1;
	global $update_mirna_disdata_location_2_1,$update_mirna_disdata_location_2_2;
	global $update_mirna_disdata_location_3;
	$dataset_name = array("none" => "---no dataset selected---");
	if (!is_array($mirnas)) { $mirnas = array($mirnas); }
	
	if(!empty($mirnas))
	{
		$conn = open_connection();
		$mirna_list = '(\''.implode("', '",$mirnas).'\')';
		$query = $update_mirna_disdata_location_1.$mirna_list.
				 $update_mirna_disdata_location_2_1.$location.
				 $update_mirna_disdata_location_2_2.$location.
				 $update_mirna_disdata_location_3;
		$result = mysql_query($query,$conn);
		while (list($id,$name,$d_0,$d_1) = mysql_fetch_array($result))
		{
			$dataset_name[$id] = utf8_encode($name);
			$dc_0 = $d_0 === "" ? "-data with no disease associated-" : $d_0;
			$dc_1 = $d_1 === "" ? "-data with no disease associated-" : $d_1;
			$dis_0[$d_0] = $dc_0;
			$dis_1[$d_1] = $dc_1;
		}
		close_connection($conn);
	}

	$disease = array_merge($dis_0,$dis_1);
	return(array("dataset" => $dataset_name, "disease" => $disease));
}

function initEdges($ensembl)
{
	global $init_edges_1,$init_edges_2;
	$seen = array();
	$edges = array();
	$interaction_hash = array("binding" => "binding", "ptmod" => "modification",
							  "expression" => "expression", "activation" => "activation",
							  "inhibition" => "inhibition");
	if(is_array($ensembl) && !empty($ensembl))
	{
		$conn = open_connection();
		$pro_list = '(\''.implode("', '",$ensembl).'\')';
		$query = $init_edges_1.$pro_list.$init_edges_2.$pro_list;
		$result = mysql_query($query,$conn);
		while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		{
			$current_edge = array("id" => $id, "target" => $target, "source" => $source,
								  "directed" => false, "label" => $interaction_hash[$interaction],
								  "interaction" => $interaction, "custom" => "");
			$current_edge_tid = implode("_",array($source,$target,$interaction));

			// Little hack to determine directionality and collapse edges
			if ($seen[$current_edge_tid] != 1)
			{
				$edges[] = $current_edge;
				$current_edge_tid_inv = implode("_",array($target,$source,$interaction));
				$seen[$current_edge_tid_inv] = 1;
			}
		}
		
		#while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		#{
		#	$edges[$interaction][] = array("id" => $id, "target" => $target, "source" => $source);
		#}
	}
	return($edges);
}

function initNodes($entrez,$mirna)
{
	global $init_nodes;
	$nodes = array();
	$super = array();
	$multi = FALSE;
	
	$conn = open_connection();
	$gene_list = '('.implode(", ",$entrez).')';
	$query = $init_nodes.$gene_list;
	//echo $query;
	$result = mysql_query($query,$conn);

	while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
	{
		$ilabel = strtolower($label);
		$super[$ilabel][] = array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
								  "strength" => "", "expression" => "",
								  "ratio" => 999, "pvalue" => 999, "fdr" => 999,
								  "object_type" => "gene", "dataset_id" => "", "custom" => "");
	}
	
	foreach ($super as $key => $value)
	{
		$size = count($super[$key]);
		if ($size>1)
		{
			$nodes[] = array("id" => $key, "label" => $key, "entrez_id" => "",
							 "strength" => "", "expression" => "",
							 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
							 "object_type" => "supergene", "dataset_id" => "", "custom" => "");
			for ($i=0; $i<$size; $i++)
			{
				$nodes[] = array_merge($value[$i],array("parent" => $key));
			}
			$multi = TRUE;
		}
		else
		{
			$nodes[] = $value[0];
		}
	}
	 
	#while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
	#{
	#	$nodes[] = array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
	#					 "strength" => "", "expression" => "",
	#					 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
	#					 "object_type" => "gene", "dataset_id" => "", "custom" => "");
	#}

	if (!empty($mirna))
	{
		global $init_mirna_nodes;
		if (!is_array($mirna)) { $mirna = array($mirna); }
		$mirna_list = '(\''.implode("', '",$mirna).'\')';
		$query = $init_mirna_nodes.$mirna_list;
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{			    
			$nodes[] = array("id" => $row[0], "label" => $row[0], "entrez_id" => $row[0],
							 "strength" => "", "expression" => "",
							 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
							 "object_type" => "mirna", "custom" => "");
		}
	}
	
	close_connection($conn);
	return(array("nodes" => $nodes, "ms" => $multi));
}*/

/*$size = count($super[$key]);
if ($size>1)
{
	$nodes[] = array("id" => $key, "label" => $key, "entrez_id" => "",
					 "strength" => "", "expression" => "",
					 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
					 "object_type" => "supergene", "dataset_id" => "", "custom" => "");
	for ($i=0; $i<$size; $i++)
	{
		$nodes[] = array_merge($value[$i],array("parent" => $key));
	}
	$multi = TRUE;
}
else { $nodes[] = $value[0]; }*/
/*while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
{
	$add_nodes[] = array("group" => "nodes", "x" => rand(50,400), "y" => rand(50,400),
						 "data" => array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
										 "strength" => "", "expression" => "",
										 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
										 "object_type" => "gene"));
}*/
?>


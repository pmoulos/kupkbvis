<?php

session_start();

include('connection.php');
include('queries.php');
include('sphinxapi.php');

//include('test.php'); # Test

# Response to Select species dropdown list or the GO button
if ($_REQUEST['species'])
{
    $species = (int)$_REQUEST['species'];
	$genes = $_REQUEST['genes'];
	$genes = json_decode($genes,$assoc=TRUE);
    //$entrez = getEntrezFromSymbol($genes,$species);
    $entrez = getEntrezFromAny($genes,$species);
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
		$mirna = initmiRNA($entrez);
		$resultOther = array("go" => $go, "kegg" => $kegg, "mirna" => $mirna);
		
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

if ($_REQUEST['dataset'])
{
	$dataset = $_REQUEST['dataset'];
	$location = $_REQUEST['location_data'];
	$disease = $_REQUEST['disease_data'];
	//$dataset = json_decode($dataset);
	//$location = json_decode($location);
	//$disease = json_decode($disease);
	//echo $disease."<br/>".$location."<br/>".$dataset."<br/>";
	$genes = $_SESSION['entrez'];
	$result = getRegulation($genes,$dataset,$disease,$location);
	//echo json_encode($result | JSON_NUMERIC_CHECK);
	echo json_encode($result);
}

# Response to AJAX network construction
if ($_REQUEST['network']) // The network!
{
	$entrez = $_SESSION['entrez'];
	$proteins = getEnsemblFromEntrez($entrez);
	$schema = initDataSchema();
	$nodes = initNodes($entrez);
	$edges = initEdges($proteins);
	$resultNetwork = array("dataSchema" => $schema, "data" => array("nodes" => $nodes, "edges" => $edges));
	#echo json_encode($resultNetwork,JSON_FORCE_OBJECT | JSON_NUMERIC_CHECK);
	#echo json_encode($resultNetwork,JSON_NUMERIC_CHECK);
	echo json_encode($resultNetwork);

	$_SESSION['proteins'] = $proteins;
}

# Response to Select GO terms multi-select list
if ($_REQUEST['go'])
{
	$proteins = $_SESSION['proteins'];
	$gots = $_REQUEST['go'];
	$gots = json_decode($gots,$assoc=TRUE);
	$elements = getGOElements($gots,$proteins);
	echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to Select KEGG pathways multi-select list
if ($_REQUEST['kegg'])
{
    $proteins = $_SESSION['proteins'];
    $keggs = $_REQUEST['kegg'];
    $keggs = json_decode($keggs,$assoc=TRUE);
    $elements = getKEGGElements($keggs,$proteins);
    echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to Select miRNA multi-select list
if ($_REQUEST['mirna'])
{
    $proteins = $_SESSION['proteins'];
    $mirnas = $_REQUEST['mirna'];
    $mirnas = json_decode($mirnas,$assoc=TRUE);
    $elements = getmiRNAElements($mirnas,$proteins);
    echo json_encode($elements,JSON_NUMERIC_CHECK);
}

# Response to get neighbor queries
if ($_REQUEST['level'])
{
	$level = $_REQUEST['level'];
	$node = $_REQUEST['node'];
	$nodes = $_REQUEST['nodes'];
	$node = json_decode($node,$assoc=TRUE);
	$nodes = json_decode($nodes,$assoc=TRUE);
	$elements = getNeighbors($node,$nodes,$level);
	echo json_encode($elements);
}

# Response to gene node selection
if ($_REQUEST['gene_data'])
{
    $the_gene = $_REQUEST['gene_data'];
    $gene_data = getGeneData($the_gene,$_SESSION['species']);
    echo json_encode($gene_data,JSON_NUMERIC_CHECK);
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
	$species = (int)$_REQUEST['suggest_species'];
	//$result = getAutocompGenes($term,$species);
	$result = getIndexedGenes($term,$species);
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

function getEntrezFromAny($terms,$species)
{					
	global $entrez_from_any_1,$entrez_from_any_3,$entrez_from_any_4;
	global $entrez_from_any_2_1,$entrez_from_any_2_2,$entrez_from_any_2_3,$entrez_from_any_2_4,$entrez_from_any_2_5;
	$conn = open_connection();
	$list_of_genes = is_array($terms) ? implode("', '",$terms) : $terms;
	$query = $entrez_from_any_1.
			 $entrez_from_any_2_1.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_2.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_3.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_4.'(\''.$list_of_genes.'\')'.
			 $entrez_from_any_2_5.'(\''.$list_of_genes.'\')';
	if (isset($species))
	{
		$query .= $entrez_from_any_3.$species.$entrez_gene_4;
	}
	else
	{
		$query .= $entrez_from_any_4;
	}
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$entrez[] = $row[0];
	}		
	close_connection($conn);
	return($entrez);
}

function getEntrezFromSymbol($genes,$species)
{					
	global $entrez_from_symbol_1,$entrez_from_symbol_2;
	$conn = open_connection();
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
			$bc_0 = $b_0 === "" ? "- no location association -" : $b_0;
			$bc_1 = $b_1 === "" ? "- no location association -" : $b_1;
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
			$dc_0 = $d_0 === "" ? "- no disease association -" : $d_0;
			$dc_1 = $d_1 === "" ? "- no disease association -" : $d_1;
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

function getRegulation($genes,$dataset,$disease,$location)
{
	global $get_coloring_1,$get_coloring_3,$get_coloring_5;
	global $get_coloring_2_1,$get_coloring_2_2,$get_coloring_2_3,$get_coloring_2_4,$get_coloring_2_5;
	global $get_coloring_4_1,$get_coloring_4_2,$get_coloring_4_3,$get_coloring_4_4,$get_coloring_4_5;
	$color_data = array();
	
	if(!empty($genes) && !empty($dataset))
	{
		$conn = open_connection();
		$gene_list = is_array($genes) ? implode(", ",$genes) : $genes;
		$query = $get_coloring_1.'('.$gene_list.')'.$get_coloring_2_1.'\''.$dataset.'\''.
				 $get_coloring_2_2.'\''.$disease.'\''.$get_coloring_2_3.'\''.$disease.'\''.
				 $get_coloring_2_4.'\''.$location.'\''.$get_coloring_2_5.'\''.$location.'\''.
				 $get_coloring_3.'('.$gene_list.')'.$get_coloring_4_1.'\''.$dataset.'\''.
				 $get_coloring_4_2.'\''.$disease.'\''.$get_coloring_4_3.'\''.$disease.'\''.
				 $get_coloring_4_4.'\''.$location.'\''.$get_coloring_4_5.'\''.$location.'\''.
				 $get_coloring_5;
		$result = mysql_query($query,$conn);
		while (list($record_id,$dataset_id,$entrez_id,$expr_strength,$expr_de,$ratio,$pvalue,$fdr) = mysql_fetch_array($result))
		{
			$color_data[] = array("entrez_id" => $entrez_id, "strength" => $expr_strength, "expression" => $expr_de,
								  "ratio" => $ratio, "pvalue" => $pvalue, "fdr" => $fdr);
		}
		close_connection($conn);
	}

	return($color_data);
}

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

function getGOElements($gots,$ensembl)
{
	global $get_go_1,$get_go_2;
	$go_nodes = array();
	$go_edges = array();
	$visited_go = array();
	$visited_rel = array();
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
				$go_nodes[] = array("group" => "nodes", "x" => rand(50,450), "y" => rand(50,450),
									"data" => array("id" => $go_id, "label" => $go_term, "entrez_id" => $go_id,
													"strength" => "", "expression" => "",
													"ratio" => 999, "pvalue" => 999, "fdr" => 999,
													"object_type" => strtolower($category)));
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
		close_connection($conn);
	}
	return(array_merge($go_nodes,$go_edges));
}

function getKEGGElements($keggs,$ensembl)
{
    global $get_kegg_1,$get_kegg_2;
    $kegg_nodes = array();
    $kegg_edges = array();
    $visited_kegg = array();
    $visited_rel = array();
    if(!empty($ensembl) && !empty($keggs))
    {
        $conn = open_connection();
        $protein_list = is_array($ensembl) ? implode("', '",$ensembl) : $ensembl;
        $kegg_list = is_array($keggs) ? implode("', '",$keggs) : $keggs;    
        $query = $get_kegg_1.'(\''.$protein_list.'\')'.$get_kegg_2.'(\''.$kegg_list.'\')';
        $result = mysql_query($query,$conn);
        while (list($edge_id,$entrez_id,$kegg_id,$kegg_name,$kegg_class,$protein) = mysql_fetch_array($result))
        {
            if ($visited_kegg[$kegg_id] != 1)
            {
				// OK, I am exploiting the text type of "strength" to avoid an AJAX call just to get
				// the KEGG class for displaying KEGG node properties
                $kegg_nodes[] = array("group" => "nodes", "x" => rand(50,450), "y" => rand(50,450),
                                      "data" => array("id" => $kegg_id, "label" => $kegg_name, "entrez_id" => $kegg_id,
                                                      "strength" => $kegg_class, "expression" => "",
                                                      "ratio" => 999, "pvalue" => 999, "fdr" => 999,
                                                      "object_type" => "pathway"));
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
        close_connection($conn);
    }
    return(array_merge($kegg_nodes,$kegg_edges));
}

function getmirnaElements($mirnas,$ensembl)
{
	global $get_mirna_1,$get_mirna_2;
	$mirna_nodes = array();
	$mirna_edges = array();
	$visited_mirna = array();
	$visited_rel = array();
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
                $mirna_nodes[] = array("group" => "nodes", "x" => rand(50,450), "y" => rand(50,450),
                                       "data" => array("id" => $mirna_id, "label" => $mirna_id, "entrez_id" => "",
                                                       "strength" => "", "expression" => "",
                                                       "ratio" => 999, "pvalue" => 999, "fdr" => 999,
                                                       "object_type" => "mirna"));
                $visited_mirna[$mirna_id] = 1;
            }
            if ($visited_rel[$edge_id] != 1) // Just in case... to be removed...
            {
                $mirna_edges[] = array("group" => "edges",
                                       "data" => array("id" => $edge_id, "target" => $protein, "source" => $mirna_id,
													   "interaction" => "mirna", "custom" => $mirna_id));
                $visited_rel[$edge_id] = 1;
            }
        }
        close_connection($conn);
    }
    return(array_merge($mirna_nodes,$mirna_edges));
}

function getNeighbors($node,$nodes,$level)
{
	global $get_neighbors_1,$get_neighbors_2,$get_neighbors_3;
	global $get_add_nodes,$get_add_edges_1,$get_add_edges_2;
	$neighbors = array();
	$add_nodes = array();
	$add_edges = array();
	$seen = array();
	$interaction_hash = array("binding" => "binding", "ptmod" => "modification",
							  "expression" => "expression", "activation" => "activation");

	if (!isset($level)) { $level = 1; }
	
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
		$query = $get_neighbors_1.'(\''.$selected_list.'\')'.$get_neighbors_2.'(\''.$all_list.'\')'.$get_neighbors_3;
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
				$query = $get_neighbors_1.'(\''.$selected_list.'\')'.$get_neighbors_2.'(\''.$all_list.'\')'.$get_neighbors_3;
				$result = mysql_query($query,$conn);
				while ($row = mysql_fetch_array($result,MYSQL_NUM))
				{
					$neighbors[] = $row[0];
				}
				$lev++;
			}
		}
		
		# Keep in mind! The cytoscapeweb node and edge queries need to be run only once!
		# Now fire more queries to get the network elements
		$neighbor_list = implode("', '",$neighbors);
		$query = $get_add_nodes.'(\''.$neighbor_list.'\')';
		$result = mysql_query($query,$conn);
		while (list($id,$label,$entrez_id) = mysql_fetch_array($result))
		{
			$add_nodes[] = array("group" => "nodes", "x" => rand(50,450), "y" => rand(50,450),
								 "data" => array("id" => $id, "label" => $label, "entrez_id" => $entrez_id,
												 "strength" => "", "expression" => "",
												 "ratio" => 999, "pvalue" => 999, "fdr" => 999,
												 "object_type" => "gene"));
		}

		$query = $get_add_edges_1.'(\''.$neighbor_list.'\')'.$get_add_edges_2.'(\''.$all_list.'\')';
		//echo $query;
		$result = mysql_query($query,$conn);
		while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		{
			$current_edge = array("id" => $id, "target" => $target, "source" => $source,
								  "label" => $interaction_hash[$interaction],
								  "interaction" => $interaction, "custom" => "");
			// Little hack to eliminate directionality
			$current_edge_tid = implode("_",array($source,$target,$interaction));
			if ($seen[$current_edge_tid] != 1)
			{
				$add_edges[] = array("group" => "edges", "data" => $current_edge);
				$current_edge_tid_inv = implode("_",array($target,$source,$interaction));
				$seen[$current_edge_tid_inv] = 1;
			}
		}
		
		close_connection($conn);
	}
	
	return(array_merge($add_nodes,$add_edges));
}

function getGeneData($gene,$species_id)
{
	global $get_gene;

	// Get the species text from the DB
	$conn = open_connection();
	$query = 'SELECT `name` FROM `species` WHERE `tax_id`='.$species_id;
	$result = mysql_query($query,$conn);
	while ($row = mysql_fetch_array($result,MYSQL_NUM))
	{
		$species = $row[0];
	}		
	close_connection($conn);
	$species = ucfirst(implode("_",explode(" ",$species)));

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
	global $get_edge_1,$get_edge_2;
	$response = array();
	if (!empty($source) && !empty($target))
	{	
		$conn = open_connection();
		$query = $get_edge_1.'\''.$source.'\''.$get_edge_2.'\''.$target.'\'';
		$result = mysql_query($query,$conn);
		while ($row = mysql_fetch_array($result,MYSQL_NUM))
		{
			$response[] = $row[0];
		}		
		close_connection($conn);
	}
	return(array("source" => $response[0], "target" => $response[1]));
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
			$rc_0 = $r_0 === "" ? "- no location association -" : $r_0;
			$rc_1 = $r_1 === "" ? "- no location association -" : $r_1;
			$b_0[$r_0] = $rc_0;
			$b_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		
		# Remove empty rows for each of $b_0, $b_1 and merge
		//$location = array_merge(array_filter($b_0),array_filter($b_1));
		$location = array_merge($b_0,$b_1);
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
			$rc_0 = $r_0 === "" ? "- no disease association -" : $r_0;
			$rc_1 = $r_1 === "" ? "- no disease association -" : $r_1;
			$d_0[$r_0] = $rc_0;
			$d_1[$r_1] = $rc_1;
		}
		close_connection($conn);
		
		# Remove empty rows for each of $d_0, $d_1 and merge
		//$disease = array_merge(array_filter($d_0),array_filter($d_1));
		$disease = array_merge($d_0,$d_1);
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
	}
	return($mirnas);
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
	$seen = array();
	$interaction_hash = array("binding" => "binding", "ptmod" => "modification",
							  "expression" => "expression", "activation" => "activation");
	if(is_array($ensembl) && !empty($ensembl))
	{
		$conn = open_connection();
		$pro_list = '(\''.implode("', '",$ensembl).'\')';
		$query = $init_edges_1.$pro_list.$init_edges_2.$pro_list;
		$result = mysql_query($query,$conn);
		while (list($id,$target,$source,$interaction) = mysql_fetch_array($result))
		{
			$current_edge = array("id" => $id, "target" => $target, "source" => $source,
								  "label" => $interaction_hash[$interaction],
								  "interaction" => $interaction, "custom" => "");
			// Little hack to eliminate directionality
			$current_edge_tid = implode("_",array($source,$target,$interaction));
			if ($seen[$current_edge_tid] != 1)
			{
				$edges[] = $current_edge;
				$current_edge_tid_inv = implode("_",array($target,$source,$interaction));
				$seen[$current_edge_tid_inv] = 1;
				
			}
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
	$node_schema[] = array("name" => "entrez_id", "type" => "string");
	$node_schema[] = array("name" => "strength", "type" => "string");
	$node_schema[] = array("name" => "expression", "type" => "string");
	$node_schema[] = array("name" => "ratio", "type" => "number");
	$node_schema[] = array("name" => "pvalue", "type" => "number");
	$node_schema[] = array("name" => "fdr", "type" => "number");
	$node_schema[] = array("name" => "object_type", "type" => "string");

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
	global $auto_genes,$auto_ensembl,$auto_uniprot;

	$cl = new SphinxClient();
	$cl->SetServer("localhost",60000);
	$cl->SetLimits(0,100);
	$cl->SetMatchMode(SPH_MATCH_ANY);
	
	if (!isset($species)) { $cl->SetFilter("species",array($species)); }
	else { $cl->ResetFilters(); }
	
	$cl->AddQuery("*".$term."*","kupkbvis_entrez");
	$cl->AddQuery("*".$term."*","kupkbvis_ensembl");
	$cl->ResetFilters();
	$cl->AddQuery("*".$term."*","kupkbvis_uniprot");
	$result = $cl->RunQueries();

	if ( $result === false )
	{
		echo "Query failed: " . $cl->GetLastError() . ".\n";
	}
	else // 0 => Genes, 1 => Ensembl, 2 => Uniprot
	{
		$genes_arr = $result[0];
		$entrez_to_ensembl_arr = $result[1];
		$entrez_to_uniprot_arr = $result[2];
		$gene_match = array();
		$ensembl_match = array();
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

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<?php
session_start();
include('php/utils.php');
include('php/control.php');
include('php/queries.php');
?>

<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8">
	<title>Kidney and Urinary Pathway Knowledge Visualizer</title>
	<link rel="icon" href="/images/justkidney.ico" type="image/x-icon" />
	<link type="text/css" rel="stylesheet" href="css/jquery-ui-1.8.16.custom.css" />
	<link type="text/css" rel="stylesheet" href="css/menu.css" />
	<link type="text/css" rel="stylesheet" href="css/tabs.css" />
	<link type="text/css" rel="stylesheet" href="css/kupkb.css" />
	<script type="text/javascript" src="js/json2.min.js"></script>
	<script type="text/javascript" src="js/AC_OETags.min.js"></script>
	<script type="text/javascript" src="js/cytoscapeweb.min.js"></script>
	<script type="text/javascript" src="js/jquery-1.7.min.js"></script>
	<script type="text/javascript" src="js/jquery-ui-1.8.16.custom.min.js"></script>
	<script type="text/javascript" src="js/jquery.json-2.3.min.js"></script>
	<script type="text/javascript" src="js/jquery.tools.min.js"></script>
	<script type="text/javascript" src="js/graph_control.js"></script>
	<script type="text/javascript" src="js/app_control.js"></script>
</head>

<body>

<!-- Main table container layout -->
<table class="main"><tr><td class="main">

	<!-- Our modal dialog div -->
	<div id="dialog"></div>

	<div class="mainContainer">

		<a href="#"><img src="images/kupkb-logo-small.png" alt="KUPKB" border="0" style="position:relative; left:50px; top:5px;"/></a>
		<table class="innerTable" style="position:relative; left:-60px; top:-40px; border:none"><tr><td class="innerCell" style="border:none; text-align:center;">
			<span style="color:#0E0E0E; font-size:2.1em; font-weight:bold; font-style:italic">The Kidney &amp; Urinary Pathway <span style="color:#E21A30;">K</span>nowledge <span style="color:#E21A30;">B</span>ase</span>
			<br/>
			<span style="font-size: 1.5em; font-weight:bold;"><span style="color:#E21A30;">N</span>etwork <span style="color:#E21A30;">E</span>xplorer</span>
		</td></tr></table>
		
		<div id="menu">
			<ul class="menu">
				<li><a class="parent"><span>View</span></a>
					<ul>
						<li><a onclick="updateLayout('ForceDirected')"><span>Help! Many genes!</span></a>
						<li><a onclick="updateLayout('ForceDirected')"><span>Default</span></a>
						<li><a onclick="updateLayout('Circle')"><span>Circle</span></a></li>
						<li><a onclick="updateLayout('Tree')"><span>Tree</span></a></li>
						<li><a onclick="updateLayout('Radial')"><span>Pizza</span></a></li>
						<li><a onclick="modalLayoutParamForm('View parameters')"><span>Parameters</span></a></li>
					</ul>
				</li>
				<li><a class="parent"><span>Export</span></a>
					<ul>
						<li><a class="parent"><span>Image</span></a>
							<ul>
								<li><a onclick="exportImage('pdf')"><span>PDF</span></a></li>
								<li><a onclick="exportImage('png')"><span>PNG</span></a></li>
								<li><a onclick="exportImage('jpg')"><span>JPG</span></a></li>
							</ul>
						</li>
						<li><a class="parent"><span>Text</span></a>
							<ul>
								<li><a onclick="exportText('sif')"><span>SIF</span></a></li>
								<li><a onclick="exportText('graphml')"><span>GRAPHML</span></a></li>
								<li><a onclick="exportText('xgmml')" ><span>XGMML</span></a></li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
		</div>

		<table class="innerTable">
			<tr>				
			<td rowspan=3 id="graphContainer">
				<div id="cytoscapeweb">
					<table class="innerTable">
						<tr>
						<td class="innerCell">
							<div id="hello_kidney"><img src="images/netInitPic.png" alt="Your network will appear here."/></div>
							<div id="loading_big" style="display:none;"><img src="images/loading.gif"/></div>
						</td>
						</tr>
					</table>
				</div>
			</td>
			<td class="innerCell" style="border-style:dashed; border-width:1px">
				<div id="welcome" style="overflow:auto; border-style:dotted; border-width:1px; border-color:#FF7C7C">
				The KUPKB Network Explorer will help you visualize the relationships among molecules stored in the KUPKB using publicly
				available protein-protein interaction repositories. You can start by typing your molecules in the search area below, using any of the
				following types: Entrez gene ID, gene symbol, Ensembl gene or protein, Uniprot ID or simple text search (multiple IDs are supported!).
				You can then select the species to seek interactions from or just click 'GO' and the queried genes with their relationships will be
				displayed in the panel on the left. The 'KUPKB data' panel below will be filled with the respective data from KUPKB. You can use the
				lists to filter the results and color the network according to expression data stored in the KUPKB.</div>
			</td>
			</tr>
			<tr>
			<td class="innerCell">
				<div id="color_legend" style="visibility:hidden"><table class="innerTable">
					<tr><td colspan=4 class="colorTableCellText">
					<span style="font-size:1.1em; font-weight:bold">Node color legend</span></td>
					</td></tr>
					<tr>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#2B2B2B; opacity:0.8"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Multiple*</td>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#0C5DA5"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Strong</td>
					</tr>
					<tr>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#5FFFFB"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Selected</td>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#539AD9"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Medium</td>
					</tr>
					<tr>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#FF0000"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Up**</td>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#A4C9EB"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Weak</td>
					</tr>
					<tr>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#00FF00"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Down**</td>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#9FFFB5"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Present</td>
					</tr>
					<tr>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#FFDA00"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Unmodified</td>
					<td class="colorTableCellColor" style="width:10%;">
					<table class="innerTable"><tr><td style="background-color:#FFF59F"></td></tr></table></td>
					<td class="colorTableCellText" style="width:40%;">Absent</td>
					</tr>
					<tr>
					<td colspan=4 class="colorTableCellText" style="width:100%; font-size:0.8em">
						*Expression found in multiple selected datasets
					</td>
					</tr>
					<tr>
					<td colspan=4 class="colorTableCellText" style="width:100%; font-size:0.8em">
						**If an expression value is recorded in KUPKB, color varies depending on the value
					</td>
					</tr>
				</table></div>
			</td>
			</tr>
			<tr>
			<td class="optsCell" style="vertical-align:top">
				<div id="info_section" style="visibility:hidden">
					<a class="toggler" onclick="toggleInfo()">Show/Hide element information
					<img id="elinfo_tip" src="images/questionmark.png" title="Click to show or hide a box displaying additional information on a node or edge in the network. Click on a node or edge to display this information. Keep in mind that information on multiple selected elements cannot be displayed at the same time."/></a>
					<div id="element_info" style="opacity:0.0">
						<table class="innerTable"><tr><td class="innerCell">
							<fieldset class="optsGroup"><legend class="fieldSetTitle" style="color:#F0F0F0; background-color:#5A5A5A;">Element information</legend>
								<table class="innerTable" style="table-layout:fixed"><tr><td class="optsCell">
									<div id="infoContainer"></div>
								</td></tr></table>
							</fieldset>		
						</td></tr></table>
					</div>
				</div>
			</td>
			</tr>
		</table>

		<br/>

		<!-- The two tabs of the application -->
		<ul class="tabs">
			<li class="mol"><a id="t1" href="#">Molecule search</a></li>
			<li class="meta"><a id="t2" href="#">GO/KEGG/miRNA</a></li>
			<li class="advanced"><a id="t3" href="#">Advanced</a></li>
		</ul>
		<!-- The tab contents -->
		<div class="panes">
			<div id="controlContainer">
				<table class="innerTable"><tr><td id="functionContainer">
					<table class="innerTable">
						<tr>
						<td class="optsCell" style="width:30%">
							<div>
								<label for="enter_genes"><span class="boldText">Enter search terms</span></label>
								<img id="search_tip" src="images/questionmark.png" title="You can search by Gene Symbol, Entrez ID, Ensembl gene or protein ID, Uniprot ID or simply gene description like 'angiotensin II'"/>
							</div>
							<div>						
								<textarea id="enter_genes" name="enter_genes" wrap="hard" onkeyup="searchAllow()" onclick="searchAllow()"><?php
									# Response to external calling (e.g. the iKUP), has to be like this, else a lot of whitespace...
									if ($_POST['ikup_terms'])
									{
										$from_ikup = $_POST['ikup_terms'];
										$from_ikup = json_decode($from_ikup,$assoc=TRUE);
										if (!is_array($from_ikup)) { $from_ikup = array($from_ikup); }
										$terms = implode("\n",$from_ikup);
										echo $terms;
									}
								?></textarea>
							</div>
							<div id="errorText"></div>
							<div><button id="search_button" class="primaryButton" onclick="search()" disabled>GO</button></div>
							<div><button id="clear_button" class="primaryButton" onclick="resetSearch()" disabled>Clear</button></div>
							<div id="loadingCircle" style="display:none; float:left;"><img src="images/loading_small.gif"></div>
							<div><p>&nbsp;</p></div>
						</td>
						<td class="optsCell" style="width:50%">           
							<fieldset class="optsGroup"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">KUPKB data</legend>
								<table class="innerTable">
									<?php
										$species = initSpecies();
										//array_unshift_assoc($species,999999,'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Species: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('species_list',$species,'NULL',array('onchange' => 'update(\'species_list\')'));
										echo "</td></tr>";
										
										$disease = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Disease: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('disease_list',$disease,'NULL',array('disabled' => 'disabled','onchange' => 'update(\'disease_list\')'));
										echo "</td></tr>";
										
										$location = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Location: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('location_list',$location,'NULL',array('disabled' => 'disabled','onchange' => 'update(\'location_list\')'));
										echo "</td></tr>";
										
										$dataset = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Dataset: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('dataset_list',$dataset,'NULL',array('multiple' => 'multiple', 'style' => 'height:7em', 'disabled' => 'disabled','onchange' => 'colorNodes(\'gene\')'));
										echo "</td></tr>";				
									?>
									<tr>
									<td class="innerCell">
										<button id="reset_gene_data_button" class="secondaryButton" onclick="resetData('gene')" disabled>Reset</button>
										<div id="filterCircle" style="display:none; float:left;"><img src="images/loading_small.gif"></div>
									</td>
									<td class="innerCell" colspan=2>
										<button id="color_network_button" class="secondaryButton" style="font-weight:bold; float:right;" onclick="colorNodes('gene')" disabled>Color network!</button>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:20%">
							<div>
								<fieldset class="optsGroup"><legend class="fieldSetTitle">Interactions</legend>
									<input type="checkbox" id="binding_check" checked disabled onclick="filterEdges()"><span style="color:#028E9B; font-weight:bold;"> binding</span><br/>
									<input type="checkbox" id="ptmod_check" checked disabled onclick="filterEdges()"><span style="color:#133CAC; font-weight:bold;"> modification</span><br/>
									<input type="checkbox" id="expression_check" checked disabled onclick="filterEdges()"><span style="color:#FFAD00; font-weight:bold;"> expression</span><br/>
									<input type="checkbox" id="activation_check" checked disabled onclick="filterEdges()"><span style="color:#FF7800; font-weight:bold;"> activation</span><br/>
									<input type="checkbox" id="go_check" checked disabled onclick="filterEdges()"><span style="color:#9BA402; font-weight:bold;"> GO terms</span><br/>
									<input type="checkbox" id="kegg_check" checked disabled onclick="filterEdges()"><span style="color:#D30068; font-weight:bold;"> KEGG pathways</span><br/>
									<input type="checkbox" id="mirna_check" checked disabled onclick="filterEdges()"><span style="color:#A67D00; font-weight:bold;"> miRNAs</span><br/>
								</fieldset>									
							</div>
						</td>
						</tr>
					</table>
				</td></tr></table>
			</div>
			<div id="metaContainer">
				<table class="innerTable"><tr><td id="metadataContainer">
					<table class="innerTable" style="table-layout:fixed">
						<tr>
						<td class="optsCell" style="width:33%">
							<fieldset class="optsGroup"><legend class="fieldSetTitle">Gene Ontology</legend>
								<table class="innerTable">
									<tr>
									<td class="innerCell" style="width:40%">
										<span class="boldText">GO category:</span>
									</td>
									<td class="innerCell" style="width:60%" colspan=2>
										<table class="innerTable" style="height:50%">
											<tr>
											<td id="go_component" class="goLabel" onclick="changeGOCategory('go_component')">Component</td>
											<td id="go_function" class="goLabel" onclick="changeGOCategory('go_function')">Function</td>
											<td id="go_process"class="goLabel" onclick="changeGOCategory('go_process')">Process</td>
											</tr>
										</table>
									</td>
									</tr>
									<tr>
									<td class="innerCell" colspan=3>
										<?php
											$goterms = array('0' => 'Select...');
											echo html_selectbox('go_list',$goterms,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:12em;','ondblclick' => 'showMeta(\'go\',\'selected\')'));
										?>
									</td>
									</tr>
									<tr>
									<td class="buttonCell">
										<button id="show_selected_go" class="secondaryButton" onclick="showMeta('go','selected')" disabled>Show selected</button>
									</td>
									<td class="buttonCell">
										<button id="clear_selected_go" class="secondaryButton" onclick="clearMeta('go','selected','')" disabled>Clear selected</button>
									</td>
									<td class="buttonCell">&nbsp;</td>
									</tr>
									<tr>
									<td class="buttonCell">
										<button id="show_all_go" class="secondaryButton" onclick="showMeta('go','all')" disabled>Show all</button>
									</td>
									<td class="buttonCell">
										<button id="clear_all_go" class="secondaryButton" onclick="clearMeta('go','all','')" disabled>Clear all</button>
									</td>
									<td class="buttonCell" style="float:right">
										<button id="clear_all_go_cat" class="secondaryButton" onclick="clearMeta('go','all','all')" disabled>Clear all GO</button>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:33%">
							<fieldset class="optsGroup"><legend class="fieldSetTitle">KEGG Pathways</legend>
								<table class="innerTable">
									<?php
										$kegg = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\" colspan=2>";
										echo "<span class=\"boldText\">Selected organism pathways: </span>";
										echo "</td></tr><tr><td class=\"innerCell\" colspan=2>";
										echo html_selectbox('kegg_list',$kegg,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:12em;','ondblclick' => 'showMeta(\'kegg\',\'selected\')'));
										echo "</td></tr>";
									?>
									<tr>
									<td class="buttonCell">
										<button id="show_selected_kegg" class="secondaryButton" onclick="showMeta('kegg','selected')" disabled>Show selected</button>
									</td>
									<td class="buttonCell">
										<button id="clear_selected_kegg" class="secondaryButton" onclick="clearMeta('kegg','selected','')" disabled>Clear selected</button>
									</td>
									</tr>
									<tr>
									<td class="buttonCell">
										<button id="show_all_kegg" class="secondaryButton" onclick="showMeta('kegg','all')" disabled>Show all</button>
									</td>
									<td class="buttonCell">
										<button id="clear_all_kegg" class="secondaryButton" onclick="clearMeta('kegg','all','')" disabled>Clear all</button>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:33%">
							<fieldset class="optsGroup"><legend class="fieldSetTitle">miRNA</legend>
								<table class="innerTable">
									<?php
										$mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\" colspan=2>";
										echo "<span class=\"boldText\">Target miRNAs: </span>";
										echo "</td></tr><tr><td class=\"innerCell\" colspan=2>";
										echo html_selectbox('mirna_list',$mirna,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:12em;','ondblclick' => 'showMeta(\'mirna\',\'selected\')'));
										echo "</td></tr>";
									?>
									<tr>
									<td class="buttonCell">
										<button id="show_selected_mirna" class="secondaryButton" onclick="showMeta('mirna','selected')" disabled>Show selected</button>
									</td>
									<td class="buttonCell">
										<button id="clear_selected_mirna" class="secondaryButton" onclick="clearMeta('mirna','selected','')" disabled>Clear selected</button>
									</td>
									</tr>
									<tr>
									<td class="buttonCell">
										<button id="show_all_mirna" class="secondaryButton" onclick="showMeta('mirna','all')" disabled>Show all</button>
									</td>
									<td class="buttonCell">
										<button id="clear_all_mirna" class="secondaryButton" onclick="clearMeta('mirna','all','')" disabled>Clear all</button>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						</tr>
					</table>
				</td></tr></table>
			</div>
			<div id="advoptContainer">
				<table class="innerTable"><tr><td id="advancedContainer">
					<table class="innerTable" style="table-layout:fixed">
						<tr>
						<td class="optsCell" style="width:35%">           
							<fieldset class="optsGroup"><legend class="fieldSetTitle">KUPKB miRNA data</legend>
								<table class="innerTable">
									<?php										
										$disease_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Disease: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('disease_mirna_list',$disease_mirna,'NULL',array('disabled' => 'disabled','onchange' => 'update(\'disease_mirna_list\')'));
										echo "</td></tr>";
										
										$location_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Location: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('location_mirna_list',$location_mirna,'NULL',array('disabled' => 'disabled','onchange' => 'update(\'location_mirna_list\')'));
										echo "</td></tr>";
										
										$dataset_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Dataset: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('dataset_mirna_list',$dataset_mirna,'NULL',array('multiple' => 'multiple', 'style' => 'height:8em', 'disabled' => 'disabled','onchange' => 'colorNodes(\'mirna\')'));
										echo "</td></tr>";				
									?>
									<tr>
									<td class="innerCell">
										<button id="reset_mirna_data_button" class="secondaryButton" onclick="resetData('mirna')" disabled>Reset</button>
										<div id="filterCircle" style="display:none; float:left;"><img src="images/loading_small.gif"></div>
									</td>
									<td class="innerCell" colspan=2>
										<button id="color_mirna_button" class="secondaryButton" style="font-weight:bold; float:right;" onclick="colorNodes('mirna')" disabled>Color miRNAs!</button>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:35%">
						<div>
							<fieldset class="optsGroup"><legend class="fieldSetTitle">Node coloring</legend>
								<table class="innerTable" style="height:50%">
									<tr>
									<td class="innerCell">
										<table class="innerTable">
											<tr>
											<td colspan=2 class="layoptCell">Limit disease and/or location on selection
											<img class="hint" id="restrict_tip" src="images/questionmark.png" title="Check this to limit the contents of Disease and Location lists for genes and/or miRNAs, based on what is selected on the other one. E.g. if disease='proteinuria', the location list will be filled only with locations associated with proteinuria, else the original search result is maintained. This always ensures that expression data for coloring exist."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="restrict_gene_check" disabled /> genes</td>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="restrict_mirna_check" disabled /> miRNAs</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell">Allow multiple node coloring
											<img class="hint" id="multicolor_tip" src="images/questionmark.png" title="Check this to allow mutliple colors in a gene/miRNA in the network, if this is found to be present in multiple selected datasets. Expression in multiple datasets will be represented by a larger node containing several smaller ones, according to the number of the datasets. Each one will be colored based on the expression recorded in the dataset."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="multicolor_gene_check" onclick="checkMultiColor('gene')" checked disabled /> genes</td>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="multicolor_mirna_check" onclick="checkMultiColor('mirna')" checked disabled /> miRNAs</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell">Gene expression lookup also based on
											<img class="hint" id="allgenecrit_tip" src="images/questionmark.png" title="Check any of these boxes to put disease/location restrictions when searching for gene expression data. For example, if both of the boxes are checked, the application will search for expression data matching the selected disease, location and dataset(s). If none is checked, the application looks for expression data for coloring only based on the selected dataset(s)."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="disease_gene_check" disabled /> disease</td>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="location_gene_check" disabled /> location</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell">miRNA expression lookup also based on
											<img class="hint" id="allmirnacrit_tip" src="images/questionmark.png" title="Check any of these boxes to put disease/location restrictions when searching for miRNA expression data. For example, if both of the boxes are checked, the application will search for expression data matching the selected disease, location and dataset(s). If none is checked, the application looks for expression data for coloring only based on the selected dataset(s)."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="disease_mirna_check" disabled /> disease</td>
											<td class="layoptCell" style="width:50%"><input type="checkbox" id="location_mirna_check" disabled /> location</td>
											</tr>
										</table>
									</td>
									</tr>
								</table>
							</fieldset>									
						</div>
						</td>
						<td class="optsCell" style="width:30%">
						<div>
							<fieldset class="optsGroup"><legend class="fieldSetTitle">Other</legend>
								<input type="checkbox" id="node_labels_check" checked disabled onclick="showLabels('nodes')"> show node labels&nbsp;&nbsp;&nbsp;
								<input type="checkbox" id="edge_labels_check" disabled onclick="showLabels('edges')"> show edge labels<br/>
								<input type="checkbox" id="sig_size_check" onclick="sigSizeChange()" checked disabled> border relative to significance
								<span class="hint"><img id="sigsize_tip" src="images/questionmark.png" title="Check this box to make the nodes outline thickness relative to a gene/miRNA's p-value, if the latter exists in the selected KUPKB dataset(s)."/></span><br/>
								<input type="checkbox" id="allow_click_color_check" onclick="toggleClickColor()" checked disabled> allow coloring on dataset(s) click
								<span class="hint"><img id="allowclickcolor_tip" src="images/questionmark.png" title="Check this box to allow the coloring of network nodes simply by clicking on the dataset name(s) in the list. Otherwise, the respective button must be pressed. Use this option to explore the datasets without excessive workload for the server."/></span>
								<hr>
								<table class="innerTable">
									<tr>
									<td class="layoptCell" style="width:60%; border-bottom-style:dotted; border-bottom-width:1px"><span class="boldText">Nodes</span></td>
									<td class="layoptCell" style="width:40%; border-bottom-style:dotted; border-bottom-width:1px"><span class="boldText">Edges</span></td>
									</tr>
									<tr>
									<td class="layoptCell" style="border-right-style:dotted; border-right-width:1px">
										<label><span style="font-size:0.9em">Get neighbors</span></label>
										<button id="fetch_neighbors_1" class="secondaryButton" style="float:none" onclick="fetchNeighbors(1)" disabled>L1</button>
										<button id="fetch_neighbors_2" class="secondaryButton" style="float:none" onclick="fetchNeighbors(2)" disabled>L2</button>
									</td>
									<td class="layoptCell">&nbsp;</td>
									</tr>
									<tr>
									<td class="layoptCell" style="border-right-style:dotted; border-right-width:1px">
										<button id="hide_node" class="secondaryButton" onclick="hideElements('nodes','hide')" disabled>Hide selected</button>
									</td>
									<td class="layoptCell">
										<button id="hide_edge" class="secondaryButton" onclick="hideElements('edges','hide')" disabled>Hide selected</button>
									</td>
									</tr>
									<tr>
									<td class="layoptCell" style="border-right-style:dotted; border-right-width:1px">
										<button id="delete_node" class="secondaryButton" onclick="hideElements('nodes','delete')" disabled>Delete selected</button>
									</td>
									<td class="layoptCell">
										<button id="delete_edge" class="secondaryButton" onclick="hideElements('edges','delete')" disabled>Delete selected</button>
									</td>
									</tr>
									<tr>
									<td class="layoptCell" style="border-right-style:dotted; border-right-width:1px">
										<button id="mark_neighbors" class="secondaryButton" onclick="showNeighbors(1)" disabled>Mark neighbors</button>
									</td>
									<td class="layoptCell">&nbsp;</td>
									</tr>
									<tr>
									<td colspan=2 class="layoptCell" style="text-align:center; border-top-style:dotted; border-top-width:1px">
										<button id="restore_network" class="secondaryButton" style="font-size:1em; width:90%; float:none" onclick="restoreNetwork()" disabled>Restore network</button>
									</td>
									</tr>
								</table>
							</fieldset>								
						</div>
						</td>
						</tr>
					</table>
				</td></tr></table>
			</div>
		</div>
				
		<table class="innerTable">
			<tr>
			<td>    
			<div class="footer">
				<p class="disclaimer">The Kidney and Urinary Pathway Knowledge Base has been developed in collaboration between the <a href="http://renalfibrosis.free.fr" target="_blank">Renal Fibrosis Laboratory</a> at INSERM, France and the <a href="http://intranet.cs.man.ac.uk/bhig/" target="_blank">Bio-health Informatics Group</a> at the University of Manchester, UK. This work has been funded by <a href="http://www.e-lico.eu" target="_blank">e-LICO project</a>, an EU-FP7 Collaborative Project (2009-2012) Theme ICT-4.4: Intelligent Content and Semantics.</p>
				<div class="logos">
					<a href="http://renalfibrosis.free.fr" target="_blank"><img class="logo" src="images/logorflab.jpg" border="0"></a>
					<a href="http://intranet.cs.man.ac.uk/bhig" target="_blank"><img class="logo" src="images/BHIG.png" border="0" ></a>
					<a href="http://www.inserm.fr" target="_blank"><img class="logo" style="width:180px;" src="images/inserm-logo.png" border="0"></a>
					<a href="http://www.manchester.ac.uk" target="_blank"><img class="logo" style="height:40px;" src="images/logomanchester.gif" border="0"></a>
					<a href="http://www.e-lico.eu" target="_blank"><img class="logo" style="width:40px;" src="images/elico-logo.png" border="0"></a>
				</div>
			</div>
			</td>
			</tr>
		</table>

	</div>

	<div id="navtxt" class="navtext" style="position:absolute; top:-100px; left:0px; visibility:hidden"></div>

<!-- End Main table container layout -->
</td></tr></table>

<!-- Some element initialization functions -->
<script type="text/javascript">
	$("ul.tabs").tabs("div.panes > div");
	$("#species_list").val(9606);
	clearCache();
	bindAutoComplete('enter_genes');
	initTooltip(['search_tip','elinfo_tip','allgenecrit_tip','allmirnacrit_tip','multicolor_tip','sigsize_tip','restrict_tip','allowclickcolor_tip']);
</script>

<!-- Here, PHP code for handling a call from the iKUP. It will receive the JSON, send it
to control.php with the selected species and then initiate a search through JS -->
<?php
if ($_POST['ikup_terms'])
{
	echo "<script type=\"text/javascript\">search()</script>";
}
?>
</body>
</html>


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
	<link type="text/css" rel="stylesheet" href="css/dataset.css" />
	<link type="text/css" rel="stylesheet" href="css/kupkb.css" />
	<!--[if IE 8]>
		<link rel="stylesheet" type="text/css" href="css/kupkb-ie8.css">
	<![endif]-->
	<script type="text/javascript" src="js/json2.min.js"></script>
	<script type="text/javascript" src="js/AC_OETags.min.js"></script>
	<script type="text/javascript" src="js/cytoscapeweb.min.js"></script>
	<script type="text/javascript" src="js/jquery-1.7.min.js"></script>
	<script type="text/javascript" src="js/jquery-ui-1.8.16.custom.min.js"></script>
	<script type="text/javascript" src="js/jquery.json-2.3.min.js"></script>
	<script type="text/javascript" src="js/jquery.tools.min.js"></script>
	<script type="text/javascript" src="js/graph_control.js"></script>
	<script type="text/javascript" src="js/app_control.js"></script>
	<script type="text/javascript" src="js/simpletimer.js"></script>
</head>

<body onunload="endTimer();">
<body>

<!-- Piwik hack... -->
<script language="javascript" type="text/javascript">startTimer()</script>

<!-- Main table container layout -->
<table class="main"><tr><td class="main">

	<!-- Our modal dialog div -->
	<div id="dialog"></div>
	<!-- The dataset description popup div -->
	<div id="dataset_popup" class="tooltip-dataset"></div>
	<!-- Internet Exlorer < 9 ... -->
	<div id="ieDetect" style="display:none; margin-left:20px; font-size:1em; z-index:50;"></div>
	<!-- IE8 and lower hacks... -->
	<div id="top-left"></div><div id="top-right"></div><div id="bottom-left"></div>

	<div class="mainContainer">

		<!--<a href="#"><img src="images/kupkb-logo-small.png" alt="KUPKB" border="0" style="position:relative; left:50px; top:5px;"/></a>-->
		<a href="#"><img src="images/logobetaok.jpg" alt="Vis beta" border="0" style="position:static; left:50px; top:5px;"/></a>
		<table class="titleTable"><tr><td class="innerCell" style="border:none; text-align:center;">
			<span style="color:#0E0E0E; font-size:2.1em; font-weight:bold; font-style:italic">The Kidney &amp; Urinary Pathway <span style="color:#E21A30;">K</span>nowledge <span style="color:#E21A30;">B</span>ase</span>
			<br/>
			<span style="font-size: 1.5em; font-weight:bold;"><span style="color:#E21A30;">N</span>etwork <span style="color:#E21A30;">E</span>xplorer<span style="color:#E21A30; font-size:0.7em; vertical-align:super"><em> beta</em></span></span>
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
						<li><a onclick="updateLayout('CompoundSpringEmbedder')"><span>Compound</span></a></li>
						<li><a onclick="modalLayoutParamForm('View parameters')"><span>Parameters</span></a></li>
					</ul>
				</li>
				<li><a class="parent"><span>Export</span></a>
					<ul>
						<li><a class="parent"><span>Image</span></a>
							<ul>
								<li><a onclick="exportImage('pdf')"><span>PDF</span></a></li>
								<li><a onclick="exportImage('png')"><span>PNG</span></a></li>
								<li><a onclick="exportImage('svg')"><span>SVG</span></a></li>
							</ul>
						</li>
						<li><a class="parent"><span>Text</span></a>
							<ul>
								<li><a onclick="exportText('sif')"><span>SIF</span></a></li>
								<li><a onclick="exportText('graphml')"><span>GRAPHML</span></a></li>
								<li><a onclick="exportText('xgmml')" ><span>XGMML</span></a></li>
								<li><a onclick="exportText('arena')" ><span>Arena3D</span></a></li>
							</ul>
						</li>
					</ul>
				</li>
				<li><a href="files/KUPNetViz_guide.pdf" target="_blank" class="parent"><span>Help</span></a></li>
				<!--<li><a onclick="toggleFullScreen()" class="parent"><span>Fullscreen</span></a></li>-->
			</ul>
		</div>

		<table class="innerTable">
			<tr>				
			<td rowspan=2 id="graphContainer">
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
			<td class="innerCell">
				<div id="color_legend" style="visibility:hidden; height:210px;">
				<table class="innerTable" style="height:100%">
					<tr>
					<td colspan=4 class="colorTableCellText" style="height:32px;">
						<span style="font-size:1.1em; font-weight:bold">Gene/protein node legend</span>
					</td>
					</tr>
					<tr>
					<td rowspan=5 class="colorTableCellColor" style="text-align:center; width:10%; height:155px;">
						<table class="innerTable"><tr><td style="background:url(images/colorbar.png) no-repeat center;"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Up</td>
					<td class="colorTableCellColor" style="width:10%;">
						<table class="innerTable"><tr><td style="background-color:#0C5DA5"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Strong</td>
					</tr>
					<tr>
					<!--<td class="colorTableCellColor" style="width:10%;"></td>-->
					<td class="colorTableCellText" style="width:40%;">&nbsp;</td>
					<td class="colorTableCellColor" style="width:10%;">
						<table class="innerTable"><tr><td style="background-color:#539AD9"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Medium</td>
					</tr>
					<tr>
					<!--<td class="colorTableCellColor" style="width:10%;"></td>-->
					<td class="colorTableCellText" style="width:40%;">Unmodified</td>
					<td class="colorTableCellColor" style="width:10%;">
						<table class="innerTable"><tr><td style="background-color:#A4C9EB"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Weak</td>
					</tr>
					<tr>
					<!--<td class="colorTableCellColor" style="width:10%;"></td>-->
					<td class="colorTableCellText" style="width:40%;">&nbsp;</td>
					<td class="colorTableCellColor" style="width:10%;">
						<table class="innerTable"><tr><td style="background-color:#9FFFB5"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Present</td>
					</tr>
					<tr>
					<!--td class="colorTableCellColor" style="width:10%;"></td>-->
					<td class="colorTableCellText" style="width:40%;">Down</td>
					<td class="colorTableCellColor" style="width:10%;">
						<table class="innerTable"><tr><td style="background-color:#FFF59F"></td></tr></table>
					</td>
					<td class="colorTableCellText" style="width:40%;">Absent</td>
					</tr>
					<!--<tr>
					<td colspan=4 class="colorTableCellText" style="width:100%; font-size:0.8em">
						**If an expression value is recorded in KUPKB, color varies depending on the value
					</td>
					</tr>-->
				</table>
				</div>
				<!--<table class="innerTable">
				<tr>
				<td class="colorTableCellText" style="font-size:0.8em; line-height:1.3em; padding-top:5px; padding-bottom:0px; vertical-align:bottom;">
					*Relative to highest Up and Down values in the network. E.g. if the highest Up value is 12, a value of 2.8 might be close to the Unmodified level.
				</td>
				</tr>
				</table>-->
				<div id="shape_legend" style="visibility:hidden; height:60px">
				<table class="innerTable"><tr><td class="innerCell" style="padding:0px; border-style:dashed; border-width:1px;"><img src="images/basic_shapes.png" alt="" width="100%" height="100%" style="display: block; margin-top:auto; margin-bottom:auto;"></td></tr></table>
				</div>
			</td>
			</tr>
			<tr>
			<td class="optsCell" style="vertical-align:bottom; height:90%; padding-top:0px; padding-bottom:0px;">
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
		
		<!-- The four tabs of the application -->
		<ul class="tabs">
			<li class="mol"><a id="t1" href="#">1. Molecule search</a></li>
			<li class="kupkb"><a id="t2" href="#">2. Add KUPKB data</a></li>
			<li class="meta"><a id="t3" href="#">3. Add GO, KEGG or miRNA data</a></li>
			<li class="advanced"><a id="t4" href="#">Advanced</a></li>
		</ul>
		<!-- The tab contents -->
		<div class="panes">
			<div id="controlContainer">
				<table class="innerTable"><tr><td id="functionContainer">
					<table class="innerTable">
						<tr>
						<td class="optsCell" style="width:25%">
							<div>
								<label for="enter_genes"><span class="boldText">Enter search terms</span></label>
								<img id="search_tip" src="images/questionmark.png" title="You can search by Gene Symbol, Entrez ID, Ensembl gene or protein ID, Uniprot ID or simply gene description like 'angiotensin II'. You can also select multiple species."/>
							</div>
							<div>						
								<textarea id="enter_genes" name="enter_genes" wrap="hard" onkeyup="searchAllow()" onclick="searchAllow()"><?php
									# Response to external calling (e.g. the iKUP), has to be like this, else a lot of whitespace...
									if ($_POST['ikup_terms'])
									{
										$from_ikup = $_POST['ikup_terms'];
										echo $_POST['ikup_terms'];
										$from_ikup = json_decode($from_ikup,$assoc=TRUE);
										if (!is_array($from_ikup)) { $from_ikup = array($from_ikup); }
										$terms = implode("\n",$from_ikup);
										echo $terms;
									}
								?></textarea>
							</div>
							<div id="errorText" style="display:none"></div>
							<div>
								<table class="innerTable" style="width:90%">
								<?php
									$species = initSpecies();
									echo "<tr><td class=\"innerCell\" style=\"vertical-alignment:top;width:50%;line-height:1em;\">";
									echo "<span class=\"boldText\">Species: </span>";
									echo "<br/><br/><span style=\"font-size:0.9em;\">Hold down the Ctrl key to select multiple species</span>";
									echo "</td><td class=\"innerCell\" style=\"width:50%;\">";
									echo html_selectbox('species_list',$species,'NULL',array('multiple' => 'multiple', 'onchange' => 'update(\'species_list\')'));
									echo "</td></tr>";
								?>
								</table>
								<table class="innerTable">
								<tr>
								<td class="innerCell" style="width:10%">
									<button id="search_button" class="primaryButton" onclick="search()" disabled>GO</button>
								</td>
								<td class="innerCell" style="width:10%">
									<button id="clear_button" class="primaryButton" onclick="resetSearch()" disabled>Clear</button>
								</td>
								<td class="innerCell" style="width:80%">
									<div class="loadingCircle" style="float:left;"><img src="images/loading_small.gif"></div>
								</td>
							</table>
							</div>
						</td>
						<td class="innerCell" style="vertical-align:top; width:75%">
							<div id="welcome" style="overflow:auto;">
							The KUPKB Network Explorer will help you visualize the relationships among molecules stored in the KUPKB. Type your molecules in the search area
							and click 'GO' to display the network in the panel on top. Tabs 2 and 3 will be filled with data from KUPKB. Navigate through the in different tabs
							to filter the results and map expression data stored in the KUPKB.
							<ol>
								<li style="display:list-item;"> <!-- IE bug with ordered lists!... -->
								Enter your molecules in the search area to the left, using any of the following types: Entrez gene ID, gene symbol, Ensembl gene or protein ID,
								Uniprot ID, mirBase miRNA IDs or simple text search (multiple ID types are supported!). You will also get auto-complete suggestions.
								</li>
								<li style="display:list-item;">
								Select KUPKB datasets based on kidney locations and diseases criteria to color the nodes of the network. The displayed datasets were found to contain at
								least one of your searched molecules and are limited to the selected species. Filter the displayed edges and fetch neighbors of selected genes/proteins.
								</li>
								<li style="display:list-item;">
								Add GO terms and KEGG pathways containing the queried genes or add miRNAs that target your queried molecules to the network.
								</li>
								</li>
							</ol>
							The "Advanced" tab contains more advanced functionalities of the network browser related to the nodes/edges appearance, search modes, coloring options and
							how the filtering lists (tab 2) behave. It also contains functionalities related to the neighbouring genes of each node. The neighbour functions are also
							accessible by selecting and right-clicking on nodes/edges. Use the tooltips for guidance.<br/><br/>
							<button id="guide_button" class="secondaryButton" onclick="window.open('files/KUPNetViz_guide.pdf','_blank')">Get the KUPNetViz user's guide</button>
							<button id="example1_button" class="secondaryButton" onclick="example(1)">Launch example 1 in paper</button>
							<button id="example2_button" class="secondaryButton" onclick="example(2)">Launch example 2 in paper</button>
							<button id="example3_button" class="secondaryButton" onclick="example(3)">Launch example 3 in paper</button>
							<br/><br/><div id="example_warning" style="color:#DF0000; font-weight:bold; display=block; float=left;"></div>
							</div>
						</td>
						</tr>
					</table>
				</td></tr></table>
			</div>
			<div id="kupkbContainer">
				<table class="innerTable"><tr><td id="kupkbdataContainer">
					<table class="innerTable">
						<tr>
						<td class="optsCell" style="width:38%">           
							<fieldset class="optsGroup"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">KUPKB gene/protein data</legend>
								<table class="innerTable">
									<?php
										$disease = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Disease: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('disease_list',$disease,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled', 'onchange' => 'update(\'disease_list\')'));
										echo "</td></tr>";
										
										$location = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Location: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('location_list',$location,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled', 'onchange' => 'update(\'location_list\')'));
										echo "</td></tr>";
										
										$dataset = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Dataset: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('dataset_list',$dataset,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled'));
										echo "</td></tr>";				
									?>
									<tr>
									<td class="innerCell">
										<button id="reset_gene_data_button" class="secondaryButton" onclick="resetData('gene')" disabled>Reset</button>
										<div class="loadingCircle" style="float:left;"><img src="images/loading_small.gif"></div>
									</td>
									<td class="innerCell" colspan=2>
										<button id="color_network_button" class="secondaryButton" style="font-weight:bold; float:right;" onclick="colorNodes('gene')" disabled>Color network!</button>
									</td>
									</tr>
								</table>
								<hr>
								<table class="innerTable">
									<tr>
									<td colspan=3 class="layoptsCell" style="font-size:0.9em">Lookup gene expression based on:</td>
									</tr>
									<tr>
									<td class="layoptsCell" style="width:33%; font-size:0.9em">
										<input type="radio" id="gene_disease_radio" name="gene_radio" onclick="checkLookup('gene','disease')" disabled /><label for="gene_disease_radio">Disease</label>
									</td>
									<td class="layoptsCell" style="width:33%; font-size:0.9em">
										<input type="radio" id="gene_location_radio" name="gene_radio" onclick="checkLookup('gene','location')" disabled /><label for="gene_location_radio">Location</label>
									</td>
									<td class="layoptsCell" style="width:33%; font-size:0.9em">
										<input type="radio" id="gene_both_radio" name="gene_radio" onclick="checkLookup('gene','both')" checked disabled /><label for="gene_location_radio">Both</label>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:38%">           
							<fieldset class="optsGroup"><legend class="fieldSetTitle">KUPKB miRNA data</legend>
								<table class="innerTable">
									<?php										
										$disease_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Disease: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('disease_mirna_list',$disease_mirna,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled', 'onchange' => 'update(\'disease_mirna_list\')'));
										echo "</td></tr>";
										
										$location_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Location: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('location_mirna_list',$location_mirna,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled', 'onchange' => 'update(\'location_mirna_list\')'));
										echo "</td></tr>";
										
										$dataset_mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\">";
										echo "<span class=\"boldText\">Dataset: </span>";
										echo "</td><td class=\"innerCell\">";
										echo html_selectbox('dataset_mirna_list',$dataset_mirna,'NULL',array('multiple' => 'multiple', 'style' => 'height:5em', 'disabled' => 'disabled'));
										echo "</td></tr>";				
									?>
									<tr>
									<td class="innerCell">
										<button id="reset_mirna_data_button" class="secondaryButton" onclick="resetData('mirna')" disabled>Reset</button>
										<div class="loadingCircle" style="float:left;"><img src="images/loading_small.gif"></div>
									</td>
									<td class="innerCell" colspan=2>
										<button id="color_mirna_button" class="secondaryButton" style="font-weight:bold; float:right;" onclick="colorNodes('mirna')" disabled>Color miRNAs!</button>
									</td>
									</tr>
								</table>
								<hr>
								<table class="innerTable">
									<tr>
									<td colspan=3 class="layoptsCell" style="width:40%; font-size:0.9em">Lookup miRNA expression based on:</td>
									</tr>
									<tr>
									<td class="layoptsCell" style="width:20%; font-size:0.9em">
										<input type="radio" id="mirna_disease_radio" name="mirna_radio" onclick="checkLookup('mirna','disease')" disabled /><label for="mirna_disease_radio">Disease</label>
									</td>
									<td class="layoptsCell" style="width:20%; font-size:0.9em">
										<input type="radio" id="mirna_location_radio" name="mirna_radio" onclick="checkLookup('mirna','location')" disabled /><label for="mirna_location_radio">Location</label>
									</td>
									<td class="layoptsCell" style="width:20%; font-size:0.9em">
										<input type="radio" id="mirna_both_radio" name="mirna_radio" onclick="checkLookup('mirna','both')" checked disabled /><label for="mirna_location_radio">Both</label>
									</td>
									</tr>
								</table>
							</fieldset>
						</td>
						<td class="optsCell" style="width:24%">
							<div>
								<fieldset class="optsGroup"><legend class="fieldSetTitle">Displayed interactions</legend>
									<input type="checkbox" id="binding_check" checked disabled onclick="filterEdges()"><label for="binding_check"><span style="color:#028E9B; font-weight:bold;"> binding &mdash;</span></label><br/>
									<input type="checkbox" id="ptmod_check" checked disabled onclick="filterEdges()"><label for="ptmod_check"><span style="color:#133CAC; font-weight:bold;"> modification <span style="font-size:1.5em;">&rarr;</span></span></label><br/>
									<input type="checkbox" id="expression_check" checked disabled onclick="filterEdges()"><label for="expression_check"><span style="color:#9BA402; font-weight:bold;"> expression (stimulation) <span class="condensed">&ndash;&#9679;</span></span></label><br/>
									<input type="checkbox" id="inhibition_check" checked disabled onclick="filterEdges()"><label for="inhibition_check"><span style="color:#EE0000; font-weight:bold;"> expression (inhibition) <span class="condensed">&ndash;|</span></span></label><br/>
									<input type="checkbox" id="activation_check" checked disabled onclick="filterEdges()"><label for="activation_check"><span style="color:#00A300; font-weight:bold;"> activation <span style="font-size:1.5em;">&rarr;</span></span></label><br/>
									<input type="checkbox" id="go_check" checked disabled onclick="filterEdges()"><label for="go_check"><span style="color:#FFAD00; font-weight:bold;"> GO terms &mdash;</span></label><br/>
									<input type="checkbox" id="kegg_check" checked disabled onclick="filterEdges()"><label for="kegg_check"><span style="color:#D30068; font-weight:bold;"> KEGG pathways &mdash;</span></label><br/>
									<input type="checkbox" id="mirna_check" checked disabled onclick="filterEdges()"><label for="mirna_check"><span style="color:#F889FF; font-weight:bold;"> miRNAs &mdash;</span></label><br/>
								</fieldset>
								<fieldset class="optsGroup" style="margin-top:10px"><legend class="fieldSetTitle">Other</legend>
									<table class="innerTable">
										<tr>
										<td class="layoptCell">
											<label><span style="font-size:0.9em">Get neighbors for selected gene(s)</span></label>
										</td>
										</tr>
										<tr>
										<td class="layoptCell">
											<button id="fetch_neighbors_11" class="secondaryButton" style="float:none" onclick="fetchNeighbors(1)" disabled>Level 1</button>
											<button id="fetch_neighbors_22" class="secondaryButton" style="float:none" onclick="fetchNeighbors(2)" disabled>Level 2</button>
											<div class="loadingCircle" style="float:right"><img src="images/loading_small.gif"></div>
										</td>
										</tr>
									</table>
									<hr style="margin-top:2px; margin-bottom:2px">
									<table class="innerTable">
										<tr>
										<td class="layoptCell">
											<button id="toggle_fullscreen" class="secondaryButton" style="float:none" onclick="toggleFullScreen()" disabled>Toggle network fullscreen</button>
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
											echo html_selectbox('go_list',$goterms,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:15em;','ondblclick' => 'showMeta(\'go\',\'selected\')'));
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
										echo html_selectbox('kegg_list',$kegg,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:15em;','ondblclick' => 'showMeta(\'kegg\',\'selected\')'));
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
							<fieldset class="optsGroup"><legend class="fieldSetTitle">mirBase microRNA</legend>
								<table class="innerTable">
									<?php
										$mirna = array('0' => 'Select...');
										echo "<tr><td class=\"innerCell\" colspan=2>";
										echo "<span class=\"boldText\">Target miRNAs: </span>";
										echo "</td></tr><tr><td class=\"innerCell\" colspan=2>";
										echo html_selectbox('mirna_list',$mirna,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%; height:15em;','ondblclick' => 'showMeta(\'mirna\',\'selected\')'));
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
						<td class="optsCell" style="width:33%">
						<div>
							<fieldset class="optsGroup" style="padding-bottom:1px;"><legend class="fieldSetTitle">Search options</legend>
								<table class="innerTable" style="height:50%">
									<tr>
									<td class="innerCell">
										<table class="innerTable">
											<tr>
											<td colspan=3 class="layoptCell"><strong>Gene/protein search mode</strong>
											<img class="hint" id="gene_mode_tip" src="images/questionmark.png" title="Use these options to control how the disease/location lists are populated upon selections on any of the two for KUPKB genes/proteins. Free search displays all the diseases/locations for the queried genes constantly and only datasets are repopulated, re-populate refills the disease/location lists upon a selection in either, strict repopulates only once. Thus, to apply new criteria you must click the Reset button."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:33%"><input type="radio" id="gene_mode_free_radio" name="gene_mode_radio" disabled /><label for="gene_mode_free_radio">free</label></td>
											<td class="layoptCell" style="width:33%"><input type="radio" id="gene_mode_repop_radio" name="gene_mode_radio" disabled /><label for="gene_mode_repop_radio">re-populate</label></td>
											<td class="layoptCell" style="width:33%"><input type="radio" id="gene_mode_strict_radio" name="gene_mode_radio" checked disabled /><label for="gene_mode_strict_radio">strict</label></td>
											</tr>
											<tr>
											<td colspan=3 class="layoptCell"><strong>miRNA search mode</strong>
											<img class="hint" id="mirna_mode_tip" src="images/questionmark.png" title="Use these options to control how the disease/location lists are populated upon selections on any of the two for KUPKB miRNAs. Free search displays all the diseases/locations for the queried miRNAs constantly and only datasets are repopulated, re-populate refills the disease/location lists upon a selection in either, strict repopulates only once. Thus, to apply new criteria you must click the Reset button."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:33%"><input type="radio" id="mirna_mode_free_radio" name="mirna_mode_radio" disabled /><label for="mirna_mode_free_radio">free</label></td>
											<td class="layoptCell" style="width:33%"><input type="radio" id="mirna_mode_repop_radio" name="mirna_mode_radio" disabled /><label for="mirna_mode_repop_radio">re-populate</label></td>
											<td class="layoptCell" style="width:33%"><input type="radio" id="mirna_mode_strict_radio" name="mirna_mode_radio" checked disabled /><label for="mirna_mode_strict_radio">strict</label></td>
											</tr>
											<tr>
											<td colspan=3 class="layoptCell"><strong>Neighbor search mode</strong>
											<img class="hint" id="neighbor_tip" src="images/questionmark.png" title="Use these options to control the behavior of the application when fetching the neighbors of a selected gene/protein. If 'all' is selected, all the selected organism genes which have a relationship with the selected one(s) will be displayed whereas if 'only in KUPKB is selected, only neighbors that have a role in the relative KUPKB datasets (2nd tab) will be displayed instead of all genes of the species."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:33%"><input type="radio" id="neighbor_all_radio" name="neighbor_radio" disabled /><label for="neighbor_all_radio">whole genome</label></td>
											<td class="layoptCell" style="width:33%"><input type="radio" id="neighbor_kupkb_radio" name="neighbor_radio" disabled checked /><label for="neighbor_kupkb_radio">only in KUPKB</label></td>
											<td class="layoptCell" style="width:33%">&nbsp;</td>
											</tr>
											<tr>
											<td colspan=3 class="layoptCell"><strong>Edges among neighbors</strong>
											<img class="hint" id="neighbor_edge_tip" src="images/questionmark.png" title="Use these options to control the display of edges among genes/proteins after fetching neighbors for the selected node(s). If 'all' is selected, the relationships between the new nodes added to the network will also be displayed (resulting possibly in a fuzzy view). If 'only with selected genes(s)' is selected, only edges to the selected gene(s) are displayed."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:33%"><input type="radio" id="edge_all_radio" name="edge_radio" disabled checked /><label for="edge_all_radio">all possible</label></td>
											<td colspan=2 class="layoptCell" style="width:66%"><input type="radio" id="edge_one_radio" name="edge_radio" disabled /><label for="edge_one_radio">with selected gene(s)/protein(s)</label></td>
											</tr>
											<td colspan=3 class="layoptCell"><strong>Interactions score threshold</strong>
											<img class="hint" id="interaction_score_tip" src="images/questionmark.png" title="Enter the displayed interactions score threshold. For the description of this score please look at the website of the STRING database. You will have to reinitialize the network for the changes to be applied."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:33%"><label for="score_threshold">Score&nbsp;&nbsp;&nbsp;</label><input type="text" id="score_threshold" name="score_threshold" value="0.2" size="3" onblur="mySimpleValidation(['score_threshold'])" /></td>
											<td colspan=2 class="layoptCell" style="width:66%">&nbsp;</td>
											</tr>
											<tr>
											<td colspan=3 class="layoptCell">
												<button id="search_defaults" class="secondaryButton" style="float:right;" onclick="restoreDefaults('search')" disabled>Defaults</button>
											</td>
											</tr>
										</table>
									</td>
									</tr>
								</table>
							</fieldset>									
						</div>
						</td>
						<td class="optsCell" style="width:33%">
						<div>
							<fieldset class="optsGroup" style="padding-bottom:1px;"><legend class="fieldSetTitle">Coloring options</legend>
								<table class="innerTable" style="height:50%">
									<tr>
									<td class="innerCell">
										<table class="innerTable">
											<tr>
											<td colspan=3 class="layoptCell"><label for="multiorganism_check"><strong>Allow multiple organism selection</strong></label></td>
											<td class="layoptCell"><input type="checkbox" id="multiorganism_check" onclick="toggleMultiSpecies()" style="float:left;" checked disabled />
											<img class="hint" id="multiorganism_tip" src="images/questionmark.png" title="Check these box to allow multiple selections to be made in the organism list in the 1st tab in order to search the queried genes/proteins/miRNAs in the selected organisms. You should be careful when using this option though as the resulting view might be extremely fuzzy and slow down the application."/></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><strong>Allow coloring on dataset(s) click</strong>
											<img class="hint" id="allowclickcolor_tip" src="images/questionmark.png" title="Check this box to allow the coloring of network nodes simply by clicking on the dataset name(s) in the list. Otherwise, the respective button must be pressed. Uncheck this box to explore the datasets without excessive workload for the server or check for fast exploration of smaller queries."/>
											</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="allow_click_color_gene_check" onclick="toggleClickColor('gene')" disabled /><label for="allow_click_color_gene_check"> genes/proteins</label></td>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="allow_click_color_mirna_check" onclick="toggleClickColor('mirna')" disabled /><label for="allow_click_color_mirna_check"> miRNAs</label></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><strong>Allow multiple node coloring</strong>
											<img class="hint" id="multicolor_tip" src="images/questionmark.png" title="Check this to allow mutliple colors in a gene/miRNA in the network, if found to be present in multiple selected datasets. Expression in multiple datasets will be represented by a larger node containing several smaller ones, according to the number of the datasets. Each one will be colored based on the expression recorded in the dataset. If unchecked, a grey node will represent multiple found genes."/>
											</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multicolor_gene_check" onclick="checkMultiColor('gene')" checked disabled /><label for="multicolor_gene_check"> genes/proteins</label></td>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multicolor_mirna_check" onclick="checkMultiColor('mirna')" checked disabled /><label for="multicolor_mirna_check"> miRNAs</label></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><strong>Allow multiple disease selection</strong>
											<img class="hint" id="multidisease_tip" src="images/questionmark.png" title="Check these boxes to allow multiple selections to be made in the disease lists connected to the queried genes/proteins/miRNAs in the second tab of the application. You should be careful when using this option though as the resulting view might be extremely fuzzy and slow down the application."/>
											</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multidisease_gene_check" onclick="toggleMultiKidney('gene','disease')" checked disabled /><label for="multidisease_gene_check"> genes/proteins</label></td>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multidisease_mirna_check" onclick="toggleMultiKidney('mirna','disease')" checked disabled /><label for="multidisease_mirna_check"> miRNAs</label></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><strong>Allow multiple location selection</strong>
											<img class="hint" id="multilocation_tip" src="images/questionmark.png" title="Check these boxes to allow multiple selections to be made in the location lists connected to the queried genes/proteins/miRNAs in the second tab of the application. You should be careful when using this option though as the resulting view might be extremely fuzzy and slow down the application."/>
											</td>
											</tr>
											<tr>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multilocation_gene_check" onclick="toggleMultiKidney('gene','location')" checked disabled /><label for="multilocation_gene_check"> genes/proteins</label></td>
											<td colspan=2 class="layoptCell" style="width:50%"><input type="checkbox" id="multilocation_mirna_check" onclick="toggleMultiKidney('mirna','location')" checked disabled /><label for="multilocation_mirna_check"> miRNAs</label></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><strong>Multiply colored node annotation</strong>
											<img class="hint" id="multiannotation_gene_tip" src="images/questionmark.png" title="Check these boxes to control the information displayed inside nodes when multiple node coloring is allowed. Having everything checked might render the network too complex to view when querying many genes/proteins. Type is either gene or protein."/>
											</td>
											</tr>
											<tr>
											<td class="layoptCell" style="width:25%"><input type="checkbox" id="multiannotation_gene_disease" checked disabled /><label for="multiannotation_gene_disease"> disease</label></td>
											<td class="layoptCell" style="width:25%"><input type="checkbox" id="multiannotation_gene_location" checked disabled /><label for="multiannotation_gene_location"> location</label></td>
											<td class="layoptCell" style="width:25%"><input type="checkbox" id="multiannotation_gene_dataset" disabled /><label for="multiannotation_gene_dataset"> dataset</label></td>
											<td class="layoptCell" style="width:25%"><input type="checkbox" id="multiannotation_gene_type" disabled /><label for="multiannotation_gene_type"> type</label></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell">
												<button id="color_defaults" class="secondaryButton" style="float:right;" onclick="restoreDefaults('color')" disabled>Defaults</button>
											</td>
											</tr>
										</table>
									</td>
									</tr>
								</table>
							</fieldset>
						</div>
						</td>
						<td class="optsCell" style="width:33%">
						<div>
							<fieldset class="optsGroup"><legend class="fieldSetTitle">Other</legend>
								<table class="innerTable">
								<tr>
								<td class="layoptCell" style="width:50%">
									<input type="checkbox" id="node_labels_check" checked disabled onclick="showLabels('nodes')"><label for="node_labels_check"> show node labels&nbsp;&nbsp;&nbsp;</label>
								</td>
								<td class="layoptCell" style="width:50%">
									<input type="checkbox" id="edge_labels_check" disabled onclick="showLabels('edges')"><label for="edge_labels_check"> show edge labels</label><br/>
								</td>
								</tr>
								<tr>
								<td colspan=2 class="layoptCell" style="width:100%">
									<input type="checkbox" id="sig_size_check" onclick="sigSizeChange()" checked disabled><label for="sig_size_check"> node border relative to significance</label>
									<span class="hint"><img id="sigsize_tip" src="images/questionmark.png" title="Check this box to make the nodes outline thickness relative to a gene/miRNA's p-value, if the latter exists in the selected KUPKB dataset(s)."/></span><br/>
								</td>
								</tr>
								</table>
								<hr>
								<table class="innerTable">
								<tr>
								<td class="layoptCell"><strong>Multiple species representation of nodes and edges</strong>
								<img class="hint" id="multiple_representation_tip" src="images/questionmark.png" title="Use these options to control the display of nodes and edges among genes/proteins when multiple species are selected. The 1st option creates one 'super' node with smalled nodes per organism inside and separate edges. The 2nd option creates one 'super' node without smaller nodes and merged edges."/>
								</td>
								</tr>
								<tr>
								<td class="layoptCell"><input type="radio" id="ms_compound_radio" name="ms_radio" onclick="updateMultiSpeciesView('compound')" disabled /><label for="ms_compound_radio">Compound nodes with separated edges per organism</label></td>
								</tr>
								<tr>
								<td class="layoptCell"><input type="radio" id="ms_merged_radio" name="ms_radio" onclick="updateMultiSpeciesView('merged')" disabled checked /><label for="ms_merged_radio">Single nodes with merged edges for all organisms</label></td>
								</tr>
								</table>
								<hr>
								<table class="innerTable">
									<tr>
									<td class="layoptCell" style="width:60%; border-bottom-style:dotted; border-bottom-width:1px"><span class="boldText">Nodes</span></td>
									<td class="layoptCell" style="width:40%; border-bottom-style:dotted; border-bottom-width:1px"><span class="boldText">Edges</span></td>
									</tr>
									<tr style="display:none;"> <!-- Redundant and takes space... Hidden for now... -->
									<td class="layoptCell" style="border-right-style:dotted; border-right-width:1px">
										<label><span style="font-size:0.9em">Get neighbors</span></label>
										<button id="fetch_neighbors_1" class="secondaryButton" style="float:none" onclick="fetchNeighbors(1)" disabled>L1</button>
										<button id="fetch_neighbors_2" class="secondaryButton" style="float:none" onclick="fetchNeighbors(2)" disabled>L2</button>
										<div class="loadingCircle" style="float:right"><img src="images/loading_small.gif"></div>
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
	initTooltip(['search_tip','elinfo_tip','allgenecrit_tip','allmirnacrit_tip','multicolor_tip',
				 'sigsize_tip','gene_mode_tip','mirna_mode_tip','neighbor_tip','neighbor_edge_tip',
				 'multidisease_tip','multilocation_tip','allowclickcolor_tip','multiple_representation_tip',
				 'multiannotation_gene_tip','interaction_score_tip','multiorganism_tip']);
	detectIE();
</script>

<!-- Here, PHP code for handling a call from the iKUP. It will receive the JSON, send it
to control.php with the selected species and then initiate a search through JS -->
<?php
if ($_POST['ikup_terms'])
{
	echo "<script type=\"text/javascript\">search()</script>";
}
?>

<!-- Piwik --> 
<script type="text/javascript">
var pkBaseURL = (("https:" == document.location.protocol) ? "https://194.57.225.115/piwik/" : "http://194.57.225.115/piwik/");
document.write(unescape("%3Cscript src='" + pkBaseURL + "piwik.js' type='text/javascript'%3E%3C/script%3E"));
</script><script type="text/javascript">
try {
var piwikTracker = Piwik.getTracker(pkBaseURL + "piwik.php", 3);
piwikTracker.trackPageView();
piwikTracker.enableLinkTracking();
} catch( err ) {}
</script><noscript><p><img src="http://194.57.225.115/piwik/piwik.php?idsite=3" style="border:0" alt="" /></p></noscript>
<!-- End Piwik Tracking Code -->
</body>
</html>


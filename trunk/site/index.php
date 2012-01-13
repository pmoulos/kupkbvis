<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<?php
	include('php/utils.php');
	include('php/control.php');
	include('php/queries.php');
	session_start();	
?>

<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8">
		<title>Kidney and Urinary Pathway Knowledge Visualizer</title>
		<link rel="icon" href="/images/justkidney.ico" type="image/x-icon" />
        <link type="text/css" rel="stylesheet" href="css/jquery-ui-1.8.16.custom.css" />
		<link type="text/css" rel="stylesheet" href="css/kupkb.css">
        <script type="text/javascript" src="js/json2.min.js"></script>
        <script type="text/javascript" src="js/AC_OETags.min.js"></script>
        <script type="text/javascript" src="js/cytoscapeweb.min.js"></script>
        <script type="text/javascript" src="js/jquery-1.7.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui-1.8.16.custom.min.js"></script>
        <script type="text/javascript" src="js/jquery.json-2.3.min.js"></script>
        <script type="text/javascript" src="js/gen_validatorv4.js"></script>
        <script type="text/javascript" src="js/graph_control.js"></script>
		<script type="text/javascript" src="js/app_control.js"></script>
    </head>
    
    <body>
    	<!-- Make sure to clear the cache from elements... It might have strange effects... -->
    	<script type="text/javascript">clearCache()</script>
        
        <!-- Main table container layout -->
        <table class="main"><tr><td class="main">

		<!-- Our modal dialog div -->
		<div id="dialog"></div>
		
        <div class="mainContainer"> 
			<div class="mainPageTitle">
				<h1>The Kidney & Urinary Pathway <span style="color:#E21A30;">K</span>nowledge <span style="color:#E21A30;">B</span>ase</h1>
				<h2 style="text-align:center; line-height:0.5em"><span style="color:#E21A30;">N</span>etwork <span style="color:#E21A30;">E</span>xplorer</h2>
			</div>
			<a href="" class="image"><img src="images/kupkb-logo-small.png" alt="KUPKB" border="0"/></a>
			<br/><br/>
			<div id="errorContainer"></div>
			<div id="debugContainer"></div>
			<table id="appContainer">
				<tr>
					<td id="graphContainer">
						<div id="cytoscapeweb">
							<table class="innerTable"><tr><td>
								<div id="hello_kidney"><img src="images/netInitPic.png" alt="Your network will appear here."/></div>
								<div id="loading_big" style="display:none;"><img src="images/loading.gif"/></div>
							</td></tr></table>
						</div>
					</td>
					<td id="functionContainer">
						<div><span class="boldText">Enter search terms</span></div>	
						<div>						
						<label for="enter_genes">
							<textarea id="enter_genes" name="enter_genes" wrap="hard" onkeyup="searchAllow()" onclick="searchAllow()"></textarea>
							<script type="text/javascript">bindAutoComplete('enter_genes')</script>
						</label>
						</div>
						<div id="errorText"></div>
						<div><button id="search_button" class="primaryButton" onclick="search()" disabled>GO</button></div>
						<div><button id="clear_button" class="primaryButton" onclick="resetSearch()" disabled>Clear</button></div>
						<div id="loadingCircle" style="display:none; float:left;"><img src="images/loading_small.gif"></div>
						<div><p>&nbsp;</p></div>
    					<div>
							<fieldset><legend class="fieldSetTitle" style="font-size: 1.2em; background-color:#FFFF5F;">Network</legend>
								<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Genes</legend>
									<input type="checkbox" id="sig_size_check" checked disabled> size relative to significance<br/>
									<input type="checkbox" id="node_labels_check" checked disabled onclick="showLabels('nodes')"> show labels<br/>
								</fieldset>
								<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Relationships</legend>
									<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Interactions</legend>
										<input type="checkbox" id="binding_check" checked disabled onclick="filterEdges()"><span style="color:#028E9B; font-weight:bold;"> binding</span><br/>
										<input type="checkbox" id="ptmod_check" disabled onclick="filterEdges()"><span style="color:#133CAC; font-weight:bold;"> modification</span><br/>
										<input type="checkbox" id="expression_check" disabled onclick="filterEdges()"><span style="color:#FFAD00; font-weight:bold;"> expression</span><br/>
										<input type="checkbox" id="activation_check" disabled onclick="filterEdges()"><span style="color:#FF7800; font-weight:bold;"> activation</span><br/>
									</fieldset>
									<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Meta-edges</legend>
										<input type="checkbox" id="go_check" checked disabled onclick="filterEdges()"><span style="color:#9BA402; font-weight:bold;"> GO terms</span><br/>
										<input type="checkbox" id="kegg_check" checked disabled onclick="filterEdges()"><span style="color:#D30068; font-weight:bold;"> KEGG pathways</span><br/>
										<input type="checkbox" id="mirna_check" checked disabled onclick="filterEdges()"><span style="color:#A67D00; font-weight:bold;"> miRNAs</span><br/>
									</fieldset>
									<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Other</legend>
										<input type="checkbox" id="edge_labels_check" disabled onclick="showLabels('edges')"> show labels<br/>
									</fieldset>
								</fieldset>
							</fieldset>
    					</div>
					</td>
				</tr>
				<tr>
					<td id="controlContainer" colspan=2>
					<fieldset><legend class="fieldSetTitle" style="font-size: 1.2em; background-color:#FFFF5F;">Parameters</legend>                    
                    <table class="innerTable" style="table-layout:inherit"><tr>
                        <td class="optsCell" style="width:33%">           
						<fieldset class="optsGroup" style="background-color:#F5FFFF">
							<legend class="fieldSetTitle" style="background-color:#FFFF5F;">KUPKB data</legend>
							<table class="innerTable">
							<?php
								$species = initSpecies();
								array_unshift_assoc($species,999999,'Select...');
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
	            				echo html_selectbox('dataset_list',$dataset,'NULL',array('disabled' => 'disabled','onchange' => 'colorNodes()'));
								echo "</td></tr>";				
	    					?>
	    					<tr><td class="innerCell">
	    					<button id="reset_data_button" class="secondaryButton" onclick="resetData()" disabled>Reset</button>
	    					<div id="filterCircle" style="display:none; float: left;"><img src="images/loading_small.gif"></div>
	    					</td><td class="innerCell" colspan=2>
	    					<button id="color_network_button" class="secondaryButton" style="font-weight:bold; float:right;" onclick="colorNodes()" disabled>Color network!</button>
	    					</td></tr>
	    					</table>
	    				</fieldset>  
                        </td>
                        <td class="optsCell" style="width:33%">
                        <fieldset class="optsGroup">
							<legend class="fieldSetTitle" style="background-color:#ECFFDE;">Network layout and export</legend>
							<table class="innerTable">
							<?php
								$layout = initLayoutOpts();
								array_unshift_assoc($species,"none",'Select...');
								echo "<tr><td class=\"innerCell\" style=\"text-align:left; width:28%\">";
								echo "<span class=\"boldText\">Layout: </span>";
								echo "</td><td colspan=3 class=\"innerCell\">";
	            				echo html_selectbox('layout_list',$layout,'NULL',array('disabled' => 'disabled','onchange' => 'updateLayoutOpts()'));
	            				echo "</td></tr>";
	            			?>	
								<tr><td class="innerCell" style="text-align:left">
								Layout Options:
								</td><td colspan=3 class="innerCell" style="text-align:left">
									<div id="layoutOptionContainer">
										<table class="innerTable">
											<tr>
											<td class="layoptCell"><label for="force_gravitation">Gravitation:</label></td>
											<td class="layoptCell"><input type="text" id="force_gravitation" size="2" value="-500" disabled /></td>
											<td class="layoptCell"><label for="force_node_mass">Node mass:</label></td>
											<td class="layoptCell"><input type="text" id="force_node_mass" size="2" value="5" disabled /></td>
											</tr>
											<tr>
											<td class="layoptCell"><label for="force_edge_tension">Edge tension:</label></td>
											<td class="layoptCell"><input type="text" id="force_edge_tension" size="2" value="0.5" disabled /></td>
											<td class="layoptCell"></td>
											</tr>
											<tr>
											<td colspan=4 class="layoptCell"><button class="secondaryButton" style="float:right" id="execute_layout_button" onclick="updateLayout()" disabled>Execute layout</button></td>
											</tr>
										</table>
									</div>
								</td></tr>							
								<tr><td class="innerCell" style="text-align:left; width:28%">
								<span class="boldText">Export as text: </span></td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_sif" class="exportButton" onclick="exportText('sif')" disabled>SIF</button>-->
								<button id="export_sif" class="exportButton" style="background:url('images/export_buttons/sif_fade.png')" onclick="exportText('sif')" disabled></button>
								</td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_graphml" class="exportButton" onclick="exportText('graphml')" disabled>GML</button>-->
								<button id="export_graphml" class="exportButton" style="background:url('images/export_buttons/gml_fade.png')" onclick="exportText('graphml')" disabled></button>
								</td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_xgmml" class="exportButton" onclick="exportText('xgmml')" disabled>XML</button>-->
								<button id="export_xgmml" class="exportButton" style="background:url('images/export_buttons/xml_fade.png')" onclick="exportText('xgmml')" disabled></button>
								</td>
								</tr>
								<tr><td class="innerCell" style="text-align:left; width:28%">
								<span class="boldText">Export image: </span></td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_png" class="exportButton" onclick="exportImage('png')" disabled>PNG</button>-->
								<button id="export_png" class="exportButton" style="background:url('images/export_buttons/png_fade.png')" onclick="exportImage('png')" disabled></button>
								</td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_pdf" class="exportButton" onclick="exportImage('pdf')" disabled>PDF</button>-->
								<button id="export_pdf" class="exportButton" style="background:url('images/export_buttons/pdf_fade.png')" onclick="exportImage('pdf')" disabled></button>
								</td>
								<td class="buttonCell" style="width:24%">
								<!--<button id="export_svg" class="exportButton" onclick="exportImage('svg')" disabled>SVG</button>-->
								<button id="export_svg" class="exportButton" style="background:url('images/export_buttons/svg_fade.png')" onclick="exportImage('svg')" disabled></button>
								</td>
								</tr>
								<script type="text/javascript">bindExport()</script>
	    					</table>
						</fieldset>
                        </td>
                        <td class="optsCell" style="width:33%">
                        <fieldset class="optsGroup">
							<legend class="fieldSetTitle" style="background-color:#ECFFDE;">Element information</legend>
							<table class="innerTable" style="table-layout: fixed"><tr><td class="optsCell">
							<div id="infoContainer"></div>
							<!--<textarea class="info" id="info_area" name="info_area" wrap="hard"></textarea>-->
							</td></tr></table>
						</fieldset>
                        </td>
                        </tr>
                        <tr id="metadata" style="display:none"><td class="optsCell" style="width=33%">
	    				<fieldset class="optsGroup"><legend class="fieldSetTitle">Gene Ontology</legend>
	    					<table class="innerTable">
							<tr><td class="innerCell" style="width:40%"><span class="boldText">GO category:</span></td>
							<td class="innerCell" style="width:60%" colspan=2>
							<table class="innerTable" style="height:50%"><tr>
							<td id="go_component" class="goLabel" onclick="changeGOCategory('go_component')">Component</td>
							<td id="go_function" class="goLabel" onclick="changeGOCategory('go_function')">Function</td>
							<td id="go_process"class="goLabel" onclick="changeGOCategory('go_process')">Process</td>
							</tr></table>
							</td></tr>
							<tr><td class="innerCell" colspan=3>
	    					<?php
	    						$goterms = array('0' => 'Select...');
	            				echo html_selectbox('go_list',$goterms,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%;','ondblclick' => 'showMeta(\'go\',\'selected\')'));
							?>
							</td></tr>
							<tr><td class="buttonCell">
							<button id="show_selected_go" class="secondaryButton" onclick="showMeta('go','selected')" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_go" class="secondaryButton" onclick="clearMeta('go','selected','')" disabled>Clear selected</button>
                            </td><td class="buttonCell">
                            </td></tr>
                            <tr><td class="buttonCell">
                            <button id="show_all_go" class="secondaryButton" onclick="showMeta('go','all')" disabled>Show all</button>
							</td><td class="buttonCell">
							<button id="clear_all_go" class="secondaryButton" onclick="clearMeta('go','all','')" disabled>Clear all</button>
							</td><td class="buttonCell" style="float:right">
                            <button id="clear_all_go_cat" class="secondaryButton" onclick="clearMeta('go','all','all')" disabled>Clear all GO</button>
							</td></tr>
	    					</table>
	    				</fieldset>
                        </td><td class="optsCell" style="width=33%">
						<fieldset class="optsGroup"><legend class="fieldSetTitle">KEGG Pathways</legend>
						<table class="innerTable">
							<?php
	    						$kegg = array('0' => 'Select...');
								echo "<tr><td class=\"innerCell\" colspan=2>";
								echo "<span class=\"boldText\">Selected organism pathways: </span>";
								echo "</td></tr><tr><td class=\"innerCell\" colspan=2>";
	            				echo html_selectbox('kegg_list',$kegg,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%;','ondblclick' => 'showMeta(\'kegg\',\'selected\')'));
								echo "</td></tr>";
							?>
							<tr><td class="buttonCell">
							<button id="show_selected_kegg" class="secondaryButton" onclick="showMeta('kegg','selected')" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_kegg" class="secondaryButton" onclick="clearMeta('kegg','selected','')" disabled>Clear selected</button>
							</td></tr>
                            <tr><td class="buttonCell">
							<button id="show_all_kegg" class="secondaryButton" onclick="showMeta('kegg','all')" disabled>Show all</button>
                            </td><td class="buttonCell">
							<button id="clear_all_kegg" class="secondaryButton" onclick="clearMeta('kegg','all','')" disabled>Clear all</button>
							</td></tr>
						</table>
	    				</fieldset>
                        </td><td class="optsCell" style="width=33%">
	    				<fieldset class="optsGroup"><legend class="fieldSetTitle">miRNA</legend>
						<table class="innerTable">
							<?php
	    						$mirna = array('0' => 'Select...');
								echo "<tr><td class=\"innerCell\" colspan=2>";
								echo "<span class=\"boldText\">Target miRNAs: </span>";
								echo "</td></tr><tr><td class=\"innerCell\" colspan=2>";
	            				echo html_selectbox('mirna_list',$mirna,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:90%;','ondblclick' => 'showMeta(\'mirna\',\'selected\')'));
								echo "</td></tr>";
							?>
							<tr><td class="buttonCell">
							<button id="show_selected_mirna" class="secondaryButton" onclick="showMeta('mirna','selected')" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_mirna" class="secondaryButton" onclick="clearMeta('mirna','selected','')" disabled>Clear selected</button>
							</td></tr>
                            <tr><td class="buttonCell">
                            <button id="show_all_mirna" class="secondaryButton" onclick="showMeta('mirna','all')" disabled>Show all</button>
							</td><td class="buttonCell">
							<button id="clear_all_mirna" class="secondaryButton" onclick="clearMeta('mirna','all','')" disabled>Clear all</button>
							</td></tr>
						</table>
	    				</fieldset>
                        </td></tr></table>
					</fieldset>
                    </td>
                </tr>
            </table>
            <table class="innerTable"><tr><td>    
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
            </td></tr></table>					
        </div>
		<div id="navtxt" class="navtext" style="position:absolute; top:-100px; left:0px; visibility:hidden"></div>
        
        <!-- End Main table container layout -->
        </td></tr></table>
        
    </body>
</html>


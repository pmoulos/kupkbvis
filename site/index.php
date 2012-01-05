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
        <script type="text/javascript" src="js/graph_control.js"></script>
		<script type="text/javascript" src="js/custom.js"></script>
    </head>
    
    <body>
    	<!-- Make sure to clear the cache from elements... It might have strange effects... -->
    	<script type="text/javascript">clearCache()</script>
        
        <!-- Main table container layout -->
        <table class="main"><tr><td class="main">
		
        <div class="mainContainer"> 
			<div class="mainPageTitle">
				<h1>The Kidney & Urinary Pathway <span style="color:#E21A30;">K</span>nowledge <span style="color:#E21A30;">B</span>ase</h1>
			</div>
			<a href="" class="image"><img src="images/logobetaok.png" alt="e-lico" border="0"/></a>
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
								<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Nodes</legend>
									<input type="checkbox" id="x" checked disabled> property 1<br/>
									<input type="checkbox" id="y" disabled> property 2<br/>
								</fieldset>
								<fieldset style="margin-top: 10px;"><legend class="fieldSetTitle" style="background-color:#FFFF5F;">Edges</legend>
									<input type="checkbox" id="binding_check" checked disabled onclick="filterEdges('binding_check')"><span style="color:#028E9B; font-weight:bold;"> binding</span><br/>
									<input type="checkbox" id="ptmod_check" disabled onclick="filterEdges('ptmod_check')"><span style="color:#133CAC; font-weight:bold;"> modification</span><br/>
									<input type="checkbox" id="expression_check" disabled onclick="filterEdges('expression_check')"><span style="color:#FFAD00; font-weight:bold;"> expression</span><br/>
									<input type="checkbox" id="activation_check" disabled onclick="filterEdges('activation_check')"><span style="color:#FF7800; font-weight:bold;"> activation</span><br/>
								</fieldset>
							</fieldset>
    					</div>
					</td>
				</tr>
				<tr>
					<td id="controlContainer" colspan=2>
					<fieldset><legend class="fieldSetTitle" style="font-size: 1.2em; background-color:#FFFF5F;">Parameters</legend>                    
                    <table class="innerTable"><tr>
                        <td class="optsCell">           
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
	            				echo html_selectbox('dataset_list',$dataset,'NULL',array('disabled' => 'disabled'));
								echo "</td></tr>";				
	    					?>
	    					<tr><td class="innerCell" colspan=2>
	    					<button id="reset_data_button" class="secondaryButton" onclick="resetData()" disabled>Reset</button>
	    					<div id="filterCircle" style="display:none; float: left;"><img src="images/loading_small.gif"></div>
	    					</td></tr>
	    					</table>
	    				</fieldset>  
                        </td><td class="optsCell" colspan=2 style="text-align:center; vertical-align:middle;">Other options will go here</td>
                        </tr>
                        <tr><td class="optsCell" style="width=33%">
	    				<fieldset class="optsGroup"><legend class="fieldSetTitle">Gene Ontology</legend>
	    					<table class="innerTable">
							<tr><td class="innerCell" style="width:40%"><span class="boldText">GO category:</span></td>
							<td class="innerCell" style="width:60%">
							<table class="innerTable" style="height:50%"><tr>
							<td id="go_component" class="goLabel" onclick="changeGOCategory('go_component')">Component</td>
							<td id="go_function" class="goLabel" onclick="changeGOCategory('go_function')">Function</td>
							<td id="go_process"class="goLabel" onclick="changeGOCategory('go_process')">Process</td>
							</tr></table>
							</td></tr>
							<tr><td class="innerCell" colspan=2>
	    					<?php
	    						$goterms = array('0' => 'Select...');
	            				echo html_selectbox('go_list',$goterms,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:23em;'));
							?>
							</td></tr>
							<tr><td class="buttonCell">
							<button id="show_selected_go" class="secondaryButton" onclick="" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_go" class="secondaryButton" onclick="" disabled>Clear selected</button>
                            </td></tr>
                            <tr><td class="buttonCell">
                            <button id="show_all_go" class="secondaryButton" onclick="" disabled>Show all</button>
							</td><td class="buttonCell">
							<button id="clear_all_go" class="secondaryButton" onclick="" disabled>Clear all</button>
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
	            				echo html_selectbox('kegg_list',$kegg,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:23em;'));
								echo "</td></tr>";
							?>
							<tr><td class="buttonCell">
							<button id="show_selected_kegg" class="secondaryButton" onclick="" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_kegg" class="secondaryButton" onclick="" disabled>Clear selected</button>
							</td></tr>
                            <tr><td class="buttonCell">
							<button id="show_all_kegg" class="secondaryButton" onclick="" disabled>Show all</button>
                            </td><td class="buttonCell">
							<button id="clear_all_kegg" class="secondaryButton" onclick="" disabled>Clear all</button>
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
	            				echo html_selectbox('mirna_list',$mirna,'NULL',array('disabled' => 'disabled','multiple' => 'multiple','style' => 'width:23em;'));
								echo "</td></tr>";
							?>
							<tr><td class="buttonCell">
							<button id="show_selected_mirna" class="secondaryButton" onclick="" disabled>Show selected</button>
							</td><td class="buttonCell">
                            <button id="clear_selected_mirna" class="secondaryButton" onclick="" disabled>Clear selected</button>
							</td></tr>
                            <tr><td class="buttonCell">
                            <button id="show_all_mirna" class="secondaryButton" onclick="" disabled>Show all</button>
							</td><td class="buttonCell">
							<button id="clear_all_mirna" class="secondaryButton" onclick="" disabled>Clear all</button>
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


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<?php
	include('php/utils.php');
	include('php/control.php');
	include('php/queries.php');
	#$entrez = getEntrezFromSymbol();
	#$dataset = getDatasetID($entrez);
	#$dname = initDataset($dataset);
	#$location = initLocation($dataset);
	#$disease = initDisease($dataset);	
	#print_r($dname);
	#echo "<br/>";
	#print_r($location);
	#echo "<br/>";
	#print_r($disease);
	#echo "<br/>";
	session_start();	
?>

<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8">
		<title>Kidney and Urinary Pathway Knowledge Visualizer</title>
		<link rel="icon" href="/images/justkidney.ico" type="image/x-icon" />
		<link type="text/css" rel="stylesheet" href="kupkb.css">
        
        <script type="text/javascript" src="/js/json2.min.js"></script>
        <script type="text/javascript" src="/js/AC_OETags.min.js"></script>
        <script type="text/javascript" src="/js/cytoscapeweb.min.js"></script>
        <script type="text/javascript" src="/js/jquery-1.7.min.js"></script>
        <script type="text/javascript" src="/js/jquery.json-2.3.min.js"></script>
		<script type="text/javascript" src="/js/custom.js"></script>
        
        <script type="text/javascript">
            window.onload = function() {
                // id of Cytoscape Web container div
                var div_id = "cytoscapeweb";
                
                // NOTE: - the attributes on nodes and edges
                //       - it also has directed edges, which will automatically display edge arrows
                var xml = '\
                <graphml>\
                  <key id="label" for="all" attr.name="label" attr.type="string"/>\
                  <key id="weight" for="node" attr.name="weight" attr.type="double"/>\
                  <graph edgedefault="directed">\
                    <node id="1">\
                        <data key="label">A</data>\
                        <data key="weight">2.0</data>\
                    </node>\
                    <node id="2">\
                        <data key="label">B</data>\
                        <data key="weight">1.5</data>\
                    </node>\
                    <node id="3">\
                        <data key="label">C</data>\
                        <data key="weight">1.0</data>\
                    </node>\
                    <edge source="1" target="2">\
                        <data key="label">A to B</data>\
                    </edge>\
                    <edge source="1" target="3">\
                        <data key="label">A to C</data>\
                    </edge>\
                  </graph>\
                </graphml>\
                ';
                
                // visual style we will use
                var visual_style = {
                    global: {
                        backgroundColor: "white"
                    },
                    nodes: {
                        shape: "OCTAGON",
                        borderWidth: 3,
                        borderColor: "#ffffff",
                        size: {
                            defaultValue: 25,
                            continuousMapper: { attrName: "weight", minValue: 25, maxValue: 75 }
                        },
                        color: {
                            discreteMapper: {
                                attrName: "id",
                                entries: [
                                    { attrValue: 1, value: "#0B94B1" },
                                    { attrValue: 2, value: "#9A0B0B" },
                                    { attrValue: 3, value: "#dddd00" }
                                ]
                            }
                        },
                        labelHorizontalAnchor: "center"
                    },
                    edges: {
                        width: 3,
                        color: "#0B94B1"
                    }
                };
                
                // initialization options
                var options = {
                    swfPath: "/swf/CytoscapeWeb",
                    flashInstallerPath: "/swf/playerProductInstall"
                };
                
                var vis = new org.cytoscapeweb.Visualization(div_id, options);
                
						//Leave as template               
                vis.ready(function() 
                {
                    // set the style programmatically
                    document.getElementById("color").onclick = function(){
                        visual_style.global.backgroundColor = "white";
                        vis.visualStyle(visual_style);
                    };
                });

                var draw_options = {
                    // your data goes here
                    network: xml,
                    
                    // show edge labels too
                    edgeLabelsVisible: true,
                    
                    // let's try another layout
                    layout: "Tree",
                    
                    // set the style at initialisation
                    visualStyle: visual_style,
                    
                    // hide pan zoom
                    panZoomControlVisible: false 
                };
                
                vis.draw(draw_options);
            };
        </script>
    </head>
    
    <body>
		<div class="mainContainer">
			<div class="mainPageTitle">
				<h1>The Kidney & Urinary Pathway <span style="color:#E21A30;">K</span>nowledge <span style="color:#E21A30;">B</span>ase</h1>
			</div>
			<a href="" class="image"><img src="images/logobetaok.png" alt="e-lico" border="0"/></a>
			
			<!--<table>
				<tr>
					<td id="graphContainer">
						<div id="cytoscapeweb">Cytoscape Web will replace the contents of this div with your graph.</div>
					</td>
					<td id="controlContainer">Controls go here</td>
				</tr>
			</table>-->
			<div id="errorContainer"></div>
			<div id="debugContainer"></div>
			<table>
				<tr>
					<td id="graphContainer">
						<!--<div id="cytoscapeweb">Cytoscape Web will replace the contents of this div with your graph.</div>-->
					</td>
					<td id="functionContainer">
						<div><span class="boldText">Enter search terms</span></div>	
						<div>						
						<label for="enter_genes">
							<textarea id="enter_genes" name="enter_genes" wrap="hard" onkeydown="searchAllow()" onkeyup="searchAllow()"></textarea>
						</label>
						</div>
						<div id="errorText"></div>
						<div><button id="search_button" class="searchButton" onclick="search()" disabled>GO</button></div>
						<div id="loadingCircle" style="display:none;"><img src="images/loading_small.gif"></div>
    					<!--<div>Functions like export buttons etc. go here</div>-->
					</td>
				</tr>
				<tr>
					<td colspan=2, id="controlContainer">
					<fieldset>
						<legend class="fieldSetTitle">Parameters</legend>						
						<?php
							echo "<table class=\"innerTable\" style=\"width:25%\">";
							
							$species = initSpecies();
							array_unshift_assoc($species,999999,'Select...');
							echo "<tr><td class=\"innerCell\">";
							echo "<span class=\"boldText\">Select species: </span>";
							echo "</td><td class=\"innerCell\">";
            				echo html_selectbox('species_list',$species,'NULL',array('onchange' => 'update(\'species_list\')'));
            				echo "</td></tr>";
            				
							$disease = array('0' => 'Select');
							echo "<tr><td class=\"innerCell\">";
							echo "<span class=\"boldText\">Select disease: </span>";
							echo "</td><td class=\"innerCell\">";
            				echo html_selectbox('disease_list',$disease,'NULL',array('disabled' => 'disabled','onchange' => 'update()'));
							echo "</td></tr>";
							
							$location = array('0' => 'Select');
							echo "<tr><td class=\"innerCell\">";
							echo "<span class=\"boldText\">Select location: </span>";
							echo "</td><td class=\"innerCell\">";
            				echo html_selectbox('location_list',$location,'NULL',array('disabled' => 'disabled'));
							echo "</td></tr>";
							
							$dataset = array('0' => 'Select');
							echo "<tr><td class=\"innerCell\">";
							echo "<span class=\"boldText\">Select dataset: </span>";
							echo "</td><td class=\"innerCell\">";
            				echo html_selectbox('dataset_list',$dataset,'NULL',array('disabled' => 'disabled'));
							echo "</td></tr>";				
							
							echo "</table>";
    					?>
					</fieldset>					
					</td>
				</tr>
			</table>
			
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
		</div>
		<div id="navtxt" class="navtext" style="position:absolute; top:-100px; left:0px; visibility:hidden"></div>

    </body>
</html>


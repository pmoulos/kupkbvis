function initVisualStyle()
{
	var globalStyle = initGlobalStyle();
	var nodeStyle = initNodeStyle();
	var edgeStyle = initEdgeStyle();
	
	var visualStyle =
	{
		global: globalStyle,
		nodes: nodeStyle,
		edges: edgeStyle
	};

	return(visualStyle);
}

function bypassNodeColors(ajaxData,type)
{
	var visObject = getVisData("cytoscapeweb");
	var bypass = getData("cytoscapeweb","bypass");
	var nodes = visObject.nodes();
	var noN = nodes.length;
	var noA = ajaxData.length;
	var ajaxNodes = [];
	var visProps = [];
	var newData = [];
	var seen = [];
	var dataSeen = [];
	var propSeen = [];
	var i, j, k, currNode;
	//var bypass = { nodes: { }, edges: { } };
	var multicolor, cShape;

	switch(type)
	{
		case 'gene':
			multicolor = $("#multicolor_gene_check").is(":checked") ? true : false;
			cShape = "ELLIPSE";
			break;
		case 'mirna':
			multicolor = $("#multicolor_mirna_check").is(":checked") ? true : false;
			cShape = "RECTANGLE";
			break;
		default:
			multicolor = false;
			cShape = "ELLIPSE";
	}

	// Not the best implementation, but we have to check for multiply present genes since
	// we are able to select multiple datasets
	for (i=0; i<noA; i++) // First initialize
	{
		seen[ajaxData[i].entrez_id] = [];
	}
	for (i=0; i<noA; i++) // Now hash
	{
		seen[ajaxData[i].entrez_id].unshift(i);
	}
	
	// Construct the array of entrez_id in ajaxData;
	for (i=0; i<noA; i++)
	{
		if (ajaxData[i].ratio !== 999 && ajaxData[i].ratio !== null) // Ratio exists
		{
			if ($("#sig_size_check").is(":checked") && ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
			{
				visProps.push({ color: gimmeNodeColor("ratio",ajaxData[i].ratio), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666" });
			}
			else
			{
				visProps.push({ color: gimmeNodeColor("ratio",ajaxData[i].ratio) });
			}
		}
		else
		{
			if (ajaxData[i].expression !== '' && ajaxData[i].expression !== null) // DE expression exists
			{
				ajaxData[i].expression = capFirst(ajaxData[i].expression);
				if ($("#sig_size_check").is(":checked") && ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
				{
					visProps.push({ color: gimmeNodeColor("expression",ajaxData[i].expression), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666" });
				}
				else
				{
					visProps.push({ color: gimmeNodeColor("expression",ajaxData[i].expression) });
				}
			}
			else
			{
				if ($("#sig_size_check").is(":checked") && ajaxData[i].strength !== '' && ajaxData[i].strength !== null) // Expression strength exists
				{
					ajaxData[i].strength = capFirst(ajaxData[i].strength);
					if (ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
					{
						visProps.push({ color: gimmeNodeColor("strength",ajaxData[i].strength), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666" });
					}
					else
					{
						visProps.push({ color: gimmeNodeColor("strength",ajaxData[i].strength) });
					}
				}
			}
		}
		ajaxNodes.push(ajaxData[i].entrez_id);
		newData.push({ strength: ajaxData[i].strength, expression: ajaxData[i].expression, ratio: ajaxData[i].ratio, pvalue: -log10(ajaxData[i].pvalue), fdr: ajaxData[i].fdr, custom: ajaxData[i].custom });
	}

	dataSeen = { strength: "Multiple", expression: "Multiple", ratio: 999, pvalue: 999, fdr: 999 };
	if (multicolor)
	{
		propSeen = { compoundColor: "#7A7A7A", compoundBorderWidth: 5, compoundBorderColor: "#ECBD00", compoundLabelFontColor: "#0000FF", compoundLabelFontWeight: "bold", compoundShape: cShape, compoundOpacity: 0.5 };
	}
	else
	{
		propSeen = { color: "#2B2B2B", borderWidth: 5, borderColor: "#ECBD00", labelFontColor: "#FFFFFF" };
	}
	
	for (i=0; i<noN; i++)
	{
		var ii = $.inArray(nodes[i].data.entrez_id,ajaxNodes);
		if (ii !== -1) // Node in KUPKB expression data
		{
			currNode = nodes[i];
			if (seen[currNode.data.entrez_id].length>1)
			{
				if (multicolor)
				{
					for (j=0; j<seen[currNode.data.entrez_id].length; j++)
					{
						k = j+1;
						cdata = {
									id: currNode.data.id + "_" + k,
									label: newData[seen[currNode.data.entrez_id][j]].custom + " (" + k + ")",
									strength: newData[seen[currNode.data.entrez_id][j]].strength,
									expression: newData[seen[currNode.data.entrez_id][j]].expression,
									ratio: newData[seen[currNode.data.entrez_id][j]].ratio,
									pvalue: newData[seen[currNode.data.entrez_id][j]].pvalue,
									fdr: newData[seen[currNode.data.entrez_id][j]].fdr,
									entrez_id: currNode.data.entrez_id,
									object_type: type,
									parent: currNode.data.id
								};
						visObject.addNode(randomFromTo(350,450),randomFromTo(350,450),cdata,true);
						bypass["nodes"][cdata.id] = visProps[seen[currNode.data.entrez_id][j]];
					}
					visObject.updateData([currNode.data.id],dataSeen);
					bypass[currNode.group][currNode.data.id] = propSeen;
				}
				else
				{
					visObject.updateData([currNode.data.id],dataSeen);
					bypass[currNode.group][currNode.data.id] = propSeen;
				}
			}
			else
			{
				visObject.updateData([currNode.data.id],newData[ii]);
				bypass[currNode.group][currNode.data.id] = visProps[ii];
			}
		}
	}

	setData("cytoscapeweb","bypass",bypass);
	visObject.visualStyleBypass(bypass);
}

// type: interaction type
// status: on, off
// Filter has a bug! It removes the complement of the selected set
function filterEdges()
{
    var visObject = getVisData('cytoscapeweb');
	var edges = visObject.edges();
	var checked = {};
	var toFilter = [];
	var i = 0;
	var len = edges.length;

	checked.binding = $("#binding_check").is(":checked") ? true : false;
	checked.ptmod = $("#ptmod_check").is(":checked") ? true : false;
	checked.expression = $("#expression_check").is(":checked") ? true : false;
	checked.activation = $("#activation_check").is(":checked") ? true : false;
	checked.go = $("#go_check").is(":checked") ? true : false;
	checked.kegg = $("#kegg_check").is(":checked") ? true : false;
	checked.mirna = $("#mirna_check").is(":checked") ? true : false;

	// $.each can be slow when having lots of edges...
	for (i=0;i<len;i++)
	{
		switch(edges[i].data.interaction)
		{
			case 'binding':
				if (checked.binding) { toFilter.push(edges[i].data.id); }
				break;
			case 'ptmod':
				if (checked.ptmod) { toFilter.push(edges[i].data.id); }
				break;
			case 'expression':
				if (checked.expression) { toFilter.push(edges[i].data.id); }
				break;
			case 'activation':
				if(checked.activation) { toFilter.push(edges[i].data.id); }
				break;
			case 'go':
				if(checked.go) { toFilter.push(edges[i].data.id); }
				break;
			case 'kegg':
				if(checked.kegg) { toFilter.push(edges[i].data.id); }
				break;
			case 'mirna':
				if(checked.mirna) { toFilter.push(edges[i].data.id); }
				break;
		}
	}
	
    //visObject.removeFilter("edges");
	visObject.filter("edges",toFilter,true);
	// Update several info regarding edges
	updateInfo();
	showLabels("edges");
}

// Edge IDs only for now...
function hideSomeEdges(someEdges)
{
    var visObject = getVisData('cytoscapeweb');
	var edges = visObject.edges();
	var toHide = [];
	var i = 0;
	var len = edges.length;
	
	for (i=0; i<len; i++)
	{
		if ($.inArray(edges[i].data.id,someEdges) === -1 && edges[i].visible)
		{
			toHide.push(edges[i].data.id);
		}
	}
	visObject.filter("edges",toHide,true);
	updateInfo();
	showLabels("edges");
}

function updateInfo()
{
	var visObject = getVisData('cytoscapeweb');
	var selNodes = visObject.selected("nodes");
	var selEdges = visObject.selected("edges");
	var noN = selNodes.length;
	var noE = selEdges.length;
	var vN = 0;
	var vE = 0;
	var i;
	
	if (noN>1 || noE>1)
	{
		for (i=0;i<noN;i++)
		{
			if (selNodes[i].visible) { vN++; }
		}
		for (i=0;i<noE;i++)
		{
			if (selEdges[i].visible) { vE++; }
		}
		msg = "<span style=\"color:#000000; font-weight:bold\">Multiple elements selected</span><br/>" +
			  "Genes: <span style=\"color:#FF0000\">" + vN + "</span><br/>" +
			  "Relationships: <span style=\"color:#FF0000\">" + vE + "</span><br/>";
		showInfo(msg);
	}
}

function removeMeta(what,howmany,cat)
{
	var visObject = getVisData('cytoscapeweb');
	var nodes = visObject.nodes();
	var toRemove = [];
	var i = 0;
	var len = nodes.length;
	var tmp;
	
	switch(what)
	{
		case 'go':
			switch(howmany)
			{
				case 'selected':
					toRemove = JSON.parse($.toJSON($("#go_list").val()));
					break;
				case 'all':
					if (cat === "all")
					{
						for (i=0;i<len;i++)
						{
							tmp = nodes[i].data.object_type;
							if (tmp === "component" || tmp === "function" || tmp === "process")
							{
								toRemove.push(nodes[i].data.id);
							}
						}
					}
					else
					{
						for (i=0;i<len;i++)
						{
							tmp = nodes[i].data.object_type;
							if (tmp === cat)
							{
								toRemove.push(nodes[i].data.id);
							}
						}
					}
					break;
			}
			break;

		case 'kegg':
			switch(howmany)
			{
				case 'selected':
                    toRemove = JSON.parse($.toJSON($("#kegg_list").val()));
					break;
				case 'all':
                    for (i=0;i<len;i++)
                    {
                        if (nodes[i].data.object_type === "pathway")
                        {
                            toRemove.push(nodes[i].data.id);
                        }
                    }
					break;
			}
			break;

		case 'mirna':
			switch(howmany)
			{
				case 'selected':
					toRemove = JSON.parse($.toJSON($("#mirna_list").val()));
					break;
				case 'all':
					for (i=0;i<len;i++)
                    {
                        if (nodes[i].data.object_type === "mirna")
                        {
                            toRemove.push(nodes[i].data.id);
                        }
                    }
					break;
			}
			removeMiRNAData(toRemove);
			break;
	}
    
    removeElements(toRemove);
    updateInfo();
}

function addElements(elems)
{
	var visObject = getVisData('cytoscapeweb');

	// We must check if any of the elements (IDs) are already in the canvas
	// and remove them, else cytoscapeweb throws error
	var nodes = visObject.nodes();
	var edges = visObject.edges();
	var nodeLength = nodes.length;
	var edgeLength = edges.length;
	var elemLength = elems.length;
	var toRemove = [];
	var nids = [];
	var eids = [];
	var i = 0;

	for (i=0; i<nodeLength; i++)
	{
		if ($.inArray(nodes[i].data.object_type,["component","function","process","pathway","mirna","gene"]) !== -1)
		{
			nids.push(nodes[i].data.id);
		}
	}
	// No need to remove go, kegg, mirna edges for neighbors, otherwise, they are removed automatically
	for (i=0; i<edgeLength; i++)
	{
		if ($.inArray(edges[i].data.interaction,["binding","ptmod","expression","activation"]) !== -1)
		{
			eids.push(edges[i].data.id);
		}
	}
	
	for (i=0; i<elemLength; i++)
	{
		if (elems[i].group === "nodes" && $.inArray(elems[i].data.id,nids) !== -1)
		{
			toRemove.push(elems[i].data.id);
		}
		if (elems[i].group === "edges" && $.inArray(elems[i].data.id,eids) !== -1)
		{
			toRemove.push(elems[i].data.id);
		}
	}

	visObject.removeElements(toRemove);
	visObject.addElements(elems,true);
	updateInfo();
}

function updateLayout(layopt)
{
	var visObject = getVisData("cytoscapeweb");
	if ($.isEmptyObject(visObject) || visObject === undefined || visObject === null)
	{
		modalAlert("No network has been initialized yet!");
		return;
	}

	var layoutOpts = getData("cytoscapeweb","layout");
	//var layoutOpts = $("#cytoscapeweb").data("layout");
	switch(layopt)
	{
		case 'ForceDirected':
			theLayout =
			{
				gravitation: layoutOpts.ForceDirected.gravitation,
				mass: layoutOpts.ForceDirected.node_mass,
				tension: layoutOpts.ForceDirected.edge_tension
			};
			visObject.layout({ name: 'ForceDirected', options: theLayout });
			break;
		case 'Circle':
			theLayout =
			{
				angleWidth: layoutOpts.Circle.angle_width,
				tree: layoutOpts.Circle.tree_structure
			};
			visObject.layout({ name: 'Circle', options: theLayout });
			break;
		case 'Radial':
			theLayout =
			{
				angleWidth: layoutOpts.Radial.angle_width,
				radius: layoutOpts.Radial.radius
			};
			visObject.layout({ name: 'Radial', options: theLayout });
			break;
		case 'Tree':
			theLayout =
			{
				orientation: layoutOpts.Tree.orientation,
				depthSpace: layoutOpts.Tree.depth,
				breadthSpace: layoutOpts.Tree.breadth
			};
			visObject.layout({ name: 'Radial', options: theLayout });
			break;
	}
}

function exportText(format)
{
	var visObject = getVisData('cytoscapeweb');
	if ($.isEmptyObject(visObject) || visObject === undefined || visObject === null)
	{
		modalAlert("No network has been initialized yet!");
		return;
	}
	var urlBase = initMe();
	var text;
		
	switch(format)
	{
		case 'sif':
			// Total export control is passed to modalSifForm
			modalSifForm("Select SIF node types to export");
			break;
		case 'graphml':
			text = visObject.graphml();
			text.replace(/</,'&lt;');
			text.replace(/>/,'&gt;');
			$("#infoContainer").text(text);
			visObject.exportNetwork(format,urlBase + 'php/control.php?export=' + format,{ window: '_self' });
			break;
		case 'xgmml':
			text = visObject.xgmml();
			text.replace(/</,'&lt;');
			text.replace(/>/,'&gt;');
			$("#infoContainer").text(text);
			visObject.exportNetwork(format,urlBase + 'php/control.php?export=' + format,{ window: '_self' });
			break;
	}
}

function exportImage(format)
{
	var visObject = getVisData('cytoscapeweb');
	if ($.isEmptyObject(visObject) || visObject === undefined || visObject === null)
	{
		modalAlert("No network has been initialized yet!");
		return;
	}
	var urlBase = initMe();
	visObject.exportNetwork(format,urlBase + 'php/control.php?export=' + format,{ window: '_self' });
}

function gimmeNodeData(type,staticData,ajaxData)
{
	var msg = "";
	switch(type)
	{
		case 'gene':
			msg = gimmeGeneData(staticData,ajaxData);
			break;
		case 'go':
			msg = gimmeGOData(staticData,ajaxData);
			break;
		case 'pathway':
			msg = gimmePathwayData(staticData,ajaxData);
			break;
		case 'mirna':
			msg = gimmeMirnaData(staticData,ajaxData);
			break;
	}
	showInfo(msg);
}

function gimmeEdgeData(type,staticData,ajaxData)
{
	var msg = "";
	switch(type)
	{
		case 'gene2gene':
			msg = gimmeGene2GeneData(staticData,ajaxData);
			break;
		case 'go2gene':
			msg = gimmeGO2GeneData(staticData,ajaxData);
			break;
		case 'kegg2gene':
			msg = gimmePathway2GeneData(staticData,ajaxData);
			break;
		case 'mirna2gene':
			msg = gimmeMirna2GeneData(staticData,ajaxData);
			break;
	}
	showInfo(msg);
}

function gimmeGeneData(staticData,ajaxData)
{
	var msg;
	var nodeData = {};

	nodeData.id = "Ensembl protein: <span style=\"color:#FF0000\">" + staticData['id'] + "</span><br/>";
	if (staticData['parent'] === '' || staticData['parent'] === null || staticData['parent'] === 'undefined')
	{
		nodeData.label = "Gene symbol: <a class=\"infolink\" href=\"http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + staticData['label'] + "\" target=\"_blank\">" + staticData['label'] + "</a><br/>";
	}
	else
	{
		nodeData.label = "";
	}
	nodeData.entrez = "Entrez ID: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/gene?term=" + staticData['entrez_id'] + "\" target=\"_blank\">" + staticData['entrez_id'] + "</a><br/>";
	nodeData.strength = staticData['strength']==="" ? "" : "Expression strength: <span style=\"color:#FF0000\">" + staticData['strength'] + "</span><br/>";
	nodeData.expression = staticData['expression']==="" ? "" : "Differential expression: <span style=\"color:#FF0000\">" + staticData['expression'] + "</span><br/>";
	nodeData.ratio = (staticData['ratio']===999 || staticData['ratio']===null) ? "" : "Fold change: <span style=\"color:#FF0000\">" + staticData['ratio'] + "</span><br/>";
	nodeData.pvalue = (staticData['pvalue']===999 || staticData['pvalue']===null) ? "" : "p-value: <span style=\"color:#FF0000\">" + Math.pow(10,-staticData['pvalue']) + "</span><br/>";
	nodeData.fdr = (staticData['fdr']===999 || staticData['fdr']===null) ? "" : "FDR: <span style=\"color:#FF0000\">" + staticData['fdr'] + "</span><br/>";

	if ($.isEmptyObject(ajaxData))
	{
		nodeData.synonyms = "No additional information found for the selected gene.";
		nodeData.DB = "";
		nodeData.chromosome = "";
		nodeData.description = "";
	}
	else
	{
		nodeData.synonyms = ajaxData.synonyms==="" ? "" : "Synonyms: <span style=\"color:#FF0000\">" + ajaxData.synonyms + "</span><br/>";
		nodeData.chromosome = ajaxData.chromosome==="" ? "" : "Chromosome: <span style=\"color:#FF0000\">" + ajaxData.chromosome + "</span><br/>";
		nodeData.description = ajaxData.description==="" ? "" : "Description: <span style=\"color:#FF0000\">" + ajaxData.description + "</span><br/>";
		nodeData.DB = "";
		for (var key in ajaxData.external)
		{
			nodeData.DB += key + ": " + ajaxData.external[key];
		}
	}

	msg = "<span style=\"color:#000000; font-weight:bold\">KUPKB data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.entrez + nodeData.strength +
		  nodeData.expression + nodeData.ratio + nodeData.pvalue + nodeData.fdr +
		  "<span style=\"color:#000000; font-weight:bold\">External references</span><br/>" +
		  nodeData.synonyms + nodeData.chromosome + nodeData.description + nodeData.DB;

	return(msg);
}

function gimmeGOData(staticData,ajaxData)
{
	var msg;
	var nodeData = {};

	nodeData.id = "GO ID: <a class=\"infolink\" href=\"http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=" + staticData['id'] + "\" target=\"_blank\">" + staticData['id'] + "</a><br/>";
	nodeData.label = "GO term: <span style=\"color:#FF0000\">" + staticData['label'] + "</span><br/>";
	nodeData.category = "GO category: <span style=\"color:#FF0000\">" + staticData['object_type'] + "</span><br/>";

	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">Gene Ontology data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.category;

	return(msg);
}

function gimmePathwayData(staticData,ajaxData)
{
	var msg;
	var nodeData = {};

	nodeData.id = "Pathway ID: <a class=\"infolink\" href=\"http://www.genome.jp/dbget-bin/www_bget?pathway:" + staticData['id'] + "\" target=\"_blank\">" + staticData['id'] + "</a><br/>";
	nodeData.label = "Pathway name: <span style=\"color:#FF0000\">" + staticData['label'] + "</span><br/>";
	nodeData.pathClass = "Pathway class: <span style=\"color:#FF0000\">" + staticData['strength'] + "</span><br/>";

	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">KEGG pathway data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.pathClass;

	return(msg);
}

function gimmeMirnaData(staticData,ajaxData)
{
	var msg;
	var nodeData = {};

	nodeData.id = "miRNA ID: <a class=\"infolink\" href=\"http://www.mirbase.org/cgi-bin/mirna_entry.pl?acc=" + staticData['id'] + "\" target=\"_blank\">" + staticData['id'] + "</a><br/>";
	nodeData.strength = staticData['strength']==="" ? "" : "Expression strength: <span style=\"color:#FF0000\">" + staticData['strength'] + "</span><br/>";
	nodeData.expression = staticData['expression']==="" ? "" : "Differential expression: <span style=\"color:#FF0000\">" + staticData['expression'] + "</span><br/>";
	nodeData.ratio = (staticData['ratio']===999 || staticData['ratio']===null) ? "" : "Fold change: <span style=\"color:#FF0000\">" + staticData['ratio'] + "</span><br/>";
	nodeData.pvalue = (staticData['pvalue']===999 || staticData['pvalue']===null) ? "" : "p-value: <span style=\"color:#FF0000\">" + Math.pow(10,-staticData['pvalue']) + "</span><br/>";
	nodeData.fdr = (staticData['fdr']===999 || staticData['fdr']===null) ? "" : "FDR: <span style=\"color:#FF0000\">" + staticData['fdr'] + "</span><br/>";

	if (nodeData.strength === '' && nodeData.expression === '' && nodeData.ratio === '' && nodeData.pvalue === '' && nodeData.fdr === '')
	{
		nodeData.label = "miRNA name: <span style=\"color:#FF0000\">" + staticData['label'] + "</span><br/>";
	}
	else { nodeData.label = ""; }
	
	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">miRNA data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.strength + nodeData.expression +
		  nodeData.ratio + nodeData.pvalue + nodeData.fdr;

	return(msg);
}

function gimmeGene2GeneData(staticData,ajaxData)
{
	var msg;
	var edgeData = {};

	edgeData.interaction = "Interaction type: <span style=\"color:#FF0000\">" + staticData['interaction'] + "</span><br/>";
	if ($.isEmptyObject(ajaxData))
	{
		edgeData.evidence = "No additional evidence found.";
	}
	else
	{
		edgeData.evidence = "Evidence: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=" +
			ajaxData['source'] + " AND " + ajaxData['target'] + "\" target=\"_blank\">Look in Pubmed</a><br/>";
	}

	msg = "<span style=\"color:#000000; font-weight:bold\">Edge data</span><br/>" +
		  edgeData.interaction + edgeData.evidence;

	return(msg);
}

function gimmeGO2GeneData(staticData,ajaxData)
{
	var msg;
	var edgeData = {};

	edgeData.interaction = "Interaction type: <span style=\"color:#FF0000\">" + staticData['interaction'] + "</span><br/>";
	edgeData.evidence = staticData['custom'] === "" ? "No additional evidence found." :
		"Evidence: <a class=\"infolink\" href=\"" + staticData['custom'] + "\" target=\"_blank\">Pubmed</a><br/>";
	
	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">Edge data</span><br/>" +
		  edgeData.interaction + edgeData.evidence;

	return(msg);
}

function gimmePathway2GeneData(staticData,ajaxData)
{
	var msg;
	var edgeData = {};

	edgeData.interaction = "Interaction type: <span style=\"color:#FF0000\">" + staticData['interaction'] + "</span><br/>";
	edgeData.pathClass = "Pathway class: <span style=\"color:#FF0000\">" + staticData['custom'] + "</span><br/>";
	if ($.isEmptyObject(ajaxData))
	{
		edgeData.evidence = "No additional evidence found.";
	}
	else
	{
		edgeData.evidence = "Evidence: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=" +
			staticData['custom'] + " AND " + ajaxData['target'] + "\" target=\"_blank\">Look in Pubmed</a><br/>";
	}

	msg = "<span style=\"color:#000000; font-weight:bold\">Edge data</span><br/>" +
		  edgeData.interaction + edgeData.pathClass + edgeData.evidence;

	return(msg);
}

function gimmeMirna2GeneData(staticData,ajaxData)
{
	var msg;
	var edgeData = {};

	edgeData.interaction = "Interaction type: <span style=\"color:#FF0000\">" + staticData['interaction'] + "</span><br/>";
	if ($.isEmptyObject(ajaxData)) { } // Stub
	edgeData.evidence = "Evidence: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=" +
		staticData['custom'] + " AND " + ajaxData['target'] + "\" target=\"_blank\">Look in Pubmed</a><br/>";

	msg = "<span style=\"color:#000000; font-weight:bold\">Edge data</span><br/>" +
		  edgeData.interaction + edgeData.evidence;

	return(msg);
}

function gimmeNodeColor(attr,val)
{
	var color;

	switch(attr)
	{
		case "strength":
			switch(val)
			{
				case "Strong":
					color = "#0C5DA5";
					break;
				case "Medium":
					color = "#539AD9";
					break;
				case "Weak":
					color = "#A4C9EB";
					break;
				case "Present":
					color = "#9FFFB5";
					break;
				case "Absent":
					color = "#FFF59F";
					break;
				default:
					color = "#F7F7F7";
			}
			break;
		case "expression":
			switch(val)
			{
				case "Up":
					color = "#FF0000";
					break;
				case "Down":
					color = "00FF00";
					break;
				case "Unmodified":
					color = "#FFDA00";
					break;
				default:
					color = "#F7F7F7";
			}
			break;
		case "ratio":
			color = mapRatioColor(val);
			break;
		default:
			color = "#F7F7F7";
	}

	return(color);
}

function gimmeNodeBorder(val)
{
	var mm = 10;
	var from = 1;
	var to = 10;
	
	if (val>0) { val = -log10(val) };
	val = val>mm ? val=mm : val=val;
	p = val/mm;
	return(Math.floor(from+(to-from+1)*p));
}

function restoreNetwork()
{
	var visObject = getVisData('cytoscapeweb');
	visObject.removeFilter();
	filterEdges();
	updateInfo();
}

function hideElements(group,action)
{
	var vis = getVisData('cytoscapeweb');
	var selElems = vis.selected(group);
	var selElemIDs = [];
	var toHide = [];
	var i, allElems;

	if (group === "nodes")
	{
		allElems = vis.nodes();
	}
	else
	{
		allElems = vis.edges();
	}

	for (i=0; i<selElems.length; i++)
	{
		selElemIDs.push(selElems[i].data.id);
	}
	
	for (i=0; i<allElems.length; i++)
	{
		if ($.inArray(allElems[i].data.id,selElemIDs) === -1)
		{
			toHide.push(allElems[i].data.id);
		}
	}

	if (action === "hide")
	{
		if (group === "nodes") { vis.filter(group,toHide); }
		if (group === "edges") { hideSomeEdges(selElemIDs); }
	}
	else if (action === "delete")
	{
		// We additionally need to see if there any miRNAs to be deleted in order
		// to update the relative datasets
		hasmirna = false;
		if (group === "nodes")
		{
			for (i=0; i<selElems.length; i++)
			{
				if (selElems[i].data.object_type === "mirna")
				{
					hasmirna = true;
					break;
				}
			}
		}

		vis.removeElements(selElems);

		if (hasmirna)
		{
			for (i=0; i<selElems.length; i++)
			{
				if (selElems[i].data.object_type === "mirna")
				{
					selElemIDs.push(selElems[i].data.id);
				}
			}
			removeMiRNAData(selElemIDs);
		}
	}
	updateInfo();
}

// Only for level 1 for the moment...
function showNeighbors(level)
{
	var visObject = getVisData('cytoscapeweb');
	var selNodes = visObject.selected("nodes");
	var selNodeIDs = [];
	var sn = selNodes.length;
	var i = 0;
	
	if (sn === 0) // Nothing selected
	{
		modalAlert("Please select at least one node.","Attention!");
		return;
	}

	for (i=0; i<sn; i++)
	{
		selNodeIDs.push(selNodes[i].data.id);
	}

	var nObj = visObject.firstNeighbors(selNodeIDs,true);

	// Now highlight neighboring nodes and edges
	visObject.select("nodes",nObj.neighbors);
	visObject.select("edges",nObj.edges);
}

function mapRatioColor(val)
{
	var mm = 5; // mm = 3;
	if (val<0) // We need to down-interpolate R
	{
		//val = log2(Math.abs(val));
		val = Math.abs(val);
		val = val>mm ? val=mm : val=val;
		r = Math.round((1-val/mm)*255);
		g = 255;
	}
	else if (val>0) // We need to down-interpolate G
	{
		//val = log2(val);
		val = val>mm ? val=mm : val=val;
		r = 255;
		g = Math.round((1-val/mm)*255);
	}
	b = 0;
	return(rgbToHex(r,g,b));
}

function componentToHex(c)
{
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r,g,b)
{
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function sigSizeChange()
{
	var visObject = getVisData("cytoscapeweb");
	var nodes = visObject.nodes();
	var noN = nodes.length;
	var visProps = [];
	var i, currNode;
	var bypass = { nodes: { }, edges: { } };

	if ($("#sig_size_check").is(":checked"))
	{
		for (i=0; i<noN; i++)
		{
			if (nodes[i].data.pvalue !== 999 && nodes[i].data.pvalue !== null)
			{
				bypass[nodes[i].group][nodes[i].data.id] = { color: nodes[i].color, borderWidth: gimmeNodeBorder(Math.pow(10,-nodes[i].data.pvalue)), borderColor: "#666666" };
			}
		}
	}
	else
	{
		for (i=0; i<noN; i++)
		{
			if (nodes[i].data.pvalue !== 999 && nodes[i].data.pvalue !== null)
			{
				bypass[nodes[i].group][nodes[i].data.id] = { color: nodes[i].color, borderWidth: 1, borderColor: "#000000" };
			}
		}
	}

	visObject.visualStyleBypass(bypass);
}

function showLabels(group)
{
	var visObject = getVisData('cytoscapeweb');
	
	switch(group)
	{
		case "nodes":
			if ($("#node_labels_check").is(":checked"))
			{
				visObject.nodeLabelsVisible(true);
			}
			else
			{
				visObject.nodeLabelsVisible(false);
			}
			updateInfo();
			break;
		case "edges":
			if ($("#edge_labels_check").is(":checked"))
			{
				visObject.edgeLabelsVisible(true);
			}
			else
			{
				visObject.edgeLabelsVisible(false);
			}
			updateInfo();
			break;
	}
}

function resetNodeData(type)
{
	var visObject = getVisData("cytoscapeweb");
	var bypass = getData("cytoscapeweb","bypass");
	var nodes = visObject.nodes();
	var n = nodes.length;
	var reset = [];
	var i = 0;
	//var bypass = { nodes: { }, edges: { } };
	var redata = { strength: "", expression: "", ratio: 999, pvalue: 999, fdr: 999 };
	var pNodes = [];
	var cNodes = [];

	switch(type)
	{	
		case 'gene':
			// Reset normal nodes
			for (i=0; i<n; i++)
			{
				if (nodes[i].data.object_type === "gene")
				{
					reset.push(nodes[i].data.id)
					bypass["nodes"][nodes[i].data.id] = { color: "#F7F7F7", borderWidth: 1, borderColor: "#000000" };
				}
			}
			// Now, find any children nodes, we will add an if to check if this is allowed by the application
			if ($("#multicolor_gene_check").is(":checked"))
			{
				pNodes = visObject.parentNodes();
				cNodes = [];
				for (i=0; i<pNodes.length; i++)
				{
					if (pNodes[i].data.object_type === "gene")
					{
						cNodes = visObject.childNodes(pNodes[i]);
						visObject.removeElements("nodes",cNodes);
					}
				}
			}
			break;
		case 'mirna':
			for (i=0; i<n; i++)
			{
				if (nodes[i].data.object_type === "mirna")
				{
					reset.push(nodes[i].data.id)
					bypass["nodes"][nodes[i].data.id] = { color: "#6E86D6", borderWidth: 1, borderColor: "#000000" };
				}
			}
			// Now, find any children nodes, we will add an if to check if this is allowed by the application
			if ($("#multicolor_mirna_check").is(":checked"))
			{
				pNodes = visObject.parentNodes();
				cNodes = [];
				for (i=0; i<pNodes.length; i++)
				{
					if (pNodes[i].data.object_type === "mirna")
					{
						cNodes = visObject.childNodes(pNodes[i]);
						visObject.removeElements("nodes",cNodes);
					}
				}
			}
			break;
	}

	setData("cytoscapeweb","bypass",bypass);
	visObject.updateData(reset,redata);
	visObject.visualStyleBypass(bypass);
}

function checkMultiColor(type)
{
	var visObject = getVisData("cytoscapeweb");
	var pNodes = visObject.parentNodes();
	var cNodes = [];
	switch(type)
	{
		case 'gene':
			if (!$("#multicolor_gene_check").is(":checked"))
			{
				for (i=0; i<pNodes.length; i++)
				{
					if (pNodes[i].data.object_type === "gene")
					{
						cNodes = visObject.childNodes(pNodes[i]);
						visObject.removeElements("nodes",cNodes);
					}
				}
				colorNodes(type);
			}
			else
			{
				colorNodes(type);
			}
			break;
		case 'mirna':
			if (!$("#multicolor_mirna_check").is(":checked"))
			{
				for (i=0; i<pNodes.length; i++)
				{
					if (pNodes[i].data.object_type === "mirna")
					{
						cNodes = visObject.childNodes(pNodes[i]);
						visObject.removeElements("nodes",cNodes);
					}
				}
				colorNodes(type);
			}
			else
			{
				colorNodes(type);
			}
			break;
	}
}

function getEntrezIDs()
{
	var visObject = getVisData('cytoscapeweb');
	var nodes = visObject.nodes();
	var n = nodes.length;
	var entrezIDs = [];
	
	for (var i=0; i<n; i++)
	{
		entrezIDs.push(nodes[i].data.entrez_id);
	}

	return(entrezIDs);
}

function removeElements(elems)
{
	var visObject = getVisData('cytoscapeweb');
	visObject.removeElements(elems,true);
}

function initGlobalStyle()
{
	var globalStyle =
	{
		backgroundColor: "#FFFFFF",
		selectionFillColor: "#9A9AFF"
	};

	return(globalStyle);
}

function initNodeStyle()
{
	var nodeMapper = initNodeMapper();

	var nodeStyle =
	{
		shape:
		{
			defaultValue: "ELLIPSE",
			discreteMapper: nodeMapper.shapeMapper
		},
		borderWidth: 1,
		borderColor: "#000000",
		size: "auto",
		color:
		{
			defaultValue: "#F7F7F7",
			discreteMapper: nodeMapper.metaMapper
		},
		labelHorizontalAnchor: "center",
		labelVerticalAnchor: "middle",
		selectionColor: "#5FFFFB",
		selectionGlowColor: "#95FFFE",
		selectionGlowStrength: 32,
		labelFontWeight:
		{
			defaultValue: "normal",
			discreteMapper: nodeMapper.fontWeightMapper
		},
        labelFontColor:
        {
            defaultValue: "#000000",
            discreteMapper: nodeMapper.fontColorMapper
        }
	};

	return(nodeStyle);
}

function initEdgeStyle()
{
	var edgeMapper = initEdgeMapper();

	var edgeStyle =
	{
		color:
		{
			defaultValue: "#999999",
			discreteMapper: edgeMapper.colorMapper
		},
		width:
		{
			defaultValue: 1,
			discreteMapper: edgeMapper.widthMapper
		},
		labelFontColor:
		{
			defaultValue: "#000000",
			discreteMapper: edgeMapper.colorMapper
		}
	};

	return(edgeStyle);
}

function initNodeMapper()
{
	var nodeMapper =
	{
		shapeMapper:
		{
			attrName: "object_type",
			entries:
			[
				{ attrValue: "gene", value: "ELLIPSE" },
				{ attrValue: "component", value: "ROUNDRECT" },
				{ attrValue: "function", value: "ROUNDRECT" },
				{ attrValue: "process", value: "ROUNDRECT" },
				{ attrValue: "pathway", value: "PARALLELOGRAM" },
				{ attrValue: "mirna", value: "DIAMOND" }
			]
		},
		strengthMapper:
		{
			attrName: "strength",
			entries:
			[
				{ attrValue: "Strong", value: "#0C5DA5" },
				{ attrValue: "Medium", value: "#539AD9" },
				{ attrValue: "Weak", value: "#A4C9EB" },
				{ attrValue: "Present", value: "#9FFFB5" },
				{ attrValue: "Absent", value: "#FFF59F" }
			]
		},
		expressionMapper:
		{
			attrName: "expression",
			entries:
			[
				{ attrValue: "Up", value: "#FF0000" },
				{ attrValue: "Down", value: "#00FF00" },
				{ attrValue: "Unmodified", value: "#FFDA00" }
			]
		},
		ratioMapper: { attrName: "ratio", minValue: "#00FF00", maxValue: "#FF0000" },
		pvalueMapper: { attrName: "pvalue", minValue: 16, maxValue: 64 },
		fdrMapper: { attrName: "fdr", minValue: 16, maxValue: 64 },
		metaMapper:
		{
			attrName: "object_type",
			entries:
			[
				{ attrValue: "gene", value: "#F7F7F7" },
				{ attrValue: "component", value: "#A468D5" },
				{ attrValue: "function", value: "#BFA630" },
				{ attrValue: "process", value: "#6E86D6" },
				{ attrValue: "pathway", value: "#700900" },
				{ attrValue: "mirna", value: "#6E86D6" }
			]
		},
		fontWeightMapper:
		{
			attrName: "object_type",
			entries:
			[
				{ attrValue: "gene", value: "normal" },
				{ attrValue: "component", value: "bold" },
				{ attrValue: "function", value: "bold" },
				{ attrValue: "process", value: "bold" },
				{ attrValue: "pathway", value: "bold" },
				{ attrValue: "mirna", value: "bold" }
			]
		},
        fontColorMapper:
        {
            attrName: "object_type",
            entries:
            [
                { attrValue: "gene", value: "#000000" },
                { attrValue: "component", value: "#000000" },
                { attrValue: "function", value: "#000000" },
                { attrValue: "process", value: "#000000" },
                { attrValue: "pathway", value: "#FFFFFF" },
                { attrValue: "mirna", value: "#000000" }
            ]
        }
	};

	return(nodeMapper);
}

function initEdgeMapper()
{
	var edgeMapper =
	{
		colorMapper:
		{
			attrName: "interaction",
			entries:
			[
				{ attrValue: "binding", value: "#028E9B" },
				{ attrValue: "ptmod", value: "#133CAC" },
				{ attrValue: "expression", value: "#FFAD00" },
				{ attrValue: "activation", value: "#FF7800" },
				{ attrValue: "go", value: "#9BA402" },
				{ attrValue: "kegg", value: "#D30068" },
				{ attrValue: "mirna", value: "#A67D00" }
			]
		},
		widthMapper:
		{
			attrName: "interaction",
			entries:
			[
				{ attrValue: "go", value: 3 },
				{ attrValue: "kegg", value: 3 },
				{ attrValue: "mirna", value: 3 }
			]
		}
	};

	return(edgeMapper);
}

function initLayoutOpts()
{
	var layoutOpts =
	{
		ForceDirected:
		{
			gravitation: -500,
			node_mass: 5,
			edge_tension: 0.5
		},
		Circle:
		{
			angle_width: 360,
			tree_structure: true
		},
		Tree:
		{
			orientation: "topToBottom",
			depth: 50,
			breadth: 30
		},
		Radial:
		{
			radius: -500,
			angle_width: 360
		}
	};

	return(layoutOpts);
}

function getVisData(container)
{
	return($("#"+container).data("visObject"));
}

function setVisData(container,data)
{
	$(container).data("visObject",data);
}

function getData(container,name)
{
	return($("#"+container).data(name));
}

function setData(container,name,data)
{
	$("#"+container).data(name,data);
}


/*function updateLayout()
{
	var visObject = getVisData("cytoscapeweb");
	var layopt = $("#layout_list").val();

	switch(layopt)
	{
		case 'ForceDirected':
			if (mySimpleValidation(['force_gravitation','force_node_mass','force_edge_tension']))
			{
				theLayout =
				{
					gravitation: parseFloat($("#force_gravitation").val()),
					mass: parseFloat($("#force_node_mass").val()),
					tension: parseFloat($("#force_edge_tension").val())
				};
				visObject.layout({ name: 'ForceDirected', options: theLayout });
			} else { return; }
			break;
		case 'Circle':
			if (mySimpleValidation(['circle_angle']))
			{
				theLayout =
				{
					angleWidth: parseFloat($("#circle_angle").val()),
					tree: $("#circle_tree_struct").is(":checked")
				};
				visObject.layout({ name: 'Circle', options: theLayout });
			} else { return; }
			break;
		case 'Radial':
			if (mySimpleValidation(['radial_radius','radial_angle']))
			{
				theLayout =
				{
					angleWidth: parseFloat($("#radial_angle").val()),
					radius: parseFloat($("#radial_radius").val())
				};
				visObject.layout({ name: 'Radial', options: theLayout });
			} else { return; }
			break;
		case 'Tree':
			if (mySimpleValidation(['tree_depth','tree_breadth']))
			{
				theLayout =
				{
					orientation: $("#tree_orientation").val(),
					depthSpace: parseFloat($("#tree_depth").val()),
					breadthSpace: parseFloat($("#tree_breadth").val())
				};
				visObject.layout({ name: 'Radial', options: theLayout });
			} else { return; }
			break;
	}
}*/

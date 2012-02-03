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

function bypassNodeColors(ajaxData)
{
	var visObject = getVisData("cytoscapeweb");
	var nodeMapper = initNodeMapper();
	var nodes = visObject.nodes()
	var noN = nodes.length;
	var noA = ajaxData.length;
	var ajaxNodes = [];
	var visProps = [];
	var i, currNode;
	var bypass = { nodes: { }, edges: { } };
	
	// Construct the array of entrez_id in ajaxData;
	//ajaxNodes.ID = [];
	//ajaxNodes.idx = [];
	for (i=0; i<noA; i++)
	{
		if (ajaxData[i].ratio !== '') // Ratio exists
		{
			if ($("#sig_size_checked").is(":checked"))
			{
				visProps.push({ color: { continuousMapper: nodeMapper.ratioMapper }, size: {continuousMapper: nodeMapper.pvalueMapper} });
			}
			else
			{
				visProps.push({ color: { continuousMapper: nodeMapper.ratioMapper } });
			}
		}
		else
		{
			if (ajaxData[i].expression !== '') // DE expression exists
			{
				if ($("#sig_size_checked").is(":checked"))
				{
					visProps.push({ color: { discreteMapper: nodeMapper.expressionMapper }, size: {continuousMapper: nodeMapper.pvalueMapper} });
				}
				else
				{
					visProps.push({ color: { discreteMapper: nodeMapper.expressionMapper } });
				}
			}
			else
			{
				if (ajaxData[i].strength !== '') // Expression strength exists
				{
					if ($("#sig_size_checked").is(":checked"))
					{
						visProps.push({ color: { discreteMapper: nodeMapper.strengthMapper }, size: {continuousMapper: nodeMapper.pvalueMapper} });
					}
					else
					{
						visProps.push({ color: { discreteMapper: nodeMapper.strengthMapper } });
					}
				}
			}
		}
		ajaxNodes.push(ajaxData[i].entrez_id);
	}

	for (i=0; i<noN; i++)
	{
		var ii = $.inArray(nodes[i].data.entrez_id,ajaxNodes);
		if (ii !== -1) // Node in KUPKB expression data
		{
			currNode = nodes[i];
			bypass[currNode.group][currNode.data.id] = visProps[ii]; // Crossing fingers...
		}
	}

	visObject.visualStyleBypass(bypass);
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
		// size will be passed to bypasser as we initialize colorless
		/*size:
		{
			defaultValue: "auto",
			continuousMapper: nodeMapper.pvalueMapper
		},*/
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
				{ attrValue: "Medium", value: "#408DD2" },
				{ attrValue: "Weak", value: "#679FD2" }
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
				{ attrValue: "mirna", value: "normal" }
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
					break;
				case 'all':
					break;
			}
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
	var nodeLength = nodes.length;
	var elemLength = elems.length;
	var toRemove = [];
	var nids = [];
	var i = 0;

	for (i=0; i<nodeLength; i++)
	{
		if ($.inArray(nodes[i].data.object_type,["component","function","process","pathway","mirna","gene"]) !== -1)
		{
			nids.push(nodes[i].data.id);
		}
	}
	
	for (i=0; i<elemLength; i++)
	{
		if (elems[i].group === "nodes" && $.inArray(elems[i].data.id,nids) !== -1)
		{
			toRemove.push(elems[i].data.id);
		}
	}

	visObject.removeElements(toRemove);
	visObject.addElements(elems,true);
	updateInfo();
}

function updateLayout()
{
	var layopt = $("#layout_list").val();
	var visObject = getVisData("cytoscapeweb");

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
}

function exportText(format)
{
	var visObject = getVisData('cytoscapeweb');
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
	var urlBase = initMe();
	visObject.exportNetwork(format,urlBase + 'php/control.php?export=' + format,{ window: '_self' });
	/*switch(format)
	{
		case 'png':
			text = visObject.png();
			showInfo(text);
			break;
		case 'pdf':
			text = visObject.pdf();
			showInfo(text);
			break;
		case 'svg':
			text = visObject.svg();
			showInfo(text);
			break;
	}*/
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
	nodeData.label = "Gene symbol: <a class=\"infolink\" href=\"http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + staticData['label'] + "\" target=\"_blank\">" + staticData['label'] + "</a><br/>";
	nodeData.entrez = "Entrez ID: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/gene?term=" + staticData['entrez_id'] + "\" target=\"_blank\">" + staticData['entrez_id'] + "</a><br/>";
	nodeData.strength = staticData['strength']==="" ? "" : "Expression strength: <span style=\"color:#FF0000\">" + staticData['strength'] + "</span><br/>";
	nodeData.expression = staticData['expression']==="" ? "" : "Differential expression: <span style=\"color:#FF0000\">" + staticData['expression'] + "</span><br/>";
	nodeData.ratio = staticData['ratio']===999 ? "" : "Fold change: <span style=\"color:#FF0000\">" + staticData['ratio'] + "</span><br/>";
	nodeData.pvalue = staticData['pvalue']===999 ? "" : "p-value: <span style=\"color:#FF0000\">" + staticData['pvalue'] + "</span><br/>";
	nodeData.fdr = staticData['fdr']===999 ? "" : "FDR: <span style=\"color:#FF0000\">" + staticData['fdr'] + "</span><br/>";

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
	nodeData.label = "miRNA name: <span style=\"color:#FF0000\">" + staticData['label'] + "</span><br/>";
	nodeData.other = "";

	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">KEGG pathway data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.other;

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
	// Stub
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

function removeElements(elems)
{
	var visObject = getVisData('cytoscapeweb');
	visObject.removeElements(elems,true);
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
	return($(container).data(name));
}

function setData(container,name,data)
{
	$(container).data(name,data);
}

// Check for initialized ratio, pvalue... If 999 then wrong coloring
/*var nodes = vis.nodes();
if (nodes[0].data.ratio === 999 || nodes[0].data.pvalue === 999 || nodes[0].data.fdr === 999)
{
	var bypass = { nodes: { } };
	for (var i=0; i < nodes.length; i++)
	{
		var obj = nodes[i];
		bypass['nodes'][obj.data.id] = { "color": "#F7F7F7" };
	}
	//vis.updateData("nodes",{ "color": "#F7F7F7" });
	vis.visualStyleBypass(bypass);
}*/


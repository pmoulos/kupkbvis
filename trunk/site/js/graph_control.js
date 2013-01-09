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
	var parentNodes = visObject.parentNodes();
	var noN = nodes.length;
	var noPN = parentNodes.length;
	var noA = ajaxData.length;
	var ajaxNodes = [];
	var moreAjaxNodes = [];
	var visProps = [];
	var newData = [];
	var seen = [];
	var moreseen = [];
	var dataSeen = [];
	var propSeen = [];
	var sg2en = [];
	var multispecies = getMultiSpeciesStatus();
	var i, j, k, currNode;
	var multicolor, cShape, iShape;

	switch(type)
	{
		case 'gene':
			multicolor = $("#multicolor_gene_check").is(":checked") ? true : false;
			cShape = "ELLIPSE";
			iShape = "ELLIPSE";
			break;
		case 'mirna':
			multicolor = $("#multicolor_mirna_check").is(":checked") ? true : false;
			cShape = "RECTANGLE";
			iShape = "DIAMOND";
			break;
		default:
			multicolor = false;
			cShape = "ELLIPSE";
			iShape = "ELLIPSE";
	}

	// Not the best implementation, but we have to check for multiply present genes since
	// we are able to select multiple datasets
	for (i=0; i<noA; i++) // First initialize
	{
		seen[ajaxData[i].entrez_id] = [];
		moreseen[ajaxData[i].gene_symbol] = [];
	}
	for (i=0; i<noA; i++) // Now hash
	{
		seen[ajaxData[i].entrez_id].unshift(i);
		moreseen[ajaxData[i].gene_symbol].unshift(i);
	}
	
	// Construct the array of entrez_id in ajaxData;
	for (i=0; i<noA; i++)
	{
		if (multicolor) // Aarrghhh...
		{
			if (ajaxData[i].type === "protein" && seen[ajaxData[i].entrez_id].length >= 1)
			{
				iShape = "ROUNDRECT";
			}
			else if (ajaxData[i].type === "phosphoprotein" && seen[ajaxData[i].entrez_id].length >= 1)
			{
				iShape = "RECTANGLE";
			}
			else if (ajaxData[i].type === "gene" && seen[ajaxData[i].entrez_id].length >= 1)
			{
				iShape = "ELLIPSE";
			}
			else if (ajaxData[i].type === "mirna" && seen[ajaxData[i].entrez_id].length == 1)
			{
				iShape = "DIAMOND";
			}
			else if (ajaxData[i].type === "mirna" && seen[ajaxData[i].entrez_id].length > 1)
			{
				iShape = "ROUNDRECT";
			}
		}

		if (ajaxData[i].ratio !== 999 && ajaxData[i].ratio !== null) // Ratio exists
		{
			if ($("#sig_size_check").is(":checked") && ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
			{
				visProps.push({ color: gimmeNodeColor("ratio",ajaxData[i].ratio), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666", shape: iShape });
			}
			else
			{
				visProps.push({ color: gimmeNodeColor("ratio",ajaxData[i].ratio), shape: iShape });
			}
		}
		else
		{
			if (ajaxData[i].expression !== '' && ajaxData[i].expression !== null) // DE expression exists
			{
				ajaxData[i].expression = capFirst(ajaxData[i].expression);
				if ($("#sig_size_check").is(":checked") && ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
				{
					visProps.push({ color: gimmeNodeColor("expression",ajaxData[i].expression), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666", shape: iShape });
				}
				else
				{
					visProps.push({ color: gimmeNodeColor("expression",ajaxData[i].expression), shape: iShape });
				}
			}
			else
			{
				if ($("#sig_size_check").is(":checked") && ajaxData[i].strength !== '' && ajaxData[i].strength !== null) // Expression strength exists
				{
					ajaxData[i].strength = capFirst(ajaxData[i].strength);
					if (ajaxData[i].pvalue !== 999 && ajaxData[i].pvalue !== null)
					{
						visProps.push({ color: gimmeNodeColor("strength",ajaxData[i].strength), borderWidth: gimmeNodeBorder(ajaxData[i].pvalue), borderColor: "#666666", shape: iShape });
					}
					else
					{
						visProps.push({ color: gimmeNodeColor("strength",ajaxData[i].strength), shape: iShape });
					}
				}
			}
		}
		ajaxNodes.push(ajaxData[i].entrez_id);
		moreAjaxNodes.push(ajaxData[i].gene_symbol);
		newData.push({ strength: ajaxData[i].strength, expression: ajaxData[i].expression, ratio: ajaxData[i].ratio, pvalue: -log10(ajaxData[i].pvalue), fdr: ajaxData[i].fdr, dataset_id: ajaxData[i].dataset_id, custom: ajaxData[i].custom });
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

	if (multispecies)
	{
		for (i=0; i<noN; i++)
		{
			if(nodes[i].data.object_type !== "supergene")
			{
				sg2en[nodes[i].data.label.toLowerCase()] = 0;
			}
		}
		for (i=0; i<noN; i++)
		{
			if(nodes[i].data.object_type !== "supergene")
			{
				sg2en[nodes[i].data.label.toLowerCase()]++;
			}
		}

		for (i=0; i<noN; i++)
		{
			if(nodes[i].data.entrez_id === "") { continue; }
			
			if (sg2en[nodes[i].data.label.toLowerCase()] === 1)
			{
				var jj = $.inArray(nodes[i].data.label.toLowerCase(),moreAjaxNodes);
				if (jj !== -1) // Node in KUPKB expression data
				{
					currNode = nodes[i];
					if (moreseen[currNode.data.label.toLowerCase()].length > 1)
					{
						if (multicolor)
						{
							for (j=0; j<moreseen[currNode.data.label.toLowerCase()].length; j++)
							{
								k = j+1;
								cdata = {
											id: currNode.data.id + "_" + 10*k,
											label: newData[moreseen[currNode.data.label.toLowerCase()][j]].custom, // + " (" + k + ")",
											strength: newData[moreseen[currNode.data.label.toLowerCase()][j]].strength,
											expression: newData[moreseen[currNode.data.label.toLowerCase()][j]].expression,
											ratio: newData[moreseen[currNode.data.label.toLowerCase()][j]].ratio,
											pvalue: newData[moreseen[currNode.data.label.toLowerCase()][j]].pvalue,
											fdr: newData[moreseen[currNode.data.label.toLowerCase()][j]].fdr,
											entrez_id: ajaxNodes[jj],
											object_type: type,
											dataset_id: newData[moreseen[currNode.data.label.toLowerCase()][j]].dataset_id,
											parent: currNode.data.id
										};
								visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),cdata,true);
								bypass["nodes"][cdata.id] = visProps[moreseen[currNode.data.label.toLowerCase()][j]];
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
						visObject.updateData([currNode.data.id],newData[jj]);
						bypass[currNode.group][currNode.data.id] = visProps[jj];
					}
				}
			}
			else // Play with normal entrez ids
			{
				for (i=0; i<noN; i++)
				{
					var jj = $.inArray(nodes[i].data.entrez_id,ajaxNodes);
					if (jj !== -1) // Node in KUPKB expression data
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
												label: newData[seen[currNode.data.entrez_id][j]].custom, // + " (" + k + ")",
												strength: newData[seen[currNode.data.entrez_id][j]].strength,
												expression: newData[seen[currNode.data.entrez_id][j]].expression,
												ratio: newData[seen[currNode.data.entrez_id][j]].ratio,
												pvalue: newData[seen[currNode.data.entrez_id][j]].pvalue,
												fdr: newData[seen[currNode.data.entrez_id][j]].fdr,
												entrez_id: currNode.data.entrez_id,
												object_type: type,
												dataset_id: newData[seen[currNode.data.entrez_id][j]].dataset_id,
												parent: currNode.data.id
											};
									visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),cdata,true);
									//alert(visProps[moreseen[currNode.data.label.toLowerCase()][j]].color);
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
							visObject.updateData([currNode.data.id],newData[jj]);
							bypass[currNode.group][currNode.data.id] = visProps[jj];
						}
					}
				}
			}
		}
	}
	else
	{
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
										label: newData[seen[currNode.data.entrez_id][j]].custom, // + " (" + k + ")",
										strength: newData[seen[currNode.data.entrez_id][j]].strength,
										expression: newData[seen[currNode.data.entrez_id][j]].expression,
										ratio: newData[seen[currNode.data.entrez_id][j]].ratio,
										pvalue: newData[seen[currNode.data.entrez_id][j]].pvalue,
										fdr: newData[seen[currNode.data.entrez_id][j]].fdr,
										entrez_id: currNode.data.entrez_id,
										object_type: type,
										dataset_id: newData[seen[currNode.data.entrez_id][j]].dataset_id,
										parent: currNode.data.id
									};
							visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),cdata,true);
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
	}

	setData("cytoscapeweb","bypass",bypass);
	visObject.visualStyleBypass(bypass);

	if (noPN > 0)
	{
		if ($("#ms_compound_radio").is(":checked"))
		{
			updateMultiSpeciesView("compound");
		}
		else if ($("#ms_merged_radio").is(":checked"))
		{
			updateMultiSpeciesView("merged");
		}
	}
}

// Damn dirty!!! Will not be used...
function byPassInitMiRNA()
{
	var visObject = getVisData("cytoscapeweb");
	var bypass = getData("cytoscapeweb","bypass");
	var nodes = visObject.nodes();
	var n = nodes.length;
	var i = 0;
	for (i=0; i<n; i++)
	{
		if (nodes[i].data.object_type === "mirna")
		{
			bypass["nodes"][nodes[i].data.id] = { color: "#F7F7F7", borderWidth: 1, borderColor: "#000000" };
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
	checked.inhibition = $("#inhibition_check").is(":checked") ? true : false;
	checked.go = $("#go_check").is(":checked") ? true : false;
	checked.kegg = $("#kegg_check").is(":checked") ? true : false;
	checked.mirna = $("#mirna_check").is(":checked") ? true : false;
	checked.superbinding = ($("#binding_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.superptmod = ($("#ptmod_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.superexpression = ($("#expression_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.superactivation = ($("#activation_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.superinhibition = ($("#inhibition_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.supergo = ($("#go_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.superkegg = ($("#kegg_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;
	checked.supermirna = ($("#mirna_check").is(":checked") && $("#ms_merged_radio").is(":checked")) ? true : false;

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
			case 'inhibition':
				if(checked.inhibition) { toFilter.push(edges[i].data.id); }
				break;
			case 'superbinding':
				if (checked.superbinding) { toFilter.push(edges[i].data.id); }
				break;
			case 'superptmod':
				if (checked.superptmod) { toFilter.push(edges[i].data.id); }
				break;
			case 'superexpression':
				if (checked.superexpression) { toFilter.push(edges[i].data.id); }
				break;
			case 'superactivation':
				if(checked.superactivation) { toFilter.push(edges[i].data.id); }
				break;
			case 'superinhibition':
				if(checked.superinhibition) { toFilter.push(edges[i].data.id); }
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
			case 'supergo':
				if(checked.supergo) { toFilter.push(edges[i].data.id); }
				break;
			case 'superkegg':
				if(checked.superkegg) { toFilter.push(edges[i].data.id); }
				break;
			case 'supermirna':
				if(checked.supermirna) { toFilter.push(edges[i].data.id); }
				break;
		}
	}
	
    //visObject.removeFilter("edges");
	visObject.filter("edges",toFilter,true);
	// Update several info regarding edges
	updateInfo();
	showLabels("edges");
}

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

function hideSomeNodes(someNodes)
{
    var visObject = getVisData('cytoscapeweb');
	var nodes = visObject.nodes();
	var toHide = [];
	var i = 0;
	var len = nodes.length;
	
	for (i=0; i<len; i++)
	{
		if ($.inArray(nodes[i].data.id,someNodes) === -1 && nodes[i].visible)
		{
			toHide.push(nodes[i].data.id);
		}
	}
	visObject.filter("nodes",toHide,true);
	updateInfo();
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
	var types;

	for (i=0; i<nodeLength; i++)
	{
		types = ["component","function","process","pathway","mirna","gene","supergene"];
		if ($.inArray(nodes[i].data.object_type,types) !== -1)
		{
			nids.push(nodes[i].data.id);
		}
	}
	// No need to remove go, kegg, mirna edges for neighbors, otherwise, they are removed automatically
	for (i=0; i<edgeLength; i++)
	{
		types = ["binding","ptmod","expression","activation","inhibition","superbinding",
				 "superptmod","superexpression","superactivation","superinhibition"];
		if ($.inArray(edges[i].data.interaction,types) !== -1)
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
	var isCompound = false;
	var visObject = getVisData("cytoscapeweb");
	if ($.isEmptyObject(visObject) || visObject === undefined || visObject === null)
	{
		modalAlert("No network has been initialized yet!");
		return;
	}
	var pNodes = visObject.parentNodes();
	if (pNodes.length > 0) { isCompound = true; }

	var layoutOpts = getData("cytoscapeweb","layout");
	//var layoutOpts = $("#cytoscapeweb").data("layout");
	switch(layopt)
	{
		case 'ForceDirected':
			if (isCompound)
			{
				updateLayout('CompoundSpringEmbedder');
				return;
			}
			theLayout =
			{
				gravitation: layoutOpts.ForceDirected.gravitation,
				mass: layoutOpts.ForceDirected.node_mass,
				tension: layoutOpts.ForceDirected.edge_tension
			};
			visObject.layout({ name: 'ForceDirected', options: theLayout });
			break;
		case 'Circle':
			if (isCompound)
			{
				modalAlert("Compound nodes detected! Please use Compound or Default layout for best network view.");
				return;
			}
			theLayout =
			{
				angleWidth: layoutOpts.Circle.angle_width,
				tree: layoutOpts.Circle.tree_structure
			};
			visObject.layout({ name: 'Circle', options: theLayout });
			break;
		case 'Radial':
			if (isCompound)
			{
				modalAlert("Compound nodes detected! Please use Compound or Default layout for best network view.");
				return;
			}
			theLayout =
			{
				angleWidth: layoutOpts.Radial.angle_width,
				radius: layoutOpts.Radial.radius
			};
			visObject.layout({ name: 'Radial', options: theLayout });
			break;
		case 'Tree':
			if (isCompound)
			{
				modalAlert("Compound nodes detected! Please use Compound or Default layout for best network view.");
				return;
			}
			theLayout =
			{
				orientation: layoutOpts.Tree.orientation,
				depthSpace: layoutOpts.Tree.depth,
				breadthSpace: layoutOpts.Tree.breadth
			};
			visObject.layout({ name: 'Radial', options: theLayout });
			break;
		case 'CompoundSpringEmbedder':
			if (!isCompound)
			{
				modalAlert("Did not detect nodes! Please use Default, Radial, Tree or Pizza layout for best network view.");
				return;
			}
			theLayout =
			{
				tension: layoutOpts.CompoundSpringEmbedder.edge_tension,
				gravitation: layoutOpts.CompoundSpringEmbedder.gravitation,
				centralGravitation: layoutOpts.CompoundSpringEmbedder.central_gravitation,
				centralGravityDistance: layoutOpts.CompoundSpringEmbedder.central_gravity_distance,
				compoundCentralGravitation: layoutOpts.CompoundSpringEmbedder.compound_central_gravitation,
				compoundCentralGravityDistance: layoutOpts.CompoundSpringEmbedder.compound_central_gravity_distance,
			};
			visObject.layout({ name: 'CompoundSpringEmbedder', options: theLayout });
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
		case 'arena':
			theModel = visObject.networkModel();	
			theBypass = visObject.visualStyleBypass();
			//theBypass = $("#cytoscapeweb").data("bypass");
			text = arena3d(theModel.data,theBypass.nodes);
			$("#infoContainer").text(text);
			export2arena(text);
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

	if (staticData['object_type'] === "supergene")
	{
		nodeData.label = "Gene symbol: <a class=\"infolink\" href=\"http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + staticData['label'] + "\" target=\"_blank\">" + staticData['label'] + "</a><br/>";
		msg = "<span style=\"color:#000000; font-weight:bold\">Supergene data</span><br/>" + nodeData.label
		return(msg);
	}

	nodeData.id = "Ensembl protein: <span style=\"color:#FF0000\">" + staticData['id'] + "</span><br/>";
	nodeData.label = "Gene symbol: <a class=\"infolink\" href=\"http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + staticData['label'] + "\" target=\"_blank\">" + staticData['label'] + "</a><br/>";
	nodeData.entrez = "Entrez ID: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/gene?term=" + staticData['entrez_id'] + "\" target=\"_blank\">" + staticData['entrez_id'] + "</a><br/>";
	nodeData.strength = staticData['strength']==="" ? "" : "Expression strength: <span style=\"color:#FF0000\">" + staticData['strength'] + "</span><br/>";
	nodeData.expression = staticData['expression']==="" ? "" : "Differential expression: <span style=\"color:#FF0000\">" + staticData['expression'] + "</span><br/>";
	nodeData.ratio = (staticData['ratio']===999 || staticData['ratio']===null) ? "" : "Fold change: <span style=\"color:#FF0000\">" + staticData['ratio'] + "</span><br/>";
	nodeData.pvalue = (staticData['pvalue']===999 || staticData['pvalue']===null) ? "" : "p-value: <span style=\"color:#FF0000\">" + Math.pow(10,-staticData['pvalue']) + "</span><br/>";
	nodeData.fdr = (staticData['fdr']===999 || staticData['fdr']===null) ? "" : "FDR: <span style=\"color:#FF0000\">" + staticData['fdr'] + "</span><br/>";
	if (staticData['strength']==="" && staticData['expression']==="" && (staticData['ratio']===999 || staticData['ratio']===null) && (staticData['pvalue']===999 || staticData['pvalue']===null) && (staticData['fdr']===999 || staticData['fdr']===null))
	{
		nodeData.dataset = "";
	}
	else if (staticData['strength']==="Multiple" || staticData['expression']==="Multiple")
	{
		nodeData.dataset = "";
	}
	else
	{
		nodeData.dataset = "Experiment description: <a id=\"show_dataset\" class=\"infolink\" onclick=\"createDatasetDescription('" + staticData['dataset_id'] + "','page')\" onmouseover = \"createDatasetDescription('" + staticData['dataset_id'] + "','popup')\">here</a><br/>" +
						   "<script>$(\"#show_dataset\").tooltip({tip:\".tooltip-dataset\",effect:\"fade\"}).dynamic();</script>";
	}
	

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
		  nodeData.dataset +
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
	if (staticData['strength']==="" && staticData['expression']==="" && (staticData['ratio']===999 || staticData['ratio']===null) && (staticData['pvalue']===999 || staticData['pvalue']===null) && (staticData['fdr']===999 || staticData['fdr']===null))
	{
		nodeData.dataset = "";
	}
	else
	{
		nodeData.dataset = "Experiment description: <a id=\"show_dataset\" class=\"infolink\" onclick=\"createDatasetDescription('" + staticData['dataset_id'] + "','page')\" onmouseover = \"createDatasetDescription('" + staticData['dataset_id'] + "','popup')\">here</a><br/>" +
						   "<script>$(\"#show_dataset\").tooltip({tip:\".tooltip-dataset\",effect:\"fade\"}).dynamic();</script>";
	}

	if (nodeData.strength === '' && nodeData.expression === '' && nodeData.ratio === '' && nodeData.pvalue === '' && nodeData.fdr === '')
	{
		nodeData.label = "miRNA name: <span style=\"color:#FF0000\">" + staticData['label'] + "</span><br/>";
	}
	else { nodeData.label = ""; }
	
	if ($.isEmptyObject(ajaxData)) { /*Stub, we might add something in the future*/ }

	msg = "<span style=\"color:#000000; font-weight:bold\">miRNA data</span><br/>" +
		  nodeData.id + nodeData.label + nodeData.strength + nodeData.expression +
		  nodeData.ratio + nodeData.pvalue + nodeData.fdr + nodeData.dataset;

	return(msg);
}

function gimmeGene2GeneData(staticData,ajaxData)
{
	var msg;
	var edgeData = {};

	edgeData.interaction = "Interaction type: <span style=\"color:#FF0000\">" + staticData['interaction'] + "</span><br/>";
	if (staticData['interaction'].match(/^super/))
	{
		edgeData.score = "";
		edgeData.evidence = "Evidence: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=" +
			staticData['source'] + " AND " + staticData['target'] + "\" target=\"_blank\">Look in Pubmed</a><br/>";
	}
	else
	{
		if ($.isEmptyObject(ajaxData))
		{
			edgeData.score = "";
			edgeData.evidence = "No additional evidence found.";
		}
		else
		{
			edgeData.score = "Interaction score: <span style=\"color:#FF0000\">" + ajaxData['score']/1000 + "</span><br/>";
			edgeData.evidence = "Evidence: <a class=\"infolink\" href=\"http://www.ncbi.nlm.nih.gov/pubmed?term=" +
				ajaxData['source'] + " AND " + ajaxData['target'] + "\" target=\"_blank\">Look in Pubmed</a><br/>";
		}
	}

	msg = "<span style=\"color:#000000; font-weight:bold\">Edge data</span><br/>" +
		  edgeData.interaction + edgeData.score + edgeData.evidence;

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

function gimmeDatasetDescription(ajaxData,type)
{
	var html;
	var dataData = {};

	if (type === "page")
	{
		dataData.header =
			"<html>" +
			"<head>" +
			"<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">" + 
			"<link rel=\"icon\" href=\"../images/justkidney.ico\" type=\"image/x-icon\"/>" +
			"<link type=\"text/css\" rel=\"stylesheet\" href=\"css/dataset.css\"/>" +
			"<title\>Dataset information</title>" +
			"</head>" +
			"<body>";
		dataData.footer =
			/*"<br/><br/>" +
			"<div class=\"footer\"\>" +
			"<p class=\"disclaimer\">The Kidney and Urinary Pathway Knowledge Base has been developed in collaboration between the <a href=\"http://renalfibrosis.free.fr\" target=\"_blank\"\>Renal Fibrosis Laboratory\</a> at INSERM, France and the <a href=\"http://intranet.cs.man.ac.uk/bhig/\" target=\"_blank\">Bio-health Informatics Group\</a> at the University of Manchester, UK. This work has been funded by <a href=\"http://www.e-lico.eu\" target=\"_blank\"\>e-LICO project</a>, an EU-FP7 Collaborative Project (2009-2012) Theme ICT-4.4: Intelligent Content and Semantics.</p>" +
			"<div class=\"logos\">" +
			"<a href=\"http://renalfibrosis.free.fr\" target=\"_blank\"><img class=\"logo\" src=\"images/logorflab.jpg\" border=\"0\"\></a>" +
			"<a href=\"http://intranet.cs.man.ac.uk/bhig\" target=\"_blank\"><img class=\"logo\" src=\"images/BHIG.png\" border=\"0\"\></a>" +
			"<a href=\"http://www.inserm.fr\" target=\"_blank\"\><img class=\"logo\" style=\"width:180px;\" src=\"images/inserm-logo.png\" border=\"0\"\></a>" +
			"<a href=\"http://www.manchester.ac.uk\" target=\"_blank\"><img class=\"logo\" style=\"height:40px;\" src=\"images/logomanchester.gif\" border=\"0\"\></a>" +
			"<a href=\"http://www.e-lico.eu\" target=\"_blank\"><img class=\"logo\" style=\"width:40px;\" src=\"images/elico-logo.png\" border=\"0\"\></a>" +
			"</div>" +
			"</div>" +*/
			"</body>" +
			"</html>";
		dataData.title = "<h1 class=\"dataset\">" + ajaxData['display_name'] + "</h1>";
		dataData.condition1 =
			"<p><span class=\"section-d\">Condition 1</span><br/>" +
			"<table class=\"dataset\">" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Type</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['experiment_condition_0'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Biomaterial</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['biomaterial_0'] + "</td></tr>" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Disease</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['disease_0'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Severity</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['severity_0'] + "</td></tr>" +
			"</table></p>";
		dataData.condition2 =
			"<p><span class=\"section-d\">Condition 2</span><br/>" +
			"<table class=\"dataset\">" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold; font-weght:bold\">Type</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['experiment_condition_1'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Biomaterial</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['biomaterial_1'] + "</td></tr>" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Disease</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['disease_1'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Severity</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['severity_1'] + "</td></tr>" +
			"</table></p>";
		dataData.experimental =
			"<p><span class=\"section-d\">Experimental information</span><br/>" +
			"<table class=\"dataset\">" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Species</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['species'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Assay</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['experiment_assay'] + "</td></tr>" +
			"</table></p>";
		dataData.external =
			"<p><span class=\"section-d\">External references</span><br/>" +
			"<table class=\"dataset\">" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Pubmed ID</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['pmid'] + "</td></tr>" +
			"<tr class=\"even\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">Link</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['external_link'] + "</td></tr>" +
			"<tr class=\"odd\"><td class=\"dataset\" style=\"width:30%; font-weight:bold\">GEO accession</td><td class=\"dataset\" style=\"width:70%\">" + ajaxData['geo_acc'] + "</td></tr>" +
			"</table></p>";
		dataData.summary =
			"<p style=\"width:60%\"><span class=\"section-d\">Summary</span><br/>" + ajaxData['experiment_description'] + "</p>";
	}
	else
	{
		dataData.header = "";
		dataData.footer = "";
		dataData.title = "<span style=\"color:#434343; font-weight:bold; font-size:1em;\">" + ajaxData['display_name'] + "</span>";
		dataData.condition1 =
			"<p><span class=\"section-p\">Condition 1</span>" +
			"<table class=\"popup\">" +
			"<tr><td class=\"popup\" style=\"width:40%\">Type</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['experiment_condition_0'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Biomaterial</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['biomaterial_0'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Disease</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['disease_0'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Severity</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['severity_0'] + "</td></tr>" +
			"</table></p>";
		dataData.condition2 =
			"<p><span class=\"section-p\">Condition 2</span>" +
			"<table class=\"popup\">" +
			"<tr><td class=\"popup\" style=\"width:40%\">Type</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['experiment_condition_1'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Biomaterial</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['biomaterial_1'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Disease</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['disease_1'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Severity</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['severity_1'] + "</td></tr>" +
			"</table></p>";
		dataData.experimental =
			"<p><span class=\"section-p\">Experimental information</span>" +
			"<table class=\"popup\">" +
			"<tr><td class=\"popup\" style=\"width:40%\">Species</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['species'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Assay</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['experiment_assay'] + "</td></tr>" +
			"</table></p>";
		dataData.external =
			"<p><span class=\"section-p\">External references</span>" +
			"<table class=\"popup\">" +
			"<tr><td class=\"popup\" style=\"width:40%\">Pubmed ID</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['pmid'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">Link</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['external_link'] + "</td></tr>" +
			"<tr><td class=\"popup\" style=\"width:40%\">GEO accession</td><td class=\"popup\" style=\"width:60%\">" + ajaxData['geo_acc'] + "</td></tr>" +
			"</table></p>";
		dataData.summary =
			"<p style=\"width:95%\"><span class=\"section-p\">Summary</span><span style=\"font-size:0.9em\">" + ajaxData['experiment_description'] + "</span></p>";
	}

	html = dataData.header + dataData.title + dataData.condition1 + dataData.condition2 + dataData.experimental + dataData.external + dataData.summary + dataData.footer;
	return(html);
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
	if ($("#species_list option:selected").length > 1)
	{
		if ($("#ms_compound_radio").is(":checked"))
		{
			updateMultiSpeciesView("compound");
		}
		else if ($("#ms_merged_radio").is(":checked"))
		{
			updateMultiSpeciesView("merged");
		}
	}
	else
	{
		visObject.removeFilter();
		filterEdges();
	}
	updateInfo();
}

function hideElements(group,action)
{
	var vis = getVisData('cytoscapeweb');
	var selElems = vis.selected(group);
	var selElemIDs = [];
	var toHide = [];
	var i, allElems;
	var isMulti = $("#species_list option:selected").length > 1 ? true : false;
	var isCompound = $("#ms_compound_radio").is(":checked") ? true : false;

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
		if (group === "nodes")
		{
			if (isMulti && !isCompound) { updateMultiSpeciesView("merged",selElemIDs); }
			else { vis.filter(group,toHide); }
		}
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

		// Now we have to re-fill all the lists (arrghhh!...)
		if (group === "nodes")
		{
			var entrezID = [];
			remnodes = vis.nodes();
			for (i=0; i<remnodes.length; i++)
			{
				entrezID.push(remnodes[i].data.entrez_id);
			}
			search(entrezID);
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

function hexToRgb(hex)
{
	if (hex[0]=="#") hex=hex.substr(1);
	if (hex.length==3)
	{
		var temp=hex; hex='';
		temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
		for (var i=0;i<3;i++) hex+=temp[i]+temp[i];
	}
	var triplets = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex).slice(1);
	return({ red: parseInt(triplets[0],16), green: parseInt(triplets[1],16), blue: parseInt(triplets[2],16) });
}

function hexToRgbNorm(hex)
{
	rgb = hexToRgb(hex);
	color = [rgb.red/255, rgb.green/255, rgb.blue/255];
	return(color.join(","));
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
	var j = 0;
	//var bypass = { nodes: { }, edges: { } };
	var redata = { strength: "", expression: "", ratio: 999, pvalue: 999, fdr: 999 };
	var pNodes = [];
	var cNodes = [];
	var cNodesID = [];

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
					// Something special should be done here for supergenes
					if (pNodes[i].data.object_type === "supergene" && $("#ms_merged_radio").is(":checked"))
					{
						cNodes = visObject.childNodes(pNodes[i]);
						for (j=0; j<cNodes.length; j++)
						{
							cNodesID.push(cNodes[j].data.id);
						}
						hideSomeNodes(cNodesID);
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
					bypass["nodes"][nodes[i].data.id] = { color: "#FBEFFB", borderWidth: 1, borderColor: "#000000" };
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
			if ($("#species_list option:selected").length > 1)
			{
				if ($("#ms_compound_radio").is(":checked"))
				{
					updateMultiSpeciesView("compound");
				}
				else if ($("#ms_merged_radio").is(":checked"))
				{
					updateMultiSpeciesView("merged");
				}					
			}
			else
			{	
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

function updateMultiSpeciesView(type,xNodes)
{
	if ($("#species_list option:selected").length > 1) { // Otherwise we waste computer power

	var visObject = getVisData("cytoscapeweb");
	var bypass = getData("cytoscapeweb","bypass");
	var multicolor = $("#multicolor_gene_check").is(":checked") ? true : false;
	var byp = false;
	var i, j, k;
	if (xNodes == undefined) { xNodes = []; }

	switch(type)
	{
		case 'compound':
			if ($("#species_list option:selected").length > 1)
			{
				// Deal with edges
				var edgesToHide = [];
				visObject.removeFilter();
				filterEdges();
				var edges = visObject.edges();
				for (i=0; i<edges.length; i++)
				{
					if (edges[i].data.interaction.match(/^super/))
					{
						edgesToHide.push(edges[i].data.id);
					}
				}
				hideSomeEdges(edgesToHide);

				// Deal with nodes and various possible click sequences among Allow multiple node coloring
				// and Multiple species representation of nodes and edges
				var pC, theHack;
				var aHack = [];
				var allNodes = getAllNodeID();
				var pNodes = visObject.parentNodes();
				for (i=0; i<pNodes.length; i++)
				{
					if (pNodes[i].data.object_type === "supergene")
					{
						byp = true;
						bypass["nodes"][pNodes[i].data.id] = { compoundColor: "#E0E0E0", compoundBorderWidth: 1, compoundBorderColor: "#666666" };

						// We must restore internal parent nodes in case of colored datasets
						pC = visObject.childNodes(pNodes[i]);
						if (multicolor)
						{
							var done = false;
							for (j=0; j<pC.length; j++)
							{
								if ((pC[j].data.expression !== "" || pC[j].data.strength !== "" || pC[j].data.ratio !== 999) &&
									(pC[j].data.expression !== "Multiple" || pC[j].data.strength !== "Multiple") &&
									(pC[j].data.id.match(/_\d{1,3}$/))) // Stinks from Toulouse as far as to NY!...
								{
									visObject.removeElements([pC[j].data.id],true);
									pC[j].data.parent = pC[j].data.custom; // Restore the original parent
									if ($.inArray(pC[j].data.id,allNodes === -1))
									{
										visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),pC[j].data,true);
									}
									done = true;
								} // Called from Multiple species represenation of nodes and edges
								else if (pC[j].data.expression === "Multiple" && pC[j].data.strength === "Multiple" && !done)
								{
									theHack = getData("cytoscapeweb","userdata");
									for (k=0; k<theHack.length; k++)
									{
										if ($.inArray(theHack[k].id,allNodes === -1))
										{
											visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),theHack[k],true);
										}
									}
									bypass["nodes"][pC[j].data.id] = { compoundColor: "#7A7A7A", compoundBorderWidth: 5, compoundBorderColor: "#ECBD00", compoundLabelFontColor: "#0000FF", compoundLabelFontWeight: "bold", compoundOpacity: 0.5 };
								} // Called from Allow multiple disease selection
							}
						}
						else
						{
							for (j=0; j<pC.length; j++)
							{								
								pCC = visObject.childNodes(pC[j]);
								for (k=0; k<pCC.length; k++)
								{
									if ((pCC[k].data.expression !== "" || pCC[k].data.strength !== "" || pCC[k].data.ratio !== 999) &&
										(pCC[k].data.expression !== "Multiple" || pCC[k].data.strength !== "Multiple") &&
										(pCC[k].data.id.match(/_\d{1,3}$/))) // Stinks from Toulouse as far as to NY!...
									{
										byp = true;
										bypass["nodes"][pC[j].data.id] = { color: "#2B2B2B", borderWidth: 5, borderColor: "#ECBD00", labelFontColor: "#FFFFFF" };
										visObject.removeElements([pCC[k].data.id],true);
										pCC[k].data.custom = pCC[k].data.parent; // Save the original parent for restore
										aHack.push(pCC[k].data);
									}
								}
							}
							setData("cytoscapeweb","userdata",aHack);
						}
					}
				}
				
				recalculateLayout("CompoundSpringEmbedder");
			}
			break;
		case 'merged':
			if ($("#species_list option:selected").length > 1)
			{
				var nodesToKeep = [];
				var pC, pCC;
				var hasColoredDatasets = false;
				var nodes = visObject.nodes();
				visObject.removeFilter("edges");
				for (i=0; i<nodes.length; i++)
				{
					if (nodes[i].data.parent == undefined)
					{
						nodesToKeep.push(nodes[i].data.id);
						pC = visObject.childNodes(nodes[i]);
						if (pC.length > 0)
						{
							for (j=0; j<pC.length; j++)
							{
								if ((pC[j].data.expression !== "" || pC[j].data.strength !== "" || pC[j].data.ratio !== 999) &&
									(pC[j].data.expression !== "Multiple" || pC[j].data.strength !== "Multiple")) // Stinks from Toulouse as far as to NY!...
								{ hasColoredDatasets = true; }

								pCC = visObject.childNodes(pC[j]);
								if (multicolor)
								{
									if (pCC.length > 0) // Colored datasets
									{
										hasColoredDatasets = true;
										for (k=0; k<pCC.length; k++)
										{
											nodesToKeep.push(pCC[k].data.id);
											visObject.removeElements([pCC[k].data.id],true);
											pCC[k].data.custom = pCC[k].data.parent; // Save the original parent for restore
											pCC[k].data.parent = nodes[i].data.id;
											visObject.addNode(randomFromTo(300,400),randomFromTo(300,400),pCC[k].data,true);
										}
									}
									if (pC[j].data.expression !== "" || pC[j].data.strength !== "" || pC[j].data.ratio !== 999)
									{
										nodesToKeep.push(pC[j].data.id);
										byp = true;
										bypass["nodes"][nodes[i].data.id] = { compoundColor: "#E0E0E0", compoundBorderWidth: 1, compoundBorderColor: "#666666" };;
									}
								}
								else
								{
									if (pC[j].data.strength !== ""  || pC[j].data.expression !== "" || pC[j].data.ratio !== 999)
									{
										byp = true;
										bypass["nodes"][nodes[i].data.id] = { compoundColor: "#2B2B2B", compoundBorderWidth: 5, compoundBorderColor: "#ECBD00", compoundLabelFontColor: "#000000" };
									}
								}
							}
						}
					}
					else
					{
						if (nodes[i].data.strength === "Multiple"  || nodes[i].data.expression === "Multiple")
						{
							xNodes.push(nodes[i].data.id);
						}
					}
				}
				if (xNodes.length > 0)
				{
					for (i=0; i<xNodes.length; i++)
					{
						var ii = $.inArray(xNodes[i],nodesToKeep);
						if (ii !== -1)
						{
							nodesToKeep.splice(ii,1);
						}
					}
				}
				visObject.filter("nodes",nodesToKeep);
				filterEdges();

				if (hasColoredDatasets)
				{
					var edgesToHide = [];
					var edges = visObject.edges();
					for (i=0; i<edges.length; i++)
					{
						if (!edges[i].data.interaction.match(/^super/))
						{
							edgesToHide.push(edges[i].data.id);
						}
					}
					hideSomeEdges(edgesToHide);
				}
				
				if (visObject.parentNodes().length > 0)
				{
					recalculateLayout("CompoundSpringEmbedder");
				}
				else
				{
					recalculateLayout("ForceDirected");
				}
			}
			break;
	} }

	if (byp) { visObject.visualStyleBypass(bypass); }
}

function recalculateLayout(layout)
{
	var visObject = getVisData("cytoscapeweb");
	var layO = getData("cytoscapeweb","layout");

	switch (layout)
	{
		case 'ForceDirected':
			theLayO =
			{
				gravitation: layO.ForceDirected.gravitation,
				mass: layO.ForceDirected.node_mass,
				tension: layO.ForceDirected.edge_tension
			};
			visObject.layout({ name: 'ForceDirected', options: theLayO });
			break;
		case 'CompoundSpringEmbedder':
			theLayO =
			{
				tension: layO.CompoundSpringEmbedder.edge_tension,
				gravitation: layO.CompoundSpringEmbedder.gravitation,
				centralGravitation: layO.CompoundSpringEmbedder.central_gravitation,
				centralGravityDistance: layO.CompoundSpringEmbedder.central_gravity_distance,
				compoundCentralGravitation: layO.CompoundSpringEmbedder.compound_central_gravitation,
				compoundCentralGravityDistance: layO.CompoundSpringEmbedder.compound_central_gravity_distance,
			};
			visObject.layout({ name: 'CompoundSpringEmbedder', options: theLayO });
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
		compoundShape: "ELLIPSE",
		borderWidth: 1,
		borderColor: "#000000",
		size: "auto",
		color:
		{
			defaultValue: "#F7F7F7",
			discreteMapper: nodeMapper.metaMapper
		},
		compoundColor: "E0E0E0",
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
		compoundLabelFontWeight: "bold",
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
		},
		targetArrowShape:
		{
			defaultValue: "NONE",
			discreteMapper: edgeMapper.arrowMapper
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
				{ attrValue: "supergene", value: "ELLIPSE" },
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
				{ attrValue: "supergene", value: "#FFFCEB" },
				{ attrValue: "component", value: "#A468D5" },
				{ attrValue: "function", value: "#BFA630" },
				{ attrValue: "process", value: "#6E86D6" },
				{ attrValue: "pathway", value: "#700900" },
				{ attrValue: "mirna", value: "#FBEFFB" }
			]
		},
		fontWeightMapper:
		{
			attrName: "object_type",
			entries:
			[
				{ attrValue: "gene", value: "normal" },
				{ attrValue: "supergene", value: "bold" },
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
                { attrValue: "supergene", value: "#000000" },
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
				{ attrValue: "expression", value: "#9BA402" },
				{ attrValue: "activation", value: "#00A300" },
				{ attrValue: "inhibition", value: "#EE0000" },
				{ attrValue: "superbinding", value: "#028E9B" },
				{ attrValue: "superptmod", value: "#133CAC" },
				{ attrValue: "superexpression", value: "#9BA402" },
				{ attrValue: "superactivation", value: "#00A300" },
				{ attrValue: "superinhibition", value: "#EE0000" },
				{ attrValue: "go", value: "#FFAD00" },
				{ attrValue: "kegg", value: "#D30068" },
				{ attrValue: "mirna", value: "#FBB0FF" },
				{ attrValue: "supergo", value: "#FFAD00" },
				{ attrValue: "superkegg", value: "#D30068" },
				{ attrValue: "supermirna", value: "#FBB0FF" }
			]
		},
		arrowMapper:
		{
			attrName: "interaction",
			entries:
			[
				{ attrValue: "binding", value: "NONE" },
				{ attrValue: "expression", value: "CIRCLE" },
				{ attrValue: "activation", value: "ARROW" },
				{ attrValue: "inhibition", value: "T" },
				{ attrValue: "superbinding", value: "NONE" },
				{ attrValue: "superexpression", value: "CIRCLE" },
				{ attrValue: "superactivation", value: "ARROW" },
				{ attrValue: "superinhibition", value: "T" }
			]
		},
		widthMapper:
		{
			attrName: "interaction",
			entries:
			[
				{ attrValue: "superbinding", value: 2 },
				{ attrValue: "superptmod", value: 2 },
				{ attrValue: "superexpression", value: 2 },
				{ attrValue: "superactivation", value: 2 },
				{ attrValue: "superinhibition", value: 2 },
				{ attrValue: "go", value: 3 },
				{ attrValue: "kegg", value: 3 },
				{ attrValue: "mirna", value: 3 },
				{ attrValue: "supergo", value: 3 },
				{ attrValue: "superkegg", value: 3 },
				{ attrValue: "supermirna", value: 3 }
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
		},
		CompoundSpringEmbedder:
		{
			gravitation: -50,
			central_gravitation: 50,
			central_gravity_distance: 50,
			compound_central_gravitation: 100,
			compound_central_gravity_distance: 5,
			edge_tension: 50
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

function getAllNodeID()
{
	visObject = getVisData("cytoscapeweb");
	var nodes = visObject.nodes();
	var nodeID = [];
	for (i=0; i<nodes.length; i++)
	{
		nodeID.push(nodes[i].data.id);
	}
	return(nodeID);
}

function arena3d(model,bypass)
{
	theLayers = { gene: [], pathway: [], mirna: [], go: [], supergene: [] };
	connections = [];
	hasBypass = $.isEmptyObject(bypass) ? false : true;

	nodes = model.nodes;
	for (i=0; i<nodes.length; i++)
	{
		if (nodes[i].id.search("_") !== -1) continue;
		switch(nodes[i].object_type)
		{
			case 'gene':
				//color = hasBypass ? hexToRgbNorm(bypass[nodes[i]].color) : hexToRgbNorm("#f7f7f7");
				theLayers['gene'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://www.ncbi.nlm.nih.gov/gene?term=" + nodes[i].entrez_id, color: hexToRgbNorm("#f7f7f7") });
				break;
			case 'pathway':
				theLayers['pathway'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://www.genome.jp/dbget-bin/www_bget?pathway:" + nodes[i].id, color: "0.44,0.04,0" });
				break;
			case 'mirna':
				theLayers['mirna'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://www.mirbase.org/cgi-bin/mirna_entry.pl?acc=" + nodes[i].id, color: "0.98,0.94,0.98" });
				break;
			case 'component':
				theLayers['go'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=" + nodes[i].id, color: "0.64,0.41,0.84" });
				break;
			case 'function':
				theLayers['go'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=" + nodes[i].id, color: "0.75,0.65,0.19" });
				break;
			case 'process':
				theLayers['go'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=" + nodes[i].id, color: "0.43,0.53,0.84" });
				break;
			case 'supergene':
				theLayers['gene'].push({ ID: nodes[i].id, SYNONYMS: nodes[i].entrez_id, DESCRIPTION: nodes[i].label,
					URL: "http://www.ncbi.nlm.nih.gov/gene?term=" + nodes[i].entrez_id, color: "1.0,0.99,0.92" });
				break;
		}
	}

	edges = model.edges
	for (i=0; i<edges.length; i++)
	{
		switch(edges[i].interaction)
		{
			case 'binding':
				connections.push({ source_node: edges[i].source, source_type: "gene",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'ptmod':
				connections.push({ source_node: edges[i].source, source_type: "gene",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'expression':
				connections.push({ source_node: edges[i].source, source_type: "gene",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'activation':
				connections.push({ source_node: edges[i].source, source_type: "gene",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'inhibition':
				connections.push({ source_node: edges[i].source, source_type: "gene",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'superbinding':
				connections.push({ source_node: edges[i].source, source_type: "supergene",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'superptmod':
				connections.push({ source_node: edges[i].source, source_type: "supergene",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'superexpression':
				connections.push({ source_node: edges[i].source, source_type: "supergene",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'superactivation':
				connections.push({ source_node: edges[i].source, source_type: "supergene",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'superinhibition':
				connections.push({ source_node: edges[i].source, source_type: "supergene",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'go':
				connections.push({ source_node: edges[i].source, source_type: "go",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'kegg':
				connections.push({ source_node: edges[i].source, source_type: "pathway",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'mirna':
				connections.push({ source_node: edges[i].source, source_type: "mirna",
					target_node: edges[i].target, target_type: "gene"});
				break;
			case 'supergo':
				connections.push({ source_node: edges[i].source, source_type: "go",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'superkegg':
				connections.push({ source_node: edges[i].source, source_type: "pathway",
					target_node: edges[i].target, target_type: "supergene"});
				break;
			case 'supermirna':
				connections.push({ source_node: edges[i].source, source_type: "mirna",
					target_node: edges[i].target, target_type: "supergene"});
				break;
		}
	}
	
	nLayers = 0;
	hasGene = hasPathway = hasGo = hasMirna = hasSupergene = false;
	if (theLayers['gene'].length > 0) { nLayers++; hasGene = true; };
	if (theLayers['pathway'].length > 0) { nLayers++; hasPathway = true; };
	if (theLayers['go'].length > 0) { nLayers++; hasGo = true; };
	if (theLayers['mirna'].length > 0) { nLayers++; hasMirna = true; };
	if (theLayers['supergene'].length > 0) { nLayers++; hasSupergene = true; };
	
	arena = "number_of_layers::" + nLayers + "\n";

	if (hasGene)
	{
		arena += "\nlayer::gene\n\n";
		theGenes = theLayers['gene'];
		for (i=0; i<theGenes.length; i++)
		{
			arena += theGenes[i].ID + "\tSYNONYMS::" + theGenes[i].SYNONYMS + "\tDESCRIPTION::" + theGenes[i].DESCRIPTION +
				"\tURL::" + theGenes[i].URL + "\tcolor::" + theGenes[i].color + "\n";
		}
	}
	if (hasPathway)
	{
		arena += "\nlayer::pathway\n\n";
		thePathways = theLayers['pathway'];
		for (i=0; i<thePathways.length; i++)
		{
			arena += thePathways[i].ID + "\tSYNONYMS::" + thePathways[i].SYNONYMS + "\tDESCRIPTION::" + thePathways[i].DESCRIPTION +
				"\tURL::" + thePathways[i].URL + "\tcolor::" + thePathways[i].color + "\n";
		}
	}
	if (hasGo)
	{
		arena += "\nlayer::go\n\n";
		theGos = theLayers['go'];
		for (i=0; i<theGos.length; i++)
		{
			arena += theGos[i].ID + "\tSYNONYMS::" + theGos[i].SYNONYMS + "\tDESCRIPTION::" + theGos[i].DESCRIPTION +
				"\tURL::" + theGos[i].URL + "\tcolor::" + theGos[i].color + "\n";
		}
	}
	if (hasMirna)
	{
		arena += "\nlayer::mirna\n\n";
		theMirnas = theLayers['mirna'];
		for (i=0; i<theMirnas.length; i++)
		{
			arena += theMirnas[i].ID + "\tSYNONYMS::" + theMirnas[i].SYNONYMS + "\tDESCRIPTION::" + theMirnas[i].DESCRIPTION +
				"\tURL::" + theMirnas[i].URL + "\tcolor::" + theMirnas[i].color + "\n";
		}
	}
	if (hasSupergene)
	{
		arena += "\nlayer::supergene\n\n";
		theSupergenes = theLayers['supergene'];
		for (i=0; i<theSupergenes.length; i++)
		{
			arena += theSupergenes[i].ID + "\tSYNONYMS::" + theSupergenes[i].SYNONYMS + "\tDESCRIPTION::" + theSupergenes[i].DESCRIPTION +
				"\tURL::" + theSupergenes[i].URL + "\tcolor::" + theSupergenes[i].color + "\n";
		}
	}

	arena += "\nend_of_layers_inputs\n\nstart_connections\n\n";

	for (i=0; i<connections.length; i++)
	{
		arena += connections[i].source_node + "::" + connections[i].source_type + "\t" +
			connections[i].target_node + "::" + connections[i].target_type + "\t1\n";
	}
	arena += "\nend_connections\n";
	
	return(arena);
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

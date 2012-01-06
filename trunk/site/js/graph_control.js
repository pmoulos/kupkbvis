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

function changeVisualStyle(style,property,value)
{
	// Here we change properties in the json object
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
				{ attrValue: "pathway", value: "#BFA630" },
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
			removeElements(toRemove);
			break;

		case 'kegg':
			switch(howmany)
			{
				case 'selected':
					break;
				case 'all':
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
		if ($.inArray(nodes[i].data.object_type,["component","function","process","pathway","mirna"]) !== -1)
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

	visObject.removeElements(elems);
	visObject.addElements(elems,true);
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

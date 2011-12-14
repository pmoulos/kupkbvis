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
		color: "#F7F7F7",
		// size and color will be passed to bypasser as we initialize colorless
		/*size:
		{
			defaultValue: "auto",
			continuousMapper: nodeMapper.pvalueMapper
		},
		color:
		{
		//	defaultValue: "#F7F7F7",
		//	continuousMapper: nodeMapper.ratioMapper
		},*/
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
				{ attrValue: "goterm", value: "ROUNDRECT" },
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
		goMapper:
		{
			attrName: "go",
			entries:
			[
				{ attrValue: "Component", value: "#A468D5" },
				{ attrValue: "Function", value: "#BFA630" },
				{ attrValue: "Unmodified", value: "#6E86D6" }
			]
		},
		keggMapper:
		{
			attrName: "kegg",
			entries:
			[
				{ attrValue: "KEGG", value: "#FFC973" }
			]
		},
		fontWeightMapper:
		{
			attrName: "object_type",
			entries:
			[
				{ attrValue: "gene", value: "normal" },
				{ attrValue: "goterm", value: "bold" },
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
				{ attrValue: "go", value: "#FFC000" },
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
function filterEdges(caller)
{
	visObject = getVisData('cytoscapeweb');
	//visObject.filter("edges",filterEdgeCallback(type,status),true);
	visObject.filter("edges",function(caller)
	{
		var outcome;	
		switch(caller)
		{
			case 'binding_check':
				outcome = $('#binding_check').is(':checked') ? true : false;
				break;
			case 'ptmod_check':
				outcome = $('#ptmod_check').is(':checked') ? true : false;
				break;
			case 'expression_check':
				outcome = $('#expression_check').is(':checked') ? true : false;
				break;
			case 'activation_check':
				outcome = $('#activation_check').is(':checked') ? true : false;
				break;
		}
		return outcome;
	},
	true);
}

function getVisData(container)
{
	return($(container).data("visObject"));
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

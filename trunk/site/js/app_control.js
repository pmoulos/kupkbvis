function bindAutoComplete(id)
{
	var urlBase = initMe(); 
		
	$('#'+id)
		.bind("keydown",function(event)
		{			
			if (event.keyCode === $.ui.keyCode.TAB && $(this).data("autocomplete").menu.active ) 
			{ event.preventDefault(); }
		})
		.autocomplete(
		{		
			source: function(request,response)
			{
				var species = $("#species_list").val();	
				$.ajax(
				{
					type: 'POST',
					url: urlBase+'php/control.php',
					data: { suggest_term: extractLast(request.term), suggest_species: species },
					beforeSend: function() { $('#loadingCircle').show(); },
					complete: function() { $('#loadingCircle').hide(); },
					success: function(data)
					{						
						var sugs = [];
						for (var key in data)
						{
							sugs.push(data[key]);
						}					
						response(sugs);
					},
					error: function(data,error)
					{												
						displayError('Ooops! ' + error + ' ' + data.responseText);						
					},
					dataType: "json"
				});
			},
			search: function() 
			{
				// custom minLength
				var term = extractLast(this.value);
				if (term.length < 2) 
				{
					return false;
				}
			},
			focus: function() { return false; },
			select: function(event,ui)
			{
				var terms = split(this.value);
				terms.pop(); // remove the current input
				topush = truncOrg(ui.item.value);
				terms.push(topush); // add the selected item
				terms.push(""); // add placeholder to get the comma-and-space at the end
				this.value = terms.join("\n");
				return false;
			}
		});
}

/* In the first search we use jQuery .data function to store the initial search results in order to
   be able to use a reset button later, the same applies also to the update function with species */
function search()
{
	var urlBase = initMe(); 

	var species = $("#species_list").val();
	if (species == 999999) //Nothing selected
	{		
		displayError('Please select species first!');
		return;
	}
	if ($("#enter_genes").val() !== '')
	{
		var searchJSON = $.toJSON($("#enter_genes").val().split(/\n|\r/));
		$.ajax(
		{
			type: 'POST',
			url: urlBase+'php/control.php',
			data: { species: species, genes: searchJSON },
			beforeSend: function() { loadingSmall(); },
			complete: function() { unloadingSmall(); },
			success: function(data)
			{				
				if ($.isEmptyObject(data))
				{
					displayError('Sorry! Nothing found... :-(');
				}
				else //Enable and fill the rest of the lists
				{																						
					var outerkey,innerkey,innermost;					
					for (outerkey in data)
					{										
						switch(outerkey)
						{
							case 'disease':
								$("#disease_list").empty();
								if (data[outerkey] !== null)
								{
									$("#disease_list").removeData();									
									enable(['disease_list']);
									$("#disease_list").data("values",data[outerkey]); //Cache!	
									for (innerkey in data[outerkey])
									{
										$("#disease_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'location':
								$("#location_list").empty();
								if (data[outerkey] !== null)
								{
									$("#location_list").removeData();				
									enable(['location_list']);
									$("#location_list").data("values",data[outerkey]);					
									for (innerkey in data[outerkey])
									{
										$("#location_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'dataset':
								$("#dataset_list").empty();
								if (data[outerkey] !== null)
								{
									$("#dataset_list").removeData();
									enable(['dataset_list']);
									$("#dataset_list").data("values",data[outerkey]);				
									for (innerkey in data[outerkey])
									{
										$("#dataset_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'go':
								$("#go_list").empty();
								if (data[outerkey] !== null)
								{
									$("#go_list").removeData();
									enable(['go_list']);
									$("#go_list").data("values",data[outerkey]);
									//Initialize with component
									innerkey = 'Component';									
									for (innermost in data[outerkey][innerkey])
									{
										$("#go_list").append("<option title=\"" + data[outerkey][innerkey][innermost] + "\" value=" + innermost + ">" 
											+ data[outerkey][innerkey][innermost] + "</option>");
									}
									$("#go_component").css("background-color","#FFE5E0");
								}
								break;
							case 'kegg':
								$("#kegg_list").empty();
								if (data[outerkey] !== null)
								{
									$("#kegg_list").removeData();
									enable(['kegg_list']);
									$("#kegg_list").data("values",data[outerkey]);
									for (innerkey in data[outerkey])
									{									
                                        $("#kegg_list").append("<optgroup label=\"" + innerkey + "\">");
										for (innermost in data[outerkey][innerkey]) // Grouping!
										{
											$("#kegg_list").append("<option title=\"" + data[outerkey][innerkey][innermost] + "\" value=" + innermost + ">" 
												+ data[outerkey][innerkey][innermost] + "</option>");
										}
									}
								}
								break;
						}
					}
				}
			},
			error: function(data,error)
			{
				displayError('Ooops! ' + error + " " + data.responseText);						
			},
			dataType: "json"
		});

		fetchNetwork(); // Initiate the network
	}
}

function update(id)
{	
	var urlBase = initMe();
	
	var selSpecies,selDisease,selLocation,selDataset,selVal;
	var outerkey,innerkey,innermost;
	var genesQuery = $("#enter_genes").val();
	var searchJSON = $.toJSON($("#enter_genes").val().split(/\n|\r/));
	
	switch(id)
	{
		case 'species_list':
			if (genesQuery !== '') // If empty then we are at initialization phase 
			{
				selSpecies = $('#species_list').val();					
				$.ajax(
				{
					type: 'POST',
					url: urlBase+'php/control.php',
					data: { species: selSpecies, genes: searchJSON },
					beforeSend: function()
					{
						$("#filterCircle").show();
						loadingSmall();
					},
					complete: function()
					{
						$("#filterCircle").hide();
						unloadingSmall();
					},
					success: function(data)
					{				
						if ($.isEmptyObject(data))
						{
							displayError('Sorry! Nothing found... :-(');
						}
						else //Enable and fill the rest of the lists
						{																									
							for (outerkey in data)
							{										
								switch(outerkey)
								{
									case 'disease':
										$("#disease_list").empty();
										if (data[outerkey] !== null)
										{
											$("#disease_list").removeData();									
											enable(['disease_list']);
											$("#disease_list").data("values",data[outerkey]); //Cache!			
											for (innerkey in data[outerkey])
											{
												$("#disease_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'location':
										$("#location_list").empty();
										if (data[outerkey] !== null)
										{
											$("#location_list").removeData();				
											enable(['location_list']);
											$("#location_list").data("values",data[outerkey]); //Cache!					
											for (innerkey in data[outerkey])
											{
												$("#location_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'dataset':
										$("#dataset_list").empty();
										if (data[outerkey] !== null)
										{
											$("#dataset_list").removeData();
											enable(['dataset_list']);
											$("#dataset_list").data("values",data[outerkey]);				
											for (innerkey in data[outerkey])
											{
												$("#dataset_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'go':
										$("#go_list").empty();
										if (data[outerkey] !== null)
										{
											$("#go_list").removeData();
											enable(['go_list']);
											$("#go_list").data("values",data[outerkey]);	
											innerkey = 'Component';									
											for (innermost in data[outerkey][innerkey])
											{
												$("#go_list").append("<option title=\"" + data[outerkey][innerkey][innermost] + "\" value=" + innermost + ">" 
													+ data[outerkey][innerkey][innermost] + "</option>");
											}
											$("#go_component").css("background-color","#FFE5E0");
										}
										break;
									case 'kegg':
										$("#kegg_list").empty();
										if (data[outerkey] !== null)
										{
											$("#kegg_list").removeData();
											enable(['kegg_list']);		
											for (innerkey in data[outerkey])
											{
												$("#kegg_list").append("<optgroup label=" + innerkey + ">");
												for (innermost in data[outerkey][innerkey]) // Grouping!
												{
													$("#kegg_list").append("<option title=\"" + data[outerkey][innerkey][innermost] + "\" value=" + innermost + ">" 
														+ data[outerkey][innerkey][innermost] + "</option>");
												}
											}
											$("#kegg_list").data("values",data[outerkey]);
										}
										break;
								}
							}
						}
					},
					error: function(data,error)
					{
						displayError('Ooops! ' + error + " " + data.responseText);						
					},
					dataType: "json"
				});

				fetchNetwork(); // Re-initiate network
			}
			break;
			
		case 'disease_list':
			selVal = $('#disease_list').val();
			selDisease = $("#disease_list option[value="+selVal+"]").text();
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { disease: selDisease },
				beforeSend: function()
				{
					$("#filterCircle").show();
					disable(['disease_list','location_list','dataset_list','reset_data_button']); 
				},
				complete: function() 
				{ 
					$("#filterCircle").hide();
					enable(['disease_list']); 
				},
				success: function(data)
				{				
					if ($.isEmptyObject(data))
					{
						displayError('Sorry! Nothing found... :-(');
					}
					else //Enable and fill the rest of the lists
					{																																
						for (outerkey in data)
						{	
							switch(outerkey)
							{
								case 'location':
									$("#location_list").empty();
									if (data['location'] !== null)
									{								
										enable(['location_list']);				
										for (innerkey in data[outerkey])
										{
											$("#location_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
												+ data[outerkey][innerkey] + "</option>");
										}
									}
									break;
								case 'dataset':
									$("#dataset_list").empty();
									if (data['dataset'] !== null)
									{
										enable(['dataset_list']);					
										for (innerkey in data[outerkey])
										{
											$("#dataset_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
												+ data[outerkey][innerkey] + "</option>");
										}
									}
									break;
							}
						}
					}
				},
				error: function(data,error)
				{
					displayError('Ooops! ' + error + " " + data.responseText);						
				},
				dataType: "json"
			});
			enable(['reset_data_button']);
			break;
			
		case 'location_list':
			selVal = $('#location_list').val();
			selLocation = $("#location_list option[value="+selVal+"]").text();
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { location: selLocation },
				beforeSend: function()
				{
					$("#filterCircle").show();
					disable(['disease_list','location_list','dataset_list']); 
				},
				complete: function() 
				{ 
					$("#filterCircle").hide();
					enable(['location_list']); 
				},
				success: function(data)
				{				
					if ($.isEmptyObject(data))
					{
						displayError('Sorry! Nothing found... :-(');
					}
					else //Enable and fill the rest of the lists
					{																																
						for (outerkey in data)
						{	
							switch(outerkey)
							{
								case 'disease':
									$("#disease_list").empty();
									if (data[outerkey] !== null)
									{								
										enable(['disease_list']);				
										for (innerkey in data[outerkey])
										{
											$("#disease_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
												+ data[outerkey][innerkey] + "</option>");
										}
									}
									break;
								case 'dataset':
									$("#dataset_list").empty();
									if (data[outerkey] !== null)
									{
										enable(['dataset_list']);					
										for (innerkey in data[outerkey])
										{
											$("#dataset_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
												+ data[outerkey][innerkey] + "</option>");
										}
									}
									break;
							}
						}
					}
				},
				error: function(data,error)
				{
					displayError('Ooops! ' + error + " " + data.responseText);						
				},
				dataType: "json"
			});
			enable(['reset_data_button']);
			break;

	}
}

function changeGOCategory(category)
{
	// Contains the object retrieved with AJAX and has Component, Function and Process
	var goData = $("#go_list").data("values");
	var cat,key;

	if (goData)
	{
		$("#go_list").empty();
		switch(category) // Is the cell ID in the corresponding part of the page
		{
			case 'go_component':	
				cat = 'Component';									
				for (key in goData[cat])
				{
					$("#go_list").append("<option title=\"" + goData[cat][key] + "\" value=" + key + ">" + goData[cat][key] + "</option>");
				}
				$("#go_component").css("background-color","#FFE5E0");
				$("#go_function").css("background-color","#FFFFFF");
				$("#go_process").css("background-color","#FFFFFF");
				break;
			case 'go_function':	
				cat = 'Function';									
				for (key in goData[cat])
				{
					$("#go_list").append("<option title=\"" + goData[cat][key] + "\" value=" + key + ">" + goData[cat][key] + "</option>");
				}
				$("#go_component").css("background-color","#FFFFFF");
				$("#go_function").css("background-color","#FFE5E0");
				$("#go_process").css("background-color","#FFFFFF");
				break;
			case 'go_process':	
				cat = 'Process';									
				for (key in goData[cat])
				{
					$("#go_list").append("<option title=\"" + goData[cat][key] + "\" value=" + key + ">" + goData[cat][key] + "</option>");
				}
				$("#go_component").css("background-color","#FFFFFF");
				$("#go_function").css("background-color","#FFFFFF");
				$("#go_process").css("background-color","#FFE5E0");
				break;
		}
	}
}

/* what: go, kegg, mirna
 * howmany: all, selected */
function showMeta(what,howmany)
{
	var urlBase = initMe();
	var toSend;

	switch(what)
	{
		case 'go':
			switch(howmany)
			{
				case 'selected':
					toSend = $.toJSON($("#go_list").val());
					break;
				case 'all':
					$("#go_list option").attr("selected","selected");
					toSend = $.toJSON($("#go_list").val());
					break;
			}
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { go: toSend },
				beforeSend: function() { $('#loadingCircle').show(); },
				complete: function() { $('#loadingCircle').hide(); },
				success: function(data)
				{						
					if ($.isEmptyObject(data))
					{
						displayError('Select one or more GO terms first!');
					}
					else
					{
						addElements(data);
					}
				},
				error: function(data,error)
				{												
					displayError('Ooops! ' + error + ' ' + data.responseText);						
				},
				dataType: "json"
			});
			break;

		case 'kegg':
            switch(howmany)
            {
                case 'selected':
                    toSend = $.toJSON($("#kegg_list").val());
                    break;
                case 'all':
                    $("#kegg_list option").attr("selected","selected");
                    toSend = $.toJSON($("#kegg_list").val());
                    break;
            }
            $.ajax(
            {
                type: 'POST',
                url: urlBase+'php/control.php',
                data: { kegg: toSend },
                beforeSend: function() { $('#loadingCircle').show(); },
                complete: function() { $('#loadingCircle').hide(); },
                success: function(data)
                {                        
                    if ($.isEmptyObject(data))
                    {
                        displayError('Select one or more KEGG pathways first!');
                    }
                    else
                    {
                        addElements(data);
                    }
                },
                error: function(data,error)
                {                                                
                    displayError('Ooops! ' + error + ' ' + data.responseText);                        
                },
                dataType: "json"
            });
			break;

		case 'mirna':
			break;
	}
}

function clearMeta(what,howmany,flag)
{
	// Move control to a function in graph_control.js
    switch(what)
    {
	    case "go":
            if (flag === "all")
	        {
		        removeMeta(what,howmany,flag);
	        }
	        else // selcat used only for GO terms
	        {
		        var selcat;
		        if ($("#go_component").css("background-color") === "rgb(255, 229, 224)")
		        {
			        selcat = "component";
		        }
		        else if ($("#go_function").css("background-color") === "rgb(255, 229, 224)")
		        {
			        selcat = "function";
		        }
		        else if ($("#go_process").css("background-color") === "rgb(255, 229, 224)")
		        {
			        selcat = "process";
		        }
                else { selcat = ""; }
		        removeMeta(what,howmany,selcat);
	        }
            break;
        
        case "kegg":
            removeMeta(what,howmany,'');
            break;
        
        case "mirna":
            break;
    }
}

function fetchNetwork()
{
	var urlBase = initMe();
	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { network: "network" }, //Some random word for posting...
		beforeSend: function()
		{
			$("#hello_kidney").empty(); // Remove the splash
			$("#loading_big").show();
			disable(['disease_list','location_list','dataset_list','reset_data_button','go_list','kegg_list','mirna_list']); 
		},
		complete: function() 
		{ 
			$("#loading_big").hide();
			enable(['disease_list','location_list','dataset_list','reset_data_button','go_list','kegg_list','mirna_list']);
		},
		success: function(data)
		{
			if ($.isEmptyObject(data)) // In case the object is empty indeed
			{
				displayError('The network is empty... :-(');
			}
			else if (data.data.nodes[0] === undefined)
			{
				displayError('No interactions found! :-(');
				clearNetwork();
				$("#cytoscapeweb").html("<table class=\"innerTable\"><tr><td>" +
										"<div id=\"hello_kidney\"><img src=\"images/noInteractions.png\"/></div>" +
										"</td></tr></table>");
			}
			else
			{
				initNetwork(data);
				enable(['binding_check','ptmod_check','expression_check','activation_check',
						'go_check','kegg_check','mirna_check']);
			}
		},
		error: function(data,error)
		{
			displayError('Ooops! ' + error + " " + data.responseText);						
		},
		dataType: "json"
	});
}

function initNetwork(networkJSON)
{
	/*networkJSON =
	{
		"dataSchema":
		{
			"nodes":[
						{"name":"label","type":"string"},
						{"name":"entrez_id","type":"int"}
					],
			"edges":[{"name":"interaction","type":"string"}]
		},
		"data":
		{
			"nodes":
			[
				{"id":"ENSP00000221930","label":"TGFB1","entrez_id":7040},
				{"id":"ENSP00000262158","label":"SMAD7","entrez_id":4092},
				{"id":"ENSP00000262160","label":"SMAD2","entrez_id":4087},
				{"id":"ENSP00000273430","label":"AGTR1","entrez_id":185},
				{"id":"ENSP00000290866","label":"ACE","entrez_id":1636},
				{"id":"ENSP00000332973","label":"SMAD3","entrez_id":4088},
				{"id":"ENSP00000341551","label":"SMAD4","entrez_id":4089},
				{"id":"ENSP00000356954","label":"CTGF","entrez_id":1490},
				{"id":"ENSP00000364133","label":"TGFBR1","entrez_id":7046},
				{"id":"ENSP00000379204","label":"BMP7","entrez_id":655}
			],
			"edges":
			[
				{"id":"ENSP00000221930_to_ENSP00000262160","target":"ENSP00000262160","source":"ENSP00000221930","interaction":"ptmod"},
				{"id":"ENSP00000221930_to_ENSP00000356954","target":"ENSP00000356954","source":"ENSP00000221930","interaction":"activation"},
				{"id":"ENSP00000221930_to_ENSP00000364133","target":"ENSP00000364133","source":"ENSP00000221930","interaction":"binding"},
				{"id":"ENSP00000262158_to_ENSP00000262158","target":"ENSP00000262158","source":"ENSP00000262158","interaction":"expression"},
				{"id":"ENSP00000262158_to_ENSP00000332973","target":"ENSP00000332973","source":"ENSP00000262158","interaction":"activation"},
				{"id":"ENSP00000262158_to_ENSP00000332973","target":"ENSP00000332973","source":"ENSP00000262158","interaction":"binding"},
				{"id":"ENSP00000262158_to_ENSP00000332973","target":"ENSP00000332973","source":"ENSP00000262158","interaction":"expression"},
				{"id":"ENSP00000262158_to_ENSP00000341551","target":"ENSP00000341551","source":"ENSP00000262158","interaction":"binding"},
				{"id":"ENSP00000262158_to_ENSP00000341551","target":"ENSP00000341551","source":"ENSP00000262158","interaction":"expression"},
				{"id":"ENSP00000262158_to_ENSP00000356954","target":"ENSP00000356954","source":"ENSP00000262158","interaction":"expression"},
				{"id":"ENSP00000262158_to_ENSP00000364133","target":"ENSP00000364133","source":"ENSP00000262158","interaction":"binding"},
				{"id":"ENSP00000262158_to_ENSP00000364133","target":"ENSP00000364133","source":"ENSP00000262158","interaction":"ptmod"},
				{"id":"ENSP00000262160_to_ENSP00000221930","target":"ENSP00000221930","source":"ENSP00000262160","interaction":"ptmod"},
				{"id":"ENSP00000262160_to_ENSP00000332973","target":"ENSP00000332973","source":"ENSP00000262160","interaction":"binding"},
				{"id":"ENSP00000262160_to_ENSP00000341551","target":"ENSP00000341551","source":"ENSP00000262160","interaction":"activation"},
				{"id":"ENSP00000262160_to_ENSP00000341551","target":"ENSP00000341551","source":"ENSP00000262160","interaction":"binding"},
				{"id":"ENSP00000262160_to_ENSP00000341551","target":"ENSP00000341551","source":"ENSP00000262160","interaction":"expression"},
				{"id":"ENSP00000262160_to_ENSP00000356954","target":"ENSP00000356954","source":"ENSP00000262160","interaction":"activation"},
				{"id":"ENSP00000262160_to_ENSP00000364133","target":"ENSP00000364133","source":"ENSP00000262160","interaction":"binding"},
				{"id":"ENSP00000262160_to_ENSP00000364133","target":"ENSP00000364133","source":"ENSP00000262160","interaction":"ptmod"},
				{"id":"ENSP00000273430_to_ENSP00000290866","target":"ENSP00000290866","source":"ENSP00000273430","interaction":"activation"},
				{"id":"ENSP00000273430_to_ENSP00000356954","target":"ENSP00000356954","source":"ENSP00000273430","interaction":"activation"},
				{"id":"ENSP00000273430_to_ENSP00000356954","target":"ENSP00000356954","source":"ENSP00000273430","interaction":"expression"},
				{"id":"ENSP00000290866_to_ENSP00000273430","target":"ENSP00000273430","source":"ENSP00000290866","interaction":"activation"},
				{"id":"ENSP00000332973_to_ENSP00000262158","target":"ENSP00000262158","source":"ENSP00000332973","interaction":"activation"},
				{"id":"ENSP00000332973_to_ENSP00000262158","target":"ENSP00000262158","source":"ENSP00000332973","interaction":"binding"}
			]
		}
	};

	var visual_style =
	{
		"global":
		{
			"backgroundColor":"#FFFFFF",
			"selectionFillColor":"#9A9AFF"
		},
		"nodes":
		{
			"shape":
			{
				"defaultValue":"ELLIPSE",
				"discreteMapper":
				{
					"attrName":"object_type",
					"entries":
					[
						{"attrValue":"gene","value":"ELLIPSE"},
						{"attrValue":"goterm","value":"ROUNDRECT"},
						{"attrValue":"pathway","value":"PARALLELOGRAM"},
						{"attrValue":"mirna","value":"DIAMOND"}
					]
				}
			},
			"borderWidth":1,
			"borderColor":"#000000",
			"size":
			{
				"defaultValue":"auto",
				"continuousMapper":{"attrName":"pvalue","minValue":16,"maxValue":64}
			},
			"color":
			{
				"defaultValue":"#F7F7F7",
				"continuousMapper":{"attrName":"ratio","minValue":"#00FF00","maxValue":"#FF0000"}
			},
			"labelHorizontalAnchor":"center",
			"selectionColor":"#5FFFFB",
			"selectionGlowColor":"#95FFFE",
			"selectionGlowStrength":32,
			"labelFontWeight":
			{
				"defaultValue":"normal",
				"discreteMapper":
				{
					"attrName":"object_type",
					"entries":
					[
						{"attrValue":"gene","value":"normal"},
						{"attrValue":"goterm","value":"bold"},
						{"attrValue":"pathway","value":"bold"},
						{"attrValue":"mirna","value":"normal"}
					]
				}
			}
		},
		"edges":
		{
			"color":
			{
				"defaultValue":"#999999",
				"discreteMapper":
				{
					"attrName":"interaction",
					"entries":
					[
						{"attrValue":"binding","value":"#028E9B"},
						{"attrValue":"ptmod","value":"#133CAC"},
						{"attrValue":"expression","value":"#FFAD00"},
						{"attrValue":"activation","value":"#FF7800"},
						{"attrValue":"go","value":"#FFC000"},
						{"attrValue":"kegg","value":"#D30068"},
						{"attrValue":"mirna","value":"#A67D00"}
					]
				}
			},
			"width":1
		}
	};*/
	// Initialization options, visual style, initial controls, visualization
	var options =
	{
		//swfPath: "../swf/CytoscapeWeb",
		//flashInstallerPath: "../swf/playerProductInstall"
        swfPath: "swf/CytoscapeWeb",
        flashInstallerPath: "swf/playerProductInstall"
	};
	var visual_style = initVisualStyle();
	var vis = new org.cytoscapeweb.Visualization("cytoscapeweb",options);

	// callback when Cytoscape Web has finished drawing
	vis.ready(function()
	{
		// Store the network so it can be accessible to other functions
		$("#cytoscapeweb").data("visObject",vis);
		// Start with only the selected edges
		filterEdges();
		// Add click listeners
		vis
		.addListener("click","nodes",function(event)
		{
			handle_click(event);
		})
		.addListener("click","edges",function(event)
		{
			handle_click(event);
		})
		// Add context menus
		.addContextMenuItem("Show level 1 neighbors","nodes",function(event) {})
		.addContextMenuItem("Show level 2 neighbors","nodes",function(event) {})
		.addContextMenuItem("Show level 3 neighbors","nodes",function(event) {})
		.addContextMenuItem("Hide","nodes",function(event) {})
		.addContextMenuItem("Delete","nodes",function(event) {})
		.addContextMenuItem("Properties","nodes",function(event) {})
		;

		function handle_click(event)
		{
			var target = event.target;
			 
			//$("#debugContainer").hide();
			var msg = "event.group = " + event.group;
			for (var i in target.data)
			{
				var variable_name = i;
				var variable_value = target.data[i];
				msg = msg + "<br/>" + "event.target.data." + variable_name + " = " + variable_value;
			}
			//debugMessage(msg);
		}
	});

		// draw options
	var draw_options =
	{
		network: networkJSON,
		visualStyle: visual_style,
		panZoomControlVisible: true 
	};
		
	vis.draw(draw_options);
}

function loadingSmall()
{
	$('#loadingCircle').show();
	disable(['search_button','clear_button','disease_list','location_list','dataset_list','reset_data_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna']);
}

function unloadingSmall()
{
	$('#loadingCircle').hide();
	enable(['search_button','clear_button','disease_list','location_list','dataset_list','reset_data_button',
			'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna']);
}

function searchAllow()
{
	/*var txt = document.getElementById('enter_genes').value;
	if (txt == '') { disable('search_button'); }
	else { enable('search_button'); }*/
	if ($("#enter_genes").val() === "")
	{
		disable(['search_button','clear_button']);
	}
	else
	{
		enable(['search_button','clear_button']);
	}
}

function disable(id)
{
	//var getIt = document.getElementById(id);
	//getIt.disabled = true;
	for (var item in id)
	{		
		$("#"+id[item]).attr("disabled",true);
	}
}

function enable(id)
{
	for (var item in id)
	{
		$("#"+id[item]).attr("disabled",false);
	}
}

function clearNetwork()
{
	var vis = $("#cytoscapeweb").data("network");
	if (vis) { vis.removeElements(); }
	$("#cytoscapeweb").removeData();
	$("#cytoscapeweb").empty();
}

function resetSearch()
{ 	
	hideError();
	clearNetwork();
	$("#cytoscapeweb").html("<table class=\"innerTable\"><tr><td>" +
							"<div id=\"hello_kidney\"><img src=\"images/netInitPic.png\" alt=\"Your network will appear here.\"/></div>" +
							"<div id=\"loading_big\" style=\"display:none;\"><img src=\"images/loading.gif\"/></div>" +
							"</td></tr></table>");
	$("#enter_genes").val('');
	$("#disease_list").empty();
	$("#location_list").empty();
	$("#dataset_list").empty();
	$("#go_list").empty();
	$("#kegg_list").empty();
	//$("#mirna_list").empty();
	$("#disease_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#location_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#dataset_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#go_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#kegg_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	//$("#mirna_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#disease_list").removeData();
	$("#location_list").removeData();
	$("#dataset_list").removeData();
	$("#go_list").removeData();
	$("#kegg_list").removeData();
	//$("#mirna_list").removeData();
	$("#go_component").css("background-color","#FFE5E0");
	$("#go_function").css("background-color","#FFFFFF");
	$("#go_process").css("background-color","#FFFFFF");
	disable(['search_button','clear_button','disease_list','location_list','dataset_list','reset_data_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna']);
}

function resetData() 
{												
	var diseaseData = $("#disease_list").data("values");
	var locationData = $("#location_list").data("values");
	var datasetData = $("#dataset_list").data("values");
	var key;
	
	$("#disease_list").empty(); 
	for (key in diseaseData)
	{
		$("#disease_list").append("<option value=" + key + ">" + diseaseData[key] + "</option>");
	}
	$("#location_list").empty(); 
	for (key in locationData)
	{
		$("#location_list").append("<option value=" + key + ">" + locationData[key] + "</option>");
	}
	$("#dataset_list").empty(); 
	for (key in datasetData)
	{
		$("#dataset_list").append("<option value=" + key + ">" + datasetData[key] + "</option>");
	}
}

function split(val) { return val.split(/\n/); }

function truncOrg(val) { return val.replace(/((\s+\-\s+)([\(\)\-,A-Za-z0-9]*\s*)*)+/,''); }

function extractLast(term) { return split(term).pop(); }

function fixKEGGClass(val) { return val.replace(/;\s+/,' - '); }

function displayError(error)
{				
	$('#errorText').text(error);
	$('#errorText').show("fast");
	$('#errorContainer').text(error);
	$('#errorContainer').show("fast");
}

function hideError()
{
	$('#errorText').hide("fast");				
	$('#errorText').text('');
	$('#errorContainer').hide("fast");
	$('#errorContainer').text('');
}

function clearCache()
{
	$("#disease_list").removeData();
	$("#location_list").removeData();
	$("#dataset_list").removeData();
	$("#go_list").removeData();
	$("kegg_list").removeData();
	$("#mirna_list").removeData();
}

function initMe()
{
	//var urlBase = 'http://kupkbvis-dev:81/';
    var urlBase = 'http://localhost/kupkbvis/site/'
	hideError(); //Hide previous errors
	return(urlBase);
}

function randomFromTo(from,to)
{
	return(Math.floor(Math.random()*(to-from+1)+from));
}

function debugMessage(msg)
{
	//$('#debugContainer').text(msg);
	$('#debugContainer').html(msg);
	$('#debugContainer').show("fast");
}

function postDebugMessage(msg)
{
	var urlBase = initMe();

	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { json_debug: msg },
		success: function(data)
		{
			debugMessage("Success");
		},
		error: function(data,error)
		{
			displayError('Ooops! ' + error + " " + data.responseText);						
		},
		dataType: "json"
	});
}

/*
fillSelectList(id,dat)
{	
	$("#"+id).empty();
	if (dat !== null)
	{
		enable([id]);					
		for (var key in dat)
		{
			$("#"+id).append("<option value=" + key + ">" + dat[key]);
		}
	}
}

updateCache(d)
{
	clearCache();
	$("#disease_list").data("values",d['disease']);
	$("#location_list").data("values",d['location']);
	$("#dataset_list").data("values",d['dataset']);
	//$("#go_list").data("values",d['go']);
	//$("kegg_list").data("values",d['kegg']);
	//$("#mirna_list").data("values",d['mirna']);
}

*/

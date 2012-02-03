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

function bindExport()
{
	$("#export_sif")
	.data("clicked",false)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/sif_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/sif_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/sif_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/sif_unpressed.png')");
			$(this).data("clicked",false);
		});

	$("#export_graphml")
	.data("clicked",false)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/gml_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/gml_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/gml_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/gml_unpressed.png')");
			$(this).data("clicked",false);
		});

	$("#export_xgmml")
	.data("clicked",false)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/xml_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/xml_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/xml_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/xml_unpressed.png')");
			$(this).data("clicked",false);
		});
		
	$("#export_png")
	.data("clicked",true)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/png_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/png_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/png_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/png_unpressed.png')");
			$(this).data("clicked",false);
		});
		
	$("#export_pdf")
	.data("clicked",false)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/pdf_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/pdf_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/pdf_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/pdf_unpressed.png')");
			$(this).data("clicked",false);
		});
		
	$("#export_svg")
	.data("clicked",false)
	.hover(
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#A3A3A3");
				if ($(this).data("clicked"))
				{
					$(this).css("background","url('images/export_buttons/svg_pressed.png')");
				}
			}
		},
		function()
		{
			if (!$(this).is(":disabled"))
			{
				$(this).css("border-color","#E0E0E0");
				$(this).css("background","url('images/export_buttons/svg_unpressed.png')");
			}
		})
	.mousedown(
		function()
		{
			$(this).css("background","url('images/export_buttons/svg_pressed.png')");
			$(this).data("clicked",true);
		})
	.mouseup(
		function()
		{
			$(this).css("background","url('images/export_buttons/svg_unpressed.png')");
			$(this).data("clicked",false);
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
		var enteredTerms = $("#enter_genes").val().split(/\n|\r/);
		
		if (!allowedNumberOfTerms(enteredTerms,500))
		{
			modalAlert("Please restrict your search terms to 500!","Attention!");
			return;
		}
		
		var searchJSON = $.toJSON(enteredTerms);
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
					$("#metadata").show("slow");
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
							case 'mirna':
								//$("#mirna_list").empty();
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
	var enteredTerms = $("#enter_genes").val().split(/\n|\r/);

	if (!allowedNumberOfTerms(enteredTerms,500))
	{
		modalAlert("Please restrict your search terms to 500!","Attention!");
		return;
	}

	var searchJSON = $.toJSON(enteredTerms);
	
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
							$("#metadata").show("slow");
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
									case 'mirna':
										//$("#mirna_list").empty();
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
			selDisease = $("#disease_list option:selected").text();
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
			selLocation = $("#location_list option:selected").text();
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

function colorNodes()
{
	var urlBase = initMe();
	var selDisease = $("#disease_list option:selected").text();
	var selLocation = $("#location_list option:selected").text();
	var selDataset = $("#dataset_list").val();
	
	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { dataset: selDataset, location_data: selLocation, disease_data: selDisease },
		beforeSend: function() { $('#loadingCircle').show(); },
		complete: function() { $('#loadingCircle').hide(); },
		success: function(data)
		{						
			if ($.isEmptyObject(data))
			{
				displayError('Sorry, no epxression data found for the genes in the network :-(');
			}
			else
			{
				//alert("Something cam back after all...");
				bypassNodeColors(data);
			}
		},
		error: function(data,error)
		{												
			displayError('Ooops! ' + error + ' ' + data.responseText);						
		},
		dataType: "json"
	});
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

function updateLayoutOpts()
{
	var html = {};
	var layout = $("#layout_list").val();

	html.force =
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_gravitation\">Gravitation:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_gravitation\" size=\"2\" value=\"-500\"/></td>" +
		"<td class=\"layoptCell\"><label for=\"force_node_mass\">Node mass:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_node_mass\" size=\"2\" value=\"5\"/></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_edge_tension\">Edge tension:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_edge_tension\" size=\"2\" value=\"0.5\"/></td>" +
		"<td class=\"layoptCell\"></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=4 class=\"layoptCell\"><button class=\"secondaryButton\" style=\"float:right\" id=\"execute_layout\" onclick=\"updateLayout()\">Execute layout</button></td>" +
		"</tr>" +
		"</table>";
	html.circle =
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\" style=\"width:30%\"><label for=\"circle_angle\">Angle width:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"circle_angle\" size=\"5\" value=\"360\"/></td>" +
		"<td class=\"layoptCell\"></td><td class=\"layoptCell\"></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\" style=\"width:30%\"><label for=\"circle_tree_struct\">Tree structure:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"checkbox\" id=\"circle_tree_struct\"/></td>" +
		"<td class=\"layoptCell\"></td><td class=\"layoptCell\"></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=4 class=\"layoptCell\"><button class=\"secondaryButton\" style=\"float:right\" id=\"execute_layout\" onclick=\"updateLayout()\">Execute layout</button></td>" +
		"</tr>" +
		"</table>";
	html.radial =
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\" style=\"width:30%\"><label for=\"radial_radius\">Radius:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"radial_radius\" size=\"5\" value=\"auto\"/></td>" +
		"<td class=\"layoptCell\"></td><td class=\"layoptCell\"></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\" style=\"width:30%\"><label for=\"radial_angle\">Angle width:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"radial_angle\" size=\"5\" value=\"360\"/></td>" +
		"<td class=\"layoptCell\"></td><td class=\"layoptCell\"></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=4 class=\"layoptCell\"><button class=\"secondaryButton\" style=\"float:right\" id=\"execute_layout\" onclick=\"updateLayout()\">Execute layout</button></td>" +
		"</tr>" +
		"</table>";
	html.tree =
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"tree_orientation\">Orientation:</label></td>" +
		"<td colspan=3 class=\"layoptCell\"><select id=\"tree_orientation\">" +
		"<option value=\"topToBottom\">Top to Bottom</option>" +
		"<option value=\"bottomToTop\">Bottom to Top</option>" +
		"<option value=\"leftToRight\">Left to Right</option>" +
		"<option value=\"rightToLeft\">Right to Left</option>" +
		"</select></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"tree_depth\">Depth:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"tree_depth\" size=\"2\" value=\"50\"/></td>" +
		"<td class=\"layoptCell\"><label for=\"tree_breadth\">Breadth:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"tree_breadth\" size=\"2\" value=\"30\"/></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=4 class=\"layoptCell\"><button class=\"secondaryButton\" style=\"float:right\" id=\"execute_layout\" onclick=\"updateLayout()\">Execute layout</button></td>" +
		"</tr>" +
		"</table>";

	switch(layout)
	{
		case 'ForceDirected':
			$("#layoutOptionContainer").html(html.force);
			break;
		case 'Circle':
			$("#layoutOptionContainer").html(html.circle);
			break;
		case 'Radial':
			$("#layoutOptionContainer").html(html.radial);
			break;
		case 'Tree':
			$("#layoutOptionContainer").html(html.tree);
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
			displaySingleInfo(event);
		})
		.addListener("click","edges",function(event)
		{
			displaySingleInfo(event);
		})
		.addListener("select",function(event)
		{
			displayMultiInfo(event);
		})
		// Add context menus
		.addContextMenuItem("Show level 1 neighbors","nodes",function(event)
		{
			fetchNeighbors(1);
		})
		.addContextMenuItem("Show level 2 neighbors","nodes",function(event)
		{
			fetchNeighbors(2);
		})
		.addContextMenuItem("Show level 3 neighbors","nodes",function(event)
		{
			fetchNeighbors(3);
		})
		.addContextMenuItem("Hide node","nodes",function(event)
		{
			hideElements("nodes","hide");
		})
		.addContextMenuItem("Delete node","nodes",function(event)
		{
			hideElements("nodes","delete");
		})
		.addContextMenuItem("Hide edge","edges",function(event)
		{
			hideElements("edges","hide");
		})
		.addContextMenuItem("Delete edge","edges",function(event)
		{
			hideElements("edges","delete");
		})
		.addContextMenuItem("Restore network",function(event)
		{
			vis.removeFilter();
			filterEdges();
			updateInfo();
		});
		
		function displaySingleInfo(event)
		{
			urlBase = initMe();

			var target = event.target;
			
			if (event.group === "nodes")
			{
				switch(target.data['object_type'])
				{
					case 'gene':
						$.ajax(
						{
							type: 'POST',
							url: urlBase+'php/control.php',
							data: { gene_data: target.data['entrez_id'] },
							beforeSend: function() { $('#loadingCircle').show(); },
							complete: function() { $('#loadingCircle').hide(); },
							success: function(data)
							{						
								gimmeNodeData('gene',target.data,data);
							},
							error: function(data,error)
							{												
								displayError('Ooops! ' + error + ' ' + data.responseText);						
							},
							dataType: "json"
						});
						break;
					case 'component':
						gimmeNodeData('go',target.data,{});
						break;
					case 'function':
						gimmeNodeData('go',target.data,{});
						break;
					case 'process':
						gimmeNodeData('go',target.data,{});
						break;
					case 'pathway':
						gimmeNodeData('pathway',target.data,{});
						break;
					case 'mirna':
						gimmeNodeData('mirna',target.data,{});
						break;
				}
			}

			if (event.group === "edges")
			{
				switch(target.data['interaction'])
				{
					case 'go':
						gimmeEdgeData('go2gene',target.data,{});
						break;
					case 'kegg':
						$.ajax(
						{
							type: 'POST',
							url: urlBase+'php/control.php',
							data: { target_data: target.data['target'] },
							beforeSend: function() { $('#loadingCircle').show(); },
							complete: function() { $('#loadingCircle').hide(); },
							success: function(data)
							{						
								gimmeEdgeData('kegg2gene',target.data,data);
							},
							error: function(data,error)
							{												
								displayError('Ooops! ' + error + ' ' + data.responseText);						
							},
							dataType: "json"
						});
						break;
					case 'mirna':
						gimmeEdgeData('mirna2gene',target.data,{});
						break;
					default: // For any kind of PPI
						$.ajax(
						{
							type: 'POST',
							url: urlBase+'php/control.php',
							data: { target_data: target.data['target'], source_data: target.data['source'] },
							beforeSend: function() { $('#loadingCircle').show(); },
							complete: function() { $('#loadingCircle').hide(); },
							success: function(data)
							{						
								gimmeEdgeData('gene2gene',target.data,data);
							},
							error: function(data,error)
							{												
								displayError('Ooops! ' + error + ' ' + data.responseText);						
							},
							dataType: "json"
						});
				}
			}
		}

		function displayMultiInfo(event)
		{	
			var elems = event.target;
			var selNodes,selEdges,msg;
			if (elems.length>1)
			{
				selNodes = vis.selected("nodes");
				selEdges = vis.selected("edges");
			}
			msg = "<span style=\"color:#000000; font-weight:bold\">Multiple elements selected</span><br/>" +
				  "Genes: <span style=\"color:#FF0000\">" + selNodes.length + "</span><br/>" +
				  "Relationships: <span style=\"color:#FF0000\">" + selEdges.length + "</span><br/>";
			showInfo(msg);
		}

		function hideElements(group,action)
		{
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
				vis.removeElements(selElems);
			}
			updateInfo();
		}

		function fetchNeighbors(level)
		{
			var urlBase = initMe();
	
			var selNodes = vis.selected("nodes");
			var allNodes = vis.nodes();
			var selNodeIDs = [];
			var allNodeIDs = [];
			var sn = selNodes.length;
			var an = allNodes.length;
			var i = 0;

			for (i=0; i<sn; i++)
			{
				selNodeIDs.push(selNodes[i].data.id);
			}
			for (i=0; i<an; i++)
			{
				allNodeIDs.push(allNodes[i].data.id);
			}
			
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { level: level, node: $.toJSON(selNodeIDs), nodes: $.toJSON(allNodeIDs) },
				beforeSend: function() { $('#loadingCircle').show(); },
				complete: function() { $('#loadingCircle').hide(); },
				success: function(data)
				{						
					if ($.isEmptyObject(data)) // Not likely...
					{
						displayError('Sorry! No neighbors found :-(');
					}
					else
					{
						addElements(data);
						filterEdges();
					}
				},
				error: function(data,error)
				{												
					displayError('Ooops! ' + error + ' ' + data.responseText);
				},
				dataType: "json"
			});
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

function modalAlert(msg,tit)
{
	if (tit === '') { tit = "Alert!"; }

	var icon = "<span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0px 5px 5px 0px;\"></span>";

	$("#dialog")
	.html(icon+msg)
	.dialog(
	{
		modal: true,
		autoOpen: false,
		title: tit,
		dialogClass: "attention",
		resizable: false,
		buttons:
		{
			OK: function()
			{
				$(this).dialog("close");
			}
		}
	});
	$("#dialog").dialog("open");

	return(false);
}

function modalSifForm(tit)
{
	var urlBase = initMe();

	var visObject = getVisData('cytoscapeweb');
	var response;

	$("#dialog")
	.html(
		"<fieldset><legend>SIF nodes</legend>" +
		"<input type=\"radio\" name=\"sif_node\" id=\"radio_ensembl\" onclick=\"infoSifDiv()\"/> Ensembl protein ID<br/>" +
		"<input type=\"radio\" name=\"sif_node\" id=\"radio_entrez\" onclick=\"infoSifDiv()\"/> Entrez gene ID<br/>" +
		"<input type=\"radio\" name=\"sif_node\" id=\"radio_symbol\" onclick=\"infoSifDiv()\"/> Gene symbol<br/></fieldset><br/>" +
		"<div class=\"modalsif\" id=\"what_go_with_sif\">Gene Ontology nodes will be exported with their GO ID.</div>" +
		"<div class=\"modalsif\" id=\"what_kegg_with_sif\">KEGG pathway nodes will be exported with their KEGG ID.</div>" +
		"<div class=\"modalsif\" id=\"what_mirna_with_sif\">miRNA nodes are not yet implemented.</div>"
	)
	.dialog(
	{
		modal: true,
		autoOpen: false,
		title: tit,
		dialogClass: "attention",
		resizable: false,
		width: 400,
		buttons:
		{
			OK: function()
			{
				if ($("#radio_ensembl").is(":checked") || $("#radio_entrez").is(":checked"))
				{
					response = visObject.sif({ nodeAttr: "id", interactionAttr: "interaction" });
					visObject.exportNetwork("sif",urlBase + "php/control.php?export=sif",{ window: "_self", nodeAttr: "id", interactionAttr: "interaction" });
				}
				else if ($("#radio_symbol").is(":checked"))
				{
					response = visObject.sif({ nodeAttr: "label", interactionAttr: "interaction" });
					visObject.exportNetwork("sif",urlBase + "php/control.php?export=sif",{ window: "_self", nodeAttr: "label", interactionAttr: "interaction" });
				}
				$(this).dialog("close");
				showInfo(response);
			},
			Cancel: function()
			{
				$(this).dialog("close");
				$(this).removeData();
			}
		}
	});
	$("#dialog").dialog("open");

	return(false);
}

function infoSifDiv()
{
	if ($("#radio_ensembl").is(":checked"))
	{
		$("#what_go_with_sif").html("Gene Ontology nodes will be exported with their GO term ID.");
		$("#what_kegg_with_sif").html("KEGG pathway nodes will be exported with their KEGG pathway ID.");
		$("#what_mirna_with_sif").html("miRNA nodes are not yet implemented.");
	}
	else if ($("#radio_entrez").is(":checked"))
	{
		$("#what_go_with_sif").html("Gene Ontology nodes will be exported with their GO term description.");
		$("#what_kegg_with_sif").html("KEGG pathway nodes will be exported with their KEGG pathway name.");
		$("#what_mirna_with_sif").html("miRNA nodes are not yet implemented.");
	}
	else if ($("#radio_symbol").is(":checked"))
	{
		$("#what_go_with_sif").html("Gene Ontology nodes will be exported with their GO term ID.");
		$("#what_kegg_with_sif").html("KEGG pathway nodes will be exported with their KEGG pathway ID.");
		$("#what_mirna_with_sif").html("miRNA nodes are not yet implemented.");
	}
}

function showInfo(msg)
{
	$("#infoContainer").html(msg);
}

function allowedNumberOfTerms(terms,x)
{
	outcome = terms.length>x ? false : true;
	return(outcome);
}

function loadingSmall()
{
	$('#loadingCircle').show();
	disable(['search_button','clear_button','disease_list','location_list','dataset_list',
			 'reset_data_button','color_network_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			 'export_sif','export_graphml','export_xgmml','export_png','export_pdf','export_svg',
			 'binding_check','ptmod_check','expression_check','activation_check',
			 'go_check','kegg_check','mirna_check',
			 'sig_size_check','node_labels_check','edge_labels_check',
			 'layout_list']);
	$("#export_sif").css("background","url(images/export_buttons/sif_fade.png)");
	$("#export_graphml").css("background","url(images/export_buttons/gml_fade.png)");
	$("#export_xgmml").css("background","url(images/export_buttons/xml_fade.png)");
	$("#export_png").css("background","url(images/export_buttons/png_fade.png)");
	$("#export_pdf").css("background","url(images/export_buttons/pdf_fade.png)");
	$("#export_svg").css("background","url(images/export_buttons/svg_fade.png)");
	$("#layoutOptionContainer").find("input, button, select").attr("disabled","disabled");
}

function unloadingSmall()
{
	$('#loadingCircle').hide();
	enable(['search_button','clear_button','disease_list','location_list','dataset_list',
			'reset_data_button','color_network_button',
			'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			'export_sif','export_graphml','export_xgmml','export_png','export_pdf','export_svg',
			'binding_check','ptmod_check','expression_check','activation_check',
			'go_check','kegg_check','mirna_check',
			'sig_size_check','node_labels_check','edge_labels_check',
			'layout_list']);
	$("#export_sif").css("background","url(images/export_buttons/sif_unpressed.png)");
	$("#export_graphml").css("background","url(images/export_buttons/gml_unpressed.png)");
	$("#export_xgmml").css("background","url(images/export_buttons/xml_unpressed.png)");
	$("#export_png").css("background","url(images/export_buttons/png_unpressed.png)");
	$("#export_pdf").css("background","url(images/export_buttons/pdf_unpressed.png)");
	$("#export_svg").css("background","url(images/export_buttons/svg_unpressed.png)");
	$("#layoutOptionContainer").find("input, button, select").removeAttr("disabled");
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

function removeData(id)
{
	for (var item in id)
	{
		$("#"+id[item]).removeData();
	}
}

function empty(id)
{
	for (var item in id)
	{
		$("#"+id[item]).empty();
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
	empty(['disease_list','location_list','dataset_list','go_list','kegg_list'])
	//$("#mirna_list").empty();
	removeData(['disease_list','location_list','dataset_list','go_list','kegg_list',
				'export_sif','export_graphml','export_xgmml','export_png','export_pdf','export_svg'])
	//$("#mirna_list").removeData();
	$("#disease_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#location_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#dataset_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#go_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#kegg_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	//$("#mirna_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#go_component").css("background-color","#FFFFFF");
	$("#go_function").css("background-color","#FFFFFF");
	$("#go_process").css("background-color","#FFFFFF");
	disable(['search_button','clear_button','disease_list','location_list','dataset_list',
			 'reset_data_button','color_network_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			 'export_sif','export_graphml','export_xgmml','export_png','export_pdf','export_svg',
			 'binding_check','ptmod_check','expression_check','activation_check',
			 'go_check','kegg_check','mirna_check',
			 'sig_size_check','node_labels_check','edge_labels_check',
			 'layout_list']);
	$("#metadata").hide("fast");
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

	enable(['disease_list','location_list','dataset_list']);
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
	var urlBase = 'http://kupkbserver:81/';
	//var urlBase = 'http://kupkbvis-dev:81/';
    //var urlBase = 'http://localhost/kupkbvis/site/'
	hideError(); //Hide previous errors
	return(urlBase);
}

function initTooltip(id)
{
	for (var item in id)
	{
		$("#"+id[item]+"[title]").tooltip().dynamic();
	}
}

// Only for the numbers required for the graph layout execution
function mySimpleValidation(ids)
{
	var msg = new Array();
	var isvalid = true;
	var cont;

	for (id in ids)
	{
		cont = $("#"+ids[id]).val();
		switch(ids[id])
		{
			case 'force_gravitation':
				if (!isNumber(cont) || cont<-1000 || cont>1000)
				{
					msg.push("Gravitation must be a number between -1000 and 1000");
					isvalid = false;
				}
				break;
			case 'force_node_mass':
				if (!isNumber(cont) || cont<1 || cont>10)
				{
					msg.push("Node mass must be a number between 1 and 10");
					isvalid = false;
				}
				break;
			case 'force_edge_tension':
				if (!isNumber(cont) || cont<=0 || cont>1)
				{
					msg.push("Force gravitation must be a number between 0 and 1 (not equal to 0)");
					isvalid = false;
				}
				break;
			case 'force_edge_tension':
				if (!isNumber(cont) || cont<=0 || cont>1)
				{
					msg.push("Force gravitation must be a number between 0 and 1 (not equal to 0)");
					isvalid = false;
				}
				break;
			case 'circle_angle':
				if (!isNumber(cont) || cont<=0 || cont>360)
				{
					msg.push("Angle width must be a number between 0 and 360 (not equal to 0)");
					isvalid = false;
				}
				break;
			case 'radial_radius':
				if ((!isNumber(cont) && cont !== "auto") || cont<50 || cont>500)
				{
					msg.push("Radius must be a number between 50 and 500 or auto");
					isvalid = false;
				}
				break;
			case 'radial_angle':
				if (!isNumber(cont) || cont<=0 || cont>360)
				{
					msg.push("Angle width must be a number between 0 and 360 (not equal to 0)");
					isvalid = false;
				}
				break;
			case 'tree_depth':
				if (!isNumber(cont) || cont<=0)
				{
					msg.push("Depth space a positive number");
					isvalid = false;
				}
				break;
			case 'tree_breadth':
				if (!isNumber(cont) || cont<=0)
				{
					msg.push("Breadth space a positive number");
					isvalid = false;
				}
				break;
			case 'tree_angle':
				if (!isNumber(cont) || cont<=0 || cont>360)
				{
					msg.push("Angle width must be a number between 0 and 360 (not equal to 0)");
					isvalid = false;
				}
				break;
		}
	}

	if (!isvalid) { modalAlert(msg.join("<br/>"),"Alert!") };
	return(isvalid);
}

function randomFromTo(from,to)
{
	return(Math.floor(Math.random()*(to-from+1)+from));
}

function isNumber(n)
{
	return(!isNaN(parseFloat(n)) && isFinite(n));
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

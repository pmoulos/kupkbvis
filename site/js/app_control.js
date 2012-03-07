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
function search(input)
{
	var urlBase = initMe(); 
	var enteredTerms;
	var recall = false;
	
	var species = $("#species_list").val();
	if (species == 999999) //Nothing selected
	{		
		//displayError('Please select species first!');
		modalAlert("Please select species first!","Species!");
		return;
	}
	if (input !== '' && input !== null && input !== undefined)
	{
		enteredTerms = input;
		recall = true;
	}
	else if ($("#enter_genes").val() !== '')
	{
		enteredTerms = $("#enter_genes").val().split(/\n|\r/);
		
		if (!allowedNumberOfTerms(enteredTerms,500))
		{
			modalAlert("Please restrict your search terms to 500!","Attention!");
			return;
		}
	}

	if (!$.isEmptyObject(enteredTerms))
	{
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
					$('#color_legend').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
					$('#info_section').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
					$('#element_info').animate({ opacity: 1.0 },250);
					displayError('Sorry! Nothing found... :-(');
				}
				else //Enable and fill the rest of the lists
				{																						
					$('#color_legend').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
					$('#info_section').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
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
									enable(['dataset_list','reset_gene_data_button','color_network_button','disease_gene_check','location_gene_check']);
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
									enable(['go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat']);
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
									enable(['kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg']);
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
								$("#mirna_list").empty();
								if (data[outerkey] !== null)
								{
									$("#mirna_list").removeData();
									enable(['mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna']);
									$("#mirna_list").data("values",data[outerkey]);
									for (innerkey in data[outerkey])
									{
										$("#mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">" 
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'disease_mirna':
								$("#disease_mirna_list").empty();
								if (data[outerkey] !== null)
								{
									$("#disease_mirna_list").removeData();									
									enable(['disease_mirna_list']);
									$("#disease_mirna_list").data("values",data[outerkey]); //Cache!	
									for (innerkey in data[outerkey])
									{
										$("#disease_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'location_mirna':
								$("#location_mirna_list").empty();
								if (data[outerkey] !== null)
								{
									$("#location_mirna_list").removeData();				
									enable(['location_mirna_list']);
									$("#location_mirna_list").data("values",data[outerkey]);					
									for (innerkey in data[outerkey])
									{
										$("#location_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
											+ data[outerkey][innerkey] + "</option>");
									}
								}
								break;
							case 'dataset_mirna':
								$("#dataset_mirna_list").empty();
								if (data[outerkey] !== null)
								{
									$("#dataset_mirna_list").removeData();
									enable(['dataset_mirna_list','reset_mirna_data_button','color_mirna_button','disease_mirna_check','location_mirna_check']);
									$("#dataset_mirna_list").data("values",data[outerkey]);				
									for (innerkey in data[outerkey])
									{
										$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
				$('#color_legend').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
				$('#info_section').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
				$('#element_info').animate({ opacity: 1.0 },250);
				displayError('Ooops! ' + error + " " + data.responseText);						
			},
			dataType: "json"
		});

		if (!recall) // If not called again because of the addition of neighbors
		{
			fetchNetwork(); // Initiate the network
		}
	}
}

function update(id)
{	
	var urlBase = initMe();
	
	var selSpecies,selDisease,selLocation,selDataset,selVal;
	var outerkey,innerkey,innermost;
	//var genesQuery = $("#enter_genes").val();
	//var enteredTerms = $("#enter_genes").val().split(/\n|\r/);
	var enteredTerms = getEntrezIDs();

	if (!allowedNumberOfTerms(enteredTerms,1500))
	{
		modalAlert("Please restrict your network to 1500 nodes!","Attention!");
		return;
	}
	
	switch(id)
	{
		case 'species_list':
			if (enteredTerms !== '') // If empty then we are at initialization phase 
			{
				// In this case, entrez genes will return an empty network as they are species
				// specific... We have to get back gene symbols which will be then queried
				// but the query ignores letter case
				$.ajax(
				{
					type: 'POST',
					url: urlBase+'php/control.php',
					async: false, // Little cheat for speed...
					data: { symbol: "symbol" }, // Entrez is in session... pointless to send data around
					beforeSend: function() { $('#loadingCircle').show(); },
					complete: function() { $('#loadingCircle').hide(); },
					success: function(data)
					{                        
						if ($.isEmptyObject(data))
						{
							displayError('No gene symbols found!'); // Unlikely...
						}
						else
						{
							enteredTerms = data;
						}
					},
					error: function(data,error)
					{                                                
						displayError('Ooops! ' + error + ' ' + data.responseText);                        
					},
					dataType: "json"
				});
				
				var searchJSON = $.toJSON(enteredTerms);
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
							$('#color_legend').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
							$('#info_section').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
							$('#element_info').animate({ opacity: 1.0 },250);
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
											enable(['dataset_list','reset_gene_data_button','color_network_button','disease_gene_check','location_gene_check']);
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
											enable(['go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat']);
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
											enable(['kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg']);		
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
										$("#mirna_list").empty();
										if (data[outerkey] !== null)
										{
											$("#mirna_list").removeData();
											enable(['mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna']);
											$("#mirna_list").data("values",data[outerkey]);
											for (innerkey in data[outerkey])
											{
												$("#mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">" 
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'disease_mirna':
										$("#disease_mirna_list").empty();
										if (data[outerkey] !== null)
										{
											$("#disease_mirna_list").removeData();									
											enable(['disease_mirna_list']);
											$("#disease_mirna_list").data("values",data[outerkey]); //Cache!	
											for (innerkey in data[outerkey])
											{
												$("#disease_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'location_mirna':
										$("#location_mirna_list").empty();
										if (data[outerkey] !== null)
										{
											$("#location_mirna_list").removeData();				
											enable(['location_mirna_list']);
											$("#location_mirna_list").data("values",data[outerkey]);					
											for (innerkey in data[outerkey])
											{
												$("#location_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
										break;
									case 'dataset_mirna':
										$("#dataset_mirna_list").empty();
										if (data[outerkey] !== null)
										{
											$("#dataset_mirna_list").removeData();
											enable(['dataset_mirna_list','reset_mirna_data_button','color_mirna_button','disease_mirna_check','location_mirna_check']);
											$("#dataset_mirna_list").data("values",data[outerkey]);				
											for (innerkey in data[outerkey])
											{
												$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
						$('#color_legend').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
						$('#info_section').css({ opacity: 0.0, visibility: "visible" }).animate({ opacity: 1.0 },500);
						$('#element_info').animate({ opacity: 1.0 },250);
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
					disable(['disease_list','location_list','dataset_list','reset_gene_data_button']); 
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
									if ($("#restrict_gene_check").is(":checked"))
									{
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
									}
									else { enable(['location_list']); }
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
			enable(['reset_gene_data_button']);
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
									if ($("#restrict_gene_check").is(":checked"))
									{
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
									} else { enable(['disease_list']); } 
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
			enable(['reset_gene_data_button']);
			break;

			case 'disease_mirna_list':
			selVal = $('#disease_mirna_list').val();
			selDisease = $("#disease_mirna_list option:selected").text();
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { disease_mirna: selDisease },
				beforeSend: function()
				{
					$("#filterCircle").show();
					disable(['disease_mirna_list','location_mirna_list','dataset_mirna_list','reset_mirna_data_button']); 
				},
				complete: function() 
				{ 
					$("#filterCircle").hide();
					enable(['disease_mirna_list']); 
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
									if ($("#restrict_mirna_check").is(":checked"))
									{
										$("#location_mirna_list").empty();
										if (data['location'] !== null)
										{								
											enable(['location_mirna_list']);				
											for (innerkey in data[outerkey])
											{
												$("#location_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
									}
									else { enable(['location_mirna_list']); }
									break;
								case 'dataset':
									$("#dataset_mirna_list").empty();
									if (data['dataset'] !== null)
									{
										enable(['dataset_mirna_list']);					
										for (innerkey in data[outerkey])
										{
											$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
			enable(['reset_mirna_data_button']);
			break;
			
		case 'location_mirna_list':
			selVal = $('#location_mirna_list').val();
			selLocation = $("#location_mirna_list option:selected").text();
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { location_mirna: selLocation },
				beforeSend: function()
				{
					$("#filterCircle").show();
					disable(['disease_mirna_list','location_mirna_list','dataset_mirna_list']); 
				},
				complete: function() 
				{ 
					$("#filterCircle").hide();
					enable(['location_mirna_list']); 
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
									if ($("#restrict_mirna_check").is(":checked"))
									{
										$("#disease_mirna_list").empty();
										if (data[outerkey] !== null)
										{								
											enable(['disease_mirna_list']);		
											for (innerkey in data[outerkey])
											{
												$("#disease_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
													+ data[outerkey][innerkey] + "</option>");
											}
										}
									} else { enable(['disease_mirna_list']); } 
									break;
								case 'dataset':
									$("#dataset_mirna_list").empty();
									if (data[outerkey] !== null)
									{
										enable(['dataset_mirna_list']);					
										for (innerkey in data[outerkey])
										{
											$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
			enable(['reset_mirna_data_button']);
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

function colorNodes(type)
{
	var urlBase = initMe();
	var selDataset,selLocation,selDisease;
	var j;

	switch(type)
	{
		case 'gene':
			//selDisease = $("#disease_list").val();
			//selLocation = $("#location_list").val();
			selDataset = $("#dataset_list").val();
			selLocation = $("#location_list option:selected").text();
			selDisease = $("#disease_list option:selected").text();
			if (selDataset[0] === "none")
			{
				resetNodeData('gene');
				return;
			}

			if (!$("#disease_gene_check").is(":checked")) { selDisease = ''; }
			else
			{
				if (selDisease === "-data with no disease associated-") { selDisease = ''; }
			}
			if (!$("#location_gene_check").is(":checked")) { selLocation = ''; }
			else
			{
				if (selLocation === "-data with no location associated-") { selLocation = ''; }
			}

			resetNodeData('gene');
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
						displayError('Sorry, no gene expression data found for the selected disease, location ' +
									 'and dataset combination. Try unchecking the disease and location checkboxes '+
									 'in the Advanced tab if they are checked to make search less strict.');
					}
					else
					{
						for (j=0; j<data.length; j++)
						{
							if (data[j].ratio !== 999 && data[j].ratio !== null)
							{
								data[j].ratio = parseFloat(data[j].ratio);
							}
							if (data[j].pvalue !== 999 && data[j].pvalue !== null)
							{
								data[j].pvalue = parseFloat(data[j].pvalue);
							}
							if (data[j].fdr !== 999 && data[j].fdr !== null)
							{
								data[j].fdr = parseFloat(data[j].fdr);
							}
						}
						bypassNodeColors(data,'gene');
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
			selDataset = $("#dataset_mirna_list").val();
			selLocation = $("#location_mirna_list option:selected").text();
			selDisease = $("#disease_mirna_list option:selected").text();
			if (selDataset[0] === "none")
			{
				resetNodeData('mirna');
				return;
			}

			if (!$("#disease_mirna_check").is(":checked")) { selDisease = ''; }
			else
			{
				if (selDisease === "-data with no disease associated-") { selDisease = ''; }
			}
			if (!$("#location_mirna_check").is(":checked")) { selLocation = ''; }
			else
			{
				if (selLocation === "-data with no location associated-") { selLocation = ''; }
			}

			resetNodeData('mirna');
			$.ajax(
			{
				type: 'POST',
				url: urlBase+'php/control.php',
				data: { dataset_mirna: selDataset, location_mirna_data: selLocation, disease_mirna_data: selDisease },
				beforeSend: function() { $('#loadingCircle').show(); },
				complete: function() { $('#loadingCircle').hide(); },
				success: function(data)
				{						
					if ($.isEmptyObject(data))
					{
						displayError('Sorry, no miRNA expression data found for the selected disease, location ' +
									 'and dataset combination. Try unchecking the disease and location checkboxes '+
									 'in the Advanced tab if they are checked to make search less strict.');
					}
					else
					{
						for (j=0; j<data.length; j++)
						{
							if (data[j].ratio !== 999 && data[j].ratio !== null)
							{
								data[j].ratio = parseFloat(data[j].ratio);
							}
							if (data[j].pvalue !== 999 && data[j].pvalue !== null)
							{
								data[j].pvalue = parseFloat(data[j].pvalue);
							}
							if (data[j].fdr !== 999 && data[j].fdr !== null)
							{
								data[j].fdr = parseFloat(data[j].fdr);
							}
						}
						bypassNodeColors(data,'mirna');
					}
				},
				error: function(data,error)
				{												
					displayError('Ooops! ' + error + ' ' + data.responseText);						
				},
				dataType: "json"
			});

			break;
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
			switch(howmany)
            {
                case 'selected':
                    toSend = $.toJSON($("#mirna_list").val());
                    break;
                case 'all':
                    $("#mirna_list option").attr("selected","selected");
                    toSend = $.toJSON($("#mirna_list").val());
                    break;
            }
            $.ajax(
            {
                type: 'POST',
                url: urlBase+'php/control.php',
                data: { mirna: toSend },
                beforeSend: function() { $('#loadingCircle').show(); },
                complete: function() { $('#loadingCircle').hide(); },
                success: function(data)
                {                        
                    if ($.isEmptyObject(data))
                    {
                        displayError('Select one or more miRNAs first!');
                    }
                    else
                    {
                        addElements(data);
						addMiRNAData();
                    }
                },
                error: function(data,error)
                {                                                
                    displayError('Ooops! ' + error + ' ' + data.responseText);                        
                },
                dataType: "json"
            });
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
			removeMeta(what,howmany,'');
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
			loadingSmall();
		},
		complete: function() 
		{ 
			$("#loading_big").hide();
			enable(['disease_list','location_list','dataset_list','reset_gene_data_button','go_list','kegg_list','mirna_list']);
			unloadingSmall();
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
	// Initialization options, visual style, initial controls, layout parameters, visualization
	var options =
	{
		//swfPath: "../swf/CytoscapeWeb",
		//flashInstallerPath: "../swf/playerProductInstall"
        swfPath: "swf/CytoscapeWeb",
        flashInstallerPath: "swf/playerProductInstall"
	};
	var visual_style = initVisualStyle();
	var layOpts = initLayoutOpts();
	var vis = new org.cytoscapeweb.Visualization("cytoscapeweb",options);

	// callback when Cytoscape Web has finished drawing
	vis.ready(function()
	{
		// Start with only the selected edges
		//filterEdges();
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
		.addContextMenuItem("Get level 1 neighbors","nodes",function(event)
		{
			fetchNeighbors(1);
		})
		.addContextMenuItem("Get level 2 neighbors","nodes",function(event)
		{
			fetchNeighbors(2);
		})
		//.addContextMenuItem("Show level 3 neighbors","nodes",function(event)
		//{
		//	fetchNeighbors(3);
		//})
		.addContextMenuItem("Highlight level 1 neighbors","nodes",function(event)
		{
			showNeighbors(1);
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

		// Store the network and layout object so it can be accessible to other functions
		// Also store a bypass variable for visual style beause it seems that before applying
		// each bypass, cytoscapeweb reverts to its original visual style.
		$("#cytoscapeweb").data("visObject",vis);
		$("#cytoscapeweb").data("layout",layOpts);
		$("#cytoscapeweb").data("bypass", { nodes: { }, edges: { } });
		
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

			if (sn === 0) // Nothing selected
			{
				modalAlert("Please select at least one node.","Attention!");
				return;
			}

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
					var nodes;
					var entrezID = [];
					var i = 0;
					
					if ($.isEmptyObject(data)) // Not likely...
					{
						displayError('Sorry! No neighbors found :-(');
					}
					else
					{
						nodes = vis.nodes();
						for (i=0; i<nodes.length; i++)
						{
							entrezID.push(nodes[i].data.entrez_id);
						}
						for (i=0; i<data.length; i++)
						{
							if (data[i].group === "nodes")
							{
								entrezID.push(data[i].data.entrez_id);
							}
						}
						addElements(data);
						filterEdges();
						search(entrezID);
					}
				},
				error: function(data,error)
				{												
					displayError('Ooops! ' + error + ' ' + data.responseText);
				},
				dataType: "json"
			});
		}

		// Only for level 1 for the moment...
		function showNeighbors(level)
		{
			var selNodes = vis.selected("nodes");
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

			var nObj = vis.firstNeighbors(selNodeIDs,true);

			// Now highlight neighboring nodes and edges
			vis.select("nodes",nObj.neighbors);
			vis.select("edges",nObj.edges);
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

function addMiRNAData()
{
	urlBase = initMe();
	
	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { add_mirna: "add_mirna" }, // Some random text
		beforeSend: function()
		{
			$('#loadingCircle').show();
			disable(['disease_mirna_list','location_mirna_list','dataset_mirna_list',
					 'reset_mirna_data_button','color_mirna_button']);
		},
		complete: function() { $('#loadingCircle').hide(); },
		success: function(data)
		{						
			if ($.isEmptyObject(data))
			{
				$("#disease_mirna_list").empty();
				$("#location_mirna_list").empty();
				$("#dataset_mirna_list").empty();
				$("#disease_mirna_list").removeData();
				$("#location_mirna_list").removeData();
				$("#dataset_mirna_list").removeData();
			}
			else
			{
				enable(['reset_mirna_data_button','color_mirna_button']);
				var outerkey,innerkey,innermost;					
				for (outerkey in data)
				{										
					switch(outerkey)
					{
						case 'disease_mirna':
							$("#disease_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#disease_mirna_list").removeData();									
								enable(['disease_mirna_list']);
								$("#disease_mirna_list").data("values",data[outerkey]); //Cache!	
								for (innerkey in data[outerkey])
								{
									$("#disease_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
										+ data[outerkey][innerkey] + "</option>");
								}
							}
							break;
						case 'location_mirna':
							$("#location_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#location_mirna_list").removeData();				
								enable(['location_mirna_list']);
								$("#location_mirna_list").data("values",data[outerkey]);					
								for (innerkey in data[outerkey])
								{
									$("#location_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
										+ data[outerkey][innerkey] + "</option>");
								}
							}
							break;
						case 'dataset_mirna':
							$("#dataset_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#dataset_mirna_list").removeData();
								enable(['dataset_mirna_list','reset_mirna_data_button','color_mirna_button','disease_mirna_check','location_mirna_check']);
								$("#dataset_mirna_list").data("values",data[outerkey]);				
								for (innerkey in data[outerkey])
								{
									$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
			displayError('Ooops! ' + error + ' ' + data.responseText);						
		},
		dataType: "json"
	});
}

function removeMiRNAData(ids)
{
	urlBase = initMe();
	
	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { remove_mirna: $.toJSON(ids) },
		beforeSend: function()
		{
			$('#loadingCircle').show();
			disable(['disease_mirna_list','location_mirna_list','dataset_mirna_list',
					 'reset_mirna_data_button','color_mirna_button']);
		},
		complete: function() { $('#loadingCircle').hide(); },
		success: function(data)
		{						
			if ($.isEmptyObject(data))
			{
				$("#disease_mirna_list").empty();
				$("#location_mirna_list").empty();
				$("#dataset_mirna_list").empty();
				$("#disease_mirna_list").removeData();
				$("#location_mirna_list").removeData();
				$("#dataset_mirna_list").removeData();
			}
			else
			{
				enable(['reset_mirna_data_button','color_mirna_button']);
				var outerkey,innerkey,innermost;
				for (outerkey in data)
				{										
					switch(outerkey)
					{
						case 'disease_mirna':
							$("#disease_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#disease_mirna_list").removeData();
								enable(['disease_mirna_list']);
								$("#disease_mirna_list").data("values",data[outerkey]); //Cache!
								for (innerkey in data[outerkey])
								{
									$("#disease_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
										+ data[outerkey][innerkey] + "</option>");
								}
							}
							break;
						case 'location_mirna':
							$("#location_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#location_mirna_list").removeData();
								enable(['location_mirna_list']);
								$("#location_mirna_list").data("values",data[outerkey]);					
								for (innerkey in data[outerkey])
								{
									$("#location_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
										+ data[outerkey][innerkey] + "</option>");
								}
							}
							break;
						case 'dataset_mirna':
							$("#dataset_mirna_list").empty();
							if (data[outerkey] !== null)
							{
								$("#dataset_mirna_list").removeData();
								enable(['dataset_mirna_list','reset_mirna_data_button','color_mirna_button','disease_mirna_check','location_mirna_check']);
								$("#dataset_mirna_list").data("values",data[outerkey]);				
								for (innerkey in data[outerkey])
								{
									$("#dataset_mirna_list").append("<option title=\"" + data[outerkey][innerkey] + "\" value=" + innerkey + ">"
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
			displayError('Ooops! ' + error + ' ' + data.responseText);						
		},
		dataType: "json"
	});
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
		"<div class=\"modalsif\" id=\"what_mirna_with_sif\">miRNA nodes will be exported with their mirBase ID.</div>"
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
		$("#what_mirna_with_sif").html("miRNA nodes will be exported with their mirBase ID.");
	}
	else if ($("#radio_entrez").is(":checked"))
	{
		$("#what_go_with_sif").html("Gene Ontology nodes will be exported with their GO term description.");
		$("#what_kegg_with_sif").html("KEGG pathway nodes will be exported with their KEGG pathway name.");
		$("#what_mirna_with_sif").html("miRNA nodes will be exported with their mirBase ID.");
	}
	else if ($("#radio_symbol").is(":checked"))
	{
		$("#what_go_with_sif").html("Gene Ontology nodes will be exported with their GO term ID.");
		$("#what_kegg_with_sif").html("KEGG pathway nodes will be exported with their KEGG pathway ID.");
		$("#what_mirna_with_sif").html("miRNA nodes will be exported with their mirBase ID.");
	}
}

function modalLayoutParamForm(tit)
{
	var visObject = getVisData('cytoscapeweb');
	if ($.isEmptyObject(visObject) || visObject === undefined || visObject === null)
	{
		modalAlert("No network has been initialized yet!");
		return;
	}
	
	$("#dialog")
	.html(
		"<table class=\"innerTable\">" +
		"<tr><td class=\"innerCell\" style=\"text-align:left; width:28%\">" +
		"<span class=\"boldText\">View: </span>" +
		"</td><td colspan=3 class=\"innerCell\">" +
		"<select name=\"layout_list\" id=\"layout_list\" onchange=\"updateLayoutOpts()\">" +
		"<option value=\"ForceDirected\">Default</option>" +
		"<option value=\"Circle\">Circle</option>" +
		"<option value=\"Tree\">Tree</option>" +
		"<option value=\"Radial\">Pizza</option>" +
		"</select>" +
		"</td></tr>" +
		"<tr>" +
		"<td class=\"innerCell\" style=\"text-align:left\">Layout Options:" +
		"</td>" +
		"<td colspan=3 class=\"innerCell\" style=\"text-align:left\">" +
		"<div id=\"layoutOptionContainer\">" +
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_gravitation\">Gravitation:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_gravitation\" size=\"5\" value=\"-500\" /></td>" +
		"<td class=\"layoptCell\"><label for=\"force_node_mass\">Node mass:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_node_mass\" size=\"5\" value=\"5\" /></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_edge_tension\">Edge tension:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_edge_tension\" size=\"5\" value=\"0.5\" /></td>" +
		"<td class=\"layoptCell\"></td>" +
		"</tr></table></div></td></tr></table>"
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
				var layopt = $("#layout_list").val();
				var layoutOpts = $("#cytoscapeweb").data("layout");
				
				switch(layopt)
				{
					case 'ForceDirected':
						if (mySimpleValidation(['force_gravitation','force_node_mass','force_edge_tension']))
						{
							layoutOpts.ForceDirected.gravitation = parseFloat($("#force_gravitation").val());
							layoutOpts.ForceDirected.node_mass = parseFloat($("#force_node_mass").val());
							layoutOpts.ForceDirected.edge_tension = parseFloat($("#force_edge_tension").val())
						} else { return; }
						break;
					case 'Circle':
						if (mySimpleValidation(['circle_angle']))
						{
							layoutOpts.Circle.angle_width = parseFloat($("#circle_angle").val());
							layoutOpts.Circle.tree_structure = $("#circle_tree_struct").is(":checked");
						} else { return; }
						break;
					case 'Radial':
						if (mySimpleValidation(['radial_radius','radial_angle']))
						{
							layoutOpts.Radial.angle_width = parseFloat($("#radial_angle").val());
							layoutOpts.Radial.radius = parseFloat($("#radial_radius").val());
						} else { return; }
						break;
					case 'Tree':
						if (mySimpleValidation(['tree_depth','tree_breadth']))
						{
							layoutOpts.Tree.orientation = $("#tree_orientation").val();
							layoutOpts.Tree.depth = parseFloat($("#tree_depth").val());
							layoutOpts.Tree.breadth = parseFloat($("#tree_breadth").val());
						} else { return; }
						break;
				}

				$("#cytoscapeweb").data("layout",layoutOpts);
				$(this).dialog("close");
			},
			"OK and Update": function()
			{
				var layopt = $("#layout_list").val();
				var layoutOpts = $("#cytoscapeweb").data("layout");
				
				switch(layopt)
				{
					case 'ForceDirected':
						if (mySimpleValidation(['force_gravitation','force_node_mass','force_edge_tension']))
						{
							layoutOpts.ForceDirected.gravitation = parseFloat($("#force_gravitation").val());
							layoutOpts.ForceDirected.node_mass = parseFloat($("#force_node_mass").val());
							layoutOpts.ForceDirected.edge_tension = parseFloat($("#force_edge_tension").val())
						} else { return; }
						break;
					case 'Circle':
						if (mySimpleValidation(['circle_angle']))
						{
							layoutOpts.Circle.angle_width = parseFloat($("#circle_angle").val());
							layoutOpts.Circle.tree_structure = $("#circle_tree_struct").is(":checked");
						} else { return; }
						break;
					case 'Radial':
						if (mySimpleValidation(['radial_radius','radial_angle']))
						{
							layoutOpts.Radial.angle_width = parseFloat($("#radial_angle").val());
							layoutOpts.Radial.radius = parseFloat($("#radial_radius").val());
						} else { return; }
						break;
					case 'Tree':
						if (mySimpleValidation(['tree_depth','tree_breadth']))
						{
							layoutOpts.Tree.orientation = $("#tree_orientation").val();
							layoutOpts.Tree.depth = parseFloat($("#tree_depth").val());
							layoutOpts.Tree.breadth = parseFloat($("#tree_breadth").val());
						} else { return; }
						break;
				}

				$("#cytoscapeweb").data("layout",layoutOpts);
				updateLayout(layopt);
				$(this).dialog("close");
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

function updateLayoutOpts()
{
	var html = {};
	var layout = $("#layout_list").val();

	html.force =
		"<table class=\"innerTable\">" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_gravitation\">Gravitation:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_gravitation\" size=\"5\" value=\"-500\"/></td>" +
		"<td class=\"layoptCell\"><label for=\"force_node_mass\">Node mass:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_node_mass\" size=\"5\" value=\"5\"/></td>" +
		"</tr>" +
		"<tr>" +
		"<td class=\"layoptCell\"><label for=\"force_edge_tension\">Edge tension:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"force_edge_tension\" size=\"5\" value=\"0.5\"/></td>" +
		"<td class=\"layoptCell\"></td>" +
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
		"<td class=\"layoptCell\"><input type=\"text\" id=\"tree_depth\" size=\"5\" value=\"50\"/></td>" +
		"<td class=\"layoptCell\"><label for=\"tree_breadth\">Breadth:</label></td>" +
		"<td class=\"layoptCell\"><input type=\"text\" id=\"tree_breadth\" size=\"5\" value=\"30\"/></td>" +
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

function toggleInfo()
{
	if ($('#element_info').css("opacity") == 0.0)
	{
		$('#element_info').animate({ opacity: 1.0 },250);
	}
	else
	{
		$('#element_info').animate({ opacity: 0.0 },250);
	}
}

function toggleClickColor()
{
	if ($('#allow_click_color_check').is(":checked"))
	{
		$('#dataset_list').attr("onchange","colorNodes('gene')");
		$('#dataset_mirna_list').attr("onchange","colorNodes('mirna')");
	}
	else
	{
		$('#dataset_list').removeAttr("onchange");
		$('#dataset_mirna_list').removeAttr("onchange");
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
	disable(['search_button','clear_button',
			 'species_list','disease_list','location_list','dataset_list',
			 'reset_gene_data_button','color_network_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			 'binding_check','ptmod_check','expression_check','activation_check',
			 'go_check','kegg_check','mirna_check',
			 'multicolor_gene_check','multicolor_mirna_check',
			 'restrict_gene_check','restrict_mirna_check',
			 'disease_gene_check','location_gene_check',
			 'disease_mirna_check','location_mirna_check',
			 'node_labels_check','edge_labels_check','sig_size_check','allow_click_color_check',
			 'layout_list']);
	$("#layoutOptionContainer").find("input, button, select").attr("disabled","disabled");
}

function unloadingSmall()
{
	$('#loadingCircle').hide();
	enable(['search_button','clear_button',
			'species_list','disease_list','location_list','dataset_list',
			'reset_gene_data_button','color_network_button',
			'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			'binding_check','ptmod_check','expression_check','activation_check',
			'go_check','kegg_check','mirna_check',
			'multicolor_gene_check','multicolor_mirna_check',
			'restrict_gene_check','restrict_mirna_check',
			'disease_gene_check','location_gene_check',
			'disease_mirna_check','location_mirna_check',
			'node_labels_check','edge_labels_check','sig_size_check','allow_click_color_check',
			'layout_list']);
	$("#layoutOptionContainer").find("input, button, select").removeAttr("disabled");

	// There is an extreme case (dog) of not finding any KUPKB data... In this case,
	// the KUPKB controls must remain disabled. We are placing this here as this is
	// usually the last AJAX action performed before final initialization
	if ($("#dataset_list").val() === '0')
	{
		disable(['disease_list','location_list','dataset_list','reset_gene_data_button',
				 'color_network_button','disease_gene_check','location_gene_check']);
	}
	if ($("#go_list").text() === '')
	{
		disable(['go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat']);
	}
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
	$("#mirna_list").empty();
	removeData(['disease_list','location_list','dataset_list','go_list','kegg_list'])
	$("#mirna_list").removeData();
	$("#disease_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#location_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#dataset_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#go_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#kegg_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#mirna_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#go_component").css("background-color","#FFFFFF");
	$("#go_function").css("background-color","#FFFFFF");
	$("#go_process").css("background-color","#FFFFFF");
	disable(['search_button','clear_button',
			 'disease_list','location_list','dataset_list',
			 'reset_gene_data_button','color_network_button',
			 'go_list','show_selected_go','show_all_go','clear_selected_go','clear_all_go','clear_all_go_cat',
			 'kegg_list','show_selected_kegg','show_all_kegg','clear_selected_kegg','clear_all_kegg',
			 'mirna_list','show_selected_mirna','show_all_mirna','clear_selected_mirna','clear_all_mirna',
			 'binding_check','ptmod_check','expression_check','activation_check',
			 'go_check','kegg_check','mirna_check',
			 'multicolor_gene_check','multicolor_mirna_check',
			 'restrict_gene_check','restrict_mirna_check',
			 'disease_gene_check','location_gene_check',
			 'disease_mirna_check','location_mirna_check',
			 'node_labels_check','edge_labels_check','sig_size_check','layout_list']);
	$("#color_legend").css("visibility","hidden");
	$("#info_section").css("visibility","hidden");
}

function resetData(type) 
{												
	var key;

	switch(type)
	{
		case 'gene':		
			var diseaseData = $("#disease_list").data("values");
			var locationData = $("#location_list").data("values");
			var datasetData = $("#dataset_list").data("values");
			hideError();
			resetNodeData('gene'); // Reset the expression, pvalues etc.
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
			break;
		case 'mirna':		
			var diseaseData = $("#disease_mirna_list").data("values");
			var locationData = $("#location_mirna_list").data("values");
			var datasetData = $("#dataset_mirna_list").data("values");
			hideError();
			resetNodeData('mirna'); // Reset the expression, pvalues etc.
			$("#disease_mirna_list").empty(); 
			for (key in diseaseData)
			{
				$("#disease_mirna_list").append("<option value=" + key + ">" + diseaseData[key] + "</option>");
			}
			$("#location_mirna_list").empty(); 
			for (key in locationData)
			{
				$("#location_mirna_list").append("<option value=" + key + ">" + locationData[key] + "</option>");
			}
			$("#dataset_mirna_list").empty(); 
			for (key in datasetData)
			{
				$("#dataset_mirna_list").append("<option value=" + key + ">" + datasetData[key] + "</option>");
			}
			enable(['disease_mirna_list','location_mirna_list','dataset_mirna_list']);
			break;
	}
}

function split(val) { return val.split(/\n/); }

function truncOrg(val) { return val.replace(/((\s+\-\s+)([\(\)\-,A-Za-z0-9]*\s*)*)+/,''); }

function extractLast(term) { return split(term).pop(); }

function fixKEGGClass(val) { return val.replace(/;\s+/,' - '); }

function displayError(error)
{				
	$("#infoContainer").html("<span class=\"error\">" + error + "</span>");
	//$('#errorText').text(error);
	//$('#errorText').show("fast");
	//$('#errorContainer').text(error);
	//$('#errorContainer').show("fast");
}

function hideError()
{
	$("#infoContainer").html('');
	//$('#errorText').hide("fast");
	//$('#errorText').text('');
	//$('#errorContainer').hide("fast");
	//$('#errorContainer').text('');
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
		$("#"+id[item]+"[title]")
		.tooltip({ effect: "fade" })
		.dynamic({
			top: { offset: [0, 0] },
			left: { offset: [95, 0] },
			right: { offset: [95, 0] }
		});
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

function log10(x)
{
	return(Math.log(x)/Math.log(10));
}

function log2(x)
{
	return(Math.log(x)/Math.log(2));
}

function isNumber(n)
{
	return(!isNaN(parseFloat(n)) && isFinite(n));
}

function capFirst(str)
{
    return str.charAt(0).toUpperCase() + str.substr(1);
}

function debugMessage(msg)
{
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

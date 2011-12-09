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
						displayError('Ooops! ' + error + ' ' + data.statusText);						
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
				//terms.push(ui.item.value); // add the selected item
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
			beforeSend: function() { $('#loadingCircle').show(); },
			complete: function() { $('#loadingCircle').hide(); },
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
									for (innerkey in data[outerkey])
									{									
										$("#kegg_list").append("<optgroup label=\"" + innerkey + "\">");
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
		enable(['reset_data_button']);

		//Cross-fingers
		initNetwork();
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
						$("#loadingCircle").show();
						disable(['disease_list','location_list','disease_list','reset_data_button']);
					},
					complete: function() { $("#loadingCircle").hide(); },
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
											$("#disease_list").data("values",data[outerkey]); //Cache!					
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
				enable(['reset_data_button']);
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
					$('#loadingCircle').show();
					disable(['disease_list','location_list','dataset_list','reset_data_button']); 
				},
				complete: function() 
				{ 
					$('#loadingCircle').hide();
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
					$('#loadingCircle').show();
					disable(['disease_list','location_list','dataset_list']); 
				},
				complete: function() 
				{ 
					$('#loadingCircle').hide();
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
	
	$("#go_list").empty();
	switch (category) // Is the cell ID in the corresponding part of the page
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

function initNetwork()
{
	var urlBase = initMe();
	var networkJSON;

	$.ajax(
	{
		type: 'POST',
		url: urlBase+'php/control.php',
		data: { network: "network" }, //Some random word for posting...
		beforeSend: function()
		{
			$('#loadingCircle').show();
			//disable(['disease_list','location_list','dataset_list','reset_data_button']); 
		},
		complete: function() 
		{ 
			$('#loadingCircle').hide();
			//enable(['disease_list']); 
		},
		success: function(data)
		{				
			if ($.isEmptyObject(data))
			{
				displayError('The network is empty... :-(');
			}
			else
			{																																
				//networkJSON['dataSchema'] = data['dataSchema'];
				//networkJSON['data'] = data['dataSchema'];
				networkJSON = $.toJSON(data);
			}
		},
		error: function(data,error)
		{
			displayError('Ooops! ' + error + " " + data.responseText);						
		},
		dataType: "json"
	});

	// initialization options
	var options =
	{
		swfPath: "../swf/CytoscapeWeb",
		flashInstallerPath: "../swf/playerProductInstall"
	};
                
	var vis = new org.cytoscapeweb.Visualization("cytoscapeweb",options);
                
	// callback when Cytoscape Web has finished drawing
	vis.ready(function()
	{
		/*// add a listener for when nodes and edges are clicked
		vis
		.addListener("click","nodes",function(event)
		{
			handle_click(event);
		})
		.addListener("click","edges",function(event)
		{
			handle_click(event);
		});

		function handle_click(event)
		{
			var target = event.target;
			 
			clear();
			print("event.group = " + event.group);
			for (var i in target.data)
			{
				var variable_name = i;
				var variable_value = target.data[i];
				print("event.target.data." + variable_name + " = " + variable_value);
			}
		}
		
		function clear()
		{
			document.getElementById("note").innerHTML = "";
		}
	
		function print(msg)
		{
			document.getElementById("note").innerHTML += "<p>" + msg + "</p>";
		}*/
	});

		// draw options
	var draw_options =
	{
		// your data goes here
		network: networkJSON,
		// hide pan zoom
		panZoomControlVisible: false 
	};
		
	vis.draw(draw_options);
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

function resetSearch()
{ 	
	hideError();	
	$("#enter_genes").val('');
	$("#disease_list").empty();
	$("#location_list").empty();
	$("#dataset_list").empty();
	$("#disease_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#location_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#dataset_list").append("<option value=" + "0" + ">" + "Select..." + "</option>");
	$("#disease_list").removeData();
	$("#location_list").removeData();
	$("#dataset_list").removeData();
	disable(['search_button','clear_button','disease_list','location_list','dataset_list','reset_data_button']);
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
	var urlBase = 'http://kupkbvis-dev:81/';
	hideError(); //Hide previous errors
	return(urlBase);
}

function debugMessage(msg)
{
	$('#debugContainer').text(msg);
	$('#debugContainer').show("fast");
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

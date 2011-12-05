function disable(id)
{
	//var getIt = document.getElementById(id);
	//getIt.disabled = true;
	$("#"+id).attr("disabled",true);
}

function enable(id)
{
	$("#"+id).attr("disabled",false);
}

function update(id)
{	
	var urlBase = 'http://kupkbvis-dev:81/';
	
	switch(id)
	{
		case 'species_list':
			var searchText = $("#enter_genes").val();
			if (searchText != '') // If empty then we are at initialization phase 
			{
				var species = $('#species_list').val();			
				var searchJSON = $.toJSON($("#enter_genes").val().split(/\n|\r/));		
				$.ajax(
				{
					type: 'POST',
					url: urlBase+'php/control.php',
					data: { species: species, genes: searchJSON },
					beforeSend: function() { $('#loadingCircle').show() },
					complete: function() { $('#loadingCircle').hide() },
					success: function(data)
					{				
						if ($.isEmptyObject(data))
						{
							displayError('Sorry! Nothing found... :-(');
						}
						else //Enable and fill the rest of the lists
						{																		
							for (var outerkey in data)
							{									
								debugMessage(outerkey);	
								switch(outerkey)
								{
									case 'disease':
									enable('disease_list');
									$("#disease_list").empty();					
									for (var innerkey in data[outerkey])
									{
										$("#disease_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
									}
									case 'location':
									enable('location_list');
									$("#location_list").empty();					
									for (var innerkey in data[outerkey])
									{
										$("#location_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
									}
									case 'dataset':
									enable('dataset_list');
									$("#dataset_list").empty();					
									for (var innerkey in data[outerkey])
									{
										$("#dataset_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
									}
								}
							}
						}
					},
					error: function(data,error)
					{
						displayError('Ooops! ' + error + " " + data.responseText);						
					},
					dataType: "json"
				})
			}
							
			//alert(searchText);
			//AJAX call must be fired to get data for the rest of the lists...		
					
		/*case 'disease_list':  
			//if (control.disabled == true) //Not yet initialized
			if ($("#"+id+).attr("disabled","disabled"))
			{
				enable(control);
			}
		case 'location_list': 
			if (control.disabled == true) //Not yet initialized
			{
				enable(control);
			}
		case 'dataset_list': 
			if (control.disabled == true) //Not yet initialized
			{
				enable(control);
			}*/
	}
}

function search()
{
	var urlBase = 'http://kupkbvis-dev:81/';
		
	hideError(); //Hide previous errors	
	var species = $("#species_list").val();
	if (species == 999999) //Nothing selected
	{		
		displayError('Please select species first!');
		return;
	}
	if ($("#enter_genes").val() != '')
	{
		var searchJSON = $.toJSON($("#enter_genes").val().split(/\n|\r/));		
		$.ajax(
		{
			type: 'POST',
			url: urlBase+'php/control.php',
			data: { species: species, genes: searchJSON },
			beforeSend: function() { $('#loadingCircle').show() },
			complete: function() { $('#loadingCircle').hide() },
			success: function(data)
			{				
				if ($.isEmptyObject(data))
				{
					displayError('Sorry! Nothing found... :-(');
				}
				else //Enable and fill the rest of the lists
				{																		
					for (var outerkey in data)
					{									
						debugMessage(outerkey);	
						switch(outerkey)
						{
							case 'disease':
							enable('disease_list');
							$("#disease_list").empty();					
							for (var innerkey in data[outerkey])
							{
								$("#disease_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
							}
							case 'location':
							enable('location_list');
							$("#location_list").empty();					
							for (var innerkey in data[outerkey])
							{
								$("#location_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
							}
							case 'dataset':
							enable('dataset_list');
							$("#dataset_list").empty();					
							for (var innerkey in data[outerkey])
							{
								$("#dataset_list").append("<option value=" + innerkey + ">" + data[outerkey][innerkey]);
							}
						}
					}
				}
			},
			error: function(data,error)
			{
				displayError('Ooops! ' + error + " " + data.responseText);						
			},
			dataType: "json"
		})
	}
}

function searchAllow()
{
	/*var txt = document.getElementById('enter_genes').value;
	if (txt == '') { disable('search_button'); }
	else { enable('search_button'); }*/
	if ($("#enter_genes").val() == "")
	{
		disable("search_button");
	}
	else
	{
		enable("search_button");
	}
}

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

function debugMessage(msg)
{
	$('#debugContainer').text(msg);
	$('#debugContainer').show("fast");
}

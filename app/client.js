/*global Highcharts*/
/*global $*/

// http://dev.markitondemand.com/MODApis/#doc
// http://www.highcharts.com/docs

// Server expects stringified object
// { operation: <valid operation>, data: <query parameter> }
var appUrl = window.location.origin;
var ws = new WebSocket('wss:' + appUrl.slice(8));

// Server returns stringified object 'event.data'
// { type: <error, lookup, etc.>, message: <content> }
ws.onmessage = function (event) {
	var response = JSON.parse(event.data);
    switch (response.type) {
    	case 'error':
    		console.log('Error: ' + response.message);
    		break;
    	case 'message':
    		console.log('Message: ' + response.message);
    		break;
    	case 'lookup':
    		codeSearchCallback(JSON.parse(response.message));
    		break;
    	case 'add':
    		stockDataCallback(JSON.parse(response.message));
    		break;
    	case 'remove':
    		console.log('Server asked to remove: ' + response.message);
    		if (removeSeries(response.message, false)) {
    			console.log('Series removed');
    			drawChart();
    		} else { console.log('Series not found'); }
    		removeStockBox(response.message);
    		break;
    	case 'load':
    		load(response.message);
    		break;
    	default:
    		console.log('Invalid response type: ' + response.type);
    		break;
    }
};

// Entry format: 
// { name: <stock symbol>,
//	 company: <company name>,
// 	 data: <array of chart data>,
//	 tooltip: { valueDecimals: 2 } }
var seriesList = [];

// Draw chart from seriesList
function drawChart () {
	Highcharts.stockChart('chart', {
		chart: {
			spacingLeft: 30,
			spacingRight: 70
		},
		rangeSelector: { selected: 1 },
		series: seriesList
	});
}

// Load seriesList from server's data
function load (data) {
	seriesList = JSON.parse(data);
	for (var i = 0; i < seriesList.length; i++) {
		$('#stocks').append(
			'<div class="col-xs-12 col-sm-4"><div class="stock-box">' +
					'<p><span class="code">' + seriesList[i].name + '</span><span class="x-button"><strong>x</strong></span></p>' +
				'<p class="name">' + seriesList[i].company + '</p>' +	
			'</div></div>'
		);
	}
	$('.x-button').on('click', function () {
		var xButton = $(this);
		if (removeSeries(xButton.parent().siblings('.name').text(), true)) {
			drawChart();
		}
		// Remove box regardless if series was found.
		xButton.parent().parent().parent().remove();
	});
	drawChart();
}


// Return true if series removed
function removeSeries (company, update) {
	// If update, tell server to remove series.
	if (update) {
		ws.send(JSON.stringify({
			operation: 'remove',
			data: company
		}));
	}
	var ind = -1;
	for (var i = 0; i < seriesList.length; i++) {
		if (seriesList[i].company === company) {
			ind = i;
			break;
		}
	}
	if (ind < 0) { return false; }
	seriesList.splice(ind, 1);
	return true;
}


function removeStockBox (company) {
	$('.name').each(function () {
		if ($(this).text() === company) {
			$(this).parent().parent().remove();
		}
	});
}


// Use data to update chart and state
function stockDataCallback (data) {
	// data format:
	// { name: <stock symbol>,
	//	 company: <company name>,
	// 	 data: <array of chart data>,
	//	 tooltip: { valueDecimals: 2 } }
	
	// Append stock box.
	$('#stocks').append(
			'<div class="col-xs-12 col-sm-4"><div class="stock-box">' +
					'<p><span class="code">' + data.name + '</span><span class="x-button"><strong>x</strong></span></p>' +
				'<p class="name">' + data.company + '</p>' +	
			'</div></div>'
	);
	// Note: this adds multiple click handlers but it's ok - 
	// execution will halt after removeSeries returns false.
	$('.x-button').on('click', function () {
		var xButton = $(this);
		if (removeSeries(xButton.parent().siblings('.name').text(), true)) {
			drawChart();
		}
		// Remove box regardless if series was found.
		xButton.parent().parent().parent().remove();
	});
	
	seriesList.push(data);
	drawChart();
}


// Show search results in dropbox and field user selection
function codeSearchCallback (data) {
	if (data.length === 0) { return; }
	
	var ul = $('.dropdown-menu');
	ul.empty();
	for (var i = 0; i < data.length; i++) {
		ul.append(
			'<li><a href="#">' +
				'<strong><span class="li-code">' + data[i].Symbol + '</span></strong>' + 
				' (' + data[i].Exchange + ') ' + 
				'<span class="li-name">' + data[i].Name + '</span>' +
			'</a></li>'
		);
	}
	
	ul.children().on('click', function () {
		// Display stock box.
		var code = $(this).find('.li-code').text();
		var name = $(this).find('.li-name').text();
		
		// Ask server to add chart data.
		ws.send(JSON.stringify({
			operation: 'add',
			data: { symbol: code, name: name }
		}));
	});
									 
	$('.dropdown-menu').css('display', '');
	$('.dropdown-toggle').dropdown('toggle');
}


// Search button click
$('#search-button').on('click', function (event) {
	var text = $('#text').val();
	if (text.length === 0) { return; }
	ws.send(JSON.stringify({
		operation: 'lookup',
		data: text
	}));
});


// Kill dropdown on text input click
$('#text').on('click', function (event) {
	event.stopPropagation();
	$('.dropdown-menu').css('display', 'none');
});
/*global Highcharts*/
/*global $*/

// http://dev.markitondemand.com/MODApis/#doc
// http://www.highcharts.com/docs

// Entry format: 
// { name: <stock symbol>,
// 	 data: <array of chart data>,
//	 tooltip: { valueDecimals: 2 } }
var seriesList = [];


// Draw chart from seriesList
function drawChart() {
	Highcharts.stockChart('chart', {
		chart: {
			spacingLeft: 30,
			spacingRight: 70
		},
		rangeSelector: { selected: 1 },
		series: seriesList
	});
}


// Return true if series removed
function removeSeries(symbol) {
	var ind = -1;
	for (var i = 0; i < seriesList.length; i++) {
		if (seriesList[i].name === symbol) { 
			ind = i;
			break;
		}
	}
	if (ind < 0) { return false; }
	seriesList.splice(ind, 1);
	return true;
}


// Use data to update chart and state
function stockDataCallback (data, name) {
	var element = data.Elements[0];
	if (!data.Elements[0]) {
		console.log('Error: no stock data found');
		return;
	}
	
	// Append stock box.
	$('#stocks').append(
			'<div class="col-xs-12 col-sm-4"><div class="stock-box">' +
					'<p><span class="code">' + element.Symbol + '</span><span class="x-button"><strong>x</strong></span></p>' +
				'<p class="name">' + name + '</p>' +	
			'</div></div>'
	);
	// Note: this adds mulstiple click handlers but it's ok - 
	// execution will halt after removeSeries returns false.
	$('.x-button').on('click', function () {
		var xButton = $(this);
		if (removeSeries(xButton.siblings('.code').text())) {
			drawChart();
			xButton.parent().parent().parent().remove();
		}
	});
	var dates = data.Dates;
	var values = element.DataSeries.close.values;
	var chartData = [];
	for (var i = 0; i < dates.length; i++) {
		var date = new Date(dates[i]);
		chartData.push([date.getTime(), values[i]]);
	}
	seriesList.push({
		name: element.Symbol,
		data: chartData,
		tooltip: { valueDecimals: 2 }
	});
	
	drawChart();
}


// Show search results in dropbox and field user selection
function codeSearchCallback (data) {
	if (data.Message) { 
		console.log('Stock lookup error: ' + data.Message); 
		return; 
	}
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
		
		// Get chart data.
		var chartDataInput = {
			Normalized: false,
			NumberOfDays: 365*3,
			DataPeriod: 'Day',
			Elements: [
				{ 
					Symbol: code,
					Type: 'price',
					Params: ['c']
				}
			]
		};
		
		function stockDataCallbackTransfer (data) {
			stockDataCallback(data, name);
		}

		$.ajax({
			method: 'GET',
			url: 'https://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp?parameters=' + JSON.stringify(chartDataInput),
			dataType: 'jsonp',
			success: stockDataCallbackTransfer
		});
	});
									 
	$('.dropdown-menu').css('display', '');
	$('.dropdown-toggle').dropdown('toggle');
}


// Search button click
$('#search-button').on('click', function (event) {
	var text = $('#text').val();
	if (text.length === 0) { return; }
	$.ajax({
		method: 'GET',
		url: 'https://dev.markitondemand.com/Api/v2/Lookup/jsonp?input=' + text,
		dataType: 'jsonp',
		success: codeSearchCallback
	});
});


// Kill Bootstrap's displaying dropdown on
// text input click, focus
$('#text').on('click', function (event) {
	event.stopPropagation();
	$('.dropdown-menu').css('display', 'none');
});
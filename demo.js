var map = L.map('map').setView([38, -95], 5)
map.fitBounds([[24, -125], [50, -66]], { padding: [10, 10], animate: false });
map.scrollWheelZoom.disable();
if (L.Browser.touch) {
  map.dragging.disable();
}
map.on('popupopen', function() {
  var hint = document.getElementById('mapHint');
  if (hint) hint.classList.add('hidden');
});

var usBounds = [[24, -125], [50, -66]];
window.addEventListener('resize', function() {
  map.invalidateSize();
  map.fitBounds(usBounds, { padding: [10, 10], animate: false });
});

var StateCSV = loadFile("StateData.csv");
const data = $.csv.toObjects(StateCSV);

// Add basemap
L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)


var legend = L.control({ position: 'bottomright' });
legend.onAdd = function() {
  var div = L.DomUtil.create('div', 'info legend');
  var colors = ['#ffffff', '#bfdfbf', '#7fbf7f', '#3f9f3f', '#008000'];
  div.innerHTML =
    '<div id="legendTitle" style="font-size:12px;font-weight:600;color:#333;margin-bottom:6px;"></div>' +
    '<div style="display:flex;gap:3px;margin-bottom:4px;">' +
      colors.map(function(c) {
        return '<span style="display:block;width:22px;height:12px;background:' + c + ';border:1px solid #ccc;border-radius:2px;opacity:0.85;"></span>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:#666;"><span>Low</span><span>High</span></div>';
  return div;
};

var statesJSON;
var currentChoropleth = null;
// Add GeoJSON
$.getJSON('us-states.json', function (geojson) {
  statesJSON = geojson
  var dataByName = {};
  for(var j=0; j<data.length; j++) {
    dataByName[data[j].State] = data[j];
  }
  for(i=0; i<statesJSON.features.length; i++) {
    var name = statesJSON.features[i].properties["name"];
    if(dataByName[name]) {
      for(var key in dataByName[name]) {
        statesJSON.features[i].properties[key] = dataByName[name][key];
      }
    }
  }
  transformInsets(statesJSON);
  var insets = ['Alaska', 'Hawaii', 'Puerto Rico'];
  statesJSON.features.sort(function(a, b) {
    var aInset = insets.indexOf(a.properties.name) !== -1 ? 1 : 0;
    var bInset = insets.indexOf(b.properties.name) !== -1 ? 1 : 0;
    return aInset - bInset;
  });
  legend.addTo(map);
  changeChoropleth('Avg F', "&#176;F", "Avg. Temp (°F)");
  graph("Avg F", "Average Temperature in Fahrenheit");
})

function transformInsets(geojson) {
  function transformPoint(coord, name) {
    var lon = coord[0], lat = coord[1];
    if (name === 'Alaska') {
      lon = (lon + 159) * 0.25 - 120;
      lat = (lat - 61) * 0.38 + 28;
    } else if (name === 'Hawaii') {
      lon = lon + 50;
      lat = lat + 7;
    } else if (name === 'Puerto Rico') {
      lon = lon - 8.55;
      lat = lat + 13;
    }
    return [lon, lat];
  }
  function mapCoords(c, name) {
    if (typeof c[0] === 'number') return transformPoint(c, name);
    return c.map(function(x) { return mapCoords(x, name); });
  }
  geojson.features.forEach(function(feature) {
    var name = feature.properties.name;
    if (name === 'Alaska' || name === 'Hawaii' || name === 'Puerto Rico') {
      feature.geometry.coordinates = mapCoords(feature.geometry.coordinates, name);
    }
  });
}


function changeChoropleth(valueProp, label, legendTitle) {
  var el = document.getElementById('legendTitle');
  if (el && legendTitle) el.textContent = legendTitle;
  if (currentChoropleth) { map.removeLayer(currentChoropleth); }
  currentChoropleth = L.choropleth(statesJSON, {
    valueProperty: function(feature) { return +feature.properties[valueProp]; },
    scale: ['white', 'green'],
    steps: 5,
    mode: 'q',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        '<div style="font-weight:600;font-size:13px;color:#111;margin-bottom:4px;">' + feature.properties.name + '</div>' +
        '<div style="font-size:13px;color:#2d7a3a;font-weight:500;">' + feature.properties[valueProp] + label + '</div>'
      )
    }
  }).addTo(map)
	
	
}


function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}

function setdata(value) {
	if(value===1) { graph("Avg F", "Average Temperature in Fahrenheit");
					changeChoropleth("Avg F", "°F", "Avg. Temp (°F)"); }
	if(value===2) { graph("Millimeters", "Yearly Millimeters of Precipitation");
					changeChoropleth("Millimeters", " mm/yr", "Precipitation (mm/yr)"); }
	if(value===3) { graph("Density", "Density (People per Square Mile)");
					changeChoropleth("Density", " people/mi²", "Pop. Density (mi²)"); }
	if(value===4) { graph("2025 Median Hourly Wage", "2025 Median Hourly Wage (BLS)");
					changeChoropleth("2025 Median Hourly Wage", " $/hr", "Median Wage ($/hr)"); }
	if(value===5) { graph("2025 Adj Income", "2025 Cost-of-Living Adj. Income");
					changeChoropleth("2025 Adj Income", " adj. $/hr", "Adj. Income ($/hr)"); }
	if(value===6) { graph("2025 Median Home Value", "2025 Median Home Value (Zillow)");
					changeChoropleth("2025 Median Home Value", " $", "Median Home Value"); }
	if(value===7) { graph("Sunny Days", "Clear Days per Year (NOAA avg)");
					changeChoropleth("Sunny Days", " days/yr", "Clear Days/yr"); }
	if(value===8) { graph("Disaster Risk", "Natural Disaster Risk — Expected Annual Loss Score, Dec 2025 (FEMA NRI, higher = more risk)");
					changeChoropleth("Disaster Risk", " /100", "Disaster Risk (EAL)"); }
	if(value===9) { graph("Cost of Living Index", "Cost of Living Index, 2026 Q1 (US avg = 100)");
					changeChoropleth("Cost of Living Index", "", "Cost of Living Index"); }
	if(value===10) { graph("Median Age", "Median Age (2023)");
					 changeChoropleth("Median Age", " yrs", "Median Age (yrs)"); }
	if(value===11) { graph("Pct Urban", "Urban Population % (2020 Census)");
					 changeChoropleth("Pct Urban", "%", "Urban Pop. %"); }
	if(value===12) { graph("College Attainment", "Adults with Bachelor's Degree or Higher (%)");
					 changeChoropleth("College Attainment", "%", "College Attainment %"); }
	if(value===13) { graph("Life Expectancy", "Life Expectancy (years, 2021)");
					 changeChoropleth("Life Expectancy", " yrs", "Life Expectancy (yrs)"); }
	if(value===14) { graph("Violent Crime Rate", "Violent Crime Rate (per 100k, 2022)");
					 changeChoropleth("Violent Crime Rate", "/100k", "Violent Crime/100k"); }
	if(value===15) { graph("Pro Sports Teams", "Major Pro Sports Teams (NFL/NBA/MLB/NHL/MLS)");
					 changeChoropleth("Pro Sports Teams", " teams", "Pro Sports Teams"); }
	if(value===16) { graph("GDP Per Capita", "GDP per Capita, 2025 — Current Dollars (BEA)");
					 changeChoropleth("GDP Per Capita", " $", "GDP per Capita"); }
}
	
var showTopBottom = false;
var showTable = false;
var currentValueField = "Avg F";
var currentValueTitle = "Average Temperature in Fahrenheit";
var currentChartData = [];
var _am5Root = null;

function toggleTableView() {
  showTable = !showTable;
  var btn = document.getElementById('toggleTable');
  var table = document.getElementById('chartdata');
  btn.textContent = showTable ? 'Hide table' : 'Show table';
  btn.classList.toggle('active', showTable);
  table.style.display = showTable ? 'block' : 'none';
  if (showTable) generateDataTable(currentChartData, currentValueField, currentValueTitle);
}

function toggleTopBottomView() {
  showTopBottom = !showTopBottom;
  var btn = document.getElementById('toggleTopBottom');
  var note = document.getElementById('topBottomNote');
  btn.textContent = showTopBottom ? 'Show all states' : 'Show top / bottom 10';
  btn.classList.toggle('active', showTopBottom);
  note.style.display = showTopBottom ? 'block' : 'none';
  graph(currentValueField, currentValueTitle);
}

function graph(valueField, valueTitle) {
  currentValueField = valueField;
  currentValueTitle = valueTitle;

  document.getElementById('chartTitle').textContent = valueTitle.trim();
  document.getElementById('mapLabel').textContent = valueTitle.trim();

  var isGDP = valueField === 'GDP Per Capita';
  var dcNote = document.getElementById('dcOutlierNote');
  if (dcNote) dcNote.style.display = isGDP ? 'block' : 'none';

  var chartData = isGDP ? data.filter(function(d) { return d.State !== 'District of Columbia'; }) : data;
  if (showTopBottom) {
    var sorted = chartData.slice().sort(function(a, b) {
      return parseFloat(a[valueField]) - parseFloat(b[valueField]);
    });
    chartData = sorted.slice(0, 10).concat(sorted.slice(-10));
  }

  if (_am5Root) {
    _am5Root.dispose();
  }

  var root = am5.Root.new("chartdiv");
  _am5Root = root;
  root.setThemes([am5themes_Animated.new(root)]);

  var chart = root.container.children.push(am5xy.XYChart.new(root, {
    panX: false,
    panY: false,
    wheelX: "none",
    wheelY: "none"
  }));

  var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 1 });
  xRenderer.labels.template.setAll({
    rotation: -90,
    centerY: am5.p50,
    centerX: am5.p100,
    fontSize: 11,
    fill: am5.color("#555")
  });
  xRenderer.grid.template.setAll({ stroke: am5.color("#e5e7eb"), strokeOpacity: 1 });

  var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
    categoryField: "State",
    renderer: xRenderer
  }));

  var yRenderer = am5xy.AxisRendererY.new(root, {});
  yRenderer.grid.template.setAll({ stroke: am5.color("#e5e7eb"), strokeOpacity: 1 });
  yRenderer.labels.template.setAll({ fontSize: 11, fill: am5.color("#555") });

  chart.yAxes.push(am5xy.ValueAxis.new(root, {
    renderer: yRenderer
  }));

  var series = chart.series.push(am5xy.ColumnSeries.new(root, {
    xAxis: xAxis,
    yAxis: chart.yAxes.getIndex(0),
    valueYField: valueField,
    categoryXField: "State",
    tooltip: am5.Tooltip.new(root, { labelText: "{categoryX}: {valueY}" })
  }));

  series.columns.template.setAll({
    fill: am5.color("#4287f5"),
    stroke: am5.color("#4287f5"),
    fillOpacity: 0.6,
    strokeOpacity: 0,
    cornerRadiusTL: 2,
    cornerRadiusTR: 2,
    width: am5.percent(80)
  });

  var numericData = chartData.map(function(d) {
    var row = Object.assign({}, d);
    row[valueField] = parseFloat(d[valueField]);
    return row;
  });

  currentChartData = chartData;
  tableSortCol = 'state';
  tableSortDir = 1;
  xAxis.data.setAll(numericData);
  series.data.setAll(numericData);
  series.appear(1000);
  chart.appear(1000, 100);

  if (showTable) generateDataTable(chartData, valueField, valueTitle);
}

var tableSortCol = 'state';
var tableSortDir = 1;

function generateDataTable(chartData, valueField, valueTitle) {
  var sorted = chartData.slice().sort(function(a, b) {
    if (tableSortCol === 'state') {
      return tableSortDir * a.State.localeCompare(b.State);
    } else {
      return tableSortDir * (parseFloat(a[valueField]) - parseFloat(b[valueField]));
    }
  });

  var stateArrow = tableSortCol === 'state' ? (tableSortDir === 1 ? ' ▲' : ' ▼') : '';
  var valueArrow = tableSortCol === 'value' ? (tableSortDir === 1 ? ' ▲' : ' ▼') : '';

  var container = document.getElementById('chartdata');
  var html = '<table><thead><tr>' +
    '<th class="sortable" onclick="sortTable(\'state\',\'' + valueField + '\',\'' + valueTitle + '\')" title="Sort by state">State' + stateArrow + '</th>' +
    '<th class="sortable" onclick="sortTable(\'value\',\'' + valueField + '\',\'' + valueTitle + '\')" title="Sort by value">' + valueTitle + valueArrow + '</th>' +
    '</tr></thead><tbody>';
  for (var i = 0; i < sorted.length; i++) {
    html += '<tr><td class="row-title">' + sorted[i].State + '</td><td>' + sorted[i][valueField] + '</td></tr>';
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function sortTable(col, valueField, valueTitle) {
  if (tableSortCol === col) {
    tableSortDir *= -1;
  } else {
    tableSortCol = col;
    tableSortDir = 1;
  }
  generateDataTable(currentChartData, valueField, valueTitle);
}


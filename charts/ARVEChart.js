/// <reference path="../typings/angular2/angular2.d.ts"/>

angular.module('ARVEChart', [])

.controller( 'ARVECtrl', function ARVEController( $scope, auth, $http, $location, store) {

$scope.ARVEChart = function() {}

var fList= ["data/arveS-2.json", "data/arveS-1.json", "data/arveS.json", "data/arveS1.json", "data/arveS2.json"];

var margin = {top: 20, right: 100, bottom: 30, left: 45},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .6); //,1 : Space between bars

var y = d3.scale.linear()
    .rangeRound([height, 0]);

var catList = ["Vacation", "Billable", "Ti", "Presales", "Sickness", "Training","Idle", "Unknown"];

var color = d3.scale.ordinal()
    .range(["#00C9C9", "#4416D5", "#999999", "#00E400", "#FFD300", "#FF7400", "#FF0000", "#00000"])
    .domain(catList);

var xAxis = d3.svg.axis()
    .scale(x)    
    .orient("top").ticks(1);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".0%"));
    
var xBars = [];

var group; //Group of rectangles which compose one bar

var root, rootP1, rootP2, rootS1, rootS2;

function initNodeData(n) {
  // If the node has children...
  if (n.children) {
    // Calling the children to calculate the sub values
    n.children.forEach(function(d) { initNodeData(d); });
    // Calculating the activity values based on the sum of its children
    n.billable = d3.sum(n.children, function(d){return d.billable;});
    n.vacation = d3.sum(n.children, function(d){return d.vacation;});
    n.presales = d3.sum(n.children, function(d){return d.presales;});
    n.sickness = d3.sum(n.children, function(d){return d.sickness;});               
    n.ti = d3.sum(n.children, function(d){return d.ti;});
    n.idle = d3.sum(n.children, function(d){return d.idle;}); 
    n.unknown = d3.sum(n.children, function(d){return d.unknown;});         
    n.training = d3.sum(n.children, function(d){return d.training;});  
    // Calculating node size based on the sum of its children
    n.size = d3.sum(n.children, function(d) {return d.size;});
  }
  else
  {
    // Setting missing values to 0
    if (n.vacation == undefined) { n.vacation=0; }
    if (n.billable == undefined) { n.billable=0; }
    if (n.presales == undefined) { n.presales=0; }
    if (n.sickness == undefined) { n.sickness=0; }    
    if (n.ti == undefined) { n.ti=0; }
    if (n.idle == undefined) { n.idle=0; }
    if (n.unknown == undefined) { n.unknown=0; }
    if (n.training == undefined) { n.training=0; }
  }

  // Calculating total ETP not on vacation
  n.tot = n.billable + n.presales + n.sickness + n.ti + n.idle + n.unknown + n.training;
  // Calculating vacation percentage
  n.vacSh = n.vacation / n.tot;  
  // Bar position
  n.y0 = 0;
}

function drawChart(node) {
    // Building the bars list
    angular.forEach(node.children, function(d) {xBars = xBars.concat(d);});
    xBars = xBars.concat(node);
    
    // Calculating minimal vacation percentage  
    var minVacSh = d3.min(xBars.map(function(d) {return -d.vacSh;}));
    console.log("minVacSh= "+minVacSh);
    // Setting a scale from y values
    y.domain([minVacSh, 1]);     
    // Displaying yAxis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis); 

    // Setting a scale with all x labels    
    x.domain(xBars.map(function(d) { return d.name; }));
    // Draw y-axis grid lines
    svg.selectAll("line.y")
      .data(y.ticks(10))
      .enter().append("line")
      .attr("class", "y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y)
      .attr("y2", y)
      .style("stroke", "#fff");  
    // Redrawing xAxis
    svg.append("line")
      .attr("class", "y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .style("stroke", "#000");         
    //svg.selectAll("line").select(".y='386'")
      //.attr("y2", y(0))
    //  .style("stroke", "#900");   
    // Building xAxis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + 0+ ")")
      .call(xAxis); 

    // Setting a scale from y values
    y.domain([minVacSh,1]);

    // Building the bars list
    group = svg.selectAll(".groupBar1")
      .data(xBars)
      .enter().append("g")
      .attr("class", "groupBar1")
      .attr("transform", function(d) {return "translate(" + x(d.name) + ",0)"; });  // Position of next bar

    //Building the bars

   // Drawing unknown bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Unknown")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.unknown/d.tot); return y(1-d.unknown/d.tot)}) //Bar length
    .style("fill", color("Unknown"));  
   // Drawing sickness bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Sickness")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.sickness/d.tot); return y(1-d.sickness/d.tot)}) //Bar length
    .style("fill", color("Sickness"));  
   // Drawing idle bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Idle")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.idle/d.tot); return y(1-d.idle/d.tot)}) //Bar length
    .style("fill", color("Idle"));  
   // Drawing ti bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "TI")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.ti/d.tot); return y(1-d.ti/d.tot)}) //Bar length
    .style("fill", color("Ti")); 
   // Drawing training bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Training")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.training/d.tot); return y(1-d.training/d.tot)}) //Bar length
    .style("fill", color("Training"));
   // Drawing presales bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Presales")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.presales/d.tot); return y(1-d.presales/d.tot)}) //Bar length
    .style("fill", color("Presales"));
   // Drawing billable bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Billable")
    .attr("y", function(d) {return d.y0;}) //Bar position
    .attr("height", function(d) {d.y0 += y(1-d.billable/d.tot); return y(1-d.billable/d.tot)}) //Bar length
    .style("fill", color("Billable"));     
   // Drawing vacation bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Vacation")
    .attr("y", function(d) {return y(0);}) //Bar position
    .attr("height", function(d) {d.y0 = y(1-d.vacation/d.tot); return d.y0}) //Bar length
    .style("fill", color("Vacation"));    
    
    
  x.rangeRoundBands([0, width], .8)    
   // Drawing unknown bar     
   group.append("rect")
    .attr("width", x.rangeBand()) //Bar width
    .attr("class", "Vacation")
    .attr("y", function(d) {return y(0);}) //Bar position
    .attr("height", function(d) {d.y0 = y(1-d.vacation/d.tot); return d.y0}) //Bar length
    .style("fill", "green")
    .attr("transform", function(d) {return "translate(-20"  + ",0)"; });  // Position of next bar
}

var svg = d3.select("#ARVEChart").append("svg")
    .attr("class", "chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

getData(2);

function getData(wk) {

d3.json(fList[wk], function(error, root) {
  if (error) throw error;  

  initNodeData(root);
  
  d3.json(fList[wk]), function(error, data) {console.log(data);rootS1=data.filter(true);};
  console.log(root);
  //initNodeData(rootS1);

  drawChart(root);
  // Positionning legend
  var legend = svg.select(".group:last-child").selectAll(".legend")
      .data(catList)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d) { return "translate(" + (x.rangeBand()) / 2 + "," + y((d.y0 + d.y1) / 2) + ")"; });

  // Setting line
  legend.append("line")
      .attr("stroke-width", 2)
      .attr("stroke", "black")
      .attr("x2", 10);

  // Setting text    
  legend.append("text")
      .attr("x", 13)
      .attr("dy", ".35em")
      .text(catList);
  });
  }
  
});

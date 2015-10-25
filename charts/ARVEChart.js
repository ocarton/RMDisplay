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

var catList = ["unknown", "sickness", "idle", "ti", "training",  "presales", "billable", "vacation"];

var color = d3.scale.ordinal()
    .range(["#00000","#FFD300", "#FF0000", "#999999", "#FF7400", "#00E400", "#4416D5", "#00C9C9"])
    .domain(catList);

var transitionDuration = 1000;

var xAxis = d3.svg.axis()
    .scale(x)    
    .orient("top").ticks(1);

var yAxisGroup = null, xAxisGroup = null;
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".0%"));
    
var xBars = [], xBarsS = [], xBarsP = [];

var groupC, groupL, groupR; //Group of rectangles which compose one bar

var root = [];

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
    if (typeof n.vacation === "undefined") { n.vacation=0; }
    if (typeof n.billable === "undefined") { n.billable=0; }
    if (typeof n.presales === "undefined") { n.presales=0; }
    if (typeof n.sickness === "undefined") { n.sickness=0; }    
    if (typeof n.ti === "undefined") { n.ti=0; }
    if (typeof n.idle === "undefined") { n.idle=0; }
    if (typeof n.unknown === "undefined") { n.unknown=0; }
    if (typeof n.training === "undefined") { n.training=0; }
  }

  // Calculating total ETP not on vacation
  n.tot = n.billable + n.presales + n.sickness + n.ti + n.idle + n.unknown + n.training;
  // Calculating vacation percentage
  n.vacSh = n.vacation / n.tot;  
  // Bar position
  n.y0 = 0;
}

function drawChart(week, transition) {
    var t = null;
	  t = svg.transition().duration(transitionDuration);    
    if(transition =="left") {
      // Hiding side bars
      groupL.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)) + ",0) scale(0, 1)"; });  
      groupR.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) +  ",0) scale(0, 1)"; });
    }
    // Securing max values
    if (week < 1) {week = 1};
    if (week > root.length-2) {week = root.length-2};    
    // Building the bars list
    angular.forEach(root[week].children, function(d) {xBars = xBars.concat(d);});
    xBars = xBars.concat(root[week]);
    angular.forEach(root[week+1].children, function(d) {xBarsS = xBarsS.concat(d);});
    xBarsS = xBarsS.concat(root[week+1]);
    angular.forEach(root[week-1].children, function(d) {xBarsP = xBarsP.concat(d);});
    xBarsP = xBarsP.concat(root[week-1]);    
    
    // Calculating minimal vacation percentage  
    var minVacSh0= d3.min(xBars.map(function(d) {return -d.vacSh;}));
    var minVacSh1 = d3.min(xBarsS.map(function(d) {return -d.vacSh;}));
    var minVacSh2 = d3.min(xBarsP.map(function(d) {return -d.vacSh;}));
    var minVacSh = d3.min([minVacSh1, minVacSh0, minVacSh2]);        
    // Setting a scale from y values
    y.domain([minVacSh, 1]);     
    // Displaying yAxis
    if (!yAxisGroup) {
      yAxisGroup = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
      // Draw y-axis grid lines
      svg.selectAll("line.y").data(y.ticks(10)).enter().append("line").filter(function(d){return d != 0 && d !=1;})
        .attr("class", "y")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y).attr("y2", y)
        .style("stroke", "#fff");         
    }
    else {
      t.select(".y Axis").call(yAxis);
      t.select("line.y")
    }    
    
    // Setting a scale with all x labels    
    x.domain(xBars.map(function(d) { return d.name; }));
 
    // Redrawing xAxis
    svg.select("g").selectAll("line.x").data("xAxis").enter().append("line")
      .attr("class", "x")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", y(0)).attr("y2", y(0))
      .style("stroke", "#000");         
    // Building xAxis
     if (!xAxisGroup) {
      xAxisGroup = svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);
    }
    else {
      t.select(".x Axis").call(xAxis);
    } 

    // Building the bars lists
    groupC = svg.selectAll(".barCenter")
      .data(xBars)
      .enter().append("g")
      .attr("class", "barCenter")
      .attr("opacity", 0)
      .attr("transform", function(d) {return "translate(" + x(d.name) + ",0)"; });  // Position of next bar
    groupL = svg.selectAll(".barLeft")
      .data(xBarsP)
      .enter().append("g")
      .attr("class", "barLeft")
      .attr("transform", function(d) {return "translate(" + x(d.name)+ ",0) scale(0, 1)"; });  // Position of next bar
    groupR = svg.selectAll(".barRight")
      .data(xBarsS)
      .enter().append("g")
      .attr("class", "barRight")
      .attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) + ",0) scale(0,1) "; });  // Position of next bar

   //Building the bars
   angular.forEach(catList, function(c){
      groupC.append("rect")
        .attr("width", x.rangeBand()) //Bar width
        .attr("class", c)
        .attr("y", function(d) {return d.y0;}) //Bar position
        .attr("height", function(d) {d.y0 += y(1-d[c]/d.tot); return y(1-d[c]/d.tot)}) //Bar length
        .style("fill", color(c));       
   });
   var legendY1 = [], legendY2 = [];   
   var lastLegendPos = -5;
   var legPos, lastCat = ""; 
   angular.forEach(catList, function(c){
      groupR.append("rect")
        .attr("width", x.rangeBand()/2) //Bar width
        .attr("class", c)
        .attr("opacity", 0.4)          
        .attr("y", function(d) {return d.y0;}) //Bar position
        .attr("height", function(d) {
            legPos = d.y0 + y(1-d[c]/d.tot)/2;              
            legendY2[c] = d3.max([10+lastLegendPos, legPos]); 
            legendY1[c] = legPos;         
            if (c != lastCat) {
              if (lastCat != "") {lastLegendPos = legendY2[lastCat];}
              lastCat=c; };
          console.log("c="+c+" lastLegendPos="+lastLegendPos+" y="+ (d.y0 + y(1-d[c]/d.tot)/2)+" max="+legendY2[c]);
            d.y0 += y(1-d[c]/d.tot);
            return y(1-d[c]/d.tot)})
        .style("fill", color(c));       
   });   
   angular.forEach(catList, function(c){
      groupL.append("rect")
        .attr("width", x.rangeBand()/2) //Bar width
        .attr("class", c)
        .attr("opacity", 0.4)        
        .attr("y", function(d) {return d.y0;}) //Bar position
        .attr("height", function(d) {
            d.y0 += y(1-d[c]/d.tot);
            return y(1-d[c]/d.tot)}) //Bar length
        .style("fill", color(c));  
   });   
   // Positionning legend
   var legend = svg.select(".barRight:last-child").selectAll(".legend")
        .data(catList)
        .enter().append("g")
        .attr("class", "legend")
        .attr("opacity", 1)        
        .attr("transform", function(d) {return "translate(" + (x.rangeBand()/2) + "," + legendY2[d] + ")"; });
  
   // Setting line
   legend.append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("x1", 0).attr("x2", 10)
        .attr("y1", function(d) {return (legendY1[d]-legendY2[d]);}).attr("y2", 0);        

  
   // Setting text    
   legend.append("text")
        .attr("x", 13)
        .attr("dy", ".35em")
        .attr("opacity",1)        
        .text(function(d) {return d;});
        

   groupC.transition().duration(transitionDuration).attr("opacity", 1).each("end", function(e, i){
      groupL.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)-x.rangeBand()/2) + ",0) scale(1, 1)"; });  // Position of next bar
      groupR.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) +  ",0) scale(1, 1)"; });
   });   
}

var svg = d3.select("#ARVEChart").append("svg")
    .attr("class", "chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json(fList[0], function(error, data0) {
  if (error) throw error;  
  root[0] = data0;
  initNodeData(root[0]);
  d3.json(fList[1], function(error, data1) {
    if (error) throw error;  
    root[1] = data1;    
    initNodeData(root[1]);
    d3.json(fList[2], function(error, data2) {
      if (error) throw error;  
      root[2] = data2;    
      initNodeData(root[2]);
      d3.json(fList[3], function(error, data3) {
        if (error) throw error;  
        root[3] = data3;    
        initNodeData(root[3]);
        d3.json(fList[4], function(error, data4) {
          if (error) throw error;  
          root[4] = data4;    
          initNodeData(root[4]);
  
          drawChart(2);
          });      
        });      
      });      
    });      
  });
});

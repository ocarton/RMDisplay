/// <reference path="../typings/angular2/angular2.d.ts"/>
angular.module('ARVEWTRChart', [])

.controller( 'ARVEWTRCtrl', function ARVEWTRController( $scope, auth, $http, $location, store) {

$scope.checkVac = {value : false}

$scope.checkUnknown = {value : false}

$scope.radARVEVisual = { value: "Graph" }

$scope.displayCat = function () {
  loadBarsData();  
}

$scope.displayARVEVisual = function () {
    if ($scope.radARVEVisual.value == "Graph") {
      d3.select("#ARVEWTRChart").selectAll("#WTRChart").attr("style", "display: inline;")
      d3.select("#ARVEWTRChart").selectAll("#WTRTable")
      .attr("style","display: none;")
    loadBarsData();    
  }
  else {
      d3.select("#ARVEWTRChart").selectAll("#WTRChart").attr("style", "display: none;")
      d3.select("#ARVEWTRChart").selectAll("#WTRTable")
      .attr("style","display: inline;")
    buildTable();
  }
}

$scope.ARVEChart = function() {}

var fList= ["data/arveP2.json", "data/arveP1.json", "data/arveS.json", "data/arveS1.json", "data/arveS2.json"];

var graph = {height: 800, width:1000},
    margin = {top: 60, right: 65, bottom: 30, left: 95},
    width = graph.width - margin.left - margin.right,
    height = graph.height - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width*.9], .7 ,0.4); //,1 : Space between bars
var y = d3.scale.linear()
    .range([height, 0]);
    
var yAxisGroup = null, xAxisGroup = null;
var xAxis = d3.svg.axis()
    .scale(x)    
    .orient("top").ticks(1);
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left").ticks(10)
    .tickFormat(d3.format(".0%"));
    
var curWeek = 3;

var catList = ["unknown", "sickness", "management", "idle", "ti", "training",  "presales", "billable", "vacation"];

var color = d3.scale.ordinal()
    .range(["#00000","#FFD300", "#CCCCCC", "#FF0000", "#777777", "#FF7400", "#00E400", "#4416D5", "#00C9C9"])
    .domain(catList);
var barOpacity=.6, sideBarsWidth=1;

var t, t1, transitionDuration = 750;

var root = [], activeGroup = [], newGroupArray = [];
var xBars = [], xBarsS = [], xBarsP = [];
var groupC, groupL, groupR, legend; //Group of rectangles which compose one bar

var title = d3.select("#ARVEWTRChart").select("#WTRTitle"); 

//This is where we include the graph
var svg = d3.select("#ARVEWTRChart").select("#WTRChart").append("svg")
    .attr("class", "chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.attr("viewbox", "0 0 "+ width + margin.left + margin.right + " " + height + margin.top + margin.bottom)     
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

//We add a < and a > on the left and right of the graph to access previous and next period
var prevPeriod = d3.select("#ARVEWTRChart").select("#WTRChart").append("text")
    .attr("class", "navBtn")
    .attr("x", 20)
    .attr("y", graph.height / 2+30)
    .on("click", slideLeft)
    .text("‹");
var nextPeriod = d3.select("#ARVEWTRChart").select("#WTRChart").append("text")
    .attr("class", "navBtn")
    .attr("x", graph.width-50)
    .attr("y", graph.height / 2+30)
    .on("click", slideRight)
    .text("›");

var table = d3.select("#ARVEWTRChart").select("#WTRTable").append("table")
    .attr("class", "table-bordered table-striped table-responsive") 
    .attr("width", width -100) //+ margin.left + margin.right)
    .attr("height", height-100) /* + margin.top + margin.bottom*/

function semText(week) {
  if (week==2){return "W"}
  else if (week<2){return "W"+(week-2)}
  else {return "W+"+(week-2)}
}

// defining graph title
function graphTitle () {
  return "ARVE WTR week "+semText(curWeek-1)+" to "+semText(curWeek+1)
}

// function for the y grid lines
function make_y_axis() {
    return d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(40)
        .tickSize(-width*.9, 0, 0)  
        .tickFormat("")              
}

//-------------------------------------------------------------------------------
// This function sets up the initial values for the bars by
// calculating the parent values based on its children sums
//-------------------------------------------------------------------------------
function initNodeData(n) {
  // If the node has children...
  if (n.children) {
    // Calling the children to calculate the sub values
    n.children.forEach(function(d) { initNodeData(d); });
    // Calculating the activity values based on the sum of its children
    angular.forEach(catList, function(c){
      n[c] = d3.sum(n.children, function(d){return d[c]})
    });
    // Calculating node size based on the sum of its children
    n.size = d3.sum(n.children, function(d) {return d.size;});
  }
  else
  {
    angular.forEach(catList, function(c){
      if (typeof n[c] === "undefined") { n[c]=0; }
      // Setting missing values to 0
    });    
  }

  // Calculating total ETP not on vacation
  n.tot = n.billable + n.presales + n.sickness + n.ti + n.idle + n.unknown + n.training + n.management;
  // Calculating vacation percentage
  n.vacSh = n.vacation / n.tot;  
  // Bar position
  n.y0 = 0;
}

//-------------------------------------------------------------------------------
// This is the function which draws the bars and the legend. It updates the
// position of the legend based on the position of the last bar.
//-------------------------------------------------------------------------------
function loadBarsData() {
    // Setting new title
    title
      .html(graphTitle());
  
    t = svg.transition().duration(transitionDuration)
        .each("end", function () {t1 = d3.select(this).transition().duration(transitionDuration)});
  
    // Building the bars list
    console.log("Week index="+curWeek);
    xBars = [];
    angular.forEach(activeGroup[curWeek].children, function(d) {xBars = xBars.concat(d);});
    xBars = xBars.concat(activeGroup[curWeek]); 
    angular.forEach(xBars, function(d){d.y0=0;});     

    xBarsS = [];
    angular.forEach(activeGroup[curWeek+1].children, function(d) {xBarsS = xBarsS.concat(d);});
    xBarsS = xBarsS.concat(activeGroup[curWeek+1]);
    angular.forEach(xBarsS, function(d){d.y0=0;});     
    
    xBarsP = [];    
    angular.forEach(activeGroup[curWeek-1].children, function(d) {xBarsP = xBarsP.concat(d);});
    xBarsP = xBarsP.concat(activeGroup[curWeek-1]);
    angular.forEach(xBarsP, function(d){d.y0=0;});     

    // Calculating minimal vacation percentage  
    var minVacSh0= d3.min(xBars.map(function(d) {return -d.vacSh;}));
    var minVacSh1 = d3.min(xBarsS.map(function(d) {return -d.vacSh;}));
    var minVacSh2 = d3.min(xBarsP.map(function(d) {return -d.vacSh;}));
    var minVacSh = d3.min([minVacSh1, minVacSh0, minVacSh2]);    

    var displayList = catList.slice();    
    // Removing vacations if box is unchecked 
    if ($scope.checkVac.value == false) {
      minVacSh = 0
      var posVac = displayList.indexOf("vacation");
      if (posVac > -1) {displayList.splice(posVac, 1)}
    }      

    //Removing unknowns if checkbox is checked
    if ($scope.checkUnknown.value != false) {
      var posUnknown = displayList.indexOf("unknown");
      if (posUnknown > -1) {displayList.splice(posUnknown, 1)}
    }       

      // Setting a scale from x and y values
      y.domain([minVacSh, 1]);
      x.domain(xBars.map(function(d) {return d.name; }))
     
      //console.log("Ratio de vacance WTR le plus élevé="+minVacSh);
  
      // Redisplaying yAxis and lines
      t1 = t.transition();
      t.selectAll(".y.axis").call(yAxis);    
      t.selectAll(".y.grid").call(make_y_axis());         
      svg.selectAll(".y.grid").selectAll("line").filter(function(d){return (Math.round(d*10) == d*10);})
      .style("stroke", "#000");                    
      
      // Setting a scale with all x labels    
      t.selectAll(".x.axis").call(xAxis);  
  
      //Building or rebuilding the bars
      var legendY1 = [], legendY2 = [];   
      var lastLegendPos = -5;
      var legPos, lastCat = ""; 

      groupR = svg.selectAll(".barRight")
        .data(xBarsS, function(d){return d.name});
      groupR
        .enter().append("g")
        .attr("class", "barRight")
        .attr("opacity", 0)
        .attr("id", function (d) { return d.name })
        //.on("click", slideLeft)
        .attr("transform", function (d) { return "translate(" + (x(d.name) + x.rangeBand()) + ",0) scale(0, 1)"; });  // Position of next bar

      groupR
        .on("click", drillDown)
      svg.select("#" + xBars[xBars.length - 1].name + ".barRight").on("click", drillUp);

      groupR.exit().remove();     
  
      t.selectAll(".barRight")
        .attr("opacity", 1)       
        .attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) +  ",0) scale(1, 1)"; }) // Position of next bar
      
      groupR.selectAll("rect.unknown").attr("y", function(d){d.y0=0;});
      
      groupR.each(function(d) {
        d.catSum = d.tot;         
        if ($scope.checkUnknown.value != false) {d.catSum = d.catSum-d.unknown;}
      });          
  
      rect = groupR.selectAll("rect")
        .data(displayList, function(d){return(d)});
      rect
        .enter().append("rect")
        .attr("opacity", 0)      
        .attr("class", function(d) {return d;})
        .style("fill", function(d) {return color(d);});
      rect.exit().remove();        
  
      angular.forEach(displayList, function(c){
          groupR.each(function(parDat) {
            t.selectAll("#"+parDat.name+".barRight").selectAll("rect."+c)
                 // .attr("opacity", barOpacity)            
                  .attr("width", x.rangeBand()*sideBarsWidth) //Bar width 
                  .attr("y", function(d) {return parDat.y0;}) //Bar position
                  .attr("height", function (d) {
                      if (c == "billable") { parDat.midBar = parDat.y0 + y(1 - parDat[c] / parDat.catSum / 2)+30 }
                  //legPos defines position of the legend based on position of the bar
                  legPos = parDat.y0 + y(1-parDat[c]/parDat.catSum)/2;              
                  legendY2[c] = d3.max([20+lastLegendPos, legPos]); 
                  legendY1[c] = legPos;        
                  if (c != lastCat) {
                    if (lastCat != "") {lastLegendPos = legendY2[lastCat];}
                    lastCat=c;
                    }
                  parDat.y0 += y(1-parDat[c]/parDat.catSum);
                  return y(1 - parDat[c] / parDat.catSum)
                  });
            t1.selectAll("#" + parDat.name + ".barRight").selectAll("rect." + c)//.transition().duration(transitionDuration)
                  .attr("opacity", barOpacity)
            if (c == "billable") {
                svg.selectAll("#" + parDat.name + ".barRight").selectAll("g.arve").remove()
                var value = svg.selectAll("#" + parDat.name + ".barRight")
                  .append("g")
                  .attr("class", "arve")
                  .attr("opacity", 1)
                  .attr("transform", function (d) { return "translate(0," + parDat.midBar + ")"; })
                //adding the white 'shadow' behind the text
                /*             value
                               .append("text")
                                 .attr("x", 3)
                                 .attr("dy", ".35em")
                                 .attr("font-size", "1.4em")                  
                                 .attr("opacity",1)   
                                 .attr("class", "shadow")                         
                                 .text(function(d){return d3.format(".2%")(parDat[c]/parDat.catSum)});*/
                //adding the text
                value
                  .append("text")
                    .text(function (d) { return d3.format(".1%")(parDat[c] / parDat.catSum) })
                    .attr("x", function (d) { return x.rangeBand() * sideBarsWidth / 2 - this.getComputedTextLength() / 2; })//3)
                    //.attr("transform", "rotate(-45)")
                    .attr("dy", ".35em")
                    .attr("font-size", "1.4em")
                    .style("fill", "white") // remove this line to have black text
                    .attr("opacity", 0);
                t1.selectAll("#" + parDat.name + ".barRight").selectAll("g.arve").select("text")
                  .attr("opacity", 1);
            }
          });
      });      
      
      
      
      groupC = svg.selectAll(".barCenter")
        .data(xBars, function(d){return d.name});
        
      groupC
        .enter().append("g")
        .attr("class", "barCenter")
        .attr("id", function(d){return d.name})
        .attr("opacity", 0) 
        .attr("transform", function(d) {return "translate(" + x(d.name)+ ",0) scale(1, 1)"; });
      groupC.exit().remove();
      
      groupC.on("click", drillDown); 
      svg.select("#"+xBars[xBars.length-1].name+".barCenter").on("click", drillUp);         

      t.selectAll(".barCenter")
        .attr("opacity", 1)       
        .attr("transform", function(d) {return "translate(" + x(d.name)+ ",0) scale(1, 1)"; })  // Position of next bar

      groupC.selectAll("rect.unknown").attr("y", function(d){d.y0=0;});  

      rect = groupC.selectAll("rect")
        .data(displayList, function(d){return(d)});
      rect
        .enter().append("rect")
        .attr("opacity", 0)
        .attr("class", function(d) {return d;})
        .style("fill", function(d) {return color(d);});
      rect.exit().remove();

      svg.selectAll(".barCenter").selectAll(".legend").remove();

      groupC.each(function(d) {
        d.catSum = d.tot;         
        if ($scope.checkUnknown.value != false) {
          d.catSum = d.catSum-d.unknown;
        } 
      });

      angular.forEach(displayList, function(c){
          groupC.each(function (parDat) {
            t.selectAll("#"+parDat.name+".barCenter").selectAll("rect."+c)
                  .attr("width", x.rangeBand()) //Bar width        
                  .attr("y", function(d) {return parDat.y0;}) //Bar position
                  .attr("height", function(d) {
                      if (c=="billable") {parDat.midBar = parDat.y0+y(1-parDat[c]/parDat.catSum/2)}
                      parDat.y0 += y(1-parDat[c]/parDat.catSum);
                      return y(1-parDat[c]/parDat.catSum)});
            t1.selectAll("#" + parDat.name + ".barCenter").selectAll("rect." + c)
                  .attr("opacity", barOpacity);
            if (c == "billable") {
                svg.selectAll("#" + parDat.name + ".barCenter").selectAll("g.arve").remove()
              var value = svg.selectAll("#" + parDat.name + ".barCenter")
                .append("g")
                .attr("class", "arve")
                .attr("opacity", 1)
                .attr("transform", function(d) {return "translate(0," + parDat.midBar + ")"; })                
              //adding the white 'shadow' behind the text
 /*             value
                .append("text")
                  .attr("x", 3)
                  .attr("dy", ".35em")
                  .attr("font-size", "1.4em")                  
                  .attr("opacity",1)   
                  .attr("class", "shadow")                         
                  .text(function(d){return d3.format(".2%")(parDat[c]/parDat.catSum)});*/
              //adding the text
              value
                .append("text")
                .text(function (d) { return d3.format(".1%")(parDat[c] / parDat.catSum) })
                .attr("x", function (d) { return x.rangeBand() * sideBarsWidth / 2 - this.getComputedTextLength() / 2; })
                .attr("dy", ".35em")
                .attr("font-size", "1.4em")                   
                .style("fill", "white") // remove this line to have black text
                .attr("opacity",0);  

              t1.selectAll("#" + parDat.name + ".barCenter").selectAll("g.arve").select("text")
                .attr("opacity", 1);
            }      
          });
      });

      groupL = svg.selectAll(".barLeft")
        .data(xBarsP, function(d){return d.name});
      groupL
        .enter().append("g")
        .attr("class", "barLeft")
        .attr("id", function (d) { return d.name })
        .attr("opacity", 0)
        .attr("transform", function (d) { return "translate(" + x(d.name) + ",0) scale(0, 1)"; })  // Position of next bar      
         //.on("click", slideRight);
      groupL
        .on("click", drillDown);
      svg.select("#" + xBars[xBars.length - 1].name + ".barLeft").on("click", drillUp);

      groupL.exit().remove();
  
      t.selectAll(".barLeft")
        .attr("opacity", 1)       
        .attr("transform", function(d) {return "translate(" + (x(d.name)-x.rangeBand()*sideBarsWidth) + ",0) scale(1, 1)"; });  // Position of next bar      
      
      groupL.selectAll("rect.unknown").attr("y", function(d){d.y0=0;});  
      
      groupL.each(function(d) {
        d.catSum = d.tot;         
        if ($scope.checkUnknown.value != false) {d.catSum = d.catSum-d.unknown;}
      });      
  
      rect = groupL.selectAll("rect")
        .data(displayList, function(d){return(d)});
      rect
        .enter().append("rect")
        .attr("opacity", 0)      
        .attr("class", function(d) {return d;})
        .style("fill", function(d) {return color(d);});
      rect.exit().remove();
  
      angular.forEach(displayList, function(c){
          groupL.each(function(parDat) {
            t.selectAll("#"+parDat.name+".barLeft").selectAll("rect."+c)
                  .attr("width", x.rangeBand()*sideBarsWidth) //Bar width 
                  .attr("y", function(d) {return parDat.y0;}) //Bar position
                  .attr("height", function (d) {
                      if (c == "billable") { parDat.midBar = parDat.y0 + y(1 - parDat[c] / parDat.catSum / 2)-30 }
                      parDat.y0 += y(1-parDat[c]/parDat.catSum);    
                      return y(1 - parDat[c] / parDat.catSum)
                  });
            t1.selectAll("#" + parDat.name + ".barLeft").selectAll("rect." + c)
                  .attr("opacity", barOpacity)
            if (c == "billable") {
                svg.selectAll("#" + parDat.name + ".barLeft").selectAll("g.arve").remove()
                var value = svg.selectAll("#" + parDat.name + ".barLeft")
                  .append("g")
                  .attr("class", "arve")
                  .attr("opacity", 1)
                  .attr("transform", function (d) { return "translate(0," + parDat.midBar + ")"; })
                //adding the white 'shadow' behind the text
                /*             value
                               .append("text")
                                 .attr("x", 3)
                                 .attr("dy", ".35em")
                                 .attr("font-size", "1.4em")                  
                                 .attr("opacity",1)   
                                 .attr("class", "shadow")                         
                                 .text(function(d){return d3.format(".2%")(parDat[c]/parDat.catSum)});*/
                //adding the text
                value
                  .append("text")
                    .text(function (d) { return d3.format(".1%")(parDat[c] / parDat.catSum) })
                    .attr("x", function (d) { return x.rangeBand() * sideBarsWidth / 2 - this.getComputedTextLength() / 2; })
                    .attr("dy", ".35em")
                    .attr("font-size", "1.4em")
                    .style("fill", "white") // remove this line to have black text
                    .attr("opacity", 0);

                t1.selectAll("#" + parDat.name + ".barLeft").selectAll("g.arve").select("text")
                  .attr("opacity", 1);

            }
          });
      });
  
      //Making solid all bars for the total (right group of bars)
      t1.selectAll("#"+xBarsS[xBarsS.length-1].name+".barRight").selectAll("rect").attr("opacity", 1)
      t1.selectAll("#"+xBarsS[xBarsS.length-1].name+".barCenter").selectAll("rect").attr("opacity", 1)
      t1.selectAll("#"+xBarsS[xBarsS.length-1].name+".barLeft").selectAll("rect").attr("opacity", 1)      
      // Positionning legend
      legend = svg.select("#"+xBarsS[xBarsS.length-1].name+".barRight").selectAll(".legend")
            .data(displayList, function(d){return(d)})
      legend.exit().remove();
      var legEl = legend
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d) {return "translate(" + (x.rangeBand()*sideBarsWidth+20) + "," + legendY2[d] + ")"; })
            .attr("opacity", 0); 
      legEl
              .append("text")
                .attr("x", 13)
                .attr("dy", ".35em")
                .attr("font-size", "1.4em")                   
                .attr("opacity",1)        
                .text(function(d) {return d});
      legEl
            .append("line")
              .attr("stroke-width", 2)
              .attr("stroke", "black")
              .attr("opacity", 1)
              .attr("x1", -20).attr("x2", 10)
              .attr("y1", function(d) {return (legendY1[d]-legendY2[d]);}).attr("y2", 0);        
              
      t.select("#"+xBarsS[xBarsS.length-1].name+".barRight").selectAll(".legend")
          .attr("opacity", 1)      
          .attr("transform", function(d) {return "translate(" + (x.rangeBand()*sideBarsWidth+20) + "," + legendY2[d] + ")"; });

      // Setting line
      t.select("#"+xBarsS[xBarsS.length-1].name+".barRight").selectAll(".legend line")
            .attr("x1", -20).attr("x2", 10)
            .attr("y1", function(d) {return (legendY1[d]-legendY2[d]);}).attr("y2", 0);        
}

//-------------------------------------------------------------------------------
// This is the function for the initial display of the graph.
//-------------------------------------------------------------------------------
var drawChart = function () {
	//  t = svg.transition().duration(transitionDuration);  
   
    // Draw the y Grid lines
    svg.append("g")
        .attr("class", "y grid")
        .call(make_y_axis()
        );

    // Drawing yAxis
    yAxisGroup = svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    // Drawing xAxis
    xAxisGroup = svg.append("g")
      .attr("class", "x axis")
      .call(xAxis);

    activeGroup = root;
    loadBarsData();

    //Hiding next period symbol
    nextPeriod.attr("style", "display: none;");
    

    /*groupC.attr("transform", function(d) {return "translate(" + x(d.name) + ",0)"; });  // Position of next bar
    groupL.attr("transform", function(d) {return "translate(" + x(d.name)+ ",0) scale(0, 1)"; });  // Position of next bar
    groupR.attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) + ",0) scale(0,1) "; });  // Position of next bar

   groupC.transition().duration(transitionDuration).attr("opacity", 1).each("end", function(e, i){
      groupL.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)-x.rangeBand()*sideBarsWidth) + ",0) scale(1, 1)"; });  // Position of next bar
      groupR.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) +  ",0) scale(1, 1)"; });
   }); */  
}

//-------------------------------------------------------------------------------
// This function creates a table with all the data for the give week and the 
// level of detail selected
//-------------------------------------------------------------------------------
function buildTable() {

    $scope.tableS0 = xBarsP;
    $scope.tableS1 = xBars;
    $scope.tableS2 = xBarsS;
}

//-------------------------------------------------------------------------------
// The following three functions slide the bars to the right or to the left and
// update the values with the corresponding weeks.
//-------------------------------------------------------------------------------
function slideLeft() {
  slideChart("left");    
};

function slideRight() {
  slideChart("right");    
};

function slideChart(transition) {
  console.log("Moving " + transition + " to next period");

  if(transition =="right") {
    // Securing max values      
    if (curWeek < root.length-2) {
      curWeek = curWeek+1;
      loadBarsData();        
      // Moving bars
      groupL.selectAll("rect")
        .attr("transform", function(d) {return "translate("+ x.rangeBand()*sideBarsWidth +",0)  scale("+1/sideBarsWidth+", 1)"; });
      //t.selectAll(".barCenter").selectAll("rect")            
      groupC.selectAll("rect")
        .attr("transform", function(d) {return "translate(" + (x.rangeBand()) + ",0) scale("+sideBarsWidth+", 1)"; });
      groupR.selectAll("rect")
        .attr("transform", function (d) { return "translate(" + (x.rangeBand() * sideBarsWidth) + ",0) scale(0, 1)"; })
      prevPeriod.attr("style", "display: inline;")
      if (curWeek >= root.length - 2) { nextPeriod.attr("style", "display: none;") }
    };    
  }
  else if(transition =="left") {
    // Securing min values      
    if (curWeek > 1) {
      curWeek = curWeek-1; 
      loadBarsData();
      nextPeriod.attr("style", "display: inline;")
      if (curWeek <= 1) { prevPeriod.attr("style", "display: none;") }
      // Moving bars
      /*groupL.selectAll("rect")
        .attr("transform", function(d) {return "translate(" + (0) + ",0)  scale(0, 1)"; });    
      groupC.selectAll("rect")
        .attr("transform", function(d) {return "translate(" + (-x.rangeBand()*sideBarsWidth) + ",0) scale("+sideBarsWidth+", 1)"; });
      groupR.selectAll("rect")
        .attr("transform", function (d) { return "translate(" + (-x.rangeBand()) + ",0) scale(" + 1 / sideBarsWidth + ", 1)"; })
     */   
      };        
    };  
  /*groupR.selectAll("rect")
      .transition().duration(0)
      .each("end", function(e, i){
          groupL.selectAll("rect").transition().duration(transitionDuration)
            .attr("transform", function(d) {return "translate(" + (0) + ",0)  scale(1, 1)"; });    
          groupC.selectAll("rect").transition().duration(transitionDuration)
            .attr("transform", function(d) {return "translate(" + (0) + ",0) scale(1, 1)"; });
          groupR.selectAll("rect").transition().duration(transitionDuration)
            .attr("transform", function(d) {return "translate(" + (0) + ",0) scale(1, 1)"; });        
  }); */
  svg.selectAll("rect")
    .attr("transform", function (d) { return "translate(" + (0) + ",0)  scale(1, 1)"; });
}

//-------------------------------------------------------------------------------
// Functions which drill down or drill up the selected group data
//-------------------------------------------------------------------------------
function drillUp(bar) {
  console.log("Drilling up "+bar.name);
  // Blocking drilling up on the top group
  if (bar.name != root[0].name) {

    svg.select("#"+xBarsS[xBarsS.length-1].name+".barRight").selectAll(".legend").remove();
  
    activeGroup = root;
    newGroupArray = [];    
    angular.forEach(root, function(d){
      getNode(d, bar.name); 
    });
    activeGroup = newGroupArray;  
    loadBarsData();    
  }
};

function getNode (tree, name) {
    if (tree.children) {
        tree.children.forEach(function (d) {
          if (d.name ==name) {newGroupArray = newGroupArray.concat(tree)}  
          else {return getNode(d, name)}         
        })
    }
    else {return null;
    }    
}

function drillDown(bar) {
  console.log("Drilling down "+bar.name);
  newGroupArray = [];
  angular.forEach(activeGroup, function(d) {
    newGroupArray = newGroupArray.concat(d.children.filter(function(d){return(d.name == bar.name)}));
  });
  if (newGroupArray[0].children){
    activeGroup = newGroupArray;  
    loadBarsData();
  }   
};

//-------------------------------------------------------------------------------
// Main function. It loads the data
//-------------------------------------------------------------------------------
function loadData() {
    console.log("Reloading WTR data")
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
 
        drawChart();
 
        // Those data are not required at the beginning,
        // so they are loaded simultaneously as the drawing of the chart
        // to save some time                
        d3.json(fList[0], function(error, data0) {
          if (error) throw error;  
          root[0] = data0;
          initNodeData(root[0]);
        });
        d3.json(fList[1], function(error, data1) {
          if (error) throw error;  
          root[1] = data1;    
          initNodeData(root[1]);
          });
        });      
      });      
    })
  }  

/*function reloadGraph(){
  svg.selectAll("g").remove();
  drawChart();
}*/

//drawChart(function (d){return loadData();})  
loadData();
//drawChart();  
//setInterval(loadData,100000); 
  
});

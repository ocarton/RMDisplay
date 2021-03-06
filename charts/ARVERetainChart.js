﻿/// <reference path="../typings/angular2/angular2.d.ts"/>
angular.module('ARVERetainChart', ['ngCookies'])

.controller('ARVERetainCtrl', function ARVERetainController($scope, $cookies, auth, $http, $location, store) {

    //Setup of the radio button values
    $scope.radARVEVisual = { value: "Graph" }

    //OCA 26/05/2016 Setup of the period combobox values
    periodList = [
        { id: 1, label: "Monthly" },
        { id: 2, label: "Weekly" }];
    $scope.selBoxPeriodData = periodList;
    $scope.selBoxPeriodSettings = {
        selectionLimit: 1,
        smartButtonMaxItems: 1,
        closeOnSelect: true,
        showCheckAll: false,
        showUncheckAll: false,
        scrollable: false,
        externalIdProp: ''
    };
    //Retreiving initial values of the period combobox values from the cookies
    if ($cookies.SelARVERetainPeriod == undefined || $cookies.SelARVERetainPeriod == "undefined")
    { $scope.selBoxPeriodModel = { id: 2 }; }
    else
    { $scope.selBoxPeriodModel = { id: parseInt($cookies.SelARVERetainPeriod) }; }
    //Those are the actions when combo selection is changed : we store the selection in the cookies and redraw
    $scope.storeSelection = {
        onItemSelect: function (item) {
            $cookies.SelARVERetainPeriod = $scope.selBoxPeriodModel.id;
            if ($scope.selBoxPeriodModel.id == 2) { fList = fListWeeks; }
            else { fList = fListMonths; }
            loadData();
        },
        onItemDeselect: function (item) {
            $cookies.SelARVERetainPeriod = $scope.selBoxPeriodModel.id;
            if ($scope.selBoxPeriodModel.id == 2) { fList = fListWeeks; }
            else { fList = fListMonths; }
            loadData();
        }
    };
    //OCA 26/06/2016 END

    //OCA 07/09/2016 BEGIN deprecated
    /*$scope.displayCat = function () {
        loadBarsData();
    }*/
    //OCA 07/09/2016 END
    
    //Functions which call graph data load and redraw when the user switches between graph and table views
    $scope.displayARVEVisual = function () {
        if ($scope.radARVEVisual.value == "Graph") {
            d3.select("#ARVERetainChart").selectAll("#RetainChart").attr("style", "display: inline;")
            d3.select("#ARVERetainChart").selectAll("#RetainTable")
            .attr("style", "display: none;")
            loadBarsData();
        }
        else {
            d3.select("#ARVERetainChart").selectAll("#RetainChart").attr("style", "display: none;")
            d3.select("#ARVERetainChart").selectAll("#RetainTable")
            .attr("style", "display: inline;")
            buildTable();
        }
    }

    //OCA 07/09/2016 BEGIN deprecated
    //$scope.ARVEChart = function () { }

    var fListMonths = ["data/RetainForecastM1.json", "data/RetainForecastM2.json", "data/RetainForecastM3.json", "data/RetainForecastM4.json", "data/RetainForecastM5.json"];
    var fListWeeks = ["data/RetainForecastW1.json", "data/RetainForecastW2.json", "data/RetainForecastW3.json", "data/RetainForecastW4.json", "data/RetainForecastW5.json"];
    var fList = fListWeeks;

    var graph = { height: 800, width: 1000 },
        margin = { top: 60, right: 65, bottom: 30, left: 95 },
        width = graph.width - margin.left - margin.right,
        height = graph.height - margin.top - margin.bottom;

    var root = [], activeGroup = [], newGroupArray = [];
    var xLabels = [];
    var xBars = [], xBarsS = [], xBarsP = [];
    var groupC, groupL, groupR, legend; //Group of rectangles which compose one bar

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width * .9], .7, 0.4); //,1 : Space between bars
    var y = d3.scale.linear()
        .range([height, 0]);

    var yAxisGroup = null, xAxisGroup = null;
    var idxLbl = 0;
    var vRotateLabels = 0;
    var vAlignLabels = "start";
    var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat(function (d) { idxLbl = idxLbl + 1; return xLabels[idxLbl - 1] })
        .orient("top").ticks(1);
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left").ticks(10)
        .tickFormat(d3.format(".0%"));

    var curPeriod = 1;

    var catList = ["Unbilled", "Potential", "Firm", "Vacation"];

    var color = d3.scale.ordinal()
        .range(["#00000", "#9E86EB", "#4416D5", "#00C9C9"])
        .domain(catList);
    var barOpacity = .6, sideBarsWidth = 1;

    var t, t1, transitionDuration = 750;

    var title = d3.select("#ARVERetainChart").select("#RetainTitle");
    var subTitle1 = d3.select("#ARVERetainChart").select("#RetainSubTitle1")
    var subTitle2 = d3.select("#ARVERetainChart").select("#RetainSubTitle2")
    var subTitle3 = d3.select("#ARVERetainChart").select("#RetainSubTitle3")

    var svg = d3.select("#ARVERetainChart").select("#RetainChart").append("svg")
        .attr("class", "chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //.attr("viewbox", "0 0 "+ width + margin.left + margin.right + " " + height + margin.top + margin.bottom)     
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    //We add a < and a > on the left and right of the graph to access previous and next period
    var prevPeriod = d3.select("#ARVERetainChart").select("#RetainChart").append("text")
        .attr("class", "navBtn")
        .attr("x", 20)
        .attr("y", graph.height / 2 + 30)
        .on("click", slideLeft)
        .text("‹");
    var nextPeriod = d3.select("#ARVERetainChart").select("#RetainChart").append("text")
        .attr("class", "navBtn")
        .attr("x", graph.width - 50)
        .attr("y", graph.height / 2 + 30)
        .on("click", slideRight)
        .text("›");

    var table = d3.select("#ARVERetainChart").select("#RetainTable").append("table")
        .attr("class", "table-bordered table-striped table-responsive")
        .attr("width", width - 100) //+ margin.left + margin.right)
        .attr("height", height - 100) /* + margin.top + margin.bottom*/

    var timestampName = "date";
    var timezone = convertMinsToHrsMins(-new Date().getTimezoneOffset()); //-120 means +02:00
    var updateRetainTS = new Date(0);
    var updateText = d3.select("#ARVERetainChart").select("#updateRetainText");


    function semText(period) {
        var vPeriod
        if ($scope.selBoxPeriodModel.id == 1) {
            vPeriod = "M"
        }
        else {
            vPeriod = "W"
        }
        if (period == 0) { return vPeriod }
        else { return vPeriod + "+" + (period) }
    }

    // defining graph title
    function graphTitle() {
        var vPeriod
        if ($scope.selBoxPeriodModel.id == 1) {
            vPeriod = "months"
        }
        else {
            vPeriod = "weeks"
        }
        return "ARVE Retain " + vPeriod + " " + semText(curPeriod - 1) + " to " + semText(curPeriod + 1)
    }
    // and subTitles
    function tableSubTitles(period) {
        var vPeriod
        if ($scope.selBoxPeriodModel.id == 1) {
            vPeriod = "Month "
        }
        else {
            vPeriod = "Week "
        }
        return vPeriod + semText(curPeriod + period - 1)
    }

    // function for the y grid lines
    function make_y_axis() {
        return d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(40)
            .tickSize(-width * .9, 0, 0)
            .tickFormat("")
    }

    function convStrToFloat(pString) {
        var vCleanedString
        CleanedString = (String(pString).replace("%", ""));
        CleanedString = CleanedString.replace(" ", "");
        CleanedString = CleanedString.replace(",", ".");
        return parseFloat(CleanedString)
    }

    //------------------------------------------------------------------------------
    // Cookies management
    //------------------------------------------------------------------------------
    //OCA 06/05/2016 BEGIN - Storing all parameters for available view in cookies
    if ($cookies.SelARVERetVac == undefined || $cookies.SelARVERetVac == "undefined")
    { $scope.checkVac = false }
    else
    { $scope.checkVac = JSON.parse($cookies.SelARVERetVac); };
    if ($cookies.SelARVERetSim == undefined || $cookies.SelARVERetSim == "undefined")
    { $scope.checkSim = false }
    else
    { $scope.checkSim = JSON.parse($cookies.SelARVERetSim); };

    $scope.CheckBoxChanged = function () {
        $cookies.SelARVERetVac = JSON.stringify($scope.checkVac);
        $cookies.SelARVERetSim = JSON.stringify($scope.checkSim);
        loadBarsData();
    }
    //OCA 06/05/2016 END

    //-------------------------------------------------------------------------------
    // This function sets up the initial values for the bars by
    // calculating the parent values based on its children sums
    //-------------------------------------------------------------------------------
    function initNodeData(n) {
        // If the node has children...
        if (n.children) {
            if (!(n.children.length > 0)) {
                // If the child is not in an array, then we have only one child. We create an array for it
                var children = [];
                children = children.concat(n.children);
                n.children = children;
            }
            // Calling the children to calculate the sub values
            n.children.forEach(function (d) { initNodeData(d); });
            // Calculating the activity values based on the sum of its children
            angular.forEach(catList, function (c) {
                n[c] = d3.sum(n.children, function (d) { return d[c] })
            });
            // Calculating node size based on the sum of its children
            n.size = d3.sum(n.children, function (d) { return d.size; });
        }
        else {
            n.size = convStrToFloat(n.size);
            angular.forEach(catList, function (c) {
                if (typeof n[c] === "undefined") { n[c] = 0; }
                else { n[c] = convStrToFloat(n[c]) }
                // Setting missing values to 0
            });
        }

        //Removing spaces in the name to avoid problems while selecting DOM
        if (n.name == "") { n.name = "_" }
            // OCA 26/06/2016 Removed the suppression of space
        else { /*n.name = n.name.replace(/ /g, "_") */ }
        n.name = n.name.replace("_CEDEX", "")
        // OCA 26/06/2016 Removed the suppression of CSD as we now extract all France values
        //n.name = n.name.replace("CSD_", "")
        // Max value for the graph
        n.tot = n.Firm + n.Potential + n.Unbilled
        // Calculating vacation percentage
        n.vacSh = n.Vacation / n.tot
        // Bar position
        n.y0 = 0;
    }

    //-------------------------------------------------------------------------------
    // This is the function which draws the bars and the legend. It updates the
    // position of the legend based on the position of the last bar.
    //-------------------------------------------------------------------------------
    function loadBarsData() {
        // Setting new title
        title.html(graphTitle());
        // And subtitles
        subTitle1.html(tableSubTitles(0));
        subTitle2.html(tableSubTitles(1));
        subTitle3.html(tableSubTitles(2));

        t = svg.transition().duration(transitionDuration)
            .each("end", function () { t1 = d3.select(this).transition().duration(transitionDuration) });

        // Building the bars list
        console.log("Month index=" + curPeriod);
        xBars = [];
        angular.forEach(activeGroup[curPeriod].children, function (d) { xBars = xBars.concat(d); });
        xBars = xBars.concat(activeGroup[curPeriod]);
        angular.forEach(xBars, function (d) { d.y0 = 0; });

        xBarsS = [];
        angular.forEach(activeGroup[curPeriod + 1].children, function (d) { xBarsS = xBarsS.concat(d); });
        xBarsS = xBarsS.concat(activeGroup[curPeriod + 1]);
        angular.forEach(xBarsS, function (d) { d.y0 = 0; });

        xBarsP = [];
        xLabels = [];
        angular.forEach(activeGroup[curPeriod - 1].children, function (d) {
            xLabels = xLabels.concat(d.name);
            xBarsP = xBarsP.concat(d);
        });
        xLabels = xLabels.concat(activeGroup[curPeriod - 1].name)
        xBarsP = xBarsP.concat(activeGroup[curPeriod - 1]);
        angular.forEach(xBarsP, function (d) { d.y0 = 0; });

        // Calculating minimal vacation percentage  
        var minVacSh0 = d3.min(xBars.map(function (d) { return -d.vacSh; }));
        var minVacSh1 = d3.min(xBarsS.map(function (d) { return -d.vacSh; }));
        var minVacSh2 = d3.min(xBarsP.map(function (d) { return -d.vacSh; }));
        var minVacSh = d3.min([minVacSh1, minVacSh0, minVacSh2]);

        var displayList = catList.slice();
        // Removing vacations if box is unchecked 
        if ($scope.checkVac == false) {
            minVacSh = 0
            var posVac = displayList.indexOf("Vacation");
            if (posVac > -1) { displayList.splice(posVac, 1) }
        }

        // Setting a scale from x and y values
        y.domain([minVacSh, 1]);
        x.domain(xBarsP.map(function (d) { return d.uid; }))

        console.log("Ratio de vacances Retain le plus élevé=" + minVacSh);

        // Redisplaying yAxis and lines
        t1 = t.transition();
        t.selectAll(".y.axis").call(yAxis);
        t.selectAll(".y.grid").call(make_y_axis());
        svg.selectAll(".y.grid").selectAll("line").filter(function (d) { return (Math.round(d * 10) == d * 10); })
        .style("stroke", "#000");

        // Setting a scale with all x labels   
        if (xLabels.length > 5) {
            vRotateLabels = xLabels.length + 8;
            vAlignLabels = "start";
        }
        else {
            vRotateLabels = 0;
            vAlignLabels = "middle";
        };
        idxLbl = 0;
        t.selectAll(".x.axis")
            .call(xAxis);
        t1.selectAll(".x.axis")
            .selectAll("text")
            .style("text-anchor", vAlignLabels)
            .attr("dx", "-." + vRotateLabels + "em")
            //.attr("dy", "." + 0 + "em")
            .attr("transform", "rotate(-" + vRotateLabels + ")")
        ;

        //Building or rebuilding the bars
        var legendY1 = [], legendY2 = [];
        var lastLegendPos = -5;
        var legPos, lastCat = "";

        groupR = svg.selectAll(".barRight")
          .data(xBarsS, function (d) { return d.uid });
        groupR
          .enter().append("g")
          .attr("class", "barRight")
          .attr("opacity", 0)
          .attr("id", function (d) { return d.uid })
          //.on("click", slideLeft)
          .attr("transform", function (d) { return "translate(" + (x(d.uid) + x.rangeBand()) + ",0) scale(0, 1)"; });  // Position of next bar

        groupR
          .on("click", drillDown)
        svg.select("#" + xBars[xBars.length - 1].uid + ".barRight").on("click", drillUp);

        groupR.exit().remove();

        t.selectAll(".barRight")
          .attr("opacity", 1)
          .attr("transform", function (d) { return "translate(" + (x(d.uid) + x.rangeBand()) + ",0) scale(1, 1)"; }) // Position of next bar

        groupR.selectAll("rect.Unbilled").attr("y", function (d) { d.y0 = 0; });

        groupR.each(function (d) {
            d.catSum = d.tot;
            //if ($scope.checkUnknown.value != false) { d.catSum = d.catSum - d.unknown; }
        });

        rect = groupR.selectAll("rect")
          .data(displayList, function (d) { return (d) });
        rect
          .enter().append("rect")
          .attr("opacity", 0)
          .attr("class", function (d) { return d; })
          .style("fill", function (d) { return color(d); });
        rect.exit().remove();

        angular.forEach(displayList, function (c) {
            groupR.each(function (parDat) {
                t.selectAll("#" + parDat.uid + ".barRight").selectAll("rect." + c)
                     // .attr("opacity", barOpacity)            
                      .attr("width", x.rangeBand() * sideBarsWidth) //Bar width 
                      .attr("y", function (d) { return parDat.y0; }) //Bar position
                      .attr("height", function (d) {

                          if (c == "Firm") { parDat.midBar = parDat.y0 + y(1 - parDat[c] / parDat.catSum / 2) + 30 }
                          //legPos defines position of the legend based on position of the bar
                          legPos = parDat.y0 + y(1 - parDat[c] / parDat.catSum) / 2;
                          legendY2[c] = d3.max([20 + lastLegendPos, legPos]);
                          legendY1[c] = legPos;
                          if (c != lastCat) {
                              if (lastCat != "") { lastLegendPos = legendY2[lastCat]; }
                              lastCat = c;
                          }
                          parDat.y0 += y(1 - parDat[c] / parDat.catSum);
                          return y(1 - parDat[c] / parDat.catSum)
                      });
                t1.selectAll("#" + parDat.uid + ".barRight").selectAll("rect." + c)//.transition().duration(transitionDuration)
                      .attr("opacity", barOpacity)
                if (c == "Firm") {
                    svg.selectAll("#" + parDat.uid + ".barRight").selectAll("g.arve").remove()
                    var value = svg.selectAll("#" + parDat.uid + ".barRight")
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
                    t1.selectAll("#" + parDat.uid + ".barRight").selectAll("g.arve").select("text")
                      .attr("opacity", 1);
                }
            });
        });

        groupC = svg.selectAll(".barCenter")
          .data(xBars, function (d) { return d.uid });

        groupC
          .enter().append("g")
          .attr("class", "barCenter")
          .attr("id", function (d) { return d.uid })
          .attr("opacity", 0)
          .attr("transform", function (d) { return "translate(" + x(d.uid) + ",0) scale(1, 1)"; });
        groupC.exit().remove();

        groupC.on("click", drillDown);
        svg.select("#" + xBars[xBars.length - 1].uid + ".barCenter").on("click", drillUp);

        t.selectAll(".barCenter")
          .attr("opacity", 1)
          .attr("transform", function (d) { return "translate(" + x(d.uid) + ",0) scale(1, 1)"; })  // Position of next bar

        groupC.selectAll("rect.Unbilled").attr("y", function (d) { d.y0 = 0; });

        rect = groupC.selectAll("rect")
          .data(displayList, function (d) { return (d) });
        rect
          .enter().append("rect")
          .attr("opacity", 0)
          .attr("class", function (d) { return d; })
          .style("fill", function (d) { return color(d); });
        rect.exit().remove();

        svg.selectAll(".barCenter").selectAll(".legend").remove();

        groupC.each(function (d) {
            d.catSum = d.tot;
            /*if ($scope.checkUnknown.value != false) {
                d.catSum = d.catSum - d.unknown;
            }*/
        });

        angular.forEach(displayList, function (c) {
            groupC.each(function (parDat) {
                t.selectAll("#" + parDat.uid + ".barCenter").selectAll("rect." + c)
                      .attr("width", x.rangeBand()) //Bar width        
                      .attr("y", function (d) { return parDat.y0; }) //Bar position
                      .attr("height", function (d) {
                          if (c == "Firm") { parDat.midBar = parDat.y0 + y(1 - parDat[c] / parDat.catSum / 2) }
                          parDat.y0 += y(1 - parDat[c] / parDat.catSum);
                          return y(1 - parDat[c] / parDat.catSum)
                      });
                t1.selectAll("#" + parDat.uid + ".barCenter").selectAll("rect." + c)
                      .attr("opacity", barOpacity);
                if (c == "Firm") {
                    svg.selectAll("#" + parDat.uid + ".barCenter").selectAll("g.arve").remove()
                    var value = svg.selectAll("#" + parDat.uid + ".barCenter")
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

                    t1.selectAll("#" + parDat.uid + ".barCenter").selectAll("g.arve").select("text")
                      .attr("opacity", 1);
                }
            });
        });

        groupL = svg.selectAll(".barLeft")
          .data(xBarsP, function (d) { return d.uid });
        groupL
          .enter().append("g")
          .attr("class", "barLeft")
          .attr("id", function (d) { return d.uid })
          .attr("opacity", 0)
          .attr("transform", function (d) { return "translate(" + x(d.uid) + ",0) scale(0, 1)"; });

        groupL
          .on("click", drillDown);
        svg.select("#" + xBars[xBars.length - 1].uid + ".barLeft").on("click", drillUp);

        groupL.exit().remove();

        t.selectAll(".barLeft")
          .attr("opacity", 1)
          .attr("transform", function (d) { return "translate(" + (x(d.uid) - x.rangeBand() * sideBarsWidth) + ",0) scale(1, 1)"; });  // Position of next bar      

        groupL.selectAll("rect.Unbilled").attr("y", function (d) { d.y0 = 0; });

        groupL.each(function (d) {
            d.catSum = d.tot;
            //if ($scope.checkUnknown.value != false) { d.catSum = d.catSum - d.unknown; }
        });

        rect = groupL.selectAll("rect")
          .data(displayList, function (d) { return (d) });
        rect
          .enter().append("rect")
          .attr("opacity", 0)
          .attr("class", function (d) { return d; })
          .style("fill", function (d) { return color(d); });
        rect.exit().remove();

        angular.forEach(displayList, function (c) {
            groupL.each(function (parDat) {
                t.selectAll("#" + parDat.uid + ".barLeft").selectAll("rect." + c)
                      .attr("width", x.rangeBand() * sideBarsWidth) //Bar width 
                      .attr("y", function (d) { return parDat.y0; }) //Bar position
                      .attr("height", function (d) {
                          if (c == "Firm") { parDat.midBar = parDat.y0 + y(1 - parDat[c] / parDat.catSum / 2) - 30 }
                          parDat.y0 += y(1 - parDat[c] / parDat.catSum);
                          return y(1 - parDat[c] / parDat.catSum)
                      });
                t1.selectAll("#" + parDat.uid + ".barLeft").selectAll("rect." + c)
                      .attr("opacity", barOpacity)
                if (c == "Firm") {
                    svg.selectAll("#" + parDat.uid + ".barLeft").selectAll("g.arve").remove()
                    var value = svg.selectAll("#" + parDat.uid + ".barLeft")
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

                    t1.selectAll("#" + parDat.uid + ".barLeft").selectAll("g.arve").select("text")
                      .attr("opacity", 1);

                }
            });
        });

        //Making solid all bars for the total (right group of bars)
        t1.selectAll("#" + xBarsS[xBarsS.length - 1].uid + ".barRight").selectAll("rect").attr("opacity", 1)
        t1.selectAll("#" + xBarsS[xBarsS.length - 1].uid + ".barCenter").selectAll("rect").attr("opacity", 1)
        t1.selectAll("#" + xBarsS[xBarsS.length - 1].uid + ".barLeft").selectAll("rect").attr("opacity", 1)

        // Positionning legend on the right
        legend = svg.select("#" + xBarsS[xBarsS.length - 1].uid + ".barRight").selectAll(".legend")
              .data(displayList, function (d) { return (d) })
        legend.exit().remove();
        var legEl = legend
              .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function (d) { return "translate(" + (x.rangeBand() * sideBarsWidth + 20) + "," + legendY2[d] + ")"; })
              .attr("opacity", 0);
        legEl
                .append("text")
                  .attr("x", 13)
                  .attr("dy", ".35em")
                  .attr("font-size", "1.4em")
                  .attr("opacity", 1)
                  .text(function (d) { return d });
        legEl
              .append("line")
                .attr("stroke-width", 2)
                .attr("stroke", "black")
                .attr("opacity", 1)
                .attr("x1", -20).attr("x2", 10)
                .attr("y1", function (d) { return (legendY1[d] - legendY2[d]); }).attr("y2", 0);

        t.select("#" + xBarsS[xBarsS.length - 1].uid + ".barRight").selectAll(".legend")
            .attr("opacity", 1)
            .attr("transform", function (d) { return "translate(" + (x.rangeBand() * sideBarsWidth + 20) + "," + legendY2[d] + ")"; });

        // Setting line between legend and middle of the bar
        t.select("#" + xBarsS[xBarsS.length - 1].uid + ".barRight").selectAll(".legend line")
              .attr("x1", -20).attr("x2", 10)
              .attr("y1", function (d) { return (legendY1[d] - legendY2[d]); }).attr("y2", 0);
    }

    //-------------------------------------------------------------------------------
    // This is the function for the initial display of the graph.
    //-------------------------------------------------------------------------------
    var drawChart = function () {
        console.log("Calling drawChart")
        //  t = svg.transition().duration(transitionDuration);  

        //OCA 26/06/2016 BEGIN removing previous axis to redraw Chart
        svg.selectAll("*").remove();
        //Hiding previous period symbol
        if (curPeriod <= 1) { prevPeriod.attr("style", "display: none;") }
        //OCA 26/06/2016 END

        // Draw the y Grid lines
        svg.append("g")
            .attr("class", "y grid")
            .call(make_y_axis()
            )
        // Drawing yAxis
        yAxisGroup = svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
        // Drawing xAxis
        xAxisGroup = svg.append("g")
          .attr("class", "x axis")
          .call(xAxis);

        //OCA 06/05/2016 BEGIN - Storing all parameters for available view in cookies
        if ($cookies.SelARVERetGroup == undefined || $cookies.SelARVERetGroup == "undefined")
        { activeGroup = root; }
        else
        {
            newGroupArray = [];
            if (root[0].uid == JSON.parse($cookies.SelARVERetGroup))
            { newGroupArray = root; }
            else
            {
                angular.forEach(root, function (d) {
                    return getNode(d, JSON.parse($cookies.SelARVERetGroup));
                }
                );
            }
            //OCA 18/05/2016 BEGIN – If array is not found, we use root
            if (newGroupArray.length != 0)
            { activeGroup = newGroupArray; }
            else
            { activeGroup = root; }
            //OCA 18/05/2016 END
        };
        //OCA 06/05/2016 END

        loadBarsData();

        /*groupC.attr("transform", function(d) {return "translate(" + x(d.name) + ",0)"; });  // Position of next bar
        groupL.attr("transform", function(d) {return "translate(" + x(d.name)+ ",0) scale(0, 1)"; });  // Position of next bar
        groupR.attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) + ",0) scale(0,1) "; });  // Position of next bar
    
       groupC.transition().duration(transitionDuration).attr("opacity", 1).each("end", function(e, i){
          groupL.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)-x.rangeBand()*sideBarsWidth) + ",0) scale(1, 1)"; });  // Position of next bar
          groupR.transition().duration(transitionDuration).attr("transform", function(d) {return "translate(" + (x(d.name)+x.rangeBand()) +  ",0) scale(1, 1)"; });
       }); */
    }

    //OCA 06/05/2016 BEGIN - This function finds a node in the ARVE tree based on its UID
    function getNode(tree, uid) {
        if (tree.children) {
            tree.children.forEach(function (d) {
                if (d.uid == uid) { newGroupArray = newGroupArray.concat(d); }
                else { return getNode(d, uid) }
            })
        }
        else {
            return null;
        }
    }
    //OCA 06/05/2016 END

    //-------------------------------------------------------------------------------
    // This function creates a table with all the data for the given period and the 
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

        if (transition == "right") {
            // Securing max values      
            if (curPeriod < root.length - 2) {
                curPeriod = curPeriod + 1;
                loadBarsData();
                // Moving bars
                groupL.selectAll("rect")
                  .attr("transform", function (d) { return "translate(" + x.rangeBand() * sideBarsWidth + ",0)  scale(" + 1 / sideBarsWidth + ", 1)"; });
                //t.selectAll(".barCenter").selectAll("rect")            
                groupC.selectAll("rect")
                  .attr("transform", function (d) { return "translate(" + (x.rangeBand()) + ",0) scale(" + sideBarsWidth + ", 1)"; });
                groupR.selectAll("rect")
                  .attr("transform", function (d) { return "translate(" + (x.rangeBand() * sideBarsWidth) + ",0) scale(0, 1)"; })
                prevPeriod.attr("style", "display: inline;")
                if (curPeriod >= root.length - 2) { nextPeriod.attr("style", "display: none;") }
            };
        }
        else if (transition == "left") {
            // Securing min values      
            if (curPeriod > 1) {
                curPeriod = curPeriod - 1;
                loadBarsData();
                nextPeriod.attr("style", "display: inline;")
                if (curPeriod <= 1) { prevPeriod.attr("style", "display: none;") }
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
        console.log("Drilling up:" + bar.name + " ID:" + bar.uid);
        // Blocking drilling up on the top group
        if (bar.uid != root[0].uid) {

            svg.select("#" + xBarsS[xBarsS.length - 1].uid + ".barRight").selectAll(".legend").remove();

            activeGroup = root;
            newGroupArray = [];
            angular.forEach(root, function (d) {
                return getTopNode(d, bar.uid);
            });
            activeGroup = newGroupArray;
            $cookies.SelARVERetGroup = JSON.stringify(activeGroup[activeGroup.length - 1].uid);
            loadBarsData();
        }
    };

    function getTopNode(tree, uid) {
        if (tree.children) {
            tree.children.forEach(function (d) {
                if (d.uid == uid) { newGroupArray = newGroupArray.concat(tree); }
                else { return getTopNode(d, uid) }
            })
        }
        else {
            return null;
        }
    }

    function drillDown(bar) {
        console.log("Drilling down:" + bar.name);
        newGroupArray = [];
        angular.forEach(activeGroup, function (d) {
            newGroupArray = newGroupArray.concat(d.children.filter(function (d) { return (d.uid == bar.uid) }));
        });
        if (newGroupArray[0].children) {
            activeGroup = newGroupArray;
            $cookies.SelARVERetGroup = JSON.stringify(activeGroup[activeGroup.length - 1].uid);
            loadBarsData();
        }
    };

    //-------------------------------------------------------------------------------
    // Main function. It loads the data
    //-------------------------------------------------------------------------------
    loadData();
    function loadData() {
        console.log("Reloading Retain data")
        d3.json(fList[0], function (error, data0) {
            if (error) throw error;
            root[0] = data0;
            initNodeData(root[0]);
            updateRetainTS = getLastUpdateTS(data0[timestampName], updateRetainTS);

            d3.json(fList[1], function (error, data1) {
                if (error) throw error;
                root[1] = data1;
                initNodeData(root[1]);
                updateRetainTS = getLastUpdateTS(data1[timestampName], updateRetainTS);

                d3.json(fList[2], function (error, data2) {
                    if (error) throw error;
                    root[2] = data2;
                    initNodeData(root[2]);
                    updateRetainTS = getLastUpdateTS(data2[timestampName], updateRetainTS);

                    d3.json(fList[3], function (error, data3) {
                        if (error) throw error;
                        root[3] = data3;
                        initNodeData(root[3]);
                        updateRetainTS = getLastUpdateTS(data3[timestampName], updateRetainTS);
                    });

                    d3.json(fList[4], function (error, data4) {
                        if (error) throw error;
                        root[4] = data4;
                        initNodeData(root[4]);

                        updateRetainTS = getLastUpdateTS(data4[timestampName], updateRetainTS);
                        console.log("Retain chart updated at " + updateRetainTS);
                        updateText.html(updateRetainTS.toLocaleString());

                        drawChart();
                    });
                });
            });
        })


    }


    //-------------------------------------------------------------------------------
    // Load last update timestamp by comparison between a json formated date and Date
    //-------------------------------------------------------------------------------
    function getLastUpdateTS(jsonTS, saved) {
        //Format timestamp
        //TODO Improve parsing with moment.js
        var jsonDate = jsonTS.split(" ");
        jsonDate = jsonDate[0].split("/").concat(jsonDate[1]);

        var timestamp = new Date(jsonDate[2] + "-" + jsonDate[1] + "-" + jsonDate[0] + "T" + jsonDate[3] + timezone);
        if (timestamp > saved) {
            return timestamp;
        }
        return saved;
    }

    //-------------------------------------------------------------------------------
    // Util functions
    //-------------------------------------------------------------------------------
    function convertMinsToHrsMins(minutes) {
        var sign = Math.sign(minutes) < 0 ? '-' : '+';
        minutes = Math.abs(minutes);
        var h = Math.trunc(minutes / 60);
        var m = minutes % 60;

        h = h < 10 ? '0' + h : h;
        m = m < 10 ? '0' + m : m;
        return sign + h + ':' + m;
    }

});

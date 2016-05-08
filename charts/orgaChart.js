angular.module('orgaChart', [])
  
.controller( 'OrgaCtrl', function OrgaController( $scope, auth, $http, $location, store) {
    
  $scope.flareChart = function() {}
    
    var width = 960,
        height = 700,
        radius = Math.min(width, height) /2;
  
    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    
    var y = d3.scale.linear()
        .range([0, radius]);
   
    //var color = d3.scale.category10(); //Automatic scaling
    var color = d3.scale.ordinal()
        .range([ "#0A64A4", "#0ACF00","#FF9000", "#FD0006", 
                 "#24577B", "#2D9B27","#BF8130", "#BE2F33",
                 "#03406A", "#078600","#A65E00", "#A40004",
                 "#3E94D1", "#42E73A","#FFAC40", "#FE3F44",
                 "#65A5D1", "#6EE768","#FFC273", "#FE7276",
                  ]);


    var partition = d3.layout.partition()
        .value(function(d) { return d.size; });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });    
  
    var svg = d3.select("#flareChart").append("svg")
        .attr("width", width) //Width of drawing zone
        .attr("height", height) //Height of drawing zone 
        .append("g")
        .attr("id", "container")      
        //Center position of the graph  
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");
  
    d3.json("data/arveS.json", function(error, root) {
      var g = svg.selectAll("g")
        .data(partition.nodes(root))
        .enter().append("g");
    
      var path = g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
        .style("stroke", "white")        
        .on("click", click);
    
      var text = g.append("text")
        .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
        .attr("x", function(d) { return y(d.y); })
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d) { return d.name; })        
        .style("font-size", function(d) { return Math.min (30, 50 / this.getComputedTextLength() * 28) + "px"; })
        .on("click", click);        
   
      function click(d) {
        // fade out all text elements
        text.transition().attr("opacity", 0);
        path.transition()
          .duration(750)
          .attrTween("d", arcTween(d))
          .each("end", function(e, i) {
              // check if the animated element's data e lies within the visible angle span given in d
              if (e.x >= d.x && e.x < (d.x + d.dx)) {
                // get a selection of the associated text element
                var arcText = d3.select(this.parentNode).select("text");
                // fade in the text element and recalculate positions
                arcText.transition().duration(750)
                  .attr("opacity", 1)
                  .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
                  .attr("x", function(d) { return y(d.y); })
                  ;                  
              }
          });
      }
    });
  
    // Interpolate the scales!
    function arcTween(d) {
      var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
          yd = d3.interpolate(y.domain(), [d.y, 1]),
          yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
      return function(d, i) {
        return i
            ? function(t) { return arc(d); }
            : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
      };
    }
    
    function computeTextRotation(d) {
      return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
    }

d3.select(self.frameElement).style("height", height + "px");
   
});
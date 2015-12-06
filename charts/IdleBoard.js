/// <reference path="../typings/angular2/angular2.d.ts"/>
//angular.module('IdleBoard', []).controller('IdleCtrl', function($scope) {
angular.module("IdleBoard", []).controller("IdleCtrl", function($scope) {

var skillList = ["FR03AA10", "FR03AA12", "FR03AA11",  "FR03AA06", "FR03AA09", "FR03AA14"];

var color = d3.scale.ordinal()
    .range(["#FFEF9E", "#FF6356", "#FFE456", "#5BFF78", "#956DFF", "#FFA59E"])
    .domain(skillList);

    $scope.models = {
        selected: null,
        lists: {/*"A": [],*/ "TECH": [], "AUTRES": [], "AMOA": [], "EM": []} 
    };

        
    d3.csv("data/dispos.csv", function(error, data) {
      data.forEach(function(d) {
        d.color = color(d.Skill);
        console.log(d);
        $scope.models.lists.TECH.push(d);     
      });  
      $scope.$apply();
    });

//code before the pause
setTimeout(function(){
    // Generate initial model
 /*   for (var i = 1; i <= 13; ++i) {
        $scope.models.lists.A.push({label: "Item A" + i, Grade: "C"});          
    }
      console.log("got initial")
      $scope.$apply();*/          
}, 2000);


    // Model to JSON for demo purpose
    $scope.$watch('models', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);


});
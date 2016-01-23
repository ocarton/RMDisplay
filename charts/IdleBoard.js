/// <reference path="../typings/angular2/angular2.d.ts"/>
var myApp = angular.module("IdleBoard", []).controller("IdleCtrl", function($scope) {

    var skillList = ["FR03AA10_CSD_PAU", "FR03AA12_MCS_DEF", "FR03AA11_MCS_RT",  "FR03AA06_CSD_DC", "FR03AA09_MCS_S&A", "FR03AA14_CSD_RES2"];
    
    var color = d3.scale.ordinal()
        .range(["#FFF4D4", "#FF9BB8", "#FFE69B", "#C6FF9B", "#ABA9FF", "#FFD4E0"])
        .domain(skillList);

    $scope.models = {
        selected: null,
        lists: [],
    };

    var dsv = d3.dsv(";", "text/plain; charset=ISO-8859-1");

    dsv("data/dispos.csv", function(error, data) {
    $scope.models.lists[0]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}
    $scope.models.lists[1]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}    
    $scope.models.lists[2]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}    
    $scope.models.lists[3]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}    
    $scope.models.lists[4]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}                                              
    $scope.models.lists[5]= {"TECH": [], "AUTRES": [], "AMOA": [], "EM": []}
    data.forEach(function(d) {
        d.color = color(d["Prod  Unit Label"]);
        if(d["Global practice"] == "AMOA") {
            $scope.models.lists[d.Week].AMOA.push(d);            
        }
        else if (d["Global practice"] == "AMOE" || d["Global practice"] == "NTIC") {
            $scope.models.lists[d.Week].TECH.push(d);            
        }
        else if (d["Global practice"] == "EM" || d["Global practice"] == "PMO" || d["Global practice"] == "QUALITE") {
            $scope.models.lists[d.Week].EM.push(d);            
        }
        else{
            $scope.models.lists[d.Week].AUTRES.push(d);            
        }
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


myApp.config(function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript|sip):/);
});
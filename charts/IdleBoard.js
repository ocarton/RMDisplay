/// <reference path="../typings/angular2/angular2.d.ts"/>
var myApp = angular.module("IdleBoard", []).controller("IdleCtrl", function($scope) {

    var skillList = ["FR03AA10_CSD_RTCP", "FR03AA12_MCS_OCSR", "FR03AA11_MCS_RTCB", "FR03AA06_CSD_DC", "FR03AA09_MCS_S&A", "FR03AA14_CSD_OCSP"];
    var color = d3.scale.ordinal()
        .range(["#FFF4D4", "#FF9BB8", "#FFE69B", "#C6FF9B", "#ABA9FF", "#FFD4E0", "#FFFFFF"])
        .domain(skillList);

    $scope.listSC = [
        { value: 'FR03CS04 - ASD', name: 'ASD', list: [
            { value: 'FR03AA06_CSD_DC', name: 'DIGITAL', bgdcol: '#C6FF9B' },
            { value: 'FR03AA09_MCS_S&A', name: 'S&A', bgdcol: '#ABA9FF' },
            { value: 'FR03AA10_CSD_RTCP', name: 'RTC Pau', bgdcol: '#FFF4D4' },
            { value: 'FR03AA11_MCS_RTCB', name: 'RTC Bayonne', bgdcol: '#FFE69B' },
            { value: 'FR03AA12_MCS_OCSR', name: 'OCS Rennes', bgdcol: '#FF9BB8' },
            { value: 'FR03AA14_CSD_OCSP', name: 'OCS Paris', bgdcol: '#FFD4E0' }
        ]},
        { value: 'FR03CSD4 - C&IM', name: 'C&IM', list:[] },
        { value: 'FR03CS03 - COMM', name: 'COMM', list: [] },
        { value: 'FR03CS07 - ECM', name: 'ECM', list: [] },
        { value: 'FR03CS05 - EU&I', name: 'EU&I', list: [] },
        { value: 'FR03CS01 - MGT', name: 'MGT', list: [] },
        { value: 'FR03CS06 - PER', name: 'PER', list: [] },
        { value: 'FR03CS02 - TMP', name: 'TMP', list: [] }
    ];

    $scope.changeSC = function () {
        console.log("Skill center selected: " + $scope.selectedSC)
        if ($scope.selectedSC == 'FR03CS04 - ASD') {
            $scope.listSG = $scope.listSC[0].list;
        }
        else {
            $scope.listSG = $scope.listSC[1].list;
        }
    }

    $scope.selectedSC = "FR03CS04 - ASD";
    $scope.listSG = $scope.listSC[0].list;

    $scope.models = {
        selected: null,
        lists: [],
    };

    var dsv = d3.dsv(";", "text/plain; charset=ISO-8859-1");

    dsv("data/dispos.csv", function(error, data) {
        $scope.models.lists[0] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[1] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[2] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[3] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[4] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[5] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[6] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[7] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[8] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        $scope.models.lists[9] = { "TECH": [], "AUTRES": [], "AMOA": [], "EM": [] }
        data.forEach(function(d) {console.log(d)
            d.color = color(d["Prod  Unit Label"]);
            if(d["Global practice"] == "AMOA") {
                $scope.models.lists[d.Week].AMOA.unshift(d);            
            }
            else if (d["Global practice"] == "AMOE" || d["Global practice"] == "NTIC" || d["Global practice"] == "SAP") {
                $scope.models.lists[d.Week].TECH.unshift(d);
            }
            else if (d["Global practice"] == "EM" || d["Global practice"] == "PMO" || d["Global practice"] == "QUALITE") {
                $scope.models.lists[d.Week].EM.unshift(d);
            }
            else{
                $scope.models.lists[d.Week].AUTRES.unshift(d);
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
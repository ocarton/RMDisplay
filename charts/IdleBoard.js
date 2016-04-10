/// <reference path="../typings/angular2/angular2.d.ts"/>
var myApp = angular.module('IdleBoard', ['angularjs-dropdown-multiselect', 'dragularModule'])
.controller('IdleCtrl', ['$scope', '$element', 'dragularService', function TodoCtrl($scope, $element, dragularService) {
    dragularService('.containerVertical', { removeOnSpill: false });

    var skillList = ["FR03AA10_CSD_RTCP", "FR03AA12_MCS_OCSR", "FR03AA11_MCS_RTCB", "FR03AA06_CSD_DC", "FR03AA09_MCS_S&A", "FR03AA14_CSD_OCSP"];
    var color = d3.scale.ordinal()
        .range(["#FFF4D4", "#FF9BB8", "#FFE69B", "#C6FF9B", "#ABA9FF", "#FFD4E0", "#FFFFFF"])
        .domain(skillList);

    $scope.listSC = [
        {
            value: 'FR03CS04 - ASD', name: 'ASD', list: [
              { value: 'FR03AA06_CSD_DC', name: 'DIGITAL', bgdcol: '#C6FF9B' },
              { value: 'FR03AA09_MCS_S&A', name: 'S&A', bgdcol: '#ABA9FF' },
              { value: 'FR03AA10_CSD_RTCP', name: 'RTC Pau', bgdcol: '#FFF4D4' },
              { value: 'FR03AA11_MCS_RTCB', name: 'RTC Bayonne', bgdcol: '#FFE69B' },
              { value: 'FR03AA12_MCS_OCSR', name: 'OCS Rennes', bgdcol: '#FF9BB8' },
              { value: 'FR03AA14_CSD_OCSP', name: 'OCS Paris', bgdcol: '#FFD4E0' }
            ]
        },
        { value: 'FR03CSD4 - C&IM', name: 'C&IM', list: [] },
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
        availableList: [],
    };

    $scope.col1Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] == "AMOA") { itemSelected = true };
        return itemSelected;
    }

    $scope.col2Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] != "AMOA" && item["Global practice"] != "EM"
            && item["Global practice"] != "PMO" && item["Global practice"] != "QUALITE"
            && item["Global practice"] != "AMOE" && item["Global practice"] != "NTIC"
            && item["Global practice"] != "SAP") { itemSelected = true };
        return itemSelected;
    }

    $scope.col3Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] == "EM" || item["Global practice"] == "PMO" || item["Global practice"] == "QUALITE") { itemSelected = true };
        return itemSelected;
    }

    $scope.col4Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] == "AMOE" || item["Global practice"] == "NTIC" || item["Global practice"] == "SAP") { itemSelected = true };
        return itemSelected;
    }

    var dsv = d3.dsv(";", "text/plain; charset=ISO-8859-1");

    dsv("data/dispos.csv", function (error, data) {
        $scope.models.availableList[0] = { "items": [] };
        $scope.models.availableList[1] = { "items": [] };
        $scope.models.availableList[2] = { "items": [] };
        $scope.models.availableList[3] = { "items": [] };
        $scope.models.availableList[4] = { "items": [] };
        $scope.models.availableList[5] = { "items": [] };
        $scope.models.availableList[6] = { "items": [] };
        $scope.models.availableList[7] = { "items": [] };
        $scope.models.availableList[8] = { "items": [] };
        $scope.models.availableList[9] = { "items": [] };
        data.forEach(function (d) {
            d.color = color(d["Prod  Unit Label"]);
            $scope.models.availableList[d.Week].items.unshift(d);
        });
        $scope.$apply();
    });

    //code before the pause
    setTimeout(function () {
        // Generate initial model
        /*   for (var i = 1; i <= 13; ++i) {
               $scope.models.lists.A.push({label: "Item A" + i, Grade: "C"});          
           }
             console.log("got initial")
             $scope.$apply();*/
    }, 2000);


    // Model to JSON for demo purpose
    /*$scope.$watch('models', function(model) {
            $scope.modelAsJson = angular.toJson(model, true);
        }, true);*/
}]);
/// <reference path="../typings/angular2/angular2.d.ts"/>
var myApp = angular.module('IdleBoard', ['angularjs-dropdown-multiselect', 'dragularModule'])
.controller('IdleCtrl', ['$scope', '$element', 'dragularService', function TodoCtrl($scope, $element, dragularService) {
    dragularService('.containerVertical', { removeOnSpill: false });

    var citiesList = [];
    var skillList = ["FR03AA10_CSD_RTCP", "FR03AA12_MCS_OCSR", "FR03AA11_MCS_RTCB", "FR03AA06_CSD_DC", "FR03AA09_MCS_S&A", "FR03AA14_CSD_OCSP"];
    var color = d3.scale.ordinal()
        .range(["#FFF4D4", "#FF9BB8", "#FFE69B", "#C6FF9B", "#ABA9FF", "#FFD4E0", "#FFFFFF"])
        .domain(skillList);
    $scope.models = {
        selected: null,
        availableList: [],
    };

    $scope.listSC = [
        {
            id:1, value: 'FR03CS04 - ASD', label: 'ASD', list: [
              { id: 1, value: 'FR03AA06_CSD_DC', label: 'DIGITAL', bgdcol: '#C6FF9B'},
              { id: 2, value: 'FR03AA09_MCS_S&A', label: 'S&A', bgdcol: '#ABA9FF'},
              { id: 3, value: 'FR03AA10_CSD_RTCP', label: 'RTC Pau', bgdcol: '#FFF4D4'},
              { id: 4, value: 'FR03AA11_MCS_RTCB', label: 'RTC Bayonne', bgdcol: '#FFE69B'},
              { id: 5, value: 'FR03AA12_MCS_OCSR', label: 'OCS Rennes', bgdcol: '#FF9BB8'},
              { id: 6, value: 'FR03AA14_CSD_OCSP', label: 'OCS Paris', bgdcol: '#FFD4E0'}
            ]
        },
        { id: 2, value: 'FR03CSD4 - C&IM', label: 'C&IM', list: [] },
        { id: 3, value: 'FR03CS03 - COMM', label: 'COMM', list: [] },
        { id: 4, value: 'FR03CS07 - ECM', label: 'ECM', list: [] },
        { id: 5, value: 'FR03CS05 - EU&I', label: 'EU&I', list: [] },
        { id: 6, value: 'FR03CS01 - MGT', label: 'MGT', list: [] },
        { id: 7, value: 'FR03CS06 - PER', label: 'PER', list: [] },
        { id: 8, value: 'FR03CS02 - TMP', label: 'TMP', list: [] }
    ];


    //Forcing selection of ASD
    $scope.selBoxSkillCModel = $scope.listSC.slice(0,1);
    $scope.selBoxSkillCData = $scope.listSC;
    $scope.selBoxSkillCSettings = {
        smartButtonMaxItems: 3,
        externalIdProp: ''
    };

    $scope.selBoxSkillGModel = $scope.listSC[0].list.slice(0);
    $scope.selBoxSkillGData = $scope.listSC[0].list;
    $scope.selBoxSkillGSettings = {
        smartButtonMaxItems: 0,
        externalIdProp: ''
    };

    $scope.selBoxCitySettings = {
        smartButtonMaxItems: 1,
        externalIdProp: ''
    };

    $scope.col1Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] == "AMOA"
            && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
            && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office Base"]) != -1)
            { itemSelected = true; };
        return itemSelected;
    }

    $scope.col2Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] != "AMOA" && item["Global practice"] != "EM"
            && item["Global practice"] != "PMO" && item["Global practice"] != "QUALITE"
            && item["Global practice"] != "AMOE" && item["Global practice"] != "NTIC"
            && item["Global practice"] != "SAP"
            && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
            && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office Base"]) != -1)
            { itemSelected = true };
        return itemSelected;
    }

    $scope.col3Filter = function (item) {
        var itemSelected = false;
        if ((item["Global practice"] == "EM" || item["Global practice"] == "PMO" || item["Global practice"] == "QUALITE")
             && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
             && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office Base"]) != -1)
            { itemSelected = true };
        return itemSelected;
    }

    $scope.col4Filter = function (item) {
        var itemSelected = false;
        if ((item["Global practice"] == "AMOE" || item["Global practice"] == "NTIC" || item["Global practice"] == "SAP")
             && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
             && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office Base"]) != -1)
            { itemSelected = true };
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
            //Creation of citiesList content from data available in dispos.csv
            if (citiesList.map(function (e) { return e.value; }).indexOf(d["Office Base"]) == -1) {
                var newCity = {
                    id: citiesList.length + 1,
                    value: d["Office Base"],
                    label: d["Office Base"].slice(d["Office Base"].indexOf("(") + 1, d["Office Base"].indexOf(")")).toUpperCase()
                };
                citiesList.push(newCity);
            };
            $scope.models.availableList[d.Week].items.unshift(d);
        });
        citiesList.sort(function (a, b) { return a.label > b.label; });
        $scope.selBoxCityModel = citiesList.slice(0);
        $scope.selBoxCityData = citiesList;
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
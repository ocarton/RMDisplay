/// <reference path="../typings/angular2/angular2.d.ts"/>
var myApp = angular.module('IdleBoard', ['ngCookies', 'angularjs-dropdown-multiselect', 'dragularModule'])
.controller('IdleCtrl', ['$scope', '$cookies', '$element', 'dragularService', function ($scope, $cookies, $element, dragularService) {
    dragularService('.containerVertical', { removeOnSpill: false });

    var citiesList = [];
    //OCA 11/09/2016 Changed skill names to match new production units of R2D2
    var skillList = ["FR03AA05_BS_PLM", "FR03AA02_BS_BTS", "FR03AA03_BS_M&SC", "FR03AA10", "FR03AA12", "FR03AA11", "FR03AA06", "FR03AA09", "FR03AA14"];
    var color = d3.scale.ordinal()
        .range(["#fee45e"/*yellow*/, "#ffac52"/*orange*/, "#9bc2f2"/*blue*/, "#fee45e"/*yellow*/, "#ba62ea"/*purple*/, "#ffac52"/*orange*/, "#a4cc70"/*green*/, "#9bc2f2"/*blue*/, "#ff9bb7"/*light red*/, "#FFFFFF"/*white*/])
        .domain(skillList);

    $scope.models = {
        selected: null,
        availableList: [],
    };

    //------------Definition of the scope for the combo list objects
    $scope.selBoxCityModel = [];
    $scope.selBoxCityData = [];
    $scope.selBoxSkillGModel = [];
    $scope.selBoxSkillCModel = [];
    $scope.listSC = [
        {
            id: 1, value: 'FR03CS04 - ASD', label: 'CSD ASD', list: [
              { id: 1, value: 'FR03AA06_CSD_DC', label: 'DIGITAL', bgdcol: '#C6FF9B' },
              { id: 2, value: 'FR03AA09_MCS_S&A', label: 'S&A', bgdcol: '#ABA9FF' },
              { id: 3, value: 'FR03AA10_CSD_RTCP', label: 'RTC Pau', bgdcol: '#FFF4D4' },
              { id: 4, value: 'FR03AA11_MCS_RTCB', label: 'RTC Bayonne', bgdcol: '#FFE69B' },
              { id: 5, value: 'FR03AA12_MCS_OCSR', label: 'OCS Rennes', bgdcol: '#FF9BB8' },
              { id: 6, value: 'FR03AA14_CSD_OCSP', label: 'OCS Paris', bgdcol: '#FFD4E0' }
            ]
        },
        { id: 2, value: 'FR03CSD4 - C&IM', label: 'CSD C&IM', list: [] },
        { id: 3, value: 'FR03CS03 - COMM', label: 'CSD COMM', list: [] },
        { id: 4, value: 'FR03CS07 - ECM', label: 'CSD ECM', list: [] },
        { id: 5, value: 'FR03CS05 - EU&I', label: 'CSD EU&I', list: [] },
        { id: 6, value: 'FR03CS01 - MGT', label: 'CSD MGT', list: [] },
        { id: 7, value: 'FR03CS06 - PER', label: 'CSD PER', list: [] },
        { id: 8, value: 'FR03CS02 - TMP', label: 'CSD TMP', list: [] },
        { id: 9, value: 'FR03AAL01-SUD', label: 'ADM SUD', list: [] },
        { id: 10, value: 'FR03AAL02-NORD', label: 'ADM NORD', list: [] },
        { id: 11, value: 'FR03AAL03-OUEST', label: 'ADM OUEST', list: [] },
        { id: 12, value: 'FR03AAL04-NExT', label: 'ADM NextT', list: [] },
        { id: 13, value: 'FR03AAL05-HERMES', label: 'ADM HERM', list: [] },
        { id: 14, value: 'FR03PB03 - BS', label: 'PBS BS', list: [] }
    ];

    //------------Initialization of the dropdown lists
    $scope.selBoxSkillCData = $scope.listSC;
    $scope.selBoxSkillCModel = $scope.listSC.slice(0, 1);
    $scope.selBoxSkillCSettings = {
        smartButtonMaxItems: 3,
        externalIdProp: ''
    };

    $scope.selBoxSkillGData = $scope.listSC[0].list;
    $scope.selBoxSkillGModel = $scope.listSC[0].list.slice(0);
    $scope.selBoxSkillGSettings = {
        smartButtonMaxItems: 0,
        externalIdProp: ''
    };

    $scope.selBoxCitySettings = {
        smartButtonMaxItems: 3,
        externalIdProp: ''
    };

    //OCA 06/05/2016 BEGIN - Storing all parameters for available view in cookies
    $scope.storeSelection = {
        onItemSelect: function (item) {
            $cookies.SelIdleSC = JSON.stringify($scope.selBoxSkillCModel);
            $cookies.SelIdleCities = JSON.stringify($scope.selBoxCityModel);
        },
        onItemDeselect: function (item) {
            $cookies.SelIdleSC = JSON.stringify($scope.selBoxSkillCModel);
            $cookies.SelIdleCities = JSON.stringify($scope.selBoxCityModel);
        }
    };
    //OCA 06/05/2016 END

    //------------Loading external data of the idle people from dispo.csv file
    var dsv = d3.dsv(";", "text/plain; charset=UTF-8");

    dsv("data/dispos.csv", function (error, data) {
        //Cleaning idle people lists of the scope
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
        var cityIndex = 1;
        //Reading external data
        data.forEach(function (d) {
            d.color = color(d["Production Unit"]);
            //Special condition for PBS Paris
            if (d["RMA"] == "FR03PB03 - BS" && d["Office"] == "FR-PAR-SETOILE (SURESNES CEDEX,FR)") { d.color = "#a4cc70"/*green*/; }
            //Creation of citiesList content from external data read
            if (citiesList.map(function (e) { return e.value; }).indexOf(d["Office"]) == -1) {
                var newCity = {
                    id: cityIndex,
                    value: d["Office"],
                    label: d["Office"].slice(d["Office"].indexOf("(") + 1, d["Office"].indexOf(")")).toUpperCase()
                };
                citiesList.push(newCity);
                cityIndex = cityIndex + 1
            };
            $scope.models.availableList[d.Week].items.unshift(d);
        });
        //JMD 03/05/2016 - Change sort
        citiesList.sort(function (a, b) { return a.label.localeCompare(b.label); });
        $scope.selBoxCityData = citiesList;
        //OCA 06/05/2016 BEGIN - Setting up initial comboselect values
        if ($cookies.SelIdleCities == undefined || $cookies.SelIdleCities == "undefined")
        { $scope.selBoxCityModel = citiesList.slice(0); }
        else
        { $scope.selBoxCityModel = JSON.parse($cookies.SelIdleCities); };
        if ($cookies.SelIdleSC == undefined || $cookies.SelIdleSC == "undefined")
        { $scope.selBoxSkillCModel = $scope.listSC.slice(0, 1); }
        else
        { $scope.selBoxSkillCModel = JSON.parse($cookies.SelIdleSC); };
        //OCA 06/05/2016 END
        $scope.$apply();
    });

    //------------Filters for the lists of each column
    $scope.col1Filter = function (item) {
        var itemSelected = false;
        if ((item["Global practice"] == "AMOA" || item["Global practice"] == "CONSEIL")
            && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
            && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office"]) != -1)
        { itemSelected = true; };
        return itemSelected;
    }

    $scope.col2Filter = function (item) {
        var itemSelected = false;
        if (item["Global practice"] != "AMOA" && item["Global practice"] != "EM"
            && item["Global practice"] != "PMO" && item["Global practice"] != "QUALITE"
            && item["Global practice"] != "AMOE" && item["Global practice"] != "NTIC"
            && item["Global practice"] != "SAP" && item["Global practice"] != "CONSEIL"
            && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
           && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office"]) != -1)
        { itemSelected = true };
        return itemSelected;
    }

    $scope.col3Filter = function (item) {
        var itemSelected = false;
        if ((item["Global practice"] == "EM" || item["Global practice"] == "PMO" || item["Global practice"] == "QUALITE")
             && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
             && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office"]) != -1)
        { itemSelected = true };
        return itemSelected;
    }

    $scope.col4Filter = function (item) {
        var itemSelected = false;
        if ((item["Global practice"] == "AMOE" || item["Global practice"] == "NTIC" || item["Global practice"] == "SAP")
             && $scope.selBoxSkillCModel.map(function (e) { return e.value; }).indexOf(item["RMA"]) != -1
             && $scope.selBoxCityModel.map(function (e) { return e.value; }).indexOf(item["Office"]) != -1)
        { itemSelected = true };
        return itemSelected;
    }
}]);
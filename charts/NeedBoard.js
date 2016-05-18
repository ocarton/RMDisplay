var app = angular.module('NeedBoard', ['ngCookies','angularjs-dropdown-multiselect', 'dragularModule'])
.controller('NeedCtrl', ['$scope', '$cookies', '$element', 'dragularService', function ($scope, $cookies, $element, dragularService) {
    dragularService('.containerVertical', { removeOnSpill: true });

    var root;
    var skillList = ["NTIC", "DBA", "MAINFRAME", "ARCHIT", "EM", "SAP", "AMOE", "CONSEIL", "AMOA", "PLM", "AUTRES"];
    var color = d3.scale.ordinal()
        .range(["#ABA9FF", "#ABA9FF", "#ABA9FF", "#FFD4E0", "#FF9BB8", "#FFF4D4", "#FFE69B", "#C6FF9B", "#C6FF9B", "#FFFFFF", "#FFFFFF"])
        .domain(skillList);

    practiceList = [
        { id: 1, label: "CSD" },
        { id: 2, label: "PBS" },
        { id: 3, label: "ADM" },
        { id: 4, label: "AUTRES" }];

    $scope.selBoxPracticeData = practiceList;

    $scope.selBoxPracticeSettings = {
        smartButtonMaxItems: 3,
        externalIdProp: ''
    };

    $scope.requests = {
        selected: null,
        lists: [],
    };

    // OCA 06/05/2016 - Filter for NA elements
    $scope.isNAFilter = function (item) {
        var itemSelected = true;
        if (item != undefined) {
            if (item["Propale_CSD"] == "NA" || item["Propale_CSD"] == "X")
            { itemSelected = !$scope.checkUnknown; };
        }
        return itemSelected;
    }

    $scope.practiceFilter = function (item) {
        var practiceSelected = false
        angular.forEach($scope.selBoxPracticeModel, function (value) { if (value.label == item.Practice) { practiceSelected = true } });
        return practiceSelected;
    }
    //OCA 06/05/2016 END

    //OCA 06/05/2016 BEGIN - Storing all parameters for available view in cookies
    $scope.storeSelection = {
        onItemSelect: function (item) {
            $cookies.SelNeedsOrigin = JSON.stringify($scope.selBoxPracticeModel);
        },
        onItemDeselect: function (item) {
            $cookies.SelNeedsOrigin = JSON.stringify($scope.selBoxPracticeModel);
        }
    };
    $scope.CheckBoxChanged = function () {
        $cookies.SelNeedsHideNA = JSON.stringify($scope.checkUnknown);
    }
    //OCA 06/05/2016 END

    //-------------------------------------------------------------------------------
    // Main function. It loads the data
    //-------------------------------------------------------------------------------
    function loadData() {
        console.log("Reloading Requests data")

        d3.json("data/TRoomRequests.json", function (error, reqdata) {
            if (error) throw error;
            // OCA 06/05/2016 - Commented : obviously useless
            //$scope.requests.lists = [];
            reqdata.children.forEach(function (d) {
                if (d.Propale_CSD == 0) { d.Propale_CSD = "" }
                if (d.Propale_CSD == 0) { d.Propale_CSD = "" }
                if (d.Practice == "CSD" || d.Practice == "PBS") { d.Link = "https://troom.capgemini.com/sites/FicheMissionStafingRequest/Lists/Besoins%20%20" + d.Practice + "%202" }
                if (d.Practice == "ADM") { d.Link = "https://troom.capgemini.com/sites/FicheMissionStafingRequest/Lists/Liste%20test" }
                if (d.Practice == "AUTRES") { d.Link = "https://troom.capgemini.com/sites/FicheMissionStafingRequest/Lists/Besoins%20%20Commerce%20%20Autres" }
                d.color = color(d["Global_Practice"]);
                d.description = encodeURIComponent(d.description);
                $scope.requests.lists.unshift(d);
            });
            $scope.$apply();
        })

        //OCA 06/05/2016 BEGIN - Setting up initial comboselect values
        if ($cookies.SelNeedsOrigin == undefined || $cookies.SelNeedsOrigin == "undefined")
        { $scope.selBoxPracticeModel = practiceList.slice(0); }
        else
        { $scope.selBoxPracticeModel = JSON.parse($cookies.SelNeedsOrigin); };
        if ($cookies.SelNeedsHideNA == undefined || $cookies.SelNeedsHideNA == "undefined")
        {
            console.log($scope.checkUnknown)
            // JMD 04/05/2016 - initialization of NA checkbox
            $scope.checkUnknown = { value: true }
            console.log($scope.checkUnknown)
        }
        else
        { $scope.checkUnknown = JSON.parse($cookies.SelNeedsHideNA); };
        //OCA 06/05/2016 END
    }

    loadData();

}])


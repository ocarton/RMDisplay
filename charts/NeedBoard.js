var app = angular.module('NeedBoard', ['angularjs-dropdown-multiselect', 'dragularModule'])
.controller('NeedCtrl', ['$scope', '$element', 'dragularService', function TodoCtrl($scope, $element, dragularService) {
    dragularService('.containerVertical', { removeOnSpill: true });
    
    var root;
    var skillList = ["NTIC", "DBA", "MAINFRAME", "ARCHIT", "EM", "SAP", "AMOE", "CONSEIL", "AMOA", "PLM", "AUTRES"];
    var color = d3.scale.ordinal()
        .range(["#ABA9FF", "#ABA9FF", "#ABA9FF",  "#FFD4E0", "#FF9BB8", "#FFF4D4", "#FFE69B", "#C6FF9B","#C6FF9B", "#FFFFFF", "#FFFFFF"])
        .domain(skillList);

    practiceList = [
        { id: 1, label: "CSD" },
        { id: 2, label: "PBS" },
        { id: 3, label: "ADM" },
        { id: 4, label: "AUTRES" }];
    practiceSelList = practiceList.slice(0);

    $scope.selBoxPracticeModel = practiceSelList
    $scope.selBoxPracticeData = practiceList;

    $scope.selBoxPracticeSettings = {
        smartButtonMaxItems: 3,
        externalIdProp: ''
    };

    $scope.requests = {
        selected: null,
        lists: [],
    };

    $scope.practiceFilter = function (item) {
        var practiceSelected = false
        angular.forEach($scope.selBoxPracticeModel, function (value) { if (value.label == item.Practice) { practiceSelected = true }  });
        return practiceSelected;
    }

    //-------------------------------------------------------------------------------
    // Main function. It loads the data
    //-------------------------------------------------------------------------------
    function loadData() {
        console.log("Reloading Requests data")
        d3.json("data/TRoomRequests.json", function (error, reqdata) {
            if (error) throw error;
            $scope.requests.lists
            reqdata.children.forEach(function (d) {
                if (d.Propale_CSD == 0) { d.Propale_CSD = "" }
                d.color = color(d["Global_Practice"]);
                $scope.requests.lists.unshift(d);
            });
            $scope.$apply();
        })
    }  
 
    loadData();

 }])


/// <reference path="../typings/angular2/angular2.d.ts"/>
//angular.module('IdleBoard', []).controller('IdleCtrl', function($scope) {
angular.module("IdleBoard", []).controller("IdleCtrl", function($scope) {

   $scope.tableau = ['Element1','Element2','Element3','Element4'];

    $scope.models = {
        selected: null,
        lists: {"A": [], "B": []}
    };

    // Generate initial model
    for (var i = 1; i <= 3; ++i) {
        $scope.models.lists.A.push({label: "Item A" + i});
        $scope.models.lists.B.push({label: "Item B" + i});
    }

    // Model to JSON for demo purpose
    $scope.$watch('models', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);

});
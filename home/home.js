angular.module( 'sample.home', [
'auth0'
])
.controller( 'HomeCtrl', function HomeController( $scope, auth, $http, $location, $anchorScroll, store) {

  $scope.auth = auth;

  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.navigate = function (hash) {
      console.log($location.hash())
      if (hash == $location.hash()) { $location.hash('TOP'); $anchorScroll(); console.log($location.hash()) }
      $location.hash(hash); $anchorScroll();
      //d3.select(".section").attr("style", "display: inline;")
      //d3.select(".section#ARVEPage").attr("style", "display: none;")
  }

});
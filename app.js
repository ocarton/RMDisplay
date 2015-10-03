// app.js
angular.module('RMBoard', ['auth0', 'angular-storage', 'angular-jwt'])
.config(function (authProvider) {
  authProvider.init({
    domain: 'ocarton.eu.auth0.com',
    clientID: 'DoSDUdFuDMBT70SDScOUL2ZrHGjL1Sex'
  });
})
.run(function(auth) {
  // This hooks al auth events to check everything as soon as the app starts//
  auth.hookEvents();
});
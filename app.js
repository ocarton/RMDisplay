angular.module('YOUR-APP-NAME', ['auth0', 'angular-storage', 'angular-jwt'])
.config(function (authProvider) {
  authProvider.init({
    domain: 'ocarton.eu.auth0.com',
    clientID: 'DoSDUdFuDMBT70SDScOUL2ZrHGjL1Sex'
  });
})
.run(function(auth) {
  // This hooks al auth events to check everything as soon as the app starts
  auth.hookEvents();
});


$('a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top
    }, 500);
    return false;
});
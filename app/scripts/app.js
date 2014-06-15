'use strict';

angular.module('gameRtcApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'gameRtcApp.factories',
  'gameRtcApp.directives'
])
  .config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);

    // allow cross-domain ajax
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

  }]);

angular.module('gameRtcApp.factories', []);
angular.module('gameRtcApp.directives', []);
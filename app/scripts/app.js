'use strict';

angular.module('gameRtcApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'gameRtcApp.factories',
  'gameRtcApp.directives'
])
  .config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  }]);

angular.module('gameRtcApp.factories', []);
angular.module('gameRtcApp.directives', []);
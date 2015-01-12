var heekerApp = angular.module('heekerApp', [
    'ngRoute', 'ngAnimate',
    'heekerCtrls', 'heekerServices',
    'heekerDirectives'
]);

heekerApp.config(function($routeProvider, $httpProvider) {
    $routeProvider.when('/login', {
        templateUrl: 'tpls/login.html',
        controller: 'LoginCtrl'
    }).when('/heeking',{
    	templateUrl:'tpls/heeking.html',
    	controller:'HeekingCtrl'
    }).otherwise({
        redirectTo: '/login'
    })

    $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    $httpProvider.defaults.headers.put["Content-Type"] = "application/x-www-form-urlencoded";
});

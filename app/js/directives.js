var heekerDirectives = angular.module('heekerDirectives', []);

heekerDirectives.directive('message', [
    function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                message: '=',
                myid: '@'
            },
            templateUrl: 'tpls/message.html',
            link: function (scope, element, attrs) {
                element.find('.message')
                    .css('max-width', element.width() - 70);

                if (scope.message.from == scope.myid) {
                    scope.whoseMessage = 'my_message clearfix';
                    scope.mediaSite = 'media-right';
                    scope.alertStyle = 'alert-success';
                }
                else if (scope.message.to == scope.myid) {
                    scope.whose_message = 'your_message';
                    scope.mediaSite = 'media-left';
                    scope.alertStyle = 'alert-info';
                }
            }
        };
}]);

heekerDirectives.directive('scrollBottom', function () {
    return {
        restrict: 'A',
        scope: {
            messages: '=scrollBottom'
        },
        link: function (scope, elem, attrs) {
            scope.$watchCollection('messages', function (newValue) {
                if (newValue) {
                    elem.scrollTop(elem.children('ul')[0].offsetHeight);
                }
            });
        }
    };
});

heekerDirectives.directive('equals', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function (scope, elem, attrs, ngModel) {
            if (!ngModel) return; // do nothing if no ng-model

            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate();
            });

            // observe the other value and re-validate on change
            attrs.$observe('equals', function(val) {
                validate();
            });

            var validate = function() {
                // values
                var val1 = ngModel.$viewValue;
                var val2 = attrs.equals;

                // set validity
                if (val1 && val2)
                    ngModel.$setValidity('equals', val1 === val2);
            };
        }
    };
});

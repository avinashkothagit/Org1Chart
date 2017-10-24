'use strict';

var module = angular.module('orgchart.directives', [
    'orgchart.services',
    'ngAnimate'
]);

module.directive('animateOnPhoto', ['$animate', function($animate) {
    return function(scope, ele, attr) {
        attr.$observe('animateOnPhoto', function(value) {

            var animationClass = attr.animateName;
            var defaultImageURL = 'data:image/png;base64,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';
            ele.css("background-image","url('" + defaultImageURL + "')");

            //no animateClass passed in. default to nothing.
            if (!angular.isDefined(animationClass)) {
                animationClass = '';
            }

            $animate.removeClass(ele,animationClass);

            var image = new Image();
            image.src = attr.animateOnPhoto;

            $animate.addClass(ele,animationClass);

            image.onload = function() {
                ele.css("background-image","url(" + attr.animateOnPhoto + ")");
            };

            image.isError = function() {
                ele.css("background-image","url('" + defaultImageURL + "')");
            }
        })
    }
}]);

module.directive('searchWatch', ['$timeout', 'sharedFunctions', function($timeout, sharedFunctions) {
    return function(scope, ele, attr) {

        var startTimer = false;
        var counter = 0;
        var timerObj;

        scope.$watch(attr.ngModel, function(queryString) {

            sharedFunctions.toggleSearchDisplay("hide");

            if (angular.isDefined(queryString)) {

                if (queryString.length >= 3 && counter < 2) {
                    startTimer = true;
                    counter = 0;

                    if (counter == 0) {
                        scope.stopCounter();
                        scope.runCounter();
                    }
                } else {
                    scope.stopCounter();
                }
            }

            scope.runCounter = function() {
                if (counter < 2) {
                    counter++;
                    timerObj = $timeout(scope.runCounter, 100);
                } else {
                    scope.searchEmployee(queryString);
                    scope.stopCounter();
                }
            };

            scope.stopCounter = function() {
                startTimer = false;
                counter = 0;
                $timeout.cancel( timerObj );
            }

        })
    }
}]);

module.directive('searchToggle', ['$animate', 'sharedFunctions', function($animate, sharedFunctions) {
    return function (scope, ele, attr) {
        attr.$observe('searchToggle', function() {

            var managerDetailEle = angular.element(document.getElementById('managerDetail'));
            var managerDetailClassOn = 'overflowScrolling-touch';
            var managerDetailClassOff = 'overflowScrolling-default';

            var searchToggleEle = angular.element(document.getElementById('searchToggle'));
            var searchToggleOn = 'icon-utility-close';
            var searchToggleOff = 'icon-utility-search';

            if (attr.searchToggle == 'false') {
                managerDetailEle.removeClass(managerDetailClassOff).addClass(managerDetailClassOn);
                searchToggleEle.removeClass(searchToggleOn).addClass(searchToggleOff);
            } else {
                managerDetailEle.removeClass(managerDetailClassOn).addClass(managerDetailClassOff);
                searchToggleEle.removeClass(searchToggleOff).addClass(searchToggleOn);
            }
        });
    }
}]);
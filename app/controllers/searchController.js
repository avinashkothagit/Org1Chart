'use strict';

var app = angular.module('orgchart.controllers', []);

app.controller('searchController', ['$scope', '$timeout', 'Search', '$sce', 'sharedFunctions',
    function ($scope, $timeout, Search, $sce, sharedFunctions) {

        $scope.searchEmployee = function (searchString) {

            Search.getSearch({search: searchString}).then(onSuccess, onError);

            function onSuccess(response) {

                if (response.data.length > 0) {
                    $scope.search = response.data;
                } else {
                    var currSearchString = $sce.trustAsHtml("<span class=\"unknownSearch\">" + searchString + "</span>");
                    $scope.search = [
                        {"id": $scope.employee.id, "name": currSearchString + " is not found"}
                    ];
                }

                sharedFunctions.toggleSearchDisplay("flex");

            }

            function onError(response) {
                if (response.status == 401) {
                    $scope.toggleSearch();
                    $scope.toggleExpiredTokenOverlay();
                }
            }
        };

        var init = function () {
            var searchResultWrapper = document.getElementById('searchResultWrapper');

            searchResultWrapper.addEventListener('touchmove', function (event) {
                event.preventDefault();
            });
        };

        init();

    }
]);
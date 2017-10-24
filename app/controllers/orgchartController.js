'use strict';

var module = angular.module('orgchart', [
    'ngSanitize',
    'ngAnimate',
    'ngTouch',
    'orgchart.controllers',
    'orgchart.services',
    'orgchart.directives',
    'jmdobry.angular-cache'
]);

module.controller('orgchartController', ['$scope', 'sharedFunctions', 'orgChartCacheService',
    function ($scope, sharedFunctions, orgChartCacheService) {

        //defaults
        $scope.includePath = '../views/includes/';
        $scope.initialLoadFlag = true;  // Included as part of fix for 7.0.6 manager scroll bug
        $scope.listToggleFlag = true;
        $scope.ellipsisFlag = false;
        $scope.searchFlag = false;
        $scope.expiredTokenFlag = false;
        $scope.employee = {};

        var me;

        $scope.searchClick = function (employee) {
            if (typeof employee.id == "undefined") {
                // No-op.  The search term is invalid.
                return;
            }

            if (employee.id != $scope.employee.id || employee.id != me.id) {
                // Search for new employee.  Do the things.
                $scope.getEmployee(employee);
            }

            $scope.toggleSearch();
        };

        $scope.repaintView = function (employee) {
            if ($scope.initialLoadFlag) {           //
                $scope.toggleListView();            // Included as part of fix for 7.0.6 manager scroll bug
                $scope.initialLoadFlag = false;     //
            }
        };

        var onServiceError = function (response) {
            if (response.status == 401) {
                $scope.expiredTokenFlag = true;
            } else if ( response.status == 404 && typeof me == "undefined" ) {
                orgChartCacheService.getEmployee('marcb@salesforce.com')       //fallback. if service cannot find current user. route to marc b.
                    .then(function (data) {
                        me = data;
                        $scope.employee = data;
                        $scope.employeeTitle = data.title;
                        $scope.repaintView(data);
                    })
            }
        };

        $scope.getEmployee = function (employee) {
            // Update employee object with whatever info we already have for the new employee
            $scope.employee = employee;
            $scope.employeeTitle = employee.title;

            var id = employee.email;

            // Then request the full employee object

            orgChartCacheService.getEmployee(id)
                .then(function (data) {

                    $scope.employee = data;
                    $scope.employeeTitle = data.title;

                }, onServiceError);
        };

        $scope.hasReports = function () {
            var reportsCount = $scope.employee.directReports;

            if (typeof reportsCount == "undefined") {
                return false;
            }
            return reportsCount.length > 0;
        };

        $scope.showReportsString = function () {
            var reportsCount = $scope.employee.directReports;

            if (typeof reportsCount == "undefined") {
                return false;
            }
            return reportsCount.length - 8 > 0;
        };

        $scope.hasPeer = function (direction) {
            var peers = $scope.employee.peers;

            if (typeof peers == "undefined") {
                return false;
            }
            return peers.length > 0;
        };

        $scope.getRightPeer = function () {
            $scope.getPeer('right');
        };

        $scope.getLeftPeer = function () {
            $scope.getPeer('left');
        };

        $scope.getPeer = function (direction) {
            var currentEmployee = $scope.employee.name;
            var peers = $scope.employee.peers;

            peers.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });

            if (direction == 'left') {
                peers.reverse();
            }

            var peer;
            var leftPeerFound = true;
            var rightPeerFound = true;

            for (var i = 0; i < peers.length; i++) {
                var n = peers[i].name.localeCompare(currentEmployee);
                if (direction == 'left') {
                    if (n == -1) {
                        leftPeerFound = true;
                        peer = peers[i];
                        break;
                    } else {
                        leftPeerFound = false;
                    }
                } else {
                    if (n == 1) {
                        rightPeerFound = true;
                        peer = peers[i];
                        break;
                    } else {
                        rightPeerFound = false;
                    }
                }
            }

            if ((!leftPeerFound) && (direction == 'left')) {
                peer = peers[0];
            }

            if ((!rightPeerFound) && (direction == 'right')) {
                peer = peers[0];
            }

            if (typeof peer !== "undefined") {
                $scope.getEmployee(peer);
            }
        };

        $scope.toggleSearch = function () {
            $scope.searchFlag = !$scope.searchFlag;
        };

        $scope.togglePhoneSelector = function (objLength) {

            var phoneObject = $scope.employee.phones;

            if (phoneObject.length > 1) {
                $scope.phoneSelectorFlag = !$scope.phoneSelectorFlag;
            } else {
                for (var i = 0; i < phoneObject.length; i++) {
                    $scope.callEmployee(phoneObject[i].value);
                }
            }
        };

        $scope.toggleExpiredTokenOverlay = function () {
            $scope.expiredTokenFlag = !$scope.expiredTokenFlag;
        };

        $scope.toggleListView = function () {
            $scope.listToggleFlag = !$scope.listToggleFlag;
        };

        $scope.callEmployee = function (number) {
            window.top.location = "tel:" + number;
        };

        $scope.employeeFocusDetail = function (viewflag) {
            if (viewflag == true) {
                $scope.toggleListView();
            } else {
                if ($scope.employee && $scope.employee.id) {
                    Sfdc.canvas.client.publish(canvasContext.client, {
                        name: 's1.navigateToSObject',
                        payload: {
                            recordId: $scope.employee.id,
                            view: 'detail'
                        }
                    });
                }
            }
        };

        $scope.sendTokenExpired = function () {
            Sfdc.canvas.client.repost({refresh : true});
        };

        $scope.hasOverflow = function (directReportsSize) {
            return directReportsSize > 8 ? "hasOverflow" : "noOverflow";
        };

        $scope.reduceSearchResults = function (searchResults) {
            if (angular.isDefined(searchResults)) {
                var result = [];
                var resultUl = document.getElementById('searchResultWrapper').getElementsByTagName('UL');
                var resultLi = 32;
                var eleHeight = resultUl[0].offsetHeight;
                var windowHeight = window.innerHeight;
                var sf1NavBar = 74; // sf1bar height and padding(50) && ellipsis(24px)
                var limit = (windowHeight - sf1NavBar) / resultLi;

                if ((eleHeight >= windowHeight) && (searchResults.length >= limit)) {
                    var count = 1; //start index @ 1

                    searchResults.forEach(function (value, key) {
                        if (count <= Math.floor(limit)) {
                            count++;
                            result[key] = value;
                            $scope.ellipsisFlag = true;
                        }
                    });

                } else {
                    result = searchResults;
                    $scope.ellipsisFlag = false;
                }

                return result;
            }
        };

        var init = function () {
            var mgrDetail = document.getElementById('managerDetail');
            var empDetail = document.getElementById('employeeDetail');
            var overlay = document.getElementById('overlay');
            var phoneSel = document.getElementById('phoneSelector');
            var startingPoint;
            var currentUserEmail = canvasContext.context.user.email;

            //async loading the initial model
            orgChartCacheService.me(currentUserEmail)
                .then(function (data) {
                    $scope.employee = data;
                    $scope.employeeTitle = data.title;
                    me = data;
                    $scope.repaintView(data);       // Included as part of fix for 7.0.6 manager scroll bug

                }, onServiceError);

            // Swallow touchmove events in the employee area.
            empDetail.addEventListener('touchmove', function (event) {
                event.preventDefault();
            });

            overlay.addEventListener('touchmove', function (event) {
                event.preventDefault();
            });

            phoneSel.addEventListener('touchmove', function (event) {
                event.preventDefault();
            });

            mgrDetail.addEventListener('touchstart', function (event) {
                startingPoint = event.changedTouches[0].clientY;
            });

            mgrDetail.addEventListener('touchmove', function (event) {
                var nextPoint = event.changedTouches[0].clientY;

                if ((startingPoint > nextPoint) && (mgrDetail.scrollTop <= 0)) {
                    event.preventDefault();
                }

                if ((startingPoint < nextPoint) && ((mgrDetail.clientHeight + mgrDetail.scrollTop) >= mgrDetail.scrollHeight)) {
                    event.preventDefault();
                }
            });


            window.addEventListener('shake', function () {
                if ($scope.employee != me) {
                    $scope.employee = me;
                    $scope.employeeTitle = me.title;
                    $scope.$apply();
                }
            }, false);
        };

        init();

    }

]);

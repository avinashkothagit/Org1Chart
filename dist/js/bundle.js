(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./vendor/canvas-all');
require('angular-animate');
require('angular-sanitize');
require('angular-touch');
require('./vendor/shake.js');
require('./vendor/angular-cache-2.3.4.min');
var orgchart = require('./controllers/orgchartController');
var search = require('./controllers/searchController');
var services = require('./services');
var directives = require('./directives.js');
var ellipsis = require('./vendor/angular-ellipsis.js');
},{"./controllers/orgchartController":2,"./controllers/searchController":3,"./directives.js":4,"./services":5,"./vendor/angular-cache-2.3.4.min":6,"./vendor/angular-ellipsis.js":7,"./vendor/canvas-all":8,"./vendor/shake.js":9,"angular-animate":11,"angular-sanitize":13,"angular-touch":15}],2:[function(require,module,exports){
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
module.controller('orgchartController', [
  '$scope',
  'sharedFunctions',
  'orgChartCacheService',
  function ($scope, sharedFunctions, orgChartCacheService) {
    //defaults
    $scope.includePath = '../views/includes/';
    $scope.initialLoadFlag = true;
    // Included as part of fix for 7.0.6 manager scroll bug
    $scope.listToggleFlag = true;
    $scope.ellipsisFlag = false;
    $scope.searchFlag = false;
    $scope.expiredTokenFlag = false;
    $scope.employee = {};
    var me;
    $scope.searchClick = function (employee) {
      if (typeof employee.id == 'undefined') {
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
      if ($scope.initialLoadFlag) {
        //
        $scope.toggleListView();
        // Included as part of fix for 7.0.6 manager scroll bug
        $scope.initialLoadFlag = false;  //
      }
    };
    var onServiceError = function (response) {
      if (response.status == 401) {
        $scope.expiredTokenFlag = true;
      } else if (response.status == 404 && typeof me == 'undefined') {
        orgChartCacheService.getEmployee('marcb@salesforce.com').then(function (data) {
          me = data;
          $scope.employee = data;
          $scope.employeeTitle = data.title;
          $scope.repaintView(data);
        });
      }
    };
    $scope.getEmployee = function (employee) {
      // Update employee object with whatever info we already have for the new employee
      $scope.employee = employee;
      $scope.employeeTitle = employee.title;
      var id = employee.email;
      // Then request the full employee object
      orgChartCacheService.getEmployee(id).then(function (data) {
        $scope.employee = data;
        $scope.employeeTitle = data.title;
      }, onServiceError);
    };
    $scope.hasReports = function () {
      var reportsCount = $scope.employee.directReports;
      if (typeof reportsCount == 'undefined') {
        return false;
      }
      return reportsCount.length > 0;
    };
    $scope.showReportsString = function () {
      var reportsCount = $scope.employee.directReports;
      if (typeof reportsCount == 'undefined') {
        return false;
      }
      return reportsCount.length - 8 > 0;
    };
    $scope.hasPeer = function (direction) {
      var peers = $scope.employee.peers;
      if (typeof peers == 'undefined') {
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
      if (!leftPeerFound && direction == 'left') {
        peer = peers[0];
      }
      if (!rightPeerFound && direction == 'right') {
        peer = peers[0];
      }
      if (typeof peer !== 'undefined') {
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
      window.top.location = 'tel:' + number;
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
      Sfdc.canvas.client.repost({ refresh: true });
    };
    $scope.hasOverflow = function (directReportsSize) {
      return directReportsSize > 8 ? 'hasOverflow' : 'noOverflow';
    };
    $scope.reduceSearchResults = function (searchResults) {
      if (angular.isDefined(searchResults)) {
        var result = [];
        var resultUl = document.getElementById('searchResultWrapper').getElementsByTagName('UL');
        var resultLi = 32;
        var eleHeight = resultUl[0].offsetHeight;
        var windowHeight = window.innerHeight;
        var sf1NavBar = 74;
        // sf1bar height and padding(50) && ellipsis(24px)
        var limit = (windowHeight - sf1NavBar) / resultLi;
        if (eleHeight >= windowHeight && searchResults.length >= limit) {
          var count = 1;
          //start index @ 1
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
      orgChartCacheService.me(currentUserEmail).then(function (data) {
        $scope.employee = data;
        $scope.employeeTitle = data.title;
        me = data;
        $scope.repaintView(data);  // Included as part of fix for 7.0.6 manager scroll bug
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
        if (startingPoint > nextPoint && mgrDetail.scrollTop <= 0) {
          event.preventDefault();
        }
        if (startingPoint < nextPoint && mgrDetail.clientHeight + mgrDetail.scrollTop >= mgrDetail.scrollHeight) {
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
},{}],3:[function(require,module,exports){
'use strict';
var app = angular.module('orgchart.controllers', []);
app.controller('searchController', [
  '$scope',
  '$timeout',
  'Search',
  '$sce',
  'sharedFunctions',
  function ($scope, $timeout, Search, $sce, sharedFunctions) {
    $scope.searchEmployee = function (searchString) {
      Search.getSearch({ search: searchString }).then(onSuccess, onError);
      function onSuccess(response) {
        if (response.data.length > 0) {
          $scope.search = response.data;
        } else {
          var currSearchString = $sce.trustAsHtml('<span class="unknownSearch">' + searchString + '</span>');
          $scope.search = [{
              'id': $scope.employee.id,
              'name': currSearchString + ' is not found'
            }];
        }
        sharedFunctions.toggleSearchDisplay('flex');
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
},{}],4:[function(require,module,exports){
'use strict';
var module = angular.module('orgchart.directives', [
    'orgchart.services',
    'ngAnimate'
  ]);
module.directive('animateOnPhoto', [
  '$animate',
  function ($animate) {
    return function (scope, ele, attr) {
      attr.$observe('animateOnPhoto', function (value) {
        var animationClass = attr.animateName;
        var defaultImageURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAADAFBMVEVQjrRVn81RmsdMkb2BrctNlcKTutR1rdGixNxLj7pUn89Ii7RNl8RqocRTodCxzeLB3fJSnMq50uZPmcZPm8l7qclRns7P4O+Xu9ROmcaHsc671ei52fFMlcGLtdFQmchzo8JOlcFOmMZKjriy1OxFha1alblLk75Fhq5qmrtTncpXm8a00OXR4vFimr7E2ep6tt1gmLrN3u1Gh69fp9XM4vNIibKryN5TnsydwduHvuJnnsCUw+REhq9KkbyZxubI3e1Pl8RUn82sy+Hf7/5EhKtHibJJjLZDgaiizOlJj7lSnMh1s9ten8fV6PlTlb5nq9XL3Ounx91EgqhJjbdXodC/2OyQt9KBut7F3O52psVPl8JKjbdQiq7D2uycyOfI4fVIirOavthglbZMjLNYkbViqdVwn76Es9Kp0Oywy9/E4PRPmMZVoM9bpdNapdTb7PzQ5fXB2OpNlMLQ5/lGhKrB1udLkLt6r9JNlsOeyuhDhq9tr9lwq8/X6vvM4/VJirHQ4vLJ3vBUkLVLkr3V5vbN5fhMh6zI2uq+1+mgwNdIhatFg6lYpNJXpNLa6vnb6/rU5fRTodLT5PPQ4fDc7PvZ6fjO3+5UodLd7fzV5vXe7v3X5/bM3ezS4/LW5vXY6fjV5fTU5PPW5/bY6PdSoNDT4/JToNBRoM/X6PfZ6vlSn9Da6/rS4vHQ4O9Qnczb7PvP3+5Rn8/c7fxSn8/O3u1Qns1SoM/R4fBRncxWotFLlMBRmshVodBRnctMlMBMlMFRns1Qm8lVotBHiLFUoM5Pm8pWotBRn85ToNFSns5Sn85WodBQnMpPnMpVodFLlMFDgadUoNBPmshOl8RTn9BQnctSnc1Qm8tSnsxMk79RmcVTns9Rnc1PnMtRnMtMlMJVo9JDgqlJjbhFh69OlsLG2+xFh7BZpNLQ4fFYpdNSnczW5/dOkbnS4/N8uN7O4PBQlcFuqMxCha5UotJTodFWo9JVotJXo9JSoNFZpdNSodFRoNFapdNZpNNYpNOaiSeMAAANB0lEQVR4AezPUarCQAwF0Owfmj3Ob78zQ0m5E6sitj5/hZdwzw6O7Bc2lokE5jJsv5DzYnMk4pt9jXRFOtr/RhpSap8RRVJ6jQTSinMkkFi8I4rU9BVpSK49Ix3p9UdEkZ7eI4YC7IgML2AckdULWHcxL8FkeAlD1EtQCS8hxItg5L+RWQQjP8QII4wwwggjjDASRTBywggjjDAyb9TRsYqDMByA8VfwATL2ATpkkoCLixCko5tOggixQ6cSvM1NzeIgWW4uHQq+VDkOupbCyQ23dDnumuQf4+8NPr6K4R+MVesMwVtSeAcZPpkyFPn8saIQnESlDH9Ro4DOawjJfTSFf4iLW+V2yOO22ct/OUTc3RBMGvkCdJudDMnTWL4o82fnQnBQSwVl4liI30hFiJsJaQ3oOJLqpiNr9ZkIuZJ61JJRJ0J2aNS1D76WD9keRgPQrls25IMMoxENXTSEFaMptX/XCul0YDQZRDoNWiHYuwwmpQuF5OVg2BE+BPLHk3SBEIYGAEQ55K5qcxkgJHc1yiHpBUZN7YYkAspbbjOExwIMutoLYZ4AFNgLOQpIJ2orhJ4FqIzZCWHlGVhqJyQ49cDeuY2Q3WcPTWxshBS9BQl8CD/ZCPFamJBvbsropakoDODbxeYIpt3VQLQGixh07hjtYXFFpXb2FGsRgc4VWMiKXu5DbwMZoeKDFcgQfJDBrDsE+xNke2ke9jIIrLe9Kj4kUh7Q104q5u7ZOdvgnvPg7/nH990f3842CbVarV6vZ+JLUpgk6zZPEBQS/iqFpWvjdbJQYIh7RRL3xgWF/KswnG/2JXWUbtYJzb8uG0JqtdMO5+iKNJ6Ok5VksZiQV9zda/2+4BZ2hP1prtRDpEzYP8UPeWl0FXLUEdVqtVKpwEbvGo9QBJ8x5ouyJO+5hInE4X3dMCpkMQk5ak+HIaQCQah8+sDb7JrB/5lfbC1Nj12QHEOccSuPIURk8SbB7pCPUV4HbsIx0bKjWcoQickjp7CQuyU2oRncTDBPORveMau0zJ4YRfaHGAhBABoD7K2FILbiokMilJQqsclBaBgG/5l0exGEdABii+ylcUzhMK1SfwtpgT1zFECEkICQ5AYbH6YJWaUeTBNnz7xjfwiCEKhqlhMSxDQuqxTBNH72zHdOACEkz8S+EEhCFGV4v8BkD9P0mBYpg2l8BTa5X6ch/JN0HXIjxNmJO/nG+92FFCeB7SG6rirKnMle6sA0g1ZpvtXZCmweJJx2hwCQuK4VOIxgGrdV8mCa6QKTUkjRdd0wDHtDGsl9k00K06StkgvTTJls0t+AgJAfHpNDegdbof25LUoaMTnkbb+IrqpK7PCJyWEQW5gZ6kDCXpNHAgCAEKpUq/aFNGK5Io/ZIG7G30qKWKRB7sxVTUhIb5FLuvk/yWe2lF43S6v8mbaHABLyIlvk89CDz9lLMT5x7oK0QyTZIYlEYze72o5nYXzClm+iA+n54kK7gRpQVSg/hDDlTvkH4rN8KX0iRdtPMzVVQogMugg57gi1XI4Fsp+lo5XLZV3Xr/b1fT/m001I76UJyUvH/hBFiQVy8kMaZyHb2zaGXDm8JCEBj/yQmIiQW8kvsknHFEWx/yLauuwQ708hIX9+L8sl7xZzkUAoL7nEf1tIyO7wsmRygi7y9kBux4G2K+aNJNc5/GXOfkLayNs4gIuTyWsYGiFD0pCAjQ5RA2pIBwxB3lCQ/MFLqRMQxCxMVVzEU8UOubWvgn+a00ugXtqb60EsvGBRISQ65NKRHLJOSDJrGbGbLFL60m7b+z6jdt2yHR3T+bX7vTo+Tz6/J8/k31bAYLAv/qQ93ZMtVsPkRVc4WxFNZK6m3tR7+knX12LRpLjuNzScfkZ8qH5RAEcFWXqqlu6e89+qrIEfnl6UhxbjtfPvHIfUL/wXsokMr6v1HHz/WWZdxv4vaR46mxx9vZ9f+n+1mse/vEMFiR+rNf3SDwZjPcMOY5N/sstp6eofDLQYrrXnvnDZY7Wa/a3IJsL41Zpa39ed/6geDkBQvNcCSMG6rhJj3Y4GtZLHt9FBmPmbKl1rD+qFqJ5NE/UOASSdPoEwd7tVEqjT8WBRpeD679L5RMxmvSG+dTXJ3Vxdjn61evfeSO+uAvmgKXI6LeI4QJjmbrVY+q7M+HV4Ua3a+o+chOMiQARBKJrNy5c8Qu2QKRyXCIJwdavHMtT3m3bF2HCgpl7r1m0uW62KPM8DZFVnCM5x3Ixl66I88Tv6NDzHGlzGrtRFdY6NGAaQKQWyt4cCEnJtpS7J2y671aeqGetzBJyX1qjdRgepVk8gya6UpjgHhwyunoZ/fwKEx/uGHXcnvSkt2XJgGIaLogLZ0xOS4XkSIFA9xHhSV8rb2j3novdW6kq592Zubg4gpCzLyCBMUwp5rLFvAZm9g9rRP4IKUpHlRlEUoTo1MtJpeIY2t3ooKpvNiiSZzmQyxdVV8/IyCgidnLyONAbqG0GY2RpCxrNBGh1EyGTSJDklSZKJogiaHkYI8c4SHMfhOE42NvKVSmVVZwhPkiQcE2cyxVi214jM8fhahMIwrFqtkum0LAjCKeQDIsgMsjVxRJBCKhW5sZGEeWMcRxEEy8Qt/0MSOxuLUbCLsJGNPK9AzGZw6AXZEwSZ59On+26KxQiGGfc+RhB/ZISiONhFmD8vy5VisQgQYKCDMKML+juaG9hvD2E8NQSOuiHLmgL1SrJcnpqampYkzGSiWJZNRj0LejsikYgJwyTY9DRseqkkQOOfIcuXRivk4OATZHr6T0h0VNc96W/o/U4QpjBuea5Xbi6N9aKHrBaLwuvX8o0bNxKtrRKGcdCR7uwMReP+5zf1SQsNh2OiKEySpuHAyuVySRAO4EVEcegJKZZKJZ7npxKJ6bk5jKIotrfXHWVmhnRheF05ZRwcx0nT01WAyLIsHBwUtUP+qykra2sbL1++BEhbInF4BgmH3VGIy/v1juZ2Ohc+gxweJtra2vL5vE0Q1lZWVl68eKHhEWqEQD3BZjuBiCLe0TEHEIJl6WQyeRSd9X/10+oRHQ6zkcirYDC4g+MJkiS3t7dtGxu6Q6AYDEWA6vv7+204jkNHKhIhwuFwJ6yKdeFrGF09uRxLEK9MJtPOzg6Mg4QFsdlsKgqEkCMmvvSk3iwYZnL/GAhsim+yPoc9zjBoIOqSlTWoni+X92EXDw8PgxwHlghYTm7E0YnmqzOW2mmazhEEQQ0MBCVJEkURTqoM95W1NcWhKDRCPmoL3AY3NzcFQYC7iQKBo8OCwYEzCE27C4UCM+G/2pPK3u7upOH/oQplMgEkCxCS53mY/MbGxiY0/ag1ekIgo3avVobFEC+4O5FC1ClQfTuT4ff3yUQike3owAYGFAsLFrfbHYIk511Ndy5X3Dd6QjOhEJ3LhVmWoCgqiGES1FTe8+bzmd3dXTi2VWSQVYBAjwycGQwF39mRYOdPX1FYWFhYe4VTmJ+wO+9ckEmHbwYuhDmGT149YhzHdWSzuCi2QeXM9vYu9AGIBgdaiJJZ15D//t8NliWHZx7+nPzOEGVNdne383nlm4gEjmdP36xECII9XRWQhI6UMEyBOXoUHx/1eTwTEI/HNzobnzk6SwiWA+hwAJFYjILjkE7uu3+BQDdEkPOh/MFuGSJnDAJRWDAr0NU1ILgFB0DnAj1FL8ClfhOaTFUzKFCcpu91U9PB/JGdPAsz8GX3W3KABSe+ONdFJOf8npKnKm/E+SQPazMPljhxsZFD13sbo8Hk6M6dlh+Tcvx3kBvk1xOw4MS67w2qcBCPEVT7BTy4oCJNgyVsoBnWWpPzEBHI0WjH+sBD9eTcvQ4CFB1eVZ3vvUspwxg+Kn4BCmqjmUAw2LAAmrMqhIIPoZZXfQZvkCdDEP1Z0e76YWF7lUJb0C/sMPLMgyWfEsyIoHgVIUVrrV7vq+sgp/M4d1vXVVkcWODsCCHjjhZhff4kIahDNCaPQTmoOClqfWzb1yXLb5CTBCceAEF7AaQBhKqIcH7lTBZc2GoSYjWkiBEbRikfKgdAdnyO7bt9OmaNEIYCOP4FbpSAQz++VOggZMjSPWQSoZDR73G8Dv3XBzlyVCgirQn5wy3mIe/HGYW80kGIHGsYhnEcrbXBORfn2Xdd1/c9m91Y8IWWZXl/aiFOGLjpzfDez9M0GWMsbxu25FgNUg2EEoZFHPvM6mHBXk0/1BMDHYQY4+ScsVYRSfG3kNwSwvbHxDiv68PCL+9DFQx40NCdMSFBMkWDHLeMxDJqYbnIjl7rnvK0rmskBhm3SUHyf5CEeXC+rwtB2klPYSfEjqJBTrgqFILRj4z2FEwYVVwKknsQZdlU9nigXNAg1UHuZ/f2q+5nlyBnd1jQIBerQaQOh1wP0iBShUOAfFbQBpEaHEAqkEh1ECneoRAq3gGkdIlkECqYkUOkXEcOoXIZCinTInlfCWC6C4hDUwYAAAAASUVORK5CYII=';
        ele.css('background-image', 'url(\'' + defaultImageURL + '\')');
        //no animateClass passed in. default to nothing.
        if (!angular.isDefined(animationClass)) {
          animationClass = '';
        }
        $animate.removeClass(ele, animationClass);
        var image = new Image();
        image.src = attr.animateOnPhoto;
        $animate.addClass(ele, animationClass);
        image.onload = function () {
          ele.css('background-image', 'url(' + attr.animateOnPhoto + ')');
        };
        image.isError = function () {
          ele.css('background-image', 'url(\'' + defaultImageURL + '\')');
        };
      });
    };
  }
]);
module.directive('searchWatch', [
  '$timeout',
  'sharedFunctions',
  function ($timeout, sharedFunctions) {
    return function (scope, ele, attr) {
      var startTimer = false;
      var counter = 0;
      var timerObj;
      scope.$watch(attr.ngModel, function (queryString) {
        sharedFunctions.toggleSearchDisplay('hide');
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
        scope.runCounter = function () {
          if (counter < 2) {
            counter++;
            timerObj = $timeout(scope.runCounter, 100);
          } else {
            scope.searchEmployee(queryString);
            scope.stopCounter();
          }
        };
        scope.stopCounter = function () {
          startTimer = false;
          counter = 0;
          $timeout.cancel(timerObj);
        };
      });
    };
  }
]);
module.directive('searchToggle', [
  '$animate',
  'sharedFunctions',
  function ($animate, sharedFunctions) {
    return function (scope, ele, attr) {
      attr.$observe('searchToggle', function () {
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
    };
  }
]);
},{}],5:[function(require,module,exports){
'use strict';
var module = angular.module('orgchart.services', []);
var headers = function () {
  return {
    headers: {
      'Access-Token': canvasContext.client.oauthToken,
      'Instance-Url': canvasContext.client.instanceUrl
    }
  };
};
//local storage caching
module.service('orgChartCacheService', [
  '$http',
  '$angularCacheFactory',
  '$q',
  function ($http, $angularCacheFactory, $q) {
    //default cache definition
    var employeeCache = $angularCacheFactory('employeeCache', {
        maxAge: 43200000,
        deleteOnExpire: 'aggressive',
        storageMode: 'localStorage',
        recycleFreq: 1000,
        capacity: 20
      });
    this.getCacheValue = function (value) {
      return employeeCache.get(value);
    };
    this.callService = function (url) {
      var promise = $http.get(url, headers());
      promise.success(function (data, status, headers, config) {
        //set maxAge defined from node
        setCacheAge(headers('cache-control'));
      });
      function setCacheAge(value) {
        // Split the string by = and , | This returns value,1,value
        var splitStr = value.split(/\s*[=|,]\s*/);
        var valueIndex = splitStr.indexOf('max-age');
        // If the value is found, exists, is number
        if (valueIndex != -1 && splitStr.length > valueIndex + 1 && !isNaN(splitStr[valueIndex + 1])) {
          valueIndex = splitStr[valueIndex + 1];
          employeeCache.setOptions({ maxAge: parseInt(valueIndex) * 1000 });
        }
      }
      return promise;
    };
    this.me = function (email) {
      var deferred = $q.defer();
      var cacheValue = this.getCacheValue('me');
      if (angular.isDefined(cacheValue).email == email) {
        deferred.resolve(cacheValue);
      } else {
        this.callService('/services/orgchart/' + canvasContext.context.user.email).then(function (response) {
          employeeCache.put('me', response.data);
          employeeCache.put(response.data.email, response.data);
          deferred.resolve(response.data, status);
        }, function (response) {
          deferred.reject(response);
        });
      }
      return deferred.promise;
    };
    this.getEmployee = function (email) {
      var deferred = $q.defer();
      var cacheValue = this.getCacheValue(email);
      if (angular.isDefined(cacheValue)) {
        deferred.resolve(cacheValue);
      } else {
        this.callService('/services/orgchart/' + email).then(function (response) {
          employeeCache.put(response.data.email, response.data);
          deferred.resolve(response.data, status);
        }, function (response) {
          deferred.reject(response);
        });
      }
      return deferred.promise;
    };
  }
]);
module.factory('Search', [
  '$http',
  function ($http) {
    return {
      getSearch: function (searchQuery) {
        //default 'application/json' content type.
        return $http.post('/services/orgchart', searchQuery, headers());
      }
    };
  }
]);
module.service('sharedFunctions', function () {
  //hides search results element
  this.toggleSearchDisplay = function (value) {
    var wrapperEle = document.getElementById('searchResultWrapper');
    wrapperEle.className = value;
  };
});
},{}],6:[function(require,module,exports){
/**
 * @author Jason Dobry <jason.dobry@gmail.com>
 * @file angular-cache.min.js
 * @version 2.3.4 - Homepage <http://jmdobry.github.io/angular-cache/>
 * @copyright (c) 2013 -2014 Jason Dobry <http://jmdobry.github.io/angular-cache>
 * @license MIT <https://github.com/jmdobry/angular-cache/blob/master/LICENSE>
 *
 * @overview angular-cache is a very useful replacement for Angular's $cacheFactory.
 */
!function (a, b, c) {
  'use strict';
  function d() {
    this.$get = function () {
      function a(a, b, c) {
        for (var d = a[c], e = b(d); c > 0;) {
          var f = Math.floor((c + 1) / 2) - 1, g = a[f];
          if (e >= b(g))
            break;
          a[f] = d, a[c] = g, c = f;
        }
      }
      function c(a, b, c) {
        for (var d = a.length, e = a[c], f = b(e);;) {
          var g = 2 * (c + 1), h = g - 1, i = null;
          if (d > h) {
            var j = a[h], k = b(j);
            f > k && (i = h);
          }
          if (d > g) {
            var l = a[g], m = b(l);
            m < (null === i ? f : b(a[h])) && (i = g);
          }
          if (null === i)
            break;
          a[c] = a[i], a[i] = e, c = i;
        }
      }
      function d(a) {
        if (a && !b.isFunction(a))
          throw new Error('BinaryHeap(weightFunc): weightFunc: must be a function!');
        a = a || function (a) {
          return a;
        }, this.weightFunc = a, this.heap = [];
      }
      return d.prototype.push = function (b) {
        this.heap.push(b), a(this.heap, this.weightFunc, this.heap.length - 1);
      }, d.prototype.peek = function () {
        return this.heap[0];
      }, d.prototype.pop = function () {
        var a = this.heap[0], b = this.heap.pop();
        return this.heap.length > 0 && (this.heap[0] = b, c(this.heap, this.weightFunc, 0)), a;
      }, d.prototype.remove = function (d) {
        for (var e = this.heap.length, f = 0; e > f; f++)
          if (b.equals(this.heap[f], d)) {
            var g = this.heap[f], h = this.heap.pop();
            return f !== e - 1 && (this.heap[f] = h, a(this.heap, this.weightFunc, f), c(this.heap, this.weightFunc, f)), g;
          }
        return null;
      }, d.prototype.removeAll = function () {
        this.heap = [];
      }, d.prototype.size = function () {
        return this.heap.length;
      }, d;
    };
  }
  function e() {
    function a(a, c) {
      c(b.isNumber(a) ? 0 > a ? 'must be greater than zero!' : null : 'must be a number!');
    }
    var d, e = function () {
        return {
          capacity: Number.MAX_VALUE,
          maxAge: null,
          deleteOnExpire: 'none',
          onExpire: null,
          cacheFlushInterval: null,
          recycleFreq: 1000,
          storageMode: 'none',
          storageImpl: null,
          verifyIntegrity: !0,
          disabled: !1
        };
      };
    this.setCacheDefaults = function (c) {
      var f = '$angularCacheFactoryProvider.setCacheDefaults(options): ';
      if (c = c || {}, !b.isObject(c))
        throw new Error(f + 'options: must be an object!');
      if ('disabled' in c && (c.disabled = c.disabled === !0), 'capacity' in c && a(c.capacity, function (a) {
          if (a)
            throw new Error(f + 'capacity: ' + a);
        }), 'deleteOnExpire' in c) {
        if (!b.isString(c.deleteOnExpire))
          throw new Error(f + 'deleteOnExpire: must be a string!');
        if ('none' !== c.deleteOnExpire && 'passive' !== c.deleteOnExpire && 'aggressive' !== c.deleteOnExpire)
          throw new Error(f + 'deleteOnExpire: accepted values are "none", "passive" or "aggressive"!');
      }
      if ('maxAge' in c && a(c.maxAge, function (a) {
          if (a)
            throw new Error(f + 'maxAge: ' + a);
        }), 'recycleFreq' in c && a(c.recycleFreq, function (a) {
          if (a)
            throw new Error(f + 'recycleFreq: ' + a);
        }), 'cacheFlushInterval' in c && a(c.cacheFlushInterval, function (a) {
          if (a)
            throw new Error(f + 'cacheFlushInterval: ' + a);
        }), 'storageMode' in c) {
        if (!b.isString(c.storageMode))
          throw new Error(f + 'storageMode: must be a string!');
        if ('none' !== c.storageMode && 'localStorage' !== c.storageMode && 'sessionStorage' !== c.storageMode)
          throw new Error(f + 'storageMode: accepted values are "none", "localStorage" or "sessionStorage"!');
        if ('storageImpl' in c) {
          if (!b.isObject(c.storageImpl))
            throw new Error(f + 'storageImpl: must be an object!');
          if (!('setItem' in c.storageImpl && 'function' == typeof c.storageImpl.setItem))
            throw new Error(f + 'storageImpl: must implement "setItem(key, value)"!');
          if (!('getItem' in c.storageImpl && 'function' == typeof c.storageImpl.getItem))
            throw new Error(f + 'storageImpl: must implement "getItem(key)"!');
          if (!('removeItem' in c.storageImpl) || 'function' != typeof c.storageImpl.removeItem)
            throw new Error(f + 'storageImpl: must implement "removeItem(key)"!');
        }
      }
      if ('onExpire' in c && 'function' != typeof c.onExpire)
        throw new Error(f + 'onExpire: must be a function!');
      d = b.extend({}, e(), c);
    }, this.setCacheDefaults({}), this.$get = [
      '$window',
      'BinaryHeap',
      function (e, f) {
        function g(a) {
          return a && b.isNumber(a) ? a.toString() : a;
        }
        function h(a) {
          var b, c = {};
          for (b in a)
            a.hasOwnProperty(b) && (c[b] = b);
          return c;
        }
        function i(a) {
          var b, c = [];
          for (b in a)
            a.hasOwnProperty(b) && c.push(b);
          return c;
        }
        function j(j, k) {
          function m(b) {
            a(b, function (a) {
              if (a)
                throw new Error('capacity: ' + a);
              for (B.capacity = b; E.size() > B.capacity;)
                H.remove(E.peek().key, { verifyIntegrity: !1 });
            });
          }
          function n(a) {
            if (!b.isString(a))
              throw new Error('deleteOnExpire: must be a string!');
            if ('none' !== a && 'passive' !== a && 'aggressive' !== a)
              throw new Error('deleteOnExpire: accepted values are "none", "passive" or "aggressive"!');
            B.deleteOnExpire = a;
          }
          function o(b) {
            var c = i(C);
            if (null === b) {
              if (B.maxAge)
                for (var d = 0; d < c.length; d++) {
                  var e = c[d];
                  'maxAge' in C[e] || (delete C[e].expires, D.remove(C[e]));
                }
              B.maxAge = b;
            } else
              a(b, function (a) {
                if (a)
                  throw new Error('maxAge: ' + a);
                if (b !== B.maxAge) {
                  B.maxAge = b;
                  for (var d = new Date().getTime(), e = 0; e < c.length; e++) {
                    var f = c[e];
                    'maxAge' in C[f] || (D.remove(C[f]), C[f].expires = C[f].created + B.maxAge, D.push(C[f]), C[f].expires < d && H.remove(f, { verifyIntegrity: !1 }));
                  }
                }
              });
          }
          function p() {
            for (var a = new Date().getTime(), b = D.peek(); b && b.expires && b.expires < a;)
              H.remove(b.key, { verifyIntegrity: !1 }), B.onExpire && B.onExpire(b.key, b.value), b = D.peek();
          }
          function q(b) {
            null === b ? (B.recycleFreqId && (clearInterval(B.recycleFreqId), delete B.recycleFreqId), B.recycleFreq = d.recycleFreq, B.recycleFreqId = setInterval(p, B.recycleFreq)) : a(b, function (a) {
              if (a)
                throw new Error('recycleFreq: ' + a);
              B.recycleFreq = b, B.recycleFreqId && clearInterval(B.recycleFreqId), B.recycleFreqId = setInterval(p, B.recycleFreq);
            });
          }
          function r(b) {
            null === b ? (B.cacheFlushIntervalId && (clearInterval(B.cacheFlushIntervalId), delete B.cacheFlushIntervalId), B.cacheFlushInterval = b) : a(b, function (a) {
              if (a)
                throw new Error('cacheFlushInterval: ' + a);
              b !== B.cacheFlushInterval && (B.cacheFlushIntervalId && clearInterval(B.cacheFlushIntervalId), B.cacheFlushInterval = b, B.cacheFlushIntervalId = setInterval(H.removeAll, B.cacheFlushInterval));
            });
          }
          function s(a, c) {
            var d, f;
            if (!b.isString(a))
              throw new Error('storageMode: must be a string!');
            if ('none' !== a && 'localStorage' !== a && 'sessionStorage' !== a)
              throw new Error('storageMode: accepted values are "none", "localStorage" or "sessionStorage"!');
            if (('localStorage' === B.storageMode || 'sessionStorage' === B.storageMode) && a !== B.storageMode) {
              for (d = i(C), f = 0; f < d.length; f++)
                I.removeItem(F + '.data.' + d[f]);
              I.removeItem(F + '.keys');
            }
            if (B.storageMode = a, c) {
              if (!b.isObject(c))
                throw new Error('storageImpl: must be an object!');
              if (!('setItem' in c && 'function' == typeof c.setItem))
                throw new Error('storageImpl: must implement "setItem(key, value)"!');
              if (!('getItem' in c && 'function' == typeof c.getItem))
                throw new Error('storageImpl: must implement "getItem(key)"!');
              if (!('removeItem' in c) || 'function' != typeof c.removeItem)
                throw new Error('storageImpl: must implement "removeItem(key)"!');
              I = c;
            } else
              'localStorage' === B.storageMode ? I = e.localStorage : 'sessionStorage' === B.storageMode && (I = e.sessionStorage);
            if ('none' !== B.storageMode && I)
              if (G)
                for (d = i(C), f = 0; f < d.length; f++)
                  v(d[f]);
              else
                u();
          }
          function t(a, c, e) {
            if (a = a || {}, e = e || {}, c = !!c, !b.isObject(a))
              throw new Error('AngularCache.setOptions(cacheOptions, strict, options): cacheOptions: must be an object!');
            if (w(e.verifyIntegrity), c && (a = b.extend({}, d, a)), 'disabled' in a && (B.disabled = a.disabled === !0), 'verifyIntegrity' in a && (B.verifyIntegrity = a.verifyIntegrity === !0), 'capacity' in a && m(a.capacity), 'deleteOnExpire' in a && n(a.deleteOnExpire), 'maxAge' in a && o(a.maxAge), 'recycleFreq' in a && q(a.recycleFreq), 'cacheFlushInterval' in a && r(a.cacheFlushInterval), 'storageMode' in a && s(a.storageMode, a.storageImpl), 'onExpire' in a) {
              if (null !== a.onExpire && 'function' != typeof a.onExpire)
                throw new Error('onExpire: must be a function!');
              B.onExpire = a.onExpire;
            }
            G = !0;
          }
          function u() {
            var a = b.fromJson(I.getItem(F + '.keys'));
            if (I.removeItem(F + '.keys'), a && a.length) {
              for (var c = 0; c < a.length; c++) {
                var d = b.fromJson(I.getItem(F + '.data.' + a[c])) || {}, e = d.maxAge || B.maxAge, f = d.deleteOnExpire || B.deleteOnExpire;
                if (e && new Date().getTime() - d.created > e && 'aggressive' === f)
                  I.removeItem(F + '.data.' + a[c]);
                else {
                  var g = { created: d.created };
                  d.expires && (g.expires = d.expires), d.accessed && (g.accessed = d.accessed), d.maxAge && (g.maxAge = d.maxAge), d.deleteOnExpire && (g.deleteOnExpire = d.deleteOnExpire), H.put(a[c], d.value, g);
                }
              }
              v(null);
            }
          }
          function v(a) {
            'none' !== B.storageMode && I && (I.setItem(F + '.keys', b.toJson(i(C))), a && I.setItem(F + '.data.' + a, b.toJson(C[a])));
          }
          function w(a) {
            if ((a || a !== !1 && B.verifyIntegrity) && 'none' !== B.storageMode && I) {
              var c = i(C);
              I.setItem(F + '.keys', b.toJson(c));
              for (var d = 0; d < c.length; d++)
                I.setItem(F + '.data.' + c[d], b.toJson(C[c[d]]));
            }
          }
          function x(a, c) {
            if ((c || c !== !1 && B.verifyIntegrity) && 'none' !== B.storageMode && I) {
              var d = I.getItem(F + '.data.' + a);
              if (!d && a in C)
                H.remove(a);
              else if (d) {
                var e = b.fromJson(d), f = e ? e.value : null;
                f && H.put(a, f);
              }
            }
          }
          function y(a) {
            if ('none' !== B.storageMode && I) {
              var c = a || i(C);
              I.setItem(F + '.keys', b.toJson(c));
            }
          }
          function z(a) {
            'none' !== B.storageMode && I && a in C && I.setItem(F + '.data.' + a, b.toJson(C[a]));
          }
          function A() {
            if ('none' !== B.storageMode && I) {
              for (var a = i(C), c = 0; c < a.length; c++)
                I.removeItem(F + '.data.' + a[c]);
              I.setItem(F + '.keys', b.toJson([]));
            }
          }
          var B = b.extend({}, { id: j }), C = {}, D = new f(function (a) {
              return a.expires;
            }), E = new f(function (a) {
              return a.accessed;
            }), F = 'angular-cache.caches.' + j, G = !1, H = this, I = null;
          k = k || {}, this.put = function (c, d, e) {
            if (!B.disabled) {
              if (e = e || {}, c = g(c), !b.isString(c))
                throw new Error('AngularCache.put(key, value, options): key: must be a string!');
              if (e && !b.isObject(e))
                throw new Error('AngularCache.put(key, value, options): options: must be an object!');
              if (e.maxAge && null !== e.maxAge)
                a(e.maxAge, function (a) {
                  if (a)
                    throw new Error('AngularCache.put(key, value, options): maxAge: ' + a);
                });
              else {
                if (e.deleteOnExpire && !b.isString(e.deleteOnExpire))
                  throw new Error('AngularCache.put(key, value, options): deleteOnExpire: must be a string!');
                if (e.deleteOnExpire && 'none' !== e.deleteOnExpire && 'passive' !== e.deleteOnExpire && 'aggressive' !== e.deleteOnExpire)
                  throw new Error('AngularCache.put(key, value, options): deleteOnExpire: accepted values are "none", "passive" or "aggressive"!');
                if (b.isUndefined(d))
                  return;
              }
              var f, h, i = new Date().getTime();
              return w(e.verifyIntegrity), C[c] ? (D.remove(C[c]), E.remove(C[c])) : C[c] = { key: c }, h = C[c], h.value = d, h.created = parseInt(e.created, 10) || h.created || i, h.accessed = parseInt(e.accessed, 10) || i, e.deleteOnExpire && (h.deleteOnExpire = e.deleteOnExpire), e.maxAge && (h.maxAge = e.maxAge), (h.maxAge || B.maxAge) && (h.expires = h.created + (h.maxAge || B.maxAge)), f = h.deleteOnExpire || B.deleteOnExpire, h.expires && 'aggressive' === f && D.push(h), y(), z(c), E.push(h), E.size() > B.capacity && this.remove(E.peek().key, { verifyIntegrity: !1 }), d;
            }
          }, this.get = function (a, d) {
            if (!B.disabled) {
              if (b.isArray(a)) {
                var e = a, f = [];
                return b.forEach(e, function (a) {
                  var c = H.get(a, d);
                  b.isDefined(c) && f.push(c);
                }), f;
              }
              if (a = g(a), d = d || {}, !b.isString(a))
                throw new Error('AngularCache.get(key, options): key: must be a string!');
              if (d && !b.isObject(d))
                throw new Error('AngularCache.get(key, options): options: must be an object!');
              if (d.onExpire && !b.isFunction(d.onExpire))
                throw new Error('AngularCache.get(key, options): onExpire: must be a function!');
              if (x(a, d.verifyIntegrity), a in C) {
                var h = C[a], i = h.value, j = new Date().getTime(), k = h.deleteOnExpire || B.deleteOnExpire;
                return E.remove(h), h.accessed = j, E.push(h), 'passive' === k && 'expires' in h && h.expires < j && (this.remove(a, { verifyIntegrity: !1 }), B.onExpire ? B.onExpire(a, h.value, d.onExpire) : d.onExpire && d.onExpire(a, h.value), i = c), z(a), i;
              }
            }
          }, this.remove = function (a, b) {
            b = b || {}, w(b.verifyIntegrity), E.remove(C[a]), D.remove(C[a]), 'none' !== B.storageMode && I && I.removeItem(F + '.data.' + a), delete C[a], y();
          }, this.removeAll = function () {
            A(), E.removeAll(), D.removeAll(), C = {};
          }, this.removeExpired = function (a) {
            a = a || {};
            for (var b = new Date().getTime(), c = i(C), d = {}, e = 0; e < c.length; e++)
              C[c[e]] && C[c[e]].expires && C[c[e]].expires < b && (d[c[e]] = C[c[e]].value);
            for (var f in d)
              H.remove(f);
            if (w(a.verifyIntegrity), a.asArray) {
              var g = [];
              for (f in d)
                g.push(d[f]);
              return g;
            }
            return d;
          }, this.destroy = function () {
            B.cacheFlushIntervalId && clearInterval(B.cacheFlushIntervalId), B.recycleFreqId && clearInterval(B.recycleFreqId), this.removeAll(), 'none' !== B.storageMode && I && (I.removeItem(F + '.keys'), I.removeItem(F)), I = null, C = null, E = null, D = null, B = null, F = null, H = null;
            for (var a = i(this), b = 0; b < a.length; b++)
              this.hasOwnProperty(a[b]) && delete this[a[b]];
            l[j] = null, delete l[j];
          }, this.info = function (a) {
            if (a) {
              if (C[a]) {
                var c = {
                    created: C[a].created,
                    accessed: C[a].accessed,
                    expires: C[a].expires,
                    maxAge: C[a].maxAge || B.maxAge,
                    deleteOnExpire: C[a].deleteOnExpire || B.deleteOnExpire,
                    isExpired: !1
                  };
                return c.maxAge && (c.isExpired = new Date().getTime() - c.created > c.maxAge), c;
              }
              return C[a];
            }
            return b.extend({}, B, { size: E && E.size() || 0 });
          }, this.keySet = function () {
            return h(C);
          }, this.keys = function () {
            return i(C);
          }, this.setOptions = t, t(k, !0, { verifyIntegrity: !1 });
        }
        function k(a, c) {
          if (a in l)
            throw new Error('cacheId ' + a + ' taken!');
          if (!b.isString(a))
            throw new Error('cacheId must be a string!');
          return l[a] = new j(a, c), l[a];
        }
        var l = {};
        return k.info = function () {
          for (var a = i(l), c = {
                size: a.length,
                caches: {}
              }, e = 0; e < a.length; e++) {
            var f = a[e];
            c.caches[f] = l[f].info();
          }
          return c.cacheDefaults = b.extend({}, d), c;
        }, k.get = function (a) {
          if (!b.isString(a))
            throw new Error('$angularCacheFactory.get(cacheId): cacheId: must be a string!');
          return l[a];
        }, k.keySet = function () {
          return h(l);
        }, k.keys = function () {
          return i(l);
        }, k.removeAll = function () {
          for (var a = i(l), b = 0; b < a.length; b++)
            l[a[b]].destroy();
        }, k.clearAll = function () {
          for (var a = i(l), b = 0; b < a.length; b++)
            l[a[b]].removeAll();
        }, k.enableAll = function () {
          for (var a = i(l), b = 0; b < a.length; b++)
            l[a[b]].setOptions({ disabled: !1 });
        }, k.disableAll = function () {
          for (var a = i(l), b = 0; b < a.length; b++)
            l[a[b]].setOptions({ disabled: !0 });
        }, k;
      }
    ];
  }
  b.module('jmdobry.binary-heap', []).provider('BinaryHeap', d), b.module('jmdobry.angular-cache', [
    'ng',
    'jmdobry.binary-heap'
  ]).provider('$angularCacheFactory', e);
}(window, window.angular);
},{}],7:[function(require,module,exports){
/**
 *    Angular directive to truncate multi-line text to visible height
 *
 *    @param bind (angular bound value to append) REQUIRED
 *    @param ellipsisAppend (string) string to append at end of truncated text after ellipsis, can be HTML OPTIONAL
 *    @param ellipsisSymbol (string) string to use as ellipsis, replaces default '...' OPTIONAL
 *    @param ellipsisAppendClick (function) function to call if ellipsisAppend is clicked (ellipsisAppend must be clicked) OPTIONAL
 *
 *    @example <p data-ellipsis data-ng-bind="boundData"></p>
 *    @example <p data-ellipsis data-ng-bind="boundData" data-ellipsis-symbol="---"></p>
 *    @example <p data-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more"></p>
 *    @example <p data-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more" data-ellipsis-append-click="displayFull()"></p>
 *
 */
'use strict';
var app = angular.module('orgchart.directives');
app.directive('ellipsis', [
  '$timeout',
  '$window',
  function ($timeout, $window) {
    return {
      restrict: 'A',
      scope: {
        ngBind: '=',
        ellipsisAppend: '@',
        ellipsisAppendClick: '&',
        ellipsisSymbol: '@'
      },
      compile: function (elem, attr, linker) {
        return function (scope, element, attributes) {
          /* Window Resize Variables */
          attributes.lastWindowResizeTime = 0;
          attributes.lastWindowResizeWidth = 0;
          attributes.lastWindowResizeHeight = 0;
          attributes.lastWindowTimeoutEvent = null;
          /* State Variables */
          attributes.isTruncated = false;
          function buildEllipsis() {
            if (typeof scope.ngBind !== 'undefined') {
              var bindArray = scope.ngBind.split(' '), i = 0, ellipsisSymbol = typeof attributes.ellipsisSymbol !== 'undefined' ? attributes.ellipsisSymbol : '&hellip;', appendString = typeof scope.ellipsisAppend !== 'undefined' && scope.ellipsisAppend !== '' ? ellipsisSymbol + '<span>' + scope.ellipsisAppend + '</span>' : ellipsisSymbol;
              attributes.isTruncated = false;
              element.html(scope.ngBind);
              // If text has overflow
              if (isOverflowed(element)) {
                var bindArrayStartingLength = bindArray.length, initialMaxHeight = element[0].clientHeight;
                element.html(scope.ngBind + appendString);
                // Set complete text and remove one word at a time, until there is no overflow
                for (; i < bindArrayStartingLength; i++) {
                  bindArray.pop();
                  element.html(bindArray.join(' ') + appendString);
                  if (element[0].scrollHeight < initialMaxHeight || isOverflowed(element) === false) {
                    attributes.isTruncated = true;
                    break;
                  }
                }
                // If append string was passed and append click function included
                if (ellipsisSymbol != appendString && typeof scope.ellipsisAppendClick !== 'undefined' && scope.ellipsisAppendClick !== '') {
                  element.find('span').bind('click', function (e) {
                    scope.$apply(scope.ellipsisAppendClick);
                  });
                }
              }
            }
          }
          /**
                 *    Test if element has overflow of text beyond height or max-height
                 *
                 *    @param element (DOM object)
                 *
                 *    @return bool
                 *
                 */
          function isOverflowed(thisElement) {
            return thisElement[0].scrollHeight > thisElement[0].clientHeight;
          }
          /**
                 *    Watchers
                 */
          /**
                 *    Execute ellipsis truncate on ngBind update
                 */
          scope.$watch('ngBind', function () {
            buildEllipsis();
          });
          /**
                 *    Execute ellipsis truncate on ngBind update
                 */
          scope.$watch('ellipsisAppend', function () {
            buildEllipsis();
          });
          /**
                 *    When window width or height changes - re-init truncation
                 */
          angular.element($window).bind('resize', function () {
            $timeout.cancel(attributes.lastWindowTimeoutEvent);
            attributes.lastWindowTimeoutEvent = $timeout(function () {
              if (attributes.lastWindowResizeWidth != window.innerWidth || attributes.lastWindowResizeHeight != window.innerHeight) {
                buildEllipsis();
              }
              attributes.lastWindowResizeWidth = window.innerWidth;
              attributes.lastWindowResizeHeight = window.innerHeight;
            }, 75);
          });
        };
      }
    };
  }
]);
},{}],8:[function(require,module,exports){
(function (global){
;
var __browserify_shim_require__ = require;
(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
  (function (global) {
    if (global.Sfdc && global.Sfdc.canvas && global.Sfdc.canvas.module) {
      return;
    }
    var extmodules = {};
    if (global.Sfdc && global.Sfdc.canvas) {
      for (var key in global.Sfdc.canvas) {
        if (global.Sfdc.canvas.hasOwnProperty(key)) {
          extmodules[key] = global.Sfdc.canvas[key];
        }
      }
    }
    var oproto = Object.prototype, aproto = Array.prototype, doc = global.document, keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', $ = {
        hasOwn: function (obj, prop) {
          return oproto.hasOwnProperty.call(obj, prop);
        },
        isUndefined: function (value) {
          var undef;
          return value === undef;
        },
        isNil: function (value) {
          return $.isUndefined(value) || value === null || value === '';
        },
        isNumber: function (value) {
          return !!(value === 0 || value && value.toExponential && value.toFixed);
        },
        isFunction: function (value) {
          return !!(value && value.constructor && value.call && value.apply);
        },
        isArray: Array.isArray || function (value) {
          return oproto.toString.call(value) === '[object Array]';
        },
        isArguments: function (value) {
          return !!(value && $.hasOwn(value, 'callee'));
        },
        isObject: function (value) {
          return value !== null && typeof value === 'object';
        },
        isString: function (value) {
          return value !== null && typeof value == 'string';
        },
        appearsJson: function (value) {
          return /^\{.*\}$/.test(value);
        },
        nop: function () {
        },
        invoker: function (fn) {
          if ($.isFunction(fn)) {
            fn();
          }
        },
        identity: function (obj) {
          return obj;
        },
        each: function (obj, it, ctx) {
          if ($.isNil(obj)) {
            return;
          }
          var nativ = aproto.forEach, i = 0, l, key;
          l = obj.length;
          ctx = ctx || obj;
          if (nativ && nativ === obj.forEach) {
            obj.forEach(it, ctx);
          } else {
            if ($.isNumber(l)) {
              while (i < l) {
                if (it.call(ctx, obj[i], i, obj) === false) {
                  return;
                }
                i += 1;
              }
            } else {
              for (key in obj) {
                if ($.hasOwn(obj, key) && it.call(ctx, obj[key], key, obj) === false) {
                  return;
                }
              }
            }
          }
        },
        startsWithHttp: function (orig, newUrl) {
          return !$.isString(orig) ? orig : orig.substring(0, 4) === 'http' ? orig : newUrl;
        },
        map: function (obj, it, ctx) {
          var results = [], nativ = aproto.map;
          if ($.isNil(obj)) {
            return results;
          }
          if (nativ && obj.map === nativ) {
            return obj.map(it, ctx);
          }
          ctx = ctx || obj;
          $.each(obj, function (value, i, list) {
            results.push(it.call(ctx, value, i, list));
          });
          return results;
        },
        values: function (obj) {
          return $.map(obj, $.identity);
        },
        slice: function (array, begin, end) {
          return aproto.slice.call(array, $.isUndefined(begin) ? 0 : begin, $.isUndefined(end) ? array.length : end);
        },
        toArray: function (iterable) {
          if (!iterable) {
            return [];
          }
          if (iterable.toArray) {
            return iterable.toArray;
          }
          if ($.isArray(iterable)) {
            return iterable;
          }
          if ($.isArguments(iterable)) {
            return $.slice(iterable);
          }
          return $.values(iterable);
        },
        size: function (obj) {
          return $.toArray(obj).length;
        },
        indexOf: function (array, item) {
          var nativ = aproto.indexOf, i, l;
          if (!array) {
            return -1;
          }
          if (nativ && array.indexOf === nativ) {
            return array.indexOf(item);
          }
          for (i = 0, l = array.length; i < l; i += 1) {
            if (array[i] === item) {
              return i;
            }
          }
          return -1;
        },
        isEmpty: function (obj) {
          if (obj === null) {
            return true;
          }
          if ($.isArray(obj) || $.isString(obj)) {
            return obj.length === 0;
          }
          for (var key in obj) {
            if ($.hasOwn(obj, key)) {
              return false;
            }
          }
          return true;
        },
        remove: function (array, item) {
          var i = $.indexOf(array, item);
          if (i >= 0) {
            array.splice(i, 1);
          }
        },
        param: function (a, encode) {
          var s = [];
          encode = encode || false;
          function add(key, value) {
            if ($.isNil(value)) {
              return;
            }
            value = $.isFunction(value) ? value() : value;
            if ($.isArray(value)) {
              $.each(value, function (v, n) {
                add(key, v);
              });
            } else {
              if (encode) {
                s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
              } else {
                s[s.length] = key + '=' + value;
              }
            }
          }
          if ($.isArray(a)) {
            $.each(a, function (v, n) {
              add(n, v);
            });
          } else {
            for (var p in a) {
              if ($.hasOwn(a, p)) {
                add(p, a[p]);
              }
            }
          }
          return s.join('&').replace(/%20/g, '+');
        },
        objectify: function (q) {
          var arr, obj = {}, i, p, n, v, e;
          if ($.isNil(q)) {
            return obj;
          }
          if (q.substring(0, 1) == '?') {
            q = q.substring(1);
          }
          arr = q.split('&');
          for (i = 0; i < arr.length; i += 1) {
            p = arr[i].split('=');
            n = p[0];
            v = p[1];
            e = obj[n];
            if (!$.isNil(e)) {
              if ($.isArray(e)) {
                e[e.length] = v;
              } else {
                obj[n] = [];
                obj[n][0] = e;
                obj[n][1] = v;
              }
            } else {
              obj[n] = v;
            }
          }
          return obj;
        },
        stripUrl: function (url) {
          return $.isNil(url) ? null : url.replace(/([^:]+:\/\/[^\/\?#]+).*/, '$1');
        },
        query: function (url, q) {
          if ($.isNil(q)) {
            return url;
          }
          url = url.replace(/#.*$/, '');
          url += /^\#/.test(q) ? q : (/\?/.test(url) ? '&' : '?') + q;
          return url;
        },
        extend: function (dest) {
          $.each($.slice(arguments, 1), function (mixin, i) {
            $.each(mixin, function (value, key) {
              dest[key] = value;
            });
          });
          return dest;
        },
        endsWith: function (str, suffix) {
          return str.indexOf(suffix, str.length - suffix.length) !== -1;
        },
        capitalize: function (str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        },
        uncapitalize: function (str) {
          return str.charAt(0).toLowerCase() + str.slice(1);
        },
        decode: function (str) {
          var output = [], chr1, chr2, chr3 = '', enc1, enc2, enc3, enc4 = '', i = 0;
          str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
          do {
            enc1 = keyStr.indexOf(str.charAt(i++));
            enc2 = keyStr.indexOf(str.charAt(i++));
            enc3 = keyStr.indexOf(str.charAt(i++));
            enc4 = keyStr.indexOf(str.charAt(i++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output.push(String.fromCharCode(chr1));
            if (enc3 !== 64) {
              output.push(String.fromCharCode(chr2));
            }
            if (enc4 !== 64) {
              output.push(String.fromCharCode(chr3));
            }
            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
          } while (i < str.length);
          return $.escapeToUTF8(output.join(''));
        },
        escapeToUTF8: function (str) {
          var outStr = '';
          var i = 0;
          while (i < str.length) {
            var c = str.charCodeAt(i++);
            var c1;
            if (c < 128) {
              outStr += String.fromCharCode(c);
            } else {
              if (c > 191 && c < 224) {
                c1 = str.charCodeAt(i++);
                outStr += String.fromCharCode((c & 31) << 6 | c1 & 63);
              } else {
                c1 = str.charCodeAt(i++);
                var c2 = str.charCodeAt(i++);
                outStr += String.fromCharCode((c & 15) << 12 | (c1 & 63) << 6 | c2 & 63);
              }
            }
          }
          return outStr;
        },
        validEventName: function (name, res) {
          var ns, parts = name.split(/\./), regex = /^[$A-Z_][0-9A-Z_$]*$/i, reserved = {
              'sfdc': true,
              'canvas': true,
              'force': true,
              'salesforce': true,
              'chatter': true,
              's1': true
            };
          $.each($.isArray(res) ? res : [res], function (v) {
            reserved[v] = false;
          });
          if (parts.length > 2) {
            return 1;
          }
          if (parts.length === 2) {
            ns = parts[0].toLowerCase();
            if (reserved[ns]) {
              return 2;
            }
          }
          if (!regex.test(parts[0]) || !regex.test(parts[1])) {
            return 3;
          }
          return 0;
        },
        prototypeOf: function (obj) {
          var nativ = Object.getPrototypeOf, proto = '__proto__';
          if ($.isFunction(nativ)) {
            return nativ.call(Object, obj);
          } else {
            if (typeof {}[proto] === 'object') {
              return obj[proto];
            } else {
              return obj.constructor.prototype;
            }
          }
        },
        module: function (ns, decl) {
          var parts = ns.split('.'), parent = global.Sfdc.canvas, i, length;
          if (parts[1] === 'canvas') {
            parts = parts.slice(2);
          }
          length = parts.length;
          for (i = 0; i < length; i += 1) {
            if ($.isUndefined(parent[parts[i]])) {
              parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
          }
          if ($.isFunction(decl)) {
            decl = decl();
          }
          return $.extend(parent, decl);
        },
        document: function () {
          return doc;
        },
        byId: function (id) {
          return doc.getElementById(id);
        },
        byClass: function (clazz) {
          return doc.getElementsByClassName(clazz);
        },
        attr: function (el, name) {
          var a = el.attributes, i;
          for (i = 0; i < a.length; i += 1) {
            if (name === a[i].name) {
              return a[i].value;
            }
          }
        },
        onReady: function (cb) {
          if ($.isFunction(cb)) {
            readyHandlers.push(cb);
          }
        },
        console: function () {
          var enabled = false;
          if (window && !window.console) {
            window.console = {};
          }
          if (window && !window.console.log) {
            window.console.log = function () {
            };
          }
          if (window && !window.console.error) {
            window.console.error = function () {
            };
          }
          function isSessionStorage() {
            try {
              return 'sessionStorage' in window && window.sessionStorage !== null;
            } catch (e) {
              return false;
            }
          }
          function log() {
          }
          function error() {
          }
          function activate() {
            if (Function.prototype.bind) {
              log = Function.prototype.bind.call(console.log, console);
            } else {
              log = function () {
                Function.prototype.apply.call(console.log, console, arguments);
              };
            }
          }
          function deactivate() {
            log = function () {
            };
          }
          function enable() {
            enabled = true;
            if (isSessionStorage()) {
              sessionStorage.setItem('canvas_console', 'true');
            }
            activate();
          }
          function disable() {
            enabled = false;
            if (isSessionStorage()) {
              sessionStorage.setItem('canvas_console', 'false');
            }
            deactivate();
          }
          enabled = isSessionStorage() && sessionStorage.getItem('canvas_console') === 'true';
          if (enabled) {
            activate();
          } else {
            deactivate();
          }
          if (Function.prototype.bind) {
            error = Function.prototype.bind.call(console.error, console);
          } else {
            error = function () {
              Function.prototype.apply.call(console.error, console, arguments);
            };
          }
          return {
            enable: enable,
            disable: disable,
            log: log,
            error: error
          };
        }()
      }, readyHandlers = [], canvas = function (cb) {
        if ($.isFunction(cb)) {
          readyHandlers.push(cb);
        }
      };
    (function () {
      var called = false, isFrame, fn;
      function ready() {
        if (called) {
          return;
        }
        called = true;
        ready = $.nop;
        $.each(readyHandlers, $.invoker);
        readyHandlers = [];
      }
      function tryScroll() {
        if (called) {
          return;
        }
        try {
          document.documentElement.doScroll('left');
          ready();
        } catch (e) {
          setTimeout(tryScroll, 30);
        }
      }
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', ready, false);
      } else {
        if (document.attachEvent) {
          try {
            isFrame = self !== top;
          } catch (e) {
          }
          if (document.documentElement.doScroll && !isFrame) {
            tryScroll();
          }
          document.attachEvent('onreadystatechange', function () {
            if (document.readyState === 'complete') {
              ready();
            }
          });
        }
      }
      if (window.addEventListener) {
        window.addEventListener('load', ready, false);
      } else {
        if (window.attachEvent) {
          window.attachEvent('onload', ready);
        } else {
          fn = window.onload;
          window.onload = function () {
            if (fn) {
              fn();
            }
            ready();
          };
        }
      }
    }());
    $.each($, function (fn, name) {
      canvas[name] = fn;
    });
    $.each(extmodules, function (fn, name) {
      canvas[name] = fn;
    });
    (function () {
      var method;
      var noop = function () {
      };
      var methods = [
          'assert',
          'clear',
          'count',
          'debug',
          'dir',
          'dirxml',
          'error',
          'exception',
          'group',
          'groupCollapsed',
          'groupEnd',
          'info',
          'log',
          'markTimeline',
          'profile',
          'profileEnd',
          'table',
          'time',
          'timeEnd',
          'timeStamp',
          'trace',
          'warn'
        ];
      var length = methods.length;
      var console = typeof window !== 'undefined' && window.console ? window.console : {};
      while (length--) {
        method = methods[length];
        if (!console[method]) {
          console[method] = noop;
        }
      }
    }());
    if (!global.Sfdc) {
      global.Sfdc = {};
    }
    global.Sfdc.canvas = canvas;
  }(this));
  (function ($$) {
    var module = function () {
        function isSecure() {
          return window.location.protocol === 'https:';
        }
        function set(name, value, days) {
          var expires = '', date;
          if (days) {
            date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toGMTString();
          } else {
            expires = '';
          }
          document.cookie = name + '=' + value + expires + '; path=/' + (isSecure() === true ? '; secure' : '');
        }
        function get(name) {
          var nameEQ, ca, c, i;
          if ($$.isUndefined(name)) {
            return document.cookie.split(';');
          }
          nameEQ = name + '=';
          ca = document.cookie.split(';');
          for (i = 0; i < ca.length; i += 1) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
              c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length, c.length);
            }
          }
          return null;
        }
        function remove(name) {
          set(name, '', -1);
        }
        return {
          set: set,
          get: get,
          remove: remove
        };
      }();
    $$.module('Sfdc.canvas.cookies', module);
  }(Sfdc.canvas));
  (function ($$) {
    var storage = function () {
        function isLocalStorage() {
          try {
            return 'sessionStorage' in window && window.sessionStorage !== null;
          } catch (e) {
            return false;
          }
        }
        return {
          get: function get(key) {
            if (isLocalStorage()) {
              return sessionStorage.getItem(key);
            }
            return $$.cookies.get(key);
          },
          set: function set(key, value) {
            if (isLocalStorage()) {
              return sessionStorage.setItem(key, value);
            }
            return $$.cookies.set(key, value);
          },
          remove: function remove(key) {
            if (isLocalStorage()) {
              return sessionStorage.removeItem(key);
            }
            return $$.cookies.remove(key);
          }
        };
      }();
    var module = function () {
        var accessToken, instUrl, instId, tOrigin, childWindow;
        function init() {
          accessToken = storage.get('access_token');
          storage.remove('access_token');
        }
        function query(params) {
          var r = [], n;
          if (!$$.isUndefined(params)) {
            for (n in params) {
              if (params.hasOwnProperty(n)) {
                r.push(n + '=' + params[n]);
              }
            }
            return '?' + r.join('&');
          }
          return '';
        }
        function refresh() {
          storage.set('access_token', accessToken);
          self.location.reload();
        }
        function login(ctx) {
          var uri;
          ctx = ctx || {};
          uri = ctx.uri || '/rest/oauth2';
          ctx.params = ctx.params || { state: '' };
          ctx.params.state = ctx.params.state || ctx.callback || window.location.pathname;
          ctx.params.display = ctx.params.display || 'popup';
          ctx.params.redirect_uri = $$.startsWithHttp(ctx.params.redirect_uri, encodeURIComponent(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port) + ctx.params.redirect_uri);
          uri = uri + query(ctx.params);
          childWindow = window.open(uri, 'OAuth', 'status=0,toolbar=0,menubar=0,resizable=0,scrollbars=1,top=50,left=50,height=500,width=680');
        }
        function token(t) {
          if (arguments.length === 0) {
            if (!$$.isNil(accessToken)) {
              return accessToken;
            }
          } else {
            accessToken = t;
          }
          return accessToken;
        }
        function instanceUrl(i) {
          if (arguments.length === 0) {
            if (!$$.isNil(instUrl)) {
              return instUrl;
            }
            instUrl = storage.get('instance_url');
          } else {
            if (i === null) {
              storage.remove('instance_url');
              instUrl = null;
            } else {
              storage.set('instance_url', i);
              instUrl = i;
            }
          }
          return instUrl;
        }
        function parseHash(hash) {
          var i, nv, nvp, n, v;
          if (!$$.isNil(hash)) {
            if (hash.indexOf('#') === 0) {
              hash = hash.substr(1);
            }
            nvp = hash.split('&');
            for (i = 0; i < nvp.length; i += 1) {
              nv = nvp[i].split('=');
              n = nv[0];
              v = decodeURIComponent(nv[1]);
              if ('access_token' === n) {
                token(v);
              } else {
                if ('instance_url' === n) {
                  instanceUrl(v);
                } else {
                  if ('target_origin' === n) {
                    tOrigin = decodeURIComponent(v);
                  } else {
                    if ('instance_id' === n) {
                      instId = v;
                    }
                  }
                }
              }
            }
          }
        }
        function checkChildWindowStatus() {
          if (!childWindow || childWindow.closed) {
            refresh();
          }
        }
        function childWindowUnloadNotification(hash) {
          var retry = 0, maxretries = 10;
          function cws() {
            retry++;
            if (!childWindow || childWindow.closed) {
              refresh();
            } else {
              if (retry < maxretries) {
                setTimeout(cws, 50);
              }
            }
          }
          parseHash(hash);
          setTimeout(cws, 50);
        }
        function logout() {
          token(null);
        }
        function loggedin() {
          return !$$.isNil(token());
        }
        function loginUrl() {
          var i, nvs, nv, q = self.location.search;
          if (q) {
            q = q.substring(1);
            nvs = q.split('&');
            for (i = 0; i < nvs.length; i += 1) {
              nv = nvs[i].split('=');
              if ('loginUrl' === nv[0]) {
                return decodeURIComponent(nv[1]) + '/services/oauth2/authorize';
              }
            }
          }
          return 'https://login.salesforce.com/services/oauth2/authorize';
        }
        function targetOrigin(to) {
          if (!$$.isNil(to)) {
            tOrigin = to;
            return to;
          }
          if (!$$.isNil(tOrigin)) {
            return tOrigin;
          }
          parseHash(document.location.hash);
          return tOrigin;
        }
        function instanceId(id) {
          if (!$$.isNil(id)) {
            instId = id;
            return id;
          }
          if (!$$.isNil(instId)) {
            return instId;
          }
          parseHash(document.location.hash);
          return instId;
        }
        function client() {
          return {
            oauthToken: token(),
            instanceId: instanceId(),
            targetOrigin: targetOrigin()
          };
        }
        return {
          init: init,
          login: login,
          logout: logout,
          loggedin: loggedin,
          loginUrl: loginUrl,
          token: token,
          instance: instanceUrl,
          client: client,
          checkChildWindowStatus: checkChildWindowStatus,
          childWindowUnloadNotification: childWindowUnloadNotification
        };
      }();
    $$.module('Sfdc.canvas.oauth', module);
    $$.oauth.init();
  }(Sfdc.canvas));
  (function ($$, window) {
    var module = function () {
        var internalCallback;
        function postMessage(message, target_url, target) {
          var sfdcJson = Sfdc.JSON || JSON;
          if ($$.isNil(target_url)) {
            throw 'ERROR: target_url was not supplied on postMessage';
          }
          var otherWindow = $$.stripUrl(target_url);
          target = target || parent;
          if (window.postMessage) {
            if ($$.isObject(message)) {
              message.targetModule = 'Canvas';
            }
            message = sfdcJson.stringify(message);
            $$.console.log('Sending Post Message ', message);
            target.postMessage(message, otherWindow);
          }
        }
        function receiveMessage(callback, source_origin) {
          if (window.postMessage) {
            if (callback) {
              internalCallback = function (e) {
                var data, r;
                var sfdcJson = Sfdc.JSON || JSON;
                $$.console.log('Post Message Got callback', e);
                if (!$$.isNil(e)) {
                  if (typeof source_origin === 'string' && e.origin !== source_origin) {
                    $$.console.log('source origin\'s don\'t match', e.origin, source_origin);
                    return false;
                  }
                  if ($$.isFunction(source_origin)) {
                    r = source_origin(e.origin, e.data);
                    if (r === false) {
                      $$.console.log('source origin\'s function returning false', e.origin, e.data);
                      return false;
                    }
                  }
                  if ($$.appearsJson(e.data)) {
                    try {
                      data = sfdcJson.parse(e.data);
                    } catch (ignore) {
                    }
                    if (!$$.isNil(data) && ($$.isNil(data.targetModule) || data.targetModule === 'Canvas')) {
                      $$.console.log('Invoking callback');
                      callback(data, r);
                    }
                  }
                }
              };
            }
            if (window.addEventListener) {
              window.addEventListener('message', internalCallback, false);
            } else {
              window.attachEvent('onmessage', internalCallback);
            }
          }
        }
        function removeListener() {
          if (window.postMessage) {
            if (window.removeEventListener) {
              window.removeEventListener('message', internalCallback, false);
            } else {
              window.detachEvent('onmessage', internalCallback);
            }
          }
        }
        return {
          post: postMessage,
          receive: receiveMessage,
          remove: removeListener
        };
      }();
    $$.module('Sfdc.canvas.xd', module);
  }(Sfdc.canvas, this));
  (function ($$) {
    var pversion, cversion = '33.0';
    var module = function () {
        var purl;
        function getTargetOrigin(to) {
          var h;
          if (to === '*') {
            return to;
          }
          if (!$$.isNil(to)) {
            h = $$.stripUrl(to);
            purl = $$.startsWithHttp(h, purl);
            if (purl) {
              return purl;
            }
          }
          h = $$.document().location.hash;
          if (h) {
            h = decodeURIComponent(h.replace(/^#/, ''));
            purl = $$.startsWithHttp(h, purl);
          }
          return purl;
        }
        function xdCallback(data) {
          if (data) {
            if (submodules[data.type]) {
              submodules[data.type].callback(data);
            }
          }
        }
        var submodules = function () {
            var cbs = [], seq = 0, autog = true;
            function postit(clientscb, message) {
              var wrapped, to, c;
              seq = seq > 100 ? 0 : seq + 1;
              cbs[seq] = clientscb;
              wrapped = {
                seq: seq,
                src: 'client',
                clientVersion: cversion,
                parentVersion: pversion,
                body: message
              };
              c = message && message.config && message.config.client;
              to = getTargetOrigin($$.isNil(c) ? null : c.targetOrigin);
              if ($$.isNil(to)) {
                throw 'ERROR: targetOrigin was not supplied and was not found on the hash tag, this can result from a redirect or link to another page.';
              }
              $$.console.log('posting message ', {
                message: wrapped,
                to: to
              });
              $$.xd.post(wrapped, to, parent);
            }
            function validateClient(client, cb) {
              var msg;
              client = client || $$.oauth && $$.oauth.client();
              if ($$.isNil(client) || $$.isNil(client.oauthToken)) {
                msg = {
                  status: 401,
                  statusText: 'Unauthorized',
                  parentVersion: pversion,
                  payload: 'client or client.oauthToken not supplied'
                };
              }
              if ($$.isNil(client.instanceId) || $$.isNil(client.targetOrigin)) {
                msg = {
                  status: 400,
                  statusText: 'Bad Request',
                  parentVersion: pversion,
                  payload: 'client.instanceId or client.targetOrigin not supplied'
                };
              }
              if (!$$.isNil(msg)) {
                if ($$.isFunction(cb)) {
                  cb(msg);
                  return false;
                } else {
                  throw msg;
                }
              }
              return true;
            }
            var event = function () {
                var subscriptions = {}, STR_EVT = 'sfdc.streamingapi';
                function validName(name, res) {
                  var msg, r = $$.validEventName(name, res);
                  if (r !== 0) {
                    msg = {
                      1: 'Event names can only contain one namespace',
                      2: 'Namespace has already been reserved',
                      3: 'Event name contains invalid characters'
                    };
                    throw msg[r];
                  }
                }
                function findSubscription(event) {
                  var s, name = event.name;
                  if (name === STR_EVT) {
                    if (!$$.isNil(subscriptions[name])) {
                      s = subscriptions[name][event.params.topic];
                    }
                  } else {
                    s = subscriptions[name];
                  }
                  if (!$$.isNil(s) && ($$.isFunction(s.onData) || $$.isFunction(s.onComplete))) {
                    return s;
                  }
                  return null;
                }
                return {
                  callback: function (data) {
                    var event = data.payload, subscription = findSubscription(event), func;
                    if (!$$.isNil(subscription)) {
                      if (event.method === 'onData') {
                        func = subscription.onData;
                      } else {
                        if (event.method === 'onComplete') {
                          func = subscription.onComplete;
                        }
                      }
                      if (!$$.isNil(func) && $$.isFunction(func)) {
                        func(event.payload);
                      }
                    }
                  },
                  subscribe: function (client, s) {
                    var subs = {};
                    if ($$.isNil(s) || !validateClient(client)) {
                      throw 'precondition fail';
                    }
                    $$.each($$.isArray(s) ? s : [s], function (v) {
                      if (!$$.isNil(v.name)) {
                        validName(v.name, [
                          'canvas',
                          'sfdc'
                        ]);
                        if (v.name === STR_EVT) {
                          if (!$$.isNil(v.params) && !$$.isNil(v.params.topic)) {
                            if ($$.isNil(subscriptions[v.name])) {
                              subscriptions[v.name] = {};
                            }
                            subscriptions[v.name][v.params.topic] = v;
                          } else {
                            throw '[' + STR_EVT + '] topic is missing';
                          }
                        } else {
                          subscriptions[v.name] = v;
                        }
                        subs[v.name] = { params: v.params };
                      } else {
                        throw 'subscription does not have a \'name\'';
                      }
                    });
                    if (!client.isVF) {
                      postit(null, {
                        type: 'subscribe',
                        config: { client: client },
                        subscriptions: subs
                      });
                    }
                  },
                  unsubscribe: function (client, s) {
                    var subs = {};
                    if ($$.isNil(s) || !validateClient(client)) {
                      throw 'PRECONDITION FAIL: need fo supply client and event name';
                    }
                    if ($$.isString(s)) {
                      subs[s] = {};
                      delete subscriptions[s];
                    } else {
                      $$.each($$.isArray(s) ? s : [s], function (v) {
                        var name = v.name ? v.name : v;
                        validName(name, [
                          'canvas',
                          'sfdc'
                        ]);
                        subs[name] = { params: v.params };
                        if (name === STR_EVT) {
                          if (!$$.isNil(subscriptions[name])) {
                            if (!$$.isNil(subscriptions[name][v.params.topic])) {
                              delete subscriptions[name][v.params.topic];
                            }
                            if ($$.size(subscriptions[name]) <= 0) {
                              delete subscriptions[name];
                            }
                          }
                        } else {
                          delete subscriptions[name];
                        }
                      });
                    }
                    if (!client.isVF) {
                      postit(null, {
                        type: 'unsubscribe',
                        config: { client: client },
                        subscriptions: subs
                      });
                    }
                  },
                  publish: function (client, e) {
                    if (!$$.isNil(e) && !$$.isNil(e.name)) {
                      validName(e.name, ['s1']);
                      if (validateClient(client)) {
                        postit(null, {
                          type: 'publish',
                          config: { client: client },
                          event: e
                        });
                      }
                    }
                  }
                };
              }();
            var callback = function () {
                return {
                  callback: function (data) {
                    if (data.status === 401 && $$.isArray(data.payload) && data.payload[0].errorCode && data.payload[0].errorCode === 'INVALID_SESSION_ID') {
                      if ($$.oauth) {
                        $$.oauth.logout();
                      }
                    }
                    if ($$.isFunction(cbs[data.seq])) {
                      if (!$$.isFunction(cbs[data.seq])) {
                        alert('not function');
                      }
                      cbs[data.seq](data);
                    } else {
                    }
                  }
                };
              }();
            var services = function () {
                var sr;
                return {
                  ajax: function (url, settings) {
                    var ccb, config, defaults;
                    if (!url) {
                      throw 'PRECONDITION ERROR: url required with AJAX call';
                    }
                    if (!settings || !$$.isFunction(settings.success)) {
                      throw 'PRECONDITION ERROR: function: \'settings.success\' missing.';
                    }
                    if (!validateClient(settings.client, settings.success)) {
                      return;
                    }
                    ccb = settings.success;
                    defaults = {
                      method: 'GET',
                      async: true,
                      contentType: 'application/json',
                      headers: {
                        'Authorization': 'OAuth ' + settings.client.oauthToken,
                        'Accept': 'application/json'
                      },
                      data: null
                    };
                    config = $$.extend(defaults, settings || {});
                    config.success = undefined;
                    config.failure = undefined;
                    if (config.client.targetOrigin === '*') {
                      config.client.targetOrigin = null;
                    } else {
                      purl = $$.startsWithHttp(config.targetOrigin, purl);
                    }
                    postit(ccb, {
                      type: 'ajax',
                      url: url,
                      config: config
                    });
                  },
                  ctx: function (clientscb, client) {
                    if (validateClient(client, clientscb)) {
                      postit(clientscb, {
                        type: 'ctx',
                        accessToken: client.oauthToken,
                        config: { client: client }
                      });
                    }
                  },
                  token: function (t) {
                    return $$.oauth && $$.oauth.token(t);
                  },
                  version: function () {
                    return {
                      clientVersion: cversion,
                      parentVersion: pversion
                    };
                  },
                  signedrequest: function (s) {
                    if (arguments.length > 0) {
                      sr = s;
                    }
                    return sr;
                  },
                  refreshSignedRequest: function (clientscb) {
                    var id = window.name.substring('canvas-frame-'.length), client = {
                        oauthToken: 'null',
                        instanceId: id,
                        targetOrigin: '*'
                      };
                    postit(clientscb, {
                      type: 'refresh',
                      accessToken: client.oauthToken,
                      config: { client: client }
                    });
                  },
                  repost: function (refresh) {
                    var id = window.name.substring('canvas-frame-'.length), client = {
                        oauthToken: 'null',
                        instanceId: id,
                        targetOrigin: '*'
                      }, r = refresh || false;
                    postit(null, {
                      type: 'repost',
                      accessToken: client.oauthToken,
                      config: { client: client },
                      refresh: r
                    });
                  }
                };
              }();
            var frame = function () {
                return {
                  size: function () {
                    var docElement = $$.document().documentElement;
                    var contentHeight = docElement.scrollHeight, pageHeight = docElement.clientHeight, scrollTop = docElement && docElement.scrollTop || $$.document().body.scrollTop, contentWidth = docElement.scrollWidth, pageWidth = docElement.clientWidth, scrollLeft = docElement && docElement.scrollLeft || $$.document().body.scrollLeft;
                    return {
                      heights: {
                        contentHeight: contentHeight,
                        pageHeight: pageHeight,
                        scrollTop: scrollTop
                      },
                      widths: {
                        contentWidth: contentWidth,
                        pageWidth: pageWidth,
                        scrollLeft: scrollLeft
                      }
                    };
                  },
                  resize: function (client, size) {
                    var sh, ch, sw, cw, s = {
                        height: '',
                        width: ''
                      }, docElement = $$.document().documentElement;
                    if ($$.isNil(size)) {
                      sh = docElement.scrollHeight;
                      ch = docElement.clientHeight;
                      if (ch !== sh) {
                        s.height = sh + 'px';
                      }
                      sw = docElement.scrollWidth;
                      cw = docElement.clientWidth;
                      if (sw !== cw) {
                        s.width = sw + 'px';
                      }
                    } else {
                      if (!$$.isNil(size.height)) {
                        s.height = size.height;
                      }
                      if (!$$.isNil(size.width)) {
                        s.width = size.width;
                      }
                    }
                    if (!$$.isNil(s.height) || !$$.isNil(s.width)) {
                      postit(null, {
                        type: 'resize',
                        config: { client: client },
                        size: s
                      });
                    }
                  },
                  autogrow: function (client, b, interval) {
                    var ival = $$.isNil(interval) ? 300 : interval;
                    autog = $$.isNil(b) ? true : b;
                    if (autog === false) {
                      return;
                    }
                    setTimeout(function () {
                      submodules.frame.resize(client);
                      submodules.frame.autogrow(client, autog);
                    }, ival);
                  }
                };
              }();
            return {
              services: services,
              frame: frame,
              event: event,
              callback: callback
            };
          }();
        $$.xd.receive(xdCallback, getTargetOrigin);
        return {
          ctx: submodules.services.ctx,
          ajax: submodules.services.ajax,
          token: submodules.services.token,
          version: submodules.services.version,
          resize: submodules.frame.resize,
          size: submodules.frame.size,
          autogrow: submodules.frame.autogrow,
          subscribe: submodules.event.subscribe,
          unsubscribe: submodules.event.unsubscribe,
          publish: submodules.event.publish,
          signedrequest: submodules.services.signedrequest,
          refreshSignedRequest: submodules.services.refreshSignedRequest,
          repost: submodules.services.repost
        };
      }();
    $$.module('Sfdc.canvas.client', module);
  }(Sfdc.canvas));
  ;
  browserify_shim__define__module__export__(typeof Sfdc.canvas != 'undefined' ? Sfdc.canvas : window.Sfdc.canvas);
}.call(global, undefined, undefined, undefined, undefined, function defineExport(ex) {
  module.exports = ex;
}));
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],9:[function(require,module,exports){
/*
 *
 * Find more about this plugin by visiting
 * http://alxgbsn.co.uk/
 *
 * Copyright (c) 2010-2012 Alex Gibson
 * Released under MIT license
 *
 */
(function (window, document) {
  function Shake() {
    //feature detect
    this.hasDeviceMotion = 'ondevicemotion' in window;
    //default velocity threshold for shake to register
    this.threshold = 15;
    //use date to prevent multiple shakes firing
    this.lastTime = new Date();
    //accelerometer values
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    //create custom event
    if (typeof document.CustomEvent === 'function') {
      this.event = new document.CustomEvent('shake', {
        bubbles: true,
        cancelable: true
      });
    } else if (typeof document.createEvent === 'function') {
      this.event = document.createEvent('Event');
      this.event.initEvent('shake', true, true);
    } else {
      return false;
    }
  }
  //reset timer values
  Shake.prototype.reset = function () {
    this.lastTime = new Date();
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
  };
  //start listening for devicemotion
  Shake.prototype.start = function () {
    this.reset();
    if (this.hasDeviceMotion) {
      window.addEventListener('devicemotion', this, false);
    }
  };
  //stop listening for devicemotion
  Shake.prototype.stop = function () {
    if (this.hasDeviceMotion) {
      window.removeEventListener('devicemotion', this, false);
    }
    this.reset();
  };
  //calculates if shake did occur
  Shake.prototype.devicemotion = function (e) {
    var current = e.accelerationIncludingGravity, currentTime, timeDifference, deltaX = 0, deltaY = 0, deltaZ = 0;
    if (this.lastX === null && this.lastY === null && this.lastZ === null) {
      this.lastX = current.x;
      this.lastY = current.y;
      this.lastZ = current.z;
      return;
    }
    deltaX = Math.abs(this.lastX - current.x);
    deltaY = Math.abs(this.lastY - current.y);
    deltaZ = Math.abs(this.lastZ - current.z);
    if (deltaX > this.threshold && deltaY > this.threshold || deltaX > this.threshold && deltaZ > this.threshold || deltaY > this.threshold && deltaZ > this.threshold) {
      //calculate time in milliseconds since last shake registered
      currentTime = new Date();
      timeDifference = currentTime.getTime() - this.lastTime.getTime();
      if (timeDifference > 1000) {
        window.dispatchEvent(this.event);
        this.lastTime = new Date();
      }
    }
    this.lastX = current.x;
    this.lastY = current.y;
    this.lastZ = current.z;
  };
  //event handler
  Shake.prototype.handleEvent = function (e) {
    if (typeof this[e.type] === 'function') {
      return this[e.type](e);
    }
  };
  //create a new instance of shake.js.
  var myShakeEvent = new Shake();
  myShakeEvent && myShakeEvent.start();
}(window, document));
},{}],10:[function(require,module,exports){
/**
 * @license AngularJS v1.4.4
 * (c) 2010-2015 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/* jshint ignore:start */
var noop        = angular.noop;
var extend      = angular.extend;
var jqLite      = angular.element;
var forEach     = angular.forEach;
var isArray     = angular.isArray;
var isString    = angular.isString;
var isObject    = angular.isObject;
var isUndefined = angular.isUndefined;
var isDefined   = angular.isDefined;
var isFunction  = angular.isFunction;
var isElement   = angular.isElement;

var ELEMENT_NODE = 1;
var COMMENT_NODE = 8;

var ADD_CLASS_SUFFIX = '-add';
var REMOVE_CLASS_SUFFIX = '-remove';
var EVENT_CLASS_PREFIX = 'ng-';
var ACTIVE_CLASS_SUFFIX = '-active';

var NG_ANIMATE_CLASSNAME = 'ng-animate';
var NG_ANIMATE_CHILDREN_DATA = '$$ngAnimateChildren';

// Detect proper transitionend/animationend event names.
var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;

// If unprefixed events are not supported but webkit-prefixed are, use the latter.
// Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
// Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
// but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
// Register both events in case `window.onanimationend` is not supported because of that,
// do the same for `transitionend` as Safari is likely to exhibit similar behavior.
// Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
// therefore there is no reason to test anymore for other vendor prefixes:
// http://caniuse.com/#search=transition
if (window.ontransitionend === undefined && window.onwebkittransitionend !== undefined) {
  CSS_PREFIX = '-webkit-';
  TRANSITION_PROP = 'WebkitTransition';
  TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
} else {
  TRANSITION_PROP = 'transition';
  TRANSITIONEND_EVENT = 'transitionend';
}

if (window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
  CSS_PREFIX = '-webkit-';
  ANIMATION_PROP = 'WebkitAnimation';
  ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
} else {
  ANIMATION_PROP = 'animation';
  ANIMATIONEND_EVENT = 'animationend';
}

var DURATION_KEY = 'Duration';
var PROPERTY_KEY = 'Property';
var DELAY_KEY = 'Delay';
var TIMING_KEY = 'TimingFunction';
var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
var ANIMATION_PLAYSTATE_KEY = 'PlayState';
var SAFE_FAST_FORWARD_DURATION_VALUE = 9999;

var ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
var ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
var TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
var TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;

var isPromiseLike = function(p) {
  return p && p.then ? true : false;
};

function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr('areq', "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
  }
  return arg;
}

function mergeClasses(a,b) {
  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;
  if (isArray(a)) a = a.join(' ');
  if (isArray(b)) b = b.join(' ');
  return a + ' ' + b;
}

function packageStyles(options) {
  var styles = {};
  if (options && (options.to || options.from)) {
    styles.to = options.to;
    styles.from = options.from;
  }
  return styles;
}

function pendClasses(classes, fix, isPrefix) {
  var className = '';
  classes = isArray(classes)
      ? classes
      : classes && isString(classes) && classes.length
          ? classes.split(/\s+/)
          : [];
  forEach(classes, function(klass, i) {
    if (klass && klass.length > 0) {
      className += (i > 0) ? ' ' : '';
      className += isPrefix ? fix + klass
                            : klass + fix;
    }
  });
  return className;
}

function removeFromArray(arr, val) {
  var index = arr.indexOf(val);
  if (val >= 0) {
    arr.splice(index, 1);
  }
}

function stripCommentsFromElement(element) {
  if (element instanceof jqLite) {
    switch (element.length) {
      case 0:
        return [];
        break;

      case 1:
        // there is no point of stripping anything if the element
        // is the only element within the jqLite wrapper.
        // (it's important that we retain the element instance.)
        if (element[0].nodeType === ELEMENT_NODE) {
          return element;
        }
        break;

      default:
        return jqLite(extractElementNode(element));
        break;
    }
  }

  if (element.nodeType === ELEMENT_NODE) {
    return jqLite(element);
  }
}

function extractElementNode(element) {
  if (!element[0]) return element;
  for (var i = 0; i < element.length; i++) {
    var elm = element[i];
    if (elm.nodeType == ELEMENT_NODE) {
      return elm;
    }
  }
}

function $$addClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.addClass(elm, className);
  });
}

function $$removeClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.removeClass(elm, className);
  });
}

function applyAnimationClassesFactory($$jqLite) {
  return function(element, options) {
    if (options.addClass) {
      $$addClass($$jqLite, element, options.addClass);
      options.addClass = null;
    }
    if (options.removeClass) {
      $$removeClass($$jqLite, element, options.removeClass);
      options.removeClass = null;
    }
  }
}

function prepareAnimationOptions(options) {
  options = options || {};
  if (!options.$$prepared) {
    var domOperation = options.domOperation || noop;
    options.domOperation = function() {
      options.$$domOperationFired = true;
      domOperation();
      domOperation = noop;
    };
    options.$$prepared = true;
  }
  return options;
}

function applyAnimationStyles(element, options) {
  applyAnimationFromStyles(element, options);
  applyAnimationToStyles(element, options);
}

function applyAnimationFromStyles(element, options) {
  if (options.from) {
    element.css(options.from);
    options.from = null;
  }
}

function applyAnimationToStyles(element, options) {
  if (options.to) {
    element.css(options.to);
    options.to = null;
  }
}

function mergeAnimationOptions(element, target, newOptions) {
  var toAdd = (target.addClass || '') + ' ' + (newOptions.addClass || '');
  var toRemove = (target.removeClass || '') + ' ' + (newOptions.removeClass || '');
  var classes = resolveElementClasses(element.attr('class'), toAdd, toRemove);

  if (newOptions.preparationClasses) {
    target.preparationClasses = concatWithSpace(newOptions.preparationClasses, target.preparationClasses);
    delete newOptions.preparationClasses;
  }

  // noop is basically when there is no callback; otherwise something has been set
  var realDomOperation = target.domOperation !== noop ? target.domOperation : null;

  extend(target, newOptions);

  // TODO(matsko or sreeramu): proper fix is to maintain all animation callback in array and call at last,but now only leave has the callback so no issue with this.
  if (realDomOperation) {
    target.domOperation = realDomOperation;
  }

  if (classes.addClass) {
    target.addClass = classes.addClass;
  } else {
    target.addClass = null;
  }

  if (classes.removeClass) {
    target.removeClass = classes.removeClass;
  } else {
    target.removeClass = null;
  }

  return target;
}

function resolveElementClasses(existing, toAdd, toRemove) {
  var ADD_CLASS = 1;
  var REMOVE_CLASS = -1;

  var flags = {};
  existing = splitClassesToLookup(existing);

  toAdd = splitClassesToLookup(toAdd);
  forEach(toAdd, function(value, key) {
    flags[key] = ADD_CLASS;
  });

  toRemove = splitClassesToLookup(toRemove);
  forEach(toRemove, function(value, key) {
    flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
  });

  var classes = {
    addClass: '',
    removeClass: ''
  };

  forEach(flags, function(val, klass) {
    var prop, allow;
    if (val === ADD_CLASS) {
      prop = 'addClass';
      allow = !existing[klass];
    } else if (val === REMOVE_CLASS) {
      prop = 'removeClass';
      allow = existing[klass];
    }
    if (allow) {
      if (classes[prop].length) {
        classes[prop] += ' ';
      }
      classes[prop] += klass;
    }
  });

  function splitClassesToLookup(classes) {
    if (isString(classes)) {
      classes = classes.split(' ');
    }

    var obj = {};
    forEach(classes, function(klass) {
      // sometimes the split leaves empty string values
      // incase extra spaces were applied to the options
      if (klass.length) {
        obj[klass] = true;
      }
    });
    return obj;
  }

  return classes;
}

function getDomNode(element) {
  return (element instanceof angular.element) ? element[0] : element;
}

function applyGeneratedPreparationClasses(element, event, options) {
  var classes = '';
  if (event) {
    classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
  }
  if (options.addClass) {
    classes = concatWithSpace(classes, pendClasses(options.addClass, ADD_CLASS_SUFFIX));
  }
  if (options.removeClass) {
    classes = concatWithSpace(classes, pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX));
  }
  if (classes.length) {
    options.preparationClasses = classes;
    element.addClass(classes);
  }
}

function clearGeneratedClasses(element, options) {
  if (options.preparationClasses) {
    element.removeClass(options.preparationClasses);
    options.preparationClasses = null;
  }
  if (options.activeClasses) {
    element.removeClass(options.activeClasses);
    options.activeClasses = null;
  }
}

function blockTransitions(node, duration) {
  // we use a negative delay value since it performs blocking
  // yet it doesn't kill any existing transitions running on the
  // same element which makes this safe for class-based animations
  var value = duration ? '-' + duration + 's' : '';
  applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
  return [TRANSITION_DELAY_PROP, value];
}

function blockKeyframeAnimations(node, applyBlock) {
  var value = applyBlock ? 'paused' : '';
  var key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
  applyInlineStyle(node, [key, value]);
  return [key, value];
}

function applyInlineStyle(node, styleTuple) {
  var prop = styleTuple[0];
  var value = styleTuple[1];
  node.style[prop] = value;
}

function concatWithSpace(a,b) {
  if (!a) return b;
  if (!b) return a;
  return a + ' ' + b;
}

function $$BodyProvider() {
  this.$get = ['$document', function($document) {
    return jqLite($document[0].body);
  }];
}

var $$AnimateChildrenDirective = [function() {
  return function(scope, element, attrs) {
    var val = attrs.ngAnimateChildren;
    if (angular.isString(val) && val.length === 0) { //empty attribute
      element.data(NG_ANIMATE_CHILDREN_DATA, true);
    } else {
      attrs.$observe('ngAnimateChildren', function(value) {
        value = value === 'on' || value === 'true';
        element.data(NG_ANIMATE_CHILDREN_DATA, value);
      });
    }
  };
}];

/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 *
 * @description
 * The `$animateCss` service is a useful utility to trigger customized CSS-based transitions/keyframes
 * from a JavaScript-based animation or directly from a directive. The purpose of `$animateCss` is NOT
 * to side-step how `$animate` and ngAnimate work, but the goal is to allow pre-existing animations or
 * directives to create more complex animations that can be purely driven using CSS code.
 *
 * Note that only browsers that support CSS transitions and/or keyframe animations are capable of
 * rendering animations triggered via `$animateCss` (bad news for IE9 and lower).
 *
 * ## Usage
 * Once again, `$animateCss` is designed to be used inside of a registered JavaScript animation that
 * is powered by ngAnimate. It is possible to use `$animateCss` directly inside of a directive, however,
 * any automatic control over cancelling animations and/or preventing animations from being run on
 * child elements will not be handled by Angular. For this to work as expected, please use `$animate` to
 * trigger the animation and then setup a JavaScript animation that injects `$animateCss` to trigger
 * the CSS animation.
 *
 * The example below shows how we can create a folding animation on an element using `ng-if`:
 *
 * ```html
 * <!-- notice the `fold-animation` CSS class -->
 * <div ng-if="onOff" class="fold-animation">
 *   This element will go BOOM
 * </div>
 * <button ng-click="onOff=true">Fold In</button>
 * ```
 *
 * Now we create the **JavaScript animation** that will trigger the CSS transition:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * ## More Advanced Uses
 *
 * `$animateCss` is the underlying code that ngAnimate uses to power **CSS-based animations** behind the scenes. Therefore CSS hooks
 * like `.ng-EVENT`, `.ng-EVENT-active`, `.ng-EVENT-stagger` are all features that can be triggered using `$animateCss` via JavaScript code.
 *
 * This also means that just about any combination of adding classes, removing classes, setting styles, dynamically setting a keyframe animation,
 * applying a hardcoded duration or delay value, changing the animation easing or applying a stagger animation are all options that work with
 * `$animateCss`. The service itself is smart enough to figure out the combination of options and examine the element styling properties in order
 * to provide a working animation that will run in CSS.
 *
 * The example below showcases a more advanced version of the `.fold-animation` from the example above:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         addClass: 'red large-text pulse-twice',
 *         easing: 'ease-out',
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Since we're adding/removing CSS classes then the CSS transition will also pick those up:
 *
 * ```css
 * /&#42; since a hardcoded duration value of 1 was provided in the JavaScript animation code,
 * the CSS classes below will be transitioned despite them being defined as regular CSS classes &#42;/
 * .red { background:red; }
 * .large-text { font-size:20px; }
 *
 * /&#42; we can also use a keyframe animation and $animateCss will make it work alongside the transition &#42;/
 * .pulse-twice {
 *   animation: 0.5s pulse linear 2;
 *   -webkit-animation: 0.5s pulse linear 2;
 * }
 *
 * @keyframes pulse {
 *   from { transform: scale(0.5); }
 *   to { transform: scale(1.5); }
 * }
 *
 * @-webkit-keyframes pulse {
 *   from { -webkit-transform: scale(0.5); }
 *   to { -webkit-transform: scale(1.5); }
 * }
 * ```
 *
 * Given this complex combination of CSS classes, styles and options, `$animateCss` will figure everything out and make the animation happen.
 *
 * ## How the Options are handled
 *
 * `$animateCss` is very versatile and intelligent when it comes to figuring out what configurations to apply to the element to ensure the animation
 * works with the options provided. Say for example we were adding a class that contained a keyframe value and we wanted to also animate some inline
 * styles using the `from` and `to` properties.
 *
 * ```js
 * var animator = $animateCss(element, {
 *   from: { background:'red' },
 *   to: { background:'blue' }
 * });
 * animator.start();
 * ```
 *
 * ```css
 * .rotating-animation {
 *   animation:0.5s rotate linear;
 *   -webkit-animation:0.5s rotate linear;
 * }
 *
 * @keyframes rotate {
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * }
 *
 * @-webkit-keyframes rotate {
 *   from { -webkit-transform: rotate(0deg); }
 *   to { -webkit-transform: rotate(360deg); }
 * }
 * ```
 *
 * The missing pieces here are that we do not have a transition set (within the CSS code nor within the `$animateCss` options) and the duration of the animation is
 * going to be detected from what the keyframe styles on the CSS class are. In this event, `$animateCss` will automatically create an inline transition
 * style matching the duration detected from the keyframe style (which is present in the CSS class that is being added) and then prepare both the transition
 * and keyframe animations to run in parallel on the element. Then when the animation is underway the provided `from` and `to` CSS styles will be applied
 * and spread across the transition and keyframe animation.
 *
 * ## What is returned
 *
 * `$animateCss` works in two stages: a preparation phase and an animation phase. Therefore when `$animateCss` is first called it will NOT actually
 * start the animation. All that is going on here is that the element is being prepared for the animation (which means that the generated CSS classes are
 * added and removed on the element). Once `$animateCss` is called it will return an object with the following properties:
 *
 * ```js
 * var animator = $animateCss(element, { ... });
 * ```
 *
 * Now what do the contents of our `animator` variable look like:
 *
 * ```js
 * {
 *   // starts the animation
 *   start: Function,
 *
 *   // ends (aborts) the animation
 *   end: Function
 * }
 * ```
 *
 * To actually start the animation we need to run `animation.start()` which will then return a promise that we can hook into to detect when the animation ends.
 * If we choose not to run the animation then we MUST run `animation.end()` to perform a cleanup on the element (since some CSS classes and stlyes may have been
 * applied to the element during the preparation phase). Note that all other properties such as duration, delay, transitions and keyframes are just properties
 * and that changing them will not reconfigure the parameters of the animation.
 *
 * ### runner.done() vs runner.then()
 * It is documented that `animation.start()` will return a promise object and this is true, however, there is also an additional method available on the
 * runner called `.done(callbackFn)`. The done method works the same as `.finally(callbackFn)`, however, it does **not trigger a digest to occur**.
 * Therefore, for performance reasons, it's always best to use `runner.done(callback)` instead of `runner.then()`, `runner.catch()` or `runner.finally()`
 * unless you really need a digest to kick off afterwards.
 *
 * Keep in mind that, to make this easier, ngAnimate has tweaked the JS animations API to recognize when a runner instance is returned from $animateCss
 * (so there is no need to call `runner.done(doneFn)` inside of your JavaScript animation code).
 * Check the {@link ngAnimate.$animateCss#usage animation code above} to see how this works.
 *
 * @param {DOMElement} element the element that will be animated
 * @param {object} options the animation-related options that will be applied during the animation
 *
 * * `event` - The DOM event (e.g. enter, leave, move). When used, a generated CSS class of `ng-EVENT` and `ng-EVENT-active` will be applied
 * to the element during the animation. Multiple events can be provided when spaces are used as a separator. (Note that this will not perform any DOM operation.)
 * * `easing` - The CSS easing value that will be applied to the transition or keyframe animation (or both).
 * * `transition` - The raw CSS transition style that will be used (e.g. `1s linear all`).
 * * `keyframeStyle` - The raw CSS keyframe animation style that will be used (e.g. `1s my_animation linear`).
 * * `from` - The starting CSS styles (a key/value object) that will be applied at the start of the animation.
 * * `to` - The ending CSS styles (a key/value object) that will be applied across the animation via a CSS transition.
 * * `addClass` - A space separated list of CSS classes that will be added to the element and spread across the animation.
 * * `removeClass` - A space separated list of CSS classes that will be removed from the element and spread across the animation.
 * * `duration` - A number value representing the total duration of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `0`
 * is provided then the animation will be skipped entirely.
 * * `delay` - A number value representing the total delay of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `true` is
 * used then whatever delay value is detected from the CSS classes will be mirrored on the elements styles (e.g. by setting delay true then the style value
 * of the element will be `transition-delay: DETECTED_VALUE`). Using `true` is useful when you want the CSS classes and inline styles to all share the same
 * CSS delay value.
 * * `stagger` - A numeric time value representing the delay between successively animated elements
 * ({@link ngAnimate#css-staggering-animations Click here to learn how CSS-based staggering works in ngAnimate.})
 * * `staggerIndex` - The numeric index representing the stagger item (e.g. a value of 5 is equal to the sixth item in the stagger; therefore when a
 * * `stagger` option value of `0.1` is used then there will be a stagger delay of `600ms`)
 * * `applyClassesEarly` - Whether or not the classes being added or removed will be used when detecting the animation. This is set by `$animate` when enter/leave/move animations are fired to ensure that the CSS classes are resolved in time. (Note that this will prevent any transitions from occuring on the classes being added and removed.)
 *
 * @return {object} an object with start and end methods and details about the animation.
 *
 * * `start` - The method to start the animation. This will return a `Promise` when called.
 * * `end` - This method will cancel the animation and remove all applied CSS classes and styles.
 */
var ONE_SECOND = 1000;
var BASE_TEN = 10;

var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
var CLOSING_TIME_BUFFER = 1.5;

var DETECT_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  transitionProperty:      TRANSITION_PROP + PROPERTY_KEY,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP,
  animationIterationCount: ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY
};

var DETECT_STAGGER_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP
};

function getCssKeyframeDurationStyle(duration) {
  return [ANIMATION_DURATION_PROP, duration + 's'];
}

function getCssDelayStyle(delay, isKeyframeAnimation) {
  var prop = isKeyframeAnimation ? ANIMATION_DELAY_PROP : TRANSITION_DELAY_PROP;
  return [prop, delay + 's'];
}

function computeCssStyles($window, element, properties) {
  var styles = Object.create(null);
  var detectedStyles = $window.getComputedStyle(element) || {};
  forEach(properties, function(formalStyleName, actualStyleName) {
    var val = detectedStyles[formalStyleName];
    if (val) {
      var c = val.charAt(0);

      // only numerical-based values have a negative sign or digit as the first value
      if (c === '-' || c === '+' || c >= 0) {
        val = parseMaxTime(val);
      }

      // by setting this to null in the event that the delay is not set or is set directly as 0
      // then we can still allow for zegative values to be used later on and not mistake this
      // value for being greater than any other negative value.
      if (val === 0) {
        val = null;
      }
      styles[actualStyleName] = val;
    }
  });

  return styles;
}

function parseMaxTime(str) {
  var maxValue = 0;
  var values = str.split(/\s*,\s*/);
  forEach(values, function(value) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value) || 0;
    maxValue = maxValue ? Math.max(value, maxValue) : value;
  });
  return maxValue;
}

function truthyTimingValue(val) {
  return val === 0 || val != null;
}

function getCssTransitionDurationStyle(duration, applyOnlyDuration) {
  var style = TRANSITION_PROP;
  var value = duration + 's';
  if (applyOnlyDuration) {
    style += DURATION_KEY;
  } else {
    value += ' linear all';
  }
  return [style, value];
}

function createLocalCacheLookup() {
  var cache = Object.create(null);
  return {
    flush: function() {
      cache = Object.create(null);
    },

    count: function(key) {
      var entry = cache[key];
      return entry ? entry.total : 0;
    },

    get: function(key) {
      var entry = cache[key];
      return entry && entry.value;
    },

    put: function(key, value) {
      if (!cache[key]) {
        cache[key] = { total: 1, value: value };
      } else {
        cache[key].total++;
      }
    }
  };
}

var $AnimateCssProvider = ['$animateProvider', function($animateProvider) {
  var gcsLookup = createLocalCacheLookup();
  var gcsStaggerLookup = createLocalCacheLookup();

  this.$get = ['$window', '$$jqLite', '$$AnimateRunner', '$timeout', '$$forceReflow', '$sniffer', '$$rAF',
       function($window,   $$jqLite,   $$AnimateRunner,   $timeout,   $$forceReflow,   $sniffer,   $$rAF) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    var parentCounter = 0;
    function gcsHashFn(node, extraClasses) {
      var KEY = "$$ngAnimateParentKey";
      var parentNode = node.parentNode;
      var parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
      return parentID + '-' + node.getAttribute('class') + '-' + extraClasses;
    }

    function computeCachedCssStyles(node, className, cacheKey, properties) {
      var timings = gcsLookup.get(cacheKey);

      if (!timings) {
        timings = computeCssStyles($window, node, properties);
        if (timings.animationIterationCount === 'infinite') {
          timings.animationIterationCount = 1;
        }
      }

      // we keep putting this in multiple times even though the value and the cacheKey are the same
      // because we're keeping an interal tally of how many duplicate animations are detected.
      gcsLookup.put(cacheKey, timings);
      return timings;
    }

    function computeCachedCssStaggerStyles(node, className, cacheKey, properties) {
      var stagger;

      // if we have one or more existing matches of matching elements
      // containing the same parent + CSS styles (which is how cacheKey works)
      // then staggering is possible
      if (gcsLookup.count(cacheKey) > 0) {
        stagger = gcsStaggerLookup.get(cacheKey);

        if (!stagger) {
          var staggerClassName = pendClasses(className, '-stagger');

          $$jqLite.addClass(node, staggerClassName);

          stagger = computeCssStyles($window, node, properties);

          // force the conversion of a null value to zero incase not set
          stagger.animationDuration = Math.max(stagger.animationDuration, 0);
          stagger.transitionDuration = Math.max(stagger.transitionDuration, 0);

          $$jqLite.removeClass(node, staggerClassName);

          gcsStaggerLookup.put(cacheKey, stagger);
        }
      }

      return stagger || {};
    }

    var cancelLastRAFRequest;
    var rafWaitQueue = [];
    function waitUntilQuiet(callback) {
      if (cancelLastRAFRequest) {
        cancelLastRAFRequest(); //cancels the request
      }
      rafWaitQueue.push(callback);
      cancelLastRAFRequest = $$rAF(function() {
        cancelLastRAFRequest = null;
        gcsLookup.flush();
        gcsStaggerLookup.flush();

        // DO NOT REMOVE THIS LINE OR REFACTOR OUT THE `pageWidth` variable.
        // PLEASE EXAMINE THE `$$forceReflow` service to understand why.
        var pageWidth = $$forceReflow();

        // we use a for loop to ensure that if the queue is changed
        // during this looping then it will consider new requests
        for (var i = 0; i < rafWaitQueue.length; i++) {
          rafWaitQueue[i](pageWidth);
        }
        rafWaitQueue.length = 0;
      });
    }

    return init;

    function computeTimings(node, className, cacheKey) {
      var timings = computeCachedCssStyles(node, className, cacheKey, DETECT_CSS_PROPERTIES);
      var aD = timings.animationDelay;
      var tD = timings.transitionDelay;
      timings.maxDelay = aD && tD
          ? Math.max(aD, tD)
          : (aD || tD);
      timings.maxDuration = Math.max(
          timings.animationDuration * timings.animationIterationCount,
          timings.transitionDuration);

      return timings;
    }

    function init(element, options) {
      var node = getDomNode(element);
      if (!node || !node.parentNode) {
        return closeAndReturnNoopAnimator();
      }

      options = prepareAnimationOptions(options);

      var temporaryStyles = [];
      var classes = element.attr('class');
      var styles = packageStyles(options);
      var animationClosed;
      var animationPaused;
      var animationCompleted;
      var runner;
      var runnerHost;
      var maxDelay;
      var maxDelayTime;
      var maxDuration;
      var maxDurationTime;

      if (options.duration === 0 || (!$sniffer.animations && !$sniffer.transitions)) {
        return closeAndReturnNoopAnimator();
      }

      var method = options.event && isArray(options.event)
            ? options.event.join(' ')
            : options.event;

      var isStructural = method && options.structural;
      var structuralClassName = '';
      var addRemoveClassName = '';

      if (isStructural) {
        structuralClassName = pendClasses(method, EVENT_CLASS_PREFIX, true);
      } else if (method) {
        structuralClassName = method;
      }

      if (options.addClass) {
        addRemoveClassName += pendClasses(options.addClass, ADD_CLASS_SUFFIX);
      }

      if (options.removeClass) {
        if (addRemoveClassName.length) {
          addRemoveClassName += ' ';
        }
        addRemoveClassName += pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX);
      }

      // there may be a situation where a structural animation is combined together
      // with CSS classes that need to resolve before the animation is computed.
      // However this means that there is no explicit CSS code to block the animation
      // from happening (by setting 0s none in the class name). If this is the case
      // we need to apply the classes before the first rAF so we know to continue if
      // there actually is a detected transition or keyframe animation
      if (options.applyClassesEarly && addRemoveClassName.length) {
        applyAnimationClasses(element, options);
        addRemoveClassName = '';
      }

      var preparationClasses = [structuralClassName, addRemoveClassName].join(' ').trim();
      var fullClassName = classes + ' ' + preparationClasses;
      var activeClasses = pendClasses(preparationClasses, ACTIVE_CLASS_SUFFIX);
      var hasToStyles = styles.to && Object.keys(styles.to).length > 0;
      var containsKeyframeAnimation = (options.keyframeStyle || '').length > 0;

      // there is no way we can trigger an animation if no styles and
      // no classes are being applied which would then trigger a transition,
      // unless there a is raw keyframe value that is applied to the element.
      if (!containsKeyframeAnimation
           && !hasToStyles
           && !preparationClasses) {
        return closeAndReturnNoopAnimator();
      }

      var cacheKey, stagger;
      if (options.stagger > 0) {
        var staggerVal = parseFloat(options.stagger);
        stagger = {
          transitionDelay: staggerVal,
          animationDelay: staggerVal,
          transitionDuration: 0,
          animationDuration: 0
        };
      } else {
        cacheKey = gcsHashFn(node, fullClassName);
        stagger = computeCachedCssStaggerStyles(node, preparationClasses, cacheKey, DETECT_STAGGER_CSS_PROPERTIES);
      }

      if (!options.$$skipPreparationClasses) {
        $$jqLite.addClass(element, preparationClasses);
      }

      var applyOnlyDuration;

      if (options.transitionStyle) {
        var transitionStyle = [TRANSITION_PROP, options.transitionStyle];
        applyInlineStyle(node, transitionStyle);
        temporaryStyles.push(transitionStyle);
      }

      if (options.duration >= 0) {
        applyOnlyDuration = node.style[TRANSITION_PROP].length > 0;
        var durationStyle = getCssTransitionDurationStyle(options.duration, applyOnlyDuration);

        // we set the duration so that it will be picked up by getComputedStyle later
        applyInlineStyle(node, durationStyle);
        temporaryStyles.push(durationStyle);
      }

      if (options.keyframeStyle) {
        var keyframeStyle = [ANIMATION_PROP, options.keyframeStyle];
        applyInlineStyle(node, keyframeStyle);
        temporaryStyles.push(keyframeStyle);
      }

      var itemIndex = stagger
          ? options.staggerIndex >= 0
              ? options.staggerIndex
              : gcsLookup.count(cacheKey)
          : 0;

      var isFirst = itemIndex === 0;

      // this is a pre-emptive way of forcing the setup classes to be added and applied INSTANTLY
      // without causing any combination of transitions to kick in. By adding a negative delay value
      // it forces the setup class' transition to end immediately. We later then remove the negative
      // transition delay to allow for the transition to naturally do it's thing. The beauty here is
      // that if there is no transition defined then nothing will happen and this will also allow
      // other transitions to be stacked on top of each other without any chopping them out.
      if (isFirst && !options.skipBlocking) {
        blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);
      }

      var timings = computeTimings(node, fullClassName, cacheKey);
      var relativeDelay = timings.maxDelay;
      maxDelay = Math.max(relativeDelay, 0);
      maxDuration = timings.maxDuration;

      var flags = {};
      flags.hasTransitions          = timings.transitionDuration > 0;
      flags.hasAnimations           = timings.animationDuration > 0;
      flags.hasTransitionAll        = flags.hasTransitions && timings.transitionProperty == 'all';
      flags.applyTransitionDuration = hasToStyles && (
                                        (flags.hasTransitions && !flags.hasTransitionAll)
                                         || (flags.hasAnimations && !flags.hasTransitions));
      flags.applyAnimationDuration  = options.duration && flags.hasAnimations;
      flags.applyTransitionDelay    = truthyTimingValue(options.delay) && (flags.applyTransitionDuration || flags.hasTransitions);
      flags.applyAnimationDelay     = truthyTimingValue(options.delay) && flags.hasAnimations;
      flags.recalculateTimingStyles = addRemoveClassName.length > 0;

      if (flags.applyTransitionDuration || flags.applyAnimationDuration) {
        maxDuration = options.duration ? parseFloat(options.duration) : maxDuration;

        if (flags.applyTransitionDuration) {
          flags.hasTransitions = true;
          timings.transitionDuration = maxDuration;
          applyOnlyDuration = node.style[TRANSITION_PROP + PROPERTY_KEY].length > 0;
          temporaryStyles.push(getCssTransitionDurationStyle(maxDuration, applyOnlyDuration));
        }

        if (flags.applyAnimationDuration) {
          flags.hasAnimations = true;
          timings.animationDuration = maxDuration;
          temporaryStyles.push(getCssKeyframeDurationStyle(maxDuration));
        }
      }

      if (maxDuration === 0 && !flags.recalculateTimingStyles) {
        return closeAndReturnNoopAnimator();
      }

      // we need to recalculate the delay value since we used a pre-emptive negative
      // delay value and the delay value is required for the final event checking. This
      // property will ensure that this will happen after the RAF phase has passed.
      if (options.duration == null && timings.transitionDuration > 0) {
        flags.recalculateTimingStyles = flags.recalculateTimingStyles || isFirst;
      }

      maxDelayTime = maxDelay * ONE_SECOND;
      maxDurationTime = maxDuration * ONE_SECOND;
      if (!options.skipBlocking) {
        flags.blockTransition = timings.transitionDuration > 0;
        flags.blockKeyframeAnimation = timings.animationDuration > 0 &&
                                       stagger.animationDelay > 0 &&
                                       stagger.animationDuration === 0;
      }

      applyAnimationFromStyles(element, options);

      if (flags.blockTransition || flags.blockKeyframeAnimation) {
        applyBlocking(maxDuration);
      } else if (!options.skipBlocking) {
        blockTransitions(node, false);
      }

      // TODO(matsko): for 1.5 change this code to have an animator object for better debugging
      return {
        $$willAnimate: true,
        end: endFn,
        start: function() {
          if (animationClosed) return;

          runnerHost = {
            end: endFn,
            cancel: cancelFn,
            resume: null, //this will be set during the start() phase
            pause: null
          };

          runner = new $$AnimateRunner(runnerHost);

          waitUntilQuiet(start);

          // we don't have access to pause/resume the animation
          // since it hasn't run yet. AnimateRunner will therefore
          // set noop functions for resume and pause and they will
          // later be overridden once the animation is triggered
          return runner;
        }
      };

      function endFn() {
        close();
      }

      function cancelFn() {
        close(true);
      }

      function close(rejected) { // jshint ignore:line
        // if the promise has been called already then we shouldn't close
        // the animation again
        if (animationClosed || (animationCompleted && animationPaused)) return;
        animationClosed = true;
        animationPaused = false;

        if (!options.$$skipPreparationClasses) {
          $$jqLite.removeClass(element, preparationClasses);
        }
        $$jqLite.removeClass(element, activeClasses);

        blockKeyframeAnimations(node, false);
        blockTransitions(node, false);

        forEach(temporaryStyles, function(entry) {
          // There is only one way to remove inline style properties entirely from elements.
          // By using `removeProperty` this works, but we need to convert camel-cased CSS
          // styles down to hyphenated values.
          node.style[entry[0]] = '';
        });

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);

        // the reason why we have this option is to allow a synchronous closing callback
        // that is fired as SOON as the animation ends (when the CSS is removed) or if
        // the animation never takes off at all. A good example is a leave animation since
        // the element must be removed just after the animation is over or else the element
        // will appear on screen for one animation frame causing an overbearing flicker.
        if (options.onDone) {
          options.onDone();
        }

        // if the preparation function fails then the promise is not setup
        if (runner) {
          runner.complete(!rejected);
        }
      }

      function applyBlocking(duration) {
        if (flags.blockTransition) {
          blockTransitions(node, duration);
        }

        if (flags.blockKeyframeAnimation) {
          blockKeyframeAnimations(node, !!duration);
        }
      }

      function closeAndReturnNoopAnimator() {
        runner = new $$AnimateRunner({
          end: endFn,
          cancel: cancelFn
        });

        close();

        return {
          $$willAnimate: false,
          start: function() {
            return runner;
          },
          end: endFn
        };
      }

      function start() {
        if (animationClosed) return;
        if (!node.parentNode) {
          close();
          return;
        }

        var startTime, events = [];

        // even though we only pause keyframe animations here the pause flag
        // will still happen when transitions are used. Only the transition will
        // not be paused since that is not possible. If the animation ends when
        // paused then it will not complete until unpaused or cancelled.
        var playPause = function(playAnimation) {
          if (!animationCompleted) {
            animationPaused = !playAnimation;
            if (timings.animationDuration) {
              var value = blockKeyframeAnimations(node, animationPaused);
              animationPaused
                  ? temporaryStyles.push(value)
                  : removeFromArray(temporaryStyles, value);
            }
          } else if (animationPaused && playAnimation) {
            animationPaused = false;
            close();
          }
        };

        // checking the stagger duration prevents an accidently cascade of the CSS delay style
        // being inherited from the parent. If the transition duration is zero then we can safely
        // rely that the delay value is an intential stagger delay style.
        var maxStagger = itemIndex > 0
                         && ((timings.transitionDuration && stagger.transitionDuration === 0) ||
                            (timings.animationDuration && stagger.animationDuration === 0))
                         && Math.max(stagger.animationDelay, stagger.transitionDelay);
        if (maxStagger) {
          $timeout(triggerAnimationStart,
                   Math.floor(maxStagger * itemIndex * ONE_SECOND),
                   false);
        } else {
          triggerAnimationStart();
        }

        // this will decorate the existing promise runner with pause/resume methods
        runnerHost.resume = function() {
          playPause(true);
        };

        runnerHost.pause = function() {
          playPause(false);
        };

        function triggerAnimationStart() {
          // just incase a stagger animation kicks in when the animation
          // itself was cancelled entirely
          if (animationClosed) return;

          applyBlocking(false);

          forEach(temporaryStyles, function(entry) {
            var key = entry[0];
            var value = entry[1];
            node.style[key] = value;
          });

          applyAnimationClasses(element, options);
          $$jqLite.addClass(element, activeClasses);

          if (flags.recalculateTimingStyles) {
            fullClassName = node.className + ' ' + preparationClasses;
            cacheKey = gcsHashFn(node, fullClassName);

            timings = computeTimings(node, fullClassName, cacheKey);
            relativeDelay = timings.maxDelay;
            maxDelay = Math.max(relativeDelay, 0);
            maxDuration = timings.maxDuration;

            if (maxDuration === 0) {
              close();
              return;
            }

            flags.hasTransitions = timings.transitionDuration > 0;
            flags.hasAnimations = timings.animationDuration > 0;
          }

          if (flags.applyTransitionDelay || flags.applyAnimationDelay) {
            relativeDelay = typeof options.delay !== "boolean" && truthyTimingValue(options.delay)
                  ? parseFloat(options.delay)
                  : relativeDelay;

            maxDelay = Math.max(relativeDelay, 0);

            var delayStyle;
            if (flags.applyTransitionDelay) {
              timings.transitionDelay = relativeDelay;
              delayStyle = getCssDelayStyle(relativeDelay);
              temporaryStyles.push(delayStyle);
              node.style[delayStyle[0]] = delayStyle[1];
            }

            if (flags.applyAnimationDelay) {
              timings.animationDelay = relativeDelay;
              delayStyle = getCssDelayStyle(relativeDelay, true);
              temporaryStyles.push(delayStyle);
              node.style[delayStyle[0]] = delayStyle[1];
            }
          }

          maxDelayTime = maxDelay * ONE_SECOND;
          maxDurationTime = maxDuration * ONE_SECOND;

          if (options.easing) {
            var easeProp, easeVal = options.easing;
            if (flags.hasTransitions) {
              easeProp = TRANSITION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
            if (flags.hasAnimations) {
              easeProp = ANIMATION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
          }

          if (timings.transitionDuration) {
            events.push(TRANSITIONEND_EVENT);
          }

          if (timings.animationDuration) {
            events.push(ANIMATIONEND_EVENT);
          }

          startTime = Date.now();
          element.on(events.join(' '), onAnimationProgress);
          $timeout(onAnimationExpired, maxDelayTime + CLOSING_TIME_BUFFER * maxDurationTime, false);

          applyAnimationToStyles(element, options);
        }

        function onAnimationExpired() {
          // although an expired animation is a failed animation, getting to
          // this outcome is very easy if the CSS code screws up. Therefore we
          // should still continue normally as if the animation completed correctly.
          close();
        }

        function onAnimationProgress(event) {
          event.stopPropagation();
          var ev = event.originalEvent || event;
          var timeStamp = ev.$manualTimeStamp || ev.timeStamp || Date.now();

          /* Firefox (or possibly just Gecko) likes to not round values up
           * when a ms measurement is used for the animation */
          var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));

          /* $manualTimeStamp is a mocked timeStamp value which is set
           * within browserTrigger(). This is only here so that tests can
           * mock animations properly. Real events fallback to event.timeStamp,
           * or, if they don't, then a timeStamp is automatically created for them.
           * We're checking to see if the timeStamp surpasses the expected delay,
           * but we're using elapsedTime instead of the timeStamp on the 2nd
           * pre-condition since animations sometimes close off early */
          if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
            // we set this flag to ensure that if the transition is paused then, when resumed,
            // the animation will automatically close itself since transitions cannot be paused.
            animationCompleted = true;
            close();
          }
        }
      }
    }
  }];
}];

var $$AnimateCssDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateCssDriver');

  var NG_ANIMATE_SHIM_CLASS_NAME = 'ng-animate-shim';
  var NG_ANIMATE_ANCHOR_CLASS_NAME = 'ng-anchor';

  var NG_OUT_ANCHOR_CLASS_NAME = 'ng-anchor-out';
  var NG_IN_ANCHOR_CLASS_NAME = 'ng-anchor-in';

  this.$get = ['$animateCss', '$rootScope', '$$AnimateRunner', '$rootElement', '$$body', '$sniffer', '$$jqLite',
       function($animateCss,   $rootScope,   $$AnimateRunner,   $rootElement,   $$body,   $sniffer,   $$jqLite) {

    // only browsers that support these properties can render animations
    if (!$sniffer.animations && !$sniffer.transitions) return noop;

    var bodyNode = getDomNode($$body);
    var rootNode = getDomNode($rootElement);

    var rootBodyElement = jqLite(bodyNode.parentNode === rootNode ? bodyNode : rootNode);

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    return function initDriverFn(animationDetails, onBeforeClassesAppliedCb) {
      return animationDetails.from && animationDetails.to
          ? prepareFromToAnchorAnimation(animationDetails.from,
                                         animationDetails.to,
                                         animationDetails.classes,
                                         animationDetails.anchors)
          : prepareRegularAnimation(animationDetails, onBeforeClassesAppliedCb);
    };

    function filterCssClasses(classes) {
      //remove all the `ng-` stuff
      return classes.replace(/\bng-\S+\b/g, '');
    }

    function getUniqueValues(a, b) {
      if (isString(a)) a = a.split(' ');
      if (isString(b)) b = b.split(' ');
      return a.filter(function(val) {
        return b.indexOf(val) === -1;
      }).join(' ');
    }

    function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
      var clone = jqLite(getDomNode(outAnchor).cloneNode(true));
      var startingClasses = filterCssClasses(getClassVal(clone));

      outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
      inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);

      clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);

      rootBodyElement.append(clone);

      var animatorIn, animatorOut = prepareOutAnimation();

      // the user may not end up using the `out` animation and
      // only making use of the `in` animation or vice-versa.
      // In either case we should allow this and not assume the
      // animation is over unless both animations are not used.
      if (!animatorOut) {
        animatorIn = prepareInAnimation();
        if (!animatorIn) {
          return end();
        }
      }

      var startingAnimator = animatorOut || animatorIn;

      return {
        start: function() {
          var runner;

          var currentAnimation = startingAnimator.start();
          currentAnimation.done(function() {
            currentAnimation = null;
            if (!animatorIn) {
              animatorIn = prepareInAnimation();
              if (animatorIn) {
                currentAnimation = animatorIn.start();
                currentAnimation.done(function() {
                  currentAnimation = null;
                  end();
                  runner.complete();
                });
                return currentAnimation;
              }
            }
            // in the event that there is no `in` animation
            end();
            runner.complete();
          });

          runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn
          });

          return runner;

          function endFn() {
            if (currentAnimation) {
              currentAnimation.end();
            }
          }
        }
      };

      function calculateAnchorStyles(anchor) {
        var styles = {};

        var coords = getDomNode(anchor).getBoundingClientRect();

        // we iterate directly since safari messes up and doesn't return
        // all the keys for the coods object when iterated
        forEach(['width','height','top','left'], function(key) {
          var value = coords[key];
          switch (key) {
            case 'top':
              value += bodyNode.scrollTop;
              break;
            case 'left':
              value += bodyNode.scrollLeft;
              break;
          }
          styles[key] = Math.floor(value) + 'px';
        });
        return styles;
      }

      function prepareOutAnimation() {
        var animator = $animateCss(clone, {
          addClass: NG_OUT_ANCHOR_CLASS_NAME,
          delay: true,
          from: calculateAnchorStyles(outAnchor)
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function getClassVal(element) {
        return element.attr('class') || '';
      }

      function prepareInAnimation() {
        var endingClasses = filterCssClasses(getClassVal(inAnchor));
        var toAdd = getUniqueValues(endingClasses, startingClasses);
        var toRemove = getUniqueValues(startingClasses, endingClasses);

        var animator = $animateCss(clone, {
          to: calculateAnchorStyles(inAnchor),
          addClass: NG_IN_ANCHOR_CLASS_NAME + ' ' + toAdd,
          removeClass: NG_OUT_ANCHOR_CLASS_NAME + ' ' + toRemove,
          delay: true
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function end() {
        clone.remove();
        outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
        inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
      }
    }

    function prepareFromToAnchorAnimation(from, to, classes, anchors) {
      var fromAnimation = prepareRegularAnimation(from, noop);
      var toAnimation = prepareRegularAnimation(to, noop);

      var anchorAnimations = [];
      forEach(anchors, function(anchor) {
        var outElement = anchor['out'];
        var inElement = anchor['in'];
        var animator = prepareAnchoredAnimation(classes, outElement, inElement);
        if (animator) {
          anchorAnimations.push(animator);
        }
      });

      // no point in doing anything when there are no elements to animate
      if (!fromAnimation && !toAnimation && anchorAnimations.length === 0) return;

      return {
        start: function() {
          var animationRunners = [];

          if (fromAnimation) {
            animationRunners.push(fromAnimation.start());
          }

          if (toAnimation) {
            animationRunners.push(toAnimation.start());
          }

          forEach(anchorAnimations, function(animation) {
            animationRunners.push(animation.start());
          });

          var runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn // CSS-driven animations cannot be cancelled, only ended
          });

          $$AnimateRunner.all(animationRunners, function(status) {
            runner.complete(status);
          });

          return runner;

          function endFn() {
            forEach(animationRunners, function(runner) {
              runner.end();
            });
          }
        }
      };
    }

    function prepareRegularAnimation(animationDetails, onBeforeClassesAppliedCb) {
      var element = animationDetails.element;
      var options = animationDetails.options || {};

      // since the ng-EVENT, class-ADD and class-REMOVE classes are applied inside
      // of the animateQueue pre and postDigest stages then there is no need to add
      // then them here as well.
      options.$$skipPreparationClasses = true;

      // during the pre/post digest stages inside of animateQueue we also performed
      // the blocking (transition:-9999s) so there is no point in doing that again.
      options.skipBlocking = true;

      if (animationDetails.structural) {
        options.event = animationDetails.event;

        // we special case the leave animation since we want to ensure that
        // the element is removed as soon as the animation is over. Otherwise
        // a flicker might appear or the element may not be removed at all
        if (animationDetails.event === 'leave') {
          options.onDone = options.domOperation;
        }
      }

      // we apply the classes right away since the pre-digest took care of the
      // preparation classes.
      onBeforeClassesAppliedCb(element);
      applyAnimationClasses(element, options);

      // We assign the preparationClasses as the actual animation event since
      // the internals of $animateCss will just suffix the event token values
      // with `-active` to trigger the animation.
      if (options.preparationClasses) {
        options.event = concatWithSpace(options.event, options.preparationClasses);
      }

      var animator = $animateCss(element, options);

      // the driver lookup code inside of $$animation attempts to spawn a
      // driver one by one until a driver returns a.$$willAnimate animator object.
      // $animateCss will always return an object, however, it will pass in
      // a flag as a hint as to whether an animation was detected or not
      return animator.$$willAnimate ? animator : null;
    }
  }];
}];

// TODO(matsko): use caching here to speed things up for detection
// TODO(matsko): add documentation
//  by the time...

var $$AnimateJsProvider = ['$animateProvider', function($animateProvider) {
  this.$get = ['$injector', '$$AnimateRunner', '$$rAFMutex', '$$jqLite',
       function($injector,   $$AnimateRunner,   $$rAFMutex,   $$jqLite) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
         // $animateJs(element, 'enter');
    return function(element, event, classes, options) {
      // the `classes` argument is optional and if it is not used
      // then the classes will be resolved from the element's className
      // property as well as options.addClass/options.removeClass.
      if (arguments.length === 3 && isObject(classes)) {
        options = classes;
        classes = null;
      }

      options = prepareAnimationOptions(options);
      if (!classes) {
        classes = element.attr('class') || '';
        if (options.addClass) {
          classes += ' ' + options.addClass;
        }
        if (options.removeClass) {
          classes += ' ' + options.removeClass;
        }
      }

      var classesToAdd = options.addClass;
      var classesToRemove = options.removeClass;

      // the lookupAnimations function returns a series of animation objects that are
      // matched up with one or more of the CSS classes. These animation objects are
      // defined via the module.animation factory function. If nothing is detected then
      // we don't return anything which then makes $animation query the next driver.
      var animations = lookupAnimations(classes);
      var before, after;
      if (animations.length) {
        var afterFn, beforeFn;
        if (event == 'leave') {
          beforeFn = 'leave';
          afterFn = 'afterLeave'; // TODO(matsko): get rid of this
        } else {
          beforeFn = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
          afterFn = event;
        }

        if (event !== 'enter' && event !== 'move') {
          before = packageAnimations(element, event, options, animations, beforeFn);
        }
        after  = packageAnimations(element, event, options, animations, afterFn);
      }

      // no matching animations
      if (!before && !after) return;

      function applyOptions() {
        options.domOperation();
        applyAnimationClasses(element, options);
      }

      return {
        start: function() {
          var closeActiveAnimations;
          var chain = [];

          if (before) {
            chain.push(function(fn) {
              closeActiveAnimations = before(fn);
            });
          }

          if (chain.length) {
            chain.push(function(fn) {
              applyOptions();
              fn(true);
            });
          } else {
            applyOptions();
          }

          if (after) {
            chain.push(function(fn) {
              closeActiveAnimations = after(fn);
            });
          }

          var animationClosed = false;
          var runner = new $$AnimateRunner({
            end: function() {
              endAnimations();
            },
            cancel: function() {
              endAnimations(true);
            }
          });

          $$AnimateRunner.chain(chain, onComplete);
          return runner;

          function onComplete(success) {
            animationClosed = true;
            applyOptions();
            applyAnimationStyles(element, options);
            runner.complete(success);
          }

          function endAnimations(cancelled) {
            if (!animationClosed) {
              (closeActiveAnimations || noop)(cancelled);
              onComplete(cancelled);
            }
          }
        }
      };

      function executeAnimationFn(fn, element, event, options, onDone) {
        var args;
        switch (event) {
          case 'animate':
            args = [element, options.from, options.to, onDone];
            break;

          case 'setClass':
            args = [element, classesToAdd, classesToRemove, onDone];
            break;

          case 'addClass':
            args = [element, classesToAdd, onDone];
            break;

          case 'removeClass':
            args = [element, classesToRemove, onDone];
            break;

          default:
            args = [element, onDone];
            break;
        }

        args.push(options);

        var value = fn.apply(fn, args);
        if (value) {
          if (isFunction(value.start)) {
            value = value.start();
          }

          if (value instanceof $$AnimateRunner) {
            value.done(onDone);
          } else if (isFunction(value)) {
            // optional onEnd / onCancel callback
            return value;
          }
        }

        return noop;
      }

      function groupEventedAnimations(element, event, options, animations, fnName) {
        var operations = [];
        forEach(animations, function(ani) {
          var animation = ani[fnName];
          if (!animation) return;

          // note that all of these animations will run in parallel
          operations.push(function() {
            var runner;
            var endProgressCb;

            var resolved = false;
            var onAnimationComplete = function(rejected) {
              if (!resolved) {
                resolved = true;
                (endProgressCb || noop)(rejected);
                runner.complete(!rejected);
              }
            };

            runner = new $$AnimateRunner({
              end: function() {
                onAnimationComplete();
              },
              cancel: function() {
                onAnimationComplete(true);
              }
            });

            endProgressCb = executeAnimationFn(animation, element, event, options, function(result) {
              var cancelled = result === false;
              onAnimationComplete(cancelled);
            });

            return runner;
          });
        });

        return operations;
      }

      function packageAnimations(element, event, options, animations, fnName) {
        var operations = groupEventedAnimations(element, event, options, animations, fnName);
        if (operations.length === 0) {
          var a,b;
          if (fnName === 'beforeSetClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'beforeRemoveClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'beforeAddClass');
          } else if (fnName === 'setClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'removeClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'addClass');
          }

          if (a) {
            operations = operations.concat(a);
          }
          if (b) {
            operations = operations.concat(b);
          }
        }

        if (operations.length === 0) return;

        // TODO(matsko): add documentation
        return function startAnimation(callback) {
          var runners = [];
          if (operations.length) {
            forEach(operations, function(animateFn) {
              runners.push(animateFn());
            });
          }

          runners.length ? $$AnimateRunner.all(runners, callback) : callback();

          return function endFn(reject) {
            forEach(runners, function(runner) {
              reject ? runner.cancel() : runner.end();
            });
          };
        };
      }
    };

    function lookupAnimations(classes) {
      classes = isArray(classes) ? classes : classes.split(' ');
      var matches = [], flagMap = {};
      for (var i=0; i < classes.length; i++) {
        var klass = classes[i],
            animationFactory = $animateProvider.$$registeredAnimations[klass];
        if (animationFactory && !flagMap[klass]) {
          matches.push($injector.get(animationFactory));
          flagMap[klass] = true;
        }
      }
      return matches;
    }
  }];
}];

var $$AnimateJsDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateJsDriver');
  this.$get = ['$$animateJs', '$$AnimateRunner', function($$animateJs, $$AnimateRunner) {
    return function initDriverFn(animationDetails) {
      if (animationDetails.from && animationDetails.to) {
        var fromAnimation = prepareAnimation(animationDetails.from);
        var toAnimation = prepareAnimation(animationDetails.to);
        if (!fromAnimation && !toAnimation) return;

        return {
          start: function() {
            var animationRunners = [];

            if (fromAnimation) {
              animationRunners.push(fromAnimation.start());
            }

            if (toAnimation) {
              animationRunners.push(toAnimation.start());
            }

            $$AnimateRunner.all(animationRunners, done);

            var runner = new $$AnimateRunner({
              end: endFnFactory(),
              cancel: endFnFactory()
            });

            return runner;

            function endFnFactory() {
              return function() {
                forEach(animationRunners, function(runner) {
                  // at this point we cannot cancel animations for groups just yet. 1.5+
                  runner.end();
                });
              };
            }

            function done(status) {
              runner.complete(status);
            }
          }
        };
      } else {
        return prepareAnimation(animationDetails);
      }
    };

    function prepareAnimation(animationDetails) {
      // TODO(matsko): make sure to check for grouped animations and delegate down to normal animations
      var element = animationDetails.element;
      var event = animationDetails.event;
      var options = animationDetails.options;
      var classes = animationDetails.classes;
      return $$animateJs(element, event, classes, options);
    }
  }];
}];

var NG_ANIMATE_ATTR_NAME = 'data-ng-animate';
var NG_ANIMATE_PIN_DATA = '$ngAnimatePin';
var $$AnimateQueueProvider = ['$animateProvider', function($animateProvider) {
  var PRE_DIGEST_STATE = 1;
  var RUNNING_STATE = 2;

  var rules = this.rules = {
    skip: [],
    cancel: [],
    join: []
  };

  function isAllowed(ruleType, element, currentAnimation, previousAnimation) {
    return rules[ruleType].some(function(fn) {
      return fn(element, currentAnimation, previousAnimation);
    });
  }

  function hasAnimationClasses(options, and) {
    options = options || {};
    var a = (options.addClass || '').length > 0;
    var b = (options.removeClass || '').length > 0;
    return and ? a && b : a || b;
  }

  rules.join.push(function(element, newAnimation, currentAnimation) {
    // if the new animation is class-based then we can just tack that on
    return !newAnimation.structural && hasAnimationClasses(newAnimation.options);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // there is no need to animate anything if no classes are being added and
    // there is no structural animation that will be triggered
    return !newAnimation.structural && !hasAnimationClasses(newAnimation.options);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // why should we trigger a new structural animation if the element will
    // be removed from the DOM anyway?
    return currentAnimation.event == 'leave' && newAnimation.structural;
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // if there is an ongoing current animation then don't even bother running the class-based animation
    return currentAnimation.structural && currentAnimation.state === RUNNING_STATE && !newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // there can never be two structural animations running at the same time
    return currentAnimation.structural && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // if the previous animation is already running, but the new animation will
    // be triggered, but the new animation is structural
    return currentAnimation.state === RUNNING_STATE && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    var nO = newAnimation.options;
    var cO = currentAnimation.options;

    // if the exact same CSS class is added/removed then it's safe to cancel it
    return (nO.addClass && nO.addClass === cO.removeClass) || (nO.removeClass && nO.removeClass === cO.addClass);
  });

  this.$get = ['$$rAF', '$rootScope', '$rootElement', '$document', '$$body', '$$HashMap',
               '$$animation', '$$AnimateRunner', '$templateRequest', '$$jqLite', '$$forceReflow',
       function($$rAF,   $rootScope,   $rootElement,   $document,   $$body,   $$HashMap,
                $$animation,   $$AnimateRunner,   $templateRequest,   $$jqLite,   $$forceReflow) {

    var activeAnimationsLookup = new $$HashMap();
    var disabledElementsLookup = new $$HashMap();
    var animationsEnabled = null;

    // Wait until all directive and route-related templates are downloaded and
    // compiled. The $templateRequest.totalPendingRequests variable keeps track of
    // all of the remote templates being currently downloaded. If there are no
    // templates currently downloading then the watcher will still fire anyway.
    var deregisterWatch = $rootScope.$watch(
      function() { return $templateRequest.totalPendingRequests === 0; },
      function(isEmpty) {
        if (!isEmpty) return;
        deregisterWatch();

        // Now that all templates have been downloaded, $animate will wait until
        // the post digest queue is empty before enabling animations. By having two
        // calls to $postDigest calls we can ensure that the flag is enabled at the
        // very end of the post digest queue. Since all of the animations in $animate
        // use $postDigest, it's important that the code below executes at the end.
        // This basically means that the page is fully downloaded and compiled before
        // any animations are triggered.
        $rootScope.$$postDigest(function() {
          $rootScope.$$postDigest(function() {
            // we check for null directly in the event that the application already called
            // .enabled() with whatever arguments that it provided it with
            if (animationsEnabled === null) {
              animationsEnabled = true;
            }
          });
        });
      }
    );

    var callbackRegistry = {};

    // remember that the classNameFilter is set during the provider/config
    // stage therefore we can optimize here and setup a helper function
    var classNameFilter = $animateProvider.classNameFilter();
    var isAnimatableClassName = !classNameFilter
              ? function() { return true; }
              : function(className) {
                return classNameFilter.test(className);
              };

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function normalizeAnimationOptions(element, options) {
      return mergeAnimationOptions(element, options, {});
    }

    function findCallbacks(element, event) {
      var targetNode = getDomNode(element);

      var matches = [];
      var entries = callbackRegistry[event];
      if (entries) {
        forEach(entries, function(entry) {
          if (entry.node.contains(targetNode)) {
            matches.push(entry.callback);
          }
        });
      }

      return matches;
    }

    function triggerCallback(event, element, phase, data) {
      $$rAF(function() {
        forEach(findCallbacks(element, event), function(callback) {
          callback(element, phase, data);
        });
      });
    }

    return {
      on: function(event, container, callback) {
        var node = extractElementNode(container);
        callbackRegistry[event] = callbackRegistry[event] || [];
        callbackRegistry[event].push({
          node: node,
          callback: callback
        });
      },

      off: function(event, container, callback) {
        var entries = callbackRegistry[event];
        if (!entries) return;

        callbackRegistry[event] = arguments.length === 1
            ? null
            : filterFromRegistry(entries, container, callback);

        function filterFromRegistry(list, matchContainer, matchCallback) {
          var containerNode = extractElementNode(matchContainer);
          return list.filter(function(entry) {
            var isMatch = entry.node === containerNode &&
                            (!matchCallback || entry.callback === matchCallback);
            return !isMatch;
          });
        }
      },

      pin: function(element, parentElement) {
        assertArg(isElement(element), 'element', 'not an element');
        assertArg(isElement(parentElement), 'parentElement', 'not an element');
        element.data(NG_ANIMATE_PIN_DATA, parentElement);
      },

      push: function(element, event, options, domOperation) {
        options = options || {};
        options.domOperation = domOperation;
        return queueAnimation(element, event, options);
      },

      // this method has four signatures:
      //  () - global getter
      //  (bool) - global setter
      //  (element) - element getter
      //  (element, bool) - element setter<F37>
      enabled: function(element, bool) {
        var argCount = arguments.length;

        if (argCount === 0) {
          // () - Global getter
          bool = !!animationsEnabled;
        } else {
          var hasElement = isElement(element);

          if (!hasElement) {
            // (bool) - Global setter
            bool = animationsEnabled = !!element;
          } else {
            var node = getDomNode(element);
            var recordExists = disabledElementsLookup.get(node);

            if (argCount === 1) {
              // (element) - Element getter
              bool = !recordExists;
            } else {
              // (element, bool) - Element setter
              bool = !!bool;
              if (!bool) {
                disabledElementsLookup.put(node, true);
              } else if (recordExists) {
                disabledElementsLookup.remove(node);
              }
            }
          }
        }

        return bool;
      }
    };

    function queueAnimation(element, event, options) {
      var node, parent;
      element = stripCommentsFromElement(element);
      if (element) {
        node = getDomNode(element);
        parent = element.parent();
      }

      options = prepareAnimationOptions(options);

      // we create a fake runner with a working promise.
      // These methods will become available after the digest has passed
      var runner = new $$AnimateRunner();

      if (isArray(options.addClass)) {
        options.addClass = options.addClass.join(' ');
      }

      if (options.addClass && !isString(options.addClass)) {
        options.addClass = null;
      }

      if (isArray(options.removeClass)) {
        options.removeClass = options.removeClass.join(' ');
      }

      if (options.removeClass && !isString(options.removeClass)) {
        options.removeClass = null;
      }

      if (options.from && !isObject(options.from)) {
        options.from = null;
      }

      if (options.to && !isObject(options.to)) {
        options.to = null;
      }

      // there are situations where a directive issues an animation for
      // a jqLite wrapper that contains only comment nodes... If this
      // happens then there is no way we can perform an animation
      if (!node) {
        close();
        return runner;
      }

      var className = [node.className, options.addClass, options.removeClass].join(' ');
      if (!isAnimatableClassName(className)) {
        close();
        return runner;
      }

      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // this is a hard disable of all animations for the application or on
      // the element itself, therefore  there is no need to continue further
      // past this point if not enabled
      var skipAnimations = !animationsEnabled || disabledElementsLookup.get(node);
      var existingAnimation = (!skipAnimations && activeAnimationsLookup.get(node)) || {};
      var hasExistingAnimation = !!existingAnimation.state;

      // there is no point in traversing the same collection of parent ancestors if a followup
      // animation will be run on the same element that already did all that checking work
      if (!skipAnimations && (!hasExistingAnimation || existingAnimation.state != PRE_DIGEST_STATE)) {
        skipAnimations = !areAnimationsAllowed(element, parent, event);
      }

      if (skipAnimations) {
        close();
        return runner;
      }

      if (isStructural) {
        closeChildAnimations(element);
      }

      var newAnimation = {
        structural: isStructural,
        element: element,
        event: event,
        close: close,
        options: options,
        runner: runner
      };

      if (hasExistingAnimation) {
        var skipAnimationFlag = isAllowed('skip', element, newAnimation, existingAnimation);
        if (skipAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            close();
            return runner;
          } else {
            mergeAnimationOptions(element, existingAnimation.options, options);
            return existingAnimation.runner;
          }
        }

        var cancelAnimationFlag = isAllowed('cancel', element, newAnimation, existingAnimation);
        if (cancelAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            // this will end the animation right away and it is safe
            // to do so since the animation is already running and the
            // runner callback code will run in async
            existingAnimation.runner.end();
          } else if (existingAnimation.structural) {
            // this means that the animation is queued into a digest, but
            // hasn't started yet. Therefore it is safe to run the close
            // method which will call the runner methods in async.
            existingAnimation.close();
          } else {
            // this will merge the new animation options into existing animation options
            mergeAnimationOptions(element, existingAnimation.options, newAnimation.options);
            return existingAnimation.runner;
          }
        } else {
          // a joined animation means that this animation will take over the existing one
          // so an example would involve a leave animation taking over an enter. Then when
          // the postDigest kicks in the enter will be ignored.
          var joinAnimationFlag = isAllowed('join', element, newAnimation, existingAnimation);
          if (joinAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              normalizeAnimationOptions(element, options);
            } else {
              applyGeneratedPreparationClasses(element, isStructural ? event : null, options);

              event = newAnimation.event = existingAnimation.event;
              options = mergeAnimationOptions(element, existingAnimation.options, newAnimation.options);

              //we return the same runner since only the option values of this animation will
              //be fed into the `existingAnimation`.
              return existingAnimation.runner;
            }
          }
        }
      } else {
        // normalization in this case means that it removes redundant CSS classes that
        // already exist (addClass) or do not exist (removeClass) on the element
        normalizeAnimationOptions(element, options);
      }

      // when the options are merged and cleaned up we may end up not having to do
      // an animation at all, therefore we should check this before issuing a post
      // digest callback. Structural animations will always run no matter what.
      var isValidAnimation = newAnimation.structural;
      if (!isValidAnimation) {
        // animate (from/to) can be quickly checked first, otherwise we check if any classes are present
        isValidAnimation = (newAnimation.event === 'animate' && Object.keys(newAnimation.options.to || {}).length > 0)
                            || hasAnimationClasses(newAnimation.options);
      }

      if (!isValidAnimation) {
        close();
        clearElementAnimationState(element);
        return runner;
      }

      applyGeneratedPreparationClasses(element, isStructural ? event : null, options);
      blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);

      // the counter keeps track of cancelled animations
      var counter = (existingAnimation.counter || 0) + 1;
      newAnimation.counter = counter;

      markElementAnimationState(element, PRE_DIGEST_STATE, newAnimation);

      $rootScope.$$postDigest(function() {
        var animationDetails = activeAnimationsLookup.get(node);
        var animationCancelled = !animationDetails;
        animationDetails = animationDetails || {};

        // if addClass/removeClass is called before something like enter then the
        // registered parent element may not be present. The code below will ensure
        // that a final value for parent element is obtained
        var parentElement = element.parent() || [];

        // animate/structural/class-based animations all have requirements. Otherwise there
        // is no point in performing an animation. The parent node must also be set.
        var isValidAnimation = parentElement.length > 0
                                && (animationDetails.event === 'animate'
                                    || animationDetails.structural
                                    || hasAnimationClasses(animationDetails.options));

        // this means that the previous animation was cancelled
        // even if the follow-up animation is the same event
        if (animationCancelled || animationDetails.counter !== counter || !isValidAnimation) {
          // if another animation did not take over then we need
          // to make sure that the domOperation and options are
          // handled accordingly
          if (animationCancelled) {
            applyAnimationClasses(element, options);
            applyAnimationStyles(element, options);
          }

          // if the event changed from something like enter to leave then we do
          // it, otherwise if it's the same then the end result will be the same too
          if (animationCancelled || (isStructural && animationDetails.event !== event)) {
            options.domOperation();
            runner.end();
          }

          // in the event that the element animation was not cancelled or a follow-up animation
          // isn't allowed to animate from here then we need to clear the state of the element
          // so that any future animations won't read the expired animation data.
          if (!isValidAnimation) {
            clearElementAnimationState(element);
          }

          return;
        }

        // this combined multiple class to addClass / removeClass into a setClass event
        // so long as a structural event did not take over the animation
        event = !animationDetails.structural && hasAnimationClasses(animationDetails.options, true)
            ? 'setClass'
            : animationDetails.event;

        markElementAnimationState(element, RUNNING_STATE);
        var realRunner = $$animation(element, event, animationDetails.options, function(e) {
          $$forceReflow();
          blockTransitions(getDomNode(e), false);
        });

        realRunner.done(function(status) {
          close(!status);
          var animationDetails = activeAnimationsLookup.get(node);
          if (animationDetails && animationDetails.counter === counter) {
            clearElementAnimationState(getDomNode(element));
          }
          notifyProgress(runner, event, 'close', {});
        });

        // this will update the runner's flow-control events based on
        // the `realRunner` object.
        runner.setHost(realRunner);
        notifyProgress(runner, event, 'start', {});
      });

      return runner;

      function notifyProgress(runner, event, phase, data) {
        triggerCallback(event, element, phase, data);
        runner.progress(event, phase, data);
      }

      function close(reject) { // jshint ignore:line
        clearGeneratedClasses(element, options);
        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();
        runner.complete(!reject);
      }
    }

    function closeChildAnimations(element) {
      var node = getDomNode(element);
      var children = node.querySelectorAll('[' + NG_ANIMATE_ATTR_NAME + ']');
      forEach(children, function(child) {
        var state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME));
        var animationDetails = activeAnimationsLookup.get(child);
        switch (state) {
          case RUNNING_STATE:
            animationDetails.runner.end();
            /* falls through */
          case PRE_DIGEST_STATE:
            if (animationDetails) {
              activeAnimationsLookup.remove(child);
            }
            break;
        }
      });
    }

    function clearElementAnimationState(element) {
      var node = getDomNode(element);
      node.removeAttribute(NG_ANIMATE_ATTR_NAME);
      activeAnimationsLookup.remove(node);
    }

    function isMatchingElement(nodeOrElmA, nodeOrElmB) {
      return getDomNode(nodeOrElmA) === getDomNode(nodeOrElmB);
    }

    function areAnimationsAllowed(element, parentElement, event) {
      var bodyElementDetected = isMatchingElement(element, $$body) || element[0].nodeName === 'HTML';
      var rootElementDetected = isMatchingElement(element, $rootElement);
      var parentAnimationDetected = false;
      var animateChildren;

      var parentHost = element.data(NG_ANIMATE_PIN_DATA);
      if (parentHost) {
        parentElement = parentHost;
      }

      while (parentElement && parentElement.length) {
        if (!rootElementDetected) {
          // angular doesn't want to attempt to animate elements outside of the application
          // therefore we need to ensure that the rootElement is an ancestor of the current element
          rootElementDetected = isMatchingElement(parentElement, $rootElement);
        }

        var parentNode = parentElement[0];
        if (parentNode.nodeType !== ELEMENT_NODE) {
          // no point in inspecting the #document element
          break;
        }

        var details = activeAnimationsLookup.get(parentNode) || {};
        // either an enter, leave or move animation will commence
        // therefore we can't allow any animations to take place
        // but if a parent animation is class-based then that's ok
        if (!parentAnimationDetected) {
          parentAnimationDetected = details.structural || disabledElementsLookup.get(parentNode);
        }

        if (isUndefined(animateChildren) || animateChildren === true) {
          var value = parentElement.data(NG_ANIMATE_CHILDREN_DATA);
          if (isDefined(value)) {
            animateChildren = value;
          }
        }

        // there is no need to continue traversing at this point
        if (parentAnimationDetected && animateChildren === false) break;

        if (!rootElementDetected) {
          // angular doesn't want to attempt to animate elements outside of the application
          // therefore we need to ensure that the rootElement is an ancestor of the current element
          rootElementDetected = isMatchingElement(parentElement, $rootElement);
          if (!rootElementDetected) {
            parentHost = parentElement.data(NG_ANIMATE_PIN_DATA);
            if (parentHost) {
              parentElement = parentHost;
            }
          }
        }

        if (!bodyElementDetected) {
          // we also need to ensure that the element is or will be apart of the body element
          // otherwise it is pointless to even issue an animation to be rendered
          bodyElementDetected = isMatchingElement(parentElement, $$body);
        }

        parentElement = parentElement.parent();
      }

      var allowAnimation = !parentAnimationDetected || animateChildren;
      return allowAnimation && rootElementDetected && bodyElementDetected;
    }

    function markElementAnimationState(element, state, details) {
      details = details || {};
      details.state = state;

      var node = getDomNode(element);
      node.setAttribute(NG_ANIMATE_ATTR_NAME, state);

      var oldValue = activeAnimationsLookup.get(node);
      var newValue = oldValue
          ? extend(oldValue, details)
          : details;
      activeAnimationsLookup.put(node, newValue);
    }
  }];
}];

var $$rAFMutexFactory = ['$$rAF', function($$rAF) {
  return function() {
    var passed = false;
    $$rAF(function() {
      passed = true;
    });
    return function(fn) {
      passed ? fn() : $$rAF(fn);
    };
  };
}];

var $$AnimateRunnerFactory = ['$q', '$$rAFMutex', function($q, $$rAFMutex) {
  var INITIAL_STATE = 0;
  var DONE_PENDING_STATE = 1;
  var DONE_COMPLETE_STATE = 2;

  AnimateRunner.chain = function(chain, callback) {
    var index = 0;

    next();
    function next() {
      if (index === chain.length) {
        callback(true);
        return;
      }

      chain[index](function(response) {
        if (response === false) {
          callback(false);
          return;
        }
        index++;
        next();
      });
    }
  };

  AnimateRunner.all = function(runners, callback) {
    var count = 0;
    var status = true;
    forEach(runners, function(runner) {
      runner.done(onProgress);
    });

    function onProgress(response) {
      status = status && response;
      if (++count === runners.length) {
        callback(status);
      }
    }
  };

  function AnimateRunner(host) {
    this.setHost(host);

    this._doneCallbacks = [];
    this._runInAnimationFrame = $$rAFMutex();
    this._state = 0;
  }

  AnimateRunner.prototype = {
    setHost: function(host) {
      this.host = host || {};
    },

    done: function(fn) {
      if (this._state === DONE_COMPLETE_STATE) {
        fn();
      } else {
        this._doneCallbacks.push(fn);
      }
    },

    progress: noop,

    getPromise: function() {
      if (!this.promise) {
        var self = this;
        this.promise = $q(function(resolve, reject) {
          self.done(function(status) {
            status === false ? reject() : resolve();
          });
        });
      }
      return this.promise;
    },

    then: function(resolveHandler, rejectHandler) {
      return this.getPromise().then(resolveHandler, rejectHandler);
    },

    'catch': function(handler) {
      return this.getPromise()['catch'](handler);
    },

    'finally': function(handler) {
      return this.getPromise()['finally'](handler);
    },

    pause: function() {
      if (this.host.pause) {
        this.host.pause();
      }
    },

    resume: function() {
      if (this.host.resume) {
        this.host.resume();
      }
    },

    end: function() {
      if (this.host.end) {
        this.host.end();
      }
      this._resolve(true);
    },

    cancel: function() {
      if (this.host.cancel) {
        this.host.cancel();
      }
      this._resolve(false);
    },

    complete: function(response) {
      var self = this;
      if (self._state === INITIAL_STATE) {
        self._state = DONE_PENDING_STATE;
        self._runInAnimationFrame(function() {
          self._resolve(response);
        });
      }
    },

    _resolve: function(response) {
      if (this._state !== DONE_COMPLETE_STATE) {
        forEach(this._doneCallbacks, function(fn) {
          fn(response);
        });
        this._doneCallbacks.length = 0;
        this._state = DONE_COMPLETE_STATE;
      }
    }
  };

  return AnimateRunner;
}];

var $$AnimationProvider = ['$animateProvider', function($animateProvider) {
  var NG_ANIMATE_REF_ATTR = 'ng-animate-ref';

  var drivers = this.drivers = [];

  var RUNNER_STORAGE_KEY = '$$animationRunner';

  function setRunner(element, runner) {
    element.data(RUNNER_STORAGE_KEY, runner);
  }

  function removeRunner(element) {
    element.removeData(RUNNER_STORAGE_KEY);
  }

  function getRunner(element) {
    return element.data(RUNNER_STORAGE_KEY);
  }

  this.$get = ['$$jqLite', '$rootScope', '$injector', '$$AnimateRunner', '$$HashMap',
       function($$jqLite,   $rootScope,   $injector,   $$AnimateRunner,   $$HashMap) {

    var animationQueue = [];
    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function sortAnimations(animations) {
      var tree = { children: [] };
      var i, lookup = new $$HashMap();

      // this is done first beforehand so that the hashmap
      // is filled with a list of the elements that will be animated
      for (i = 0; i < animations.length; i++) {
        var animation = animations[i];
        lookup.put(animation.domNode, animations[i] = {
          domNode: animation.domNode,
          fn: animation.fn,
          children: []
        });
      }

      for (i = 0; i < animations.length; i++) {
        processNode(animations[i]);
      }

      return flatten(tree);

      function processNode(entry) {
        if (entry.processed) return entry;
        entry.processed = true;

        var elementNode = entry.domNode;
        var parentNode = elementNode.parentNode;
        lookup.put(elementNode, entry);

        var parentEntry;
        while (parentNode) {
          parentEntry = lookup.get(parentNode);
          if (parentEntry) {
            if (!parentEntry.processed) {
              parentEntry = processNode(parentEntry);
            }
            break;
          }
          parentNode = parentNode.parentNode;
        }

        (parentEntry || tree).children.push(entry);
        return entry;
      }

      function flatten(tree) {
        var result = [];
        var queue = [];
        var i;

        for (i = 0; i < tree.children.length; i++) {
          queue.push(tree.children[i]);
        }

        var remainingLevelEntries = queue.length;
        var nextLevelEntries = 0;
        var row = [];

        for (i = 0; i < queue.length; i++) {
          var entry = queue[i];
          if (remainingLevelEntries <= 0) {
            remainingLevelEntries = nextLevelEntries;
            nextLevelEntries = 0;
            result = result.concat(row);
            row = [];
          }
          row.push(entry.fn);
          forEach(entry.children, function(childEntry) {
            nextLevelEntries++;
            queue.push(childEntry);
          });
          remainingLevelEntries--;
        }

        if (row.length) {
          result = result.concat(row);
        }
        return result;
      }
    }

    // TODO(matsko): document the signature in a better way
    return function(element, event, options, onBeforeClassesAppliedCb) {
      options = prepareAnimationOptions(options);
      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // there is no animation at the current moment, however
      // these runner methods will get later updated with the
      // methods leading into the driver's end/cancel methods
      // for now they just stop the animation from starting
      var runner = new $$AnimateRunner({
        end: function() { close(); },
        cancel: function() { close(true); }
      });

      if (!drivers.length) {
        close();
        return runner;
      }

      setRunner(element, runner);

      var classes = mergeClasses(element.attr('class'), mergeClasses(options.addClass, options.removeClass));
      var tempClasses = options.tempClasses;
      if (tempClasses) {
        classes += ' ' + tempClasses;
        options.tempClasses = null;
      }

      animationQueue.push({
        // this data is used by the postDigest code and passed into
        // the driver step function
        element: element,
        classes: classes,
        event: event,
        structural: isStructural,
        options: options,
        beforeStart: beforeStart,
        close: close
      });

      element.on('$destroy', handleDestroyedElement);

      // we only want there to be one function called within the post digest
      // block. This way we can group animations for all the animations that
      // were apart of the same postDigest flush call.
      if (animationQueue.length > 1) return runner;

      $rootScope.$$postDigest(function() {
        var animations = [];
        forEach(animationQueue, function(entry) {
          // the element was destroyed early on which removed the runner
          // form its storage. This means we can't animate this element
          // at all and it already has been closed due to destruction.
          var elm = entry.element;
          if (getRunner(elm) && getDomNode(elm).parentNode) {
            animations.push(entry);
          } else {
            entry.close();
          }
        });

        // now any future animations will be in another postDigest
        animationQueue.length = 0;

        var groupedAnimations = groupAnimations(animations);
        var toBeSortedAnimations = [];

        forEach(groupedAnimations, function(animationEntry) {
          toBeSortedAnimations.push({
            domNode: getDomNode(animationEntry.from ? animationEntry.from.element : animationEntry.element),
            fn: function triggerAnimationStart() {
              // it's important that we apply the `ng-animate` CSS class and the
              // temporary classes before we do any driver invoking since these
              // CSS classes may be required for proper CSS detection.
              animationEntry.beforeStart();

              var startAnimationFn, closeFn = animationEntry.close;

              // in the event that the element was removed before the digest runs or
              // during the RAF sequencing then we should not trigger the animation.
              var targetElement = animationEntry.anchors
                  ? (animationEntry.from.element || animationEntry.to.element)
                  : animationEntry.element;

              if (getRunner(targetElement)) {
                var operation = invokeFirstDriver(animationEntry, onBeforeClassesAppliedCb);
                if (operation) {
                  startAnimationFn = operation.start;
                }
              }

              if (!startAnimationFn) {
                closeFn();
              } else {
                var animationRunner = startAnimationFn();
                animationRunner.done(function(status) {
                  closeFn(!status);
                });
                updateAnimationRunners(animationEntry, animationRunner);
              }
            }
          });
        });

        // we need to sort each of the animations in order of parent to child
        // relationships. This ensures that the parent to child classes are
        // applied at the right time.
        forEach(sortAnimations(toBeSortedAnimations), function(triggerAnimation) {
          triggerAnimation();
        });
      });

      return runner;

      // TODO(matsko): change to reference nodes
      function getAnchorNodes(node) {
        var SELECTOR = '[' + NG_ANIMATE_REF_ATTR + ']';
        var items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
              ? [node]
              : node.querySelectorAll(SELECTOR);
        var anchors = [];
        forEach(items, function(node) {
          var attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
          if (attr && attr.length) {
            anchors.push(node);
          }
        });
        return anchors;
      }

      function groupAnimations(animations) {
        var preparedAnimations = [];
        var refLookup = {};
        forEach(animations, function(animation, index) {
          var element = animation.element;
          var node = getDomNode(element);
          var event = animation.event;
          var enterOrMove = ['enter', 'move'].indexOf(event) >= 0;
          var anchorNodes = animation.structural ? getAnchorNodes(node) : [];

          if (anchorNodes.length) {
            var direction = enterOrMove ? 'to' : 'from';

            forEach(anchorNodes, function(anchor) {
              var key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
              refLookup[key] = refLookup[key] || {};
              refLookup[key][direction] = {
                animationID: index,
                element: jqLite(anchor)
              };
            });
          } else {
            preparedAnimations.push(animation);
          }
        });

        var usedIndicesLookup = {};
        var anchorGroups = {};
        forEach(refLookup, function(operations, key) {
          var from = operations.from;
          var to = operations.to;

          if (!from || !to) {
            // only one of these is set therefore we can't have an
            // anchor animation since all three pieces are required
            var index = from ? from.animationID : to.animationID;
            var indexKey = index.toString();
            if (!usedIndicesLookup[indexKey]) {
              usedIndicesLookup[indexKey] = true;
              preparedAnimations.push(animations[index]);
            }
            return;
          }

          var fromAnimation = animations[from.animationID];
          var toAnimation = animations[to.animationID];
          var lookupKey = from.animationID.toString();
          if (!anchorGroups[lookupKey]) {
            var group = anchorGroups[lookupKey] = {
              // TODO(matsko): double-check this code
              beforeStart: function() {
                fromAnimation.beforeStart();
                toAnimation.beforeStart();
              },
              close: function() {
                fromAnimation.close();
                toAnimation.close();
              },
              classes: cssClassesIntersection(fromAnimation.classes, toAnimation.classes),
              from: fromAnimation,
              to: toAnimation,
              anchors: [] // TODO(matsko): change to reference nodes
            };

            // the anchor animations require that the from and to elements both have at least
            // one shared CSS class which effictively marries the two elements together to use
            // the same animation driver and to properly sequence the anchor animation.
            if (group.classes.length) {
              preparedAnimations.push(group);
            } else {
              preparedAnimations.push(fromAnimation);
              preparedAnimations.push(toAnimation);
            }
          }

          anchorGroups[lookupKey].anchors.push({
            'out': from.element, 'in': to.element
          });
        });

        return preparedAnimations;
      }

      function cssClassesIntersection(a,b) {
        a = a.split(' ');
        b = b.split(' ');
        var matches = [];

        for (var i = 0; i < a.length; i++) {
          var aa = a[i];
          if (aa.substring(0,3) === 'ng-') continue;

          for (var j = 0; j < b.length; j++) {
            if (aa === b[j]) {
              matches.push(aa);
              break;
            }
          }
        }

        return matches.join(' ');
      }

      function invokeFirstDriver(animationDetails, onBeforeClassesAppliedCb) {
        // we loop in reverse order since the more general drivers (like CSS and JS)
        // may attempt more elements, but custom drivers are more particular
        for (var i = drivers.length - 1; i >= 0; i--) {
          var driverName = drivers[i];
          if (!$injector.has(driverName)) continue; // TODO(matsko): remove this check

          var factory = $injector.get(driverName);
          var driver = factory(animationDetails, onBeforeClassesAppliedCb);
          if (driver) {
            return driver;
          }
        }
      }

      function beforeStart() {
        element.addClass(NG_ANIMATE_CLASSNAME);
        if (tempClasses) {
          $$jqLite.addClass(element, tempClasses);
        }
      }

      function updateAnimationRunners(animation, newRunner) {
        if (animation.from && animation.to) {
          update(animation.from.element);
          update(animation.to.element);
        } else {
          update(animation.element);
        }

        function update(element) {
          getRunner(element).setHost(newRunner);
        }
      }

      function handleDestroyedElement() {
        var runner = getRunner(element);
        if (runner && (event !== 'leave' || !options.$$domOperationFired)) {
          runner.end();
        }
      }

      function close(rejected) { // jshint ignore:line
        element.off('$destroy', handleDestroyedElement);
        removeRunner(element);

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();

        if (tempClasses) {
          $$jqLite.removeClass(element, tempClasses);
        }

        element.removeClass(NG_ANIMATE_CLASSNAME);
        runner.complete(!rejected);
      }
    };
  }];
}];

/* global angularAnimateModule: true,

   $$BodyProvider,
   $$rAFMutexFactory,
   $$AnimateChildrenDirective,
   $$AnimateRunnerFactory,
   $$AnimateQueueProvider,
   $$AnimationProvider,
   $AnimateCssProvider,
   $$AnimateCssDriverProvider,
   $$AnimateJsProvider,
   $$AnimateJsDriverProvider,
*/

/**
 * @ngdoc module
 * @name ngAnimate
 * @description
 *
 * The `ngAnimate` module provides support for CSS-based animations (keyframes and transitions) as well as JavaScript-based animations via
 * callback hooks. Animations are not enabled by default, however, by including `ngAnimate` then the animation hooks are enabled for an Angular app.
 *
 * <div doc-module-components="ngAnimate"></div>
 *
 * # Usage
 * Simply put, there are two ways to make use of animations when ngAnimate is used: by using **CSS** and **JavaScript**. The former works purely based
 * using CSS (by using matching CSS selectors/styles) and the latter triggers animations that are registered via `module.animation()`. For
 * both CSS and JS animations the sole requirement is to have a matching `CSS class` that exists both in the registered animation and within
 * the HTML element that the animation will be triggered on.
 *
 * ## Directive Support
 * The following directives are "animation aware":
 *
 * | Directive                                                                                                | Supported Animations                                                     |
 * |----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
 * | {@link ng.directive:ngRepeat#animations ngRepeat}                                                        | enter, leave and move                                                    |
 * | {@link ngRoute.directive:ngView#animations ngView}                                                       | enter and leave                                                          |
 * | {@link ng.directive:ngInclude#animations ngInclude}                                                      | enter and leave                                                          |
 * | {@link ng.directive:ngSwitch#animations ngSwitch}                                                        | enter and leave                                                          |
 * | {@link ng.directive:ngIf#animations ngIf}                                                                | enter and leave                                                          |
 * | {@link ng.directive:ngClass#animations ngClass}                                                          | add and remove (the CSS class(es) present)                               |
 * | {@link ng.directive:ngShow#animations ngShow} & {@link ng.directive:ngHide#animations ngHide}            | add and remove (the ng-hide class value)                                 |
 * | {@link ng.directive:form#animation-hooks form} & {@link ng.directive:ngModel#animation-hooks ngModel}    | add and remove (dirty, pristine, valid, invalid & all other validations) |
 * | {@link module:ngMessages#animations ngMessages}                                                          | add and remove (ng-active & ng-inactive)                                 |
 * | {@link module:ngMessages#animations ngMessage}                                                           | enter and leave                                                          |
 *
 * (More information can be found by visiting each the documentation associated with each directive.)
 *
 * ## CSS-based Animations
 *
 * CSS-based animations with ngAnimate are unique since they require no JavaScript code at all. By using a CSS class that we reference between our HTML
 * and CSS code we can create an animation that will be picked up by Angular when an the underlying directive performs an operation.
 *
 * The example below shows how an `enter` animation can be made possible on a element using `ng-if`:
 *
 * ```html
 * <div ng-if="bool" class="fade">
 *    Fade me in out
 * </div>
 * <button ng-click="bool=true">Fade In!</button>
 * <button ng-click="bool=false">Fade Out!</button>
 * ```
 *
 * Notice the CSS class **fade**? We can now create the CSS transition code that references this class:
 *
 * ```css
 * /&#42; The starting CSS styles for the enter animation &#42;/
 * .fade.ng-enter {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 *
 * /&#42; The finishing CSS styles for the enter animation &#42;/
 * .fade.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * ```
 *
 * The key thing to remember here is that, depending on the animation event (which each of the directives above trigger depending on what's going on) two
 * generated CSS classes will be applied to the element; in the example above we have `.ng-enter` and `.ng-enter-active`. For CSS transitions, the transition
 * code **must** be defined within the starting CSS class (in this case `.ng-enter`). The destination class is what the transition will animate towards.
 *
 * If for example we wanted to create animations for `leave` and `move` (ngRepeat triggers move) then we can do so using the same CSS naming conventions:
 *
 * ```css
 * /&#42; now the element will fade out before it is removed from the DOM &#42;/
 * .fade.ng-leave {
 *   transition:0.5s linear all;
 *   opacity:1;
 * }
 * .fade.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * We can also make use of **CSS Keyframes** by referencing the keyframe animation within the starting CSS class:
 *
 * ```css
 * /&#42; there is no need to define anything inside of the destination
 * CSS class since the keyframe will take charge of the animation &#42;/
 * .fade.ng-leave {
 *   animation: my_fade_animation 0.5s linear;
 *   -webkit-animation: my_fade_animation 0.5s linear;
 * }
 *
 * @keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 *
 * @-webkit-keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 * ```
 *
 * Feel free also mix transitions and keyframes together as well as any other CSS classes on the same element.
 *
 * ### CSS Class-based Animations
 *
 * Class-based animations (animations that are triggered via `ngClass`, `ngShow`, `ngHide` and some other directives) have a slightly different
 * naming convention. Class-based animations are basic enough that a standard transition or keyframe can be referenced on the class being added
 * and removed.
 *
 * For example if we wanted to do a CSS animation for `ngHide` then we place an animation on the `.ng-hide` CSS class:
 *
 * ```html
 * <div ng-show="bool" class="fade">
 *   Show and hide me
 * </div>
 * <button ng-click="bool=true">Toggle</button>
 *
 * <style>
 * .fade.ng-hide {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 * </style>
 * ```
 *
 * All that is going on here with ngShow/ngHide behind the scenes is the `.ng-hide` class is added/removed (when the hidden state is valid). Since
 * ngShow and ngHide are animation aware then we can match up a transition and ngAnimate handles the rest.
 *
 * In addition the addition and removal of the CSS class, ngAnimate also provides two helper methods that we can use to further decorate the animation
 * with CSS styles.
 *
 * ```html
 * <div ng-class="{on:onOff}" class="highlight">
 *   Highlight this box
 * </div>
 * <button ng-click="onOff=!onOff">Toggle</button>
 *
 * <style>
 * .highlight {
 *   transition:0.5s linear all;
 * }
 * .highlight.on-add {
 *   background:white;
 * }
 * .highlight.on {
 *   background:yellow;
 * }
 * .highlight.on-remove {
 *   background:black;
 * }
 * </style>
 * ```
 *
 * We can also make use of CSS keyframes by placing them within the CSS classes.
 *
 *
 * ### CSS Staggering Animations
 * A Staggering animation is a collection of animations that are issued with a slight delay in between each successive operation resulting in a
 * curtain-like effect. The ngAnimate module (versions >=1.2) supports staggering animations and the stagger effect can be
 * performed by creating a **ng-EVENT-stagger** CSS class and attaching that class to the base CSS class used for
 * the animation. The style property expected within the stagger class can either be a **transition-delay** or an
 * **animation-delay** property (or both if your animation contains both transitions and keyframe animations).
 *
 * ```css
 * .my-animation.ng-enter {
 *   /&#42; standard transition code &#42;/
 *   transition: 1s linear all;
 *   opacity:0;
 * }
 * .my-animation.ng-enter-stagger {
 *   /&#42; this will have a 100ms delay between each successive leave animation &#42;/
 *   transition-delay: 0.1s;
 *
 *   /&#42; in case the stagger doesn't work then the duration value
 *    must be set to 0 to avoid an accidental CSS inheritance &#42;/
 *   transition-duration: 0s;
 * }
 * .my-animation.ng-enter.ng-enter-active {
 *   /&#42; standard transition styles &#42;/
 *   opacity:1;
 * }
 * ```
 *
 * Staggering animations work by default in ngRepeat (so long as the CSS class is defined). Outside of ngRepeat, to use staggering animations
 * on your own, they can be triggered by firing multiple calls to the same event on $animate. However, the restrictions surrounding this
 * are that each of the elements must have the same CSS className value as well as the same parent element. A stagger operation
 * will also be reset if one or more animation frames have passed since the multiple calls to `$animate` were fired.
 *
 * The following code will issue the **ng-leave-stagger** event on the element provided:
 *
 * ```js
 * var kids = parent.children();
 *
 * $animate.leave(kids[0]); //stagger index=0
 * $animate.leave(kids[1]); //stagger index=1
 * $animate.leave(kids[2]); //stagger index=2
 * $animate.leave(kids[3]); //stagger index=3
 * $animate.leave(kids[4]); //stagger index=4
 *
 * window.requestAnimationFrame(function() {
 *   //stagger has reset itself
 *   $animate.leave(kids[5]); //stagger index=0
 *   $animate.leave(kids[6]); //stagger index=1
 *
 *   $scope.$digest();
 * });
 * ```
 *
 * Stagger animations are currently only supported within CSS-defined animations.
 *
 * ### The `ng-animate` CSS class
 *
 * When ngAnimate is animating an element it will apply the `ng-animate` CSS class to the element for the duration of the animation.
 * This is a temporary CSS class and it will be removed once the animation is over (for both JavaScript and CSS-based animations).
 *
 * Therefore, animations can be applied to an element using this temporary class directly via CSS.
 *
 * ```css
 * .zipper.ng-animate {
 *   transition:0.5s linear all;
 * }
 * .zipper.ng-enter {
 *   opacity:0;
 * }
 * .zipper.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * .zipper.ng-leave {
 *   opacity:1;
 * }
 * .zipper.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * (Note that the `ng-animate` CSS class is reserved and it cannot be applied on an element directly since ngAnimate will always remove
 * the CSS class once an animation has completed.)
 *
 *
 * ## JavaScript-based Animations
 *
 * ngAnimate also allows for animations to be consumed by JavaScript code. The approach is similar to CSS-based animations (where there is a shared
 * CSS class that is referenced in our HTML code) but in addition we need to register the JavaScript animation on the module. By making use of the
 * `module.animation()` module function we can register the ainmation.
 *
 * Let's see an example of a enter/leave animation using `ngRepeat`:
 *
 * ```html
 * <div ng-repeat="item in items" class="slide">
 *   {{ item }}
 * </div>
 * ```
 *
 * See the **slide** CSS class? Let's use that class to define an animation that we'll structure in our module code by using `module.animation`:
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     // make note that other events (like addClass/removeClass)
 *     // have different function input parameters
 *     enter: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *
 *       // remember to call doneFn so that angular
 *       // knows that the animation has concluded
 *     },
 *
 *     move: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *     },
 *
 *     leave: function(element, doneFn) {
 *       jQuery(element).fadeOut(1000, doneFn);
 *     }
 *   }
 * }]
 * ```
 *
 * The nice thing about JS-based animations is that we can inject other services and make use of advanced animation libraries such as
 * greensock.js and velocity.js.
 *
 * If our animation code class-based (meaning that something like `ngClass`, `ngHide` and `ngShow` triggers it) then we can still define
 * our animations inside of the same registered animation, however, the function input arguments are a bit different:
 *
 * ```html
 * <div ng-class="color" class="colorful">
 *   this box is moody
 * </div>
 * <button ng-click="color='red'">Change to red</button>
 * <button ng-click="color='blue'">Change to blue</button>
 * <button ng-click="color='green'">Change to green</button>
 * ```
 *
 * ```js
 * myModule.animation('.colorful', [function() {
 *   return {
 *     addClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     removeClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     setClass: function(element, addedClass, removedClass, doneFn) {
 *       // do some cool animation and call the doneFn
 *     }
 *   }
 * }]
 * ```
 *
 * ## CSS + JS Animations Together
 *
 * AngularJS 1.4 and higher has taken steps to make the amalgamation of CSS and JS animations more flexible. However, unlike earlier versions of Angular,
 * defining CSS and JS animations to work off of the same CSS class will not work anymore. Therefore the example below will only result in **JS animations taking
 * charge of the animation**:
 *
 * ```html
 * <div ng-if="bool" class="slide">
 *   Slide in and out
 * </div>
 * ```
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     enter: function(element, doneFn) {
 *       jQuery(element).slideIn(1000, doneFn);
 *     }
 *   }
 * }]
 * ```
 *
 * ```css
 * .slide.ng-enter {
 *   transition:0.5s linear all;
 *   transform:translateY(-100px);
 * }
 * .slide.ng-enter.ng-enter-active {
 *   transform:translateY(0);
 * }
 * ```
 *
 * Does this mean that CSS and JS animations cannot be used together? Do JS-based animations always have higher priority? We can make up for the
 * lack of CSS animations by using the `$animateCss` service to trigger our own tweaked-out, CSS-based animations directly from
 * our own JS-based animation code:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
*        // this will trigger `.slide.ng-enter` and `.slide.ng-enter-active`.
 *       var runner = $animateCss(element, {
 *         event: 'enter',
 *         structural: true
 *       }).start();
*        runner.done(doneFn);
 *     }
 *   }
 * }]
 * ```
 *
 * The nice thing here is that we can save bandwidth by sticking to our CSS-based animation code and we don't need to rely on a 3rd-party animation framework.
 *
 * The `$animateCss` service is very powerful since we can feed in all kinds of extra properties that will be evaluated and fed into a CSS transition or
 * keyframe animation. For example if we wanted to animate the height of an element while adding and removing classes then we can do so by providing that
 * data into `$animateCss` directly:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var runner = $animateCss(element, {
 *         event: 'enter',
 *         structural: true,
 *         addClass: 'maroon-setting',
 *         from: { height:0 },
 *         to: { height: 200 }
 *       }).start();
 *
 *       runner.done(doneFn);
 *     }
 *   }
 * }]
 * ```
 *
 * Now we can fill in the rest via our transition CSS code:
 *
 * ```css
 * /&#42; the transition tells ngAnimate to make the animation happen &#42;/
 * .slide.ng-enter { transition:0.5s linear all; }
 *
 * /&#42; this extra CSS class will be absorbed into the transition
 * since the $animateCss code is adding the class &#42;/
 * .maroon-setting { background:red; }
 * ```
 *
 * And `$animateCss` will figure out the rest. Just make sure to have the `done()` callback fire the `doneFn` function to signal when the animation is over.
 *
 * To learn more about what's possible be sure to visit the {@link ngAnimate.$animateCss $animateCss service}.
 *
 * ## Animation Anchoring (via `ng-animate-ref`)
 *
 * ngAnimate in AngularJS 1.4 comes packed with the ability to cross-animate elements between
 * structural areas of an application (like views) by pairing up elements using an attribute
 * called `ng-animate-ref`.
 *
 * Let's say for example we have two views that are managed by `ng-view` and we want to show
 * that there is a relationship between two components situated in within these views. By using the
 * `ng-animate-ref` attribute we can identify that the two components are paired together and we
 * can then attach an animation, which is triggered when the view changes.
 *
 * Say for example we have the following template code:
 *
 * ```html
 * <!-- index.html -->
 * <div ng-view class="view-animation">
 * </div>
 *
 * <!-- home.html -->
 * <a href="#/banner-page">
 *   <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * </a>
 *
 * <!-- banner-page.html -->
 * <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * ```
 *
 * Now, when the view changes (once the link is clicked), ngAnimate will examine the
 * HTML contents to see if there is a match reference between any components in the view
 * that is leaving and the view that is entering. It will scan both the view which is being
 * removed (leave) and inserted (enter) to see if there are any paired DOM elements that
 * contain a matching ref value.
 *
 * The two images match since they share the same ref value. ngAnimate will now create a
 * transport element (which is a clone of the first image element) and it will then attempt
 * to animate to the position of the second image element in the next view. For the animation to
 * work a special CSS class called `ng-anchor` will be added to the transported element.
 *
 * We can now attach a transition onto the `.banner.ng-anchor` CSS class and then
 * ngAnimate will handle the entire transition for us as well as the addition and removal of
 * any changes of CSS classes between the elements:
 *
 * ```css
 * .banner.ng-anchor {
 *   /&#42; this animation will last for 1 second since there are
 *          two phases to the animation (an `in` and an `out` phase) &#42;/
 *   transition:0.5s linear all;
 * }
 * ```
 *
 * We also **must** include animations for the views that are being entered and removed
 * (otherwise anchoring wouldn't be possible since the new view would be inserted right away).
 *
 * ```css
 * .view-animation.ng-enter, .view-animation.ng-leave {
 *   transition:0.5s linear all;
 *   position:fixed;
 *   left:0;
 *   top:0;
 *   width:100%;
 * }
 * .view-animation.ng-enter {
 *   transform:translateX(100%);
 * }
 * .view-animation.ng-leave,
 * .view-animation.ng-enter.ng-enter-active {
 *   transform:translateX(0%);
 * }
 * .view-animation.ng-leave.ng-leave-active {
 *   transform:translateX(-100%);
 * }
 * ```
 *
 * Now we can jump back to the anchor animation. When the animation happens, there are two stages that occur:
 * an `out` and an `in` stage. The `out` stage happens first and that is when the element is animated away
 * from its origin. Once that animation is over then the `in` stage occurs which animates the
 * element to its destination. The reason why there are two animations is to give enough time
 * for the enter animation on the new element to be ready.
 *
 * The example above sets up a transition for both the in and out phases, but we can also target the out or
 * in phases directly via `ng-anchor-out` and `ng-anchor-in`.
 *
 * ```css
 * .banner.ng-anchor-out {
 *   transition: 0.5s linear all;
 *
 *   /&#42; the scale will be applied during the out animation,
 *          but will be animated away when the in animation runs &#42;/
 *   transform: scale(1.2);
 * }
 *
 * .banner.ng-anchor-in {
 *   transition: 1s linear all;
 * }
 * ```
 *
 *
 *
 *
 * ### Anchoring Demo
 *
  <example module="anchoringExample"
           name="anchoringExample"
           id="anchoringExample"
           deps="angular-animate.js;angular-route.js"
           animations="true">
    <file name="index.html">
      <a href="#/">Home</a>
      <hr />
      <div class="view-container">
        <div ng-view class="view"></div>
      </div>
    </file>
    <file name="script.js">
      angular.module('anchoringExample', ['ngAnimate', 'ngRoute'])
        .config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/', {
            templateUrl: 'home.html',
            controller: 'HomeController as home'
          });
          $routeProvider.when('/profile/:id', {
            templateUrl: 'profile.html',
            controller: 'ProfileController as profile'
          });
        }])
        .run(['$rootScope', function($rootScope) {
          $rootScope.records = [
            { id:1, title: "Miss Beulah Roob" },
            { id:2, title: "Trent Morissette" },
            { id:3, title: "Miss Ava Pouros" },
            { id:4, title: "Rod Pouros" },
            { id:5, title: "Abdul Rice" },
            { id:6, title: "Laurie Rutherford Sr." },
            { id:7, title: "Nakia McLaughlin" },
            { id:8, title: "Jordon Blanda DVM" },
            { id:9, title: "Rhoda Hand" },
            { id:10, title: "Alexandrea Sauer" }
          ];
        }])
        .controller('HomeController', [function() {
          //empty
        }])
        .controller('ProfileController', ['$rootScope', '$routeParams', function($rootScope, $routeParams) {
          var index = parseInt($routeParams.id, 10);
          var record = $rootScope.records[index - 1];

          this.title = record.title;
          this.id = record.id;
        }]);
    </file>
    <file name="home.html">
      <h2>Welcome to the home page</h1>
      <p>Please click on an element</p>
      <a class="record"
         ng-href="#/profile/{{ record.id }}"
         ng-animate-ref="{{ record.id }}"
         ng-repeat="record in records">
        {{ record.title }}
      </a>
    </file>
    <file name="profile.html">
      <div class="profile record" ng-animate-ref="{{ profile.id }}">
        {{ profile.title }}
      </div>
    </file>
    <file name="animations.css">
      .record {
        display:block;
        font-size:20px;
      }
      .profile {
        background:black;
        color:white;
        font-size:100px;
      }
      .view-container {
        position:relative;
      }
      .view-container > .view.ng-animate {
        position:absolute;
        top:0;
        left:0;
        width:100%;
        min-height:500px;
      }
      .view.ng-enter, .view.ng-leave,
      .record.ng-anchor {
        transition:0.5s linear all;
      }
      .view.ng-enter {
        transform:translateX(100%);
      }
      .view.ng-enter.ng-enter-active, .view.ng-leave {
        transform:translateX(0%);
      }
      .view.ng-leave.ng-leave-active {
        transform:translateX(-100%);
      }
      .record.ng-anchor-out {
        background:red;
      }
    </file>
  </example>
 *
 * ### How is the element transported?
 *
 * When an anchor animation occurs, ngAnimate will clone the starting element and position it exactly where the starting
 * element is located on screen via absolute positioning. The cloned element will be placed inside of the root element
 * of the application (where ng-app was defined) and all of the CSS classes of the starting element will be applied. The
 * element will then animate into the `out` and `in` animations and will eventually reach the coordinates and match
 * the dimensions of the destination element. During the entire animation a CSS class of `.ng-animate-shim` will be applied
 * to both the starting and destination elements in order to hide them from being visible (the CSS styling for the class
 * is: `visibility:hidden`). Once the anchor reaches its destination then it will be removed and the destination element
 * will become visible since the shim class will be removed.
 *
 * ### How is the morphing handled?
 *
 * CSS Anchoring relies on transitions and keyframes and the internal code is intelligent enough to figure out
 * what CSS classes differ between the starting element and the destination element. These different CSS classes
 * will be added/removed on the anchor element and a transition will be applied (the transition that is provided
 * in the anchor class). Long story short, ngAnimate will figure out what classes to add and remove which will
 * make the transition of the element as smooth and automatic as possible. Be sure to use simple CSS classes that
 * do not rely on DOM nesting structure so that the anchor element appears the same as the starting element (since
 * the cloned element is placed inside of root element which is likely close to the body element).
 *
 * Note that if the root element is on the `<html>` element then the cloned node will be placed inside of body.
 *
 *
 * ## Using $animate in your directive code
 *
 * So far we've explored how to feed in animations into an Angular application, but how do we trigger animations within our own directives in our application?
 * By injecting the `$animate` service into our directive code, we can trigger structural and class-based hooks which can then be consumed by animations. Let's
 * imagine we have a greeting box that shows and hides itself when the data changes
 *
 * ```html
 * <greeting-box active="onOrOff">Hi there</greeting-box>
 * ```
 *
 * ```js
 * ngModule.directive('greetingBox', ['$animate', function($animate) {
 *   return function(scope, element, attrs) {
 *     attrs.$observe('active', function(value) {
 *       value ? $animate.addClass(element, 'on') : $animate.removeClass(element, 'on');
 *     });
 *   });
 * }]);
 * ```
 *
 * Now the `on` CSS class is added and removed on the greeting box component. Now if we add a CSS class on top of the greeting box element
 * in our HTML code then we can trigger a CSS or JS animation to happen.
 *
 * ```css
 * /&#42; normally we would create a CSS class to reference on the element &#42;/
 * greeting-box.on { transition:0.5s linear all; background:green; color:white; }
 * ```
 *
 * The `$animate` service contains a variety of other methods like `enter`, `leave`, `animate` and `setClass`. To learn more about what's
 * possible be sure to visit the {@link ng.$animate $animate service API page}.
 *
 *
 * ### Preventing Collisions With Third Party Libraries
 *
 * Some third-party frameworks place animation duration defaults across many element or className
 * selectors in order to make their code small and reuseable. This can lead to issues with ngAnimate, which
 * is expecting actual animations on these elements and has to wait for their completion.
 *
 * You can prevent this unwanted behavior by using a prefix on all your animation classes:
 *
 * ```css
 * /&#42; prefixed with animate- &#42;/
 * .animate-fade-add.animate-fade-add-active {
 *   transition:1s linear all;
 *   opacity:0;
 * }
 * ```
 *
 * You then configure `$animate` to enforce this prefix:
 *
 * ```js
 * $animateProvider.classNameFilter(/animate-/);
 * ```
 *
 * This also may provide your application with a speed boost since only specific elements containing CSS class prefix
 * will be evaluated for animation when any DOM changes occur in the application.
 *
 * ## Callbacks and Promises
 *
 * When `$animate` is called it returns a promise that can be used to capture when the animation has ended. Therefore if we were to trigger
 * an animation (within our directive code) then we can continue performing directive and scope related activities after the animation has
 * ended by chaining onto the returned promise that animation method returns.
 *
 * ```js
 * // somewhere within the depths of the directive
 * $animate.enter(element, parent).then(function() {
 *   //the animation has completed
 * });
 * ```
 *
 * (Note that earlier versions of Angular prior to v1.4 required the promise code to be wrapped using `$scope.$apply(...)`. This is not the case
 * anymore.)
 *
 * In addition to the animation promise, we can also make use of animation-related callbacks within our directives and controller code by registering
 * an event listener using the `$animate` service. Let's say for example that an animation was triggered on our view
 * routing controller to hook into that:
 *
 * ```js
 * ngModule.controller('HomePageController', ['$animate', function($animate) {
 *   $animate.on('enter', ngViewElement, function(element) {
 *     // the animation for this route has completed
 *   }]);
 * }])
 * ```
 *
 * (Note that you will need to trigger a digest within the callback to get angular to notice any scope-related changes.)
 */

/**
 * @ngdoc service
 * @name $animate
 * @kind object
 *
 * @description
 * The ngAnimate `$animate` service documentation is the same for the core `$animate` service.
 *
 * Click here {@link ng.$animate $animate to learn more about animations with `$animate`}.
 */
angular.module('ngAnimate', [])
  .provider('$$body', $$BodyProvider)

  .directive('ngAnimateChildren', $$AnimateChildrenDirective)

  .factory('$$rAFMutex', $$rAFMutexFactory)

  .factory('$$AnimateRunner', $$AnimateRunnerFactory)

  .provider('$$animateQueue', $$AnimateQueueProvider)
  .provider('$$animation', $$AnimationProvider)

  .provider('$animateCss', $AnimateCssProvider)
  .provider('$$animateCssDriver', $$AnimateCssDriverProvider)

  .provider('$$animateJs', $$AnimateJsProvider)
  .provider('$$animateJsDriver', $$AnimateJsDriverProvider);


})(window, window.angular);

},{}],11:[function(require,module,exports){
require('./angular-animate');
module.exports = 'ngAnimate';

},{"./angular-animate":10}],12:[function(require,module,exports){
/**
 * @license AngularJS v1.4.4
 * (c) 2010-2015 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *     Any commits to this file should be reviewed with security in mind.  *
 *   Changes to this file can potentially create security vulnerabilities. *
 *          An approval from 2 Core members with history of modifying      *
 *                         this file is required.                          *
 *                                                                         *
 *  Does the change somehow allow for arbitrary javascript to be executed? *
 *    Or allows for someone to change the prototype of built-in objects?   *
 *     Or gives undesired access to variables likes document or window?    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $sanitizeMinErr = angular.$$minErr('$sanitize');

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/*
 * HTML Parser By Misko Hevery (misko@hevery.com)
 * based on:  HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 */


/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string, however, since our parser is more strict than a typical browser
 *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
 *   browser, won't make it through the sanitizer. The input may also contain SVG markup.
 *   The whitelist is configured using the functions `aHrefSanitizationWhitelist` and
 *   `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider `$compileProvider`}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getInnerHtml()).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getInnerHtml()).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */
function $SanitizeProvider() {
  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, angular.noop);
  writer.chars(chars);
  return buf.join('');
}


// Regular Expressions for parsing tags and attributes
var START_TAG_REGEXP =
       /^<((?:[a-zA-Z])[\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*(>?)/,
  END_TAG_REGEXP = /^<\/\s*([\w:-]+)[^>]*>/,
  ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
  BEGIN_TAG_REGEXP = /^</,
  BEGING_END_TAGE_REGEXP = /^<\//,
  COMMENT_REGEXP = /<!--(.*?)-->/g,
  DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
  CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
  SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
  // Match everything outside of normal chars and " (quote character)
  NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var voidElements = makeMap("area,br,col,hr,img,wbr");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
    optionalEndTagInlineElements = makeMap("rp,rt"),
    optionalEndTagElements = angular.extend({},
                                            optionalEndTagInlineElements,
                                            optionalEndTagBlockElements);

// Safe Block Elements - HTML5
var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var"));

// SVG Elements
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
// Note: the elements animate,animateColor,animateMotion,animateTransform,set are intentionally omitted.
// They can potentially allow for arbitrary javascript to be executed. See #11290
var svgElements = makeMap("circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph," +
        "hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline," +
        "radialGradient,rect,stop,svg,switch,text,title,tspan,use");

// Special Elements (can contain anything)
var specialElements = makeMap("script,style");

var validElements = angular.extend({},
                                   voidElements,
                                   blockElements,
                                   inlineElements,
                                   optionalEndTagElements,
                                   svgElements);

//Attributes that have href and hence need to be sanitized
var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap,xlink:href");

var htmlAttrs = makeMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
    'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
    'valign,value,vspace,width');

// SVG attributes (without "id" and "name" attributes)
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
var svgAttrs = makeMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
    'baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,' +
    'cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,' +
    'font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,' +
    'height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,' +
    'marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,' +
    'max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,' +
    'path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,' +
    'requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,' +
    'stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,' +
    'stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,' +
    'stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,' +
    'underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,' +
    'width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,' +
    'xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan', true);

var validAttrs = angular.extend({},
                                uriAttrs,
                                svgAttrs,
                                htmlAttrs);

function makeMap(str, lowercaseKeys) {
  var obj = {}, items = str.split(','), i;
  for (i = 0; i < items.length; i++) {
    obj[lowercaseKeys ? angular.lowercase(items[i]) : items[i]] = true;
  }
  return obj;
}


/**
 * @example
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * @param {string} html string
 * @param {object} handler
 */
function htmlParser(html, handler) {
  if (typeof html !== 'string') {
    if (html === null || typeof html === 'undefined') {
      html = '';
    } else {
      html = '' + html;
    }
  }
  var index, chars, match, stack = [], last = html, text;
  stack.last = function() { return stack[stack.length - 1]; };

  while (html) {
    text = '';
    chars = true;

    // Make sure we're not in a script or style element
    if (!stack.last() || !specialElements[stack.last()]) {

      // Comment
      if (html.indexOf("<!--") === 0) {
        // comments containing -- are not allowed unless they terminate the comment
        index = html.indexOf("--", 4);

        if (index >= 0 && html.lastIndexOf("-->", index) === index) {
          if (handler.comment) handler.comment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }
      // DOCTYPE
      } else if (DOCTYPE_REGEXP.test(html)) {
        match = html.match(DOCTYPE_REGEXP);

        if (match) {
          html = html.replace(match[0], '');
          chars = false;
        }
      // end tag
      } else if (BEGING_END_TAGE_REGEXP.test(html)) {
        match = html.match(END_TAG_REGEXP);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(END_TAG_REGEXP, parseEndTag);
          chars = false;
        }

      // start tag
      } else if (BEGIN_TAG_REGEXP.test(html)) {
        match = html.match(START_TAG_REGEXP);

        if (match) {
          // We only have a valid start-tag if there is a '>'.
          if (match[4]) {
            html = html.substring(match[0].length);
            match[0].replace(START_TAG_REGEXP, parseStartTag);
          }
          chars = false;
        } else {
          // no ending tag found --- this piece should be encoded as an entity.
          text += '<';
          html = html.substring(1);
        }
      }

      if (chars) {
        index = html.indexOf("<");

        text += index < 0 ? html : html.substring(0, index);
        html = index < 0 ? "" : html.substring(index);

        if (handler.chars) handler.chars(decodeEntities(text));
      }

    } else {
      // IE versions 9 and 10 do not understand the regex '[^]', so using a workaround with [\W\w].
      html = html.replace(new RegExp("([\\W\\w]*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
        function(all, text) {
          text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

          if (handler.chars) handler.chars(decodeEntities(text));

          return "";
      });

      parseEndTag("", stack.last());
    }

    if (html == last) {
      throw $sanitizeMinErr('badparse', "The sanitizer was unable to parse the following block " +
                                        "of html: {0}", html);
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag(tag, tagName, rest, unary) {
    tagName = angular.lowercase(tagName);
    if (blockElements[tagName]) {
      while (stack.last() && inlineElements[stack.last()]) {
        parseEndTag("", stack.last());
      }
    }

    if (optionalEndTagElements[tagName] && stack.last() == tagName) {
      parseEndTag("", tagName);
    }

    unary = voidElements[tagName] || !!unary;

    if (!unary) {
      stack.push(tagName);
    }

    var attrs = {};

    rest.replace(ATTR_REGEXP,
      function(match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
        var value = doubleQuotedValue
          || singleQuotedValue
          || unquotedValue
          || '';

        attrs[name] = decodeEntities(value);
    });
    if (handler.start) handler.start(tagName, attrs, unary);
  }

  function parseEndTag(tag, tagName) {
    var pos = 0, i;
    tagName = angular.lowercase(tagName);
    if (tagName) {
      // Find the closest opened tag of the same type
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos] == tagName) break;
      }
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (i = stack.length - 1; i >= pos; i--)
        if (handler.end) handler.end(stack[i]);

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}

var hiddenPre=document.createElement("pre");
/**
 * decodes all entities into regular string
 * @param value
 * @returns {string} A string with decoded entities.
 */
function decodeEntities(value) {
  if (!value) { return ''; }

  hiddenPre.innerHTML = value.replace(/</g,"&lt;");
  // innerText depends on styling as it doesn't display hidden elements.
  // Therefore, it's better to use textContent not to cause unnecessary reflows.
  return hiddenPre.textContent;
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns {string} escaped text
 */
function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(SURROGATE_PAIR_REGEXP, function(value) {
      var hi = value.charCodeAt(0);
      var low = value.charCodeAt(1);
      return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    }).
    replace(NON_ALPHANUMERIC_REGEXP, function(value) {
      return '&#' + value.charCodeAt(0) + ';';
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

/**
 * create an HTML/XML writer which writes to buffer
 * @param {Array} buf use buf.jain('') to get out sanitized html string
 * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
 */
function htmlSanitizeWriter(buf, uriValidator) {
  var ignore = false;
  var out = angular.bind(buf, buf.push);
  return {
    start: function(tag, attrs, unary) {
      tag = angular.lowercase(tag);
      if (!ignore && specialElements[tag]) {
        ignore = tag;
      }
      if (!ignore && validElements[tag] === true) {
        out('<');
        out(tag);
        angular.forEach(attrs, function(value, key) {
          var lkey=angular.lowercase(key);
          var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
          if (validAttrs[lkey] === true &&
            (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
            out(' ');
            out(key);
            out('="');
            out(encodeEntities(value));
            out('"');
          }
        });
        out(unary ? '/>' : '>');
      }
    },
    end: function(tag) {
        tag = angular.lowercase(tag);
        if (!ignore && validElements[tag] === true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
    chars: function(chars) {
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
  };
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);

/* global sanitizeText: false */

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (_blank|_self|_parent|_top) or named frame to open links in.
 * @returns {string} Html-linkified text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js">
     <file name="index.html">
       <script>
         angular.module('linkyExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', function($scope) {
             $scope.snippet =
               'Pretty text with some links:\n'+
               'http://angularjs.org/,\n'+
               'mailto:us@somewhere.org,\n'+
               'another@somewhere.org,\n'+
               'and one more: ftp://127.0.0.1/.';
             $scope.snippetWithTarget = 'http://angularjs.org/';
           }]);
       </script>
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Filter</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithTarget | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithTarget | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithTarget | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i,
      MAILTO_REGEXP = /^mailto:/i;

  return function(text, target) {
    if (!text) return text;
    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      html.push('<a ');
      if (angular.isDefined(target)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);

},{}],13:[function(require,module,exports){
require('./angular-sanitize');
module.exports = 'ngSanitize';

},{"./angular-sanitize":12}],14:[function(require,module,exports){
/**
 * @license AngularJS v1.4.4
 * (c) 2010-2015 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/**
 * @ngdoc module
 * @name ngTouch
 * @description
 *
 * # ngTouch
 *
 * The `ngTouch` module provides touch events and other helpers for touch-enabled devices.
 * The implementation is based on jQuery Mobile touch event handling
 * ([jquerymobile.com](http://jquerymobile.com/)).
 *
 *
 * See {@link ngTouch.$swipe `$swipe`} for usage.
 *
 * <div doc-module-components="ngTouch"></div>
 *
 */

// define ngTouch module
/* global -ngTouch */
var ngTouch = angular.module('ngTouch', []);

function nodeName_(element) {
  return angular.lowercase(element.nodeName || (element[0] && element[0].nodeName));
}

/* global ngTouch: false */

    /**
     * @ngdoc service
     * @name $swipe
     *
     * @description
     * The `$swipe` service is a service that abstracts the messier details of hold-and-drag swipe
     * behavior, to make implementing swipe-related directives more convenient.
     *
     * Requires the {@link ngTouch `ngTouch`} module to be installed.
     *
     * `$swipe` is used by the `ngSwipeLeft` and `ngSwipeRight` directives in `ngTouch`, and by
     * `ngCarousel` in a separate component.
     *
     * # Usage
     * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
     * which is to be watched for swipes, and an object with four handler functions. See the
     * documentation for `bind` below.
     */

ngTouch.factory('$swipe', [function() {
  // The total distance in any direction before we make the call on swipe vs. scroll.
  var MOVE_BUFFER_RADIUS = 10;

  var POINTER_EVENTS = {
    'mouse': {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    },
    'touch': {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      cancel: 'touchcancel'
    }
  };

  function getCoordinates(event) {
    var originalEvent = event.originalEvent || event;
    var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
    var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  function getEvents(pointerTypes, eventType) {
    var res = [];
    angular.forEach(pointerTypes, function(pointerType) {
      var eventName = POINTER_EVENTS[pointerType][eventType];
      if (eventName) {
        res.push(eventName);
      }
    });
    return res.join(' ');
  }

  return {
    /**
     * @ngdoc method
     * @name $swipe#bind
     *
     * @description
     * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
     * object containing event handlers.
     * The pointer types that should be used can be specified via the optional
     * third argument, which is an array of strings `'mouse'` and `'touch'`. By default,
     * `$swipe` will listen for `mouse` and `touch` events.
     *
     * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
     * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }` and the raw
     * `event`. `cancel` receives the raw `event` as its single parameter.
     *
     * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
     * watching for `touchmove` or `mousemove` events. These events are ignored until the total
     * distance moved in either dimension exceeds a small threshold.
     *
     * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
     * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
     * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
     *   A `cancel` event is sent.
     *
     * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
     * a swipe is in progress.
     *
     * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
     *
     * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
     * as described above.
     *
     */
    bind: function(element, eventHandlers, pointerTypes) {
      // Absolute total movement, used to control swipe vs. scroll.
      var totalX, totalY;
      // Coordinates of the start position.
      var startCoords;
      // Last event's position.
      var lastPos;
      // Whether a swipe is active.
      var active = false;

      pointerTypes = pointerTypes || ['mouse', 'touch'];
      element.on(getEvents(pointerTypes, 'start'), function(event) {
        startCoords = getCoordinates(event);
        active = true;
        totalX = 0;
        totalY = 0;
        lastPos = startCoords;
        eventHandlers['start'] && eventHandlers['start'](startCoords, event);
      });
      var events = getEvents(pointerTypes, 'cancel');
      if (events) {
        element.on(events, function(event) {
          active = false;
          eventHandlers['cancel'] && eventHandlers['cancel'](event);
        });
      }

      element.on(getEvents(pointerTypes, 'move'), function(event) {
        if (!active) return;

        // Android will send a touchcancel if it thinks we're starting to scroll.
        // So when the total distance (+ or - or both) exceeds 10px in either direction,
        // we either:
        // - On totalX > totalY, we send preventDefault() and treat this as a swipe.
        // - On totalY > totalX, we let the browser handle it as a scroll.

        if (!startCoords) return;
        var coords = getCoordinates(event);

        totalX += Math.abs(coords.x - lastPos.x);
        totalY += Math.abs(coords.y - lastPos.y);

        lastPos = coords;

        if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
          return;
        }

        // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
        if (totalY > totalX) {
          // Allow native scrolling to take over.
          active = false;
          eventHandlers['cancel'] && eventHandlers['cancel'](event);
          return;
        } else {
          // Prevent the browser from scrolling.
          event.preventDefault();
          eventHandlers['move'] && eventHandlers['move'](coords, event);
        }
      });

      element.on(getEvents(pointerTypes, 'end'), function(event) {
        if (!active) return;
        active = false;
        eventHandlers['end'] && eventHandlers['end'](getCoordinates(event), event);
      });
    }
  };
}]);

/* global ngTouch: false,
  nodeName_: false
*/

/**
 * @ngdoc directive
 * @name ngClick
 *
 * @description
 * A more powerful replacement for the default ngClick designed to be used on touchscreen
 * devices. Most mobile browsers wait about 300ms after a tap-and-release before sending
 * the click event. This version handles them immediately, and then prevents the
 * following click event from propagating.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * This directive can fall back to using an ordinary click event, and so works on desktop
 * browsers as well as mobile.
 *
 * This directive also sets the CSS class `ng-click-active` while the element is being held
 * down (by a mouse click or touch) so you can restyle the depressed element if you wish.
 *
 * @element ANY
 * @param {expression} ngClick {@link guide/expression Expression} to evaluate
 * upon tap. (Event object is available as `$event`)
 *
 * @example
    <example module="ngClickExample" deps="angular-touch.js">
      <file name="index.html">
        <button ng-click="count = count + 1" ng-init="count=0">
          Increment
        </button>
        count: {{ count }}
      </file>
      <file name="script.js">
        angular.module('ngClickExample', ['ngTouch']);
      </file>
    </example>
 */

ngTouch.config(['$provide', function($provide) {
  $provide.decorator('ngClickDirective', ['$delegate', function($delegate) {
    // drop the default ngClick directive
    $delegate.shift();
    return $delegate;
  }]);
}]);

ngTouch.directive('ngClick', ['$parse', '$timeout', '$rootElement',
    function($parse, $timeout, $rootElement) {
  var TAP_DURATION = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  var MOVE_TOLERANCE = 12; // 12px seems to work in most mobile browsers.
  var PREVENT_DURATION = 2500; // 2.5 seconds maximum from preventGhostClick call to click
  var CLICKBUSTER_THRESHOLD = 25; // 25 pixels in any dimension is the limit for busting clicks.

  var ACTIVE_CLASS_NAME = 'ng-click-active';
  var lastPreventedTime;
  var touchCoordinates;
  var lastLabelClickCoordinates;


  // TAP EVENTS AND GHOST CLICKS
  //
  // Why tap events?
  // Mobile browsers detect a tap, then wait a moment (usually ~300ms) to see if you're
  // double-tapping, and then fire a click event.
  //
  // This delay sucks and makes mobile apps feel unresponsive.
  // So we detect touchstart, touchcancel and touchend ourselves and determine when
  // the user has tapped on something.
  //
  // What happens when the browser then generates a click event?
  // The browser, of course, also detects the tap and fires a click after a delay. This results in
  // tapping/clicking twice. We do "clickbusting" to prevent it.
  //
  // How does it work?
  // We attach global touchstart and click handlers, that run during the capture (early) phase.
  // So the sequence for a tap is:
  // - global touchstart: Sets an "allowable region" at the point touched.
  // - element's touchstart: Starts a touch
  // (- touchcancel ends the touch, no click follows)
  // - element's touchend: Determines if the tap is valid (didn't move too far away, didn't hold
  //   too long) and fires the user's tap handler. The touchend also calls preventGhostClick().
  // - preventGhostClick() removes the allowable region the global touchstart created.
  // - The browser generates a click event.
  // - The global click handler catches the click, and checks whether it was in an allowable region.
  //     - If preventGhostClick was called, the region will have been removed, the click is busted.
  //     - If the region is still there, the click proceeds normally. Therefore clicks on links and
  //       other elements without ngTap on them work normally.
  //
  // This is an ugly, terrible hack!
  // Yeah, tell me about it. The alternatives are using the slow click events, or making our users
  // deal with the ghost clicks, so I consider this the least of evils. Fortunately Angular
  // encapsulates this ugly logic away from the user.
  //
  // Why not just put click handlers on the element?
  // We do that too, just to be sure. If the tap event caused the DOM to change,
  // it is possible another element is now in that position. To take account for these possibly
  // distinct elements, the handlers are global and care only about coordinates.

  // Checks if the coordinates are close enough to be within the region.
  function hit(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) < CLICKBUSTER_THRESHOLD && Math.abs(y1 - y2) < CLICKBUSTER_THRESHOLD;
  }

  // Checks a list of allowable regions against a click location.
  // Returns true if the click should be allowed.
  // Splices out the allowable region from the list after it has been used.
  function checkAllowableRegions(touchCoordinates, x, y) {
    for (var i = 0; i < touchCoordinates.length; i += 2) {
      if (hit(touchCoordinates[i], touchCoordinates[i + 1], x, y)) {
        touchCoordinates.splice(i, i + 2);
        return true; // allowable region
      }
    }
    return false; // No allowable region; bust it.
  }

  // Global click handler that prevents the click if it's in a bustable zone and preventGhostClick
  // was called recently.
  function onClick(event) {
    if (Date.now() - lastPreventedTime > PREVENT_DURATION) {
      return; // Too old.
    }

    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    // Work around desktop Webkit quirk where clicking a label will fire two clicks (on the label
    // and on the input element). Depending on the exact browser, this second click we don't want
    // to bust has either (0,0), negative coordinates, or coordinates equal to triggering label
    // click event
    if (x < 1 && y < 1) {
      return; // offscreen
    }
    if (lastLabelClickCoordinates &&
        lastLabelClickCoordinates[0] === x && lastLabelClickCoordinates[1] === y) {
      return; // input click triggered by label click
    }
    // reset label click coordinates on first subsequent click
    if (lastLabelClickCoordinates) {
      lastLabelClickCoordinates = null;
    }
    // remember label click coordinates to prevent click busting of trigger click event on input
    if (nodeName_(event.target) === 'label') {
      lastLabelClickCoordinates = [x, y];
    }

    // Look for an allowable region containing this click.
    // If we find one, that means it was created by touchstart and not removed by
    // preventGhostClick, so we don't bust it.
    if (checkAllowableRegions(touchCoordinates, x, y)) {
      return;
    }

    // If we didn't find an allowable region, bust the click.
    event.stopPropagation();
    event.preventDefault();

    // Blur focused form elements
    event.target && event.target.blur && event.target.blur();
  }


  // Global touchstart handler that creates an allowable region for a click event.
  // This allowable region can be removed by preventGhostClick if we want to bust it.
  function onTouchStart(event) {
    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    touchCoordinates.push(x, y);

    $timeout(function() {
      // Remove the allowable region.
      for (var i = 0; i < touchCoordinates.length; i += 2) {
        if (touchCoordinates[i] == x && touchCoordinates[i + 1] == y) {
          touchCoordinates.splice(i, i + 2);
          return;
        }
      }
    }, PREVENT_DURATION, false);
  }

  // On the first call, attaches some event handlers. Then whenever it gets called, it creates a
  // zone around the touchstart where clicks will get busted.
  function preventGhostClick(x, y) {
    if (!touchCoordinates) {
      $rootElement[0].addEventListener('click', onClick, true);
      $rootElement[0].addEventListener('touchstart', onTouchStart, true);
      touchCoordinates = [];
    }

    lastPreventedTime = Date.now();

    checkAllowableRegions(touchCoordinates, x, y);
  }

  // Actual linking function.
  return function(scope, element, attr) {
    var clickHandler = $parse(attr.ngClick),
        tapping = false,
        tapElement,  // Used to blur the element after a tap.
        startTime,   // Used to check if the tap was held too long.
        touchStartX,
        touchStartY;

    function resetState() {
      tapping = false;
      element.removeClass(ACTIVE_CLASS_NAME);
    }

    element.on('touchstart', function(event) {
      tapping = true;
      tapElement = event.target ? event.target : event.srcElement; // IE uses srcElement.
      // Hack for Safari, which can target text nodes instead of containers.
      if (tapElement.nodeType == 3) {
        tapElement = tapElement.parentNode;
      }

      element.addClass(ACTIVE_CLASS_NAME);

      startTime = Date.now();

      // Use jQuery originalEvent
      var originalEvent = event.originalEvent || event;
      var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
      var e = touches[0];
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    });

    element.on('touchcancel', function(event) {
      resetState();
    });

    element.on('touchend', function(event) {
      var diff = Date.now() - startTime;

      // Use jQuery originalEvent
      var originalEvent = event.originalEvent || event;
      var touches = (originalEvent.changedTouches && originalEvent.changedTouches.length) ?
          originalEvent.changedTouches :
          ((originalEvent.touches && originalEvent.touches.length) ? originalEvent.touches : [originalEvent]);
      var e = touches[0];
      var x = e.clientX;
      var y = e.clientY;
      var dist = Math.sqrt(Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2));

      if (tapping && diff < TAP_DURATION && dist < MOVE_TOLERANCE) {
        // Call preventGhostClick so the clickbuster will catch the corresponding click.
        preventGhostClick(x, y);

        // Blur the focused element (the button, probably) before firing the callback.
        // This doesn't work perfectly on Android Chrome, but seems to work elsewhere.
        // I couldn't get anything to work reliably on Android Chrome.
        if (tapElement) {
          tapElement.blur();
        }

        if (!angular.isDefined(attr.disabled) || attr.disabled === false) {
          element.triggerHandler('click', [event]);
        }
      }

      resetState();
    });

    // Hack for iOS Safari's benefit. It goes searching for onclick handlers and is liable to click
    // something else nearby.
    element.onclick = function(event) { };

    // Actual click handler.
    // There are three different kinds of clicks, only two of which reach this point.
    // - On desktop browsers without touch events, their clicks will always come here.
    // - On mobile browsers, the simulated "fast" click will call this.
    // - But the browser's follow-up slow click will be "busted" before it reaches this handler.
    // Therefore it's safe to use this directive on both mobile and desktop.
    element.on('click', function(event, touchend) {
      scope.$apply(function() {
        clickHandler(scope, {$event: (touchend || event)});
      });
    });

    element.on('mousedown', function(event) {
      element.addClass(ACTIVE_CLASS_NAME);
    });

    element.on('mousemove mouseup', function(event) {
      element.removeClass(ACTIVE_CLASS_NAME);
    });

  };
}]);

/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngSwipeLeft
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * To disable the mouse click and drag functionality, add `ng-swipe-disable-mouse` to
 * the `ng-swipe-left` or `ng-swipe-right` DOM Element.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeLeftExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeLeftExample', ['ngTouch']);
      </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name ngSwipeRight
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeRightExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeRightExample', ['ngTouch']);
      </file>
    </example>
 */

function makeSwipeDirective(directiveName, direction, eventName) {
  ngTouch.directive(directiveName, ['$parse', '$swipe', function($parse, $swipe) {
    // The maximum vertical delta for a swipe should be less than 75px.
    var MAX_VERTICAL_DISTANCE = 75;
    // Vertical distance should not be more than a fraction of the horizontal distance.
    var MAX_VERTICAL_RATIO = 0.3;
    // At least a 30px lateral motion is necessary for a swipe.
    var MIN_HORIZONTAL_DISTANCE = 30;

    return function(scope, element, attr) {
      var swipeHandler = $parse(attr[directiveName]);

      var startCoords, valid;

      function validSwipe(coords) {
        // Check that it's within the coordinates.
        // Absolute vertical distance must be within tolerances.
        // Horizontal distance, we take the current X - the starting X.
        // This is negative for leftward swipes and positive for rightward swipes.
        // After multiplying by the direction (-1 for left, +1 for right), legal swipes
        // (ie. same direction as the directive wants) will have a positive delta and
        // illegal ones a negative delta.
        // Therefore this delta must be positive, and larger than the minimum.
        if (!startCoords) return false;
        var deltaY = Math.abs(coords.y - startCoords.y);
        var deltaX = (coords.x - startCoords.x) * direction;
        return valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }

      var pointerTypes = ['touch'];
      if (!angular.isDefined(attr['ngSwipeDisableMouse'])) {
        pointerTypes.push('mouse');
      }
      $swipe.bind(element, {
        'start': function(coords, event) {
          startCoords = coords;
          valid = true;
        },
        'cancel': function(event) {
          valid = false;
        },
        'end': function(coords, event) {
          if (validSwipe(coords)) {
            scope.$apply(function() {
              element.triggerHandler(eventName);
              swipeHandler(scope, {$event: event});
            });
          }
        }
      }, pointerTypes);
    };
  }]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
makeSwipeDirective('ngSwipeRight', 1, 'swiperight');



})(window, window.angular);

},{}],15:[function(require,module,exports){
require('./angular-touch');
module.exports = 'ngTouch';

},{"./angular-touch":14}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2NvbnRyb2xsZXJzL29yZ2NoYXJ0Q29udHJvbGxlci5qcyIsImFwcC9jb250cm9sbGVycy9zZWFyY2hDb250cm9sbGVyLmpzIiwiYXBwL2RpcmVjdGl2ZXMuanMiLCJhcHAvc2VydmljZXMuanMiLCJhcHAvdmVuZG9yL2FuZ3VsYXItY2FjaGUtMi4zLjQubWluLmpzIiwiYXBwL3ZlbmRvci9hbmd1bGFyLWVsbGlwc2lzLmpzIiwiYXBwL3ZlbmRvci9jYW52YXMtYWxsLmpzIiwiYXBwL3ZlbmRvci9zaGFrZS5qcyIsIm5vZGVfbW9kdWxlcy9hbmd1bGFyLWFuaW1hdGUvYW5ndWxhci1hbmltYXRlLmpzIiwibm9kZV9tb2R1bGVzL2FuZ3VsYXItYW5pbWF0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hbmd1bGFyLXNhbml0aXplL2FuZ3VsYXItc2FuaXRpemUuanMiLCJub2RlX21vZHVsZXMvYW5ndWxhci1zYW5pdGl6ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hbmd1bGFyLXRvdWNoL2FuZ3VsYXItdG91Y2guanMiLCJub2RlX21vZHVsZXMvYW5ndWxhci10b3VjaC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeHdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6c0hBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3FCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwbkJBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3ZlbmRvci9jYW52YXMtYWxsJyk7XG5yZXF1aXJlKCdhbmd1bGFyLWFuaW1hdGUnKTtcbnJlcXVpcmUoJ2FuZ3VsYXItc2FuaXRpemUnKTtcbnJlcXVpcmUoJ2FuZ3VsYXItdG91Y2gnKTtcbnJlcXVpcmUoJy4vdmVuZG9yL3NoYWtlLmpzJyk7XG5yZXF1aXJlKCcuL3ZlbmRvci9hbmd1bGFyLWNhY2hlLTIuMy40Lm1pbicpO1xudmFyIG9yZ2NoYXJ0ID0gcmVxdWlyZSgnLi9jb250cm9sbGVycy9vcmdjaGFydENvbnRyb2xsZXInKTtcbnZhciBzZWFyY2ggPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3NlYXJjaENvbnRyb2xsZXInKTtcbnZhciBzZXJ2aWNlcyA9IHJlcXVpcmUoJy4vc2VydmljZXMnKTtcbnZhciBkaXJlY3RpdmVzID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVzLmpzJyk7XG52YXIgZWxsaXBzaXMgPSByZXF1aXJlKCcuL3ZlbmRvci9hbmd1bGFyLWVsbGlwc2lzLmpzJyk7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdvcmdjaGFydCcsIFtcbiAgICAnbmdTYW5pdGl6ZScsXG4gICAgJ25nQW5pbWF0ZScsXG4gICAgJ25nVG91Y2gnLFxuICAgICdvcmdjaGFydC5jb250cm9sbGVycycsXG4gICAgJ29yZ2NoYXJ0LnNlcnZpY2VzJyxcbiAgICAnb3JnY2hhcnQuZGlyZWN0aXZlcycsXG4gICAgJ2ptZG9icnkuYW5ndWxhci1jYWNoZSdcbiAgXSk7XG5tb2R1bGUuY29udHJvbGxlcignb3JnY2hhcnRDb250cm9sbGVyJywgW1xuICAnJHNjb3BlJyxcbiAgJ3NoYXJlZEZ1bmN0aW9ucycsXG4gICdvcmdDaGFydENhY2hlU2VydmljZScsXG4gIGZ1bmN0aW9uICgkc2NvcGUsIHNoYXJlZEZ1bmN0aW9ucywgb3JnQ2hhcnRDYWNoZVNlcnZpY2UpIHtcbiAgICAvL2RlZmF1bHRzXG4gICAgJHNjb3BlLmluY2x1ZGVQYXRoID0gJy4uL3ZpZXdzL2luY2x1ZGVzLyc7XG4gICAgJHNjb3BlLmluaXRpYWxMb2FkRmxhZyA9IHRydWU7XG4gICAgLy8gSW5jbHVkZWQgYXMgcGFydCBvZiBmaXggZm9yIDcuMC42IG1hbmFnZXIgc2Nyb2xsIGJ1Z1xuICAgICRzY29wZS5saXN0VG9nZ2xlRmxhZyA9IHRydWU7XG4gICAgJHNjb3BlLmVsbGlwc2lzRmxhZyA9IGZhbHNlO1xuICAgICRzY29wZS5zZWFyY2hGbGFnID0gZmFsc2U7XG4gICAgJHNjb3BlLmV4cGlyZWRUb2tlbkZsYWcgPSBmYWxzZTtcbiAgICAkc2NvcGUuZW1wbG95ZWUgPSB7fTtcbiAgICB2YXIgbWU7XG4gICAgJHNjb3BlLnNlYXJjaENsaWNrID0gZnVuY3Rpb24gKGVtcGxveWVlKSB7XG4gICAgICBpZiAodHlwZW9mIGVtcGxveWVlLmlkID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIE5vLW9wLiAgVGhlIHNlYXJjaCB0ZXJtIGlzIGludmFsaWQuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChlbXBsb3llZS5pZCAhPSAkc2NvcGUuZW1wbG95ZWUuaWQgfHwgZW1wbG95ZWUuaWQgIT0gbWUuaWQpIHtcbiAgICAgICAgLy8gU2VhcmNoIGZvciBuZXcgZW1wbG95ZWUuICBEbyB0aGUgdGhpbmdzLlxuICAgICAgICAkc2NvcGUuZ2V0RW1wbG95ZWUoZW1wbG95ZWUpO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnRvZ2dsZVNlYXJjaCgpO1xuICAgIH07XG4gICAgJHNjb3BlLnJlcGFpbnRWaWV3ID0gZnVuY3Rpb24gKGVtcGxveWVlKSB7XG4gICAgICBpZiAoJHNjb3BlLmluaXRpYWxMb2FkRmxhZykge1xuICAgICAgICAvL1xuICAgICAgICAkc2NvcGUudG9nZ2xlTGlzdFZpZXcoKTtcbiAgICAgICAgLy8gSW5jbHVkZWQgYXMgcGFydCBvZiBmaXggZm9yIDcuMC42IG1hbmFnZXIgc2Nyb2xsIGJ1Z1xuICAgICAgICAkc2NvcGUuaW5pdGlhbExvYWRGbGFnID0gZmFsc2U7ICAvL1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9uU2VydmljZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09IDQwMSkge1xuICAgICAgICAkc2NvcGUuZXhwaXJlZFRva2VuRmxhZyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PSA0MDQgJiYgdHlwZW9mIG1lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG9yZ0NoYXJ0Q2FjaGVTZXJ2aWNlLmdldEVtcGxveWVlKCdtYXJjYkBzYWxlc2ZvcmNlLmNvbScpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBtZSA9IGRhdGE7XG4gICAgICAgICAgJHNjb3BlLmVtcGxveWVlID0gZGF0YTtcbiAgICAgICAgICAkc2NvcGUuZW1wbG95ZWVUaXRsZSA9IGRhdGEudGl0bGU7XG4gICAgICAgICAgJHNjb3BlLnJlcGFpbnRWaWV3KGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgICRzY29wZS5nZXRFbXBsb3llZSA9IGZ1bmN0aW9uIChlbXBsb3llZSkge1xuICAgICAgLy8gVXBkYXRlIGVtcGxveWVlIG9iamVjdCB3aXRoIHdoYXRldmVyIGluZm8gd2UgYWxyZWFkeSBoYXZlIGZvciB0aGUgbmV3IGVtcGxveWVlXG4gICAgICAkc2NvcGUuZW1wbG95ZWUgPSBlbXBsb3llZTtcbiAgICAgICRzY29wZS5lbXBsb3llZVRpdGxlID0gZW1wbG95ZWUudGl0bGU7XG4gICAgICB2YXIgaWQgPSBlbXBsb3llZS5lbWFpbDtcbiAgICAgIC8vIFRoZW4gcmVxdWVzdCB0aGUgZnVsbCBlbXBsb3llZSBvYmplY3RcbiAgICAgIG9yZ0NoYXJ0Q2FjaGVTZXJ2aWNlLmdldEVtcGxveWVlKGlkKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICRzY29wZS5lbXBsb3llZSA9IGRhdGE7XG4gICAgICAgICRzY29wZS5lbXBsb3llZVRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAgIH0sIG9uU2VydmljZUVycm9yKTtcbiAgICB9O1xuICAgICRzY29wZS5oYXNSZXBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHJlcG9ydHNDb3VudCA9ICRzY29wZS5lbXBsb3llZS5kaXJlY3RSZXBvcnRzO1xuICAgICAgaWYgKHR5cGVvZiByZXBvcnRzQ291bnQgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcG9ydHNDb3VudC5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgJHNjb3BlLnNob3dSZXBvcnRzU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHJlcG9ydHNDb3VudCA9ICRzY29wZS5lbXBsb3llZS5kaXJlY3RSZXBvcnRzO1xuICAgICAgaWYgKHR5cGVvZiByZXBvcnRzQ291bnQgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcG9ydHNDb3VudC5sZW5ndGggLSA4ID4gMDtcbiAgICB9O1xuICAgICRzY29wZS5oYXNQZWVyID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xuICAgICAgdmFyIHBlZXJzID0gJHNjb3BlLmVtcGxveWVlLnBlZXJzO1xuICAgICAgaWYgKHR5cGVvZiBwZWVycyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGVlcnMubGVuZ3RoID4gMDtcbiAgICB9O1xuICAgICRzY29wZS5nZXRSaWdodFBlZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZ2V0UGVlcigncmlnaHQnKTtcbiAgICB9O1xuICAgICRzY29wZS5nZXRMZWZ0UGVlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5nZXRQZWVyKCdsZWZ0Jyk7XG4gICAgfTtcbiAgICAkc2NvcGUuZ2V0UGVlciA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBjdXJyZW50RW1wbG95ZWUgPSAkc2NvcGUuZW1wbG95ZWUubmFtZTtcbiAgICAgIHZhciBwZWVycyA9ICRzY29wZS5lbXBsb3llZS5wZWVycztcbiAgICAgIHBlZXJzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9KTtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT0gJ2xlZnQnKSB7XG4gICAgICAgIHBlZXJzLnJldmVyc2UoKTtcbiAgICAgIH1cbiAgICAgIHZhciBwZWVyO1xuICAgICAgdmFyIGxlZnRQZWVyRm91bmQgPSB0cnVlO1xuICAgICAgdmFyIHJpZ2h0UGVlckZvdW5kID0gdHJ1ZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG4gPSBwZWVyc1tpXS5uYW1lLmxvY2FsZUNvbXBhcmUoY3VycmVudEVtcGxveWVlKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSAnbGVmdCcpIHtcbiAgICAgICAgICBpZiAobiA9PSAtMSkge1xuICAgICAgICAgICAgbGVmdFBlZXJGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICBwZWVyID0gcGVlcnNbaV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGVmdFBlZXJGb3VuZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobiA9PSAxKSB7XG4gICAgICAgICAgICByaWdodFBlZXJGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICBwZWVyID0gcGVlcnNbaV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRQZWVyRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghbGVmdFBlZXJGb3VuZCAmJiBkaXJlY3Rpb24gPT0gJ2xlZnQnKSB7XG4gICAgICAgIHBlZXIgPSBwZWVyc1swXTtcbiAgICAgIH1cbiAgICAgIGlmICghcmlnaHRQZWVyRm91bmQgJiYgZGlyZWN0aW9uID09ICdyaWdodCcpIHtcbiAgICAgICAgcGVlciA9IHBlZXJzWzBdO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBwZWVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAkc2NvcGUuZ2V0RW1wbG95ZWUocGVlcik7XG4gICAgICB9XG4gICAgfTtcbiAgICAkc2NvcGUudG9nZ2xlU2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnNlYXJjaEZsYWcgPSAhJHNjb3BlLnNlYXJjaEZsYWc7XG4gICAgfTtcbiAgICAkc2NvcGUudG9nZ2xlUGhvbmVTZWxlY3RvciA9IGZ1bmN0aW9uIChvYmpMZW5ndGgpIHtcbiAgICAgIHZhciBwaG9uZU9iamVjdCA9ICRzY29wZS5lbXBsb3llZS5waG9uZXM7XG4gICAgICBpZiAocGhvbmVPYmplY3QubGVuZ3RoID4gMSkge1xuICAgICAgICAkc2NvcGUucGhvbmVTZWxlY3RvckZsYWcgPSAhJHNjb3BlLnBob25lU2VsZWN0b3JGbGFnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwaG9uZU9iamVjdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICRzY29wZS5jYWxsRW1wbG95ZWUocGhvbmVPYmplY3RbaV0udmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICAkc2NvcGUudG9nZ2xlRXhwaXJlZFRva2VuT3ZlcmxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5leHBpcmVkVG9rZW5GbGFnID0gISRzY29wZS5leHBpcmVkVG9rZW5GbGFnO1xuICAgIH07XG4gICAgJHNjb3BlLnRvZ2dsZUxpc3RWaWV3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmxpc3RUb2dnbGVGbGFnID0gISRzY29wZS5saXN0VG9nZ2xlRmxhZztcbiAgICB9O1xuICAgICRzY29wZS5jYWxsRW1wbG95ZWUgPSBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICB3aW5kb3cudG9wLmxvY2F0aW9uID0gJ3RlbDonICsgbnVtYmVyO1xuICAgIH07XG4gICAgJHNjb3BlLmVtcGxveWVlRm9jdXNEZXRhaWwgPSBmdW5jdGlvbiAodmlld2ZsYWcpIHtcbiAgICAgIGlmICh2aWV3ZmxhZyA9PSB0cnVlKSB7XG4gICAgICAgICRzY29wZS50b2dnbGVMaXN0VmlldygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCRzY29wZS5lbXBsb3llZSAmJiAkc2NvcGUuZW1wbG95ZWUuaWQpIHtcbiAgICAgICAgICBTZmRjLmNhbnZhcy5jbGllbnQucHVibGlzaChjYW52YXNDb250ZXh0LmNsaWVudCwge1xuICAgICAgICAgICAgbmFtZTogJ3MxLm5hdmlnYXRlVG9TT2JqZWN0JyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgICAgcmVjb3JkSWQ6ICRzY29wZS5lbXBsb3llZS5pZCxcbiAgICAgICAgICAgICAgdmlldzogJ2RldGFpbCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgJHNjb3BlLnNlbmRUb2tlbkV4cGlyZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBTZmRjLmNhbnZhcy5jbGllbnQucmVwb3N0KHsgcmVmcmVzaDogdHJ1ZSB9KTtcbiAgICB9O1xuICAgICRzY29wZS5oYXNPdmVyZmxvdyA9IGZ1bmN0aW9uIChkaXJlY3RSZXBvcnRzU2l6ZSkge1xuICAgICAgcmV0dXJuIGRpcmVjdFJlcG9ydHNTaXplID4gOCA/ICdoYXNPdmVyZmxvdycgOiAnbm9PdmVyZmxvdyc7XG4gICAgfTtcbiAgICAkc2NvcGUucmVkdWNlU2VhcmNoUmVzdWx0cyA9IGZ1bmN0aW9uIChzZWFyY2hSZXN1bHRzKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2VhcmNoUmVzdWx0cykpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgcmVzdWx0VWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoUmVzdWx0V3JhcHBlcicpLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdVTCcpO1xuICAgICAgICB2YXIgcmVzdWx0TGkgPSAzMjtcbiAgICAgICAgdmFyIGVsZUhlaWdodCA9IHJlc3VsdFVsWzBdLm9mZnNldEhlaWdodDtcbiAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdmFyIHNmMU5hdkJhciA9IDc0O1xuICAgICAgICAvLyBzZjFiYXIgaGVpZ2h0IGFuZCBwYWRkaW5nKDUwKSAmJiBlbGxpcHNpcygyNHB4KVxuICAgICAgICB2YXIgbGltaXQgPSAod2luZG93SGVpZ2h0IC0gc2YxTmF2QmFyKSAvIHJlc3VsdExpO1xuICAgICAgICBpZiAoZWxlSGVpZ2h0ID49IHdpbmRvd0hlaWdodCAmJiBzZWFyY2hSZXN1bHRzLmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgICAgIHZhciBjb3VudCA9IDE7XG4gICAgICAgICAgLy9zdGFydCBpbmRleCBAIDFcbiAgICAgICAgICBzZWFyY2hSZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIGlmIChjb3VudCA8PSBNYXRoLmZsb29yKGxpbWl0KSkge1xuICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAkc2NvcGUuZWxsaXBzaXNGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSBzZWFyY2hSZXN1bHRzO1xuICAgICAgICAgICRzY29wZS5lbGxpcHNpc0ZsYWcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbWdyRGV0YWlsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hbmFnZXJEZXRhaWwnKTtcbiAgICAgIHZhciBlbXBEZXRhaWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW1wbG95ZWVEZXRhaWwnKTtcbiAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ292ZXJsYXknKTtcbiAgICAgIHZhciBwaG9uZVNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaG9uZVNlbGVjdG9yJyk7XG4gICAgICB2YXIgc3RhcnRpbmdQb2ludDtcbiAgICAgIHZhciBjdXJyZW50VXNlckVtYWlsID0gY2FudmFzQ29udGV4dC5jb250ZXh0LnVzZXIuZW1haWw7XG4gICAgICAvL2FzeW5jIGxvYWRpbmcgdGhlIGluaXRpYWwgbW9kZWxcbiAgICAgIG9yZ0NoYXJ0Q2FjaGVTZXJ2aWNlLm1lKGN1cnJlbnRVc2VyRW1haWwpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmVtcGxveWVlID0gZGF0YTtcbiAgICAgICAgJHNjb3BlLmVtcGxveWVlVGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgICAgICBtZSA9IGRhdGE7XG4gICAgICAgICRzY29wZS5yZXBhaW50VmlldyhkYXRhKTsgIC8vIEluY2x1ZGVkIGFzIHBhcnQgb2YgZml4IGZvciA3LjAuNiBtYW5hZ2VyIHNjcm9sbCBidWdcbiAgICAgIH0sIG9uU2VydmljZUVycm9yKTtcbiAgICAgIC8vIFN3YWxsb3cgdG91Y2htb3ZlIGV2ZW50cyBpbiB0aGUgZW1wbG95ZWUgYXJlYS5cbiAgICAgIGVtcERldGFpbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgICAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgICAgcGhvbmVTZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcbiAgICAgIG1nckRldGFpbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHN0YXJ0aW5nUG9pbnQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuICAgICAgfSk7XG4gICAgICBtZ3JEZXRhaWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBuZXh0UG9pbnQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuICAgICAgICBpZiAoc3RhcnRpbmdQb2ludCA+IG5leHRQb2ludCAmJiBtZ3JEZXRhaWwuc2Nyb2xsVG9wIDw9IDApIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGluZ1BvaW50IDwgbmV4dFBvaW50ICYmIG1nckRldGFpbC5jbGllbnRIZWlnaHQgKyBtZ3JEZXRhaWwuc2Nyb2xsVG9wID49IG1nckRldGFpbC5zY3JvbGxIZWlnaHQpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzaGFrZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCRzY29wZS5lbXBsb3llZSAhPSBtZSkge1xuICAgICAgICAgICRzY29wZS5lbXBsb3llZSA9IG1lO1xuICAgICAgICAgICRzY29wZS5lbXBsb3llZVRpdGxlID0gbWUudGl0bGU7XG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfTtcbiAgICBpbml0KCk7XG4gIH1cbl0pOyIsIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnb3JnY2hhcnQuY29udHJvbGxlcnMnLCBbXSk7XG5hcHAuY29udHJvbGxlcignc2VhcmNoQ29udHJvbGxlcicsIFtcbiAgJyRzY29wZScsXG4gICckdGltZW91dCcsXG4gICdTZWFyY2gnLFxuICAnJHNjZScsXG4gICdzaGFyZWRGdW5jdGlvbnMnLFxuICBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCwgU2VhcmNoLCAkc2NlLCBzaGFyZWRGdW5jdGlvbnMpIHtcbiAgICAkc2NvcGUuc2VhcmNoRW1wbG95ZWUgPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nKSB7XG4gICAgICBTZWFyY2guZ2V0U2VhcmNoKHsgc2VhcmNoOiBzZWFyY2hTdHJpbmcgfSkudGhlbihvblN1Y2Nlc3MsIG9uRXJyb3IpO1xuICAgICAgZnVuY3Rpb24gb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAkc2NvcGUuc2VhcmNoID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgY3VyclNlYXJjaFN0cmluZyA9ICRzY2UudHJ1c3RBc0h0bWwoJzxzcGFuIGNsYXNzPVwidW5rbm93blNlYXJjaFwiPicgKyBzZWFyY2hTdHJpbmcgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICRzY29wZS5zZWFyY2ggPSBbe1xuICAgICAgICAgICAgICAnaWQnOiAkc2NvcGUuZW1wbG95ZWUuaWQsXG4gICAgICAgICAgICAgICduYW1lJzogY3VyclNlYXJjaFN0cmluZyArICcgaXMgbm90IGZvdW5kJ1xuICAgICAgICAgICAgfV07XG4gICAgICAgIH1cbiAgICAgICAgc2hhcmVkRnVuY3Rpb25zLnRvZ2dsZVNlYXJjaERpc3BsYXkoJ2ZsZXgnKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIG9uRXJyb3IocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PSA0MDEpIHtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlU2VhcmNoKCk7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZUV4cGlyZWRUb2tlbk92ZXJsYXkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VhcmNoUmVzdWx0V3JhcHBlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2hSZXN1bHRXcmFwcGVyJyk7XG4gICAgICBzZWFyY2hSZXN1bHRXcmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBpbml0KCk7XG4gIH1cbl0pOyIsIid1c2Ugc3RyaWN0JztcbnZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnb3JnY2hhcnQuZGlyZWN0aXZlcycsIFtcbiAgICAnb3JnY2hhcnQuc2VydmljZXMnLFxuICAgICduZ0FuaW1hdGUnXG4gIF0pO1xubW9kdWxlLmRpcmVjdGl2ZSgnYW5pbWF0ZU9uUGhvdG8nLCBbXG4gICckYW5pbWF0ZScsXG4gIGZ1bmN0aW9uICgkYW5pbWF0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2NvcGUsIGVsZSwgYXR0cikge1xuICAgICAgYXR0ci4kb2JzZXJ2ZSgnYW5pbWF0ZU9uUGhvdG8nLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGFuaW1hdGlvbkNsYXNzID0gYXR0ci5hbmltYXRlTmFtZTtcbiAgICAgICAgdmFyIGRlZmF1bHRJbWFnZVVSTCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQU1nQUFBRElDQU1BQUFDYWhsNnNBQUFEQUZCTVZFVlFqclJWbjgxUm1zZE1rYjJCcmN0TmxjS1R1dFIxcmRHaXhOeExqN3BVbjg5SWk3Uk5sOFJxb2NSVG9kQ3h6ZUxCM2ZKU25NcTUwdVpQbWNaUG04bDdxY2xSbnM3UDRPK1h1OVJPbWNhSHNjNjcxZWk1MmZGTWxjR0x0ZEZRbWNoem84Sk9sY0ZPbU1aS2pyaXkxT3hGaGExYWxibExrNzVGaHE1cW1ydFRuY3BYbThhMDBPWFI0dkZpbXI3RTJlcDZ0dDFnbUxyTjN1MUdoNjlmcDlYTTR2TklpYktyeU41VG5zeWR3ZHVIdnVKbm5zQ1V3K1JFaHE5S2tieVp4dWJJM2UxUGw4UlVuODJzeStIZjcvNUVoS3RIaWJKSmpMWkRnYWlpek9sSmo3bFNuTWgxczl0ZW44ZlY2UGxUbGI1bnE5WEwzT3VueDkxRWdxaEpqYmRYb2RDLzJPeVF0OUtCdXQ3RjNPNTJwc1ZQbDhKS2piZFFpcTdEMnV5Y3lPZkk0ZlZJaXJPYXZ0aGdsYlpNakxOWWtiVmlxZFZ3bjc2RXM5S3AwT3l3eTkvRTRQUlBtTVpWb005YnBkTmFwZFRiN1B6UTVmWEIyT3BObE1MUTUvbEdoS3JCMXVkTGtMdDZyOUpObHNPZXl1aERocTl0cjlsd3E4L1g2dnZNNC9WSmlySFE0dkxKM3ZCVWtMVkxrcjNWNXZiTjVmaE1oNnpJMnVxKzErbWd3TmRJaGF0Rmc2bFlwTkpYcE5MYTZ2bmI2L3JVNWZSVG9kTFQ1UFBRNGZEYzdQdlo2ZmpPMys1VW9kTGQ3ZnpWNXZYZTd2M1g1L2JNM2V6UzQvTFc1dlhZNmZqVjVmVFU1UFBXNS9iWTZQZFNvTkRUNC9KVG9OQlJvTS9YNlBmWjZ2bFNuOURhNi9yUzR2SFE0TzlRbmN6YjdQdlAzKzVSbjgvYzdmeFNuOC9PM3UxUW5zMVNvTS9SNGZCUm5jeFdvdEZMbE1CUm1zaFZvZEJSbmN0TWxNQk1sTUZSbnMxUW04bFZvdEJIaUxGVW9NNVBtOHBXb3RCUm44NVRvTkZTbnM1U244NVdvZEJRbk1wUG5NcFZvZEZMbE1GRGdhZFVvTkJQbXNoT2w4UlRuOUJRbmN0U25jMVFtOHRTbnN4TWs3OVJtY1ZUbnM5Um5jMVBuTXRSbk10TWxNSlZvOUpEZ3FsSmpiaEZoNjlPbHNMRzIreEZoN0JacE5MUTRmRllwZE5TbmN6VzUvZE9rYm5TNC9OOHVON080UEJRbGNGdXFNeENoYTVVb3RKVG9kRldvOUpWb3RKWG85SlNvTkZacGROU29kRlJvTkZhcGROWnBOTllwTk9haVNlTUFBQU5CMGxFUVZSNEFlelBVYXJDUUF3RjBPd2ZtajNPYjc4elEwbTVFNnNpdGo1L2haZHd6dzZPN0JjMmxva0U1akpzdjVEelluTWs0cHQ5alhSRk90ci9SaHBTYXA4UlJWSjZqUVRTaW5Na2tGaThJNHJVOUJWcFNLNDlJeDNwOVVkRWtaN2VJNFlDN0lnTUwyQWNrZFVMV0hjeEw4RmtlQWxEMUV0UUNTOGh4SXRnNUwrUldRUWpQOFFJSTR3d3dnZ2pqREFTUlRCeXdnZ2pqREF5YjlUUnNZcURNQnlBOFZmd0FUTDJBVHBra29DTGl4Q2tvNXRPZ2dpeFE2Y1N2TTFOemVJZ1dXNHVIUXErVkRrT3VwYkN5UTIzZERudW11UWY0KzhOUHI2SzRSK01WZXNNd1Z0U2VBY1pQcGt5RlBuOHNhSVFuRVNsREg5Um80RE9hd2pKZlRTRmY0aUxXK1YyeU9PMjJjdC9PVVRjM1JCTUd2a0NkSnVkRE1uVFdMNG84MmZuUW5CUVN3Vmw0bGlJMzBoRmlKc0phUTNvT0pMcXBpTnI5WmtJdVpKNjFKSlJKMEoyYU5TMUQ3NldEOWtlUmdQUXJsczI1SU1Nb3hFTlhUU0VGYU1wdFgvWEN1bDBZRFFaUkRvTldpSFl1d3dtcFF1RjVPVmcyQkUrQlBMSGszU0JFSVlHQUVRNTVLNXFjeGtnSkhjMXlpSHBCVVpON1lZa0FzcGJiak9FeHdJTXV0b0xZWjRBRk5nTE9RcElKMm9yaEo0RnFJelpDV0hsR1ZocUp5UTQ5Y0RldVkyUTNXY1BUV3hzaEJTOUJRbDhDRC9aQ1BGYW1KQnZic3JvcGFrb0RPRGJ4ZVlJcHQzVlFMUUdpeGgwN2hqdFlYRkZwWGIyRkdzUmdjNFZXTWlLWHU1RGJ3TVpvZUtERmNnUWZKREJyRHNFK3hOa2Uya2U5aklJckxlOUtqNGtVaDdRMTA0cTV1N1pPZHZnbnZQZzcvbkg5OTBmMzg0MkNiVmFyVjZ2WitKTFVwZ2s2elpQRUJRUy9pcUZwV3ZqZGJKUVlJaDdSUkwzeGdXRi9Lc3duRy8ySlhXVWJ0WUp6Yjh1RzBKcXRkTU81K2lLTko2T2s1VmtzWmlRVjl6ZGEvMis0QloyaFAxcHJ0UkRwRXpZUDhVUGVXbDBGWExVRWRWcXRWS3B3RWJ2R285UUJKOHg1b3V5Sk8rNWhJbkU0WDNkTUNwa01RazVhaytISWFRQ1FhaDgrc0RiN0pyQi81bGZiQzFOajEyUUhFT2NjU3VQSVVSazhTYkI3cENQVVY0SGJzSXgwYktqV2NvUWlja2pwN0NRdXlVMm9SbmNUREJQT1J2ZU1hdTB6SjRZUmZhSEdBaEJBQm9EN0syRklMYmlva01pbEpRcXNjbEJhQmdHLzVsMGV4R0VkQUJpaSt5bGNVemhNSzFTZnd0cGdUMXpGRUNFa0lDUTVBWWJINllKV2FVZVRCTm56N3hqZndpQ0VLaHFsaE1TeERRdXF4VEJOSDcyekhkT0FDRWt6OFMrRUVoQ0ZHVjR2OEJrRDlQMG1CWXBnMmw4QlRhNVg2Y2gvSk4wSFhJanhObUpPL25HKzkyRkZDZUI3U0c2cmlyS25NbGU2c0EwZzFacHZ0WFpDbXdlSkp4Mmh3Q1F1SzRWT0l4Z0dyZFY4bUNhNlFLVFVralJkZDB3REh0REdzbDlrMDBLMDZTdGtndlRUSmxzMHQrQWdKQWZIcE5EZWdkYm9mMjVMVW9hTVRua2JiK0lycXBLN1BDSnlXRVFXNWdaNmtEQ1hwTkhBZ0NBRUtwVXEvYUZOR0s1SW8vWklHN0czMHFLV0tSQjdzeFZUVWhJYjVGTHV2ay95V2UybEY0M1M2djhtYmFIQUJMeUlsdms4OUNEejlsTE1UNXg3b0swUXlUWklZbEVZemU3Mm81bllYekNsbStpQStuNTRrSzdnUnBRVlNnL2hERGxUdmtINHJOOEtYMGlSZHRQTXpWVlFvZ011Z2c1N2dpMVhJNEZzcCtsbzVYTFpWM1hyL2IxZlQvbTAwMUk3NlVKeVV2SC9oQkZpUVZ5OGtNYVp5SGIyemFHWERtOEpDRUJqL3lRbUlpUVc4a3Zza25IRkVXeC95TGF1dXdRNzA4aElYOStMOHNsN3haemtVQW9MN25FZjF0SXlPN3dzbVJ5Z2k3eTlrQnV4NEcySythTkpOYzUvR1hPZmtMYXlOczRnSXVUeVdzWUdpRkQwcENBalE1UkEycElCd3hCM2xDUS9NRkxxUk1ReEN4TVZWekVVOFVPdWJXdmduK2EwMHVnWHRxYjYwRXN2R0JSSVNRNjVOS1JITEpPU0RKckdiR2JMRkw2MG03Yit6NmpkdDJ5SFIzVCtiWDd2VG8rVHo2L0o4L2szMWJBWUxBdi9xUTkzWk10VnNQa1JWYzRXeEZOWks2bTN0Ujcra25YMTJMUnBManVOelNjZmtaOHFINVJBRWNGV1hxcWx1NmU4OStxcklFZm5sNlVoeGJqdGZQdkhJZlVML3dYc29rTXI2djFISHovV1daZHh2NHZhUjQ2bXh4OXZaOWYrbisxbXNlL3ZFTUZpUityTmYzU0R3WmpQY01PWTVOL3NzdHA2ZW9mRExRWXJyWG52bkRaWTdXYS9hM0lKc0w0MVpwYTM5ZWQvNmdlRGtCUXZOY0NTTUc2cmhKajNZNEd0WkxIdDlGQm1QbWJLbDFyRCtxRnFKNU5FL1VPQVNTZFBvRXdkN3RWRXFqVDhXQlJwZUQ2NzlMNVJNeG12U0crZFRYSjNWeGRqbjYxZXZmZVNPK3VBdm1nS1hJNkxlSTRRSmptYnJWWStxN00rSFY0VWEzYStvK2NoT01pUUFSQktKck55NWM4UXUyUUtSeVhDSUp3ZGF2SE10VDNtM2JGMkhDZ3BsN3IxbTB1VzYyS1BNOERaRlZuQ001eDNJeGw2Nkk4OFR2Nk5EekhHbHpHcnRSRmRZNk5HQWFRS1FXeXQ0Y0NFbkp0cFM3SjJ5NjcxYWVxR2V0ekJKeVgxcWpkUmdlcFZrOGd5YTZVcGpnSGh3eXVub1ovZndLRXgvdUdIWGNudlNrdDJYSmdHSWFMb2dMWjB4T1M0WGtTSUZBOXhIaFNWOHJiMmozbm92ZFc2a3E1OTJadWJnNGdwQ3pMeUNCTVV3cDVyTEZ2QVptOWc5clJQNElLVXBIbFJsRVVvVG8xTXRKcGVJWTJ0M29vS3B2TmlpU1p6bVF5eGRWVjgvSXlDZ2lkbkx5T05BYnFHMEdZMlJwQ3hyTkJHaDFFeUdUU0pEa2xTWktKb2dpYUhrWUk4YzRTSE1maE9FNDJOdktWU21WVlp3aFBraVFjRTJjeXhWaTIxNGpNOGZoYWhNSXdyRnF0a3VtMExBakNLZVFESXNnTXNqVnhSSkJDS2hXNXNaR0VlV01jUnhFRXk4UXQvME1TT3h1TFViQ0xzSkdOUEs5QXpHWnc2QVhaRXdTWjU5T24rMjZLeFFpR0dmYytSaEIvWklTaU9OaEZtRDh2eTVWaXNRZ1FZS0NETUtNTCtqdWFHOWh2RDJFOE5RU091aUhMbWdMMVNySmNucHFhbXBZa3pHU2lXSlpOUmowTGVqc2lrWWdKd3lUWTlEUnNlcWtrUU9PZkljdVhSaXZrNE9BVFpIcjZUMGgwVk5jOTZXL28vVTRRcGpCdWVhNVhiaTZOOWFLSHJCYUx3dXZYOG8wYk54S3RyUktHY2RDUjd1d01SZVArNXpmMVNRc05oMk9pS0V5U3B1SEF5dVZ5U1JBTzRFVkVjZWdKS1paS0paN25weEtKNmJrNWpLSW90cmZYSFdWbWhuUmhlRjA1WlJ3Y3gwblQwMVdBeUxJc0hCd1V0VVArcXlrcmEyc2JMMSsrQkVoYkluRjRCZ21IM1ZHSXkvdjFqdVoyT2hjK2d4d2VKdHJhMnZMNXZFMFExbFpXVmw2OGVLSGhFV3FFUUQzQlpqdUJpQ0xlMFRFSEVJSmw2V1F5ZVJTZDlYLzEwK29SSFE2emtjaXJZREM0ZytNSmtpUzN0N2R0R3h1NlE2QVlERVdBNnZ2NysyMDRqa05IS2hJaHd1RndKNnlLZGVGckdGMDl1UnhMRUs5TUp0UE96ZzZNZzRRRnNkbHNLZ3FFa0NNbXZ2U2szaXdZWm5ML0dBaHNpbSt5UG9jOXpqQm9JT3FTbFRXb25pK1g5MkVYRHc4UGd4d0hsZ2hZVG03RTBZbm1xek9XMm1tYXpoRUVRUTBNQkNWSkVrVVJUcW9NOTVXMU5jV2hLRFJDUG1vTDNBWTNOemNGUVlDN2lRS0JvOE9Dd1lFekNFMjdDNFVDTStHLzJwUEszdTd1cE9IL29RcGxNZ0VrQ3hDUzUzbVkvTWJHeGlZMC9hZzFla0lnbzNhdlZvYkZFQys0TzVGQzFDbFFmVHVUNGZmM3lVUWlrZTNvd0FZR0ZBc0xGcmZiSFlJazUxMU5keTVYM0RkNlFqT2hFSjNMaFZtV29DZ3FpR0VTMUZUZTgrYnptZDNkWFRpMlZXU1FWWUJBand5Y0dRd0YzOW1SWU9kUFgxRllXRmhZZTRWVG1KK3dPKzlja0VtSGJ3WXVoRG1HVDE0OVloekhkV1N6dUNpMlFlWE05dll1OUFHSUJnZGFpSkpaMTVELy90OE5saVdIWng3K25Qek9FR1ZOZG5lMzgzbmxtNGdFam1kUDM2eEVDSUk5WFJXUWhJNlVNRXlCT1hvVUh4LzFlVHdURUkvSE56b2Juems2U3dpV0EraHdBSkZZaklMamtFN3V1MytCUURkRWtQT2gvTUZ1R1NKbkRBSlJXREFyME5VMUlMZ0ZCMERuQWoxRkw4Q2xmaE9hVEZVektGQ2NwdTkxVTlQQi9KR2RQQXN6OEdYM1czS0FCU2UrT05kRkpPZjhucEtuS20vRStTUVBhek1QbGpoeHNaRkQxM3NibzhIazZNNmRsaCtUY3Z4M2tCdmsxeE93NE1TNjd3MnFjQkNQRVZUN0JUeTRvQ0pOZ3lWc29CbldXcFB6RUJISTBXakgrc0JEOWVUY3ZRNENGQjFlVlozdnZVc3B3eGcrS240QkNtcWptVUF3MkxBQW1yTXFoSUlQb1paWGZRWnZrQ2RERVAxWjBlNzZZV0Y3bFVKYjBDL3NNUExNZ3lXZkVzeUlvSGdWSVVWcnJWN3ZxK3NncC9NNGQxdlhWVmtjV09Ec0NDSGpqaFpoZmY0a0lhaEROQ2FQUVRtb09DbHFmV3piMXlYTGI1Q1RCQ2NlQUVGN0FhUUJoS3FJY0g3bFRCWmMyR29TWWpXa2lCRWJSaWtmS2dkQWRueU83YnQ5T21hTkVJWUNPUDRGYnBTQVF6KytWT2dnWk1qU1BXUVNvWkRSNzNHOER2M1hCemx5VkNnaXJRbjV3eTNtSWUvSEdZVzgwa0dJSEdzWWhuRWNyYlhCT1JmbjJYZGQxL2M5bTkxWThJV1daWGwvYWlGT0dManB6ZkRlejlNMEdXTXNieHUyNUZnTlVnMkVFb1pGSFB2TTZtSEJYazAvMUJNREhZUVk0K1Njc1ZZUlNmRzNrTndTd3ZiSHhEaXY2OFBDTCs5REZReDQwTkNkTVNGQk1rV0RITGVNeERKcVlibklqbDdybnZLMHJtc2tCaG0zU1VIeWY1Q0VlWEMrcnd0QjJrbFBZU2ZFanFKQlRyZ3FGSUxSajR6MkZFd1lWVndLa25zUVpkbFU5bmlnWE5BZzFVSHVaL2YycSs1bmx5Qm5kMWpRSUJlclFhUU9oMXdQMGlCU2hVT0FmRmJRQnBFYUhFQXFrRWgxRUNuZW9SQXEzZ0drZElsa0VDcVlrVU9rWEVjT29YSVpDaW5USW5sZkNXQzZDNGhEVXdZQUFBQUFTVVZPUks1Q1lJST0nO1xuICAgICAgICBlbGUuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybChcXCcnICsgZGVmYXVsdEltYWdlVVJMICsgJ1xcJyknKTtcbiAgICAgICAgLy9ubyBhbmltYXRlQ2xhc3MgcGFzc2VkIGluLiBkZWZhdWx0IHRvIG5vdGhpbmcuXG4gICAgICAgIGlmICghYW5ndWxhci5pc0RlZmluZWQoYW5pbWF0aW9uQ2xhc3MpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ2xhc3MgPSAnJztcbiAgICAgICAgfVxuICAgICAgICAkYW5pbWF0ZS5yZW1vdmVDbGFzcyhlbGUsIGFuaW1hdGlvbkNsYXNzKTtcbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLnNyYyA9IGF0dHIuYW5pbWF0ZU9uUGhvdG87XG4gICAgICAgICRhbmltYXRlLmFkZENsYXNzKGVsZSwgYW5pbWF0aW9uQ2xhc3MpO1xuICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIGF0dHIuYW5pbWF0ZU9uUGhvdG8gKyAnKScpO1xuICAgICAgICB9O1xuICAgICAgICBpbWFnZS5pc0Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGVsZS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKFxcJycgKyBkZWZhdWx0SW1hZ2VVUkwgKyAnXFwnKScpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXSk7XG5tb2R1bGUuZGlyZWN0aXZlKCdzZWFyY2hXYXRjaCcsIFtcbiAgJyR0aW1lb3V0JyxcbiAgJ3NoYXJlZEZ1bmN0aW9ucycsXG4gIGZ1bmN0aW9uICgkdGltZW91dCwgc2hhcmVkRnVuY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzY29wZSwgZWxlLCBhdHRyKSB7XG4gICAgICB2YXIgc3RhcnRUaW1lciA9IGZhbHNlO1xuICAgICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgICAgdmFyIHRpbWVyT2JqO1xuICAgICAgc2NvcGUuJHdhdGNoKGF0dHIubmdNb2RlbCwgZnVuY3Rpb24gKHF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgIHNoYXJlZEZ1bmN0aW9ucy50b2dnbGVTZWFyY2hEaXNwbGF5KCdoaWRlJyk7XG4gICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChxdWVyeVN0cmluZykpIHtcbiAgICAgICAgICBpZiAocXVlcnlTdHJpbmcubGVuZ3RoID49IDMgJiYgY291bnRlciA8IDIpIHtcbiAgICAgICAgICAgIHN0YXJ0VGltZXIgPSB0cnVlO1xuICAgICAgICAgICAgY291bnRlciA9IDA7XG4gICAgICAgICAgICBpZiAoY291bnRlciA9PSAwKSB7XG4gICAgICAgICAgICAgIHNjb3BlLnN0b3BDb3VudGVyKCk7XG4gICAgICAgICAgICAgIHNjb3BlLnJ1bkNvdW50ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuc3RvcENvdW50ZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2NvcGUucnVuQ291bnRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoY291bnRlciA8IDIpIHtcbiAgICAgICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgICAgIHRpbWVyT2JqID0gJHRpbWVvdXQoc2NvcGUucnVuQ291bnRlciwgMTAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuc2VhcmNoRW1wbG95ZWUocXVlcnlTdHJpbmcpO1xuICAgICAgICAgICAgc2NvcGUuc3RvcENvdW50ZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNjb3BlLnN0b3BDb3VudGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN0YXJ0VGltZXIgPSBmYWxzZTtcbiAgICAgICAgICBjb3VudGVyID0gMDtcbiAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXJPYmopO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXSk7XG5tb2R1bGUuZGlyZWN0aXZlKCdzZWFyY2hUb2dnbGUnLCBbXG4gICckYW5pbWF0ZScsXG4gICdzaGFyZWRGdW5jdGlvbnMnLFxuICBmdW5jdGlvbiAoJGFuaW1hdGUsIHNoYXJlZEZ1bmN0aW9ucykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2NvcGUsIGVsZSwgYXR0cikge1xuICAgICAgYXR0ci4kb2JzZXJ2ZSgnc2VhcmNoVG9nZ2xlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWFuYWdlckRldGFpbEVsZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFuYWdlckRldGFpbCcpKTtcbiAgICAgICAgdmFyIG1hbmFnZXJEZXRhaWxDbGFzc09uID0gJ292ZXJmbG93U2Nyb2xsaW5nLXRvdWNoJztcbiAgICAgICAgdmFyIG1hbmFnZXJEZXRhaWxDbGFzc09mZiA9ICdvdmVyZmxvd1Njcm9sbGluZy1kZWZhdWx0JztcbiAgICAgICAgdmFyIHNlYXJjaFRvZ2dsZUVsZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoVG9nZ2xlJykpO1xuICAgICAgICB2YXIgc2VhcmNoVG9nZ2xlT24gPSAnaWNvbi11dGlsaXR5LWNsb3NlJztcbiAgICAgICAgdmFyIHNlYXJjaFRvZ2dsZU9mZiA9ICdpY29uLXV0aWxpdHktc2VhcmNoJztcbiAgICAgICAgaWYgKGF0dHIuc2VhcmNoVG9nZ2xlID09ICdmYWxzZScpIHtcbiAgICAgICAgICBtYW5hZ2VyRGV0YWlsRWxlLnJlbW92ZUNsYXNzKG1hbmFnZXJEZXRhaWxDbGFzc09mZikuYWRkQ2xhc3MobWFuYWdlckRldGFpbENsYXNzT24pO1xuICAgICAgICAgIHNlYXJjaFRvZ2dsZUVsZS5yZW1vdmVDbGFzcyhzZWFyY2hUb2dnbGVPbikuYWRkQ2xhc3Moc2VhcmNoVG9nZ2xlT2ZmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYW5hZ2VyRGV0YWlsRWxlLnJlbW92ZUNsYXNzKG1hbmFnZXJEZXRhaWxDbGFzc09uKS5hZGRDbGFzcyhtYW5hZ2VyRGV0YWlsQ2xhc3NPZmYpO1xuICAgICAgICAgIHNlYXJjaFRvZ2dsZUVsZS5yZW1vdmVDbGFzcyhzZWFyY2hUb2dnbGVPZmYpLmFkZENsYXNzKHNlYXJjaFRvZ2dsZU9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXSk7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdvcmdjaGFydC5zZXJ2aWNlcycsIFtdKTtcbnZhciBoZWFkZXJzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICdBY2Nlc3MtVG9rZW4nOiBjYW52YXNDb250ZXh0LmNsaWVudC5vYXV0aFRva2VuLFxuICAgICAgJ0luc3RhbmNlLVVybCc6IGNhbnZhc0NvbnRleHQuY2xpZW50Lmluc3RhbmNlVXJsXG4gICAgfVxuICB9O1xufTtcbi8vbG9jYWwgc3RvcmFnZSBjYWNoaW5nXG5tb2R1bGUuc2VydmljZSgnb3JnQ2hhcnRDYWNoZVNlcnZpY2UnLCBbXG4gICckaHR0cCcsXG4gICckYW5ndWxhckNhY2hlRmFjdG9yeScsXG4gICckcScsXG4gIGZ1bmN0aW9uICgkaHR0cCwgJGFuZ3VsYXJDYWNoZUZhY3RvcnksICRxKSB7XG4gICAgLy9kZWZhdWx0IGNhY2hlIGRlZmluaXRpb25cbiAgICB2YXIgZW1wbG95ZWVDYWNoZSA9ICRhbmd1bGFyQ2FjaGVGYWN0b3J5KCdlbXBsb3llZUNhY2hlJywge1xuICAgICAgICBtYXhBZ2U6IDQzMjAwMDAwLFxuICAgICAgICBkZWxldGVPbkV4cGlyZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICBzdG9yYWdlTW9kZTogJ2xvY2FsU3RvcmFnZScsXG4gICAgICAgIHJlY3ljbGVGcmVxOiAxMDAwLFxuICAgICAgICBjYXBhY2l0eTogMjBcbiAgICAgIH0pO1xuICAgIHRoaXMuZ2V0Q2FjaGVWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGVtcGxveWVlQ2FjaGUuZ2V0KHZhbHVlKTtcbiAgICB9O1xuICAgIHRoaXMuY2FsbFNlcnZpY2UgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLmdldCh1cmwsIGhlYWRlcnMoKSk7XG4gICAgICBwcm9taXNlLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIC8vc2V0IG1heEFnZSBkZWZpbmVkIGZyb20gbm9kZVxuICAgICAgICBzZXRDYWNoZUFnZShoZWFkZXJzKCdjYWNoZS1jb250cm9sJykpO1xuICAgICAgfSk7XG4gICAgICBmdW5jdGlvbiBzZXRDYWNoZUFnZSh2YWx1ZSkge1xuICAgICAgICAvLyBTcGxpdCB0aGUgc3RyaW5nIGJ5ID0gYW5kICwgfCBUaGlzIHJldHVybnMgdmFsdWUsMSx2YWx1ZVxuICAgICAgICB2YXIgc3BsaXRTdHIgPSB2YWx1ZS5zcGxpdCgvXFxzKls9fCxdXFxzKi8pO1xuICAgICAgICB2YXIgdmFsdWVJbmRleCA9IHNwbGl0U3RyLmluZGV4T2YoJ21heC1hZ2UnKTtcbiAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGZvdW5kLCBleGlzdHMsIGlzIG51bWJlclxuICAgICAgICBpZiAodmFsdWVJbmRleCAhPSAtMSAmJiBzcGxpdFN0ci5sZW5ndGggPiB2YWx1ZUluZGV4ICsgMSAmJiAhaXNOYU4oc3BsaXRTdHJbdmFsdWVJbmRleCArIDFdKSkge1xuICAgICAgICAgIHZhbHVlSW5kZXggPSBzcGxpdFN0clt2YWx1ZUluZGV4ICsgMV07XG4gICAgICAgICAgZW1wbG95ZWVDYWNoZS5zZXRPcHRpb25zKHsgbWF4QWdlOiBwYXJzZUludCh2YWx1ZUluZGV4KSAqIDEwMDAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH07XG4gICAgdGhpcy5tZSA9IGZ1bmN0aW9uIChlbWFpbCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBjYWNoZVZhbHVlID0gdGhpcy5nZXRDYWNoZVZhbHVlKCdtZScpO1xuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGNhY2hlVmFsdWUpLmVtYWlsID09IGVtYWlsKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoY2FjaGVWYWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxTZXJ2aWNlKCcvc2VydmljZXMvb3JnY2hhcnQvJyArIGNhbnZhc0NvbnRleHQuY29udGV4dC51c2VyLmVtYWlsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGVtcGxveWVlQ2FjaGUucHV0KCdtZScsIHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIGVtcGxveWVlQ2FjaGUucHV0KHJlc3BvbnNlLmRhdGEuZW1haWwsIHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcG9uc2UuZGF0YSwgc3RhdHVzKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIHRoaXMuZ2V0RW1wbG95ZWUgPSBmdW5jdGlvbiAoZW1haWwpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgY2FjaGVWYWx1ZSA9IHRoaXMuZ2V0Q2FjaGVWYWx1ZShlbWFpbCk7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoY2FjaGVWYWx1ZSkpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShjYWNoZVZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2FsbFNlcnZpY2UoJy9zZXJ2aWNlcy9vcmdjaGFydC8nICsgZW1haWwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgZW1wbG95ZWVDYWNoZS5wdXQocmVzcG9uc2UuZGF0YS5lbWFpbCwgcmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwb25zZS5kYXRhLCBzdGF0dXMpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH1cbl0pO1xubW9kdWxlLmZhY3RvcnkoJ1NlYXJjaCcsIFtcbiAgJyRodHRwJyxcbiAgZnVuY3Rpb24gKCRodHRwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldFNlYXJjaDogZnVuY3Rpb24gKHNlYXJjaFF1ZXJ5KSB7XG4gICAgICAgIC8vZGVmYXVsdCAnYXBwbGljYXRpb24vanNvbicgY29udGVudCB0eXBlLlxuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL3NlcnZpY2VzL29yZ2NoYXJ0Jywgc2VhcmNoUXVlcnksIGhlYWRlcnMoKSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXSk7XG5tb2R1bGUuc2VydmljZSgnc2hhcmVkRnVuY3Rpb25zJywgZnVuY3Rpb24gKCkge1xuICAvL2hpZGVzIHNlYXJjaCByZXN1bHRzIGVsZW1lbnRcbiAgdGhpcy50b2dnbGVTZWFyY2hEaXNwbGF5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdmFyIHdyYXBwZXJFbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoUmVzdWx0V3JhcHBlcicpO1xuICAgIHdyYXBwZXJFbGUuY2xhc3NOYW1lID0gdmFsdWU7XG4gIH07XG59KTsiLCIvKipcbiAqIEBhdXRob3IgSmFzb24gRG9icnkgPGphc29uLmRvYnJ5QGdtYWlsLmNvbT5cbiAqIEBmaWxlIGFuZ3VsYXItY2FjaGUubWluLmpzXG4gKiBAdmVyc2lvbiAyLjMuNCAtIEhvbWVwYWdlIDxodHRwOi8vam1kb2JyeS5naXRodWIuaW8vYW5ndWxhci1jYWNoZS8+XG4gKiBAY29weXJpZ2h0IChjKSAyMDEzIC0yMDE0IEphc29uIERvYnJ5IDxodHRwOi8vam1kb2JyeS5naXRodWIuaW8vYW5ndWxhci1jYWNoZT5cbiAqIEBsaWNlbnNlIE1JVCA8aHR0cHM6Ly9naXRodWIuY29tL2ptZG9icnkvYW5ndWxhci1jYWNoZS9ibG9iL21hc3Rlci9MSUNFTlNFPlxuICpcbiAqIEBvdmVydmlldyBhbmd1bGFyLWNhY2hlIGlzIGEgdmVyeSB1c2VmdWwgcmVwbGFjZW1lbnQgZm9yIEFuZ3VsYXIncyAkY2FjaGVGYWN0b3J5LlxuICovXG4hZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBmdW5jdGlvbiBkKCkge1xuICAgIHRoaXMuJGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIGEoYSwgYiwgYykge1xuICAgICAgICBmb3IgKHZhciBkID0gYVtjXSwgZSA9IGIoZCk7IGMgPiAwOykge1xuICAgICAgICAgIHZhciBmID0gTWF0aC5mbG9vcigoYyArIDEpIC8gMikgLSAxLCBnID0gYVtmXTtcbiAgICAgICAgICBpZiAoZSA+PSBiKGcpKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgYVtmXSA9IGQsIGFbY10gPSBnLCBjID0gZjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gYyhhLCBiLCBjKSB7XG4gICAgICAgIGZvciAodmFyIGQgPSBhLmxlbmd0aCwgZSA9IGFbY10sIGYgPSBiKGUpOzspIHtcbiAgICAgICAgICB2YXIgZyA9IDIgKiAoYyArIDEpLCBoID0gZyAtIDEsIGkgPSBudWxsO1xuICAgICAgICAgIGlmIChkID4gaCkge1xuICAgICAgICAgICAgdmFyIGogPSBhW2hdLCBrID0gYihqKTtcbiAgICAgICAgICAgIGYgPiBrICYmIChpID0gaCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkID4gZykge1xuICAgICAgICAgICAgdmFyIGwgPSBhW2ddLCBtID0gYihsKTtcbiAgICAgICAgICAgIG0gPCAobnVsbCA9PT0gaSA/IGYgOiBiKGFbaF0pKSAmJiAoaSA9IGcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobnVsbCA9PT0gaSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGFbY10gPSBhW2ldLCBhW2ldID0gZSwgYyA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGQoYSkge1xuICAgICAgICBpZiAoYSAmJiAhYi5pc0Z1bmN0aW9uKGEpKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQmluYXJ5SGVhcCh3ZWlnaHRGdW5jKTogd2VpZ2h0RnVuYzogbXVzdCBiZSBhIGZ1bmN0aW9uIScpO1xuICAgICAgICBhID0gYSB8fCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9LCB0aGlzLndlaWdodEZ1bmMgPSBhLCB0aGlzLmhlYXAgPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgdGhpcy5oZWFwLnB1c2goYiksIGEodGhpcy5oZWFwLCB0aGlzLndlaWdodEZ1bmMsIHRoaXMuaGVhcC5sZW5ndGggLSAxKTtcbiAgICAgIH0sIGQucHJvdG90eXBlLnBlZWsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhlYXBbMF07XG4gICAgICB9LCBkLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcy5oZWFwWzBdLCBiID0gdGhpcy5oZWFwLnBvcCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5oZWFwLmxlbmd0aCA+IDAgJiYgKHRoaXMuaGVhcFswXSA9IGIsIGModGhpcy5oZWFwLCB0aGlzLndlaWdodEZ1bmMsIDApKSwgYTtcbiAgICAgIH0sIGQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGZvciAodmFyIGUgPSB0aGlzLmhlYXAubGVuZ3RoLCBmID0gMDsgZSA+IGY7IGYrKylcbiAgICAgICAgICBpZiAoYi5lcXVhbHModGhpcy5oZWFwW2ZdLCBkKSkge1xuICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmhlYXBbZl0sIGggPSB0aGlzLmhlYXAucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gZiAhPT0gZSAtIDEgJiYgKHRoaXMuaGVhcFtmXSA9IGgsIGEodGhpcy5oZWFwLCB0aGlzLndlaWdodEZ1bmMsIGYpLCBjKHRoaXMuaGVhcCwgdGhpcy53ZWlnaHRGdW5jLCBmKSksIGc7XG4gICAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sIGQucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5oZWFwID0gW107XG4gICAgICB9LCBkLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oZWFwLmxlbmd0aDtcbiAgICAgIH0sIGQ7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBlKCkge1xuICAgIGZ1bmN0aW9uIGEoYSwgYykge1xuICAgICAgYyhiLmlzTnVtYmVyKGEpID8gMCA+IGEgPyAnbXVzdCBiZSBncmVhdGVyIHRoYW4gemVybyEnIDogbnVsbCA6ICdtdXN0IGJlIGEgbnVtYmVyIScpO1xuICAgIH1cbiAgICB2YXIgZCwgZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjYXBhY2l0eTogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgICBtYXhBZ2U6IG51bGwsXG4gICAgICAgICAgZGVsZXRlT25FeHBpcmU6ICdub25lJyxcbiAgICAgICAgICBvbkV4cGlyZTogbnVsbCxcbiAgICAgICAgICBjYWNoZUZsdXNoSW50ZXJ2YWw6IG51bGwsXG4gICAgICAgICAgcmVjeWNsZUZyZXE6IDEwMDAsXG4gICAgICAgICAgc3RvcmFnZU1vZGU6ICdub25lJyxcbiAgICAgICAgICBzdG9yYWdlSW1wbDogbnVsbCxcbiAgICAgICAgICB2ZXJpZnlJbnRlZ3JpdHk6ICEwLFxuICAgICAgICAgIGRpc2FibGVkOiAhMVxuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB0aGlzLnNldENhY2hlRGVmYXVsdHMgPSBmdW5jdGlvbiAoYykge1xuICAgICAgdmFyIGYgPSAnJGFuZ3VsYXJDYWNoZUZhY3RvcnlQcm92aWRlci5zZXRDYWNoZURlZmF1bHRzKG9wdGlvbnMpOiAnO1xuICAgICAgaWYgKGMgPSBjIHx8IHt9LCAhYi5pc09iamVjdChjKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnb3B0aW9uczogbXVzdCBiZSBhbiBvYmplY3QhJyk7XG4gICAgICBpZiAoJ2Rpc2FibGVkJyBpbiBjICYmIChjLmRpc2FibGVkID0gYy5kaXNhYmxlZCA9PT0gITApLCAnY2FwYWNpdHknIGluIGMgJiYgYShjLmNhcGFjaXR5LCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIGlmIChhKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnY2FwYWNpdHk6ICcgKyBhKTtcbiAgICAgICAgfSksICdkZWxldGVPbkV4cGlyZScgaW4gYykge1xuICAgICAgICBpZiAoIWIuaXNTdHJpbmcoYy5kZWxldGVPbkV4cGlyZSkpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnZGVsZXRlT25FeHBpcmU6IG11c3QgYmUgYSBzdHJpbmchJyk7XG4gICAgICAgIGlmICgnbm9uZScgIT09IGMuZGVsZXRlT25FeHBpcmUgJiYgJ3Bhc3NpdmUnICE9PSBjLmRlbGV0ZU9uRXhwaXJlICYmICdhZ2dyZXNzaXZlJyAhPT0gYy5kZWxldGVPbkV4cGlyZSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZiArICdkZWxldGVPbkV4cGlyZTogYWNjZXB0ZWQgdmFsdWVzIGFyZSBcIm5vbmVcIiwgXCJwYXNzaXZlXCIgb3IgXCJhZ2dyZXNzaXZlXCIhJyk7XG4gICAgICB9XG4gICAgICBpZiAoJ21heEFnZScgaW4gYyAmJiBhKGMubWF4QWdlLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIGlmIChhKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnbWF4QWdlOiAnICsgYSk7XG4gICAgICAgIH0pLCAncmVjeWNsZUZyZXEnIGluIGMgJiYgYShjLnJlY3ljbGVGcmVxLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIGlmIChhKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAncmVjeWNsZUZyZXE6ICcgKyBhKTtcbiAgICAgICAgfSksICdjYWNoZUZsdXNoSW50ZXJ2YWwnIGluIGMgJiYgYShjLmNhY2hlRmx1c2hJbnRlcnZhbCwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICBpZiAoYSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihmICsgJ2NhY2hlRmx1c2hJbnRlcnZhbDogJyArIGEpO1xuICAgICAgICB9KSwgJ3N0b3JhZ2VNb2RlJyBpbiBjKSB7XG4gICAgICAgIGlmICghYi5pc1N0cmluZyhjLnN0b3JhZ2VNb2RlKSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZiArICdzdG9yYWdlTW9kZTogbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICAgICAgaWYgKCdub25lJyAhPT0gYy5zdG9yYWdlTW9kZSAmJiAnbG9jYWxTdG9yYWdlJyAhPT0gYy5zdG9yYWdlTW9kZSAmJiAnc2Vzc2lvblN0b3JhZ2UnICE9PSBjLnN0b3JhZ2VNb2RlKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihmICsgJ3N0b3JhZ2VNb2RlOiBhY2NlcHRlZCB2YWx1ZXMgYXJlIFwibm9uZVwiLCBcImxvY2FsU3RvcmFnZVwiIG9yIFwic2Vzc2lvblN0b3JhZ2VcIiEnKTtcbiAgICAgICAgaWYgKCdzdG9yYWdlSW1wbCcgaW4gYykge1xuICAgICAgICAgIGlmICghYi5pc09iamVjdChjLnN0b3JhZ2VJbXBsKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihmICsgJ3N0b3JhZ2VJbXBsOiBtdXN0IGJlIGFuIG9iamVjdCEnKTtcbiAgICAgICAgICBpZiAoISgnc2V0SXRlbScgaW4gYy5zdG9yYWdlSW1wbCAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjLnN0b3JhZ2VJbXBsLnNldEl0ZW0pKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnc3RvcmFnZUltcGw6IG11c3QgaW1wbGVtZW50IFwic2V0SXRlbShrZXksIHZhbHVlKVwiIScpO1xuICAgICAgICAgIGlmICghKCdnZXRJdGVtJyBpbiBjLnN0b3JhZ2VJbXBsICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGMuc3RvcmFnZUltcGwuZ2V0SXRlbSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZiArICdzdG9yYWdlSW1wbDogbXVzdCBpbXBsZW1lbnQgXCJnZXRJdGVtKGtleSlcIiEnKTtcbiAgICAgICAgICBpZiAoISgncmVtb3ZlSXRlbScgaW4gYy5zdG9yYWdlSW1wbCkgfHwgJ2Z1bmN0aW9uJyAhPSB0eXBlb2YgYy5zdG9yYWdlSW1wbC5yZW1vdmVJdGVtKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnc3RvcmFnZUltcGw6IG11c3QgaW1wbGVtZW50IFwicmVtb3ZlSXRlbShrZXkpXCIhJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICgnb25FeHBpcmUnIGluIGMgJiYgJ2Z1bmN0aW9uJyAhPSB0eXBlb2YgYy5vbkV4cGlyZSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGYgKyAnb25FeHBpcmU6IG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICAgIGQgPSBiLmV4dGVuZCh7fSwgZSgpLCBjKTtcbiAgICB9LCB0aGlzLnNldENhY2hlRGVmYXVsdHMoe30pLCB0aGlzLiRnZXQgPSBbXG4gICAgICAnJHdpbmRvdycsXG4gICAgICAnQmluYXJ5SGVhcCcsXG4gICAgICBmdW5jdGlvbiAoZSwgZikge1xuICAgICAgICBmdW5jdGlvbiBnKGEpIHtcbiAgICAgICAgICByZXR1cm4gYSAmJiBiLmlzTnVtYmVyKGEpID8gYS50b1N0cmluZygpIDogYTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBoKGEpIHtcbiAgICAgICAgICB2YXIgYiwgYyA9IHt9O1xuICAgICAgICAgIGZvciAoYiBpbiBhKVxuICAgICAgICAgICAgYS5oYXNPd25Qcm9wZXJ0eShiKSAmJiAoY1tiXSA9IGIpO1xuICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGkoYSkge1xuICAgICAgICAgIHZhciBiLCBjID0gW107XG4gICAgICAgICAgZm9yIChiIGluIGEpXG4gICAgICAgICAgICBhLmhhc093blByb3BlcnR5KGIpICYmIGMucHVzaChiKTtcbiAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBqKGosIGspIHtcbiAgICAgICAgICBmdW5jdGlvbiBtKGIpIHtcbiAgICAgICAgICAgIGEoYiwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgaWYgKGEpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYXBhY2l0eTogJyArIGEpO1xuICAgICAgICAgICAgICBmb3IgKEIuY2FwYWNpdHkgPSBiOyBFLnNpemUoKSA+IEIuY2FwYWNpdHk7KVxuICAgICAgICAgICAgICAgIEgucmVtb3ZlKEUucGVlaygpLmtleSwgeyB2ZXJpZnlJbnRlZ3JpdHk6ICExIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIG4oYSkge1xuICAgICAgICAgICAgaWYgKCFiLmlzU3RyaW5nKGEpKVxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2RlbGV0ZU9uRXhwaXJlOiBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgICAgICAgICAgaWYgKCdub25lJyAhPT0gYSAmJiAncGFzc2l2ZScgIT09IGEgJiYgJ2FnZ3Jlc3NpdmUnICE9PSBhKVxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2RlbGV0ZU9uRXhwaXJlOiBhY2NlcHRlZCB2YWx1ZXMgYXJlIFwibm9uZVwiLCBcInBhc3NpdmVcIiBvciBcImFnZ3Jlc3NpdmVcIiEnKTtcbiAgICAgICAgICAgIEIuZGVsZXRlT25FeHBpcmUgPSBhO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiBvKGIpIHtcbiAgICAgICAgICAgIHZhciBjID0gaShDKTtcbiAgICAgICAgICAgIGlmIChudWxsID09PSBiKSB7XG4gICAgICAgICAgICAgIGlmIChCLm1heEFnZSlcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IGMubGVuZ3RoOyBkKyspIHtcbiAgICAgICAgICAgICAgICAgIHZhciBlID0gY1tkXTtcbiAgICAgICAgICAgICAgICAgICdtYXhBZ2UnIGluIENbZV0gfHwgKGRlbGV0ZSBDW2VdLmV4cGlyZXMsIEQucmVtb3ZlKENbZV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIEIubWF4QWdlID0gYjtcbiAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICBhKGIsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGEpXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21heEFnZTogJyArIGEpO1xuICAgICAgICAgICAgICAgIGlmIChiICE9PSBCLm1heEFnZSkge1xuICAgICAgICAgICAgICAgICAgQi5tYXhBZ2UgPSBiO1xuICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLCBlID0gMDsgZSA8IGMubGVuZ3RoOyBlKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGYgPSBjW2VdO1xuICAgICAgICAgICAgICAgICAgICAnbWF4QWdlJyBpbiBDW2ZdIHx8IChELnJlbW92ZShDW2ZdKSwgQ1tmXS5leHBpcmVzID0gQ1tmXS5jcmVhdGVkICsgQi5tYXhBZ2UsIEQucHVzaChDW2ZdKSwgQ1tmXS5leHBpcmVzIDwgZCAmJiBILnJlbW92ZShmLCB7IHZlcmlmeUludGVncml0eTogITEgfSkpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIHAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBhID0gbmV3IERhdGUoKS5nZXRUaW1lKCksIGIgPSBELnBlZWsoKTsgYiAmJiBiLmV4cGlyZXMgJiYgYi5leHBpcmVzIDwgYTspXG4gICAgICAgICAgICAgIEgucmVtb3ZlKGIua2V5LCB7IHZlcmlmeUludGVncml0eTogITEgfSksIEIub25FeHBpcmUgJiYgQi5vbkV4cGlyZShiLmtleSwgYi52YWx1ZSksIGIgPSBELnBlZWsoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gcShiKSB7XG4gICAgICAgICAgICBudWxsID09PSBiID8gKEIucmVjeWNsZUZyZXFJZCAmJiAoY2xlYXJJbnRlcnZhbChCLnJlY3ljbGVGcmVxSWQpLCBkZWxldGUgQi5yZWN5Y2xlRnJlcUlkKSwgQi5yZWN5Y2xlRnJlcSA9IGQucmVjeWNsZUZyZXEsIEIucmVjeWNsZUZyZXFJZCA9IHNldEludGVydmFsKHAsIEIucmVjeWNsZUZyZXEpKSA6IGEoYiwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgaWYgKGEpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWN5Y2xlRnJlcTogJyArIGEpO1xuICAgICAgICAgICAgICBCLnJlY3ljbGVGcmVxID0gYiwgQi5yZWN5Y2xlRnJlcUlkICYmIGNsZWFySW50ZXJ2YWwoQi5yZWN5Y2xlRnJlcUlkKSwgQi5yZWN5Y2xlRnJlcUlkID0gc2V0SW50ZXJ2YWwocCwgQi5yZWN5Y2xlRnJlcSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gcihiKSB7XG4gICAgICAgICAgICBudWxsID09PSBiID8gKEIuY2FjaGVGbHVzaEludGVydmFsSWQgJiYgKGNsZWFySW50ZXJ2YWwoQi5jYWNoZUZsdXNoSW50ZXJ2YWxJZCksIGRlbGV0ZSBCLmNhY2hlRmx1c2hJbnRlcnZhbElkKSwgQi5jYWNoZUZsdXNoSW50ZXJ2YWwgPSBiKSA6IGEoYiwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgaWYgKGEpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWNoZUZsdXNoSW50ZXJ2YWw6ICcgKyBhKTtcbiAgICAgICAgICAgICAgYiAhPT0gQi5jYWNoZUZsdXNoSW50ZXJ2YWwgJiYgKEIuY2FjaGVGbHVzaEludGVydmFsSWQgJiYgY2xlYXJJbnRlcnZhbChCLmNhY2hlRmx1c2hJbnRlcnZhbElkKSwgQi5jYWNoZUZsdXNoSW50ZXJ2YWwgPSBiLCBCLmNhY2hlRmx1c2hJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoSC5yZW1vdmVBbGwsIEIuY2FjaGVGbHVzaEludGVydmFsKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gcyhhLCBjKSB7XG4gICAgICAgICAgICB2YXIgZCwgZjtcbiAgICAgICAgICAgIGlmICghYi5pc1N0cmluZyhhKSlcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdG9yYWdlTW9kZTogbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICAgICAgICAgIGlmICgnbm9uZScgIT09IGEgJiYgJ2xvY2FsU3RvcmFnZScgIT09IGEgJiYgJ3Nlc3Npb25TdG9yYWdlJyAhPT0gYSlcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdG9yYWdlTW9kZTogYWNjZXB0ZWQgdmFsdWVzIGFyZSBcIm5vbmVcIiwgXCJsb2NhbFN0b3JhZ2VcIiBvciBcInNlc3Npb25TdG9yYWdlXCIhJyk7XG4gICAgICAgICAgICBpZiAoKCdsb2NhbFN0b3JhZ2UnID09PSBCLnN0b3JhZ2VNb2RlIHx8ICdzZXNzaW9uU3RvcmFnZScgPT09IEIuc3RvcmFnZU1vZGUpICYmIGEgIT09IEIuc3RvcmFnZU1vZGUpIHtcbiAgICAgICAgICAgICAgZm9yIChkID0gaShDKSwgZiA9IDA7IGYgPCBkLmxlbmd0aDsgZisrKVxuICAgICAgICAgICAgICAgIEkucmVtb3ZlSXRlbShGICsgJy5kYXRhLicgKyBkW2ZdKTtcbiAgICAgICAgICAgICAgSS5yZW1vdmVJdGVtKEYgKyAnLmtleXMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChCLnN0b3JhZ2VNb2RlID0gYSwgYykge1xuICAgICAgICAgICAgICBpZiAoIWIuaXNPYmplY3QoYykpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdG9yYWdlSW1wbDogbXVzdCBiZSBhbiBvYmplY3QhJyk7XG4gICAgICAgICAgICAgIGlmICghKCdzZXRJdGVtJyBpbiBjICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGMuc2V0SXRlbSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdG9yYWdlSW1wbDogbXVzdCBpbXBsZW1lbnQgXCJzZXRJdGVtKGtleSwgdmFsdWUpXCIhJyk7XG4gICAgICAgICAgICAgIGlmICghKCdnZXRJdGVtJyBpbiBjICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGMuZ2V0SXRlbSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdG9yYWdlSW1wbDogbXVzdCBpbXBsZW1lbnQgXCJnZXRJdGVtKGtleSlcIiEnKTtcbiAgICAgICAgICAgICAgaWYgKCEoJ3JlbW92ZUl0ZW0nIGluIGMpIHx8ICdmdW5jdGlvbicgIT0gdHlwZW9mIGMucmVtb3ZlSXRlbSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0b3JhZ2VJbXBsOiBtdXN0IGltcGxlbWVudCBcInJlbW92ZUl0ZW0oa2V5KVwiIScpO1xuICAgICAgICAgICAgICBJID0gYztcbiAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAnbG9jYWxTdG9yYWdlJyA9PT0gQi5zdG9yYWdlTW9kZSA/IEkgPSBlLmxvY2FsU3RvcmFnZSA6ICdzZXNzaW9uU3RvcmFnZScgPT09IEIuc3RvcmFnZU1vZGUgJiYgKEkgPSBlLnNlc3Npb25TdG9yYWdlKTtcbiAgICAgICAgICAgIGlmICgnbm9uZScgIT09IEIuc3RvcmFnZU1vZGUgJiYgSSlcbiAgICAgICAgICAgICAgaWYgKEcpXG4gICAgICAgICAgICAgICAgZm9yIChkID0gaShDKSwgZiA9IDA7IGYgPCBkLmxlbmd0aDsgZisrKVxuICAgICAgICAgICAgICAgICAgdihkW2ZdKTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gdChhLCBjLCBlKSB7XG4gICAgICAgICAgICBpZiAoYSA9IGEgfHwge30sIGUgPSBlIHx8IHt9LCBjID0gISFjLCAhYi5pc09iamVjdChhKSlcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyQ2FjaGUuc2V0T3B0aW9ucyhjYWNoZU9wdGlvbnMsIHN0cmljdCwgb3B0aW9ucyk6IGNhY2hlT3B0aW9uczogbXVzdCBiZSBhbiBvYmplY3QhJyk7XG4gICAgICAgICAgICBpZiAodyhlLnZlcmlmeUludGVncml0eSksIGMgJiYgKGEgPSBiLmV4dGVuZCh7fSwgZCwgYSkpLCAnZGlzYWJsZWQnIGluIGEgJiYgKEIuZGlzYWJsZWQgPSBhLmRpc2FibGVkID09PSAhMCksICd2ZXJpZnlJbnRlZ3JpdHknIGluIGEgJiYgKEIudmVyaWZ5SW50ZWdyaXR5ID0gYS52ZXJpZnlJbnRlZ3JpdHkgPT09ICEwKSwgJ2NhcGFjaXR5JyBpbiBhICYmIG0oYS5jYXBhY2l0eSksICdkZWxldGVPbkV4cGlyZScgaW4gYSAmJiBuKGEuZGVsZXRlT25FeHBpcmUpLCAnbWF4QWdlJyBpbiBhICYmIG8oYS5tYXhBZ2UpLCAncmVjeWNsZUZyZXEnIGluIGEgJiYgcShhLnJlY3ljbGVGcmVxKSwgJ2NhY2hlRmx1c2hJbnRlcnZhbCcgaW4gYSAmJiByKGEuY2FjaGVGbHVzaEludGVydmFsKSwgJ3N0b3JhZ2VNb2RlJyBpbiBhICYmIHMoYS5zdG9yYWdlTW9kZSwgYS5zdG9yYWdlSW1wbCksICdvbkV4cGlyZScgaW4gYSkge1xuICAgICAgICAgICAgICBpZiAobnVsbCAhPT0gYS5vbkV4cGlyZSAmJiAnZnVuY3Rpb24nICE9IHR5cGVvZiBhLm9uRXhwaXJlKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb25FeHBpcmU6IG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICAgICAgICAgICAgQi5vbkV4cGlyZSA9IGEub25FeHBpcmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBHID0gITA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIHUoKSB7XG4gICAgICAgICAgICB2YXIgYSA9IGIuZnJvbUpzb24oSS5nZXRJdGVtKEYgKyAnLmtleXMnKSk7XG4gICAgICAgICAgICBpZiAoSS5yZW1vdmVJdGVtKEYgKyAnLmtleXMnKSwgYSAmJiBhLmxlbmd0aCkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IGEubGVuZ3RoOyBjKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IGIuZnJvbUpzb24oSS5nZXRJdGVtKEYgKyAnLmRhdGEuJyArIGFbY10pKSB8fCB7fSwgZSA9IGQubWF4QWdlIHx8IEIubWF4QWdlLCBmID0gZC5kZWxldGVPbkV4cGlyZSB8fCBCLmRlbGV0ZU9uRXhwaXJlO1xuICAgICAgICAgICAgICAgIGlmIChlICYmIG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gZC5jcmVhdGVkID4gZSAmJiAnYWdncmVzc2l2ZScgPT09IGYpXG4gICAgICAgICAgICAgICAgICBJLnJlbW92ZUl0ZW0oRiArICcuZGF0YS4nICsgYVtjXSk7XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2YXIgZyA9IHsgY3JlYXRlZDogZC5jcmVhdGVkIH07XG4gICAgICAgICAgICAgICAgICBkLmV4cGlyZXMgJiYgKGcuZXhwaXJlcyA9IGQuZXhwaXJlcyksIGQuYWNjZXNzZWQgJiYgKGcuYWNjZXNzZWQgPSBkLmFjY2Vzc2VkKSwgZC5tYXhBZ2UgJiYgKGcubWF4QWdlID0gZC5tYXhBZ2UpLCBkLmRlbGV0ZU9uRXhwaXJlICYmIChnLmRlbGV0ZU9uRXhwaXJlID0gZC5kZWxldGVPbkV4cGlyZSksIEgucHV0KGFbY10sIGQudmFsdWUsIGcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2KG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiB2KGEpIHtcbiAgICAgICAgICAgICdub25lJyAhPT0gQi5zdG9yYWdlTW9kZSAmJiBJICYmIChJLnNldEl0ZW0oRiArICcua2V5cycsIGIudG9Kc29uKGkoQykpKSwgYSAmJiBJLnNldEl0ZW0oRiArICcuZGF0YS4nICsgYSwgYi50b0pzb24oQ1thXSkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gdyhhKSB7XG4gICAgICAgICAgICBpZiAoKGEgfHwgYSAhPT0gITEgJiYgQi52ZXJpZnlJbnRlZ3JpdHkpICYmICdub25lJyAhPT0gQi5zdG9yYWdlTW9kZSAmJiBJKSB7XG4gICAgICAgICAgICAgIHZhciBjID0gaShDKTtcbiAgICAgICAgICAgICAgSS5zZXRJdGVtKEYgKyAnLmtleXMnLCBiLnRvSnNvbihjKSk7XG4gICAgICAgICAgICAgIGZvciAodmFyIGQgPSAwOyBkIDwgYy5sZW5ndGg7IGQrKylcbiAgICAgICAgICAgICAgICBJLnNldEl0ZW0oRiArICcuZGF0YS4nICsgY1tkXSwgYi50b0pzb24oQ1tjW2RdXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiB4KGEsIGMpIHtcbiAgICAgICAgICAgIGlmICgoYyB8fCBjICE9PSAhMSAmJiBCLnZlcmlmeUludGVncml0eSkgJiYgJ25vbmUnICE9PSBCLnN0b3JhZ2VNb2RlICYmIEkpIHtcbiAgICAgICAgICAgICAgdmFyIGQgPSBJLmdldEl0ZW0oRiArICcuZGF0YS4nICsgYSk7XG4gICAgICAgICAgICAgIGlmICghZCAmJiBhIGluIEMpXG4gICAgICAgICAgICAgICAgSC5yZW1vdmUoYSk7XG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGIuZnJvbUpzb24oZCksIGYgPSBlID8gZS52YWx1ZSA6IG51bGw7XG4gICAgICAgICAgICAgICAgZiAmJiBILnB1dChhLCBmKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiB5KGEpIHtcbiAgICAgICAgICAgIGlmICgnbm9uZScgIT09IEIuc3RvcmFnZU1vZGUgJiYgSSkge1xuICAgICAgICAgICAgICB2YXIgYyA9IGEgfHwgaShDKTtcbiAgICAgICAgICAgICAgSS5zZXRJdGVtKEYgKyAnLmtleXMnLCBiLnRvSnNvbihjKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIHooYSkge1xuICAgICAgICAgICAgJ25vbmUnICE9PSBCLnN0b3JhZ2VNb2RlICYmIEkgJiYgYSBpbiBDICYmIEkuc2V0SXRlbShGICsgJy5kYXRhLicgKyBhLCBiLnRvSnNvbihDW2FdKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIEEoKSB7XG4gICAgICAgICAgICBpZiAoJ25vbmUnICE9PSBCLnN0b3JhZ2VNb2RlICYmIEkpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgYSA9IGkoQyksIGMgPSAwOyBjIDwgYS5sZW5ndGg7IGMrKylcbiAgICAgICAgICAgICAgICBJLnJlbW92ZUl0ZW0oRiArICcuZGF0YS4nICsgYVtjXSk7XG4gICAgICAgICAgICAgIEkuc2V0SXRlbShGICsgJy5rZXlzJywgYi50b0pzb24oW10pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIEIgPSBiLmV4dGVuZCh7fSwgeyBpZDogaiB9KSwgQyA9IHt9LCBEID0gbmV3IGYoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGEuZXhwaXJlcztcbiAgICAgICAgICAgIH0pLCBFID0gbmV3IGYoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGEuYWNjZXNzZWQ7XG4gICAgICAgICAgICB9KSwgRiA9ICdhbmd1bGFyLWNhY2hlLmNhY2hlcy4nICsgaiwgRyA9ICExLCBIID0gdGhpcywgSSA9IG51bGw7XG4gICAgICAgICAgayA9IGsgfHwge30sIHRoaXMucHV0ID0gZnVuY3Rpb24gKGMsIGQsIGUpIHtcbiAgICAgICAgICAgIGlmICghQi5kaXNhYmxlZCkge1xuICAgICAgICAgICAgICBpZiAoZSA9IGUgfHwge30sIGMgPSBnKGMpLCAhYi5pc1N0cmluZyhjKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXJDYWNoZS5wdXQoa2V5LCB2YWx1ZSwgb3B0aW9ucyk6IGtleTogbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICAgICAgICAgICAgaWYgKGUgJiYgIWIuaXNPYmplY3QoZSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyQ2FjaGUucHV0KGtleSwgdmFsdWUsIG9wdGlvbnMpOiBvcHRpb25zOiBtdXN0IGJlIGFuIG9iamVjdCEnKTtcbiAgICAgICAgICAgICAgaWYgKGUubWF4QWdlICYmIG51bGwgIT09IGUubWF4QWdlKVxuICAgICAgICAgICAgICAgIGEoZS5tYXhBZ2UsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoYSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyQ2FjaGUucHV0KGtleSwgdmFsdWUsIG9wdGlvbnMpOiBtYXhBZ2U6ICcgKyBhKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGUuZGVsZXRlT25FeHBpcmUgJiYgIWIuaXNTdHJpbmcoZS5kZWxldGVPbkV4cGlyZSkpXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXJDYWNoZS5wdXQoa2V5LCB2YWx1ZSwgb3B0aW9ucyk6IGRlbGV0ZU9uRXhwaXJlOiBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgICAgICAgICAgICAgIGlmIChlLmRlbGV0ZU9uRXhwaXJlICYmICdub25lJyAhPT0gZS5kZWxldGVPbkV4cGlyZSAmJiAncGFzc2l2ZScgIT09IGUuZGVsZXRlT25FeHBpcmUgJiYgJ2FnZ3Jlc3NpdmUnICE9PSBlLmRlbGV0ZU9uRXhwaXJlKVxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyQ2FjaGUucHV0KGtleSwgdmFsdWUsIG9wdGlvbnMpOiBkZWxldGVPbkV4cGlyZTogYWNjZXB0ZWQgdmFsdWVzIGFyZSBcIm5vbmVcIiwgXCJwYXNzaXZlXCIgb3IgXCJhZ2dyZXNzaXZlXCIhJyk7XG4gICAgICAgICAgICAgICAgaWYgKGIuaXNVbmRlZmluZWQoZCkpXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIGYsIGgsIGkgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHcoZS52ZXJpZnlJbnRlZ3JpdHkpLCBDW2NdID8gKEQucmVtb3ZlKENbY10pLCBFLnJlbW92ZShDW2NdKSkgOiBDW2NdID0geyBrZXk6IGMgfSwgaCA9IENbY10sIGgudmFsdWUgPSBkLCBoLmNyZWF0ZWQgPSBwYXJzZUludChlLmNyZWF0ZWQsIDEwKSB8fCBoLmNyZWF0ZWQgfHwgaSwgaC5hY2Nlc3NlZCA9IHBhcnNlSW50KGUuYWNjZXNzZWQsIDEwKSB8fCBpLCBlLmRlbGV0ZU9uRXhwaXJlICYmIChoLmRlbGV0ZU9uRXhwaXJlID0gZS5kZWxldGVPbkV4cGlyZSksIGUubWF4QWdlICYmIChoLm1heEFnZSA9IGUubWF4QWdlKSwgKGgubWF4QWdlIHx8IEIubWF4QWdlKSAmJiAoaC5leHBpcmVzID0gaC5jcmVhdGVkICsgKGgubWF4QWdlIHx8IEIubWF4QWdlKSksIGYgPSBoLmRlbGV0ZU9uRXhwaXJlIHx8IEIuZGVsZXRlT25FeHBpcmUsIGguZXhwaXJlcyAmJiAnYWdncmVzc2l2ZScgPT09IGYgJiYgRC5wdXNoKGgpLCB5KCksIHooYyksIEUucHVzaChoKSwgRS5zaXplKCkgPiBCLmNhcGFjaXR5ICYmIHRoaXMucmVtb3ZlKEUucGVlaygpLmtleSwgeyB2ZXJpZnlJbnRlZ3JpdHk6ICExIH0pLCBkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGEsIGQpIHtcbiAgICAgICAgICAgIGlmICghQi5kaXNhYmxlZCkge1xuICAgICAgICAgICAgICBpZiAoYi5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBhLCBmID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuZm9yRWFjaChlLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgdmFyIGMgPSBILmdldChhLCBkKTtcbiAgICAgICAgICAgICAgICAgIGIuaXNEZWZpbmVkKGMpICYmIGYucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9KSwgZjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoYSA9IGcoYSksIGQgPSBkIHx8IHt9LCAhYi5pc1N0cmluZyhhKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXJDYWNoZS5nZXQoa2V5LCBvcHRpb25zKToga2V5OiBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgICAgICAgICAgICBpZiAoZCAmJiAhYi5pc09iamVjdChkKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXJDYWNoZS5nZXQoa2V5LCBvcHRpb25zKTogb3B0aW9uczogbXVzdCBiZSBhbiBvYmplY3QhJyk7XG4gICAgICAgICAgICAgIGlmIChkLm9uRXhwaXJlICYmICFiLmlzRnVuY3Rpb24oZC5vbkV4cGlyZSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyQ2FjaGUuZ2V0KGtleSwgb3B0aW9ucyk6IG9uRXhwaXJlOiBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgICAgICAgICAgIGlmICh4KGEsIGQudmVyaWZ5SW50ZWdyaXR5KSwgYSBpbiBDKSB7XG4gICAgICAgICAgICAgICAgdmFyIGggPSBDW2FdLCBpID0gaC52YWx1ZSwgaiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLCBrID0gaC5kZWxldGVPbkV4cGlyZSB8fCBCLmRlbGV0ZU9uRXhwaXJlO1xuICAgICAgICAgICAgICAgIHJldHVybiBFLnJlbW92ZShoKSwgaC5hY2Nlc3NlZCA9IGosIEUucHVzaChoKSwgJ3Bhc3NpdmUnID09PSBrICYmICdleHBpcmVzJyBpbiBoICYmIGguZXhwaXJlcyA8IGogJiYgKHRoaXMucmVtb3ZlKGEsIHsgdmVyaWZ5SW50ZWdyaXR5OiAhMSB9KSwgQi5vbkV4cGlyZSA/IEIub25FeHBpcmUoYSwgaC52YWx1ZSwgZC5vbkV4cGlyZSkgOiBkLm9uRXhwaXJlICYmIGQub25FeHBpcmUoYSwgaC52YWx1ZSksIGkgPSBjKSwgeihhKSwgaTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIGIgPSBiIHx8IHt9LCB3KGIudmVyaWZ5SW50ZWdyaXR5KSwgRS5yZW1vdmUoQ1thXSksIEQucmVtb3ZlKENbYV0pLCAnbm9uZScgIT09IEIuc3RvcmFnZU1vZGUgJiYgSSAmJiBJLnJlbW92ZUl0ZW0oRiArICcuZGF0YS4nICsgYSksIGRlbGV0ZSBDW2FdLCB5KCk7XG4gICAgICAgICAgfSwgdGhpcy5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBKCksIEUucmVtb3ZlQWxsKCksIEQucmVtb3ZlQWxsKCksIEMgPSB7fTtcbiAgICAgICAgICB9LCB0aGlzLnJlbW92ZUV4cGlyZWQgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgYSA9IGEgfHwge307XG4gICAgICAgICAgICBmb3IgKHZhciBiID0gbmV3IERhdGUoKS5nZXRUaW1lKCksIGMgPSBpKEMpLCBkID0ge30sIGUgPSAwOyBlIDwgYy5sZW5ndGg7IGUrKylcbiAgICAgICAgICAgICAgQ1tjW2VdXSAmJiBDW2NbZV1dLmV4cGlyZXMgJiYgQ1tjW2VdXS5leHBpcmVzIDwgYiAmJiAoZFtjW2VdXSA9IENbY1tlXV0udmFsdWUpO1xuICAgICAgICAgICAgZm9yICh2YXIgZiBpbiBkKVxuICAgICAgICAgICAgICBILnJlbW92ZShmKTtcbiAgICAgICAgICAgIGlmICh3KGEudmVyaWZ5SW50ZWdyaXR5KSwgYS5hc0FycmF5KSB7XG4gICAgICAgICAgICAgIHZhciBnID0gW107XG4gICAgICAgICAgICAgIGZvciAoZiBpbiBkKVxuICAgICAgICAgICAgICAgIGcucHVzaChkW2ZdKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgICB9LCB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBCLmNhY2hlRmx1c2hJbnRlcnZhbElkICYmIGNsZWFySW50ZXJ2YWwoQi5jYWNoZUZsdXNoSW50ZXJ2YWxJZCksIEIucmVjeWNsZUZyZXFJZCAmJiBjbGVhckludGVydmFsKEIucmVjeWNsZUZyZXFJZCksIHRoaXMucmVtb3ZlQWxsKCksICdub25lJyAhPT0gQi5zdG9yYWdlTW9kZSAmJiBJICYmIChJLnJlbW92ZUl0ZW0oRiArICcua2V5cycpLCBJLnJlbW92ZUl0ZW0oRikpLCBJID0gbnVsbCwgQyA9IG51bGwsIEUgPSBudWxsLCBEID0gbnVsbCwgQiA9IG51bGwsIEYgPSBudWxsLCBIID0gbnVsbDtcbiAgICAgICAgICAgIGZvciAodmFyIGEgPSBpKHRoaXMpLCBiID0gMDsgYiA8IGEubGVuZ3RoOyBiKyspXG4gICAgICAgICAgICAgIHRoaXMuaGFzT3duUHJvcGVydHkoYVtiXSkgJiYgZGVsZXRlIHRoaXNbYVtiXV07XG4gICAgICAgICAgICBsW2pdID0gbnVsbCwgZGVsZXRlIGxbal07XG4gICAgICAgICAgfSwgdGhpcy5pbmZvID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgIGlmIChDW2FdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWQ6IENbYV0uY3JlYXRlZCxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzZWQ6IENbYV0uYWNjZXNzZWQsXG4gICAgICAgICAgICAgICAgICAgIGV4cGlyZXM6IENbYV0uZXhwaXJlcyxcbiAgICAgICAgICAgICAgICAgICAgbWF4QWdlOiBDW2FdLm1heEFnZSB8fCBCLm1heEFnZSxcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlT25FeHBpcmU6IENbYV0uZGVsZXRlT25FeHBpcmUgfHwgQi5kZWxldGVPbkV4cGlyZSxcbiAgICAgICAgICAgICAgICAgICAgaXNFeHBpcmVkOiAhMVxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYy5tYXhBZ2UgJiYgKGMuaXNFeHBpcmVkID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBjLmNyZWF0ZWQgPiBjLm1heEFnZSksIGM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIENbYV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYi5leHRlbmQoe30sIEIsIHsgc2l6ZTogRSAmJiBFLnNpemUoKSB8fCAwIH0pO1xuICAgICAgICAgIH0sIHRoaXMua2V5U2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGgoQyk7XG4gICAgICAgICAgfSwgdGhpcy5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGkoQyk7XG4gICAgICAgICAgfSwgdGhpcy5zZXRPcHRpb25zID0gdCwgdChrLCAhMCwgeyB2ZXJpZnlJbnRlZ3JpdHk6ICExIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGsoYSwgYykge1xuICAgICAgICAgIGlmIChhIGluIGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhY2hlSWQgJyArIGEgKyAnIHRha2VuIScpO1xuICAgICAgICAgIGlmICghYi5pc1N0cmluZyhhKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2FjaGVJZCBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgICAgICAgIHJldHVybiBsW2FdID0gbmV3IGooYSwgYyksIGxbYV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGwgPSB7fTtcbiAgICAgICAgcmV0dXJuIGsuaW5mbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmb3IgKHZhciBhID0gaShsKSwgYyA9IHtcbiAgICAgICAgICAgICAgICBzaXplOiBhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjYWNoZXM6IHt9XG4gICAgICAgICAgICAgIH0sIGUgPSAwOyBlIDwgYS5sZW5ndGg7IGUrKykge1xuICAgICAgICAgICAgdmFyIGYgPSBhW2VdO1xuICAgICAgICAgICAgYy5jYWNoZXNbZl0gPSBsW2ZdLmluZm8oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGMuY2FjaGVEZWZhdWx0cyA9IGIuZXh0ZW5kKHt9LCBkKSwgYztcbiAgICAgICAgfSwgay5nZXQgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIGlmICghYi5pc1N0cmluZyhhKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignJGFuZ3VsYXJDYWNoZUZhY3RvcnkuZ2V0KGNhY2hlSWQpOiBjYWNoZUlkOiBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgICAgICAgIHJldHVybiBsW2FdO1xuICAgICAgICB9LCBrLmtleVNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gaChsKTtcbiAgICAgICAgfSwgay5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBpKGwpO1xuICAgICAgICB9LCBrLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmb3IgKHZhciBhID0gaShsKSwgYiA9IDA7IGIgPCBhLmxlbmd0aDsgYisrKVxuICAgICAgICAgICAgbFthW2JdXS5kZXN0cm95KCk7XG4gICAgICAgIH0sIGsuY2xlYXJBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZm9yICh2YXIgYSA9IGkobCksIGIgPSAwOyBiIDwgYS5sZW5ndGg7IGIrKylcbiAgICAgICAgICAgIGxbYVtiXV0ucmVtb3ZlQWxsKCk7XG4gICAgICAgIH0sIGsuZW5hYmxlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZvciAodmFyIGEgPSBpKGwpLCBiID0gMDsgYiA8IGEubGVuZ3RoOyBiKyspXG4gICAgICAgICAgICBsW2FbYl1dLnNldE9wdGlvbnMoeyBkaXNhYmxlZDogITEgfSk7XG4gICAgICAgIH0sIGsuZGlzYWJsZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmb3IgKHZhciBhID0gaShsKSwgYiA9IDA7IGIgPCBhLmxlbmd0aDsgYisrKVxuICAgICAgICAgICAgbFthW2JdXS5zZXRPcHRpb25zKHsgZGlzYWJsZWQ6ICEwIH0pO1xuICAgICAgICB9LCBrO1xuICAgICAgfVxuICAgIF07XG4gIH1cbiAgYi5tb2R1bGUoJ2ptZG9icnkuYmluYXJ5LWhlYXAnLCBbXSkucHJvdmlkZXIoJ0JpbmFyeUhlYXAnLCBkKSwgYi5tb2R1bGUoJ2ptZG9icnkuYW5ndWxhci1jYWNoZScsIFtcbiAgICAnbmcnLFxuICAgICdqbWRvYnJ5LmJpbmFyeS1oZWFwJ1xuICBdKS5wcm92aWRlcignJGFuZ3VsYXJDYWNoZUZhY3RvcnknLCBlKTtcbn0od2luZG93LCB3aW5kb3cuYW5ndWxhcik7IiwiLyoqXG4gKiAgICBBbmd1bGFyIGRpcmVjdGl2ZSB0byB0cnVuY2F0ZSBtdWx0aS1saW5lIHRleHQgdG8gdmlzaWJsZSBoZWlnaHRcbiAqXG4gKiAgICBAcGFyYW0gYmluZCAoYW5ndWxhciBib3VuZCB2YWx1ZSB0byBhcHBlbmQpIFJFUVVJUkVEXG4gKiAgICBAcGFyYW0gZWxsaXBzaXNBcHBlbmQgKHN0cmluZykgc3RyaW5nIHRvIGFwcGVuZCBhdCBlbmQgb2YgdHJ1bmNhdGVkIHRleHQgYWZ0ZXIgZWxsaXBzaXMsIGNhbiBiZSBIVE1MIE9QVElPTkFMXG4gKiAgICBAcGFyYW0gZWxsaXBzaXNTeW1ib2wgKHN0cmluZykgc3RyaW5nIHRvIHVzZSBhcyBlbGxpcHNpcywgcmVwbGFjZXMgZGVmYXVsdCAnLi4uJyBPUFRJT05BTFxuICogICAgQHBhcmFtIGVsbGlwc2lzQXBwZW5kQ2xpY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0byBjYWxsIGlmIGVsbGlwc2lzQXBwZW5kIGlzIGNsaWNrZWQgKGVsbGlwc2lzQXBwZW5kIG11c3QgYmUgY2xpY2tlZCkgT1BUSU9OQUxcbiAqXG4gKiAgICBAZXhhbXBsZSA8cCBkYXRhLWVsbGlwc2lzIGRhdGEtbmctYmluZD1cImJvdW5kRGF0YVwiPjwvcD5cbiAqICAgIEBleGFtcGxlIDxwIGRhdGEtZWxsaXBzaXMgZGF0YS1uZy1iaW5kPVwiYm91bmREYXRhXCIgZGF0YS1lbGxpcHNpcy1zeW1ib2w9XCItLS1cIj48L3A+XG4gKiAgICBAZXhhbXBsZSA8cCBkYXRhLWVsbGlwc2lzIGRhdGEtbmctYmluZD1cImJvdW5kRGF0YVwiIGRhdGEtZWxsaXBzaXMtYXBwZW5kPVwicmVhZCBtb3JlXCI+PC9wPlxuICogICAgQGV4YW1wbGUgPHAgZGF0YS1lbGxpcHNpcyBkYXRhLW5nLWJpbmQ9XCJib3VuZERhdGFcIiBkYXRhLWVsbGlwc2lzLWFwcGVuZD1cInJlYWQgbW9yZVwiIGRhdGEtZWxsaXBzaXMtYXBwZW5kLWNsaWNrPVwiZGlzcGxheUZ1bGwoKVwiPjwvcD5cbiAqXG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnb3JnY2hhcnQuZGlyZWN0aXZlcycpO1xuYXBwLmRpcmVjdGl2ZSgnZWxsaXBzaXMnLCBbXG4gICckdGltZW91dCcsXG4gICckd2luZG93JyxcbiAgZnVuY3Rpb24gKCR0aW1lb3V0LCAkd2luZG93KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBzY29wZToge1xuICAgICAgICBuZ0JpbmQ6ICc9JyxcbiAgICAgICAgZWxsaXBzaXNBcHBlbmQ6ICdAJyxcbiAgICAgICAgZWxsaXBzaXNBcHBlbmRDbGljazogJyYnLFxuICAgICAgICBlbGxpcHNpc1N5bWJvbDogJ0AnXG4gICAgICB9LFxuICAgICAgY29tcGlsZTogZnVuY3Rpb24gKGVsZW0sIGF0dHIsIGxpbmtlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgLyogV2luZG93IFJlc2l6ZSBWYXJpYWJsZXMgKi9cbiAgICAgICAgICBhdHRyaWJ1dGVzLmxhc3RXaW5kb3dSZXNpemVUaW1lID0gMDtcbiAgICAgICAgICBhdHRyaWJ1dGVzLmxhc3RXaW5kb3dSZXNpemVXaWR0aCA9IDA7XG4gICAgICAgICAgYXR0cmlidXRlcy5sYXN0V2luZG93UmVzaXplSGVpZ2h0ID0gMDtcbiAgICAgICAgICBhdHRyaWJ1dGVzLmxhc3RXaW5kb3dUaW1lb3V0RXZlbnQgPSBudWxsO1xuICAgICAgICAgIC8qIFN0YXRlIFZhcmlhYmxlcyAqL1xuICAgICAgICAgIGF0dHJpYnV0ZXMuaXNUcnVuY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBmdW5jdGlvbiBidWlsZEVsbGlwc2lzKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzY29wZS5uZ0JpbmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHZhciBiaW5kQXJyYXkgPSBzY29wZS5uZ0JpbmQuc3BsaXQoJyAnKSwgaSA9IDAsIGVsbGlwc2lzU3ltYm9sID0gdHlwZW9mIGF0dHJpYnV0ZXMuZWxsaXBzaXNTeW1ib2wgIT09ICd1bmRlZmluZWQnID8gYXR0cmlidXRlcy5lbGxpcHNpc1N5bWJvbCA6ICcmaGVsbGlwOycsIGFwcGVuZFN0cmluZyA9IHR5cGVvZiBzY29wZS5lbGxpcHNpc0FwcGVuZCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2NvcGUuZWxsaXBzaXNBcHBlbmQgIT09ICcnID8gZWxsaXBzaXNTeW1ib2wgKyAnPHNwYW4+JyArIHNjb3BlLmVsbGlwc2lzQXBwZW5kICsgJzwvc3Bhbj4nIDogZWxsaXBzaXNTeW1ib2w7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXMuaXNUcnVuY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgZWxlbWVudC5odG1sKHNjb3BlLm5nQmluZCk7XG4gICAgICAgICAgICAgIC8vIElmIHRleHQgaGFzIG92ZXJmbG93XG4gICAgICAgICAgICAgIGlmIChpc092ZXJmbG93ZWQoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmluZEFycmF5U3RhcnRpbmdMZW5ndGggPSBiaW5kQXJyYXkubGVuZ3RoLCBpbml0aWFsTWF4SGVpZ2h0ID0gZWxlbWVudFswXS5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5odG1sKHNjb3BlLm5nQmluZCArIGFwcGVuZFN0cmluZyk7XG4gICAgICAgICAgICAgICAgLy8gU2V0IGNvbXBsZXRlIHRleHQgYW5kIHJlbW92ZSBvbmUgd29yZCBhdCBhIHRpbWUsIHVudGlsIHRoZXJlIGlzIG5vIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBiaW5kQXJyYXlTdGFydGluZ0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBiaW5kQXJyYXkucG9wKCk7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50Lmh0bWwoYmluZEFycmF5LmpvaW4oJyAnKSArIGFwcGVuZFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudFswXS5zY3JvbGxIZWlnaHQgPCBpbml0aWFsTWF4SGVpZ2h0IHx8IGlzT3ZlcmZsb3dlZChlbGVtZW50KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5pc1RydW5jYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiBhcHBlbmQgc3RyaW5nIHdhcyBwYXNzZWQgYW5kIGFwcGVuZCBjbGljayBmdW5jdGlvbiBpbmNsdWRlZFxuICAgICAgICAgICAgICAgIGlmIChlbGxpcHNpc1N5bWJvbCAhPSBhcHBlbmRTdHJpbmcgJiYgdHlwZW9mIHNjb3BlLmVsbGlwc2lzQXBwZW5kQ2xpY2sgIT09ICd1bmRlZmluZWQnICYmIHNjb3BlLmVsbGlwc2lzQXBwZW5kQ2xpY2sgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJ3NwYW4nKS5iaW5kKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lbGxpcHNpc0FwcGVuZENsaWNrKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiAgICBUZXN0IGlmIGVsZW1lbnQgaGFzIG92ZXJmbG93IG9mIHRleHQgYmV5b25kIGhlaWdodCBvciBtYXgtaGVpZ2h0XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAgICBAcGFyYW0gZWxlbWVudCAoRE9NIG9iamVjdClcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqICAgIEByZXR1cm4gYm9vbFxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgZnVuY3Rpb24gaXNPdmVyZmxvd2VkKHRoaXNFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc0VsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0ID4gdGhpc0VsZW1lbnRbMF0uY2xpZW50SGVpZ2h0O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiAgICBXYXRjaGVyc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqICAgIEV4ZWN1dGUgZWxsaXBzaXMgdHJ1bmNhdGUgb24gbmdCaW5kIHVwZGF0ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgIHNjb3BlLiR3YXRjaCgnbmdCaW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYnVpbGRFbGxpcHNpcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqICAgIEV4ZWN1dGUgZWxsaXBzaXMgdHJ1bmNhdGUgb24gbmdCaW5kIHVwZGF0ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgIHNjb3BlLiR3YXRjaCgnZWxsaXBzaXNBcHBlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBidWlsZEVsbGlwc2lzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogICAgV2hlbiB3aW5kb3cgd2lkdGggb3IgaGVpZ2h0IGNoYW5nZXMgLSByZS1pbml0IHRydW5jYXRpb25cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZCgncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKGF0dHJpYnV0ZXMubGFzdFdpbmRvd1RpbWVvdXRFdmVudCk7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmxhc3RXaW5kb3dUaW1lb3V0RXZlbnQgPSAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLmxhc3RXaW5kb3dSZXNpemVXaWR0aCAhPSB3aW5kb3cuaW5uZXJXaWR0aCB8fCBhdHRyaWJ1dGVzLmxhc3RXaW5kb3dSZXNpemVIZWlnaHQgIT0gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgYnVpbGRFbGxpcHNpcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXMubGFzdFdpbmRvd1Jlc2l6ZVdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXMubGFzdFdpbmRvd1Jlc2l6ZUhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgICAgIH0sIDc1KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5dKTsiLCI7XG52YXIgX19icm93c2VyaWZ5X3NoaW1fcmVxdWlyZV9fID0gcmVxdWlyZTtcbihmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIHJlcXVpcmUsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbiAgKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICBpZiAoZ2xvYmFsLlNmZGMgJiYgZ2xvYmFsLlNmZGMuY2FudmFzICYmIGdsb2JhbC5TZmRjLmNhbnZhcy5tb2R1bGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGV4dG1vZHVsZXMgPSB7fTtcbiAgICBpZiAoZ2xvYmFsLlNmZGMgJiYgZ2xvYmFsLlNmZGMuY2FudmFzKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gZ2xvYmFsLlNmZGMuY2FudmFzKSB7XG4gICAgICAgIGlmIChnbG9iYWwuU2ZkYy5jYW52YXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIGV4dG1vZHVsZXNba2V5XSA9IGdsb2JhbC5TZmRjLmNhbnZhc1trZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBvcHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBhcHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIGRvYyA9IGdsb2JhbC5kb2N1bWVudCwga2V5U3RyID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89JywgJCA9IHtcbiAgICAgICAgaGFzT3duOiBmdW5jdGlvbiAob2JqLCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIG9wcm90by5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzVW5kZWZpbmVkOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgdW5kZWY7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZjtcbiAgICAgICAgfSxcbiAgICAgICAgaXNOaWw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiAkLmlzVW5kZWZpbmVkKHZhbHVlKSB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGlzTnVtYmVyOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gISEodmFsdWUgPT09IDAgfHwgdmFsdWUgJiYgdmFsdWUudG9FeHBvbmVudGlhbCAmJiB2YWx1ZS50b0ZpeGVkKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNGdW5jdGlvbjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuICEhKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNhbGwgJiYgdmFsdWUuYXBwbHkpO1xuICAgICAgICB9LFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBvcHJvdG8udG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgIH0sXG4gICAgICAgIGlzQXJndW1lbnRzOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gISEodmFsdWUgJiYgJC5oYXNPd24odmFsdWUsICdjYWxsZWUnKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzT2JqZWN0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JztcbiAgICAgICAgfSxcbiAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZyc7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVhcnNKc29uOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gL15cXHsuKlxcfSQvLnRlc3QodmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBub3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfSxcbiAgICAgICAgaW52b2tlcjogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihmbikpIHtcbiAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpZGVudGl0eTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH0sXG4gICAgICAgIGVhY2g6IGZ1bmN0aW9uIChvYmosIGl0LCBjdHgpIHtcbiAgICAgICAgICBpZiAoJC5pc05pbChvYmopKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBuYXRpdiA9IGFwcm90by5mb3JFYWNoLCBpID0gMCwgbCwga2V5O1xuICAgICAgICAgIGwgPSBvYmoubGVuZ3RoO1xuICAgICAgICAgIGN0eCA9IGN0eCB8fCBvYmo7XG4gICAgICAgICAgaWYgKG5hdGl2ICYmIG5hdGl2ID09PSBvYmouZm9yRWFjaCkge1xuICAgICAgICAgICAgb2JqLmZvckVhY2goaXQsIGN0eCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICgkLmlzTnVtYmVyKGwpKSB7XG4gICAgICAgICAgICAgIHdoaWxlIChpIDwgbCkge1xuICAgICAgICAgICAgICAgIGlmIChpdC5jYWxsKGN0eCwgb2JqW2ldLCBpLCBvYmopID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmICgkLmhhc093bihvYmosIGtleSkgJiYgaXQuY2FsbChjdHgsIG9ialtrZXldLCBrZXksIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzdGFydHNXaXRoSHR0cDogZnVuY3Rpb24gKG9yaWcsIG5ld1VybCkge1xuICAgICAgICAgIHJldHVybiAhJC5pc1N0cmluZyhvcmlnKSA/IG9yaWcgOiBvcmlnLnN1YnN0cmluZygwLCA0KSA9PT0gJ2h0dHAnID8gb3JpZyA6IG5ld1VybDtcbiAgICAgICAgfSxcbiAgICAgICAgbWFwOiBmdW5jdGlvbiAob2JqLCBpdCwgY3R4KSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXSwgbmF0aXYgPSBhcHJvdG8ubWFwO1xuICAgICAgICAgIGlmICgkLmlzTmlsKG9iaikpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmF0aXYgJiYgb2JqLm1hcCA9PT0gbmF0aXYpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmoubWFwKGl0LCBjdHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdHggPSBjdHggfHwgb2JqO1xuICAgICAgICAgICQuZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwgaSwgbGlzdCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0LmNhbGwoY3R4LCB2YWx1ZSwgaSwgbGlzdCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9LFxuICAgICAgICB2YWx1ZXM6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICByZXR1cm4gJC5tYXAob2JqLCAkLmlkZW50aXR5KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2xpY2U6IGZ1bmN0aW9uIChhcnJheSwgYmVnaW4sIGVuZCkge1xuICAgICAgICAgIHJldHVybiBhcHJvdG8uc2xpY2UuY2FsbChhcnJheSwgJC5pc1VuZGVmaW5lZChiZWdpbikgPyAwIDogYmVnaW4sICQuaXNVbmRlZmluZWQoZW5kKSA/IGFycmF5Lmxlbmd0aCA6IGVuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvQXJyYXk6IGZ1bmN0aW9uIChpdGVyYWJsZSkge1xuICAgICAgICAgIGlmICghaXRlcmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGl0ZXJhYmxlLnRvQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYWJsZS50b0FycmF5O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJC5pc0FycmF5KGl0ZXJhYmxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhYmxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJC5pc0FyZ3VtZW50cyhpdGVyYWJsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAkLnNsaWNlKGl0ZXJhYmxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICQudmFsdWVzKGl0ZXJhYmxlKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2l6ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgIHJldHVybiAkLnRvQXJyYXkob2JqKS5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIGluZGV4T2Y6IGZ1bmN0aW9uIChhcnJheSwgaXRlbSkge1xuICAgICAgICAgIHZhciBuYXRpdiA9IGFwcm90by5pbmRleE9mLCBpLCBsO1xuICAgICAgICAgIGlmICghYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5hdGl2ICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgaWYgKGFycmF5W2ldID09PSBpdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0sXG4gICAgICAgIGlzRW1wdHk6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQuaXNBcnJheShvYmopIHx8ICQuaXNTdHJpbmcob2JqKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICgkLmhhc093bihvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoYXJyYXksIGl0ZW0pIHtcbiAgICAgICAgICB2YXIgaSA9ICQuaW5kZXhPZihhcnJheSwgaXRlbSk7XG4gICAgICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGFyYW06IGZ1bmN0aW9uIChhLCBlbmNvZGUpIHtcbiAgICAgICAgICB2YXIgcyA9IFtdO1xuICAgICAgICAgIGVuY29kZSA9IGVuY29kZSB8fCBmYWxzZTtcbiAgICAgICAgICBmdW5jdGlvbiBhZGQoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCQuaXNOaWwodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gJC5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlKCkgOiB2YWx1ZTtcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICQuZWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHYsIG4pIHtcbiAgICAgICAgICAgICAgICBhZGQoa2V5LCB2KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoZW5jb2RlKSB7XG4gICAgICAgICAgICAgICAgc1tzLmxlbmd0aF0gPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc1tzLmxlbmd0aF0gPSBrZXkgKyAnPScgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJC5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICAkLmVhY2goYSwgZnVuY3Rpb24gKHYsIG4pIHtcbiAgICAgICAgICAgICAgYWRkKG4sIHYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gYSkge1xuICAgICAgICAgICAgICBpZiAoJC5oYXNPd24oYSwgcCkpIHtcbiAgICAgICAgICAgICAgICBhZGQocCwgYVtwXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHMuam9pbignJicpLnJlcGxhY2UoLyUyMC9nLCAnKycpO1xuICAgICAgICB9LFxuICAgICAgICBvYmplY3RpZnk6IGZ1bmN0aW9uIChxKSB7XG4gICAgICAgICAgdmFyIGFyciwgb2JqID0ge30sIGksIHAsIG4sIHYsIGU7XG4gICAgICAgICAgaWYgKCQuaXNOaWwocSkpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChxLnN1YnN0cmluZygwLCAxKSA9PSAnPycpIHtcbiAgICAgICAgICAgIHEgPSBxLnN1YnN0cmluZygxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXJyID0gcS5zcGxpdCgnJicpO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHAgPSBhcnJbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgIG4gPSBwWzBdO1xuICAgICAgICAgICAgdiA9IHBbMV07XG4gICAgICAgICAgICBlID0gb2JqW25dO1xuICAgICAgICAgICAgaWYgKCEkLmlzTmlsKGUpKSB7XG4gICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcbiAgICAgICAgICAgICAgICBlW2UubGVuZ3RoXSA9IHY7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqW25dID0gW107XG4gICAgICAgICAgICAgICAgb2JqW25dWzBdID0gZTtcbiAgICAgICAgICAgICAgICBvYmpbbl1bMV0gPSB2O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvYmpbbl0gPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9LFxuICAgICAgICBzdHJpcFVybDogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgIHJldHVybiAkLmlzTmlsKHVybCkgPyBudWxsIDogdXJsLnJlcGxhY2UoLyhbXjpdKzpcXC9cXC9bXlxcL1xcPyNdKykuKi8sICckMScpO1xuICAgICAgICB9LFxuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHVybCwgcSkge1xuICAgICAgICAgIGlmICgkLmlzTmlsKHEpKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgvIy4qJC8sICcnKTtcbiAgICAgICAgICB1cmwgKz0gL15cXCMvLnRlc3QocSkgPyBxIDogKC9cXD8vLnRlc3QodXJsKSA/ICcmJyA6ICc/JykgKyBxO1xuICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVuZDogZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgICAkLmVhY2goJC5zbGljZShhcmd1bWVudHMsIDEpLCBmdW5jdGlvbiAobWl4aW4sIGkpIHtcbiAgICAgICAgICAgICQuZWFjaChtaXhpbiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgZGVzdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kc1dpdGg6IGZ1bmN0aW9uIChzdHIsIHN1ZmZpeCkge1xuICAgICAgICAgIHJldHVybiBzdHIuaW5kZXhPZihzdWZmaXgsIHN0ci5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG4gICAgICAgIH0sXG4gICAgICAgIGNhcGl0YWxpemU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuICAgICAgICB9LFxuICAgICAgICB1bmNhcGl0YWxpemU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b0xvd2VyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuICAgICAgICB9LFxuICAgICAgICBkZWNvZGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICB2YXIgb3V0cHV0ID0gW10sIGNocjEsIGNocjIsIGNocjMgPSAnJywgZW5jMSwgZW5jMiwgZW5jMywgZW5jNCA9ICcnLCBpID0gMDtcbiAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9cXD1dL2csICcnKTtcbiAgICAgICAgICBkbyB7XG4gICAgICAgICAgICBlbmMxID0ga2V5U3RyLmluZGV4T2Yoc3RyLmNoYXJBdChpKyspKTtcbiAgICAgICAgICAgIGVuYzIgPSBrZXlTdHIuaW5kZXhPZihzdHIuY2hhckF0KGkrKykpO1xuICAgICAgICAgICAgZW5jMyA9IGtleVN0ci5pbmRleE9mKHN0ci5jaGFyQXQoaSsrKSk7XG4gICAgICAgICAgICBlbmM0ID0ga2V5U3RyLmluZGV4T2Yoc3RyLmNoYXJBdChpKyspKTtcbiAgICAgICAgICAgIGNocjEgPSBlbmMxIDw8IDIgfCBlbmMyID4+IDQ7XG4gICAgICAgICAgICBjaHIyID0gKGVuYzIgJiAxNSkgPDwgNCB8IGVuYzMgPj4gMjtcbiAgICAgICAgICAgIGNocjMgPSAoZW5jMyAmIDMpIDw8IDYgfCBlbmM0O1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShjaHIxKSk7XG4gICAgICAgICAgICBpZiAoZW5jMyAhPT0gNjQpIHtcbiAgICAgICAgICAgICAgb3V0cHV0LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShjaHIyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZW5jNCAhPT0gNjQpIHtcbiAgICAgICAgICAgICAgb3V0cHV0LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShjaHIzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaHIxID0gY2hyMiA9IGNocjMgPSAnJztcbiAgICAgICAgICAgIGVuYzEgPSBlbmMyID0gZW5jMyA9IGVuYzQgPSAnJztcbiAgICAgICAgICB9IHdoaWxlIChpIDwgc3RyLmxlbmd0aCk7XG4gICAgICAgICAgcmV0dXJuICQuZXNjYXBlVG9VVEY4KG91dHB1dC5qb2luKCcnKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVzY2FwZVRvVVRGODogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgIHZhciBvdXRTdHIgPSAnJztcbiAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgd2hpbGUgKGkgPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHN0ci5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgICAgICB2YXIgYzE7XG4gICAgICAgICAgICBpZiAoYyA8IDEyOCkge1xuICAgICAgICAgICAgICBvdXRTdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChjID4gMTkxICYmIGMgPCAyMjQpIHtcbiAgICAgICAgICAgICAgICBjMSA9IHN0ci5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgICAgICAgICAgb3V0U3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiAzMSkgPDwgNiB8IGMxICYgNjMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGMxID0gc3RyLmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgICAgICAgICAgICB2YXIgYzIgPSBzdHIuY2hhckNvZGVBdChpKyspO1xuICAgICAgICAgICAgICAgIG91dFN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgMTUpIDw8IDEyIHwgKGMxICYgNjMpIDw8IDYgfCBjMiAmIDYzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gb3V0U3RyO1xuICAgICAgICB9LFxuICAgICAgICB2YWxpZEV2ZW50TmFtZTogZnVuY3Rpb24gKG5hbWUsIHJlcykge1xuICAgICAgICAgIHZhciBucywgcGFydHMgPSBuYW1lLnNwbGl0KC9cXC4vKSwgcmVnZXggPSAvXlskQS1aX11bMC05QS1aXyRdKiQvaSwgcmVzZXJ2ZWQgPSB7XG4gICAgICAgICAgICAgICdzZmRjJzogdHJ1ZSxcbiAgICAgICAgICAgICAgJ2NhbnZhcyc6IHRydWUsXG4gICAgICAgICAgICAgICdmb3JjZSc6IHRydWUsXG4gICAgICAgICAgICAgICdzYWxlc2ZvcmNlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgJ2NoYXR0ZXInOiB0cnVlLFxuICAgICAgICAgICAgICAnczEnOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICQuZWFjaCgkLmlzQXJyYXkocmVzKSA/IHJlcyA6IFtyZXNdLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmVzZXJ2ZWRbdl0gPSBmYWxzZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIG5zID0gcGFydHNbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChyZXNlcnZlZFtuc10pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmVnZXgudGVzdChwYXJ0c1swXSkgfHwgIXJlZ2V4LnRlc3QocGFydHNbMV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvdHlwZU9mOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgdmFyIG5hdGl2ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mLCBwcm90byA9ICdfX3Byb3RvX18nO1xuICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24obmF0aXYpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmF0aXYuY2FsbChPYmplY3QsIG9iaik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Yge31bcHJvdG9dID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICByZXR1cm4gb2JqW3Byb3RvXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbW9kdWxlOiBmdW5jdGlvbiAobnMsIGRlY2wpIHtcbiAgICAgICAgICB2YXIgcGFydHMgPSBucy5zcGxpdCgnLicpLCBwYXJlbnQgPSBnbG9iYWwuU2ZkYy5jYW52YXMsIGksIGxlbmd0aDtcbiAgICAgICAgICBpZiAocGFydHNbMV0gPT09ICdjYW52YXMnKSB7XG4gICAgICAgICAgICBwYXJ0cyA9IHBhcnRzLnNsaWNlKDIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZW5ndGggPSBwYXJ0cy5sZW5ndGg7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1VuZGVmaW5lZChwYXJlbnRbcGFydHNbaV1dKSkge1xuICAgICAgICAgICAgICBwYXJlbnRbcGFydHNbaV1dID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnRbcGFydHNbaV1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGRlY2wpKSB7XG4gICAgICAgICAgICBkZWNsID0gZGVjbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJC5leHRlbmQocGFyZW50LCBkZWNsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZG9jdW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9LFxuICAgICAgICBieUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICByZXR1cm4gZG9jLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgYnlDbGFzczogZnVuY3Rpb24gKGNsYXp6KSB7XG4gICAgICAgICAgcmV0dXJuIGRvYy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXp6KTtcbiAgICAgICAgfSxcbiAgICAgICAgYXR0cjogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XG4gICAgICAgICAgdmFyIGEgPSBlbC5hdHRyaWJ1dGVzLCBpO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gYVtpXS5uYW1lKSB7XG4gICAgICAgICAgICAgIHJldHVybiBhW2ldLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25SZWFkeTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihjYikpIHtcbiAgICAgICAgICAgIHJlYWR5SGFuZGxlcnMucHVzaChjYik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25zb2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAod2luZG93ICYmICF3aW5kb3cuY29uc29sZSkge1xuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUgPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHdpbmRvdyAmJiAhd2luZG93LmNvbnNvbGUubG9nKSB7XG4gICAgICAgICAgICB3aW5kb3cuY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAod2luZG93ICYmICF3aW5kb3cuY29uc29sZS5lcnJvcikge1xuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiBpc1Nlc3Npb25TdG9yYWdlKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmV0dXJuICdzZXNzaW9uU3RvcmFnZScgaW4gd2luZG93ICYmIHdpbmRvdy5zZXNzaW9uU3RvcmFnZSAhPT0gbnVsbDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiBsb2coKSB7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIGVycm9yKCkge1xuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcbiAgICAgICAgICAgIGlmIChGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICAgICAgICAgICAgICBsb2cgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZC5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgICAgIGxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGZ1bmN0aW9uIGVuYWJsZSgpIHtcbiAgICAgICAgICAgIGVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGlzU2Vzc2lvblN0b3JhZ2UoKSkge1xuICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdjYW52YXNfY29uc29sZScsICd0cnVlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY3RpdmF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmdW5jdGlvbiBkaXNhYmxlKCkge1xuICAgICAgICAgICAgZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGlzU2Vzc2lvblN0b3JhZ2UoKSkge1xuICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdjYW52YXNfY29uc29sZScsICdmYWxzZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVhY3RpdmF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbmFibGVkID0gaXNTZXNzaW9uU3RvcmFnZSgpICYmIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2NhbnZhc19jb25zb2xlJykgPT09ICd0cnVlJztcbiAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgYWN0aXZhdGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVhY3RpdmF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgICAgICAgIGVycm9yID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChjb25zb2xlLmVycm9yLCBjb25zb2xlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUuZXJyb3IsIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW5hYmxlOiBlbmFibGUsXG4gICAgICAgICAgICBkaXNhYmxlOiBkaXNhYmxlLFxuICAgICAgICAgICAgbG9nOiBsb2csXG4gICAgICAgICAgICBlcnJvcjogZXJyb3JcbiAgICAgICAgICB9O1xuICAgICAgICB9KClcbiAgICAgIH0sIHJlYWR5SGFuZGxlcnMgPSBbXSwgY2FudmFzID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oY2IpKSB7XG4gICAgICAgICAgcmVhZHlIYW5kbGVycy5wdXNoKGNiKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNhbGxlZCA9IGZhbHNlLCBpc0ZyYW1lLCBmbjtcbiAgICAgIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgICBpZiAoY2FsbGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIHJlYWR5ID0gJC5ub3A7XG4gICAgICAgICQuZWFjaChyZWFkeUhhbmRsZXJzLCAkLmludm9rZXIpO1xuICAgICAgICByZWFkeUhhbmRsZXJzID0gW107XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiB0cnlTY3JvbGwoKSB7XG4gICAgICAgIGlmIChjYWxsZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoJ2xlZnQnKTtcbiAgICAgICAgICByZWFkeSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgc2V0VGltZW91dCh0cnlTY3JvbGwsIDMwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlYWR5LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNGcmFtZSA9IHNlbGYgIT09IHRvcDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwgJiYgIWlzRnJhbWUpIHtcbiAgICAgICAgICAgIHRyeVNjcm9sbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcmVhZHksIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh3aW5kb3cuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIHJlYWR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmbiA9IHdpbmRvdy5vbmxvYWQ7XG4gICAgICAgICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChmbikge1xuICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSgpKTtcbiAgICAkLmVhY2goJCwgZnVuY3Rpb24gKGZuLCBuYW1lKSB7XG4gICAgICBjYW52YXNbbmFtZV0gPSBmbjtcbiAgICB9KTtcbiAgICAkLmVhY2goZXh0bW9kdWxlcywgZnVuY3Rpb24gKGZuLCBuYW1lKSB7XG4gICAgICBjYW52YXNbbmFtZV0gPSBmbjtcbiAgICB9KTtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG1ldGhvZDtcbiAgICAgIHZhciBub29wID0gZnVuY3Rpb24gKCkge1xuICAgICAgfTtcbiAgICAgIHZhciBtZXRob2RzID0gW1xuICAgICAgICAgICdhc3NlcnQnLFxuICAgICAgICAgICdjbGVhcicsXG4gICAgICAgICAgJ2NvdW50JyxcbiAgICAgICAgICAnZGVidWcnLFxuICAgICAgICAgICdkaXInLFxuICAgICAgICAgICdkaXJ4bWwnLFxuICAgICAgICAgICdlcnJvcicsXG4gICAgICAgICAgJ2V4Y2VwdGlvbicsXG4gICAgICAgICAgJ2dyb3VwJyxcbiAgICAgICAgICAnZ3JvdXBDb2xsYXBzZWQnLFxuICAgICAgICAgICdncm91cEVuZCcsXG4gICAgICAgICAgJ2luZm8nLFxuICAgICAgICAgICdsb2cnLFxuICAgICAgICAgICdtYXJrVGltZWxpbmUnLFxuICAgICAgICAgICdwcm9maWxlJyxcbiAgICAgICAgICAncHJvZmlsZUVuZCcsXG4gICAgICAgICAgJ3RhYmxlJyxcbiAgICAgICAgICAndGltZScsXG4gICAgICAgICAgJ3RpbWVFbmQnLFxuICAgICAgICAgICd0aW1lU3RhbXAnLFxuICAgICAgICAgICd0cmFjZScsXG4gICAgICAgICAgJ3dhcm4nXG4gICAgICAgIF07XG4gICAgICB2YXIgbGVuZ3RoID0gbWV0aG9kcy5sZW5ndGg7XG4gICAgICB2YXIgY29uc29sZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlID8gd2luZG93LmNvbnNvbGUgOiB7fTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBtZXRob2QgPSBtZXRob2RzW2xlbmd0aF07XG4gICAgICAgIGlmICghY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgICAgY29uc29sZVttZXRob2RdID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0oKSk7XG4gICAgaWYgKCFnbG9iYWwuU2ZkYykge1xuICAgICAgZ2xvYmFsLlNmZGMgPSB7fTtcbiAgICB9XG4gICAgZ2xvYmFsLlNmZGMuY2FudmFzID0gY2FudmFzO1xuICB9KHRoaXMpKTtcbiAgKGZ1bmN0aW9uICgkJCkge1xuICAgIHZhciBtb2R1bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGlzU2VjdXJlKCkge1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNldChuYW1lLCB2YWx1ZSwgZGF5cykge1xuICAgICAgICAgIHZhciBleHBpcmVzID0gJycsIGRhdGU7XG4gICAgICAgICAgaWYgKGRheXMpIHtcbiAgICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgICAgICAgICAgZXhwaXJlcyA9ICc7IGV4cGlyZXM9JyArIGRhdGUudG9HTVRTdHJpbmcoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwaXJlcyA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgJz0nICsgdmFsdWUgKyBleHBpcmVzICsgJzsgcGF0aD0vJyArIChpc1NlY3VyZSgpID09PSB0cnVlID8gJzsgc2VjdXJlJyA6ICcnKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgICAgICAgIHZhciBuYW1lRVEsIGNhLCBjLCBpO1xuICAgICAgICAgIGlmICgkJC5pc1VuZGVmaW5lZChuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuYW1lRVEgPSBuYW1lICsgJz0nO1xuICAgICAgICAgIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjID0gY2FbaV07XG4gICAgICAgICAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGMuaW5kZXhPZihuYW1lRVEpID09PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZShuYW1lKSB7XG4gICAgICAgICAgc2V0KG5hbWUsICcnLCAtMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzZXQ6IHNldCxcbiAgICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgICByZW1vdmU6IHJlbW92ZVxuICAgICAgICB9O1xuICAgICAgfSgpO1xuICAgICQkLm1vZHVsZSgnU2ZkYy5jYW52YXMuY29va2llcycsIG1vZHVsZSk7XG4gIH0oU2ZkYy5jYW52YXMpKTtcbiAgKGZ1bmN0aW9uICgkJCkge1xuICAgIHZhciBzdG9yYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZSgpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuICdzZXNzaW9uU3RvcmFnZScgaW4gd2luZG93ICYmIHdpbmRvdy5zZXNzaW9uU3RvcmFnZSAhPT0gbnVsbDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgICAgICAgICBpZiAoaXNMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICQkLmNvb2tpZXMuZ2V0KGtleSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoaXNMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkJC5jb29raWVzLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKGtleSkge1xuICAgICAgICAgICAgaWYgKGlzTG9jYWxTdG9yYWdlKCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkJC5jb29raWVzLnJlbW92ZShrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0oKTtcbiAgICB2YXIgbW9kdWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYWNjZXNzVG9rZW4sIGluc3RVcmwsIGluc3RJZCwgdE9yaWdpbiwgY2hpbGRXaW5kb3c7XG4gICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgYWNjZXNzVG9rZW4gPSBzdG9yYWdlLmdldCgnYWNjZXNzX3Rva2VuJyk7XG4gICAgICAgICAgc3RvcmFnZS5yZW1vdmUoJ2FjY2Vzc190b2tlbicpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHF1ZXJ5KHBhcmFtcykge1xuICAgICAgICAgIHZhciByID0gW10sIG47XG4gICAgICAgICAgaWYgKCEkJC5pc1VuZGVmaW5lZChwYXJhbXMpKSB7XG4gICAgICAgICAgICBmb3IgKG4gaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkobikpIHtcbiAgICAgICAgICAgICAgICByLnB1c2gobiArICc9JyArIHBhcmFtc1tuXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnPycgKyByLmpvaW4oJyYnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlZnJlc2goKSB7XG4gICAgICAgICAgc3RvcmFnZS5zZXQoJ2FjY2Vzc190b2tlbicsIGFjY2Vzc1Rva2VuKTtcbiAgICAgICAgICBzZWxmLmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxvZ2luKGN0eCkge1xuICAgICAgICAgIHZhciB1cmk7XG4gICAgICAgICAgY3R4ID0gY3R4IHx8IHt9O1xuICAgICAgICAgIHVyaSA9IGN0eC51cmkgfHwgJy9yZXN0L29hdXRoMic7XG4gICAgICAgICAgY3R4LnBhcmFtcyA9IGN0eC5wYXJhbXMgfHwgeyBzdGF0ZTogJycgfTtcbiAgICAgICAgICBjdHgucGFyYW1zLnN0YXRlID0gY3R4LnBhcmFtcy5zdGF0ZSB8fCBjdHguY2FsbGJhY2sgfHwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgIGN0eC5wYXJhbXMuZGlzcGxheSA9IGN0eC5wYXJhbXMuZGlzcGxheSB8fCAncG9wdXAnO1xuICAgICAgICAgIGN0eC5wYXJhbXMucmVkaXJlY3RfdXJpID0gJCQuc3RhcnRzV2l0aEh0dHAoY3R4LnBhcmFtcy5yZWRpcmVjdF91cmksIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQpICsgY3R4LnBhcmFtcy5yZWRpcmVjdF91cmkpO1xuICAgICAgICAgIHVyaSA9IHVyaSArIHF1ZXJ5KGN0eC5wYXJhbXMpO1xuICAgICAgICAgIGNoaWxkV2luZG93ID0gd2luZG93Lm9wZW4odXJpLCAnT0F1dGgnLCAnc3RhdHVzPTAsdG9vbGJhcj0wLG1lbnViYXI9MCxyZXNpemFibGU9MCxzY3JvbGxiYXJzPTEsdG9wPTUwLGxlZnQ9NTAsaGVpZ2h0PTUwMCx3aWR0aD02ODAnKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB0b2tlbih0KSB7XG4gICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGlmICghJCQuaXNOaWwoYWNjZXNzVG9rZW4pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBhY2Nlc3NUb2tlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjZXNzVG9rZW4gPSB0O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYWNjZXNzVG9rZW47XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gaW5zdGFuY2VVcmwoaSkge1xuICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoISQkLmlzTmlsKGluc3RVcmwpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpbnN0VXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5zdFVybCA9IHN0b3JhZ2UuZ2V0KCdpbnN0YW5jZV91cmwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgc3RvcmFnZS5yZW1vdmUoJ2luc3RhbmNlX3VybCcpO1xuICAgICAgICAgICAgICBpbnN0VXJsID0gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KCdpbnN0YW5jZV91cmwnLCBpKTtcbiAgICAgICAgICAgICAgaW5zdFVybCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpbnN0VXJsO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlSGFzaChoYXNoKSB7XG4gICAgICAgICAgdmFyIGksIG52LCBudnAsIG4sIHY7XG4gICAgICAgICAgaWYgKCEkJC5pc05pbChoYXNoKSkge1xuICAgICAgICAgICAgaWYgKGhhc2guaW5kZXhPZignIycpID09PSAwKSB7XG4gICAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG52cCA9IGhhc2guc3BsaXQoJyYnKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBudnAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgbnYgPSBudnBbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgbiA9IG52WzBdO1xuICAgICAgICAgICAgICB2ID0gZGVjb2RlVVJJQ29tcG9uZW50KG52WzFdKTtcbiAgICAgICAgICAgICAgaWYgKCdhY2Nlc3NfdG9rZW4nID09PSBuKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4odik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCdpbnN0YW5jZV91cmwnID09PSBuKSB7XG4gICAgICAgICAgICAgICAgICBpbnN0YW5jZVVybCh2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYgKCd0YXJnZXRfb3JpZ2luJyA9PT0gbikge1xuICAgICAgICAgICAgICAgICAgICB0T3JpZ2luID0gZGVjb2RlVVJJQ29tcG9uZW50KHYpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCdpbnN0YW5jZV9pZCcgPT09IG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICBpbnN0SWQgPSB2O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrQ2hpbGRXaW5kb3dTdGF0dXMoKSB7XG4gICAgICAgICAgaWYgKCFjaGlsZFdpbmRvdyB8fCBjaGlsZFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY2hpbGRXaW5kb3dVbmxvYWROb3RpZmljYXRpb24oaGFzaCkge1xuICAgICAgICAgIHZhciByZXRyeSA9IDAsIG1heHJldHJpZXMgPSAxMDtcbiAgICAgICAgICBmdW5jdGlvbiBjd3MoKSB7XG4gICAgICAgICAgICByZXRyeSsrO1xuICAgICAgICAgICAgaWYgKCFjaGlsZFdpbmRvdyB8fCBjaGlsZFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHJldHJ5IDwgbWF4cmV0cmllcykge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY3dzLCA1MCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyc2VIYXNoKGhhc2gpO1xuICAgICAgICAgIHNldFRpbWVvdXQoY3dzLCA1MCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbG9nb3V0KCkge1xuICAgICAgICAgIHRva2VuKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxvZ2dlZGluKCkge1xuICAgICAgICAgIHJldHVybiAhJCQuaXNOaWwodG9rZW4oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbG9naW5VcmwoKSB7XG4gICAgICAgICAgdmFyIGksIG52cywgbnYsIHEgPSBzZWxmLmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgICAgICBpZiAocSkge1xuICAgICAgICAgICAgcSA9IHEuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgbnZzID0gcS5zcGxpdCgnJicpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG52cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICBudiA9IG52c1tpXS5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICBpZiAoJ2xvZ2luVXJsJyA9PT0gbnZbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KG52WzFdKSArICcvc2VydmljZXMvb2F1dGgyL2F1dGhvcml6ZSc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICdodHRwczovL2xvZ2luLnNhbGVzZm9yY2UuY29tL3NlcnZpY2VzL29hdXRoMi9hdXRob3JpemUnO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHRhcmdldE9yaWdpbih0bykge1xuICAgICAgICAgIGlmICghJCQuaXNOaWwodG8pKSB7XG4gICAgICAgICAgICB0T3JpZ2luID0gdG87XG4gICAgICAgICAgICByZXR1cm4gdG87XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghJCQuaXNOaWwodE9yaWdpbikpIHtcbiAgICAgICAgICAgIHJldHVybiB0T3JpZ2luO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJzZUhhc2goZG9jdW1lbnQubG9jYXRpb24uaGFzaCk7XG4gICAgICAgICAgcmV0dXJuIHRPcmlnaW47XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gaW5zdGFuY2VJZChpZCkge1xuICAgICAgICAgIGlmICghJCQuaXNOaWwoaWQpKSB7XG4gICAgICAgICAgICBpbnN0SWQgPSBpZDtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEkJC5pc05pbChpbnN0SWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdElkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJzZUhhc2goZG9jdW1lbnQubG9jYXRpb24uaGFzaCk7XG4gICAgICAgICAgcmV0dXJuIGluc3RJZDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjbGllbnQoKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9hdXRoVG9rZW46IHRva2VuKCksXG4gICAgICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkKCksXG4gICAgICAgICAgICB0YXJnZXRPcmlnaW46IHRhcmdldE9yaWdpbigpXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluaXQ6IGluaXQsXG4gICAgICAgICAgbG9naW46IGxvZ2luLFxuICAgICAgICAgIGxvZ291dDogbG9nb3V0LFxuICAgICAgICAgIGxvZ2dlZGluOiBsb2dnZWRpbixcbiAgICAgICAgICBsb2dpblVybDogbG9naW5VcmwsXG4gICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgIGluc3RhbmNlOiBpbnN0YW5jZVVybCxcbiAgICAgICAgICBjbGllbnQ6IGNsaWVudCxcbiAgICAgICAgICBjaGVja0NoaWxkV2luZG93U3RhdHVzOiBjaGVja0NoaWxkV2luZG93U3RhdHVzLFxuICAgICAgICAgIGNoaWxkV2luZG93VW5sb2FkTm90aWZpY2F0aW9uOiBjaGlsZFdpbmRvd1VubG9hZE5vdGlmaWNhdGlvblxuICAgICAgICB9O1xuICAgICAgfSgpO1xuICAgICQkLm1vZHVsZSgnU2ZkYy5jYW52YXMub2F1dGgnLCBtb2R1bGUpO1xuICAgICQkLm9hdXRoLmluaXQoKTtcbiAgfShTZmRjLmNhbnZhcykpO1xuICAoZnVuY3Rpb24gKCQkLCB3aW5kb3cpIHtcbiAgICB2YXIgbW9kdWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW50ZXJuYWxDYWxsYmFjaztcbiAgICAgICAgZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZSwgdGFyZ2V0X3VybCwgdGFyZ2V0KSB7XG4gICAgICAgICAgdmFyIHNmZGNKc29uID0gU2ZkYy5KU09OIHx8IEpTT047XG4gICAgICAgICAgaWYgKCQkLmlzTmlsKHRhcmdldF91cmwpKSB7XG4gICAgICAgICAgICB0aHJvdyAnRVJST1I6IHRhcmdldF91cmwgd2FzIG5vdCBzdXBwbGllZCBvbiBwb3N0TWVzc2FnZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBvdGhlcldpbmRvdyA9ICQkLnN0cmlwVXJsKHRhcmdldF91cmwpO1xuICAgICAgICAgIHRhcmdldCA9IHRhcmdldCB8fCBwYXJlbnQ7XG4gICAgICAgICAgaWYgKHdpbmRvdy5wb3N0TWVzc2FnZSkge1xuICAgICAgICAgICAgaWYgKCQkLmlzT2JqZWN0KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UudGFyZ2V0TW9kdWxlID0gJ0NhbnZhcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXNzYWdlID0gc2ZkY0pzb24uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICAgICAgICAgICAgJCQuY29uc29sZS5sb2coJ1NlbmRpbmcgUG9zdCBNZXNzYWdlICcsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgdGFyZ2V0LnBvc3RNZXNzYWdlKG1lc3NhZ2UsIG90aGVyV2luZG93KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoY2FsbGJhY2ssIHNvdXJjZV9vcmlnaW4pIHtcbiAgICAgICAgICBpZiAod2luZG93LnBvc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgaW50ZXJuYWxDYWxsYmFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEsIHI7XG4gICAgICAgICAgICAgICAgdmFyIHNmZGNKc29uID0gU2ZkYy5KU09OIHx8IEpTT047XG4gICAgICAgICAgICAgICAgJCQuY29uc29sZS5sb2coJ1Bvc3QgTWVzc2FnZSBHb3QgY2FsbGJhY2snLCBlKTtcbiAgICAgICAgICAgICAgICBpZiAoISQkLmlzTmlsKGUpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZV9vcmlnaW4gPT09ICdzdHJpbmcnICYmIGUub3JpZ2luICE9PSBzb3VyY2Vfb3JpZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgICQkLmNvbnNvbGUubG9nKCdzb3VyY2Ugb3JpZ2luXFwncyBkb25cXCd0IG1hdGNoJywgZS5vcmlnaW4sIHNvdXJjZV9vcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoJCQuaXNGdW5jdGlvbihzb3VyY2Vfb3JpZ2luKSkge1xuICAgICAgICAgICAgICAgICAgICByID0gc291cmNlX29yaWdpbihlLm9yaWdpbiwgZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgJCQuY29uc29sZS5sb2coJ3NvdXJjZSBvcmlnaW5cXCdzIGZ1bmN0aW9uIHJldHVybmluZyBmYWxzZScsIGUub3JpZ2luLCBlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKCQkLmFwcGVhcnNKc29uKGUuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gc2ZkY0pzb24ucGFyc2UoZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChkYXRhKSAmJiAoJCQuaXNOaWwoZGF0YS50YXJnZXRNb2R1bGUpIHx8IGRhdGEudGFyZ2V0TW9kdWxlID09PSAnQ2FudmFzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAkJC5jb25zb2xlLmxvZygnSW52b2tpbmcgY2FsbGJhY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLCByKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGludGVybmFsQ2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5hdHRhY2hFdmVudCgnb25tZXNzYWdlJywgaW50ZXJuYWxDYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgICAgICAgIGlmICh3aW5kb3cucG9zdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGludGVybmFsQ2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5kZXRhY2hFdmVudCgnb25tZXNzYWdlJywgaW50ZXJuYWxDYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcG9zdDogcG9zdE1lc3NhZ2UsXG4gICAgICAgICAgcmVjZWl2ZTogcmVjZWl2ZU1lc3NhZ2UsXG4gICAgICAgICAgcmVtb3ZlOiByZW1vdmVMaXN0ZW5lclxuICAgICAgICB9O1xuICAgICAgfSgpO1xuICAgICQkLm1vZHVsZSgnU2ZkYy5jYW52YXMueGQnLCBtb2R1bGUpO1xuICB9KFNmZGMuY2FudmFzLCB0aGlzKSk7XG4gIChmdW5jdGlvbiAoJCQpIHtcbiAgICB2YXIgcHZlcnNpb24sIGN2ZXJzaW9uID0gJzMzLjAnO1xuICAgIHZhciBtb2R1bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwdXJsO1xuICAgICAgICBmdW5jdGlvbiBnZXRUYXJnZXRPcmlnaW4odG8pIHtcbiAgICAgICAgICB2YXIgaDtcbiAgICAgICAgICBpZiAodG8gPT09ICcqJykge1xuICAgICAgICAgICAgcmV0dXJuIHRvO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoISQkLmlzTmlsKHRvKSkge1xuICAgICAgICAgICAgaCA9ICQkLnN0cmlwVXJsKHRvKTtcbiAgICAgICAgICAgIHB1cmwgPSAkJC5zdGFydHNXaXRoSHR0cChoLCBwdXJsKTtcbiAgICAgICAgICAgIGlmIChwdXJsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBoID0gJCQuZG9jdW1lbnQoKS5sb2NhdGlvbi5oYXNoO1xuICAgICAgICAgIGlmIChoKSB7XG4gICAgICAgICAgICBoID0gZGVjb2RlVVJJQ29tcG9uZW50KGgucmVwbGFjZSgvXiMvLCAnJykpO1xuICAgICAgICAgICAgcHVybCA9ICQkLnN0YXJ0c1dpdGhIdHRwKGgsIHB1cmwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcHVybDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB4ZENhbGxiYWNrKGRhdGEpIHtcbiAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKHN1Ym1vZHVsZXNbZGF0YS50eXBlXSkge1xuICAgICAgICAgICAgICBzdWJtb2R1bGVzW2RhdGEudHlwZV0uY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzdWJtb2R1bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNicyA9IFtdLCBzZXEgPSAwLCBhdXRvZyA9IHRydWU7XG4gICAgICAgICAgICBmdW5jdGlvbiBwb3N0aXQoY2xpZW50c2NiLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgIHZhciB3cmFwcGVkLCB0bywgYztcbiAgICAgICAgICAgICAgc2VxID0gc2VxID4gMTAwID8gMCA6IHNlcSArIDE7XG4gICAgICAgICAgICAgIGNic1tzZXFdID0gY2xpZW50c2NiO1xuICAgICAgICAgICAgICB3cmFwcGVkID0ge1xuICAgICAgICAgICAgICAgIHNlcTogc2VxLFxuICAgICAgICAgICAgICAgIHNyYzogJ2NsaWVudCcsXG4gICAgICAgICAgICAgICAgY2xpZW50VmVyc2lvbjogY3ZlcnNpb24sXG4gICAgICAgICAgICAgICAgcGFyZW50VmVyc2lvbjogcHZlcnNpb24sXG4gICAgICAgICAgICAgICAgYm9keTogbWVzc2FnZVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBjID0gbWVzc2FnZSAmJiBtZXNzYWdlLmNvbmZpZyAmJiBtZXNzYWdlLmNvbmZpZy5jbGllbnQ7XG4gICAgICAgICAgICAgIHRvID0gZ2V0VGFyZ2V0T3JpZ2luKCQkLmlzTmlsKGMpID8gbnVsbCA6IGMudGFyZ2V0T3JpZ2luKTtcbiAgICAgICAgICAgICAgaWYgKCQkLmlzTmlsKHRvKSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdFUlJPUjogdGFyZ2V0T3JpZ2luIHdhcyBub3Qgc3VwcGxpZWQgYW5kIHdhcyBub3QgZm91bmQgb24gdGhlIGhhc2ggdGFnLCB0aGlzIGNhbiByZXN1bHQgZnJvbSBhIHJlZGlyZWN0IG9yIGxpbmsgdG8gYW5vdGhlciBwYWdlLic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgJCQuY29uc29sZS5sb2coJ3Bvc3RpbmcgbWVzc2FnZSAnLCB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogd3JhcHBlZCxcbiAgICAgICAgICAgICAgICB0bzogdG9cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICQkLnhkLnBvc3Qod3JhcHBlZCwgdG8sIHBhcmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiB2YWxpZGF0ZUNsaWVudChjbGllbnQsIGNiKSB7XG4gICAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICAgIGNsaWVudCA9IGNsaWVudCB8fCAkJC5vYXV0aCAmJiAkJC5vYXV0aC5jbGllbnQoKTtcbiAgICAgICAgICAgICAgaWYgKCQkLmlzTmlsKGNsaWVudCkgfHwgJCQuaXNOaWwoY2xpZW50Lm9hdXRoVG9rZW4pKSB7XG4gICAgICAgICAgICAgICAgbXNnID0ge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiA0MDEsXG4gICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiAnVW5hdXRob3JpemVkJyxcbiAgICAgICAgICAgICAgICAgIHBhcmVudFZlcnNpb246IHB2ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgcGF5bG9hZDogJ2NsaWVudCBvciBjbGllbnQub2F1dGhUb2tlbiBub3Qgc3VwcGxpZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoJCQuaXNOaWwoY2xpZW50Lmluc3RhbmNlSWQpIHx8ICQkLmlzTmlsKGNsaWVudC50YXJnZXRPcmlnaW4pKSB7XG4gICAgICAgICAgICAgICAgbXNnID0ge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiAnQmFkIFJlcXVlc3QnLFxuICAgICAgICAgICAgICAgICAgcGFyZW50VmVyc2lvbjogcHZlcnNpb24sXG4gICAgICAgICAgICAgICAgICBwYXlsb2FkOiAnY2xpZW50Lmluc3RhbmNlSWQgb3IgY2xpZW50LnRhcmdldE9yaWdpbiBub3Qgc3VwcGxpZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoISQkLmlzTmlsKG1zZykpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCQuaXNGdW5jdGlvbihjYikpIHtcbiAgICAgICAgICAgICAgICAgIGNiKG1zZyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRocm93IG1zZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB7fSwgU1RSX0VWVCA9ICdzZmRjLnN0cmVhbWluZ2FwaSc7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gdmFsaWROYW1lKG5hbWUsIHJlcykge1xuICAgICAgICAgICAgICAgICAgdmFyIG1zZywgciA9ICQkLnZhbGlkRXZlbnROYW1lKG5hbWUsIHJlcyk7XG4gICAgICAgICAgICAgICAgICBpZiAociAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgMTogJ0V2ZW50IG5hbWVzIGNhbiBvbmx5IGNvbnRhaW4gb25lIG5hbWVzcGFjZScsXG4gICAgICAgICAgICAgICAgICAgICAgMjogJ05hbWVzcGFjZSBoYXMgYWxyZWFkeSBiZWVuIHJlc2VydmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAzOiAnRXZlbnQgbmFtZSBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG1zZ1tyXTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZmluZFN1YnNjcmlwdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgdmFyIHMsIG5hbWUgPSBldmVudC5uYW1lO1xuICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFNUUl9FVlQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChzdWJzY3JpcHRpb25zW25hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHMgPSBzdWJzY3JpcHRpb25zW25hbWVdW2V2ZW50LnBhcmFtcy50b3BpY107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMgPSBzdWJzY3JpcHRpb25zW25hbWVdO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChzKSAmJiAoJCQuaXNGdW5jdGlvbihzLm9uRGF0YSkgfHwgJCQuaXNGdW5jdGlvbihzLm9uQ29tcGxldGUpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGRhdGEucGF5bG9hZCwgc3Vic2NyaXB0aW9uID0gZmluZFN1YnNjcmlwdGlvbihldmVudCksIGZ1bmM7XG4gICAgICAgICAgICAgICAgICAgIGlmICghJCQuaXNOaWwoc3Vic2NyaXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5tZXRob2QgPT09ICdvbkRhdGEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jID0gc3Vic2NyaXB0aW9uLm9uRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50Lm1ldGhvZCA9PT0gJ29uQ29tcGxldGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMgPSBzdWJzY3JpcHRpb24ub25Db21wbGV0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChmdW5jKSAmJiAkJC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jKGV2ZW50LnBheWxvYWQpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKGNsaWVudCwgcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3VicyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoJCQuaXNOaWwocykgfHwgIXZhbGlkYXRlQ2xpZW50KGNsaWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAncHJlY29uZGl0aW9uIGZhaWwnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICQkLmVhY2goJCQuaXNBcnJheShzKSA/IHMgOiBbc10sIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbCh2Lm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZE5hbWUodi5uYW1lLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdjYW52YXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnc2ZkYydcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYubmFtZSA9PT0gU1RSX0VWVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQkLmlzTmlsKHYucGFyYW1zKSAmJiAhJCQuaXNOaWwodi5wYXJhbXMudG9waWMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQkLmlzTmlsKHN1YnNjcmlwdGlvbnNbdi5uYW1lXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbdi5uYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zW3YubmFtZV1bdi5wYXJhbXMudG9waWNdID0gdjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAnWycgKyBTVFJfRVZUICsgJ10gdG9waWMgaXMgbWlzc2luZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbdi5uYW1lXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzW3YubmFtZV0gPSB7IHBhcmFtczogdi5wYXJhbXMgfTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ3N1YnNjcmlwdGlvbiBkb2VzIG5vdCBoYXZlIGEgXFwnbmFtZVxcJyc7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjbGllbnQuaXNWRikge1xuICAgICAgICAgICAgICAgICAgICAgIHBvc3RpdChudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3Vic2NyaWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogeyBjbGllbnQ6IGNsaWVudCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uczogc3Vic1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uIChjbGllbnQsIHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQkLmlzTmlsKHMpIHx8ICF2YWxpZGF0ZUNsaWVudChjbGllbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ1BSRUNPTkRJVElPTiBGQUlMOiBuZWVkIGZvIHN1cHBseSBjbGllbnQgYW5kIGV2ZW50IG5hbWUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgkJC5pc1N0cmluZyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHN1YnNbc10gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc3Vic2NyaXB0aW9uc1tzXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAkJC5lYWNoKCQkLmlzQXJyYXkocykgPyBzIDogW3NdLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB2Lm5hbWUgPyB2Lm5hbWUgOiB2O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWROYW1lKG5hbWUsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NhbnZhcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdzZmRjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzW25hbWVdID0geyBwYXJhbXM6IHYucGFyYW1zIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gU1RSX0VWVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQkLmlzTmlsKHN1YnNjcmlwdGlvbnNbbmFtZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChzdWJzY3JpcHRpb25zW25hbWVdW3YucGFyYW1zLnRvcGljXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzdWJzY3JpcHRpb25zW25hbWVdW3YucGFyYW1zLnRvcGljXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQkLnNpemUoc3Vic2NyaXB0aW9uc1tuYW1lXSkgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHN1YnNjcmlwdGlvbnNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc3Vic2NyaXB0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNsaWVudC5pc1ZGKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zdGl0KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd1bnN1YnNjcmliZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IHsgY2xpZW50OiBjbGllbnQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IHN1YnNcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHB1Ymxpc2g6IGZ1bmN0aW9uIChjbGllbnQsIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChlKSAmJiAhJCQuaXNOaWwoZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHZhbGlkTmFtZShlLm5hbWUsIFsnczEnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRlQ2xpZW50KGNsaWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RpdChudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwdWJsaXNoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB7IGNsaWVudDogY2xpZW50IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9KCk7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IDQwMSAmJiAkJC5pc0FycmF5KGRhdGEucGF5bG9hZCkgJiYgZGF0YS5wYXlsb2FkWzBdLmVycm9yQ29kZSAmJiBkYXRhLnBheWxvYWRbMF0uZXJyb3JDb2RlID09PSAnSU5WQUxJRF9TRVNTSU9OX0lEJykge1xuICAgICAgICAgICAgICAgICAgICAgIGlmICgkJC5vYXV0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCQub2F1dGgubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgkJC5pc0Z1bmN0aW9uKGNic1tkYXRhLnNlcV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc0Z1bmN0aW9uKGNic1tkYXRhLnNlcV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnbm90IGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGNic1tkYXRhLnNlcV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9KCk7XG4gICAgICAgICAgICB2YXIgc2VydmljZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICBhamF4OiBmdW5jdGlvbiAodXJsLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2NiLCBjb25maWcsIGRlZmF1bHRzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRocm93ICdQUkVDT05ESVRJT04gRVJST1I6IHVybCByZXF1aXJlZCB3aXRoIEFKQVggY2FsbCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZXR0aW5ncyB8fCAhJCQuaXNGdW5jdGlvbihzZXR0aW5ncy5zdWNjZXNzKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRocm93ICdQUkVDT05ESVRJT04gRVJST1I6IGZ1bmN0aW9uOiBcXCdzZXR0aW5ncy5zdWNjZXNzXFwnIG1pc3NpbmcuJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRlQ2xpZW50KHNldHRpbmdzLmNsaWVudCwgc2V0dGluZ3Muc3VjY2VzcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2NiID0gc2V0dGluZ3Muc3VjY2VzcztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ09BdXRoICcgKyBzZXR0aW5ncy5jbGllbnQub2F1dGhUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gJCQuZXh0ZW5kKGRlZmF1bHRzLCBzZXR0aW5ncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5zdWNjZXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuZmFpbHVyZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5jbGllbnQudGFyZ2V0T3JpZ2luID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcuY2xpZW50LnRhcmdldE9yaWdpbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcHVybCA9ICQkLnN0YXJ0c1dpdGhIdHRwKGNvbmZpZy50YXJnZXRPcmlnaW4sIHB1cmwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBvc3RpdChjY2IsIHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYWpheCcsXG4gICAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgY3R4OiBmdW5jdGlvbiAoY2xpZW50c2NiLCBjbGllbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRlQ2xpZW50KGNsaWVudCwgY2xpZW50c2NiKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHBvc3RpdChjbGllbnRzY2IsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjdHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzVG9rZW46IGNsaWVudC5vYXV0aFRva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB7IGNsaWVudDogY2xpZW50IH1cbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHRva2VuOiBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJCQub2F1dGggJiYgJCQub2F1dGgudG9rZW4odCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgdmVyc2lvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFZlcnNpb246IGN2ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFZlcnNpb246IHB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgc2lnbmVkcmVxdWVzdDogZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3IgPSBzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzcjtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByZWZyZXNoU2lnbmVkUmVxdWVzdDogZnVuY3Rpb24gKGNsaWVudHNjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSB3aW5kb3cubmFtZS5zdWJzdHJpbmcoJ2NhbnZhcy1mcmFtZS0nLmxlbmd0aCksIGNsaWVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9hdXRoVG9rZW46ICdudWxsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlSWQ6IGlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0T3JpZ2luOiAnKidcbiAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBwb3N0aXQoY2xpZW50c2NiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JlZnJlc2gnLFxuICAgICAgICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiBjbGllbnQub2F1dGhUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IHsgY2xpZW50OiBjbGllbnQgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByZXBvc3Q6IGZ1bmN0aW9uIChyZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IHdpbmRvdy5uYW1lLnN1YnN0cmluZygnY2FudmFzLWZyYW1lLScubGVuZ3RoKSwgY2xpZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2F1dGhUb2tlbjogJ251bGwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRPcmlnaW46ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgIH0sIHIgPSByZWZyZXNoIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBwb3N0aXQobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyZXBvc3QnLFxuICAgICAgICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiBjbGllbnQub2F1dGhUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IHsgY2xpZW50OiBjbGllbnQgfSxcbiAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoOiByXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0oKTtcbiAgICAgICAgICAgIHZhciBmcmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jRWxlbWVudCA9ICQkLmRvY3VtZW50KCkuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudEhlaWdodCA9IGRvY0VsZW1lbnQuc2Nyb2xsSGVpZ2h0LCBwYWdlSGVpZ2h0ID0gZG9jRWxlbWVudC5jbGllbnRIZWlnaHQsIHNjcm9sbFRvcCA9IGRvY0VsZW1lbnQgJiYgZG9jRWxlbWVudC5zY3JvbGxUb3AgfHwgJCQuZG9jdW1lbnQoKS5ib2R5LnNjcm9sbFRvcCwgY29udGVudFdpZHRoID0gZG9jRWxlbWVudC5zY3JvbGxXaWR0aCwgcGFnZVdpZHRoID0gZG9jRWxlbWVudC5jbGllbnRXaWR0aCwgc2Nyb2xsTGVmdCA9IGRvY0VsZW1lbnQgJiYgZG9jRWxlbWVudC5zY3JvbGxMZWZ0IHx8ICQkLmRvY3VtZW50KCkuYm9keS5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIGhlaWdodHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIZWlnaHQ6IGNvbnRlbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlSGVpZ2h0OiBwYWdlSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVG9wOiBzY3JvbGxUb3BcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFdpZHRoOiBjb250ZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlV2lkdGg6IHBhZ2VXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbExlZnQ6IHNjcm9sbExlZnRcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgcmVzaXplOiBmdW5jdGlvbiAoY2xpZW50LCBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaCwgY2gsIHN3LCBjdywgcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJydcbiAgICAgICAgICAgICAgICAgICAgICB9LCBkb2NFbGVtZW50ID0gJCQuZG9jdW1lbnQoKS5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkJC5pc05pbChzaXplKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHNoID0gZG9jRWxlbWVudC5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgY2ggPSBkb2NFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggIT09IHNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzLmhlaWdodCA9IHNoICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgc3cgPSBkb2NFbGVtZW50LnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgIGN3ID0gZG9jRWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoc3cgIT09IGN3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzLndpZHRoID0gc3cgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoISQkLmlzTmlsKHNpemUuaGVpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy5oZWlnaHQgPSBzaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkJC5pc05pbChzaXplLndpZHRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy53aWR0aCA9IHNpemUud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghJCQuaXNOaWwocy5oZWlnaHQpIHx8ICEkJC5pc05pbChzLndpZHRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHBvc3RpdChudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncmVzaXplJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogeyBjbGllbnQ6IGNsaWVudCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogc1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgYXV0b2dyb3c6IGZ1bmN0aW9uIChjbGllbnQsIGIsIGludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdmFsID0gJCQuaXNOaWwoaW50ZXJ2YWwpID8gMzAwIDogaW50ZXJ2YWw7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9nID0gJCQuaXNOaWwoYikgPyB0cnVlIDogYjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1dG9nID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzdWJtb2R1bGVzLmZyYW1lLnJlc2l6ZShjbGllbnQpO1xuICAgICAgICAgICAgICAgICAgICAgIHN1Ym1vZHVsZXMuZnJhbWUuYXV0b2dyb3coY2xpZW50LCBhdXRvZyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGl2YWwpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0oKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNlcnZpY2VzOiBzZXJ2aWNlcyxcbiAgICAgICAgICAgICAgZnJhbWU6IGZyYW1lLFxuICAgICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KCk7XG4gICAgICAgICQkLnhkLnJlY2VpdmUoeGRDYWxsYmFjaywgZ2V0VGFyZ2V0T3JpZ2luKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdHg6IHN1Ym1vZHVsZXMuc2VydmljZXMuY3R4LFxuICAgICAgICAgIGFqYXg6IHN1Ym1vZHVsZXMuc2VydmljZXMuYWpheCxcbiAgICAgICAgICB0b2tlbjogc3VibW9kdWxlcy5zZXJ2aWNlcy50b2tlbixcbiAgICAgICAgICB2ZXJzaW9uOiBzdWJtb2R1bGVzLnNlcnZpY2VzLnZlcnNpb24sXG4gICAgICAgICAgcmVzaXplOiBzdWJtb2R1bGVzLmZyYW1lLnJlc2l6ZSxcbiAgICAgICAgICBzaXplOiBzdWJtb2R1bGVzLmZyYW1lLnNpemUsXG4gICAgICAgICAgYXV0b2dyb3c6IHN1Ym1vZHVsZXMuZnJhbWUuYXV0b2dyb3csXG4gICAgICAgICAgc3Vic2NyaWJlOiBzdWJtb2R1bGVzLmV2ZW50LnN1YnNjcmliZSxcbiAgICAgICAgICB1bnN1YnNjcmliZTogc3VibW9kdWxlcy5ldmVudC51bnN1YnNjcmliZSxcbiAgICAgICAgICBwdWJsaXNoOiBzdWJtb2R1bGVzLmV2ZW50LnB1Ymxpc2gsXG4gICAgICAgICAgc2lnbmVkcmVxdWVzdDogc3VibW9kdWxlcy5zZXJ2aWNlcy5zaWduZWRyZXF1ZXN0LFxuICAgICAgICAgIHJlZnJlc2hTaWduZWRSZXF1ZXN0OiBzdWJtb2R1bGVzLnNlcnZpY2VzLnJlZnJlc2hTaWduZWRSZXF1ZXN0LFxuICAgICAgICAgIHJlcG9zdDogc3VibW9kdWxlcy5zZXJ2aWNlcy5yZXBvc3RcbiAgICAgICAgfTtcbiAgICAgIH0oKTtcbiAgICAkJC5tb2R1bGUoJ1NmZGMuY2FudmFzLmNsaWVudCcsIG1vZHVsZSk7XG4gIH0oU2ZkYy5jYW52YXMpKTtcbiAgO1xuICBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXyh0eXBlb2YgU2ZkYy5jYW52YXMgIT0gJ3VuZGVmaW5lZCcgPyBTZmRjLmNhbnZhcyA6IHdpbmRvdy5TZmRjLmNhbnZhcyk7XG59LmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZ1bmN0aW9uIGRlZmluZUV4cG9ydChleCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGV4O1xufSkpOyIsIi8qXG4gKlxuICogRmluZCBtb3JlIGFib3V0IHRoaXMgcGx1Z2luIGJ5IHZpc2l0aW5nXG4gKiBodHRwOi8vYWx4Z2Jzbi5jby51ay9cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMiBBbGV4IEdpYnNvblxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2VcbiAqXG4gKi9cbihmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xuICBmdW5jdGlvbiBTaGFrZSgpIHtcbiAgICAvL2ZlYXR1cmUgZGV0ZWN0XG4gICAgdGhpcy5oYXNEZXZpY2VNb3Rpb24gPSAnb25kZXZpY2Vtb3Rpb24nIGluIHdpbmRvdztcbiAgICAvL2RlZmF1bHQgdmVsb2NpdHkgdGhyZXNob2xkIGZvciBzaGFrZSB0byByZWdpc3RlclxuICAgIHRoaXMudGhyZXNob2xkID0gMTU7XG4gICAgLy91c2UgZGF0ZSB0byBwcmV2ZW50IG11bHRpcGxlIHNoYWtlcyBmaXJpbmdcbiAgICB0aGlzLmxhc3RUaW1lID0gbmV3IERhdGUoKTtcbiAgICAvL2FjY2VsZXJvbWV0ZXIgdmFsdWVzXG4gICAgdGhpcy5sYXN0WCA9IG51bGw7XG4gICAgdGhpcy5sYXN0WSA9IG51bGw7XG4gICAgdGhpcy5sYXN0WiA9IG51bGw7XG4gICAgLy9jcmVhdGUgY3VzdG9tIGV2ZW50XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudC5DdXN0b21FdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5ldmVudCA9IG5ldyBkb2N1bWVudC5DdXN0b21FdmVudCgnc2hha2UnLCB7XG4gICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgICB0aGlzLmV2ZW50LmluaXRFdmVudCgnc2hha2UnLCB0cnVlLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvL3Jlc2V0IHRpbWVyIHZhbHVlc1xuICBTaGFrZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5sYXN0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy5sYXN0WCA9IG51bGw7XG4gICAgdGhpcy5sYXN0WSA9IG51bGw7XG4gICAgdGhpcy5sYXN0WiA9IG51bGw7XG4gIH07XG4gIC8vc3RhcnQgbGlzdGVuaW5nIGZvciBkZXZpY2Vtb3Rpb25cbiAgU2hha2UucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICBpZiAodGhpcy5oYXNEZXZpY2VNb3Rpb24pIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuICAvL3N0b3AgbGlzdGVuaW5nIGZvciBkZXZpY2Vtb3Rpb25cbiAgU2hha2UucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaGFzRGV2aWNlTW90aW9uKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGV2aWNlbW90aW9uJywgdGhpcywgZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnJlc2V0KCk7XG4gIH07XG4gIC8vY2FsY3VsYXRlcyBpZiBzaGFrZSBkaWQgb2NjdXJcbiAgU2hha2UucHJvdG90eXBlLmRldmljZW1vdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBlLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHksIGN1cnJlbnRUaW1lLCB0aW1lRGlmZmVyZW5jZSwgZGVsdGFYID0gMCwgZGVsdGFZID0gMCwgZGVsdGFaID0gMDtcbiAgICBpZiAodGhpcy5sYXN0WCA9PT0gbnVsbCAmJiB0aGlzLmxhc3RZID09PSBudWxsICYmIHRoaXMubGFzdFogPT09IG51bGwpIHtcbiAgICAgIHRoaXMubGFzdFggPSBjdXJyZW50Lng7XG4gICAgICB0aGlzLmxhc3RZID0gY3VycmVudC55O1xuICAgICAgdGhpcy5sYXN0WiA9IGN1cnJlbnQuejtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVsdGFYID0gTWF0aC5hYnModGhpcy5sYXN0WCAtIGN1cnJlbnQueCk7XG4gICAgZGVsdGFZID0gTWF0aC5hYnModGhpcy5sYXN0WSAtIGN1cnJlbnQueSk7XG4gICAgZGVsdGFaID0gTWF0aC5hYnModGhpcy5sYXN0WiAtIGN1cnJlbnQueik7XG4gICAgaWYgKGRlbHRhWCA+IHRoaXMudGhyZXNob2xkICYmIGRlbHRhWSA+IHRoaXMudGhyZXNob2xkIHx8IGRlbHRhWCA+IHRoaXMudGhyZXNob2xkICYmIGRlbHRhWiA+IHRoaXMudGhyZXNob2xkIHx8IGRlbHRhWSA+IHRoaXMudGhyZXNob2xkICYmIGRlbHRhWiA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICAvL2NhbGN1bGF0ZSB0aW1lIGluIG1pbGxpc2Vjb25kcyBzaW5jZSBsYXN0IHNoYWtlIHJlZ2lzdGVyZWRcbiAgICAgIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgIHRpbWVEaWZmZXJlbmNlID0gY3VycmVudFRpbWUuZ2V0VGltZSgpIC0gdGhpcy5sYXN0VGltZS5nZXRUaW1lKCk7XG4gICAgICBpZiAodGltZURpZmZlcmVuY2UgPiAxMDAwKSB7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHRoaXMuZXZlbnQpO1xuICAgICAgICB0aGlzLmxhc3RUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5sYXN0WCA9IGN1cnJlbnQueDtcbiAgICB0aGlzLmxhc3RZID0gY3VycmVudC55O1xuICAgIHRoaXMubGFzdFogPSBjdXJyZW50Lno7XG4gIH07XG4gIC8vZXZlbnQgaGFuZGxlclxuICBTaGFrZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0eXBlb2YgdGhpc1tlLnR5cGVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpc1tlLnR5cGVdKGUpO1xuICAgIH1cbiAgfTtcbiAgLy9jcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2Ygc2hha2UuanMuXG4gIHZhciBteVNoYWtlRXZlbnQgPSBuZXcgU2hha2UoKTtcbiAgbXlTaGFrZUV2ZW50ICYmIG15U2hha2VFdmVudC5zdGFydCgpO1xufSh3aW5kb3csIGRvY3VtZW50KSk7IiwiLyoqXG4gKiBAbGljZW5zZSBBbmd1bGFySlMgdjEuNC40XG4gKiAoYykgMjAxMC0yMDE1IEdvb2dsZSwgSW5jLiBodHRwOi8vYW5ndWxhcmpzLm9yZ1xuICogTGljZW5zZTogTUlUXG4gKi9cbihmdW5jdGlvbih3aW5kb3csIGFuZ3VsYXIsIHVuZGVmaW5lZCkgeyd1c2Ugc3RyaWN0JztcblxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xudmFyIG5vb3AgICAgICAgID0gYW5ndWxhci5ub29wO1xudmFyIGV4dGVuZCAgICAgID0gYW5ndWxhci5leHRlbmQ7XG52YXIganFMaXRlICAgICAgPSBhbmd1bGFyLmVsZW1lbnQ7XG52YXIgZm9yRWFjaCAgICAgPSBhbmd1bGFyLmZvckVhY2g7XG52YXIgaXNBcnJheSAgICAgPSBhbmd1bGFyLmlzQXJyYXk7XG52YXIgaXNTdHJpbmcgICAgPSBhbmd1bGFyLmlzU3RyaW5nO1xudmFyIGlzT2JqZWN0ICAgID0gYW5ndWxhci5pc09iamVjdDtcbnZhciBpc1VuZGVmaW5lZCA9IGFuZ3VsYXIuaXNVbmRlZmluZWQ7XG52YXIgaXNEZWZpbmVkICAgPSBhbmd1bGFyLmlzRGVmaW5lZDtcbnZhciBpc0Z1bmN0aW9uICA9IGFuZ3VsYXIuaXNGdW5jdGlvbjtcbnZhciBpc0VsZW1lbnQgICA9IGFuZ3VsYXIuaXNFbGVtZW50O1xuXG52YXIgRUxFTUVOVF9OT0RFID0gMTtcbnZhciBDT01NRU5UX05PREUgPSA4O1xuXG52YXIgQUREX0NMQVNTX1NVRkZJWCA9ICctYWRkJztcbnZhciBSRU1PVkVfQ0xBU1NfU1VGRklYID0gJy1yZW1vdmUnO1xudmFyIEVWRU5UX0NMQVNTX1BSRUZJWCA9ICduZy0nO1xudmFyIEFDVElWRV9DTEFTU19TVUZGSVggPSAnLWFjdGl2ZSc7XG5cbnZhciBOR19BTklNQVRFX0NMQVNTTkFNRSA9ICduZy1hbmltYXRlJztcbnZhciBOR19BTklNQVRFX0NISUxEUkVOX0RBVEEgPSAnJCRuZ0FuaW1hdGVDaGlsZHJlbic7XG5cbi8vIERldGVjdCBwcm9wZXIgdHJhbnNpdGlvbmVuZC9hbmltYXRpb25lbmQgZXZlbnQgbmFtZXMuXG52YXIgQ1NTX1BSRUZJWCA9ICcnLCBUUkFOU0lUSU9OX1BST1AsIFRSQU5TSVRJT05FTkRfRVZFTlQsIEFOSU1BVElPTl9QUk9QLCBBTklNQVRJT05FTkRfRVZFTlQ7XG5cbi8vIElmIHVucHJlZml4ZWQgZXZlbnRzIGFyZSBub3Qgc3VwcG9ydGVkIGJ1dCB3ZWJraXQtcHJlZml4ZWQgYXJlLCB1c2UgdGhlIGxhdHRlci5cbi8vIE90aGVyd2lzZSwganVzdCB1c2UgVzNDIG5hbWVzLCBicm93c2VycyBub3Qgc3VwcG9ydGluZyB0aGVtIGF0IGFsbCB3aWxsIGp1c3QgaWdub3JlIHRoZW0uXG4vLyBOb3RlOiBDaHJvbWUgaW1wbGVtZW50cyBgd2luZG93Lm9ud2Via2l0YW5pbWF0aW9uZW5kYCBhbmQgZG9lc24ndCBpbXBsZW1lbnQgYHdpbmRvdy5vbmFuaW1hdGlvbmVuZGBcbi8vIGJ1dCBhdCB0aGUgc2FtZSB0aW1lIGRpc3BhdGNoZXMgdGhlIGBhbmltYXRpb25lbmRgIGV2ZW50IGFuZCBub3QgYHdlYmtpdEFuaW1hdGlvbkVuZGAuXG4vLyBSZWdpc3RlciBib3RoIGV2ZW50cyBpbiBjYXNlIGB3aW5kb3cub25hbmltYXRpb25lbmRgIGlzIG5vdCBzdXBwb3J0ZWQgYmVjYXVzZSBvZiB0aGF0LFxuLy8gZG8gdGhlIHNhbWUgZm9yIGB0cmFuc2l0aW9uZW5kYCBhcyBTYWZhcmkgaXMgbGlrZWx5IHRvIGV4aGliaXQgc2ltaWxhciBiZWhhdmlvci5cbi8vIEFsc28sIHRoZSBvbmx5IG1vZGVybiBicm93c2VyIHRoYXQgdXNlcyB2ZW5kb3IgcHJlZml4ZXMgZm9yIHRyYW5zaXRpb25zL2tleWZyYW1lcyBpcyB3ZWJraXRcbi8vIHRoZXJlZm9yZSB0aGVyZSBpcyBubyByZWFzb24gdG8gdGVzdCBhbnltb3JlIGZvciBvdGhlciB2ZW5kb3IgcHJlZml4ZXM6XG4vLyBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD10cmFuc2l0aW9uXG5pZiAod2luZG93Lm9udHJhbnNpdGlvbmVuZCA9PT0gdW5kZWZpbmVkICYmIHdpbmRvdy5vbndlYmtpdHRyYW5zaXRpb25lbmQgIT09IHVuZGVmaW5lZCkge1xuICBDU1NfUFJFRklYID0gJy13ZWJraXQtJztcbiAgVFJBTlNJVElPTl9QUk9QID0gJ1dlYmtpdFRyYW5zaXRpb24nO1xuICBUUkFOU0lUSU9ORU5EX0VWRU5UID0gJ3dlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZCc7XG59IGVsc2Uge1xuICBUUkFOU0lUSU9OX1BST1AgPSAndHJhbnNpdGlvbic7XG4gIFRSQU5TSVRJT05FTkRfRVZFTlQgPSAndHJhbnNpdGlvbmVuZCc7XG59XG5cbmlmICh3aW5kb3cub25hbmltYXRpb25lbmQgPT09IHVuZGVmaW5lZCAmJiB3aW5kb3cub253ZWJraXRhbmltYXRpb25lbmQgIT09IHVuZGVmaW5lZCkge1xuICBDU1NfUFJFRklYID0gJy13ZWJraXQtJztcbiAgQU5JTUFUSU9OX1BST1AgPSAnV2Via2l0QW5pbWF0aW9uJztcbiAgQU5JTUFUSU9ORU5EX0VWRU5UID0gJ3dlYmtpdEFuaW1hdGlvbkVuZCBhbmltYXRpb25lbmQnO1xufSBlbHNlIHtcbiAgQU5JTUFUSU9OX1BST1AgPSAnYW5pbWF0aW9uJztcbiAgQU5JTUFUSU9ORU5EX0VWRU5UID0gJ2FuaW1hdGlvbmVuZCc7XG59XG5cbnZhciBEVVJBVElPTl9LRVkgPSAnRHVyYXRpb24nO1xudmFyIFBST1BFUlRZX0tFWSA9ICdQcm9wZXJ0eSc7XG52YXIgREVMQVlfS0VZID0gJ0RlbGF5JztcbnZhciBUSU1JTkdfS0VZID0gJ1RpbWluZ0Z1bmN0aW9uJztcbnZhciBBTklNQVRJT05fSVRFUkFUSU9OX0NPVU5UX0tFWSA9ICdJdGVyYXRpb25Db3VudCc7XG52YXIgQU5JTUFUSU9OX1BMQVlTVEFURV9LRVkgPSAnUGxheVN0YXRlJztcbnZhciBTQUZFX0ZBU1RfRk9SV0FSRF9EVVJBVElPTl9WQUxVRSA9IDk5OTk7XG5cbnZhciBBTklNQVRJT05fREVMQVlfUFJPUCA9IEFOSU1BVElPTl9QUk9QICsgREVMQVlfS0VZO1xudmFyIEFOSU1BVElPTl9EVVJBVElPTl9QUk9QID0gQU5JTUFUSU9OX1BST1AgKyBEVVJBVElPTl9LRVk7XG52YXIgVFJBTlNJVElPTl9ERUxBWV9QUk9QID0gVFJBTlNJVElPTl9QUk9QICsgREVMQVlfS0VZO1xudmFyIFRSQU5TSVRJT05fRFVSQVRJT05fUFJPUCA9IFRSQU5TSVRJT05fUFJPUCArIERVUkFUSU9OX0tFWTtcblxudmFyIGlzUHJvbWlzZUxpa2UgPSBmdW5jdGlvbihwKSB7XG4gIHJldHVybiBwICYmIHAudGhlbiA/IHRydWUgOiBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIGFzc2VydEFyZyhhcmcsIG5hbWUsIHJlYXNvbikge1xuICBpZiAoIWFyZykge1xuICAgIHRocm93IG5nTWluRXJyKCdhcmVxJywgXCJBcmd1bWVudCAnezB9JyBpcyB7MX1cIiwgKG5hbWUgfHwgJz8nKSwgKHJlYXNvbiB8fCBcInJlcXVpcmVkXCIpKTtcbiAgfVxuICByZXR1cm4gYXJnO1xufVxuXG5mdW5jdGlvbiBtZXJnZUNsYXNzZXMoYSxiKSB7XG4gIGlmICghYSAmJiAhYikgcmV0dXJuICcnO1xuICBpZiAoIWEpIHJldHVybiBiO1xuICBpZiAoIWIpIHJldHVybiBhO1xuICBpZiAoaXNBcnJheShhKSkgYSA9IGEuam9pbignICcpO1xuICBpZiAoaXNBcnJheShiKSkgYiA9IGIuam9pbignICcpO1xuICByZXR1cm4gYSArICcgJyArIGI7XG59XG5cbmZ1bmN0aW9uIHBhY2thZ2VTdHlsZXMob3B0aW9ucykge1xuICB2YXIgc3R5bGVzID0ge307XG4gIGlmIChvcHRpb25zICYmIChvcHRpb25zLnRvIHx8IG9wdGlvbnMuZnJvbSkpIHtcbiAgICBzdHlsZXMudG8gPSBvcHRpb25zLnRvO1xuICAgIHN0eWxlcy5mcm9tID0gb3B0aW9ucy5mcm9tO1xuICB9XG4gIHJldHVybiBzdHlsZXM7XG59XG5cbmZ1bmN0aW9uIHBlbmRDbGFzc2VzKGNsYXNzZXMsIGZpeCwgaXNQcmVmaXgpIHtcbiAgdmFyIGNsYXNzTmFtZSA9ICcnO1xuICBjbGFzc2VzID0gaXNBcnJheShjbGFzc2VzKVxuICAgICAgPyBjbGFzc2VzXG4gICAgICA6IGNsYXNzZXMgJiYgaXNTdHJpbmcoY2xhc3NlcykgJiYgY2xhc3Nlcy5sZW5ndGhcbiAgICAgICAgICA/IGNsYXNzZXMuc3BsaXQoL1xccysvKVxuICAgICAgICAgIDogW107XG4gIGZvckVhY2goY2xhc3NlcywgZnVuY3Rpb24oa2xhc3MsIGkpIHtcbiAgICBpZiAoa2xhc3MgJiYga2xhc3MubGVuZ3RoID4gMCkge1xuICAgICAgY2xhc3NOYW1lICs9IChpID4gMCkgPyAnICcgOiAnJztcbiAgICAgIGNsYXNzTmFtZSArPSBpc1ByZWZpeCA/IGZpeCArIGtsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBrbGFzcyArIGZpeDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG5mdW5jdGlvbiByZW1vdmVGcm9tQXJyYXkoYXJyLCB2YWwpIHtcbiAgdmFyIGluZGV4ID0gYXJyLmluZGV4T2YodmFsKTtcbiAgaWYgKHZhbCA+PSAwKSB7XG4gICAgYXJyLnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RyaXBDb21tZW50c0Zyb21FbGVtZW50KGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBqcUxpdGUpIHtcbiAgICBzd2l0Y2ggKGVsZW1lbnQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTpcbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgb2Ygc3RyaXBwaW5nIGFueXRoaW5nIGlmIHRoZSBlbGVtZW50XG4gICAgICAgIC8vIGlzIHRoZSBvbmx5IGVsZW1lbnQgd2l0aGluIHRoZSBqcUxpdGUgd3JhcHBlci5cbiAgICAgICAgLy8gKGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgcmV0YWluIHRoZSBlbGVtZW50IGluc3RhbmNlLilcbiAgICAgICAgaWYgKGVsZW1lbnRbMF0ubm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4ganFMaXRlKGV4dHJhY3RFbGVtZW50Tm9kZShlbGVtZW50KSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbGVtZW50Lm5vZGVUeXBlID09PSBFTEVNRU5UX05PREUpIHtcbiAgICByZXR1cm4ganFMaXRlKGVsZW1lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RFbGVtZW50Tm9kZShlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudFswXSkgcmV0dXJuIGVsZW1lbnQ7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlbG0gPSBlbGVtZW50W2ldO1xuICAgIGlmIChlbG0ubm9kZVR5cGUgPT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICByZXR1cm4gZWxtO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiAkJGFkZENsYXNzKCQkanFMaXRlLCBlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgZm9yRWFjaChlbGVtZW50LCBmdW5jdGlvbihlbG0pIHtcbiAgICAkJGpxTGl0ZS5hZGRDbGFzcyhlbG0sIGNsYXNzTmFtZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiAkJHJlbW92ZUNsYXNzKCQkanFMaXRlLCBlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgZm9yRWFjaChlbGVtZW50LCBmdW5jdGlvbihlbG0pIHtcbiAgICAkJGpxTGl0ZS5yZW1vdmVDbGFzcyhlbG0sIGNsYXNzTmFtZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseUFuaW1hdGlvbkNsYXNzZXNGYWN0b3J5KCQkanFMaXRlKSB7XG4gIHJldHVybiBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuYWRkQ2xhc3MpIHtcbiAgICAgICQkYWRkQ2xhc3MoJCRqcUxpdGUsIGVsZW1lbnQsIG9wdGlvbnMuYWRkQ2xhc3MpO1xuICAgICAgb3B0aW9ucy5hZGRDbGFzcyA9IG51bGw7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnJlbW92ZUNsYXNzKSB7XG4gICAgICAkJHJlbW92ZUNsYXNzKCQkanFMaXRlLCBlbGVtZW50LCBvcHRpb25zLnJlbW92ZUNsYXNzKTtcbiAgICAgIG9wdGlvbnMucmVtb3ZlQ2xhc3MgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwcmVwYXJlQW5pbWF0aW9uT3B0aW9ucyhvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoIW9wdGlvbnMuJCRwcmVwYXJlZCkge1xuICAgIHZhciBkb21PcGVyYXRpb24gPSBvcHRpb25zLmRvbU9wZXJhdGlvbiB8fCBub29wO1xuICAgIG9wdGlvbnMuZG9tT3BlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICBvcHRpb25zLiQkZG9tT3BlcmF0aW9uRmlyZWQgPSB0cnVlO1xuICAgICAgZG9tT3BlcmF0aW9uKCk7XG4gICAgICBkb21PcGVyYXRpb24gPSBub29wO1xuICAgIH07XG4gICAgb3B0aW9ucy4kJHByZXBhcmVkID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gb3B0aW9ucztcbn1cblxuZnVuY3Rpb24gYXBwbHlBbmltYXRpb25TdHlsZXMoZWxlbWVudCwgb3B0aW9ucykge1xuICBhcHBseUFuaW1hdGlvbkZyb21TdHlsZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gIGFwcGx5QW5pbWF0aW9uVG9TdHlsZXMoZWxlbWVudCwgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5QW5pbWF0aW9uRnJvbVN0eWxlcyhlbGVtZW50LCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmZyb20pIHtcbiAgICBlbGVtZW50LmNzcyhvcHRpb25zLmZyb20pO1xuICAgIG9wdGlvbnMuZnJvbSA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlBbmltYXRpb25Ub1N0eWxlcyhlbGVtZW50LCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLnRvKSB7XG4gICAgZWxlbWVudC5jc3Mob3B0aW9ucy50byk7XG4gICAgb3B0aW9ucy50byA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VBbmltYXRpb25PcHRpb25zKGVsZW1lbnQsIHRhcmdldCwgbmV3T3B0aW9ucykge1xuICB2YXIgdG9BZGQgPSAodGFyZ2V0LmFkZENsYXNzIHx8ICcnKSArICcgJyArIChuZXdPcHRpb25zLmFkZENsYXNzIHx8ICcnKTtcbiAgdmFyIHRvUmVtb3ZlID0gKHRhcmdldC5yZW1vdmVDbGFzcyB8fCAnJykgKyAnICcgKyAobmV3T3B0aW9ucy5yZW1vdmVDbGFzcyB8fCAnJyk7XG4gIHZhciBjbGFzc2VzID0gcmVzb2x2ZUVsZW1lbnRDbGFzc2VzKGVsZW1lbnQuYXR0cignY2xhc3MnKSwgdG9BZGQsIHRvUmVtb3ZlKTtcblxuICBpZiAobmV3T3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMpIHtcbiAgICB0YXJnZXQucHJlcGFyYXRpb25DbGFzc2VzID0gY29uY2F0V2l0aFNwYWNlKG5ld09wdGlvbnMucHJlcGFyYXRpb25DbGFzc2VzLCB0YXJnZXQucHJlcGFyYXRpb25DbGFzc2VzKTtcbiAgICBkZWxldGUgbmV3T3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXM7XG4gIH1cblxuICAvLyBub29wIGlzIGJhc2ljYWxseSB3aGVuIHRoZXJlIGlzIG5vIGNhbGxiYWNrOyBvdGhlcndpc2Ugc29tZXRoaW5nIGhhcyBiZWVuIHNldFxuICB2YXIgcmVhbERvbU9wZXJhdGlvbiA9IHRhcmdldC5kb21PcGVyYXRpb24gIT09IG5vb3AgPyB0YXJnZXQuZG9tT3BlcmF0aW9uIDogbnVsbDtcblxuICBleHRlbmQodGFyZ2V0LCBuZXdPcHRpb25zKTtcblxuICAvLyBUT0RPKG1hdHNrbyBvciBzcmVlcmFtdSk6IHByb3BlciBmaXggaXMgdG8gbWFpbnRhaW4gYWxsIGFuaW1hdGlvbiBjYWxsYmFjayBpbiBhcnJheSBhbmQgY2FsbCBhdCBsYXN0LGJ1dCBub3cgb25seSBsZWF2ZSBoYXMgdGhlIGNhbGxiYWNrIHNvIG5vIGlzc3VlIHdpdGggdGhpcy5cbiAgaWYgKHJlYWxEb21PcGVyYXRpb24pIHtcbiAgICB0YXJnZXQuZG9tT3BlcmF0aW9uID0gcmVhbERvbU9wZXJhdGlvbjtcbiAgfVxuXG4gIGlmIChjbGFzc2VzLmFkZENsYXNzKSB7XG4gICAgdGFyZ2V0LmFkZENsYXNzID0gY2xhc3Nlcy5hZGRDbGFzcztcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuYWRkQ2xhc3MgPSBudWxsO1xuICB9XG5cbiAgaWYgKGNsYXNzZXMucmVtb3ZlQ2xhc3MpIHtcbiAgICB0YXJnZXQucmVtb3ZlQ2xhc3MgPSBjbGFzc2VzLnJlbW92ZUNsYXNzO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldC5yZW1vdmVDbGFzcyA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlRWxlbWVudENsYXNzZXMoZXhpc3RpbmcsIHRvQWRkLCB0b1JlbW92ZSkge1xuICB2YXIgQUREX0NMQVNTID0gMTtcbiAgdmFyIFJFTU9WRV9DTEFTUyA9IC0xO1xuXG4gIHZhciBmbGFncyA9IHt9O1xuICBleGlzdGluZyA9IHNwbGl0Q2xhc3Nlc1RvTG9va3VwKGV4aXN0aW5nKTtcblxuICB0b0FkZCA9IHNwbGl0Q2xhc3Nlc1RvTG9va3VwKHRvQWRkKTtcbiAgZm9yRWFjaCh0b0FkZCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIGZsYWdzW2tleV0gPSBBRERfQ0xBU1M7XG4gIH0pO1xuXG4gIHRvUmVtb3ZlID0gc3BsaXRDbGFzc2VzVG9Mb29rdXAodG9SZW1vdmUpO1xuICBmb3JFYWNoKHRvUmVtb3ZlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgZmxhZ3Nba2V5XSA9IGZsYWdzW2tleV0gPT09IEFERF9DTEFTUyA/IG51bGwgOiBSRU1PVkVfQ0xBU1M7XG4gIH0pO1xuXG4gIHZhciBjbGFzc2VzID0ge1xuICAgIGFkZENsYXNzOiAnJyxcbiAgICByZW1vdmVDbGFzczogJydcbiAgfTtcblxuICBmb3JFYWNoKGZsYWdzLCBmdW5jdGlvbih2YWwsIGtsYXNzKSB7XG4gICAgdmFyIHByb3AsIGFsbG93O1xuICAgIGlmICh2YWwgPT09IEFERF9DTEFTUykge1xuICAgICAgcHJvcCA9ICdhZGRDbGFzcyc7XG4gICAgICBhbGxvdyA9ICFleGlzdGluZ1trbGFzc107XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IFJFTU9WRV9DTEFTUykge1xuICAgICAgcHJvcCA9ICdyZW1vdmVDbGFzcyc7XG4gICAgICBhbGxvdyA9IGV4aXN0aW5nW2tsYXNzXTtcbiAgICB9XG4gICAgaWYgKGFsbG93KSB7XG4gICAgICBpZiAoY2xhc3Nlc1twcm9wXS5sZW5ndGgpIHtcbiAgICAgICAgY2xhc3Nlc1twcm9wXSArPSAnICc7XG4gICAgICB9XG4gICAgICBjbGFzc2VzW3Byb3BdICs9IGtsYXNzO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc3BsaXRDbGFzc2VzVG9Mb29rdXAoY2xhc3Nlcykge1xuICAgIGlmIChpc1N0cmluZyhjbGFzc2VzKSkge1xuICAgICAgY2xhc3NlcyA9IGNsYXNzZXMuc3BsaXQoJyAnKTtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0ge307XG4gICAgZm9yRWFjaChjbGFzc2VzLCBmdW5jdGlvbihrbGFzcykge1xuICAgICAgLy8gc29tZXRpbWVzIHRoZSBzcGxpdCBsZWF2ZXMgZW1wdHkgc3RyaW5nIHZhbHVlc1xuICAgICAgLy8gaW5jYXNlIGV4dHJhIHNwYWNlcyB3ZXJlIGFwcGxpZWQgdG8gdGhlIG9wdGlvbnNcbiAgICAgIGlmIChrbGFzcy5sZW5ndGgpIHtcbiAgICAgICAgb2JqW2tsYXNzXSA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHJldHVybiBjbGFzc2VzO1xufVxuXG5mdW5jdGlvbiBnZXREb21Ob2RlKGVsZW1lbnQpIHtcbiAgcmV0dXJuIChlbGVtZW50IGluc3RhbmNlb2YgYW5ndWxhci5lbGVtZW50KSA/IGVsZW1lbnRbMF0gOiBlbGVtZW50O1xufVxuXG5mdW5jdGlvbiBhcHBseUdlbmVyYXRlZFByZXBhcmF0aW9uQ2xhc3NlcyhlbGVtZW50LCBldmVudCwgb3B0aW9ucykge1xuICB2YXIgY2xhc3NlcyA9ICcnO1xuICBpZiAoZXZlbnQpIHtcbiAgICBjbGFzc2VzID0gcGVuZENsYXNzZXMoZXZlbnQsIEVWRU5UX0NMQVNTX1BSRUZJWCwgdHJ1ZSk7XG4gIH1cbiAgaWYgKG9wdGlvbnMuYWRkQ2xhc3MpIHtcbiAgICBjbGFzc2VzID0gY29uY2F0V2l0aFNwYWNlKGNsYXNzZXMsIHBlbmRDbGFzc2VzKG9wdGlvbnMuYWRkQ2xhc3MsIEFERF9DTEFTU19TVUZGSVgpKTtcbiAgfVxuICBpZiAob3B0aW9ucy5yZW1vdmVDbGFzcykge1xuICAgIGNsYXNzZXMgPSBjb25jYXRXaXRoU3BhY2UoY2xhc3NlcywgcGVuZENsYXNzZXMob3B0aW9ucy5yZW1vdmVDbGFzcywgUkVNT1ZFX0NMQVNTX1NVRkZJWCkpO1xuICB9XG4gIGlmIChjbGFzc2VzLmxlbmd0aCkge1xuICAgIG9wdGlvbnMucHJlcGFyYXRpb25DbGFzc2VzID0gY2xhc3NlcztcbiAgICBlbGVtZW50LmFkZENsYXNzKGNsYXNzZXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFyR2VuZXJhdGVkQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLnByZXBhcmF0aW9uQ2xhc3Nlcykge1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3Mob3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMpO1xuICAgIG9wdGlvbnMucHJlcGFyYXRpb25DbGFzc2VzID0gbnVsbDtcbiAgfVxuICBpZiAob3B0aW9ucy5hY3RpdmVDbGFzc2VzKSB7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhvcHRpb25zLmFjdGl2ZUNsYXNzZXMpO1xuICAgIG9wdGlvbnMuYWN0aXZlQ2xhc3NlcyA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmxvY2tUcmFuc2l0aW9ucyhub2RlLCBkdXJhdGlvbikge1xuICAvLyB3ZSB1c2UgYSBuZWdhdGl2ZSBkZWxheSB2YWx1ZSBzaW5jZSBpdCBwZXJmb3JtcyBibG9ja2luZ1xuICAvLyB5ZXQgaXQgZG9lc24ndCBraWxsIGFueSBleGlzdGluZyB0cmFuc2l0aW9ucyBydW5uaW5nIG9uIHRoZVxuICAvLyBzYW1lIGVsZW1lbnQgd2hpY2ggbWFrZXMgdGhpcyBzYWZlIGZvciBjbGFzcy1iYXNlZCBhbmltYXRpb25zXG4gIHZhciB2YWx1ZSA9IGR1cmF0aW9uID8gJy0nICsgZHVyYXRpb24gKyAncycgOiAnJztcbiAgYXBwbHlJbmxpbmVTdHlsZShub2RlLCBbVFJBTlNJVElPTl9ERUxBWV9QUk9QLCB2YWx1ZV0pO1xuICByZXR1cm4gW1RSQU5TSVRJT05fREVMQVlfUFJPUCwgdmFsdWVdO1xufVxuXG5mdW5jdGlvbiBibG9ja0tleWZyYW1lQW5pbWF0aW9ucyhub2RlLCBhcHBseUJsb2NrKSB7XG4gIHZhciB2YWx1ZSA9IGFwcGx5QmxvY2sgPyAncGF1c2VkJyA6ICcnO1xuICB2YXIga2V5ID0gQU5JTUFUSU9OX1BST1AgKyBBTklNQVRJT05fUExBWVNUQVRFX0tFWTtcbiAgYXBwbHlJbmxpbmVTdHlsZShub2RlLCBba2V5LCB2YWx1ZV0pO1xuICByZXR1cm4gW2tleSwgdmFsdWVdO1xufVxuXG5mdW5jdGlvbiBhcHBseUlubGluZVN0eWxlKG5vZGUsIHN0eWxlVHVwbGUpIHtcbiAgdmFyIHByb3AgPSBzdHlsZVR1cGxlWzBdO1xuICB2YXIgdmFsdWUgPSBzdHlsZVR1cGxlWzFdO1xuICBub2RlLnN0eWxlW3Byb3BdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbmNhdFdpdGhTcGFjZShhLGIpIHtcbiAgaWYgKCFhKSByZXR1cm4gYjtcbiAgaWYgKCFiKSByZXR1cm4gYTtcbiAgcmV0dXJuIGEgKyAnICcgKyBiO1xufVxuXG5mdW5jdGlvbiAkJEJvZHlQcm92aWRlcigpIHtcbiAgdGhpcy4kZ2V0ID0gWyckZG9jdW1lbnQnLCBmdW5jdGlvbigkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4ganFMaXRlKCRkb2N1bWVudFswXS5ib2R5KTtcbiAgfV07XG59XG5cbnZhciAkJEFuaW1hdGVDaGlsZHJlbkRpcmVjdGl2ZSA9IFtmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgIHZhciB2YWwgPSBhdHRycy5uZ0FuaW1hdGVDaGlsZHJlbjtcbiAgICBpZiAoYW5ndWxhci5pc1N0cmluZyh2YWwpICYmIHZhbC5sZW5ndGggPT09IDApIHsgLy9lbXB0eSBhdHRyaWJ1dGVcbiAgICAgIGVsZW1lbnQuZGF0YShOR19BTklNQVRFX0NISUxEUkVOX0RBVEEsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhdHRycy4kb2JzZXJ2ZSgnbmdBbmltYXRlQ2hpbGRyZW4nLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlID09PSAnb24nIHx8IHZhbHVlID09PSAndHJ1ZSc7XG4gICAgICAgIGVsZW1lbnQuZGF0YShOR19BTklNQVRFX0NISUxEUkVOX0RBVEEsIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1dO1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSAkYW5pbWF0ZUNzc1xuICogQGtpbmQgb2JqZWN0XG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGUgYCRhbmltYXRlQ3NzYCBzZXJ2aWNlIGlzIGEgdXNlZnVsIHV0aWxpdHkgdG8gdHJpZ2dlciBjdXN0b21pemVkIENTUy1iYXNlZCB0cmFuc2l0aW9ucy9rZXlmcmFtZXNcbiAqIGZyb20gYSBKYXZhU2NyaXB0LWJhc2VkIGFuaW1hdGlvbiBvciBkaXJlY3RseSBmcm9tIGEgZGlyZWN0aXZlLiBUaGUgcHVycG9zZSBvZiBgJGFuaW1hdGVDc3NgIGlzIE5PVFxuICogdG8gc2lkZS1zdGVwIGhvdyBgJGFuaW1hdGVgIGFuZCBuZ0FuaW1hdGUgd29yaywgYnV0IHRoZSBnb2FsIGlzIHRvIGFsbG93IHByZS1leGlzdGluZyBhbmltYXRpb25zIG9yXG4gKiBkaXJlY3RpdmVzIHRvIGNyZWF0ZSBtb3JlIGNvbXBsZXggYW5pbWF0aW9ucyB0aGF0IGNhbiBiZSBwdXJlbHkgZHJpdmVuIHVzaW5nIENTUyBjb2RlLlxuICpcbiAqIE5vdGUgdGhhdCBvbmx5IGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBDU1MgdHJhbnNpdGlvbnMgYW5kL29yIGtleWZyYW1lIGFuaW1hdGlvbnMgYXJlIGNhcGFibGUgb2ZcbiAqIHJlbmRlcmluZyBhbmltYXRpb25zIHRyaWdnZXJlZCB2aWEgYCRhbmltYXRlQ3NzYCAoYmFkIG5ld3MgZm9yIElFOSBhbmQgbG93ZXIpLlxuICpcbiAqICMjIFVzYWdlXG4gKiBPbmNlIGFnYWluLCBgJGFuaW1hdGVDc3NgIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgaW5zaWRlIG9mIGEgcmVnaXN0ZXJlZCBKYXZhU2NyaXB0IGFuaW1hdGlvbiB0aGF0XG4gKiBpcyBwb3dlcmVkIGJ5IG5nQW5pbWF0ZS4gSXQgaXMgcG9zc2libGUgdG8gdXNlIGAkYW5pbWF0ZUNzc2AgZGlyZWN0bHkgaW5zaWRlIG9mIGEgZGlyZWN0aXZlLCBob3dldmVyLFxuICogYW55IGF1dG9tYXRpYyBjb250cm9sIG92ZXIgY2FuY2VsbGluZyBhbmltYXRpb25zIGFuZC9vciBwcmV2ZW50aW5nIGFuaW1hdGlvbnMgZnJvbSBiZWluZyBydW4gb25cbiAqIGNoaWxkIGVsZW1lbnRzIHdpbGwgbm90IGJlIGhhbmRsZWQgYnkgQW5ndWxhci4gRm9yIHRoaXMgdG8gd29yayBhcyBleHBlY3RlZCwgcGxlYXNlIHVzZSBgJGFuaW1hdGVgIHRvXG4gKiB0cmlnZ2VyIHRoZSBhbmltYXRpb24gYW5kIHRoZW4gc2V0dXAgYSBKYXZhU2NyaXB0IGFuaW1hdGlvbiB0aGF0IGluamVjdHMgYCRhbmltYXRlQ3NzYCB0byB0cmlnZ2VyXG4gKiB0aGUgQ1NTIGFuaW1hdGlvbi5cbiAqXG4gKiBUaGUgZXhhbXBsZSBiZWxvdyBzaG93cyBob3cgd2UgY2FuIGNyZWF0ZSBhIGZvbGRpbmcgYW5pbWF0aW9uIG9uIGFuIGVsZW1lbnQgdXNpbmcgYG5nLWlmYDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8IS0tIG5vdGljZSB0aGUgYGZvbGQtYW5pbWF0aW9uYCBDU1MgY2xhc3MgLS0+XG4gKiA8ZGl2IG5nLWlmPVwib25PZmZcIiBjbGFzcz1cImZvbGQtYW5pbWF0aW9uXCI+XG4gKiAgIFRoaXMgZWxlbWVudCB3aWxsIGdvIEJPT01cbiAqIDwvZGl2PlxuICogPGJ1dHRvbiBuZy1jbGljaz1cIm9uT2ZmPXRydWVcIj5Gb2xkIEluPC9idXR0b24+XG4gKiBgYGBcbiAqXG4gKiBOb3cgd2UgY3JlYXRlIHRoZSAqKkphdmFTY3JpcHQgYW5pbWF0aW9uKiogdGhhdCB3aWxsIHRyaWdnZXIgdGhlIENTUyB0cmFuc2l0aW9uOlxuICpcbiAqIGBgYGpzXG4gKiBuZ01vZHVsZS5hbmltYXRpb24oJy5mb2xkLWFuaW1hdGlvbicsIFsnJGFuaW1hdGVDc3MnLCBmdW5jdGlvbigkYW5pbWF0ZUNzcykge1xuICogICByZXR1cm4ge1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50WzBdLm9mZnNldEhlaWdodDtcbiAqICAgICAgIHJldHVybiAkYW5pbWF0ZUNzcyhlbGVtZW50LCB7XG4gKiAgICAgICAgIGZyb206IHsgaGVpZ2h0OicwcHgnIH0sXG4gKiAgICAgICAgIHRvOiB7IGhlaWdodDpoZWlnaHQgKyAncHgnIH0sXG4gKiAgICAgICAgIGR1cmF0aW9uOiAxIC8vIG9uZSBzZWNvbmRcbiAqICAgICAgIH0pO1xuICogICAgIH1cbiAqICAgfVxuICogfV0pO1xuICogYGBgXG4gKlxuICogIyMgTW9yZSBBZHZhbmNlZCBVc2VzXG4gKlxuICogYCRhbmltYXRlQ3NzYCBpcyB0aGUgdW5kZXJseWluZyBjb2RlIHRoYXQgbmdBbmltYXRlIHVzZXMgdG8gcG93ZXIgKipDU1MtYmFzZWQgYW5pbWF0aW9ucyoqIGJlaGluZCB0aGUgc2NlbmVzLiBUaGVyZWZvcmUgQ1NTIGhvb2tzXG4gKiBsaWtlIGAubmctRVZFTlRgLCBgLm5nLUVWRU5ULWFjdGl2ZWAsIGAubmctRVZFTlQtc3RhZ2dlcmAgYXJlIGFsbCBmZWF0dXJlcyB0aGF0IGNhbiBiZSB0cmlnZ2VyZWQgdXNpbmcgYCRhbmltYXRlQ3NzYCB2aWEgSmF2YVNjcmlwdCBjb2RlLlxuICpcbiAqIFRoaXMgYWxzbyBtZWFucyB0aGF0IGp1c3QgYWJvdXQgYW55IGNvbWJpbmF0aW9uIG9mIGFkZGluZyBjbGFzc2VzLCByZW1vdmluZyBjbGFzc2VzLCBzZXR0aW5nIHN0eWxlcywgZHluYW1pY2FsbHkgc2V0dGluZyBhIGtleWZyYW1lIGFuaW1hdGlvbixcbiAqIGFwcGx5aW5nIGEgaGFyZGNvZGVkIGR1cmF0aW9uIG9yIGRlbGF5IHZhbHVlLCBjaGFuZ2luZyB0aGUgYW5pbWF0aW9uIGVhc2luZyBvciBhcHBseWluZyBhIHN0YWdnZXIgYW5pbWF0aW9uIGFyZSBhbGwgb3B0aW9ucyB0aGF0IHdvcmsgd2l0aFxuICogYCRhbmltYXRlQ3NzYC4gVGhlIHNlcnZpY2UgaXRzZWxmIGlzIHNtYXJ0IGVub3VnaCB0byBmaWd1cmUgb3V0IHRoZSBjb21iaW5hdGlvbiBvZiBvcHRpb25zIGFuZCBleGFtaW5lIHRoZSBlbGVtZW50IHN0eWxpbmcgcHJvcGVydGllcyBpbiBvcmRlclxuICogdG8gcHJvdmlkZSBhIHdvcmtpbmcgYW5pbWF0aW9uIHRoYXQgd2lsbCBydW4gaW4gQ1NTLlxuICpcbiAqIFRoZSBleGFtcGxlIGJlbG93IHNob3djYXNlcyBhIG1vcmUgYWR2YW5jZWQgdmVyc2lvbiBvZiB0aGUgYC5mb2xkLWFuaW1hdGlvbmAgZnJvbSB0aGUgZXhhbXBsZSBhYm92ZTpcbiAqXG4gKiBgYGBqc1xuICogbmdNb2R1bGUuYW5pbWF0aW9uKCcuZm9sZC1hbmltYXRpb24nLCBbJyRhbmltYXRlQ3NzJywgZnVuY3Rpb24oJGFuaW1hdGVDc3MpIHtcbiAqICAgcmV0dXJuIHtcbiAqICAgICBlbnRlcjogZnVuY3Rpb24oZWxlbWVudCwgZG9uZUZuKSB7XG4gKiAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbWVudFswXS5vZmZzZXRIZWlnaHQ7XG4gKiAgICAgICByZXR1cm4gJGFuaW1hdGVDc3MoZWxlbWVudCwge1xuICogICAgICAgICBhZGRDbGFzczogJ3JlZCBsYXJnZS10ZXh0IHB1bHNlLXR3aWNlJyxcbiAqICAgICAgICAgZWFzaW5nOiAnZWFzZS1vdXQnLFxuICogICAgICAgICBmcm9tOiB7IGhlaWdodDonMHB4JyB9LFxuICogICAgICAgICB0bzogeyBoZWlnaHQ6aGVpZ2h0ICsgJ3B4JyB9LFxuICogICAgICAgICBkdXJhdGlvbjogMSAvLyBvbmUgc2Vjb25kXG4gKiAgICAgICB9KTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1dKTtcbiAqIGBgYFxuICpcbiAqIFNpbmNlIHdlJ3JlIGFkZGluZy9yZW1vdmluZyBDU1MgY2xhc3NlcyB0aGVuIHRoZSBDU1MgdHJhbnNpdGlvbiB3aWxsIGFsc28gcGljayB0aG9zZSB1cDpcbiAqXG4gKiBgYGBjc3NcbiAqIC8mIzQyOyBzaW5jZSBhIGhhcmRjb2RlZCBkdXJhdGlvbiB2YWx1ZSBvZiAxIHdhcyBwcm92aWRlZCBpbiB0aGUgSmF2YVNjcmlwdCBhbmltYXRpb24gY29kZSxcbiAqIHRoZSBDU1MgY2xhc3NlcyBiZWxvdyB3aWxsIGJlIHRyYW5zaXRpb25lZCBkZXNwaXRlIHRoZW0gYmVpbmcgZGVmaW5lZCBhcyByZWd1bGFyIENTUyBjbGFzc2VzICYjNDI7L1xuICogLnJlZCB7IGJhY2tncm91bmQ6cmVkOyB9XG4gKiAubGFyZ2UtdGV4dCB7IGZvbnQtc2l6ZToyMHB4OyB9XG4gKlxuICogLyYjNDI7IHdlIGNhbiBhbHNvIHVzZSBhIGtleWZyYW1lIGFuaW1hdGlvbiBhbmQgJGFuaW1hdGVDc3Mgd2lsbCBtYWtlIGl0IHdvcmsgYWxvbmdzaWRlIHRoZSB0cmFuc2l0aW9uICYjNDI7L1xuICogLnB1bHNlLXR3aWNlIHtcbiAqICAgYW5pbWF0aW9uOiAwLjVzIHB1bHNlIGxpbmVhciAyO1xuICogICAtd2Via2l0LWFuaW1hdGlvbjogMC41cyBwdWxzZSBsaW5lYXIgMjtcbiAqIH1cbiAqXG4gKiBAa2V5ZnJhbWVzIHB1bHNlIHtcbiAqICAgZnJvbSB7IHRyYW5zZm9ybTogc2NhbGUoMC41KTsgfVxuICogICB0byB7IHRyYW5zZm9ybTogc2NhbGUoMS41KTsgfVxuICogfVxuICpcbiAqIEAtd2Via2l0LWtleWZyYW1lcyBwdWxzZSB7XG4gKiAgIGZyb20geyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC41KTsgfVxuICogICB0byB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgxLjUpOyB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBHaXZlbiB0aGlzIGNvbXBsZXggY29tYmluYXRpb24gb2YgQ1NTIGNsYXNzZXMsIHN0eWxlcyBhbmQgb3B0aW9ucywgYCRhbmltYXRlQ3NzYCB3aWxsIGZpZ3VyZSBldmVyeXRoaW5nIG91dCBhbmQgbWFrZSB0aGUgYW5pbWF0aW9uIGhhcHBlbi5cbiAqXG4gKiAjIyBIb3cgdGhlIE9wdGlvbnMgYXJlIGhhbmRsZWRcbiAqXG4gKiBgJGFuaW1hdGVDc3NgIGlzIHZlcnkgdmVyc2F0aWxlIGFuZCBpbnRlbGxpZ2VudCB3aGVuIGl0IGNvbWVzIHRvIGZpZ3VyaW5nIG91dCB3aGF0IGNvbmZpZ3VyYXRpb25zIHRvIGFwcGx5IHRvIHRoZSBlbGVtZW50IHRvIGVuc3VyZSB0aGUgYW5pbWF0aW9uXG4gKiB3b3JrcyB3aXRoIHRoZSBvcHRpb25zIHByb3ZpZGVkLiBTYXkgZm9yIGV4YW1wbGUgd2Ugd2VyZSBhZGRpbmcgYSBjbGFzcyB0aGF0IGNvbnRhaW5lZCBhIGtleWZyYW1lIHZhbHVlIGFuZCB3ZSB3YW50ZWQgdG8gYWxzbyBhbmltYXRlIHNvbWUgaW5saW5lXG4gKiBzdHlsZXMgdXNpbmcgdGhlIGBmcm9tYCBhbmQgYHRvYCBwcm9wZXJ0aWVzLlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgYW5pbWF0b3IgPSAkYW5pbWF0ZUNzcyhlbGVtZW50LCB7XG4gKiAgIGZyb206IHsgYmFja2dyb3VuZDoncmVkJyB9LFxuICogICB0bzogeyBiYWNrZ3JvdW5kOidibHVlJyB9XG4gKiB9KTtcbiAqIGFuaW1hdG9yLnN0YXJ0KCk7XG4gKiBgYGBcbiAqXG4gKiBgYGBjc3NcbiAqIC5yb3RhdGluZy1hbmltYXRpb24ge1xuICogICBhbmltYXRpb246MC41cyByb3RhdGUgbGluZWFyO1xuICogICAtd2Via2l0LWFuaW1hdGlvbjowLjVzIHJvdGF0ZSBsaW5lYXI7XG4gKiB9XG4gKlxuICogQGtleWZyYW1lcyByb3RhdGUge1xuICogICBmcm9tIHsgdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7IH1cbiAqICAgdG8geyB0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyB9XG4gKiB9XG4gKlxuICogQC13ZWJraXQta2V5ZnJhbWVzIHJvdGF0ZSB7XG4gKiAgIGZyb20geyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9XG4gKiAgIHRvIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGUgbWlzc2luZyBwaWVjZXMgaGVyZSBhcmUgdGhhdCB3ZSBkbyBub3QgaGF2ZSBhIHRyYW5zaXRpb24gc2V0ICh3aXRoaW4gdGhlIENTUyBjb2RlIG5vciB3aXRoaW4gdGhlIGAkYW5pbWF0ZUNzc2Agb3B0aW9ucykgYW5kIHRoZSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uIGlzXG4gKiBnb2luZyB0byBiZSBkZXRlY3RlZCBmcm9tIHdoYXQgdGhlIGtleWZyYW1lIHN0eWxlcyBvbiB0aGUgQ1NTIGNsYXNzIGFyZS4gSW4gdGhpcyBldmVudCwgYCRhbmltYXRlQ3NzYCB3aWxsIGF1dG9tYXRpY2FsbHkgY3JlYXRlIGFuIGlubGluZSB0cmFuc2l0aW9uXG4gKiBzdHlsZSBtYXRjaGluZyB0aGUgZHVyYXRpb24gZGV0ZWN0ZWQgZnJvbSB0aGUga2V5ZnJhbWUgc3R5bGUgKHdoaWNoIGlzIHByZXNlbnQgaW4gdGhlIENTUyBjbGFzcyB0aGF0IGlzIGJlaW5nIGFkZGVkKSBhbmQgdGhlbiBwcmVwYXJlIGJvdGggdGhlIHRyYW5zaXRpb25cbiAqIGFuZCBrZXlmcmFtZSBhbmltYXRpb25zIHRvIHJ1biBpbiBwYXJhbGxlbCBvbiB0aGUgZWxlbWVudC4gVGhlbiB3aGVuIHRoZSBhbmltYXRpb24gaXMgdW5kZXJ3YXkgdGhlIHByb3ZpZGVkIGBmcm9tYCBhbmQgYHRvYCBDU1Mgc3R5bGVzIHdpbGwgYmUgYXBwbGllZFxuICogYW5kIHNwcmVhZCBhY3Jvc3MgdGhlIHRyYW5zaXRpb24gYW5kIGtleWZyYW1lIGFuaW1hdGlvbi5cbiAqXG4gKiAjIyBXaGF0IGlzIHJldHVybmVkXG4gKlxuICogYCRhbmltYXRlQ3NzYCB3b3JrcyBpbiB0d28gc3RhZ2VzOiBhIHByZXBhcmF0aW9uIHBoYXNlIGFuZCBhbiBhbmltYXRpb24gcGhhc2UuIFRoZXJlZm9yZSB3aGVuIGAkYW5pbWF0ZUNzc2AgaXMgZmlyc3QgY2FsbGVkIGl0IHdpbGwgTk9UIGFjdHVhbGx5XG4gKiBzdGFydCB0aGUgYW5pbWF0aW9uLiBBbGwgdGhhdCBpcyBnb2luZyBvbiBoZXJlIGlzIHRoYXQgdGhlIGVsZW1lbnQgaXMgYmVpbmcgcHJlcGFyZWQgZm9yIHRoZSBhbmltYXRpb24gKHdoaWNoIG1lYW5zIHRoYXQgdGhlIGdlbmVyYXRlZCBDU1MgY2xhc3NlcyBhcmVcbiAqIGFkZGVkIGFuZCByZW1vdmVkIG9uIHRoZSBlbGVtZW50KS4gT25jZSBgJGFuaW1hdGVDc3NgIGlzIGNhbGxlZCBpdCB3aWxsIHJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogYGBganNcbiAqIHZhciBhbmltYXRvciA9ICRhbmltYXRlQ3NzKGVsZW1lbnQsIHsgLi4uIH0pO1xuICogYGBgXG4gKlxuICogTm93IHdoYXQgZG8gdGhlIGNvbnRlbnRzIG9mIG91ciBgYW5pbWF0b3JgIHZhcmlhYmxlIGxvb2sgbGlrZTpcbiAqXG4gKiBgYGBqc1xuICoge1xuICogICAvLyBzdGFydHMgdGhlIGFuaW1hdGlvblxuICogICBzdGFydDogRnVuY3Rpb24sXG4gKlxuICogICAvLyBlbmRzIChhYm9ydHMpIHRoZSBhbmltYXRpb25cbiAqICAgZW5kOiBGdW5jdGlvblxuICogfVxuICogYGBgXG4gKlxuICogVG8gYWN0dWFsbHkgc3RhcnQgdGhlIGFuaW1hdGlvbiB3ZSBuZWVkIHRvIHJ1biBgYW5pbWF0aW9uLnN0YXJ0KClgIHdoaWNoIHdpbGwgdGhlbiByZXR1cm4gYSBwcm9taXNlIHRoYXQgd2UgY2FuIGhvb2sgaW50byB0byBkZXRlY3Qgd2hlbiB0aGUgYW5pbWF0aW9uIGVuZHMuXG4gKiBJZiB3ZSBjaG9vc2Ugbm90IHRvIHJ1biB0aGUgYW5pbWF0aW9uIHRoZW4gd2UgTVVTVCBydW4gYGFuaW1hdGlvbi5lbmQoKWAgdG8gcGVyZm9ybSBhIGNsZWFudXAgb24gdGhlIGVsZW1lbnQgKHNpbmNlIHNvbWUgQ1NTIGNsYXNzZXMgYW5kIHN0bHllcyBtYXkgaGF2ZSBiZWVuXG4gKiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGR1cmluZyB0aGUgcHJlcGFyYXRpb24gcGhhc2UpLiBOb3RlIHRoYXQgYWxsIG90aGVyIHByb3BlcnRpZXMgc3VjaCBhcyBkdXJhdGlvbiwgZGVsYXksIHRyYW5zaXRpb25zIGFuZCBrZXlmcmFtZXMgYXJlIGp1c3QgcHJvcGVydGllc1xuICogYW5kIHRoYXQgY2hhbmdpbmcgdGhlbSB3aWxsIG5vdCByZWNvbmZpZ3VyZSB0aGUgcGFyYW1ldGVycyBvZiB0aGUgYW5pbWF0aW9uLlxuICpcbiAqICMjIyBydW5uZXIuZG9uZSgpIHZzIHJ1bm5lci50aGVuKClcbiAqIEl0IGlzIGRvY3VtZW50ZWQgdGhhdCBgYW5pbWF0aW9uLnN0YXJ0KClgIHdpbGwgcmV0dXJuIGEgcHJvbWlzZSBvYmplY3QgYW5kIHRoaXMgaXMgdHJ1ZSwgaG93ZXZlciwgdGhlcmUgaXMgYWxzbyBhbiBhZGRpdGlvbmFsIG1ldGhvZCBhdmFpbGFibGUgb24gdGhlXG4gKiBydW5uZXIgY2FsbGVkIGAuZG9uZShjYWxsYmFja0ZuKWAuIFRoZSBkb25lIG1ldGhvZCB3b3JrcyB0aGUgc2FtZSBhcyBgLmZpbmFsbHkoY2FsbGJhY2tGbilgLCBob3dldmVyLCBpdCBkb2VzICoqbm90IHRyaWdnZXIgYSBkaWdlc3QgdG8gb2NjdXIqKi5cbiAqIFRoZXJlZm9yZSwgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIGl0J3MgYWx3YXlzIGJlc3QgdG8gdXNlIGBydW5uZXIuZG9uZShjYWxsYmFjaylgIGluc3RlYWQgb2YgYHJ1bm5lci50aGVuKClgLCBgcnVubmVyLmNhdGNoKClgIG9yIGBydW5uZXIuZmluYWxseSgpYFxuICogdW5sZXNzIHlvdSByZWFsbHkgbmVlZCBhIGRpZ2VzdCB0byBraWNrIG9mZiBhZnRlcndhcmRzLlxuICpcbiAqIEtlZXAgaW4gbWluZCB0aGF0LCB0byBtYWtlIHRoaXMgZWFzaWVyLCBuZ0FuaW1hdGUgaGFzIHR3ZWFrZWQgdGhlIEpTIGFuaW1hdGlvbnMgQVBJIHRvIHJlY29nbml6ZSB3aGVuIGEgcnVubmVyIGluc3RhbmNlIGlzIHJldHVybmVkIGZyb20gJGFuaW1hdGVDc3NcbiAqIChzbyB0aGVyZSBpcyBubyBuZWVkIHRvIGNhbGwgYHJ1bm5lci5kb25lKGRvbmVGbilgIGluc2lkZSBvZiB5b3VyIEphdmFTY3JpcHQgYW5pbWF0aW9uIGNvZGUpLlxuICogQ2hlY2sgdGhlIHtAbGluayBuZ0FuaW1hdGUuJGFuaW1hdGVDc3MjdXNhZ2UgYW5pbWF0aW9uIGNvZGUgYWJvdmV9IHRvIHNlZSBob3cgdGhpcyB3b3Jrcy5cbiAqXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IGVsZW1lbnQgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIGFuaW1hdGVkXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB0aGUgYW5pbWF0aW9uLXJlbGF0ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgYXBwbGllZCBkdXJpbmcgdGhlIGFuaW1hdGlvblxuICpcbiAqICogYGV2ZW50YCAtIFRoZSBET00gZXZlbnQgKGUuZy4gZW50ZXIsIGxlYXZlLCBtb3ZlKS4gV2hlbiB1c2VkLCBhIGdlbmVyYXRlZCBDU1MgY2xhc3Mgb2YgYG5nLUVWRU5UYCBhbmQgYG5nLUVWRU5ULWFjdGl2ZWAgd2lsbCBiZSBhcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudCBkdXJpbmcgdGhlIGFuaW1hdGlvbi4gTXVsdGlwbGUgZXZlbnRzIGNhbiBiZSBwcm92aWRlZCB3aGVuIHNwYWNlcyBhcmUgdXNlZCBhcyBhIHNlcGFyYXRvci4gKE5vdGUgdGhhdCB0aGlzIHdpbGwgbm90IHBlcmZvcm0gYW55IERPTSBvcGVyYXRpb24uKVxuICogKiBgZWFzaW5nYCAtIFRoZSBDU1MgZWFzaW5nIHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSB0cmFuc2l0aW9uIG9yIGtleWZyYW1lIGFuaW1hdGlvbiAob3IgYm90aCkuXG4gKiAqIGB0cmFuc2l0aW9uYCAtIFRoZSByYXcgQ1NTIHRyYW5zaXRpb24gc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgKGUuZy4gYDFzIGxpbmVhciBhbGxgKS5cbiAqICogYGtleWZyYW1lU3R5bGVgIC0gVGhlIHJhdyBDU1Mga2V5ZnJhbWUgYW5pbWF0aW9uIHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIChlLmcuIGAxcyBteV9hbmltYXRpb24gbGluZWFyYCkuXG4gKiAqIGBmcm9tYCAtIFRoZSBzdGFydGluZyBDU1Mgc3R5bGVzIChhIGtleS92YWx1ZSBvYmplY3QpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGF0IHRoZSBzdGFydCBvZiB0aGUgYW5pbWF0aW9uLlxuICogKiBgdG9gIC0gVGhlIGVuZGluZyBDU1Mgc3R5bGVzIChhIGtleS92YWx1ZSBvYmplY3QpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGFjcm9zcyB0aGUgYW5pbWF0aW9uIHZpYSBhIENTUyB0cmFuc2l0aW9uLlxuICogKiBgYWRkQ2xhc3NgIC0gQSBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGVsZW1lbnQgYW5kIHNwcmVhZCBhY3Jvc3MgdGhlIGFuaW1hdGlvbi5cbiAqICogYHJlbW92ZUNsYXNzYCAtIEEgc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCBhbmQgc3ByZWFkIGFjcm9zcyB0aGUgYW5pbWF0aW9uLlxuICogKiBgZHVyYXRpb25gIC0gQSBudW1iZXIgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdHJhbnNpdGlvbiBhbmQvb3Iga2V5ZnJhbWUgKG5vdGUgdGhhdCBhIHZhbHVlIG9mIDEgaXMgMTAwMG1zKS4gSWYgYSB2YWx1ZSBvZiBgMGBcbiAqIGlzIHByb3ZpZGVkIHRoZW4gdGhlIGFuaW1hdGlvbiB3aWxsIGJlIHNraXBwZWQgZW50aXJlbHkuXG4gKiAqIGBkZWxheWAgLSBBIG51bWJlciB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIHRvdGFsIGRlbGF5IG9mIHRoZSB0cmFuc2l0aW9uIGFuZC9vciBrZXlmcmFtZSAobm90ZSB0aGF0IGEgdmFsdWUgb2YgMSBpcyAxMDAwbXMpLiBJZiBhIHZhbHVlIG9mIGB0cnVlYCBpc1xuICogdXNlZCB0aGVuIHdoYXRldmVyIGRlbGF5IHZhbHVlIGlzIGRldGVjdGVkIGZyb20gdGhlIENTUyBjbGFzc2VzIHdpbGwgYmUgbWlycm9yZWQgb24gdGhlIGVsZW1lbnRzIHN0eWxlcyAoZS5nLiBieSBzZXR0aW5nIGRlbGF5IHRydWUgdGhlbiB0aGUgc3R5bGUgdmFsdWVcbiAqIG9mIHRoZSBlbGVtZW50IHdpbGwgYmUgYHRyYW5zaXRpb24tZGVsYXk6IERFVEVDVEVEX1ZBTFVFYCkuIFVzaW5nIGB0cnVlYCBpcyB1c2VmdWwgd2hlbiB5b3Ugd2FudCB0aGUgQ1NTIGNsYXNzZXMgYW5kIGlubGluZSBzdHlsZXMgdG8gYWxsIHNoYXJlIHRoZSBzYW1lXG4gKiBDU1MgZGVsYXkgdmFsdWUuXG4gKiAqIGBzdGFnZ2VyYCAtIEEgbnVtZXJpYyB0aW1lIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZGVsYXkgYmV0d2VlbiBzdWNjZXNzaXZlbHkgYW5pbWF0ZWQgZWxlbWVudHNcbiAqICh7QGxpbmsgbmdBbmltYXRlI2Nzcy1zdGFnZ2VyaW5nLWFuaW1hdGlvbnMgQ2xpY2sgaGVyZSB0byBsZWFybiBob3cgQ1NTLWJhc2VkIHN0YWdnZXJpbmcgd29ya3MgaW4gbmdBbmltYXRlLn0pXG4gKiAqIGBzdGFnZ2VySW5kZXhgIC0gVGhlIG51bWVyaWMgaW5kZXggcmVwcmVzZW50aW5nIHRoZSBzdGFnZ2VyIGl0ZW0gKGUuZy4gYSB2YWx1ZSBvZiA1IGlzIGVxdWFsIHRvIHRoZSBzaXh0aCBpdGVtIGluIHRoZSBzdGFnZ2VyOyB0aGVyZWZvcmUgd2hlbiBhXG4gKiAqIGBzdGFnZ2VyYCBvcHRpb24gdmFsdWUgb2YgYDAuMWAgaXMgdXNlZCB0aGVuIHRoZXJlIHdpbGwgYmUgYSBzdGFnZ2VyIGRlbGF5IG9mIGA2MDBtc2ApXG4gKiAqIGBhcHBseUNsYXNzZXNFYXJseWAgLSBXaGV0aGVyIG9yIG5vdCB0aGUgY2xhc3NlcyBiZWluZyBhZGRlZCBvciByZW1vdmVkIHdpbGwgYmUgdXNlZCB3aGVuIGRldGVjdGluZyB0aGUgYW5pbWF0aW9uLiBUaGlzIGlzIHNldCBieSBgJGFuaW1hdGVgIHdoZW4gZW50ZXIvbGVhdmUvbW92ZSBhbmltYXRpb25zIGFyZSBmaXJlZCB0byBlbnN1cmUgdGhhdCB0aGUgQ1NTIGNsYXNzZXMgYXJlIHJlc29sdmVkIGluIHRpbWUuIChOb3RlIHRoYXQgdGhpcyB3aWxsIHByZXZlbnQgYW55IHRyYW5zaXRpb25zIGZyb20gb2NjdXJpbmcgb24gdGhlIGNsYXNzZXMgYmVpbmcgYWRkZWQgYW5kIHJlbW92ZWQuKVxuICpcbiAqIEByZXR1cm4ge29iamVjdH0gYW4gb2JqZWN0IHdpdGggc3RhcnQgYW5kIGVuZCBtZXRob2RzIGFuZCBkZXRhaWxzIGFib3V0IHRoZSBhbmltYXRpb24uXG4gKlxuICogKiBgc3RhcnRgIC0gVGhlIG1ldGhvZCB0byBzdGFydCB0aGUgYW5pbWF0aW9uLiBUaGlzIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoZW4gY2FsbGVkLlxuICogKiBgZW5kYCAtIFRoaXMgbWV0aG9kIHdpbGwgY2FuY2VsIHRoZSBhbmltYXRpb24gYW5kIHJlbW92ZSBhbGwgYXBwbGllZCBDU1MgY2xhc3NlcyBhbmQgc3R5bGVzLlxuICovXG52YXIgT05FX1NFQ09ORCA9IDEwMDA7XG52YXIgQkFTRV9URU4gPSAxMDtcblxudmFyIEVMQVBTRURfVElNRV9NQVhfREVDSU1BTF9QTEFDRVMgPSAzO1xudmFyIENMT1NJTkdfVElNRV9CVUZGRVIgPSAxLjU7XG5cbnZhciBERVRFQ1RfQ1NTX1BST1BFUlRJRVMgPSB7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogICAgICBUUkFOU0lUSU9OX0RVUkFUSU9OX1BST1AsXG4gIHRyYW5zaXRpb25EZWxheTogICAgICAgICBUUkFOU0lUSU9OX0RFTEFZX1BST1AsXG4gIHRyYW5zaXRpb25Qcm9wZXJ0eTogICAgICBUUkFOU0lUSU9OX1BST1AgKyBQUk9QRVJUWV9LRVksXG4gIGFuaW1hdGlvbkR1cmF0aW9uOiAgICAgICBBTklNQVRJT05fRFVSQVRJT05fUFJPUCxcbiAgYW5pbWF0aW9uRGVsYXk6ICAgICAgICAgIEFOSU1BVElPTl9ERUxBWV9QUk9QLFxuICBhbmltYXRpb25JdGVyYXRpb25Db3VudDogQU5JTUFUSU9OX1BST1AgKyBBTklNQVRJT05fSVRFUkFUSU9OX0NPVU5UX0tFWVxufTtcblxudmFyIERFVEVDVF9TVEFHR0VSX0NTU19QUk9QRVJUSUVTID0ge1xuICB0cmFuc2l0aW9uRHVyYXRpb246ICAgICAgVFJBTlNJVElPTl9EVVJBVElPTl9QUk9QLFxuICB0cmFuc2l0aW9uRGVsYXk6ICAgICAgICAgVFJBTlNJVElPTl9ERUxBWV9QUk9QLFxuICBhbmltYXRpb25EdXJhdGlvbjogICAgICAgQU5JTUFUSU9OX0RVUkFUSU9OX1BST1AsXG4gIGFuaW1hdGlvbkRlbGF5OiAgICAgICAgICBBTklNQVRJT05fREVMQVlfUFJPUFxufTtcblxuZnVuY3Rpb24gZ2V0Q3NzS2V5ZnJhbWVEdXJhdGlvblN0eWxlKGR1cmF0aW9uKSB7XG4gIHJldHVybiBbQU5JTUFUSU9OX0RVUkFUSU9OX1BST1AsIGR1cmF0aW9uICsgJ3MnXTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3NzRGVsYXlTdHlsZShkZWxheSwgaXNLZXlmcmFtZUFuaW1hdGlvbikge1xuICB2YXIgcHJvcCA9IGlzS2V5ZnJhbWVBbmltYXRpb24gPyBBTklNQVRJT05fREVMQVlfUFJPUCA6IFRSQU5TSVRJT05fREVMQVlfUFJPUDtcbiAgcmV0dXJuIFtwcm9wLCBkZWxheSArICdzJ107XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDc3NTdHlsZXMoJHdpbmRvdywgZWxlbWVudCwgcHJvcGVydGllcykge1xuICB2YXIgc3R5bGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdmFyIGRldGVjdGVkU3R5bGVzID0gJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIHx8IHt9O1xuICBmb3JFYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGZvcm1hbFN0eWxlTmFtZSwgYWN0dWFsU3R5bGVOYW1lKSB7XG4gICAgdmFyIHZhbCA9IGRldGVjdGVkU3R5bGVzW2Zvcm1hbFN0eWxlTmFtZV07XG4gICAgaWYgKHZhbCkge1xuICAgICAgdmFyIGMgPSB2YWwuY2hhckF0KDApO1xuXG4gICAgICAvLyBvbmx5IG51bWVyaWNhbC1iYXNlZCB2YWx1ZXMgaGF2ZSBhIG5lZ2F0aXZlIHNpZ24gb3IgZGlnaXQgYXMgdGhlIGZpcnN0IHZhbHVlXG4gICAgICBpZiAoYyA9PT0gJy0nIHx8IGMgPT09ICcrJyB8fCBjID49IDApIHtcbiAgICAgICAgdmFsID0gcGFyc2VNYXhUaW1lKHZhbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGJ5IHNldHRpbmcgdGhpcyB0byBudWxsIGluIHRoZSBldmVudCB0aGF0IHRoZSBkZWxheSBpcyBub3Qgc2V0IG9yIGlzIHNldCBkaXJlY3RseSBhcyAwXG4gICAgICAvLyB0aGVuIHdlIGNhbiBzdGlsbCBhbGxvdyBmb3IgemVnYXRpdmUgdmFsdWVzIHRvIGJlIHVzZWQgbGF0ZXIgb24gYW5kIG5vdCBtaXN0YWtlIHRoaXNcbiAgICAgIC8vIHZhbHVlIGZvciBiZWluZyBncmVhdGVyIHRoYW4gYW55IG90aGVyIG5lZ2F0aXZlIHZhbHVlLlxuICAgICAgaWYgKHZhbCA9PT0gMCkge1xuICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgfVxuICAgICAgc3R5bGVzW2FjdHVhbFN0eWxlTmFtZV0gPSB2YWw7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gc3R5bGVzO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1heFRpbWUoc3RyKSB7XG4gIHZhciBtYXhWYWx1ZSA9IDA7XG4gIHZhciB2YWx1ZXMgPSBzdHIuc3BsaXQoL1xccyosXFxzKi8pO1xuICBmb3JFYWNoKHZhbHVlcywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvLyBpdCdzIGFsd2F5cyBzYWZlIHRvIGNvbnNpZGVyIG9ubHkgc2Vjb25kIHZhbHVlcyBhbmQgb21pdCBgbXNgIHZhbHVlcyBzaW5jZVxuICAgIC8vIGdldENvbXB1dGVkU3R5bGUgd2lsbCBhbHdheXMgaGFuZGxlIHRoZSBjb252ZXJzaW9uIGZvciB1c1xuICAgIGlmICh2YWx1ZS5jaGFyQXQodmFsdWUubGVuZ3RoIC0gMSkgPT0gJ3MnKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YWx1ZS5sZW5ndGggLSAxKTtcbiAgICB9XG4gICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKSB8fCAwO1xuICAgIG1heFZhbHVlID0gbWF4VmFsdWUgPyBNYXRoLm1heCh2YWx1ZSwgbWF4VmFsdWUpIDogdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gbWF4VmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydXRoeVRpbWluZ1ZhbHVlKHZhbCkge1xuICByZXR1cm4gdmFsID09PSAwIHx8IHZhbCAhPSBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRDc3NUcmFuc2l0aW9uRHVyYXRpb25TdHlsZShkdXJhdGlvbiwgYXBwbHlPbmx5RHVyYXRpb24pIHtcbiAgdmFyIHN0eWxlID0gVFJBTlNJVElPTl9QUk9QO1xuICB2YXIgdmFsdWUgPSBkdXJhdGlvbiArICdzJztcbiAgaWYgKGFwcGx5T25seUR1cmF0aW9uKSB7XG4gICAgc3R5bGUgKz0gRFVSQVRJT05fS0VZO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlICs9ICcgbGluZWFyIGFsbCc7XG4gIH1cbiAgcmV0dXJuIFtzdHlsZSwgdmFsdWVdO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbENhY2hlTG9va3VwKCkge1xuICB2YXIgY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZXR1cm4ge1xuICAgIGZsdXNoOiBmdW5jdGlvbigpIHtcbiAgICAgIGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9LFxuXG4gICAgY291bnQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGVudHJ5ID0gY2FjaGVba2V5XTtcbiAgICAgIHJldHVybiBlbnRyeSA/IGVudHJ5LnRvdGFsIDogMDtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBlbnRyeSA9IGNhY2hlW2tleV07XG4gICAgICByZXR1cm4gZW50cnkgJiYgZW50cnkudmFsdWU7XG4gICAgfSxcblxuICAgIHB1dDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgaWYgKCFjYWNoZVtrZXldKSB7XG4gICAgICAgIGNhY2hlW2tleV0gPSB7IHRvdGFsOiAxLCB2YWx1ZTogdmFsdWUgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhY2hlW2tleV0udG90YWwrKztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbnZhciAkQW5pbWF0ZUNzc1Byb3ZpZGVyID0gWyckYW5pbWF0ZVByb3ZpZGVyJywgZnVuY3Rpb24oJGFuaW1hdGVQcm92aWRlcikge1xuICB2YXIgZ2NzTG9va3VwID0gY3JlYXRlTG9jYWxDYWNoZUxvb2t1cCgpO1xuICB2YXIgZ2NzU3RhZ2dlckxvb2t1cCA9IGNyZWF0ZUxvY2FsQ2FjaGVMb29rdXAoKTtcblxuICB0aGlzLiRnZXQgPSBbJyR3aW5kb3cnLCAnJCRqcUxpdGUnLCAnJCRBbmltYXRlUnVubmVyJywgJyR0aW1lb3V0JywgJyQkZm9yY2VSZWZsb3cnLCAnJHNuaWZmZXInLCAnJCRyQUYnLFxuICAgICAgIGZ1bmN0aW9uKCR3aW5kb3csICAgJCRqcUxpdGUsICAgJCRBbmltYXRlUnVubmVyLCAgICR0aW1lb3V0LCAgICQkZm9yY2VSZWZsb3csICAgJHNuaWZmZXIsICAgJCRyQUYpIHtcblxuICAgIHZhciBhcHBseUFuaW1hdGlvbkNsYXNzZXMgPSBhcHBseUFuaW1hdGlvbkNsYXNzZXNGYWN0b3J5KCQkanFMaXRlKTtcblxuICAgIHZhciBwYXJlbnRDb3VudGVyID0gMDtcbiAgICBmdW5jdGlvbiBnY3NIYXNoRm4obm9kZSwgZXh0cmFDbGFzc2VzKSB7XG4gICAgICB2YXIgS0VZID0gXCIkJG5nQW5pbWF0ZVBhcmVudEtleVwiO1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICB2YXIgcGFyZW50SUQgPSBwYXJlbnROb2RlW0tFWV0gfHwgKHBhcmVudE5vZGVbS0VZXSA9ICsrcGFyZW50Q291bnRlcik7XG4gICAgICByZXR1cm4gcGFyZW50SUQgKyAnLScgKyBub2RlLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSArICctJyArIGV4dHJhQ2xhc3NlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlQ2FjaGVkQ3NzU3R5bGVzKG5vZGUsIGNsYXNzTmFtZSwgY2FjaGVLZXksIHByb3BlcnRpZXMpIHtcbiAgICAgIHZhciB0aW1pbmdzID0gZ2NzTG9va3VwLmdldChjYWNoZUtleSk7XG5cbiAgICAgIGlmICghdGltaW5ncykge1xuICAgICAgICB0aW1pbmdzID0gY29tcHV0ZUNzc1N0eWxlcygkd2luZG93LCBub2RlLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgaWYgKHRpbWluZ3MuYW5pbWF0aW9uSXRlcmF0aW9uQ291bnQgPT09ICdpbmZpbml0ZScpIHtcbiAgICAgICAgICB0aW1pbmdzLmFuaW1hdGlvbkl0ZXJhdGlvbkNvdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyB3ZSBrZWVwIHB1dHRpbmcgdGhpcyBpbiBtdWx0aXBsZSB0aW1lcyBldmVuIHRob3VnaCB0aGUgdmFsdWUgYW5kIHRoZSBjYWNoZUtleSBhcmUgdGhlIHNhbWVcbiAgICAgIC8vIGJlY2F1c2Ugd2UncmUga2VlcGluZyBhbiBpbnRlcmFsIHRhbGx5IG9mIGhvdyBtYW55IGR1cGxpY2F0ZSBhbmltYXRpb25zIGFyZSBkZXRlY3RlZC5cbiAgICAgIGdjc0xvb2t1cC5wdXQoY2FjaGVLZXksIHRpbWluZ3MpO1xuICAgICAgcmV0dXJuIHRpbWluZ3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUNhY2hlZENzc1N0YWdnZXJTdHlsZXMobm9kZSwgY2xhc3NOYW1lLCBjYWNoZUtleSwgcHJvcGVydGllcykge1xuICAgICAgdmFyIHN0YWdnZXI7XG5cbiAgICAgIC8vIGlmIHdlIGhhdmUgb25lIG9yIG1vcmUgZXhpc3RpbmcgbWF0Y2hlcyBvZiBtYXRjaGluZyBlbGVtZW50c1xuICAgICAgLy8gY29udGFpbmluZyB0aGUgc2FtZSBwYXJlbnQgKyBDU1Mgc3R5bGVzICh3aGljaCBpcyBob3cgY2FjaGVLZXkgd29ya3MpXG4gICAgICAvLyB0aGVuIHN0YWdnZXJpbmcgaXMgcG9zc2libGVcbiAgICAgIGlmIChnY3NMb29rdXAuY291bnQoY2FjaGVLZXkpID4gMCkge1xuICAgICAgICBzdGFnZ2VyID0gZ2NzU3RhZ2dlckxvb2t1cC5nZXQoY2FjaGVLZXkpO1xuXG4gICAgICAgIGlmICghc3RhZ2dlcikge1xuICAgICAgICAgIHZhciBzdGFnZ2VyQ2xhc3NOYW1lID0gcGVuZENsYXNzZXMoY2xhc3NOYW1lLCAnLXN0YWdnZXInKTtcblxuICAgICAgICAgICQkanFMaXRlLmFkZENsYXNzKG5vZGUsIHN0YWdnZXJDbGFzc05hbWUpO1xuXG4gICAgICAgICAgc3RhZ2dlciA9IGNvbXB1dGVDc3NTdHlsZXMoJHdpbmRvdywgbm9kZSwgcHJvcGVydGllcyk7XG5cbiAgICAgICAgICAvLyBmb3JjZSB0aGUgY29udmVyc2lvbiBvZiBhIG51bGwgdmFsdWUgdG8gemVybyBpbmNhc2Ugbm90IHNldFxuICAgICAgICAgIHN0YWdnZXIuYW5pbWF0aW9uRHVyYXRpb24gPSBNYXRoLm1heChzdGFnZ2VyLmFuaW1hdGlvbkR1cmF0aW9uLCAwKTtcbiAgICAgICAgICBzdGFnZ2VyLnRyYW5zaXRpb25EdXJhdGlvbiA9IE1hdGgubWF4KHN0YWdnZXIudHJhbnNpdGlvbkR1cmF0aW9uLCAwKTtcblxuICAgICAgICAgICQkanFMaXRlLnJlbW92ZUNsYXNzKG5vZGUsIHN0YWdnZXJDbGFzc05hbWUpO1xuXG4gICAgICAgICAgZ2NzU3RhZ2dlckxvb2t1cC5wdXQoY2FjaGVLZXksIHN0YWdnZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdGFnZ2VyIHx8IHt9O1xuICAgIH1cblxuICAgIHZhciBjYW5jZWxMYXN0UkFGUmVxdWVzdDtcbiAgICB2YXIgcmFmV2FpdFF1ZXVlID0gW107XG4gICAgZnVuY3Rpb24gd2FpdFVudGlsUXVpZXQoY2FsbGJhY2spIHtcbiAgICAgIGlmIChjYW5jZWxMYXN0UkFGUmVxdWVzdCkge1xuICAgICAgICBjYW5jZWxMYXN0UkFGUmVxdWVzdCgpOyAvL2NhbmNlbHMgdGhlIHJlcXVlc3RcbiAgICAgIH1cbiAgICAgIHJhZldhaXRRdWV1ZS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIGNhbmNlbExhc3RSQUZSZXF1ZXN0ID0gJCRyQUYoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNhbmNlbExhc3RSQUZSZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgZ2NzTG9va3VwLmZsdXNoKCk7XG4gICAgICAgIGdjc1N0YWdnZXJMb29rdXAuZmx1c2goKTtcblxuICAgICAgICAvLyBETyBOT1QgUkVNT1ZFIFRISVMgTElORSBPUiBSRUZBQ1RPUiBPVVQgVEhFIGBwYWdlV2lkdGhgIHZhcmlhYmxlLlxuICAgICAgICAvLyBQTEVBU0UgRVhBTUlORSBUSEUgYCQkZm9yY2VSZWZsb3dgIHNlcnZpY2UgdG8gdW5kZXJzdGFuZCB3aHkuXG4gICAgICAgIHZhciBwYWdlV2lkdGggPSAkJGZvcmNlUmVmbG93KCk7XG5cbiAgICAgICAgLy8gd2UgdXNlIGEgZm9yIGxvb3AgdG8gZW5zdXJlIHRoYXQgaWYgdGhlIHF1ZXVlIGlzIGNoYW5nZWRcbiAgICAgICAgLy8gZHVyaW5nIHRoaXMgbG9vcGluZyB0aGVuIGl0IHdpbGwgY29uc2lkZXIgbmV3IHJlcXVlc3RzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFmV2FpdFF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcmFmV2FpdFF1ZXVlW2ldKHBhZ2VXaWR0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmFmV2FpdFF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5pdDtcblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVUaW1pbmdzKG5vZGUsIGNsYXNzTmFtZSwgY2FjaGVLZXkpIHtcbiAgICAgIHZhciB0aW1pbmdzID0gY29tcHV0ZUNhY2hlZENzc1N0eWxlcyhub2RlLCBjbGFzc05hbWUsIGNhY2hlS2V5LCBERVRFQ1RfQ1NTX1BST1BFUlRJRVMpO1xuICAgICAgdmFyIGFEID0gdGltaW5ncy5hbmltYXRpb25EZWxheTtcbiAgICAgIHZhciB0RCA9IHRpbWluZ3MudHJhbnNpdGlvbkRlbGF5O1xuICAgICAgdGltaW5ncy5tYXhEZWxheSA9IGFEICYmIHREXG4gICAgICAgICAgPyBNYXRoLm1heChhRCwgdEQpXG4gICAgICAgICAgOiAoYUQgfHwgdEQpO1xuICAgICAgdGltaW5ncy5tYXhEdXJhdGlvbiA9IE1hdGgubWF4KFxuICAgICAgICAgIHRpbWluZ3MuYW5pbWF0aW9uRHVyYXRpb24gKiB0aW1pbmdzLmFuaW1hdGlvbkl0ZXJhdGlvbkNvdW50LFxuICAgICAgICAgIHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uKTtcblxuICAgICAgcmV0dXJuIHRpbWluZ3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICBpZiAoIW5vZGUgfHwgIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm4gY2xvc2VBbmRSZXR1cm5Ob29wQW5pbWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHByZXBhcmVBbmltYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICB2YXIgdGVtcG9yYXJ5U3R5bGVzID0gW107XG4gICAgICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgIHZhciBzdHlsZXMgPSBwYWNrYWdlU3R5bGVzKG9wdGlvbnMpO1xuICAgICAgdmFyIGFuaW1hdGlvbkNsb3NlZDtcbiAgICAgIHZhciBhbmltYXRpb25QYXVzZWQ7XG4gICAgICB2YXIgYW5pbWF0aW9uQ29tcGxldGVkO1xuICAgICAgdmFyIHJ1bm5lcjtcbiAgICAgIHZhciBydW5uZXJIb3N0O1xuICAgICAgdmFyIG1heERlbGF5O1xuICAgICAgdmFyIG1heERlbGF5VGltZTtcbiAgICAgIHZhciBtYXhEdXJhdGlvbjtcbiAgICAgIHZhciBtYXhEdXJhdGlvblRpbWU7XG5cbiAgICAgIGlmIChvcHRpb25zLmR1cmF0aW9uID09PSAwIHx8ICghJHNuaWZmZXIuYW5pbWF0aW9ucyAmJiAhJHNuaWZmZXIudHJhbnNpdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBjbG9zZUFuZFJldHVybk5vb3BBbmltYXRvcigpO1xuICAgICAgfVxuXG4gICAgICB2YXIgbWV0aG9kID0gb3B0aW9ucy5ldmVudCAmJiBpc0FycmF5KG9wdGlvbnMuZXZlbnQpXG4gICAgICAgICAgICA/IG9wdGlvbnMuZXZlbnQuam9pbignICcpXG4gICAgICAgICAgICA6IG9wdGlvbnMuZXZlbnQ7XG5cbiAgICAgIHZhciBpc1N0cnVjdHVyYWwgPSBtZXRob2QgJiYgb3B0aW9ucy5zdHJ1Y3R1cmFsO1xuICAgICAgdmFyIHN0cnVjdHVyYWxDbGFzc05hbWUgPSAnJztcbiAgICAgIHZhciBhZGRSZW1vdmVDbGFzc05hbWUgPSAnJztcblxuICAgICAgaWYgKGlzU3RydWN0dXJhbCkge1xuICAgICAgICBzdHJ1Y3R1cmFsQ2xhc3NOYW1lID0gcGVuZENsYXNzZXMobWV0aG9kLCBFVkVOVF9DTEFTU19QUkVGSVgsIHRydWUpO1xuICAgICAgfSBlbHNlIGlmIChtZXRob2QpIHtcbiAgICAgICAgc3RydWN0dXJhbENsYXNzTmFtZSA9IG1ldGhvZDtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuYWRkQ2xhc3MpIHtcbiAgICAgICAgYWRkUmVtb3ZlQ2xhc3NOYW1lICs9IHBlbmRDbGFzc2VzKG9wdGlvbnMuYWRkQ2xhc3MsIEFERF9DTEFTU19TVUZGSVgpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5yZW1vdmVDbGFzcykge1xuICAgICAgICBpZiAoYWRkUmVtb3ZlQ2xhc3NOYW1lLmxlbmd0aCkge1xuICAgICAgICAgIGFkZFJlbW92ZUNsYXNzTmFtZSArPSAnICc7XG4gICAgICAgIH1cbiAgICAgICAgYWRkUmVtb3ZlQ2xhc3NOYW1lICs9IHBlbmRDbGFzc2VzKG9wdGlvbnMucmVtb3ZlQ2xhc3MsIFJFTU9WRV9DTEFTU19TVUZGSVgpO1xuICAgICAgfVxuXG4gICAgICAvLyB0aGVyZSBtYXkgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBzdHJ1Y3R1cmFsIGFuaW1hdGlvbiBpcyBjb21iaW5lZCB0b2dldGhlclxuICAgICAgLy8gd2l0aCBDU1MgY2xhc3NlcyB0aGF0IG5lZWQgdG8gcmVzb2x2ZSBiZWZvcmUgdGhlIGFuaW1hdGlvbiBpcyBjb21wdXRlZC5cbiAgICAgIC8vIEhvd2V2ZXIgdGhpcyBtZWFucyB0aGF0IHRoZXJlIGlzIG5vIGV4cGxpY2l0IENTUyBjb2RlIHRvIGJsb2NrIHRoZSBhbmltYXRpb25cbiAgICAgIC8vIGZyb20gaGFwcGVuaW5nIChieSBzZXR0aW5nIDBzIG5vbmUgaW4gdGhlIGNsYXNzIG5hbWUpLiBJZiB0aGlzIGlzIHRoZSBjYXNlXG4gICAgICAvLyB3ZSBuZWVkIHRvIGFwcGx5IHRoZSBjbGFzc2VzIGJlZm9yZSB0aGUgZmlyc3QgckFGIHNvIHdlIGtub3cgdG8gY29udGludWUgaWZcbiAgICAgIC8vIHRoZXJlIGFjdHVhbGx5IGlzIGEgZGV0ZWN0ZWQgdHJhbnNpdGlvbiBvciBrZXlmcmFtZSBhbmltYXRpb25cbiAgICAgIGlmIChvcHRpb25zLmFwcGx5Q2xhc3Nlc0Vhcmx5ICYmIGFkZFJlbW92ZUNsYXNzTmFtZS5sZW5ndGgpIHtcbiAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBhZGRSZW1vdmVDbGFzc05hbWUgPSAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIHByZXBhcmF0aW9uQ2xhc3NlcyA9IFtzdHJ1Y3R1cmFsQ2xhc3NOYW1lLCBhZGRSZW1vdmVDbGFzc05hbWVdLmpvaW4oJyAnKS50cmltKCk7XG4gICAgICB2YXIgZnVsbENsYXNzTmFtZSA9IGNsYXNzZXMgKyAnICcgKyBwcmVwYXJhdGlvbkNsYXNzZXM7XG4gICAgICB2YXIgYWN0aXZlQ2xhc3NlcyA9IHBlbmRDbGFzc2VzKHByZXBhcmF0aW9uQ2xhc3NlcywgQUNUSVZFX0NMQVNTX1NVRkZJWCk7XG4gICAgICB2YXIgaGFzVG9TdHlsZXMgPSBzdHlsZXMudG8gJiYgT2JqZWN0LmtleXMoc3R5bGVzLnRvKS5sZW5ndGggPiAwO1xuICAgICAgdmFyIGNvbnRhaW5zS2V5ZnJhbWVBbmltYXRpb24gPSAob3B0aW9ucy5rZXlmcmFtZVN0eWxlIHx8ICcnKS5sZW5ndGggPiAwO1xuXG4gICAgICAvLyB0aGVyZSBpcyBubyB3YXkgd2UgY2FuIHRyaWdnZXIgYW4gYW5pbWF0aW9uIGlmIG5vIHN0eWxlcyBhbmRcbiAgICAgIC8vIG5vIGNsYXNzZXMgYXJlIGJlaW5nIGFwcGxpZWQgd2hpY2ggd291bGQgdGhlbiB0cmlnZ2VyIGEgdHJhbnNpdGlvbixcbiAgICAgIC8vIHVubGVzcyB0aGVyZSBhIGlzIHJhdyBrZXlmcmFtZSB2YWx1ZSB0aGF0IGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAgICBpZiAoIWNvbnRhaW5zS2V5ZnJhbWVBbmltYXRpb25cbiAgICAgICAgICAgJiYgIWhhc1RvU3R5bGVzXG4gICAgICAgICAgICYmICFwcmVwYXJhdGlvbkNsYXNzZXMpIHtcbiAgICAgICAgcmV0dXJuIGNsb3NlQW5kUmV0dXJuTm9vcEFuaW1hdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBjYWNoZUtleSwgc3RhZ2dlcjtcbiAgICAgIGlmIChvcHRpb25zLnN0YWdnZXIgPiAwKSB7XG4gICAgICAgIHZhciBzdGFnZ2VyVmFsID0gcGFyc2VGbG9hdChvcHRpb25zLnN0YWdnZXIpO1xuICAgICAgICBzdGFnZ2VyID0ge1xuICAgICAgICAgIHRyYW5zaXRpb25EZWxheTogc3RhZ2dlclZhbCxcbiAgICAgICAgICBhbmltYXRpb25EZWxheTogc3RhZ2dlclZhbCxcbiAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDAsXG4gICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDBcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhY2hlS2V5ID0gZ2NzSGFzaEZuKG5vZGUsIGZ1bGxDbGFzc05hbWUpO1xuICAgICAgICBzdGFnZ2VyID0gY29tcHV0ZUNhY2hlZENzc1N0YWdnZXJTdHlsZXMobm9kZSwgcHJlcGFyYXRpb25DbGFzc2VzLCBjYWNoZUtleSwgREVURUNUX1NUQUdHRVJfQ1NTX1BST1BFUlRJRVMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMuJCRza2lwUHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgICAgICQkanFMaXRlLmFkZENsYXNzKGVsZW1lbnQsIHByZXBhcmF0aW9uQ2xhc3Nlcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcHBseU9ubHlEdXJhdGlvbjtcblxuICAgICAgaWYgKG9wdGlvbnMudHJhbnNpdGlvblN0eWxlKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9uU3R5bGUgPSBbVFJBTlNJVElPTl9QUk9QLCBvcHRpb25zLnRyYW5zaXRpb25TdHlsZV07XG4gICAgICAgIGFwcGx5SW5saW5lU3R5bGUobm9kZSwgdHJhbnNpdGlvblN0eWxlKTtcbiAgICAgICAgdGVtcG9yYXJ5U3R5bGVzLnB1c2godHJhbnNpdGlvblN0eWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuZHVyYXRpb24gPj0gMCkge1xuICAgICAgICBhcHBseU9ubHlEdXJhdGlvbiA9IG5vZGUuc3R5bGVbVFJBTlNJVElPTl9QUk9QXS5sZW5ndGggPiAwO1xuICAgICAgICB2YXIgZHVyYXRpb25TdHlsZSA9IGdldENzc1RyYW5zaXRpb25EdXJhdGlvblN0eWxlKG9wdGlvbnMuZHVyYXRpb24sIGFwcGx5T25seUR1cmF0aW9uKTtcblxuICAgICAgICAvLyB3ZSBzZXQgdGhlIGR1cmF0aW9uIHNvIHRoYXQgaXQgd2lsbCBiZSBwaWNrZWQgdXAgYnkgZ2V0Q29tcHV0ZWRTdHlsZSBsYXRlclxuICAgICAgICBhcHBseUlubGluZVN0eWxlKG5vZGUsIGR1cmF0aW9uU3R5bGUpO1xuICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChkdXJhdGlvblN0eWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMua2V5ZnJhbWVTdHlsZSkge1xuICAgICAgICB2YXIga2V5ZnJhbWVTdHlsZSA9IFtBTklNQVRJT05fUFJPUCwgb3B0aW9ucy5rZXlmcmFtZVN0eWxlXTtcbiAgICAgICAgYXBwbHlJbmxpbmVTdHlsZShub2RlLCBrZXlmcmFtZVN0eWxlKTtcbiAgICAgICAgdGVtcG9yYXJ5U3R5bGVzLnB1c2goa2V5ZnJhbWVTdHlsZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpdGVtSW5kZXggPSBzdGFnZ2VyXG4gICAgICAgICAgPyBvcHRpb25zLnN0YWdnZXJJbmRleCA+PSAwXG4gICAgICAgICAgICAgID8gb3B0aW9ucy5zdGFnZ2VySW5kZXhcbiAgICAgICAgICAgICAgOiBnY3NMb29rdXAuY291bnQoY2FjaGVLZXkpXG4gICAgICAgICAgOiAwO1xuXG4gICAgICB2YXIgaXNGaXJzdCA9IGl0ZW1JbmRleCA9PT0gMDtcblxuICAgICAgLy8gdGhpcyBpcyBhIHByZS1lbXB0aXZlIHdheSBvZiBmb3JjaW5nIHRoZSBzZXR1cCBjbGFzc2VzIHRvIGJlIGFkZGVkIGFuZCBhcHBsaWVkIElOU1RBTlRMWVxuICAgICAgLy8gd2l0aG91dCBjYXVzaW5nIGFueSBjb21iaW5hdGlvbiBvZiB0cmFuc2l0aW9ucyB0byBraWNrIGluLiBCeSBhZGRpbmcgYSBuZWdhdGl2ZSBkZWxheSB2YWx1ZVxuICAgICAgLy8gaXQgZm9yY2VzIHRoZSBzZXR1cCBjbGFzcycgdHJhbnNpdGlvbiB0byBlbmQgaW1tZWRpYXRlbHkuIFdlIGxhdGVyIHRoZW4gcmVtb3ZlIHRoZSBuZWdhdGl2ZVxuICAgICAgLy8gdHJhbnNpdGlvbiBkZWxheSB0byBhbGxvdyBmb3IgdGhlIHRyYW5zaXRpb24gdG8gbmF0dXJhbGx5IGRvIGl0J3MgdGhpbmcuIFRoZSBiZWF1dHkgaGVyZSBpc1xuICAgICAgLy8gdGhhdCBpZiB0aGVyZSBpcyBubyB0cmFuc2l0aW9uIGRlZmluZWQgdGhlbiBub3RoaW5nIHdpbGwgaGFwcGVuIGFuZCB0aGlzIHdpbGwgYWxzbyBhbGxvd1xuICAgICAgLy8gb3RoZXIgdHJhbnNpdGlvbnMgdG8gYmUgc3RhY2tlZCBvbiB0b3Agb2YgZWFjaCBvdGhlciB3aXRob3V0IGFueSBjaG9wcGluZyB0aGVtIG91dC5cbiAgICAgIGlmIChpc0ZpcnN0ICYmICFvcHRpb25zLnNraXBCbG9ja2luZykge1xuICAgICAgICBibG9ja1RyYW5zaXRpb25zKG5vZGUsIFNBRkVfRkFTVF9GT1JXQVJEX0RVUkFUSU9OX1ZBTFVFKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRpbWluZ3MgPSBjb21wdXRlVGltaW5ncyhub2RlLCBmdWxsQ2xhc3NOYW1lLCBjYWNoZUtleSk7XG4gICAgICB2YXIgcmVsYXRpdmVEZWxheSA9IHRpbWluZ3MubWF4RGVsYXk7XG4gICAgICBtYXhEZWxheSA9IE1hdGgubWF4KHJlbGF0aXZlRGVsYXksIDApO1xuICAgICAgbWF4RHVyYXRpb24gPSB0aW1pbmdzLm1heER1cmF0aW9uO1xuXG4gICAgICB2YXIgZmxhZ3MgPSB7fTtcbiAgICAgIGZsYWdzLmhhc1RyYW5zaXRpb25zICAgICAgICAgID0gdGltaW5ncy50cmFuc2l0aW9uRHVyYXRpb24gPiAwO1xuICAgICAgZmxhZ3MuaGFzQW5pbWF0aW9ucyAgICAgICAgICAgPSB0aW1pbmdzLmFuaW1hdGlvbkR1cmF0aW9uID4gMDtcbiAgICAgIGZsYWdzLmhhc1RyYW5zaXRpb25BbGwgICAgICAgID0gZmxhZ3MuaGFzVHJhbnNpdGlvbnMgJiYgdGltaW5ncy50cmFuc2l0aW9uUHJvcGVydHkgPT0gJ2FsbCc7XG4gICAgICBmbGFncy5hcHBseVRyYW5zaXRpb25EdXJhdGlvbiA9IGhhc1RvU3R5bGVzICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmxhZ3MuaGFzVHJhbnNpdGlvbnMgJiYgIWZsYWdzLmhhc1RyYW5zaXRpb25BbGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChmbGFncy5oYXNBbmltYXRpb25zICYmICFmbGFncy5oYXNUcmFuc2l0aW9ucykpO1xuICAgICAgZmxhZ3MuYXBwbHlBbmltYXRpb25EdXJhdGlvbiAgPSBvcHRpb25zLmR1cmF0aW9uICYmIGZsYWdzLmhhc0FuaW1hdGlvbnM7XG4gICAgICBmbGFncy5hcHBseVRyYW5zaXRpb25EZWxheSAgICA9IHRydXRoeVRpbWluZ1ZhbHVlKG9wdGlvbnMuZGVsYXkpICYmIChmbGFncy5hcHBseVRyYW5zaXRpb25EdXJhdGlvbiB8fCBmbGFncy5oYXNUcmFuc2l0aW9ucyk7XG4gICAgICBmbGFncy5hcHBseUFuaW1hdGlvbkRlbGF5ICAgICA9IHRydXRoeVRpbWluZ1ZhbHVlKG9wdGlvbnMuZGVsYXkpICYmIGZsYWdzLmhhc0FuaW1hdGlvbnM7XG4gICAgICBmbGFncy5yZWNhbGN1bGF0ZVRpbWluZ1N0eWxlcyA9IGFkZFJlbW92ZUNsYXNzTmFtZS5sZW5ndGggPiAwO1xuXG4gICAgICBpZiAoZmxhZ3MuYXBwbHlUcmFuc2l0aW9uRHVyYXRpb24gfHwgZmxhZ3MuYXBwbHlBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICBtYXhEdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24gPyBwYXJzZUZsb2F0KG9wdGlvbnMuZHVyYXRpb24pIDogbWF4RHVyYXRpb247XG5cbiAgICAgICAgaWYgKGZsYWdzLmFwcGx5VHJhbnNpdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgZmxhZ3MuaGFzVHJhbnNpdGlvbnMgPSB0cnVlO1xuICAgICAgICAgIHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uID0gbWF4RHVyYXRpb247XG4gICAgICAgICAgYXBwbHlPbmx5RHVyYXRpb24gPSBub2RlLnN0eWxlW1RSQU5TSVRJT05fUFJPUCArIFBST1BFUlRZX0tFWV0ubGVuZ3RoID4gMDtcbiAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChnZXRDc3NUcmFuc2l0aW9uRHVyYXRpb25TdHlsZShtYXhEdXJhdGlvbiwgYXBwbHlPbmx5RHVyYXRpb24pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmbGFncy5hcHBseUFuaW1hdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgZmxhZ3MuaGFzQW5pbWF0aW9ucyA9IHRydWU7XG4gICAgICAgICAgdGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiA9IG1heER1cmF0aW9uO1xuICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKGdldENzc0tleWZyYW1lRHVyYXRpb25TdHlsZShtYXhEdXJhdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXhEdXJhdGlvbiA9PT0gMCAmJiAhZmxhZ3MucmVjYWxjdWxhdGVUaW1pbmdTdHlsZXMpIHtcbiAgICAgICAgcmV0dXJuIGNsb3NlQW5kUmV0dXJuTm9vcEFuaW1hdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIG5lZWQgdG8gcmVjYWxjdWxhdGUgdGhlIGRlbGF5IHZhbHVlIHNpbmNlIHdlIHVzZWQgYSBwcmUtZW1wdGl2ZSBuZWdhdGl2ZVxuICAgICAgLy8gZGVsYXkgdmFsdWUgYW5kIHRoZSBkZWxheSB2YWx1ZSBpcyByZXF1aXJlZCBmb3IgdGhlIGZpbmFsIGV2ZW50IGNoZWNraW5nLiBUaGlzXG4gICAgICAvLyBwcm9wZXJ0eSB3aWxsIGVuc3VyZSB0aGF0IHRoaXMgd2lsbCBoYXBwZW4gYWZ0ZXIgdGhlIFJBRiBwaGFzZSBoYXMgcGFzc2VkLlxuICAgICAgaWYgKG9wdGlvbnMuZHVyYXRpb24gPT0gbnVsbCAmJiB0aW1pbmdzLnRyYW5zaXRpb25EdXJhdGlvbiA+IDApIHtcbiAgICAgICAgZmxhZ3MucmVjYWxjdWxhdGVUaW1pbmdTdHlsZXMgPSBmbGFncy5yZWNhbGN1bGF0ZVRpbWluZ1N0eWxlcyB8fCBpc0ZpcnN0O1xuICAgICAgfVxuXG4gICAgICBtYXhEZWxheVRpbWUgPSBtYXhEZWxheSAqIE9ORV9TRUNPTkQ7XG4gICAgICBtYXhEdXJhdGlvblRpbWUgPSBtYXhEdXJhdGlvbiAqIE9ORV9TRUNPTkQ7XG4gICAgICBpZiAoIW9wdGlvbnMuc2tpcEJsb2NraW5nKSB7XG4gICAgICAgIGZsYWdzLmJsb2NrVHJhbnNpdGlvbiA9IHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uID4gMDtcbiAgICAgICAgZmxhZ3MuYmxvY2tLZXlmcmFtZUFuaW1hdGlvbiA9IHRpbWluZ3MuYW5pbWF0aW9uRHVyYXRpb24gPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFnZ2VyLmFuaW1hdGlvbkRlbGF5ID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhZ2dlci5hbmltYXRpb25EdXJhdGlvbiA9PT0gMDtcbiAgICAgIH1cblxuICAgICAgYXBwbHlBbmltYXRpb25Gcm9tU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAoZmxhZ3MuYmxvY2tUcmFuc2l0aW9uIHx8IGZsYWdzLmJsb2NrS2V5ZnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgYXBwbHlCbG9ja2luZyhtYXhEdXJhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKCFvcHRpb25zLnNraXBCbG9ja2luZykge1xuICAgICAgICBibG9ja1RyYW5zaXRpb25zKG5vZGUsIGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETyhtYXRza28pOiBmb3IgMS41IGNoYW5nZSB0aGlzIGNvZGUgdG8gaGF2ZSBhbiBhbmltYXRvciBvYmplY3QgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgICAgIHJldHVybiB7XG4gICAgICAgICQkd2lsbEFuaW1hdGU6IHRydWUsXG4gICAgICAgIGVuZDogZW5kRm4sXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoYW5pbWF0aW9uQ2xvc2VkKSByZXR1cm47XG5cbiAgICAgICAgICBydW5uZXJIb3N0ID0ge1xuICAgICAgICAgICAgZW5kOiBlbmRGbixcbiAgICAgICAgICAgIGNhbmNlbDogY2FuY2VsRm4sXG4gICAgICAgICAgICByZXN1bWU6IG51bGwsIC8vdGhpcyB3aWxsIGJlIHNldCBkdXJpbmcgdGhlIHN0YXJ0KCkgcGhhc2VcbiAgICAgICAgICAgIHBhdXNlOiBudWxsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIocnVubmVySG9zdCk7XG5cbiAgICAgICAgICB3YWl0VW50aWxRdWlldChzdGFydCk7XG5cbiAgICAgICAgICAvLyB3ZSBkb24ndCBoYXZlIGFjY2VzcyB0byBwYXVzZS9yZXN1bWUgdGhlIGFuaW1hdGlvblxuICAgICAgICAgIC8vIHNpbmNlIGl0IGhhc24ndCBydW4geWV0LiBBbmltYXRlUnVubmVyIHdpbGwgdGhlcmVmb3JlXG4gICAgICAgICAgLy8gc2V0IG5vb3AgZnVuY3Rpb25zIGZvciByZXN1bWUgYW5kIHBhdXNlIGFuZCB0aGV5IHdpbGxcbiAgICAgICAgICAvLyBsYXRlciBiZSBvdmVycmlkZGVuIG9uY2UgdGhlIGFuaW1hdGlvbiBpcyB0cmlnZ2VyZWRcbiAgICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBlbmRGbigpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2FuY2VsRm4oKSB7XG4gICAgICAgIGNsb3NlKHRydWUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbG9zZShyZWplY3RlZCkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgLy8gaWYgdGhlIHByb21pc2UgaGFzIGJlZW4gY2FsbGVkIGFscmVhZHkgdGhlbiB3ZSBzaG91bGRuJ3QgY2xvc2VcbiAgICAgICAgLy8gdGhlIGFuaW1hdGlvbiBhZ2FpblxuICAgICAgICBpZiAoYW5pbWF0aW9uQ2xvc2VkIHx8IChhbmltYXRpb25Db21wbGV0ZWQgJiYgYW5pbWF0aW9uUGF1c2VkKSkgcmV0dXJuO1xuICAgICAgICBhbmltYXRpb25DbG9zZWQgPSB0cnVlO1xuICAgICAgICBhbmltYXRpb25QYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIW9wdGlvbnMuJCRza2lwUHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgICAgICAgJCRqcUxpdGUucmVtb3ZlQ2xhc3MoZWxlbWVudCwgcHJlcGFyYXRpb25DbGFzc2VzKTtcbiAgICAgICAgfVxuICAgICAgICAkJGpxTGl0ZS5yZW1vdmVDbGFzcyhlbGVtZW50LCBhY3RpdmVDbGFzc2VzKTtcblxuICAgICAgICBibG9ja0tleWZyYW1lQW5pbWF0aW9ucyhub2RlLCBmYWxzZSk7XG4gICAgICAgIGJsb2NrVHJhbnNpdGlvbnMobm9kZSwgZmFsc2UpO1xuXG4gICAgICAgIGZvckVhY2godGVtcG9yYXJ5U3R5bGVzLCBmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICAgIC8vIFRoZXJlIGlzIG9ubHkgb25lIHdheSB0byByZW1vdmUgaW5saW5lIHN0eWxlIHByb3BlcnRpZXMgZW50aXJlbHkgZnJvbSBlbGVtZW50cy5cbiAgICAgICAgICAvLyBCeSB1c2luZyBgcmVtb3ZlUHJvcGVydHlgIHRoaXMgd29ya3MsIGJ1dCB3ZSBuZWVkIHRvIGNvbnZlcnQgY2FtZWwtY2FzZWQgQ1NTXG4gICAgICAgICAgLy8gc3R5bGVzIGRvd24gdG8gaHlwaGVuYXRlZCB2YWx1ZXMuXG4gICAgICAgICAgbm9kZS5zdHlsZVtlbnRyeVswXV0gPSAnJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBhcHBseUFuaW1hdGlvblN0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBoYXZlIHRoaXMgb3B0aW9uIGlzIHRvIGFsbG93IGEgc3luY2hyb25vdXMgY2xvc2luZyBjYWxsYmFja1xuICAgICAgICAvLyB0aGF0IGlzIGZpcmVkIGFzIFNPT04gYXMgdGhlIGFuaW1hdGlvbiBlbmRzICh3aGVuIHRoZSBDU1MgaXMgcmVtb3ZlZCkgb3IgaWZcbiAgICAgICAgLy8gdGhlIGFuaW1hdGlvbiBuZXZlciB0YWtlcyBvZmYgYXQgYWxsLiBBIGdvb2QgZXhhbXBsZSBpcyBhIGxlYXZlIGFuaW1hdGlvbiBzaW5jZVxuICAgICAgICAvLyB0aGUgZWxlbWVudCBtdXN0IGJlIHJlbW92ZWQganVzdCBhZnRlciB0aGUgYW5pbWF0aW9uIGlzIG92ZXIgb3IgZWxzZSB0aGUgZWxlbWVudFxuICAgICAgICAvLyB3aWxsIGFwcGVhciBvbiBzY3JlZW4gZm9yIG9uZSBhbmltYXRpb24gZnJhbWUgY2F1c2luZyBhbiBvdmVyYmVhcmluZyBmbGlja2VyLlxuICAgICAgICBpZiAob3B0aW9ucy5vbkRvbmUpIHtcbiAgICAgICAgICBvcHRpb25zLm9uRG9uZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHByZXBhcmF0aW9uIGZ1bmN0aW9uIGZhaWxzIHRoZW4gdGhlIHByb21pc2UgaXMgbm90IHNldHVwXG4gICAgICAgIGlmIChydW5uZXIpIHtcbiAgICAgICAgICBydW5uZXIuY29tcGxldGUoIXJlamVjdGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBhcHBseUJsb2NraW5nKGR1cmF0aW9uKSB7XG4gICAgICAgIGlmIChmbGFncy5ibG9ja1RyYW5zaXRpb24pIHtcbiAgICAgICAgICBibG9ja1RyYW5zaXRpb25zKG5vZGUsIGR1cmF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmbGFncy5ibG9ja0tleWZyYW1lQW5pbWF0aW9uKSB7XG4gICAgICAgICAgYmxvY2tLZXlmcmFtZUFuaW1hdGlvbnMobm9kZSwgISFkdXJhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xvc2VBbmRSZXR1cm5Ob29wQW5pbWF0b3IoKSB7XG4gICAgICAgIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoe1xuICAgICAgICAgIGVuZDogZW5kRm4sXG4gICAgICAgICAgY2FuY2VsOiBjYW5jZWxGblxuICAgICAgICB9KTtcblxuICAgICAgICBjbG9zZSgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJCR3aWxsQW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVuZDogZW5kRm5cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25DbG9zZWQpIHJldHVybjtcbiAgICAgICAgaWYgKCFub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdGFydFRpbWUsIGV2ZW50cyA9IFtdO1xuXG4gICAgICAgIC8vIGV2ZW4gdGhvdWdoIHdlIG9ubHkgcGF1c2Uga2V5ZnJhbWUgYW5pbWF0aW9ucyBoZXJlIHRoZSBwYXVzZSBmbGFnXG4gICAgICAgIC8vIHdpbGwgc3RpbGwgaGFwcGVuIHdoZW4gdHJhbnNpdGlvbnMgYXJlIHVzZWQuIE9ubHkgdGhlIHRyYW5zaXRpb24gd2lsbFxuICAgICAgICAvLyBub3QgYmUgcGF1c2VkIHNpbmNlIHRoYXQgaXMgbm90IHBvc3NpYmxlLiBJZiB0aGUgYW5pbWF0aW9uIGVuZHMgd2hlblxuICAgICAgICAvLyBwYXVzZWQgdGhlbiBpdCB3aWxsIG5vdCBjb21wbGV0ZSB1bnRpbCB1bnBhdXNlZCBvciBjYW5jZWxsZWQuXG4gICAgICAgIHZhciBwbGF5UGF1c2UgPSBmdW5jdGlvbihwbGF5QW5pbWF0aW9uKSB7XG4gICAgICAgICAgaWYgKCFhbmltYXRpb25Db21wbGV0ZWQpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvblBhdXNlZCA9ICFwbGF5QW5pbWF0aW9uO1xuICAgICAgICAgICAgaWYgKHRpbWluZ3MuYW5pbWF0aW9uRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYmxvY2tLZXlmcmFtZUFuaW1hdGlvbnMobm9kZSwgYW5pbWF0aW9uUGF1c2VkKTtcbiAgICAgICAgICAgICAgYW5pbWF0aW9uUGF1c2VkXG4gICAgICAgICAgICAgICAgICA/IHRlbXBvcmFyeVN0eWxlcy5wdXNoKHZhbHVlKVxuICAgICAgICAgICAgICAgICAgOiByZW1vdmVGcm9tQXJyYXkodGVtcG9yYXJ5U3R5bGVzLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChhbmltYXRpb25QYXVzZWQgJiYgcGxheUFuaW1hdGlvbikge1xuICAgICAgICAgICAgYW5pbWF0aW9uUGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjaGVja2luZyB0aGUgc3RhZ2dlciBkdXJhdGlvbiBwcmV2ZW50cyBhbiBhY2NpZGVudGx5IGNhc2NhZGUgb2YgdGhlIENTUyBkZWxheSBzdHlsZVxuICAgICAgICAvLyBiZWluZyBpbmhlcml0ZWQgZnJvbSB0aGUgcGFyZW50LiBJZiB0aGUgdHJhbnNpdGlvbiBkdXJhdGlvbiBpcyB6ZXJvIHRoZW4gd2UgY2FuIHNhZmVseVxuICAgICAgICAvLyByZWx5IHRoYXQgdGhlIGRlbGF5IHZhbHVlIGlzIGFuIGludGVudGlhbCBzdGFnZ2VyIGRlbGF5IHN0eWxlLlxuICAgICAgICB2YXIgbWF4U3RhZ2dlciA9IGl0ZW1JbmRleCA+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoKHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uICYmIHN0YWdnZXIudHJhbnNpdGlvbkR1cmF0aW9uID09PSAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0aW1pbmdzLmFuaW1hdGlvbkR1cmF0aW9uICYmIHN0YWdnZXIuYW5pbWF0aW9uRHVyYXRpb24gPT09IDApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIE1hdGgubWF4KHN0YWdnZXIuYW5pbWF0aW9uRGVsYXksIHN0YWdnZXIudHJhbnNpdGlvbkRlbGF5KTtcbiAgICAgICAgaWYgKG1heFN0YWdnZXIpIHtcbiAgICAgICAgICAkdGltZW91dCh0cmlnZ2VyQW5pbWF0aW9uU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgTWF0aC5mbG9vcihtYXhTdGFnZ2VyICogaXRlbUluZGV4ICogT05FX1NFQ09ORCksXG4gICAgICAgICAgICAgICAgICAgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyaWdnZXJBbmltYXRpb25TdGFydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcyB3aWxsIGRlY29yYXRlIHRoZSBleGlzdGluZyBwcm9taXNlIHJ1bm5lciB3aXRoIHBhdXNlL3Jlc3VtZSBtZXRob2RzXG4gICAgICAgIHJ1bm5lckhvc3QucmVzdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcGxheVBhdXNlKHRydWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJ1bm5lckhvc3QucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBwbGF5UGF1c2UoZmFsc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJBbmltYXRpb25TdGFydCgpIHtcbiAgICAgICAgICAvLyBqdXN0IGluY2FzZSBhIHN0YWdnZXIgYW5pbWF0aW9uIGtpY2tzIGluIHdoZW4gdGhlIGFuaW1hdGlvblxuICAgICAgICAgIC8vIGl0c2VsZiB3YXMgY2FuY2VsbGVkIGVudGlyZWx5XG4gICAgICAgICAgaWYgKGFuaW1hdGlvbkNsb3NlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgYXBwbHlCbG9ja2luZyhmYWxzZSk7XG5cbiAgICAgICAgICBmb3JFYWNoKHRlbXBvcmFyeVN0eWxlcywgZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBlbnRyeVswXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVudHJ5WzFdO1xuICAgICAgICAgICAgbm9kZS5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhcHBseUFuaW1hdGlvbkNsYXNzZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgJCRqcUxpdGUuYWRkQ2xhc3MoZWxlbWVudCwgYWN0aXZlQ2xhc3Nlcyk7XG5cbiAgICAgICAgICBpZiAoZmxhZ3MucmVjYWxjdWxhdGVUaW1pbmdTdHlsZXMpIHtcbiAgICAgICAgICAgIGZ1bGxDbGFzc05hbWUgPSBub2RlLmNsYXNzTmFtZSArICcgJyArIHByZXBhcmF0aW9uQ2xhc3NlcztcbiAgICAgICAgICAgIGNhY2hlS2V5ID0gZ2NzSGFzaEZuKG5vZGUsIGZ1bGxDbGFzc05hbWUpO1xuXG4gICAgICAgICAgICB0aW1pbmdzID0gY29tcHV0ZVRpbWluZ3Mobm9kZSwgZnVsbENsYXNzTmFtZSwgY2FjaGVLZXkpO1xuICAgICAgICAgICAgcmVsYXRpdmVEZWxheSA9IHRpbWluZ3MubWF4RGVsYXk7XG4gICAgICAgICAgICBtYXhEZWxheSA9IE1hdGgubWF4KHJlbGF0aXZlRGVsYXksIDApO1xuICAgICAgICAgICAgbWF4RHVyYXRpb24gPSB0aW1pbmdzLm1heER1cmF0aW9uO1xuXG4gICAgICAgICAgICBpZiAobWF4RHVyYXRpb24gPT09IDApIHtcbiAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmbGFncy5oYXNUcmFuc2l0aW9ucyA9IHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uID4gMDtcbiAgICAgICAgICAgIGZsYWdzLmhhc0FuaW1hdGlvbnMgPSB0aW1pbmdzLmFuaW1hdGlvbkR1cmF0aW9uID4gMDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZmxhZ3MuYXBwbHlUcmFuc2l0aW9uRGVsYXkgfHwgZmxhZ3MuYXBwbHlBbmltYXRpb25EZWxheSkge1xuICAgICAgICAgICAgcmVsYXRpdmVEZWxheSA9IHR5cGVvZiBvcHRpb25zLmRlbGF5ICE9PSBcImJvb2xlYW5cIiAmJiB0cnV0aHlUaW1pbmdWYWx1ZShvcHRpb25zLmRlbGF5KVxuICAgICAgICAgICAgICAgICAgPyBwYXJzZUZsb2F0KG9wdGlvbnMuZGVsYXkpXG4gICAgICAgICAgICAgICAgICA6IHJlbGF0aXZlRGVsYXk7XG5cbiAgICAgICAgICAgIG1heERlbGF5ID0gTWF0aC5tYXgocmVsYXRpdmVEZWxheSwgMCk7XG5cbiAgICAgICAgICAgIHZhciBkZWxheVN0eWxlO1xuICAgICAgICAgICAgaWYgKGZsYWdzLmFwcGx5VHJhbnNpdGlvbkRlbGF5KSB7XG4gICAgICAgICAgICAgIHRpbWluZ3MudHJhbnNpdGlvbkRlbGF5ID0gcmVsYXRpdmVEZWxheTtcbiAgICAgICAgICAgICAgZGVsYXlTdHlsZSA9IGdldENzc0RlbGF5U3R5bGUocmVsYXRpdmVEZWxheSk7XG4gICAgICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKGRlbGF5U3R5bGUpO1xuICAgICAgICAgICAgICBub2RlLnN0eWxlW2RlbGF5U3R5bGVbMF1dID0gZGVsYXlTdHlsZVsxXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZsYWdzLmFwcGx5QW5pbWF0aW9uRGVsYXkpIHtcbiAgICAgICAgICAgICAgdGltaW5ncy5hbmltYXRpb25EZWxheSA9IHJlbGF0aXZlRGVsYXk7XG4gICAgICAgICAgICAgIGRlbGF5U3R5bGUgPSBnZXRDc3NEZWxheVN0eWxlKHJlbGF0aXZlRGVsYXksIHRydWUpO1xuICAgICAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChkZWxheVN0eWxlKTtcbiAgICAgICAgICAgICAgbm9kZS5zdHlsZVtkZWxheVN0eWxlWzBdXSA9IGRlbGF5U3R5bGVbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWF4RGVsYXlUaW1lID0gbWF4RGVsYXkgKiBPTkVfU0VDT05EO1xuICAgICAgICAgIG1heER1cmF0aW9uVGltZSA9IG1heER1cmF0aW9uICogT05FX1NFQ09ORDtcblxuICAgICAgICAgIGlmIChvcHRpb25zLmVhc2luZykge1xuICAgICAgICAgICAgdmFyIGVhc2VQcm9wLCBlYXNlVmFsID0gb3B0aW9ucy5lYXNpbmc7XG4gICAgICAgICAgICBpZiAoZmxhZ3MuaGFzVHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgZWFzZVByb3AgPSBUUkFOU0lUSU9OX1BST1AgKyBUSU1JTkdfS0VZO1xuICAgICAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChbZWFzZVByb3AsIGVhc2VWYWxdKTtcbiAgICAgICAgICAgICAgbm9kZS5zdHlsZVtlYXNlUHJvcF0gPSBlYXNlVmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZsYWdzLmhhc0FuaW1hdGlvbnMpIHtcbiAgICAgICAgICAgICAgZWFzZVByb3AgPSBBTklNQVRJT05fUFJPUCArIFRJTUlOR19LRVk7XG4gICAgICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKFtlYXNlUHJvcCwgZWFzZVZhbF0pO1xuICAgICAgICAgICAgICBub2RlLnN0eWxlW2Vhc2VQcm9wXSA9IGVhc2VWYWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgICBldmVudHMucHVzaChUUkFOU0lUSU9ORU5EX0VWRU5UKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGltaW5ncy5hbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgICAgZXZlbnRzLnB1c2goQU5JTUFUSU9ORU5EX0VWRU5UKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIGVsZW1lbnQub24oZXZlbnRzLmpvaW4oJyAnKSwgb25BbmltYXRpb25Qcm9ncmVzcyk7XG4gICAgICAgICAgJHRpbWVvdXQob25BbmltYXRpb25FeHBpcmVkLCBtYXhEZWxheVRpbWUgKyBDTE9TSU5HX1RJTUVfQlVGRkVSICogbWF4RHVyYXRpb25UaW1lLCBmYWxzZSk7XG5cbiAgICAgICAgICBhcHBseUFuaW1hdGlvblRvU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25BbmltYXRpb25FeHBpcmVkKCkge1xuICAgICAgICAgIC8vIGFsdGhvdWdoIGFuIGV4cGlyZWQgYW5pbWF0aW9uIGlzIGEgZmFpbGVkIGFuaW1hdGlvbiwgZ2V0dGluZyB0b1xuICAgICAgICAgIC8vIHRoaXMgb3V0Y29tZSBpcyB2ZXJ5IGVhc3kgaWYgdGhlIENTUyBjb2RlIHNjcmV3cyB1cC4gVGhlcmVmb3JlIHdlXG4gICAgICAgICAgLy8gc2hvdWxkIHN0aWxsIGNvbnRpbnVlIG5vcm1hbGx5IGFzIGlmIHRoZSBhbmltYXRpb24gY29tcGxldGVkIGNvcnJlY3RseS5cbiAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25BbmltYXRpb25Qcm9ncmVzcyhldmVudCkge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHZhciBldiA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQgfHwgZXZlbnQ7XG4gICAgICAgICAgdmFyIHRpbWVTdGFtcCA9IGV2LiRtYW51YWxUaW1lU3RhbXAgfHwgZXYudGltZVN0YW1wIHx8IERhdGUubm93KCk7XG5cbiAgICAgICAgICAvKiBGaXJlZm94IChvciBwb3NzaWJseSBqdXN0IEdlY2tvKSBsaWtlcyB0byBub3Qgcm91bmQgdmFsdWVzIHVwXG4gICAgICAgICAgICogd2hlbiBhIG1zIG1lYXN1cmVtZW50IGlzIHVzZWQgZm9yIHRoZSBhbmltYXRpb24gKi9cbiAgICAgICAgICB2YXIgZWxhcHNlZFRpbWUgPSBwYXJzZUZsb2F0KGV2LmVsYXBzZWRUaW1lLnRvRml4ZWQoRUxBUFNFRF9USU1FX01BWF9ERUNJTUFMX1BMQUNFUykpO1xuXG4gICAgICAgICAgLyogJG1hbnVhbFRpbWVTdGFtcCBpcyBhIG1vY2tlZCB0aW1lU3RhbXAgdmFsdWUgd2hpY2ggaXMgc2V0XG4gICAgICAgICAgICogd2l0aGluIGJyb3dzZXJUcmlnZ2VyKCkuIFRoaXMgaXMgb25seSBoZXJlIHNvIHRoYXQgdGVzdHMgY2FuXG4gICAgICAgICAgICogbW9jayBhbmltYXRpb25zIHByb3Blcmx5LiBSZWFsIGV2ZW50cyBmYWxsYmFjayB0byBldmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICogb3IsIGlmIHRoZXkgZG9uJ3QsIHRoZW4gYSB0aW1lU3RhbXAgaXMgYXV0b21hdGljYWxseSBjcmVhdGVkIGZvciB0aGVtLlxuICAgICAgICAgICAqIFdlJ3JlIGNoZWNraW5nIHRvIHNlZSBpZiB0aGUgdGltZVN0YW1wIHN1cnBhc3NlcyB0aGUgZXhwZWN0ZWQgZGVsYXksXG4gICAgICAgICAgICogYnV0IHdlJ3JlIHVzaW5nIGVsYXBzZWRUaW1lIGluc3RlYWQgb2YgdGhlIHRpbWVTdGFtcCBvbiB0aGUgMm5kXG4gICAgICAgICAgICogcHJlLWNvbmRpdGlvbiBzaW5jZSBhbmltYXRpb25zIHNvbWV0aW1lcyBjbG9zZSBvZmYgZWFybHkgKi9cbiAgICAgICAgICBpZiAoTWF0aC5tYXgodGltZVN0YW1wIC0gc3RhcnRUaW1lLCAwKSA+PSBtYXhEZWxheVRpbWUgJiYgZWxhcHNlZFRpbWUgPj0gbWF4RHVyYXRpb24pIHtcbiAgICAgICAgICAgIC8vIHdlIHNldCB0aGlzIGZsYWcgdG8gZW5zdXJlIHRoYXQgaWYgdGhlIHRyYW5zaXRpb24gaXMgcGF1c2VkIHRoZW4sIHdoZW4gcmVzdW1lZCxcbiAgICAgICAgICAgIC8vIHRoZSBhbmltYXRpb24gd2lsbCBhdXRvbWF0aWNhbGx5IGNsb3NlIGl0c2VsZiBzaW5jZSB0cmFuc2l0aW9ucyBjYW5ub3QgYmUgcGF1c2VkLlxuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XTtcbn1dO1xuXG52YXIgJCRBbmltYXRlQ3NzRHJpdmVyUHJvdmlkZXIgPSBbJyQkYW5pbWF0aW9uUHJvdmlkZXInLCBmdW5jdGlvbigkJGFuaW1hdGlvblByb3ZpZGVyKSB7XG4gICQkYW5pbWF0aW9uUHJvdmlkZXIuZHJpdmVycy5wdXNoKCckJGFuaW1hdGVDc3NEcml2ZXInKTtcblxuICB2YXIgTkdfQU5JTUFURV9TSElNX0NMQVNTX05BTUUgPSAnbmctYW5pbWF0ZS1zaGltJztcbiAgdmFyIE5HX0FOSU1BVEVfQU5DSE9SX0NMQVNTX05BTUUgPSAnbmctYW5jaG9yJztcblxuICB2YXIgTkdfT1VUX0FOQ0hPUl9DTEFTU19OQU1FID0gJ25nLWFuY2hvci1vdXQnO1xuICB2YXIgTkdfSU5fQU5DSE9SX0NMQVNTX05BTUUgPSAnbmctYW5jaG9yLWluJztcblxuICB0aGlzLiRnZXQgPSBbJyRhbmltYXRlQ3NzJywgJyRyb290U2NvcGUnLCAnJCRBbmltYXRlUnVubmVyJywgJyRyb290RWxlbWVudCcsICckJGJvZHknLCAnJHNuaWZmZXInLCAnJCRqcUxpdGUnLFxuICAgICAgIGZ1bmN0aW9uKCRhbmltYXRlQ3NzLCAgICRyb290U2NvcGUsICAgJCRBbmltYXRlUnVubmVyLCAgICRyb290RWxlbWVudCwgICAkJGJvZHksICAgJHNuaWZmZXIsICAgJCRqcUxpdGUpIHtcblxuICAgIC8vIG9ubHkgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IHRoZXNlIHByb3BlcnRpZXMgY2FuIHJlbmRlciBhbmltYXRpb25zXG4gICAgaWYgKCEkc25pZmZlci5hbmltYXRpb25zICYmICEkc25pZmZlci50cmFuc2l0aW9ucykgcmV0dXJuIG5vb3A7XG5cbiAgICB2YXIgYm9keU5vZGUgPSBnZXREb21Ob2RlKCQkYm9keSk7XG4gICAgdmFyIHJvb3ROb2RlID0gZ2V0RG9tTm9kZSgkcm9vdEVsZW1lbnQpO1xuXG4gICAgdmFyIHJvb3RCb2R5RWxlbWVudCA9IGpxTGl0ZShib2R5Tm9kZS5wYXJlbnROb2RlID09PSByb290Tm9kZSA/IGJvZHlOb2RlIDogcm9vdE5vZGUpO1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGluaXREcml2ZXJGbihhbmltYXRpb25EZXRhaWxzLCBvbkJlZm9yZUNsYXNzZXNBcHBsaWVkQ2IpIHtcbiAgICAgIHJldHVybiBhbmltYXRpb25EZXRhaWxzLmZyb20gJiYgYW5pbWF0aW9uRGV0YWlscy50b1xuICAgICAgICAgID8gcHJlcGFyZUZyb21Ub0FuY2hvckFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzLmZyb20sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkRldGFpbHMudG8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkRldGFpbHMuY2xhc3NlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRGV0YWlscy5hbmNob3JzKVxuICAgICAgICAgIDogcHJlcGFyZVJlZ3VsYXJBbmltYXRpb24oYW5pbWF0aW9uRGV0YWlscywgb25CZWZvcmVDbGFzc2VzQXBwbGllZENiKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZmlsdGVyQ3NzQ2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgICAvL3JlbW92ZSBhbGwgdGhlIGBuZy1gIHN0dWZmXG4gICAgICByZXR1cm4gY2xhc3Nlcy5yZXBsYWNlKC9cXGJuZy1cXFMrXFxiL2csICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRVbmlxdWVWYWx1ZXMoYSwgYikge1xuICAgICAgaWYgKGlzU3RyaW5nKGEpKSBhID0gYS5zcGxpdCgnICcpO1xuICAgICAgaWYgKGlzU3RyaW5nKGIpKSBiID0gYi5zcGxpdCgnICcpO1xuICAgICAgcmV0dXJuIGEuZmlsdGVyKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICByZXR1cm4gYi5pbmRleE9mKHZhbCkgPT09IC0xO1xuICAgICAgfSkuam9pbignICcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXBhcmVBbmNob3JlZEFuaW1hdGlvbihjbGFzc2VzLCBvdXRBbmNob3IsIGluQW5jaG9yKSB7XG4gICAgICB2YXIgY2xvbmUgPSBqcUxpdGUoZ2V0RG9tTm9kZShvdXRBbmNob3IpLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICB2YXIgc3RhcnRpbmdDbGFzc2VzID0gZmlsdGVyQ3NzQ2xhc3NlcyhnZXRDbGFzc1ZhbChjbG9uZSkpO1xuXG4gICAgICBvdXRBbmNob3IuYWRkQ2xhc3MoTkdfQU5JTUFURV9TSElNX0NMQVNTX05BTUUpO1xuICAgICAgaW5BbmNob3IuYWRkQ2xhc3MoTkdfQU5JTUFURV9TSElNX0NMQVNTX05BTUUpO1xuXG4gICAgICBjbG9uZS5hZGRDbGFzcyhOR19BTklNQVRFX0FOQ0hPUl9DTEFTU19OQU1FKTtcblxuICAgICAgcm9vdEJvZHlFbGVtZW50LmFwcGVuZChjbG9uZSk7XG5cbiAgICAgIHZhciBhbmltYXRvckluLCBhbmltYXRvck91dCA9IHByZXBhcmVPdXRBbmltYXRpb24oKTtcblxuICAgICAgLy8gdGhlIHVzZXIgbWF5IG5vdCBlbmQgdXAgdXNpbmcgdGhlIGBvdXRgIGFuaW1hdGlvbiBhbmRcbiAgICAgIC8vIG9ubHkgbWFraW5nIHVzZSBvZiB0aGUgYGluYCBhbmltYXRpb24gb3IgdmljZS12ZXJzYS5cbiAgICAgIC8vIEluIGVpdGhlciBjYXNlIHdlIHNob3VsZCBhbGxvdyB0aGlzIGFuZCBub3QgYXNzdW1lIHRoZVxuICAgICAgLy8gYW5pbWF0aW9uIGlzIG92ZXIgdW5sZXNzIGJvdGggYW5pbWF0aW9ucyBhcmUgbm90IHVzZWQuXG4gICAgICBpZiAoIWFuaW1hdG9yT3V0KSB7XG4gICAgICAgIGFuaW1hdG9ySW4gPSBwcmVwYXJlSW5BbmltYXRpb24oKTtcbiAgICAgICAgaWYgKCFhbmltYXRvckluKSB7XG4gICAgICAgICAgcmV0dXJuIGVuZCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBzdGFydGluZ0FuaW1hdG9yID0gYW5pbWF0b3JPdXQgfHwgYW5pbWF0b3JJbjtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBydW5uZXI7XG5cbiAgICAgICAgICB2YXIgY3VycmVudEFuaW1hdGlvbiA9IHN0YXJ0aW5nQW5pbWF0b3Iuc3RhcnQoKTtcbiAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghYW5pbWF0b3JJbikge1xuICAgICAgICAgICAgICBhbmltYXRvckluID0gcHJlcGFyZUluQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgIGlmIChhbmltYXRvckluKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEFuaW1hdGlvbiA9IGFuaW1hdG9ySW4uc3RhcnQoKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIGVuZCgpO1xuICAgICAgICAgICAgICAgICAgcnVubmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRBbmltYXRpb247XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGluIHRoZSBldmVudCB0aGF0IHRoZXJlIGlzIG5vIGBpbmAgYW5pbWF0aW9uXG4gICAgICAgICAgICBlbmQoKTtcbiAgICAgICAgICAgIHJ1bm5lci5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcih7XG4gICAgICAgICAgICBlbmQ6IGVuZEZuLFxuICAgICAgICAgICAgY2FuY2VsOiBlbmRGblxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcblxuICAgICAgICAgIGZ1bmN0aW9uIGVuZEZuKCkge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgY3VycmVudEFuaW1hdGlvbi5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZUFuY2hvclN0eWxlcyhhbmNob3IpIHtcbiAgICAgICAgdmFyIHN0eWxlcyA9IHt9O1xuXG4gICAgICAgIHZhciBjb29yZHMgPSBnZXREb21Ob2RlKGFuY2hvcikuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgLy8gd2UgaXRlcmF0ZSBkaXJlY3RseSBzaW5jZSBzYWZhcmkgbWVzc2VzIHVwIGFuZCBkb2Vzbid0IHJldHVyblxuICAgICAgICAvLyBhbGwgdGhlIGtleXMgZm9yIHRoZSBjb29kcyBvYmplY3Qgd2hlbiBpdGVyYXRlZFxuICAgICAgICBmb3JFYWNoKFsnd2lkdGgnLCdoZWlnaHQnLCd0b3AnLCdsZWZ0J10sIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGNvb3Jkc1trZXldO1xuICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgICAgICB2YWx1ZSArPSBib2R5Tm9kZS5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICAgIHZhbHVlICs9IGJvZHlOb2RlLnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHlsZXNba2V5XSA9IE1hdGguZmxvb3IodmFsdWUpICsgJ3B4JztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdHlsZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHByZXBhcmVPdXRBbmltYXRpb24oKSB7XG4gICAgICAgIHZhciBhbmltYXRvciA9ICRhbmltYXRlQ3NzKGNsb25lLCB7XG4gICAgICAgICAgYWRkQ2xhc3M6IE5HX09VVF9BTkNIT1JfQ0xBU1NfTkFNRSxcbiAgICAgICAgICBkZWxheTogdHJ1ZSxcbiAgICAgICAgICBmcm9tOiBjYWxjdWxhdGVBbmNob3JTdHlsZXMob3V0QW5jaG9yKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZWFkIHRoZSBjb21tZW50IHdpdGhpbiBgcHJlcGFyZVJlZ3VsYXJBbmltYXRpb25gIHRvIHVuZGVyc3RhbmRcbiAgICAgICAgLy8gd2h5IHRoaXMgY2hlY2sgaXMgbmVjZXNzYXJ5XG4gICAgICAgIHJldHVybiBhbmltYXRvci4kJHdpbGxBbmltYXRlID8gYW5pbWF0b3IgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRDbGFzc1ZhbChlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmF0dHIoJ2NsYXNzJykgfHwgJyc7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHByZXBhcmVJbkFuaW1hdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZGluZ0NsYXNzZXMgPSBmaWx0ZXJDc3NDbGFzc2VzKGdldENsYXNzVmFsKGluQW5jaG9yKSk7XG4gICAgICAgIHZhciB0b0FkZCA9IGdldFVuaXF1ZVZhbHVlcyhlbmRpbmdDbGFzc2VzLCBzdGFydGluZ0NsYXNzZXMpO1xuICAgICAgICB2YXIgdG9SZW1vdmUgPSBnZXRVbmlxdWVWYWx1ZXMoc3RhcnRpbmdDbGFzc2VzLCBlbmRpbmdDbGFzc2VzKTtcblxuICAgICAgICB2YXIgYW5pbWF0b3IgPSAkYW5pbWF0ZUNzcyhjbG9uZSwge1xuICAgICAgICAgIHRvOiBjYWxjdWxhdGVBbmNob3JTdHlsZXMoaW5BbmNob3IpLFxuICAgICAgICAgIGFkZENsYXNzOiBOR19JTl9BTkNIT1JfQ0xBU1NfTkFNRSArICcgJyArIHRvQWRkLFxuICAgICAgICAgIHJlbW92ZUNsYXNzOiBOR19PVVRfQU5DSE9SX0NMQVNTX05BTUUgKyAnICcgKyB0b1JlbW92ZSxcbiAgICAgICAgICBkZWxheTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZWFkIHRoZSBjb21tZW50IHdpdGhpbiBgcHJlcGFyZVJlZ3VsYXJBbmltYXRpb25gIHRvIHVuZGVyc3RhbmRcbiAgICAgICAgLy8gd2h5IHRoaXMgY2hlY2sgaXMgbmVjZXNzYXJ5XG4gICAgICAgIHJldHVybiBhbmltYXRvci4kJHdpbGxBbmltYXRlID8gYW5pbWF0b3IgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBlbmQoKSB7XG4gICAgICAgIGNsb25lLnJlbW92ZSgpO1xuICAgICAgICBvdXRBbmNob3IucmVtb3ZlQ2xhc3MoTkdfQU5JTUFURV9TSElNX0NMQVNTX05BTUUpO1xuICAgICAgICBpbkFuY2hvci5yZW1vdmVDbGFzcyhOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUZyb21Ub0FuY2hvckFuaW1hdGlvbihmcm9tLCB0bywgY2xhc3NlcywgYW5jaG9ycykge1xuICAgICAgdmFyIGZyb21BbmltYXRpb24gPSBwcmVwYXJlUmVndWxhckFuaW1hdGlvbihmcm9tLCBub29wKTtcbiAgICAgIHZhciB0b0FuaW1hdGlvbiA9IHByZXBhcmVSZWd1bGFyQW5pbWF0aW9uKHRvLCBub29wKTtcblxuICAgICAgdmFyIGFuY2hvckFuaW1hdGlvbnMgPSBbXTtcbiAgICAgIGZvckVhY2goYW5jaG9ycywgZnVuY3Rpb24oYW5jaG9yKSB7XG4gICAgICAgIHZhciBvdXRFbGVtZW50ID0gYW5jaG9yWydvdXQnXTtcbiAgICAgICAgdmFyIGluRWxlbWVudCA9IGFuY2hvclsnaW4nXTtcbiAgICAgICAgdmFyIGFuaW1hdG9yID0gcHJlcGFyZUFuY2hvcmVkQW5pbWF0aW9uKGNsYXNzZXMsIG91dEVsZW1lbnQsIGluRWxlbWVudCk7XG4gICAgICAgIGlmIChhbmltYXRvcikge1xuICAgICAgICAgIGFuY2hvckFuaW1hdGlvbnMucHVzaChhbmltYXRvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBubyBwb2ludCBpbiBkb2luZyBhbnl0aGluZyB3aGVuIHRoZXJlIGFyZSBubyBlbGVtZW50cyB0byBhbmltYXRlXG4gICAgICBpZiAoIWZyb21BbmltYXRpb24gJiYgIXRvQW5pbWF0aW9uICYmIGFuY2hvckFuaW1hdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYW5pbWF0aW9uUnVubmVycyA9IFtdO1xuXG4gICAgICAgICAgaWYgKGZyb21BbmltYXRpb24pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lcnMucHVzaChmcm9tQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0FuaW1hdGlvbikge1xuICAgICAgICAgICAgYW5pbWF0aW9uUnVubmVycy5wdXNoKHRvQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvckVhY2goYW5jaG9yQW5pbWF0aW9ucywgZnVuY3Rpb24oYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICBhbmltYXRpb25SdW5uZXJzLnB1c2goYW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoe1xuICAgICAgICAgICAgZW5kOiBlbmRGbixcbiAgICAgICAgICAgIGNhbmNlbDogZW5kRm4gLy8gQ1NTLWRyaXZlbiBhbmltYXRpb25zIGNhbm5vdCBiZSBjYW5jZWxsZWQsIG9ubHkgZW5kZWRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgICQkQW5pbWF0ZVJ1bm5lci5hbGwoYW5pbWF0aW9uUnVubmVycywgZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICBydW5uZXIuY29tcGxldGUoc3RhdHVzKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBydW5uZXI7XG5cbiAgICAgICAgICBmdW5jdGlvbiBlbmRGbigpIHtcbiAgICAgICAgICAgIGZvckVhY2goYW5pbWF0aW9uUnVubmVycywgZnVuY3Rpb24ocnVubmVyKSB7XG4gICAgICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlUmVndWxhckFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzLCBvbkJlZm9yZUNsYXNzZXNBcHBsaWVkQ2IpIHtcbiAgICAgIHZhciBlbGVtZW50ID0gYW5pbWF0aW9uRGV0YWlscy5lbGVtZW50O1xuICAgICAgdmFyIG9wdGlvbnMgPSBhbmltYXRpb25EZXRhaWxzLm9wdGlvbnMgfHwge307XG5cbiAgICAgIC8vIHNpbmNlIHRoZSBuZy1FVkVOVCwgY2xhc3MtQUREIGFuZCBjbGFzcy1SRU1PVkUgY2xhc3NlcyBhcmUgYXBwbGllZCBpbnNpZGVcbiAgICAgIC8vIG9mIHRoZSBhbmltYXRlUXVldWUgcHJlIGFuZCBwb3N0RGlnZXN0IHN0YWdlcyB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYWRkXG4gICAgICAvLyB0aGVuIHRoZW0gaGVyZSBhcyB3ZWxsLlxuICAgICAgb3B0aW9ucy4kJHNraXBQcmVwYXJhdGlvbkNsYXNzZXMgPSB0cnVlO1xuXG4gICAgICAvLyBkdXJpbmcgdGhlIHByZS9wb3N0IGRpZ2VzdCBzdGFnZXMgaW5zaWRlIG9mIGFuaW1hdGVRdWV1ZSB3ZSBhbHNvIHBlcmZvcm1lZFxuICAgICAgLy8gdGhlIGJsb2NraW5nICh0cmFuc2l0aW9uOi05OTk5cykgc28gdGhlcmUgaXMgbm8gcG9pbnQgaW4gZG9pbmcgdGhhdCBhZ2Fpbi5cbiAgICAgIG9wdGlvbnMuc2tpcEJsb2NraW5nID0gdHJ1ZTtcblxuICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMuc3RydWN0dXJhbCkge1xuICAgICAgICBvcHRpb25zLmV2ZW50ID0gYW5pbWF0aW9uRGV0YWlscy5ldmVudDtcblxuICAgICAgICAvLyB3ZSBzcGVjaWFsIGNhc2UgdGhlIGxlYXZlIGFuaW1hdGlvbiBzaW5jZSB3ZSB3YW50IHRvIGVuc3VyZSB0aGF0XG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIHJlbW92ZWQgYXMgc29vbiBhcyB0aGUgYW5pbWF0aW9uIGlzIG92ZXIuIE90aGVyd2lzZVxuICAgICAgICAvLyBhIGZsaWNrZXIgbWlnaHQgYXBwZWFyIG9yIHRoZSBlbGVtZW50IG1heSBub3QgYmUgcmVtb3ZlZCBhdCBhbGxcbiAgICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMuZXZlbnQgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICBvcHRpb25zLm9uRG9uZSA9IG9wdGlvbnMuZG9tT3BlcmF0aW9uO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIGFwcGx5IHRoZSBjbGFzc2VzIHJpZ2h0IGF3YXkgc2luY2UgdGhlIHByZS1kaWdlc3QgdG9vayBjYXJlIG9mIHRoZVxuICAgICAgLy8gcHJlcGFyYXRpb24gY2xhc3Nlcy5cbiAgICAgIG9uQmVmb3JlQ2xhc3Nlc0FwcGxpZWRDYihlbGVtZW50KTtcbiAgICAgIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgLy8gV2UgYXNzaWduIHRoZSBwcmVwYXJhdGlvbkNsYXNzZXMgYXMgdGhlIGFjdHVhbCBhbmltYXRpb24gZXZlbnQgc2luY2VcbiAgICAgIC8vIHRoZSBpbnRlcm5hbHMgb2YgJGFuaW1hdGVDc3Mgd2lsbCBqdXN0IHN1ZmZpeCB0aGUgZXZlbnQgdG9rZW4gdmFsdWVzXG4gICAgICAvLyB3aXRoIGAtYWN0aXZlYCB0byB0cmlnZ2VyIHRoZSBhbmltYXRpb24uXG4gICAgICBpZiAob3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMpIHtcbiAgICAgICAgb3B0aW9ucy5ldmVudCA9IGNvbmNhdFdpdGhTcGFjZShvcHRpb25zLmV2ZW50LCBvcHRpb25zLnByZXBhcmF0aW9uQ2xhc3Nlcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhbmltYXRvciA9ICRhbmltYXRlQ3NzKGVsZW1lbnQsIG9wdGlvbnMpO1xuXG4gICAgICAvLyB0aGUgZHJpdmVyIGxvb2t1cCBjb2RlIGluc2lkZSBvZiAkJGFuaW1hdGlvbiBhdHRlbXB0cyB0byBzcGF3biBhXG4gICAgICAvLyBkcml2ZXIgb25lIGJ5IG9uZSB1bnRpbCBhIGRyaXZlciByZXR1cm5zIGEuJCR3aWxsQW5pbWF0ZSBhbmltYXRvciBvYmplY3QuXG4gICAgICAvLyAkYW5pbWF0ZUNzcyB3aWxsIGFsd2F5cyByZXR1cm4gYW4gb2JqZWN0LCBob3dldmVyLCBpdCB3aWxsIHBhc3MgaW5cbiAgICAgIC8vIGEgZmxhZyBhcyBhIGhpbnQgYXMgdG8gd2hldGhlciBhbiBhbmltYXRpb24gd2FzIGRldGVjdGVkIG9yIG5vdFxuICAgICAgcmV0dXJuIGFuaW1hdG9yLiQkd2lsbEFuaW1hdGUgPyBhbmltYXRvciA6IG51bGw7XG4gICAgfVxuICB9XTtcbn1dO1xuXG4vLyBUT0RPKG1hdHNrbyk6IHVzZSBjYWNoaW5nIGhlcmUgdG8gc3BlZWQgdGhpbmdzIHVwIGZvciBkZXRlY3Rpb25cbi8vIFRPRE8obWF0c2tvKTogYWRkIGRvY3VtZW50YXRpb25cbi8vICBieSB0aGUgdGltZS4uLlxuXG52YXIgJCRBbmltYXRlSnNQcm92aWRlciA9IFsnJGFuaW1hdGVQcm92aWRlcicsIGZ1bmN0aW9uKCRhbmltYXRlUHJvdmlkZXIpIHtcbiAgdGhpcy4kZ2V0ID0gWyckaW5qZWN0b3InLCAnJCRBbmltYXRlUnVubmVyJywgJyQkckFGTXV0ZXgnLCAnJCRqcUxpdGUnLFxuICAgICAgIGZ1bmN0aW9uKCRpbmplY3RvciwgICAkJEFuaW1hdGVSdW5uZXIsICAgJCRyQUZNdXRleCwgICAkJGpxTGl0ZSkge1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuICAgICAgICAgLy8gJGFuaW1hdGVKcyhlbGVtZW50LCAnZW50ZXInKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgZXZlbnQsIGNsYXNzZXMsIG9wdGlvbnMpIHtcbiAgICAgIC8vIHRoZSBgY2xhc3Nlc2AgYXJndW1lbnQgaXMgb3B0aW9uYWwgYW5kIGlmIGl0IGlzIG5vdCB1c2VkXG4gICAgICAvLyB0aGVuIHRoZSBjbGFzc2VzIHdpbGwgYmUgcmVzb2x2ZWQgZnJvbSB0aGUgZWxlbWVudCdzIGNsYXNzTmFtZVxuICAgICAgLy8gcHJvcGVydHkgYXMgd2VsbCBhcyBvcHRpb25zLmFkZENsYXNzL29wdGlvbnMucmVtb3ZlQ2xhc3MuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiBpc09iamVjdChjbGFzc2VzKSkge1xuICAgICAgICBvcHRpb25zID0gY2xhc3NlcztcbiAgICAgICAgY2xhc3NlcyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMgPSBwcmVwYXJlQW5pbWF0aW9uT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIGlmICghY2xhc3Nlcykge1xuICAgICAgICBjbGFzc2VzID0gZWxlbWVudC5hdHRyKCdjbGFzcycpIHx8ICcnO1xuICAgICAgICBpZiAob3B0aW9ucy5hZGRDbGFzcykge1xuICAgICAgICAgIGNsYXNzZXMgKz0gJyAnICsgb3B0aW9ucy5hZGRDbGFzcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5yZW1vdmVDbGFzcykge1xuICAgICAgICAgIGNsYXNzZXMgKz0gJyAnICsgb3B0aW9ucy5yZW1vdmVDbGFzcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY2xhc3Nlc1RvQWRkID0gb3B0aW9ucy5hZGRDbGFzcztcbiAgICAgIHZhciBjbGFzc2VzVG9SZW1vdmUgPSBvcHRpb25zLnJlbW92ZUNsYXNzO1xuXG4gICAgICAvLyB0aGUgbG9va3VwQW5pbWF0aW9ucyBmdW5jdGlvbiByZXR1cm5zIGEgc2VyaWVzIG9mIGFuaW1hdGlvbiBvYmplY3RzIHRoYXQgYXJlXG4gICAgICAvLyBtYXRjaGVkIHVwIHdpdGggb25lIG9yIG1vcmUgb2YgdGhlIENTUyBjbGFzc2VzLiBUaGVzZSBhbmltYXRpb24gb2JqZWN0cyBhcmVcbiAgICAgIC8vIGRlZmluZWQgdmlhIHRoZSBtb2R1bGUuYW5pbWF0aW9uIGZhY3RvcnkgZnVuY3Rpb24uIElmIG5vdGhpbmcgaXMgZGV0ZWN0ZWQgdGhlblxuICAgICAgLy8gd2UgZG9uJ3QgcmV0dXJuIGFueXRoaW5nIHdoaWNoIHRoZW4gbWFrZXMgJGFuaW1hdGlvbiBxdWVyeSB0aGUgbmV4dCBkcml2ZXIuXG4gICAgICB2YXIgYW5pbWF0aW9ucyA9IGxvb2t1cEFuaW1hdGlvbnMoY2xhc3Nlcyk7XG4gICAgICB2YXIgYmVmb3JlLCBhZnRlcjtcbiAgICAgIGlmIChhbmltYXRpb25zLmxlbmd0aCkge1xuICAgICAgICB2YXIgYWZ0ZXJGbiwgYmVmb3JlRm47XG4gICAgICAgIGlmIChldmVudCA9PSAnbGVhdmUnKSB7XG4gICAgICAgICAgYmVmb3JlRm4gPSAnbGVhdmUnO1xuICAgICAgICAgIGFmdGVyRm4gPSAnYWZ0ZXJMZWF2ZSc7IC8vIFRPRE8obWF0c2tvKTogZ2V0IHJpZCBvZiB0aGlzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmVmb3JlRm4gPSAnYmVmb3JlJyArIGV2ZW50LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZXZlbnQuc3Vic3RyKDEpO1xuICAgICAgICAgIGFmdGVyRm4gPSBldmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudCAhPT0gJ2VudGVyJyAmJiBldmVudCAhPT0gJ21vdmUnKSB7XG4gICAgICAgICAgYmVmb3JlID0gcGFja2FnZUFuaW1hdGlvbnMoZWxlbWVudCwgZXZlbnQsIG9wdGlvbnMsIGFuaW1hdGlvbnMsIGJlZm9yZUZuKTtcbiAgICAgICAgfVxuICAgICAgICBhZnRlciAgPSBwYWNrYWdlQW5pbWF0aW9ucyhlbGVtZW50LCBldmVudCwgb3B0aW9ucywgYW5pbWF0aW9ucywgYWZ0ZXJGbik7XG4gICAgICB9XG5cbiAgICAgIC8vIG5vIG1hdGNoaW5nIGFuaW1hdGlvbnNcbiAgICAgIGlmICghYmVmb3JlICYmICFhZnRlcikgcmV0dXJuO1xuXG4gICAgICBmdW5jdGlvbiBhcHBseU9wdGlvbnMoKSB7XG4gICAgICAgIG9wdGlvbnMuZG9tT3BlcmF0aW9uKCk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBjbG9zZUFjdGl2ZUFuaW1hdGlvbnM7XG4gICAgICAgICAgdmFyIGNoYWluID0gW107XG5cbiAgICAgICAgICBpZiAoYmVmb3JlKSB7XG4gICAgICAgICAgICBjaGFpbi5wdXNoKGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgIGNsb3NlQWN0aXZlQW5pbWF0aW9ucyA9IGJlZm9yZShmbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2hhaW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGFpbi5wdXNoKGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgIGFwcGx5T3B0aW9ucygpO1xuICAgICAgICAgICAgICBmbih0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBseU9wdGlvbnMoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWZ0ZXIpIHtcbiAgICAgICAgICAgIGNoYWluLnB1c2goZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgY2xvc2VBY3RpdmVBbmltYXRpb25zID0gYWZ0ZXIoZm4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGFuaW1hdGlvbkNsb3NlZCA9IGZhbHNlO1xuICAgICAgICAgIHZhciBydW5uZXIgPSBuZXcgJCRBbmltYXRlUnVubmVyKHtcbiAgICAgICAgICAgIGVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGVuZEFuaW1hdGlvbnMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBlbmRBbmltYXRpb25zKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgJCRBbmltYXRlUnVubmVyLmNoYWluKGNoYWluLCBvbkNvbXBsZXRlKTtcbiAgICAgICAgICByZXR1cm4gcnVubmVyO1xuXG4gICAgICAgICAgZnVuY3Rpb24gb25Db21wbGV0ZShzdWNjZXNzKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DbG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXBwbHlPcHRpb25zKCk7XG4gICAgICAgICAgICBhcHBseUFuaW1hdGlvblN0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJ1bm5lci5jb21wbGV0ZShzdWNjZXNzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBlbmRBbmltYXRpb25zKGNhbmNlbGxlZCkge1xuICAgICAgICAgICAgaWYgKCFhbmltYXRpb25DbG9zZWQpIHtcbiAgICAgICAgICAgICAgKGNsb3NlQWN0aXZlQW5pbWF0aW9ucyB8fCBub29wKShjYW5jZWxsZWQpO1xuICAgICAgICAgICAgICBvbkNvbXBsZXRlKGNhbmNlbGxlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBleGVjdXRlQW5pbWF0aW9uRm4oZm4sIGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBvbkRvbmUpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQpIHtcbiAgICAgICAgICBjYXNlICdhbmltYXRlJzpcbiAgICAgICAgICAgIGFyZ3MgPSBbZWxlbWVudCwgb3B0aW9ucy5mcm9tLCBvcHRpb25zLnRvLCBvbkRvbmVdO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdzZXRDbGFzcyc6XG4gICAgICAgICAgICBhcmdzID0gW2VsZW1lbnQsIGNsYXNzZXNUb0FkZCwgY2xhc3Nlc1RvUmVtb3ZlLCBvbkRvbmVdO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdhZGRDbGFzcyc6XG4gICAgICAgICAgICBhcmdzID0gW2VsZW1lbnQsIGNsYXNzZXNUb0FkZCwgb25Eb25lXTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAncmVtb3ZlQ2xhc3MnOlxuICAgICAgICAgICAgYXJncyA9IFtlbGVtZW50LCBjbGFzc2VzVG9SZW1vdmUsIG9uRG9uZV07XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBhcmdzID0gW2VsZW1lbnQsIG9uRG9uZV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MucHVzaChvcHRpb25zKTtcblxuICAgICAgICB2YXIgdmFsdWUgPSBmbi5hcHBseShmbiwgYXJncyk7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlLnN0YXJ0KSkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdGFydCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mICQkQW5pbWF0ZVJ1bm5lcikge1xuICAgICAgICAgICAgdmFsdWUuZG9uZShvbkRvbmUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIG9wdGlvbmFsIG9uRW5kIC8gb25DYW5jZWwgY2FsbGJhY2tcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ3JvdXBFdmVudGVkQW5pbWF0aW9ucyhlbGVtZW50LCBldmVudCwgb3B0aW9ucywgYW5pbWF0aW9ucywgZm5OYW1lKSB7XG4gICAgICAgIHZhciBvcGVyYXRpb25zID0gW107XG4gICAgICAgIGZvckVhY2goYW5pbWF0aW9ucywgZnVuY3Rpb24oYW5pKSB7XG4gICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IGFuaVtmbk5hbWVdO1xuICAgICAgICAgIGlmICghYW5pbWF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAvLyBub3RlIHRoYXQgYWxsIG9mIHRoZXNlIGFuaW1hdGlvbnMgd2lsbCBydW4gaW4gcGFyYWxsZWxcbiAgICAgICAgICBvcGVyYXRpb25zLnB1c2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcnVubmVyO1xuICAgICAgICAgICAgdmFyIGVuZFByb2dyZXNzQ2I7XG5cbiAgICAgICAgICAgIHZhciByZXNvbHZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIG9uQW5pbWF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbihyZWplY3RlZCkge1xuICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIChlbmRQcm9ncmVzc0NiIHx8IG5vb3ApKHJlamVjdGVkKTtcbiAgICAgICAgICAgICAgICBydW5uZXIuY29tcGxldGUoIXJlamVjdGVkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcih7XG4gICAgICAgICAgICAgIGVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb25BbmltYXRpb25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9uQW5pbWF0aW9uQ29tcGxldGUodHJ1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbmRQcm9ncmVzc0NiID0gZXhlY3V0ZUFuaW1hdGlvbkZuKGFuaW1hdGlvbiwgZWxlbWVudCwgZXZlbnQsIG9wdGlvbnMsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICB2YXIgY2FuY2VsbGVkID0gcmVzdWx0ID09PSBmYWxzZTtcbiAgICAgICAgICAgICAgb25BbmltYXRpb25Db21wbGV0ZShjYW5jZWxsZWQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBydW5uZXI7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBvcGVyYXRpb25zO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYWNrYWdlQW5pbWF0aW9ucyhlbGVtZW50LCBldmVudCwgb3B0aW9ucywgYW5pbWF0aW9ucywgZm5OYW1lKSB7XG4gICAgICAgIHZhciBvcGVyYXRpb25zID0gZ3JvdXBFdmVudGVkQW5pbWF0aW9ucyhlbGVtZW50LCBldmVudCwgb3B0aW9ucywgYW5pbWF0aW9ucywgZm5OYW1lKTtcbiAgICAgICAgaWYgKG9wZXJhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdmFyIGEsYjtcbiAgICAgICAgICBpZiAoZm5OYW1lID09PSAnYmVmb3JlU2V0Q2xhc3MnKSB7XG4gICAgICAgICAgICBhID0gZ3JvdXBFdmVudGVkQW5pbWF0aW9ucyhlbGVtZW50LCAncmVtb3ZlQ2xhc3MnLCBvcHRpb25zLCBhbmltYXRpb25zLCAnYmVmb3JlUmVtb3ZlQ2xhc3MnKTtcbiAgICAgICAgICAgIGIgPSBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsICdhZGRDbGFzcycsIG9wdGlvbnMsIGFuaW1hdGlvbnMsICdiZWZvcmVBZGRDbGFzcycpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZm5OYW1lID09PSAnc2V0Q2xhc3MnKSB7XG4gICAgICAgICAgICBhID0gZ3JvdXBFdmVudGVkQW5pbWF0aW9ucyhlbGVtZW50LCAncmVtb3ZlQ2xhc3MnLCBvcHRpb25zLCBhbmltYXRpb25zLCAncmVtb3ZlQ2xhc3MnKTtcbiAgICAgICAgICAgIGIgPSBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsICdhZGRDbGFzcycsIG9wdGlvbnMsIGFuaW1hdGlvbnMsICdhZGRDbGFzcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICBvcGVyYXRpb25zID0gb3BlcmF0aW9ucy5jb25jYXQoYSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICBvcGVyYXRpb25zID0gb3BlcmF0aW9ucy5jb25jYXQoYik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wZXJhdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgICAgLy8gVE9ETyhtYXRza28pOiBhZGQgZG9jdW1lbnRhdGlvblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RhcnRBbmltYXRpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgcnVubmVycyA9IFtdO1xuICAgICAgICAgIGlmIChvcGVyYXRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yRWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbihhbmltYXRlRm4pIHtcbiAgICAgICAgICAgICAgcnVubmVycy5wdXNoKGFuaW1hdGVGbigpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJ1bm5lcnMubGVuZ3RoID8gJCRBbmltYXRlUnVubmVyLmFsbChydW5uZXJzLCBjYWxsYmFjaykgOiBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGVuZEZuKHJlamVjdCkge1xuICAgICAgICAgICAgZm9yRWFjaChydW5uZXJzLCBmdW5jdGlvbihydW5uZXIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0ID8gcnVubmVyLmNhbmNlbCgpIDogcnVubmVyLmVuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbG9va3VwQW5pbWF0aW9ucyhjbGFzc2VzKSB7XG4gICAgICBjbGFzc2VzID0gaXNBcnJheShjbGFzc2VzKSA/IGNsYXNzZXMgOiBjbGFzc2VzLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgbWF0Y2hlcyA9IFtdLCBmbGFnTWFwID0ge307XG4gICAgICBmb3IgKHZhciBpPTA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrbGFzcyA9IGNsYXNzZXNbaV0sXG4gICAgICAgICAgICBhbmltYXRpb25GYWN0b3J5ID0gJGFuaW1hdGVQcm92aWRlci4kJHJlZ2lzdGVyZWRBbmltYXRpb25zW2tsYXNzXTtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkZhY3RvcnkgJiYgIWZsYWdNYXBba2xhc3NdKSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKCRpbmplY3Rvci5nZXQoYW5pbWF0aW9uRmFjdG9yeSkpO1xuICAgICAgICAgIGZsYWdNYXBba2xhc3NdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgfVxuICB9XTtcbn1dO1xuXG52YXIgJCRBbmltYXRlSnNEcml2ZXJQcm92aWRlciA9IFsnJCRhbmltYXRpb25Qcm92aWRlcicsIGZ1bmN0aW9uKCQkYW5pbWF0aW9uUHJvdmlkZXIpIHtcbiAgJCRhbmltYXRpb25Qcm92aWRlci5kcml2ZXJzLnB1c2goJyQkYW5pbWF0ZUpzRHJpdmVyJyk7XG4gIHRoaXMuJGdldCA9IFsnJCRhbmltYXRlSnMnLCAnJCRBbmltYXRlUnVubmVyJywgZnVuY3Rpb24oJCRhbmltYXRlSnMsICQkQW5pbWF0ZVJ1bm5lcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBpbml0RHJpdmVyRm4oYW5pbWF0aW9uRGV0YWlscykge1xuICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMuZnJvbSAmJiBhbmltYXRpb25EZXRhaWxzLnRvKSB7XG4gICAgICAgIHZhciBmcm9tQW5pbWF0aW9uID0gcHJlcGFyZUFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzLmZyb20pO1xuICAgICAgICB2YXIgdG9BbmltYXRpb24gPSBwcmVwYXJlQW5pbWF0aW9uKGFuaW1hdGlvbkRldGFpbHMudG8pO1xuICAgICAgICBpZiAoIWZyb21BbmltYXRpb24gJiYgIXRvQW5pbWF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYW5pbWF0aW9uUnVubmVycyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAoZnJvbUFuaW1hdGlvbikge1xuICAgICAgICAgICAgICBhbmltYXRpb25SdW5uZXJzLnB1c2goZnJvbUFuaW1hdGlvbi5zdGFydCgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lcnMucHVzaCh0b0FuaW1hdGlvbi5zdGFydCgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJCRBbmltYXRlUnVubmVyLmFsbChhbmltYXRpb25SdW5uZXJzLCBkb25lKTtcblxuICAgICAgICAgICAgdmFyIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoe1xuICAgICAgICAgICAgICBlbmQ6IGVuZEZuRmFjdG9yeSgpLFxuICAgICAgICAgICAgICBjYW5jZWw6IGVuZEZuRmFjdG9yeSgpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZW5kRm5GYWN0b3J5KCkge1xuICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZm9yRWFjaChhbmltYXRpb25SdW5uZXJzLCBmdW5jdGlvbihydW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQgd2UgY2Fubm90IGNhbmNlbCBhbmltYXRpb25zIGZvciBncm91cHMganVzdCB5ZXQuIDEuNStcbiAgICAgICAgICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZG9uZShzdGF0dXMpIHtcbiAgICAgICAgICAgICAgcnVubmVyLmNvbXBsZXRlKHN0YXR1cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHByZXBhcmVBbmltYXRpb24oYW5pbWF0aW9uRGV0YWlscyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHByZXBhcmVBbmltYXRpb24oYW5pbWF0aW9uRGV0YWlscykge1xuICAgICAgLy8gVE9ETyhtYXRza28pOiBtYWtlIHN1cmUgdG8gY2hlY2sgZm9yIGdyb3VwZWQgYW5pbWF0aW9ucyBhbmQgZGVsZWdhdGUgZG93biB0byBub3JtYWwgYW5pbWF0aW9uc1xuICAgICAgdmFyIGVsZW1lbnQgPSBhbmltYXRpb25EZXRhaWxzLmVsZW1lbnQ7XG4gICAgICB2YXIgZXZlbnQgPSBhbmltYXRpb25EZXRhaWxzLmV2ZW50O1xuICAgICAgdmFyIG9wdGlvbnMgPSBhbmltYXRpb25EZXRhaWxzLm9wdGlvbnM7XG4gICAgICB2YXIgY2xhc3NlcyA9IGFuaW1hdGlvbkRldGFpbHMuY2xhc3NlcztcbiAgICAgIHJldHVybiAkJGFuaW1hdGVKcyhlbGVtZW50LCBldmVudCwgY2xhc3Nlcywgb3B0aW9ucyk7XG4gICAgfVxuICB9XTtcbn1dO1xuXG52YXIgTkdfQU5JTUFURV9BVFRSX05BTUUgPSAnZGF0YS1uZy1hbmltYXRlJztcbnZhciBOR19BTklNQVRFX1BJTl9EQVRBID0gJyRuZ0FuaW1hdGVQaW4nO1xudmFyICQkQW5pbWF0ZVF1ZXVlUHJvdmlkZXIgPSBbJyRhbmltYXRlUHJvdmlkZXInLCBmdW5jdGlvbigkYW5pbWF0ZVByb3ZpZGVyKSB7XG4gIHZhciBQUkVfRElHRVNUX1NUQVRFID0gMTtcbiAgdmFyIFJVTk5JTkdfU1RBVEUgPSAyO1xuXG4gIHZhciBydWxlcyA9IHRoaXMucnVsZXMgPSB7XG4gICAgc2tpcDogW10sXG4gICAgY2FuY2VsOiBbXSxcbiAgICBqb2luOiBbXVxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzQWxsb3dlZChydWxlVHlwZSwgZWxlbWVudCwgY3VycmVudEFuaW1hdGlvbiwgcHJldmlvdXNBbmltYXRpb24pIHtcbiAgICByZXR1cm4gcnVsZXNbcnVsZVR5cGVdLnNvbWUoZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBmbihlbGVtZW50LCBjdXJyZW50QW5pbWF0aW9uLCBwcmV2aW91c0FuaW1hdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNBbmltYXRpb25DbGFzc2VzKG9wdGlvbnMsIGFuZCkge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBhID0gKG9wdGlvbnMuYWRkQ2xhc3MgfHwgJycpLmxlbmd0aCA+IDA7XG4gICAgdmFyIGIgPSAob3B0aW9ucy5yZW1vdmVDbGFzcyB8fCAnJykubGVuZ3RoID4gMDtcbiAgICByZXR1cm4gYW5kID8gYSAmJiBiIDogYSB8fCBiO1xuICB9XG5cbiAgcnVsZXMuam9pbi5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIGlmIHRoZSBuZXcgYW5pbWF0aW9uIGlzIGNsYXNzLWJhc2VkIHRoZW4gd2UgY2FuIGp1c3QgdGFjayB0aGF0IG9uXG4gICAgcmV0dXJuICFuZXdBbmltYXRpb24uc3RydWN0dXJhbCAmJiBoYXNBbmltYXRpb25DbGFzc2VzKG5ld0FuaW1hdGlvbi5vcHRpb25zKTtcbiAgfSk7XG5cbiAgcnVsZXMuc2tpcC5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gYW5pbWF0ZSBhbnl0aGluZyBpZiBubyBjbGFzc2VzIGFyZSBiZWluZyBhZGRlZCBhbmRcbiAgICAvLyB0aGVyZSBpcyBubyBzdHJ1Y3R1cmFsIGFuaW1hdGlvbiB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkXG4gICAgcmV0dXJuICFuZXdBbmltYXRpb24uc3RydWN0dXJhbCAmJiAhaGFzQW5pbWF0aW9uQ2xhc3NlcyhuZXdBbmltYXRpb24ub3B0aW9ucyk7XG4gIH0pO1xuXG4gIHJ1bGVzLnNraXAucHVzaChmdW5jdGlvbihlbGVtZW50LCBuZXdBbmltYXRpb24sIGN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAvLyB3aHkgc2hvdWxkIHdlIHRyaWdnZXIgYSBuZXcgc3RydWN0dXJhbCBhbmltYXRpb24gaWYgdGhlIGVsZW1lbnQgd2lsbFxuICAgIC8vIGJlIHJlbW92ZWQgZnJvbSB0aGUgRE9NIGFueXdheT9cbiAgICByZXR1cm4gY3VycmVudEFuaW1hdGlvbi5ldmVudCA9PSAnbGVhdmUnICYmIG5ld0FuaW1hdGlvbi5zdHJ1Y3R1cmFsO1xuICB9KTtcblxuICBydWxlcy5za2lwLnB1c2goZnVuY3Rpb24oZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBjdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgLy8gaWYgdGhlcmUgaXMgYW4gb25nb2luZyBjdXJyZW50IGFuaW1hdGlvbiB0aGVuIGRvbid0IGV2ZW4gYm90aGVyIHJ1bm5pbmcgdGhlIGNsYXNzLWJhc2VkIGFuaW1hdGlvblxuICAgIHJldHVybiBjdXJyZW50QW5pbWF0aW9uLnN0cnVjdHVyYWwgJiYgY3VycmVudEFuaW1hdGlvbi5zdGF0ZSA9PT0gUlVOTklOR19TVEFURSAmJiAhbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWw7XG4gIH0pO1xuXG4gIHJ1bGVzLmNhbmNlbC5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIHRoZXJlIGNhbiBuZXZlciBiZSB0d28gc3RydWN0dXJhbCBhbmltYXRpb25zIHJ1bm5pbmcgYXQgdGhlIHNhbWUgdGltZVxuICAgIHJldHVybiBjdXJyZW50QW5pbWF0aW9uLnN0cnVjdHVyYWwgJiYgbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWw7XG4gIH0pO1xuXG4gIHJ1bGVzLmNhbmNlbC5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIGlmIHRoZSBwcmV2aW91cyBhbmltYXRpb24gaXMgYWxyZWFkeSBydW5uaW5nLCBidXQgdGhlIG5ldyBhbmltYXRpb24gd2lsbFxuICAgIC8vIGJlIHRyaWdnZXJlZCwgYnV0IHRoZSBuZXcgYW5pbWF0aW9uIGlzIHN0cnVjdHVyYWxcbiAgICByZXR1cm4gY3VycmVudEFuaW1hdGlvbi5zdGF0ZSA9PT0gUlVOTklOR19TVEFURSAmJiBuZXdBbmltYXRpb24uc3RydWN0dXJhbDtcbiAgfSk7XG5cbiAgcnVsZXMuY2FuY2VsLnB1c2goZnVuY3Rpb24oZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBjdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgdmFyIG5PID0gbmV3QW5pbWF0aW9uLm9wdGlvbnM7XG4gICAgdmFyIGNPID0gY3VycmVudEFuaW1hdGlvbi5vcHRpb25zO1xuXG4gICAgLy8gaWYgdGhlIGV4YWN0IHNhbWUgQ1NTIGNsYXNzIGlzIGFkZGVkL3JlbW92ZWQgdGhlbiBpdCdzIHNhZmUgdG8gY2FuY2VsIGl0XG4gICAgcmV0dXJuIChuTy5hZGRDbGFzcyAmJiBuTy5hZGRDbGFzcyA9PT0gY08ucmVtb3ZlQ2xhc3MpIHx8IChuTy5yZW1vdmVDbGFzcyAmJiBuTy5yZW1vdmVDbGFzcyA9PT0gY08uYWRkQ2xhc3MpO1xuICB9KTtcblxuICB0aGlzLiRnZXQgPSBbJyQkckFGJywgJyRyb290U2NvcGUnLCAnJHJvb3RFbGVtZW50JywgJyRkb2N1bWVudCcsICckJGJvZHknLCAnJCRIYXNoTWFwJyxcbiAgICAgICAgICAgICAgICckJGFuaW1hdGlvbicsICckJEFuaW1hdGVSdW5uZXInLCAnJHRlbXBsYXRlUmVxdWVzdCcsICckJGpxTGl0ZScsICckJGZvcmNlUmVmbG93JyxcbiAgICAgICBmdW5jdGlvbigkJHJBRiwgICAkcm9vdFNjb3BlLCAgICRyb290RWxlbWVudCwgICAkZG9jdW1lbnQsICAgJCRib2R5LCAgICQkSGFzaE1hcCxcbiAgICAgICAgICAgICAgICAkJGFuaW1hdGlvbiwgICAkJEFuaW1hdGVSdW5uZXIsICAgJHRlbXBsYXRlUmVxdWVzdCwgICAkJGpxTGl0ZSwgICAkJGZvcmNlUmVmbG93KSB7XG5cbiAgICB2YXIgYWN0aXZlQW5pbWF0aW9uc0xvb2t1cCA9IG5ldyAkJEhhc2hNYXAoKTtcbiAgICB2YXIgZGlzYWJsZWRFbGVtZW50c0xvb2t1cCA9IG5ldyAkJEhhc2hNYXAoKTtcbiAgICB2YXIgYW5pbWF0aW9uc0VuYWJsZWQgPSBudWxsO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBhbGwgZGlyZWN0aXZlIGFuZCByb3V0ZS1yZWxhdGVkIHRlbXBsYXRlcyBhcmUgZG93bmxvYWRlZCBhbmRcbiAgICAvLyBjb21waWxlZC4gVGhlICR0ZW1wbGF0ZVJlcXVlc3QudG90YWxQZW5kaW5nUmVxdWVzdHMgdmFyaWFibGUga2VlcHMgdHJhY2sgb2ZcbiAgICAvLyBhbGwgb2YgdGhlIHJlbW90ZSB0ZW1wbGF0ZXMgYmVpbmcgY3VycmVudGx5IGRvd25sb2FkZWQuIElmIHRoZXJlIGFyZSBub1xuICAgIC8vIHRlbXBsYXRlcyBjdXJyZW50bHkgZG93bmxvYWRpbmcgdGhlbiB0aGUgd2F0Y2hlciB3aWxsIHN0aWxsIGZpcmUgYW55d2F5LlxuICAgIHZhciBkZXJlZ2lzdGVyV2F0Y2ggPSAkcm9vdFNjb3BlLiR3YXRjaChcbiAgICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gJHRlbXBsYXRlUmVxdWVzdC50b3RhbFBlbmRpbmdSZXF1ZXN0cyA9PT0gMDsgfSxcbiAgICAgIGZ1bmN0aW9uKGlzRW1wdHkpIHtcbiAgICAgICAgaWYgKCFpc0VtcHR5KSByZXR1cm47XG4gICAgICAgIGRlcmVnaXN0ZXJXYXRjaCgpO1xuXG4gICAgICAgIC8vIE5vdyB0aGF0IGFsbCB0ZW1wbGF0ZXMgaGF2ZSBiZWVuIGRvd25sb2FkZWQsICRhbmltYXRlIHdpbGwgd2FpdCB1bnRpbFxuICAgICAgICAvLyB0aGUgcG9zdCBkaWdlc3QgcXVldWUgaXMgZW1wdHkgYmVmb3JlIGVuYWJsaW5nIGFuaW1hdGlvbnMuIEJ5IGhhdmluZyB0d29cbiAgICAgICAgLy8gY2FsbHMgdG8gJHBvc3REaWdlc3QgY2FsbHMgd2UgY2FuIGVuc3VyZSB0aGF0IHRoZSBmbGFnIGlzIGVuYWJsZWQgYXQgdGhlXG4gICAgICAgIC8vIHZlcnkgZW5kIG9mIHRoZSBwb3N0IGRpZ2VzdCBxdWV1ZS4gU2luY2UgYWxsIG9mIHRoZSBhbmltYXRpb25zIGluICRhbmltYXRlXG4gICAgICAgIC8vIHVzZSAkcG9zdERpZ2VzdCwgaXQncyBpbXBvcnRhbnQgdGhhdCB0aGUgY29kZSBiZWxvdyBleGVjdXRlcyBhdCB0aGUgZW5kLlxuICAgICAgICAvLyBUaGlzIGJhc2ljYWxseSBtZWFucyB0aGF0IHRoZSBwYWdlIGlzIGZ1bGx5IGRvd25sb2FkZWQgYW5kIGNvbXBpbGVkIGJlZm9yZVxuICAgICAgICAvLyBhbnkgYW5pbWF0aW9ucyBhcmUgdHJpZ2dlcmVkLlxuICAgICAgICAkcm9vdFNjb3BlLiQkcG9zdERpZ2VzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLiQkcG9zdERpZ2VzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHdlIGNoZWNrIGZvciBudWxsIGRpcmVjdGx5IGluIHRoZSBldmVudCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBhbHJlYWR5IGNhbGxlZFxuICAgICAgICAgICAgLy8gLmVuYWJsZWQoKSB3aXRoIHdoYXRldmVyIGFyZ3VtZW50cyB0aGF0IGl0IHByb3ZpZGVkIGl0IHdpdGhcbiAgICAgICAgICAgIGlmIChhbmltYXRpb25zRW5hYmxlZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICBhbmltYXRpb25zRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB2YXIgY2FsbGJhY2tSZWdpc3RyeSA9IHt9O1xuXG4gICAgLy8gcmVtZW1iZXIgdGhhdCB0aGUgY2xhc3NOYW1lRmlsdGVyIGlzIHNldCBkdXJpbmcgdGhlIHByb3ZpZGVyL2NvbmZpZ1xuICAgIC8vIHN0YWdlIHRoZXJlZm9yZSB3ZSBjYW4gb3B0aW1pemUgaGVyZSBhbmQgc2V0dXAgYSBoZWxwZXIgZnVuY3Rpb25cbiAgICB2YXIgY2xhc3NOYW1lRmlsdGVyID0gJGFuaW1hdGVQcm92aWRlci5jbGFzc05hbWVGaWx0ZXIoKTtcbiAgICB2YXIgaXNBbmltYXRhYmxlQ2xhc3NOYW1lID0gIWNsYXNzTmFtZUZpbHRlclxuICAgICAgICAgICAgICA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgICA6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWVGaWx0ZXIudGVzdChjbGFzc05hbWUpO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplQW5pbWF0aW9uT3B0aW9ucyhlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gbWVyZ2VBbmltYXRpb25PcHRpb25zKGVsZW1lbnQsIG9wdGlvbnMsIHt9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2FsbGJhY2tzKGVsZW1lbnQsIGV2ZW50KSB7XG4gICAgICB2YXIgdGFyZ2V0Tm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG5cbiAgICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgICB2YXIgZW50cmllcyA9IGNhbGxiYWNrUmVnaXN0cnlbZXZlbnRdO1xuICAgICAgaWYgKGVudHJpZXMpIHtcbiAgICAgICAgZm9yRWFjaChlbnRyaWVzLCBmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICAgIGlmIChlbnRyeS5ub2RlLmNvbnRhaW5zKHRhcmdldE5vZGUpKSB7XG4gICAgICAgICAgICBtYXRjaGVzLnB1c2goZW50cnkuY2FsbGJhY2spO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyaWdnZXJDYWxsYmFjayhldmVudCwgZWxlbWVudCwgcGhhc2UsIGRhdGEpIHtcbiAgICAgICQkckFGKGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3JFYWNoKGZpbmRDYWxsYmFja3MoZWxlbWVudCwgZXZlbnQpLCBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrKGVsZW1lbnQsIHBoYXNlLCBkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgb246IGZ1bmN0aW9uKGV2ZW50LCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub2RlID0gZXh0cmFjdEVsZW1lbnROb2RlKGNvbnRhaW5lcik7XG4gICAgICAgIGNhbGxiYWNrUmVnaXN0cnlbZXZlbnRdID0gY2FsbGJhY2tSZWdpc3RyeVtldmVudF0gfHwgW107XG4gICAgICAgIGNhbGxiYWNrUmVnaXN0cnlbZXZlbnRdLnB1c2goe1xuICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgb2ZmOiBmdW5jdGlvbihldmVudCwgY29udGFpbmVyLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZW50cmllcyA9IGNhbGxiYWNrUmVnaXN0cnlbZXZlbnRdO1xuICAgICAgICBpZiAoIWVudHJpZXMpIHJldHVybjtcblxuICAgICAgICBjYWxsYmFja1JlZ2lzdHJ5W2V2ZW50XSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiBmaWx0ZXJGcm9tUmVnaXN0cnkoZW50cmllcywgY29udGFpbmVyLCBjYWxsYmFjayk7XG5cbiAgICAgICAgZnVuY3Rpb24gZmlsdGVyRnJvbVJlZ2lzdHJ5KGxpc3QsIG1hdGNoQ29udGFpbmVyLCBtYXRjaENhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGNvbnRhaW5lck5vZGUgPSBleHRyYWN0RWxlbWVudE5vZGUobWF0Y2hDb250YWluZXIpO1xuICAgICAgICAgIHJldHVybiBsaXN0LmZpbHRlcihmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBlbnRyeS5ub2RlID09PSBjb250YWluZXJOb2RlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKCFtYXRjaENhbGxiYWNrIHx8IGVudHJ5LmNhbGxiYWNrID09PSBtYXRjaENhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAhaXNNYXRjaDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcGluOiBmdW5jdGlvbihlbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGFzc2VydEFyZyhpc0VsZW1lbnQoZWxlbWVudCksICdlbGVtZW50JywgJ25vdCBhbiBlbGVtZW50Jyk7XG4gICAgICAgIGFzc2VydEFyZyhpc0VsZW1lbnQocGFyZW50RWxlbWVudCksICdwYXJlbnRFbGVtZW50JywgJ25vdCBhbiBlbGVtZW50Jyk7XG4gICAgICAgIGVsZW1lbnQuZGF0YShOR19BTklNQVRFX1BJTl9EQVRBLCBwYXJlbnRFbGVtZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHB1c2g6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBkb21PcGVyYXRpb24pIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG9wdGlvbnMuZG9tT3BlcmF0aW9uID0gZG9tT3BlcmF0aW9uO1xuICAgICAgICByZXR1cm4gcXVldWVBbmltYXRpb24oZWxlbWVudCwgZXZlbnQsIG9wdGlvbnMpO1xuICAgICAgfSxcblxuICAgICAgLy8gdGhpcyBtZXRob2QgaGFzIGZvdXIgc2lnbmF0dXJlczpcbiAgICAgIC8vICAoKSAtIGdsb2JhbCBnZXR0ZXJcbiAgICAgIC8vICAoYm9vbCkgLSBnbG9iYWwgc2V0dGVyXG4gICAgICAvLyAgKGVsZW1lbnQpIC0gZWxlbWVudCBnZXR0ZXJcbiAgICAgIC8vICAoZWxlbWVudCwgYm9vbCkgLSBlbGVtZW50IHNldHRlcjxGMzc+XG4gICAgICBlbmFibGVkOiBmdW5jdGlvbihlbGVtZW50LCBib29sKSB7XG4gICAgICAgIHZhciBhcmdDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGFyZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgLy8gKCkgLSBHbG9iYWwgZ2V0dGVyXG4gICAgICAgICAgYm9vbCA9ICEhYW5pbWF0aW9uc0VuYWJsZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGhhc0VsZW1lbnQgPSBpc0VsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAgICAgICBpZiAoIWhhc0VsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIChib29sKSAtIEdsb2JhbCBzZXR0ZXJcbiAgICAgICAgICAgIGJvb2wgPSBhbmltYXRpb25zRW5hYmxlZCA9ICEhZWxlbWVudDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBnZXREb21Ob2RlKGVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIHJlY29yZEV4aXN0cyA9IGRpc2FibGVkRWxlbWVudHNMb29rdXAuZ2V0KG5vZGUpO1xuXG4gICAgICAgICAgICBpZiAoYXJnQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgLy8gKGVsZW1lbnQpIC0gRWxlbWVudCBnZXR0ZXJcbiAgICAgICAgICAgICAgYm9vbCA9ICFyZWNvcmRFeGlzdHM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyAoZWxlbWVudCwgYm9vbCkgLSBFbGVtZW50IHNldHRlclxuICAgICAgICAgICAgICBib29sID0gISFib29sO1xuICAgICAgICAgICAgICBpZiAoIWJvb2wpIHtcbiAgICAgICAgICAgICAgICBkaXNhYmxlZEVsZW1lbnRzTG9va3VwLnB1dChub2RlLCB0cnVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZWNvcmRFeGlzdHMpIHtcbiAgICAgICAgICAgICAgICBkaXNhYmxlZEVsZW1lbnRzTG9va3VwLnJlbW92ZShub2RlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUFuaW1hdGlvbihlbGVtZW50LCBldmVudCwgb3B0aW9ucykge1xuICAgICAgdmFyIG5vZGUsIHBhcmVudDtcbiAgICAgIGVsZW1lbnQgPSBzdHJpcENvbW1lbnRzRnJvbUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICBub2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgICAgcGFyZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHByZXBhcmVBbmltYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAvLyB3ZSBjcmVhdGUgYSBmYWtlIHJ1bm5lciB3aXRoIGEgd29ya2luZyBwcm9taXNlLlxuICAgICAgLy8gVGhlc2UgbWV0aG9kcyB3aWxsIGJlY29tZSBhdmFpbGFibGUgYWZ0ZXIgdGhlIGRpZ2VzdCBoYXMgcGFzc2VkXG4gICAgICB2YXIgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcigpO1xuXG4gICAgICBpZiAoaXNBcnJheShvcHRpb25zLmFkZENsYXNzKSkge1xuICAgICAgICBvcHRpb25zLmFkZENsYXNzID0gb3B0aW9ucy5hZGRDbGFzcy5qb2luKCcgJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmFkZENsYXNzICYmICFpc1N0cmluZyhvcHRpb25zLmFkZENsYXNzKSkge1xuICAgICAgICBvcHRpb25zLmFkZENsYXNzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzQXJyYXkob3B0aW9ucy5yZW1vdmVDbGFzcykpIHtcbiAgICAgICAgb3B0aW9ucy5yZW1vdmVDbGFzcyA9IG9wdGlvbnMucmVtb3ZlQ2xhc3Muam9pbignICcpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5yZW1vdmVDbGFzcyAmJiAhaXNTdHJpbmcob3B0aW9ucy5yZW1vdmVDbGFzcykpIHtcbiAgICAgICAgb3B0aW9ucy5yZW1vdmVDbGFzcyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmZyb20gJiYgIWlzT2JqZWN0KG9wdGlvbnMuZnJvbSkpIHtcbiAgICAgICAgb3B0aW9ucy5mcm9tID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMudG8gJiYgIWlzT2JqZWN0KG9wdGlvbnMudG8pKSB7XG4gICAgICAgIG9wdGlvbnMudG8gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyB0aGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhIGRpcmVjdGl2ZSBpc3N1ZXMgYW4gYW5pbWF0aW9uIGZvclxuICAgICAgLy8gYSBqcUxpdGUgd3JhcHBlciB0aGF0IGNvbnRhaW5zIG9ubHkgY29tbWVudCBub2Rlcy4uLiBJZiB0aGlzXG4gICAgICAvLyBoYXBwZW5zIHRoZW4gdGhlcmUgaXMgbm8gd2F5IHdlIGNhbiBwZXJmb3JtIGFuIGFuaW1hdGlvblxuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIGNsb3NlKCk7XG4gICAgICAgIHJldHVybiBydW5uZXI7XG4gICAgICB9XG5cbiAgICAgIHZhciBjbGFzc05hbWUgPSBbbm9kZS5jbGFzc05hbWUsIG9wdGlvbnMuYWRkQ2xhc3MsIG9wdGlvbnMucmVtb3ZlQ2xhc3NdLmpvaW4oJyAnKTtcbiAgICAgIGlmICghaXNBbmltYXRhYmxlQ2xhc3NOYW1lKGNsYXNzTmFtZSkpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgdmFyIGlzU3RydWN0dXJhbCA9IFsnZW50ZXInLCAnbW92ZScsICdsZWF2ZSddLmluZGV4T2YoZXZlbnQpID49IDA7XG5cbiAgICAgIC8vIHRoaXMgaXMgYSBoYXJkIGRpc2FibGUgb2YgYWxsIGFuaW1hdGlvbnMgZm9yIHRoZSBhcHBsaWNhdGlvbiBvciBvblxuICAgICAgLy8gdGhlIGVsZW1lbnQgaXRzZWxmLCB0aGVyZWZvcmUgIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29udGludWUgZnVydGhlclxuICAgICAgLy8gcGFzdCB0aGlzIHBvaW50IGlmIG5vdCBlbmFibGVkXG4gICAgICB2YXIgc2tpcEFuaW1hdGlvbnMgPSAhYW5pbWF0aW9uc0VuYWJsZWQgfHwgZGlzYWJsZWRFbGVtZW50c0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICB2YXIgZXhpc3RpbmdBbmltYXRpb24gPSAoIXNraXBBbmltYXRpb25zICYmIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAuZ2V0KG5vZGUpKSB8fCB7fTtcbiAgICAgIHZhciBoYXNFeGlzdGluZ0FuaW1hdGlvbiA9ICEhZXhpc3RpbmdBbmltYXRpb24uc3RhdGU7XG5cbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHRyYXZlcnNpbmcgdGhlIHNhbWUgY29sbGVjdGlvbiBvZiBwYXJlbnQgYW5jZXN0b3JzIGlmIGEgZm9sbG93dXBcbiAgICAgIC8vIGFuaW1hdGlvbiB3aWxsIGJlIHJ1biBvbiB0aGUgc2FtZSBlbGVtZW50IHRoYXQgYWxyZWFkeSBkaWQgYWxsIHRoYXQgY2hlY2tpbmcgd29ya1xuICAgICAgaWYgKCFza2lwQW5pbWF0aW9ucyAmJiAoIWhhc0V4aXN0aW5nQW5pbWF0aW9uIHx8IGV4aXN0aW5nQW5pbWF0aW9uLnN0YXRlICE9IFBSRV9ESUdFU1RfU1RBVEUpKSB7XG4gICAgICAgIHNraXBBbmltYXRpb25zID0gIWFyZUFuaW1hdGlvbnNBbGxvd2VkKGVsZW1lbnQsIHBhcmVudCwgZXZlbnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2tpcEFuaW1hdGlvbnMpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzU3RydWN0dXJhbCkge1xuICAgICAgICBjbG9zZUNoaWxkQW5pbWF0aW9ucyhlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld0FuaW1hdGlvbiA9IHtcbiAgICAgICAgc3RydWN0dXJhbDogaXNTdHJ1Y3R1cmFsLFxuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgIGNsb3NlOiBjbG9zZSxcbiAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgcnVubmVyOiBydW5uZXJcbiAgICAgIH07XG5cbiAgICAgIGlmIChoYXNFeGlzdGluZ0FuaW1hdGlvbikge1xuICAgICAgICB2YXIgc2tpcEFuaW1hdGlvbkZsYWcgPSBpc0FsbG93ZWQoJ3NraXAnLCBlbGVtZW50LCBuZXdBbmltYXRpb24sIGV4aXN0aW5nQW5pbWF0aW9uKTtcbiAgICAgICAgaWYgKHNraXBBbmltYXRpb25GbGFnKSB7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nQW5pbWF0aW9uLnN0YXRlID09PSBSVU5OSU5HX1NUQVRFKSB7XG4gICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVyZ2VBbmltYXRpb25PcHRpb25zKGVsZW1lbnQsIGV4aXN0aW5nQW5pbWF0aW9uLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nQW5pbWF0aW9uLnJ1bm5lcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FuY2VsQW5pbWF0aW9uRmxhZyA9IGlzQWxsb3dlZCgnY2FuY2VsJywgZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBleGlzdGluZ0FuaW1hdGlvbik7XG4gICAgICAgIGlmIChjYW5jZWxBbmltYXRpb25GbGFnKSB7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nQW5pbWF0aW9uLnN0YXRlID09PSBSVU5OSU5HX1NUQVRFKSB7XG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgZW5kIHRoZSBhbmltYXRpb24gcmlnaHQgYXdheSBhbmQgaXQgaXMgc2FmZVxuICAgICAgICAgICAgLy8gdG8gZG8gc28gc2luY2UgdGhlIGFuaW1hdGlvbiBpcyBhbHJlYWR5IHJ1bm5pbmcgYW5kIHRoZVxuICAgICAgICAgICAgLy8gcnVubmVyIGNhbGxiYWNrIGNvZGUgd2lsbCBydW4gaW4gYXN5bmNcbiAgICAgICAgICAgIGV4aXN0aW5nQW5pbWF0aW9uLnJ1bm5lci5lbmQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGV4aXN0aW5nQW5pbWF0aW9uLnN0cnVjdHVyYWwpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgYW5pbWF0aW9uIGlzIHF1ZXVlZCBpbnRvIGEgZGlnZXN0LCBidXRcbiAgICAgICAgICAgIC8vIGhhc24ndCBzdGFydGVkIHlldC4gVGhlcmVmb3JlIGl0IGlzIHNhZmUgdG8gcnVuIHRoZSBjbG9zZVxuICAgICAgICAgICAgLy8gbWV0aG9kIHdoaWNoIHdpbGwgY2FsbCB0aGUgcnVubmVyIG1ldGhvZHMgaW4gYXN5bmMuXG4gICAgICAgICAgICBleGlzdGluZ0FuaW1hdGlvbi5jbG9zZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgbWVyZ2UgdGhlIG5ldyBhbmltYXRpb24gb3B0aW9ucyBpbnRvIGV4aXN0aW5nIGFuaW1hdGlvbiBvcHRpb25zXG4gICAgICAgICAgICBtZXJnZUFuaW1hdGlvbk9wdGlvbnMoZWxlbWVudCwgZXhpc3RpbmdBbmltYXRpb24ub3B0aW9ucywgbmV3QW5pbWF0aW9uLm9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nQW5pbWF0aW9uLnJ1bm5lcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYSBqb2luZWQgYW5pbWF0aW9uIG1lYW5zIHRoYXQgdGhpcyBhbmltYXRpb24gd2lsbCB0YWtlIG92ZXIgdGhlIGV4aXN0aW5nIG9uZVxuICAgICAgICAgIC8vIHNvIGFuIGV4YW1wbGUgd291bGQgaW52b2x2ZSBhIGxlYXZlIGFuaW1hdGlvbiB0YWtpbmcgb3ZlciBhbiBlbnRlci4gVGhlbiB3aGVuXG4gICAgICAgICAgLy8gdGhlIHBvc3REaWdlc3Qga2lja3MgaW4gdGhlIGVudGVyIHdpbGwgYmUgaWdub3JlZC5cbiAgICAgICAgICB2YXIgam9pbkFuaW1hdGlvbkZsYWcgPSBpc0FsbG93ZWQoJ2pvaW4nLCBlbGVtZW50LCBuZXdBbmltYXRpb24sIGV4aXN0aW5nQW5pbWF0aW9uKTtcbiAgICAgICAgICBpZiAoam9pbkFuaW1hdGlvbkZsYWcpIHtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0FuaW1hdGlvbi5zdGF0ZSA9PT0gUlVOTklOR19TVEFURSkge1xuICAgICAgICAgICAgICBub3JtYWxpemVBbmltYXRpb25PcHRpb25zKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXBwbHlHZW5lcmF0ZWRQcmVwYXJhdGlvbkNsYXNzZXMoZWxlbWVudCwgaXNTdHJ1Y3R1cmFsID8gZXZlbnQgOiBudWxsLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgICBldmVudCA9IG5ld0FuaW1hdGlvbi5ldmVudCA9IGV4aXN0aW5nQW5pbWF0aW9uLmV2ZW50O1xuICAgICAgICAgICAgICBvcHRpb25zID0gbWVyZ2VBbmltYXRpb25PcHRpb25zKGVsZW1lbnQsIGV4aXN0aW5nQW5pbWF0aW9uLm9wdGlvbnMsIG5ld0FuaW1hdGlvbi5vcHRpb25zKTtcblxuICAgICAgICAgICAgICAvL3dlIHJldHVybiB0aGUgc2FtZSBydW5uZXIgc2luY2Ugb25seSB0aGUgb3B0aW9uIHZhbHVlcyBvZiB0aGlzIGFuaW1hdGlvbiB3aWxsXG4gICAgICAgICAgICAgIC8vYmUgZmVkIGludG8gdGhlIGBleGlzdGluZ0FuaW1hdGlvbmAuXG4gICAgICAgICAgICAgIHJldHVybiBleGlzdGluZ0FuaW1hdGlvbi5ydW5uZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3JtYWxpemF0aW9uIGluIHRoaXMgY2FzZSBtZWFucyB0aGF0IGl0IHJlbW92ZXMgcmVkdW5kYW50IENTUyBjbGFzc2VzIHRoYXRcbiAgICAgICAgLy8gYWxyZWFkeSBleGlzdCAoYWRkQ2xhc3MpIG9yIGRvIG5vdCBleGlzdCAocmVtb3ZlQ2xhc3MpIG9uIHRoZSBlbGVtZW50XG4gICAgICAgIG5vcm1hbGl6ZUFuaW1hdGlvbk9wdGlvbnMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdoZW4gdGhlIG9wdGlvbnMgYXJlIG1lcmdlZCBhbmQgY2xlYW5lZCB1cCB3ZSBtYXkgZW5kIHVwIG5vdCBoYXZpbmcgdG8gZG9cbiAgICAgIC8vIGFuIGFuaW1hdGlvbiBhdCBhbGwsIHRoZXJlZm9yZSB3ZSBzaG91bGQgY2hlY2sgdGhpcyBiZWZvcmUgaXNzdWluZyBhIHBvc3RcbiAgICAgIC8vIGRpZ2VzdCBjYWxsYmFjay4gU3RydWN0dXJhbCBhbmltYXRpb25zIHdpbGwgYWx3YXlzIHJ1biBubyBtYXR0ZXIgd2hhdC5cbiAgICAgIHZhciBpc1ZhbGlkQW5pbWF0aW9uID0gbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWw7XG4gICAgICBpZiAoIWlzVmFsaWRBbmltYXRpb24pIHtcbiAgICAgICAgLy8gYW5pbWF0ZSAoZnJvbS90bykgY2FuIGJlIHF1aWNrbHkgY2hlY2tlZCBmaXJzdCwgb3RoZXJ3aXNlIHdlIGNoZWNrIGlmIGFueSBjbGFzc2VzIGFyZSBwcmVzZW50XG4gICAgICAgIGlzVmFsaWRBbmltYXRpb24gPSAobmV3QW5pbWF0aW9uLmV2ZW50ID09PSAnYW5pbWF0ZScgJiYgT2JqZWN0LmtleXMobmV3QW5pbWF0aW9uLm9wdGlvbnMudG8gfHwge30pLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgaGFzQW5pbWF0aW9uQ2xhc3NlcyhuZXdBbmltYXRpb24ub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNWYWxpZEFuaW1hdGlvbikge1xuICAgICAgICBjbG9zZSgpO1xuICAgICAgICBjbGVhckVsZW1lbnRBbmltYXRpb25TdGF0ZShlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgYXBwbHlHZW5lcmF0ZWRQcmVwYXJhdGlvbkNsYXNzZXMoZWxlbWVudCwgaXNTdHJ1Y3R1cmFsID8gZXZlbnQgOiBudWxsLCBvcHRpb25zKTtcbiAgICAgIGJsb2NrVHJhbnNpdGlvbnMobm9kZSwgU0FGRV9GQVNUX0ZPUldBUkRfRFVSQVRJT05fVkFMVUUpO1xuXG4gICAgICAvLyB0aGUgY291bnRlciBrZWVwcyB0cmFjayBvZiBjYW5jZWxsZWQgYW5pbWF0aW9uc1xuICAgICAgdmFyIGNvdW50ZXIgPSAoZXhpc3RpbmdBbmltYXRpb24uY291bnRlciB8fCAwKSArIDE7XG4gICAgICBuZXdBbmltYXRpb24uY291bnRlciA9IGNvdW50ZXI7XG5cbiAgICAgIG1hcmtFbGVtZW50QW5pbWF0aW9uU3RhdGUoZWxlbWVudCwgUFJFX0RJR0VTVF9TVEFURSwgbmV3QW5pbWF0aW9uKTtcblxuICAgICAgJHJvb3RTY29wZS4kJHBvc3REaWdlc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhbmltYXRpb25EZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICAgIHZhciBhbmltYXRpb25DYW5jZWxsZWQgPSAhYW5pbWF0aW9uRGV0YWlscztcbiAgICAgICAgYW5pbWF0aW9uRGV0YWlscyA9IGFuaW1hdGlvbkRldGFpbHMgfHwge307XG5cbiAgICAgICAgLy8gaWYgYWRkQ2xhc3MvcmVtb3ZlQ2xhc3MgaXMgY2FsbGVkIGJlZm9yZSBzb21ldGhpbmcgbGlrZSBlbnRlciB0aGVuIHRoZVxuICAgICAgICAvLyByZWdpc3RlcmVkIHBhcmVudCBlbGVtZW50IG1heSBub3QgYmUgcHJlc2VudC4gVGhlIGNvZGUgYmVsb3cgd2lsbCBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBhIGZpbmFsIHZhbHVlIGZvciBwYXJlbnQgZWxlbWVudCBpcyBvYnRhaW5lZFxuICAgICAgICB2YXIgcGFyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50KCkgfHwgW107XG5cbiAgICAgICAgLy8gYW5pbWF0ZS9zdHJ1Y3R1cmFsL2NsYXNzLWJhc2VkIGFuaW1hdGlvbnMgYWxsIGhhdmUgcmVxdWlyZW1lbnRzLiBPdGhlcndpc2UgdGhlcmVcbiAgICAgICAgLy8gaXMgbm8gcG9pbnQgaW4gcGVyZm9ybWluZyBhbiBhbmltYXRpb24uIFRoZSBwYXJlbnQgbm9kZSBtdXN0IGFsc28gYmUgc2V0LlxuICAgICAgICB2YXIgaXNWYWxpZEFuaW1hdGlvbiA9IHBhcmVudEVsZW1lbnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoYW5pbWF0aW9uRGV0YWlscy5ldmVudCA9PT0gJ2FuaW1hdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBhbmltYXRpb25EZXRhaWxzLnN0cnVjdHVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGhhc0FuaW1hdGlvbkNsYXNzZXMoYW5pbWF0aW9uRGV0YWlscy5vcHRpb25zKSk7XG5cbiAgICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBwcmV2aW91cyBhbmltYXRpb24gd2FzIGNhbmNlbGxlZFxuICAgICAgICAvLyBldmVuIGlmIHRoZSBmb2xsb3ctdXAgYW5pbWF0aW9uIGlzIHRoZSBzYW1lIGV2ZW50XG4gICAgICAgIGlmIChhbmltYXRpb25DYW5jZWxsZWQgfHwgYW5pbWF0aW9uRGV0YWlscy5jb3VudGVyICE9PSBjb3VudGVyIHx8ICFpc1ZhbGlkQW5pbWF0aW9uKSB7XG4gICAgICAgICAgLy8gaWYgYW5vdGhlciBhbmltYXRpb24gZGlkIG5vdCB0YWtlIG92ZXIgdGhlbiB3ZSBuZWVkXG4gICAgICAgICAgLy8gdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGRvbU9wZXJhdGlvbiBhbmQgb3B0aW9ucyBhcmVcbiAgICAgICAgICAvLyBoYW5kbGVkIGFjY29yZGluZ2x5XG4gICAgICAgICAgaWYgKGFuaW1hdGlvbkNhbmNlbGxlZCkge1xuICAgICAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgYXBwbHlBbmltYXRpb25TdHlsZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gaWYgdGhlIGV2ZW50IGNoYW5nZWQgZnJvbSBzb21ldGhpbmcgbGlrZSBlbnRlciB0byBsZWF2ZSB0aGVuIHdlIGRvXG4gICAgICAgICAgLy8gaXQsIG90aGVyd2lzZSBpZiBpdCdzIHRoZSBzYW1lIHRoZW4gdGhlIGVuZCByZXN1bHQgd2lsbCBiZSB0aGUgc2FtZSB0b29cbiAgICAgICAgICBpZiAoYW5pbWF0aW9uQ2FuY2VsbGVkIHx8IChpc1N0cnVjdHVyYWwgJiYgYW5pbWF0aW9uRGV0YWlscy5ldmVudCAhPT0gZXZlbnQpKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRvbU9wZXJhdGlvbigpO1xuICAgICAgICAgICAgcnVubmVyLmVuZCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGluIHRoZSBldmVudCB0aGF0IHRoZSBlbGVtZW50IGFuaW1hdGlvbiB3YXMgbm90IGNhbmNlbGxlZCBvciBhIGZvbGxvdy11cCBhbmltYXRpb25cbiAgICAgICAgICAvLyBpc24ndCBhbGxvd2VkIHRvIGFuaW1hdGUgZnJvbSBoZXJlIHRoZW4gd2UgbmVlZCB0byBjbGVhciB0aGUgc3RhdGUgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgICAvLyBzbyB0aGF0IGFueSBmdXR1cmUgYW5pbWF0aW9ucyB3b24ndCByZWFkIHRoZSBleHBpcmVkIGFuaW1hdGlvbiBkYXRhLlxuICAgICAgICAgIGlmICghaXNWYWxpZEFuaW1hdGlvbikge1xuICAgICAgICAgICAgY2xlYXJFbGVtZW50QW5pbWF0aW9uU3RhdGUoZWxlbWVudCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcyBjb21iaW5lZCBtdWx0aXBsZSBjbGFzcyB0byBhZGRDbGFzcyAvIHJlbW92ZUNsYXNzIGludG8gYSBzZXRDbGFzcyBldmVudFxuICAgICAgICAvLyBzbyBsb25nIGFzIGEgc3RydWN0dXJhbCBldmVudCBkaWQgbm90IHRha2Ugb3ZlciB0aGUgYW5pbWF0aW9uXG4gICAgICAgIGV2ZW50ID0gIWFuaW1hdGlvbkRldGFpbHMuc3RydWN0dXJhbCAmJiBoYXNBbmltYXRpb25DbGFzc2VzKGFuaW1hdGlvbkRldGFpbHMub3B0aW9ucywgdHJ1ZSlcbiAgICAgICAgICAgID8gJ3NldENsYXNzJ1xuICAgICAgICAgICAgOiBhbmltYXRpb25EZXRhaWxzLmV2ZW50O1xuXG4gICAgICAgIG1hcmtFbGVtZW50QW5pbWF0aW9uU3RhdGUoZWxlbWVudCwgUlVOTklOR19TVEFURSk7XG4gICAgICAgIHZhciByZWFsUnVubmVyID0gJCRhbmltYXRpb24oZWxlbWVudCwgZXZlbnQsIGFuaW1hdGlvbkRldGFpbHMub3B0aW9ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICQkZm9yY2VSZWZsb3coKTtcbiAgICAgICAgICBibG9ja1RyYW5zaXRpb25zKGdldERvbU5vZGUoZSksIGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVhbFJ1bm5lci5kb25lKGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICAgIGNsb3NlKCFzdGF0dXMpO1xuICAgICAgICAgIHZhciBhbmltYXRpb25EZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMgJiYgYW5pbWF0aW9uRGV0YWlscy5jb3VudGVyID09PSBjb3VudGVyKSB7XG4gICAgICAgICAgICBjbGVhckVsZW1lbnRBbmltYXRpb25TdGF0ZShnZXREb21Ob2RlKGVsZW1lbnQpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbm90aWZ5UHJvZ3Jlc3MocnVubmVyLCBldmVudCwgJ2Nsb3NlJywge30pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGlzIHdpbGwgdXBkYXRlIHRoZSBydW5uZXIncyBmbG93LWNvbnRyb2wgZXZlbnRzIGJhc2VkIG9uXG4gICAgICAgIC8vIHRoZSBgcmVhbFJ1bm5lcmAgb2JqZWN0LlxuICAgICAgICBydW5uZXIuc2V0SG9zdChyZWFsUnVubmVyKTtcbiAgICAgICAgbm90aWZ5UHJvZ3Jlc3MocnVubmVyLCBldmVudCwgJ3N0YXJ0Jywge30pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBydW5uZXI7XG5cbiAgICAgIGZ1bmN0aW9uIG5vdGlmeVByb2dyZXNzKHJ1bm5lciwgZXZlbnQsIHBoYXNlLCBkYXRhKSB7XG4gICAgICAgIHRyaWdnZXJDYWxsYmFjayhldmVudCwgZWxlbWVudCwgcGhhc2UsIGRhdGEpO1xuICAgICAgICBydW5uZXIucHJvZ3Jlc3MoZXZlbnQsIHBoYXNlLCBkYXRhKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xvc2UocmVqZWN0KSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBjbGVhckdlbmVyYXRlZENsYXNzZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgICAgYXBwbHlBbmltYXRpb25TdHlsZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMuZG9tT3BlcmF0aW9uKCk7XG4gICAgICAgIHJ1bm5lci5jb21wbGV0ZSghcmVqZWN0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZUNoaWxkQW5pbWF0aW9ucyhlbGVtZW50KSB7XG4gICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ1snICsgTkdfQU5JTUFURV9BVFRSX05BTUUgKyAnXScpO1xuICAgICAgZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gcGFyc2VJbnQoY2hpbGQuZ2V0QXR0cmlidXRlKE5HX0FOSU1BVEVfQVRUUl9OQU1FKSk7XG4gICAgICAgIHZhciBhbmltYXRpb25EZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQoY2hpbGQpO1xuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgY2FzZSBSVU5OSU5HX1NUQVRFOlxuICAgICAgICAgICAgYW5pbWF0aW9uRGV0YWlscy5ydW5uZXIuZW5kKCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgY2FzZSBQUkVfRElHRVNUX1NUQVRFOlxuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICAgICAgYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5yZW1vdmUoY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsZWFyRWxlbWVudEFuaW1hdGlvblN0YXRlKGVsZW1lbnQpIHtcbiAgICAgIHZhciBub2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKE5HX0FOSU1BVEVfQVRUUl9OQU1FKTtcbiAgICAgIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAucmVtb3ZlKG5vZGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTWF0Y2hpbmdFbGVtZW50KG5vZGVPckVsbUEsIG5vZGVPckVsbUIpIHtcbiAgICAgIHJldHVybiBnZXREb21Ob2RlKG5vZGVPckVsbUEpID09PSBnZXREb21Ob2RlKG5vZGVPckVsbUIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFyZUFuaW1hdGlvbnNBbGxvd2VkKGVsZW1lbnQsIHBhcmVudEVsZW1lbnQsIGV2ZW50KSB7XG4gICAgICB2YXIgYm9keUVsZW1lbnREZXRlY3RlZCA9IGlzTWF0Y2hpbmdFbGVtZW50KGVsZW1lbnQsICQkYm9keSkgfHwgZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gJ0hUTUwnO1xuICAgICAgdmFyIHJvb3RFbGVtZW50RGV0ZWN0ZWQgPSBpc01hdGNoaW5nRWxlbWVudChlbGVtZW50LCAkcm9vdEVsZW1lbnQpO1xuICAgICAgdmFyIHBhcmVudEFuaW1hdGlvbkRldGVjdGVkID0gZmFsc2U7XG4gICAgICB2YXIgYW5pbWF0ZUNoaWxkcmVuO1xuXG4gICAgICB2YXIgcGFyZW50SG9zdCA9IGVsZW1lbnQuZGF0YShOR19BTklNQVRFX1BJTl9EQVRBKTtcbiAgICAgIGlmIChwYXJlbnRIb3N0KSB7XG4gICAgICAgIHBhcmVudEVsZW1lbnQgPSBwYXJlbnRIb3N0O1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAocGFyZW50RWxlbWVudCAmJiBwYXJlbnRFbGVtZW50Lmxlbmd0aCkge1xuICAgICAgICBpZiAoIXJvb3RFbGVtZW50RGV0ZWN0ZWQpIHtcbiAgICAgICAgICAvLyBhbmd1bGFyIGRvZXNuJ3Qgd2FudCB0byBhdHRlbXB0IHRvIGFuaW1hdGUgZWxlbWVudHMgb3V0c2lkZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAgICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCB0aGUgcm9vdEVsZW1lbnQgaXMgYW4gYW5jZXN0b3Igb2YgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAgICAgIHJvb3RFbGVtZW50RGV0ZWN0ZWQgPSBpc01hdGNoaW5nRWxlbWVudChwYXJlbnRFbGVtZW50LCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBwYXJlbnRFbGVtZW50WzBdO1xuICAgICAgICBpZiAocGFyZW50Tm9kZS5ub2RlVHlwZSAhPT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgLy8gbm8gcG9pbnQgaW4gaW5zcGVjdGluZyB0aGUgI2RvY3VtZW50IGVsZW1lbnRcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQocGFyZW50Tm9kZSkgfHwge307XG4gICAgICAgIC8vIGVpdGhlciBhbiBlbnRlciwgbGVhdmUgb3IgbW92ZSBhbmltYXRpb24gd2lsbCBjb21tZW5jZVxuICAgICAgICAvLyB0aGVyZWZvcmUgd2UgY2FuJ3QgYWxsb3cgYW55IGFuaW1hdGlvbnMgdG8gdGFrZSBwbGFjZVxuICAgICAgICAvLyBidXQgaWYgYSBwYXJlbnQgYW5pbWF0aW9uIGlzIGNsYXNzLWJhc2VkIHRoZW4gdGhhdCdzIG9rXG4gICAgICAgIGlmICghcGFyZW50QW5pbWF0aW9uRGV0ZWN0ZWQpIHtcbiAgICAgICAgICBwYXJlbnRBbmltYXRpb25EZXRlY3RlZCA9IGRldGFpbHMuc3RydWN0dXJhbCB8fCBkaXNhYmxlZEVsZW1lbnRzTG9va3VwLmdldChwYXJlbnROb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1VuZGVmaW5lZChhbmltYXRlQ2hpbGRyZW4pIHx8IGFuaW1hdGVDaGlsZHJlbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcmVudEVsZW1lbnQuZGF0YShOR19BTklNQVRFX0NISUxEUkVOX0RBVEEpO1xuICAgICAgICAgIGlmIChpc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICBhbmltYXRlQ2hpbGRyZW4gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIGNvbnRpbnVlIHRyYXZlcnNpbmcgYXQgdGhpcyBwb2ludFxuICAgICAgICBpZiAocGFyZW50QW5pbWF0aW9uRGV0ZWN0ZWQgJiYgYW5pbWF0ZUNoaWxkcmVuID09PSBmYWxzZSkgYnJlYWs7XG5cbiAgICAgICAgaWYgKCFyb290RWxlbWVudERldGVjdGVkKSB7XG4gICAgICAgICAgLy8gYW5ndWxhciBkb2Vzbid0IHdhbnQgdG8gYXR0ZW1wdCB0byBhbmltYXRlIGVsZW1lbnRzIG91dHNpZGUgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgLy8gdGhlcmVmb3JlIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIHJvb3RFbGVtZW50IGlzIGFuIGFuY2VzdG9yIG9mIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgICAgICByb290RWxlbWVudERldGVjdGVkID0gaXNNYXRjaGluZ0VsZW1lbnQocGFyZW50RWxlbWVudCwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICBpZiAoIXJvb3RFbGVtZW50RGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgIHBhcmVudEhvc3QgPSBwYXJlbnRFbGVtZW50LmRhdGEoTkdfQU5JTUFURV9QSU5fREFUQSk7XG4gICAgICAgICAgICBpZiAocGFyZW50SG9zdCkge1xuICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50ID0gcGFyZW50SG9zdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWJvZHlFbGVtZW50RGV0ZWN0ZWQpIHtcbiAgICAgICAgICAvLyB3ZSBhbHNvIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaXMgb3Igd2lsbCBiZSBhcGFydCBvZiB0aGUgYm9keSBlbGVtZW50XG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIGl0IGlzIHBvaW50bGVzcyB0byBldmVuIGlzc3VlIGFuIGFuaW1hdGlvbiB0byBiZSByZW5kZXJlZFxuICAgICAgICAgIGJvZHlFbGVtZW50RGV0ZWN0ZWQgPSBpc01hdGNoaW5nRWxlbWVudChwYXJlbnRFbGVtZW50LCAkJGJvZHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50KCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhbGxvd0FuaW1hdGlvbiA9ICFwYXJlbnRBbmltYXRpb25EZXRlY3RlZCB8fCBhbmltYXRlQ2hpbGRyZW47XG4gICAgICByZXR1cm4gYWxsb3dBbmltYXRpb24gJiYgcm9vdEVsZW1lbnREZXRlY3RlZCAmJiBib2R5RWxlbWVudERldGVjdGVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcmtFbGVtZW50QW5pbWF0aW9uU3RhdGUoZWxlbWVudCwgc3RhdGUsIGRldGFpbHMpIHtcbiAgICAgIGRldGFpbHMgPSBkZXRhaWxzIHx8IHt9O1xuICAgICAgZGV0YWlscy5zdGF0ZSA9IHN0YXRlO1xuXG4gICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICBub2RlLnNldEF0dHJpYnV0ZShOR19BTklNQVRFX0FUVFJfTkFNRSwgc3RhdGUpO1xuXG4gICAgICB2YXIgb2xkVmFsdWUgPSBhY3RpdmVBbmltYXRpb25zTG9va3VwLmdldChub2RlKTtcbiAgICAgIHZhciBuZXdWYWx1ZSA9IG9sZFZhbHVlXG4gICAgICAgICAgPyBleHRlbmQob2xkVmFsdWUsIGRldGFpbHMpXG4gICAgICAgICAgOiBkZXRhaWxzO1xuICAgICAgYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5wdXQobm9kZSwgbmV3VmFsdWUpO1xuICAgIH1cbiAgfV07XG59XTtcblxudmFyICQkckFGTXV0ZXhGYWN0b3J5ID0gWyckJHJBRicsIGZ1bmN0aW9uKCQkckFGKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGFzc2VkID0gZmFsc2U7XG4gICAgJCRyQUYoZnVuY3Rpb24oKSB7XG4gICAgICBwYXNzZWQgPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbihmbikge1xuICAgICAgcGFzc2VkID8gZm4oKSA6ICQkckFGKGZuKTtcbiAgICB9O1xuICB9O1xufV07XG5cbnZhciAkJEFuaW1hdGVSdW5uZXJGYWN0b3J5ID0gWyckcScsICckJHJBRk11dGV4JywgZnVuY3Rpb24oJHEsICQkckFGTXV0ZXgpIHtcbiAgdmFyIElOSVRJQUxfU1RBVEUgPSAwO1xuICB2YXIgRE9ORV9QRU5ESU5HX1NUQVRFID0gMTtcbiAgdmFyIERPTkVfQ09NUExFVEVfU1RBVEUgPSAyO1xuXG4gIEFuaW1hdGVSdW5uZXIuY2hhaW4gPSBmdW5jdGlvbihjaGFpbiwgY2FsbGJhY2spIHtcbiAgICB2YXIgaW5kZXggPSAwO1xuXG4gICAgbmV4dCgpO1xuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICBpZiAoaW5kZXggPT09IGNoYWluLmxlbmd0aCkge1xuICAgICAgICBjYWxsYmFjayh0cnVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjaGFpbltpbmRleF0oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlID09PSBmYWxzZSkge1xuICAgICAgICAgIGNhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgbmV4dCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIEFuaW1hdGVSdW5uZXIuYWxsID0gZnVuY3Rpb24ocnVubmVycywgY2FsbGJhY2spIHtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHZhciBzdGF0dXMgPSB0cnVlO1xuICAgIGZvckVhY2gocnVubmVycywgZnVuY3Rpb24ocnVubmVyKSB7XG4gICAgICBydW5uZXIuZG9uZShvblByb2dyZXNzKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG9uUHJvZ3Jlc3MocmVzcG9uc2UpIHtcbiAgICAgIHN0YXR1cyA9IHN0YXR1cyAmJiByZXNwb25zZTtcbiAgICAgIGlmICgrK2NvdW50ID09PSBydW5uZXJzLmxlbmd0aCkge1xuICAgICAgICBjYWxsYmFjayhzdGF0dXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBBbmltYXRlUnVubmVyKGhvc3QpIHtcbiAgICB0aGlzLnNldEhvc3QoaG9zdCk7XG5cbiAgICB0aGlzLl9kb25lQ2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5fcnVuSW5BbmltYXRpb25GcmFtZSA9ICQkckFGTXV0ZXgoKTtcbiAgICB0aGlzLl9zdGF0ZSA9IDA7XG4gIH1cblxuICBBbmltYXRlUnVubmVyLnByb3RvdHlwZSA9IHtcbiAgICBzZXRIb3N0OiBmdW5jdGlvbihob3N0KSB7XG4gICAgICB0aGlzLmhvc3QgPSBob3N0IHx8IHt9O1xuICAgIH0sXG5cbiAgICBkb25lOiBmdW5jdGlvbihmbikge1xuICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBET05FX0NPTVBMRVRFX1NUQVRFKSB7XG4gICAgICAgIGZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9kb25lQ2FsbGJhY2tzLnB1c2goZm4pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBwcm9ncmVzczogbm9vcCxcblxuICAgIGdldFByb21pc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnByb21pc2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLnByb21pc2UgPSAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICBzZWxmLmRvbmUoZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICBzdGF0dXMgPT09IGZhbHNlID8gcmVqZWN0KCkgOiByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgdGhlbjogZnVuY3Rpb24ocmVzb2x2ZUhhbmRsZXIsIHJlamVjdEhhbmRsZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFByb21pc2UoKS50aGVuKHJlc29sdmVIYW5kbGVyLCByZWplY3RIYW5kbGVyKTtcbiAgICB9LFxuXG4gICAgJ2NhdGNoJzogZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvbWlzZSgpWydjYXRjaCddKGhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICAnZmluYWxseSc6IGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFByb21pc2UoKVsnZmluYWxseSddKGhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICBwYXVzZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5ob3N0LnBhdXNlKSB7XG4gICAgICAgIHRoaXMuaG9zdC5wYXVzZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXN1bWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuaG9zdC5yZXN1bWUpIHtcbiAgICAgICAgdGhpcy5ob3N0LnJlc3VtZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuaG9zdC5lbmQpIHtcbiAgICAgICAgdGhpcy5ob3N0LmVuZCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcmVzb2x2ZSh0cnVlKTtcbiAgICB9LFxuXG4gICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmhvc3QuY2FuY2VsKSB7XG4gICAgICAgIHRoaXMuaG9zdC5jYW5jZWwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3Jlc29sdmUoZmFsc2UpO1xuICAgIH0sXG5cbiAgICBjb21wbGV0ZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIGlmIChzZWxmLl9zdGF0ZSA9PT0gSU5JVElBTF9TVEFURSkge1xuICAgICAgICBzZWxmLl9zdGF0ZSA9IERPTkVfUEVORElOR19TVEFURTtcbiAgICAgICAgc2VsZi5fcnVuSW5BbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLl9yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIF9yZXNvbHZlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgaWYgKHRoaXMuX3N0YXRlICE9PSBET05FX0NPTVBMRVRFX1NUQVRFKSB7XG4gICAgICAgIGZvckVhY2godGhpcy5fZG9uZUNhbGxiYWNrcywgZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICBmbihyZXNwb25zZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kb25lQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gRE9ORV9DT01QTEVURV9TVEFURTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEFuaW1hdGVSdW5uZXI7XG59XTtcblxudmFyICQkQW5pbWF0aW9uUHJvdmlkZXIgPSBbJyRhbmltYXRlUHJvdmlkZXInLCBmdW5jdGlvbigkYW5pbWF0ZVByb3ZpZGVyKSB7XG4gIHZhciBOR19BTklNQVRFX1JFRl9BVFRSID0gJ25nLWFuaW1hdGUtcmVmJztcblxuICB2YXIgZHJpdmVycyA9IHRoaXMuZHJpdmVycyA9IFtdO1xuXG4gIHZhciBSVU5ORVJfU1RPUkFHRV9LRVkgPSAnJCRhbmltYXRpb25SdW5uZXInO1xuXG4gIGZ1bmN0aW9uIHNldFJ1bm5lcihlbGVtZW50LCBydW5uZXIpIHtcbiAgICBlbGVtZW50LmRhdGEoUlVOTkVSX1NUT1JBR0VfS0VZLCBydW5uZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlUnVubmVyKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZURhdGEoUlVOTkVSX1NUT1JBR0VfS0VZKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJ1bm5lcihlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuZGF0YShSVU5ORVJfU1RPUkFHRV9LRVkpO1xuICB9XG5cbiAgdGhpcy4kZ2V0ID0gWyckJGpxTGl0ZScsICckcm9vdFNjb3BlJywgJyRpbmplY3RvcicsICckJEFuaW1hdGVSdW5uZXInLCAnJCRIYXNoTWFwJyxcbiAgICAgICBmdW5jdGlvbigkJGpxTGl0ZSwgICAkcm9vdFNjb3BlLCAgICRpbmplY3RvciwgICAkJEFuaW1hdGVSdW5uZXIsICAgJCRIYXNoTWFwKSB7XG5cbiAgICB2YXIgYW5pbWF0aW9uUXVldWUgPSBbXTtcbiAgICB2YXIgYXBwbHlBbmltYXRpb25DbGFzc2VzID0gYXBwbHlBbmltYXRpb25DbGFzc2VzRmFjdG9yeSgkJGpxTGl0ZSk7XG5cbiAgICBmdW5jdGlvbiBzb3J0QW5pbWF0aW9ucyhhbmltYXRpb25zKSB7XG4gICAgICB2YXIgdHJlZSA9IHsgY2hpbGRyZW46IFtdIH07XG4gICAgICB2YXIgaSwgbG9va3VwID0gbmV3ICQkSGFzaE1hcCgpO1xuXG4gICAgICAvLyB0aGlzIGlzIGRvbmUgZmlyc3QgYmVmb3JlaGFuZCBzbyB0aGF0IHRoZSBoYXNobWFwXG4gICAgICAvLyBpcyBmaWxsZWQgd2l0aCBhIGxpc3Qgb2YgdGhlIGVsZW1lbnRzIHRoYXQgd2lsbCBiZSBhbmltYXRlZFxuICAgICAgZm9yIChpID0gMDsgaSA8IGFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFuaW1hdGlvbiA9IGFuaW1hdGlvbnNbaV07XG4gICAgICAgIGxvb2t1cC5wdXQoYW5pbWF0aW9uLmRvbU5vZGUsIGFuaW1hdGlvbnNbaV0gPSB7XG4gICAgICAgICAgZG9tTm9kZTogYW5pbWF0aW9uLmRvbU5vZGUsXG4gICAgICAgICAgZm46IGFuaW1hdGlvbi5mbixcbiAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHByb2Nlc3NOb2RlKGFuaW1hdGlvbnNbaV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmxhdHRlbih0cmVlKTtcblxuICAgICAgZnVuY3Rpb24gcHJvY2Vzc05vZGUoZW50cnkpIHtcbiAgICAgICAgaWYgKGVudHJ5LnByb2Nlc3NlZCkgcmV0dXJuIGVudHJ5O1xuICAgICAgICBlbnRyeS5wcm9jZXNzZWQgPSB0cnVlO1xuXG4gICAgICAgIHZhciBlbGVtZW50Tm9kZSA9IGVudHJ5LmRvbU5vZGU7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gZWxlbWVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgbG9va3VwLnB1dChlbGVtZW50Tm9kZSwgZW50cnkpO1xuXG4gICAgICAgIHZhciBwYXJlbnRFbnRyeTtcbiAgICAgICAgd2hpbGUgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICBwYXJlbnRFbnRyeSA9IGxvb2t1cC5nZXQocGFyZW50Tm9kZSk7XG4gICAgICAgICAgaWYgKHBhcmVudEVudHJ5KSB7XG4gICAgICAgICAgICBpZiAoIXBhcmVudEVudHJ5LnByb2Nlc3NlZCkge1xuICAgICAgICAgICAgICBwYXJlbnRFbnRyeSA9IHByb2Nlc3NOb2RlKHBhcmVudEVudHJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgKHBhcmVudEVudHJ5IHx8IHRyZWUpLmNoaWxkcmVuLnB1c2goZW50cnkpO1xuICAgICAgICByZXR1cm4gZW50cnk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZsYXR0ZW4odHJlZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHF1ZXVlLnB1c2godHJlZS5jaGlsZHJlbltpXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVtYWluaW5nTGV2ZWxFbnRyaWVzID0gcXVldWUubGVuZ3RoO1xuICAgICAgICB2YXIgbmV4dExldmVsRW50cmllcyA9IDA7XG4gICAgICAgIHZhciByb3cgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgZW50cnkgPSBxdWV1ZVtpXTtcbiAgICAgICAgICBpZiAocmVtYWluaW5nTGV2ZWxFbnRyaWVzIDw9IDApIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ0xldmVsRW50cmllcyA9IG5leHRMZXZlbEVudHJpZXM7XG4gICAgICAgICAgICBuZXh0TGV2ZWxFbnRyaWVzID0gMDtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQocm93KTtcbiAgICAgICAgICAgIHJvdyA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByb3cucHVzaChlbnRyeS5mbik7XG4gICAgICAgICAgZm9yRWFjaChlbnRyeS5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGRFbnRyeSkge1xuICAgICAgICAgICAgbmV4dExldmVsRW50cmllcysrO1xuICAgICAgICAgICAgcXVldWUucHVzaChjaGlsZEVudHJ5KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZW1haW5pbmdMZXZlbEVudHJpZXMtLTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3cubGVuZ3RoKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChyb3cpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETyhtYXRza28pOiBkb2N1bWVudCB0aGUgc2lnbmF0dXJlIGluIGEgYmV0dGVyIHdheVxuICAgIHJldHVybiBmdW5jdGlvbihlbGVtZW50LCBldmVudCwgb3B0aW9ucywgb25CZWZvcmVDbGFzc2VzQXBwbGllZENiKSB7XG4gICAgICBvcHRpb25zID0gcHJlcGFyZUFuaW1hdGlvbk9wdGlvbnMob3B0aW9ucyk7XG4gICAgICB2YXIgaXNTdHJ1Y3R1cmFsID0gWydlbnRlcicsICdtb3ZlJywgJ2xlYXZlJ10uaW5kZXhPZihldmVudCkgPj0gMDtcblxuICAgICAgLy8gdGhlcmUgaXMgbm8gYW5pbWF0aW9uIGF0IHRoZSBjdXJyZW50IG1vbWVudCwgaG93ZXZlclxuICAgICAgLy8gdGhlc2UgcnVubmVyIG1ldGhvZHMgd2lsbCBnZXQgbGF0ZXIgdXBkYXRlZCB3aXRoIHRoZVxuICAgICAgLy8gbWV0aG9kcyBsZWFkaW5nIGludG8gdGhlIGRyaXZlcidzIGVuZC9jYW5jZWwgbWV0aG9kc1xuICAgICAgLy8gZm9yIG5vdyB0aGV5IGp1c3Qgc3RvcCB0aGUgYW5pbWF0aW9uIGZyb20gc3RhcnRpbmdcbiAgICAgIHZhciBydW5uZXIgPSBuZXcgJCRBbmltYXRlUnVubmVyKHtcbiAgICAgICAgZW5kOiBmdW5jdGlvbigpIHsgY2xvc2UoKTsgfSxcbiAgICAgICAgY2FuY2VsOiBmdW5jdGlvbigpIHsgY2xvc2UodHJ1ZSk7IH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIWRyaXZlcnMubGVuZ3RoKSB7XG4gICAgICAgIGNsb3NlKCk7XG4gICAgICAgIHJldHVybiBydW5uZXI7XG4gICAgICB9XG5cbiAgICAgIHNldFJ1bm5lcihlbGVtZW50LCBydW5uZXIpO1xuXG4gICAgICB2YXIgY2xhc3NlcyA9IG1lcmdlQ2xhc3NlcyhlbGVtZW50LmF0dHIoJ2NsYXNzJyksIG1lcmdlQ2xhc3NlcyhvcHRpb25zLmFkZENsYXNzLCBvcHRpb25zLnJlbW92ZUNsYXNzKSk7XG4gICAgICB2YXIgdGVtcENsYXNzZXMgPSBvcHRpb25zLnRlbXBDbGFzc2VzO1xuICAgICAgaWYgKHRlbXBDbGFzc2VzKSB7XG4gICAgICAgIGNsYXNzZXMgKz0gJyAnICsgdGVtcENsYXNzZXM7XG4gICAgICAgIG9wdGlvbnMudGVtcENsYXNzZXMgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhbmltYXRpb25RdWV1ZS5wdXNoKHtcbiAgICAgICAgLy8gdGhpcyBkYXRhIGlzIHVzZWQgYnkgdGhlIHBvc3REaWdlc3QgY29kZSBhbmQgcGFzc2VkIGludG9cbiAgICAgICAgLy8gdGhlIGRyaXZlciBzdGVwIGZ1bmN0aW9uXG4gICAgICAgIGVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgICAgIGNsYXNzZXM6IGNsYXNzZXMsXG4gICAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgICAgc3RydWN0dXJhbDogaXNTdHJ1Y3R1cmFsLFxuICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICBiZWZvcmVTdGFydDogYmVmb3JlU3RhcnQsXG4gICAgICAgIGNsb3NlOiBjbG9zZVxuICAgICAgfSk7XG5cbiAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgaGFuZGxlRGVzdHJveWVkRWxlbWVudCk7XG5cbiAgICAgIC8vIHdlIG9ubHkgd2FudCB0aGVyZSB0byBiZSBvbmUgZnVuY3Rpb24gY2FsbGVkIHdpdGhpbiB0aGUgcG9zdCBkaWdlc3RcbiAgICAgIC8vIGJsb2NrLiBUaGlzIHdheSB3ZSBjYW4gZ3JvdXAgYW5pbWF0aW9ucyBmb3IgYWxsIHRoZSBhbmltYXRpb25zIHRoYXRcbiAgICAgIC8vIHdlcmUgYXBhcnQgb2YgdGhlIHNhbWUgcG9zdERpZ2VzdCBmbHVzaCBjYWxsLlxuICAgICAgaWYgKGFuaW1hdGlvblF1ZXVlLmxlbmd0aCA+IDEpIHJldHVybiBydW5uZXI7XG5cbiAgICAgICRyb290U2NvcGUuJCRwb3N0RGlnZXN0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYW5pbWF0aW9ucyA9IFtdO1xuICAgICAgICBmb3JFYWNoKGFuaW1hdGlvblF1ZXVlLCBmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IHdhcyBkZXN0cm95ZWQgZWFybHkgb24gd2hpY2ggcmVtb3ZlZCB0aGUgcnVubmVyXG4gICAgICAgICAgLy8gZm9ybSBpdHMgc3RvcmFnZS4gVGhpcyBtZWFucyB3ZSBjYW4ndCBhbmltYXRlIHRoaXMgZWxlbWVudFxuICAgICAgICAgIC8vIGF0IGFsbCBhbmQgaXQgYWxyZWFkeSBoYXMgYmVlbiBjbG9zZWQgZHVlIHRvIGRlc3RydWN0aW9uLlxuICAgICAgICAgIHZhciBlbG0gPSBlbnRyeS5lbGVtZW50O1xuICAgICAgICAgIGlmIChnZXRSdW5uZXIoZWxtKSAmJiBnZXREb21Ob2RlKGVsbSkucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgYW5pbWF0aW9ucy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW50cnkuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIG5vdyBhbnkgZnV0dXJlIGFuaW1hdGlvbnMgd2lsbCBiZSBpbiBhbm90aGVyIHBvc3REaWdlc3RcbiAgICAgICAgYW5pbWF0aW9uUXVldWUubGVuZ3RoID0gMDtcblxuICAgICAgICB2YXIgZ3JvdXBlZEFuaW1hdGlvbnMgPSBncm91cEFuaW1hdGlvbnMoYW5pbWF0aW9ucyk7XG4gICAgICAgIHZhciB0b0JlU29ydGVkQW5pbWF0aW9ucyA9IFtdO1xuXG4gICAgICAgIGZvckVhY2goZ3JvdXBlZEFuaW1hdGlvbnMsIGZ1bmN0aW9uKGFuaW1hdGlvbkVudHJ5KSB7XG4gICAgICAgICAgdG9CZVNvcnRlZEFuaW1hdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBkb21Ob2RlOiBnZXREb21Ob2RlKGFuaW1hdGlvbkVudHJ5LmZyb20gPyBhbmltYXRpb25FbnRyeS5mcm9tLmVsZW1lbnQgOiBhbmltYXRpb25FbnRyeS5lbGVtZW50KSxcbiAgICAgICAgICAgIGZuOiBmdW5jdGlvbiB0cmlnZ2VyQW5pbWF0aW9uU3RhcnQoKSB7XG4gICAgICAgICAgICAgIC8vIGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgYXBwbHkgdGhlIGBuZy1hbmltYXRlYCBDU1MgY2xhc3MgYW5kIHRoZVxuICAgICAgICAgICAgICAvLyB0ZW1wb3JhcnkgY2xhc3NlcyBiZWZvcmUgd2UgZG8gYW55IGRyaXZlciBpbnZva2luZyBzaW5jZSB0aGVzZVxuICAgICAgICAgICAgICAvLyBDU1MgY2xhc3NlcyBtYXkgYmUgcmVxdWlyZWQgZm9yIHByb3BlciBDU1MgZGV0ZWN0aW9uLlxuICAgICAgICAgICAgICBhbmltYXRpb25FbnRyeS5iZWZvcmVTdGFydCgpO1xuXG4gICAgICAgICAgICAgIHZhciBzdGFydEFuaW1hdGlvbkZuLCBjbG9zZUZuID0gYW5pbWF0aW9uRW50cnkuY2xvc2U7XG5cbiAgICAgICAgICAgICAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlIGVsZW1lbnQgd2FzIHJlbW92ZWQgYmVmb3JlIHRoZSBkaWdlc3QgcnVucyBvclxuICAgICAgICAgICAgICAvLyBkdXJpbmcgdGhlIFJBRiBzZXF1ZW5jaW5nIHRoZW4gd2Ugc2hvdWxkIG5vdCB0cmlnZ2VyIHRoZSBhbmltYXRpb24uXG4gICAgICAgICAgICAgIHZhciB0YXJnZXRFbGVtZW50ID0gYW5pbWF0aW9uRW50cnkuYW5jaG9yc1xuICAgICAgICAgICAgICAgICAgPyAoYW5pbWF0aW9uRW50cnkuZnJvbS5lbGVtZW50IHx8IGFuaW1hdGlvbkVudHJ5LnRvLmVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICA6IGFuaW1hdGlvbkVudHJ5LmVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgaWYgKGdldFJ1bm5lcih0YXJnZXRFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHZhciBvcGVyYXRpb24gPSBpbnZva2VGaXJzdERyaXZlcihhbmltYXRpb25FbnRyeSwgb25CZWZvcmVDbGFzc2VzQXBwbGllZENiKTtcbiAgICAgICAgICAgICAgICBpZiAob3BlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICBzdGFydEFuaW1hdGlvbkZuID0gb3BlcmF0aW9uLnN0YXJ0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICghc3RhcnRBbmltYXRpb25Gbikge1xuICAgICAgICAgICAgICAgIGNsb3NlRm4oKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uUnVubmVyID0gc3RhcnRBbmltYXRpb25GbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lci5kb25lKGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgY2xvc2VGbighc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB1cGRhdGVBbmltYXRpb25SdW5uZXJzKGFuaW1hdGlvbkVudHJ5LCBhbmltYXRpb25SdW5uZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc29ydCBlYWNoIG9mIHRoZSBhbmltYXRpb25zIGluIG9yZGVyIG9mIHBhcmVudCB0byBjaGlsZFxuICAgICAgICAvLyByZWxhdGlvbnNoaXBzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgcGFyZW50IHRvIGNoaWxkIGNsYXNzZXMgYXJlXG4gICAgICAgIC8vIGFwcGxpZWQgYXQgdGhlIHJpZ2h0IHRpbWUuXG4gICAgICAgIGZvckVhY2goc29ydEFuaW1hdGlvbnModG9CZVNvcnRlZEFuaW1hdGlvbnMpLCBmdW5jdGlvbih0cmlnZ2VyQW5pbWF0aW9uKSB7XG4gICAgICAgICAgdHJpZ2dlckFuaW1hdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcnVubmVyO1xuXG4gICAgICAvLyBUT0RPKG1hdHNrbyk6IGNoYW5nZSB0byByZWZlcmVuY2Ugbm9kZXNcbiAgICAgIGZ1bmN0aW9uIGdldEFuY2hvck5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIFNFTEVDVE9SID0gJ1snICsgTkdfQU5JTUFURV9SRUZfQVRUUiArICddJztcbiAgICAgICAgdmFyIGl0ZW1zID0gbm9kZS5oYXNBdHRyaWJ1dGUoTkdfQU5JTUFURV9SRUZfQVRUUilcbiAgICAgICAgICAgICAgPyBbbm9kZV1cbiAgICAgICAgICAgICAgOiBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1IpO1xuICAgICAgICB2YXIgYW5jaG9ycyA9IFtdO1xuICAgICAgICBmb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIGF0dHIgPSBub2RlLmdldEF0dHJpYnV0ZShOR19BTklNQVRFX1JFRl9BVFRSKTtcbiAgICAgICAgICBpZiAoYXR0ciAmJiBhdHRyLmxlbmd0aCkge1xuICAgICAgICAgICAgYW5jaG9ycy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhbmNob3JzO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBncm91cEFuaW1hdGlvbnMoYW5pbWF0aW9ucykge1xuICAgICAgICB2YXIgcHJlcGFyZWRBbmltYXRpb25zID0gW107XG4gICAgICAgIHZhciByZWZMb29rdXAgPSB7fTtcbiAgICAgICAgZm9yRWFjaChhbmltYXRpb25zLCBmdW5jdGlvbihhbmltYXRpb24sIGluZGV4KSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSBhbmltYXRpb24uZWxlbWVudDtcbiAgICAgICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gYW5pbWF0aW9uLmV2ZW50O1xuICAgICAgICAgIHZhciBlbnRlck9yTW92ZSA9IFsnZW50ZXInLCAnbW92ZSddLmluZGV4T2YoZXZlbnQpID49IDA7XG4gICAgICAgICAgdmFyIGFuY2hvck5vZGVzID0gYW5pbWF0aW9uLnN0cnVjdHVyYWwgPyBnZXRBbmNob3JOb2Rlcyhub2RlKSA6IFtdO1xuXG4gICAgICAgICAgaWYgKGFuY2hvck5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGVudGVyT3JNb3ZlID8gJ3RvJyA6ICdmcm9tJztcblxuICAgICAgICAgICAgZm9yRWFjaChhbmNob3JOb2RlcywgZnVuY3Rpb24oYW5jaG9yKSB7XG4gICAgICAgICAgICAgIHZhciBrZXkgPSBhbmNob3IuZ2V0QXR0cmlidXRlKE5HX0FOSU1BVEVfUkVGX0FUVFIpO1xuICAgICAgICAgICAgICByZWZMb29rdXBba2V5XSA9IHJlZkxvb2t1cFtrZXldIHx8IHt9O1xuICAgICAgICAgICAgICByZWZMb29rdXBba2V5XVtkaXJlY3Rpb25dID0ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbklEOiBpbmRleCxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBqcUxpdGUoYW5jaG9yKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXBhcmVkQW5pbWF0aW9ucy5wdXNoKGFuaW1hdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdXNlZEluZGljZXNMb29rdXAgPSB7fTtcbiAgICAgICAgdmFyIGFuY2hvckdyb3VwcyA9IHt9O1xuICAgICAgICBmb3JFYWNoKHJlZkxvb2t1cCwgZnVuY3Rpb24ob3BlcmF0aW9ucywga2V5KSB7XG4gICAgICAgICAgdmFyIGZyb20gPSBvcGVyYXRpb25zLmZyb207XG4gICAgICAgICAgdmFyIHRvID0gb3BlcmF0aW9ucy50bztcblxuICAgICAgICAgIGlmICghZnJvbSB8fCAhdG8pIHtcbiAgICAgICAgICAgIC8vIG9ubHkgb25lIG9mIHRoZXNlIGlzIHNldCB0aGVyZWZvcmUgd2UgY2FuJ3QgaGF2ZSBhblxuICAgICAgICAgICAgLy8gYW5jaG9yIGFuaW1hdGlvbiBzaW5jZSBhbGwgdGhyZWUgcGllY2VzIGFyZSByZXF1aXJlZFxuICAgICAgICAgICAgdmFyIGluZGV4ID0gZnJvbSA/IGZyb20uYW5pbWF0aW9uSUQgOiB0by5hbmltYXRpb25JRDtcbiAgICAgICAgICAgIHZhciBpbmRleEtleSA9IGluZGV4LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBpZiAoIXVzZWRJbmRpY2VzTG9va3VwW2luZGV4S2V5XSkge1xuICAgICAgICAgICAgICB1c2VkSW5kaWNlc0xvb2t1cFtpbmRleEtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBwcmVwYXJlZEFuaW1hdGlvbnMucHVzaChhbmltYXRpb25zW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGZyb21BbmltYXRpb24gPSBhbmltYXRpb25zW2Zyb20uYW5pbWF0aW9uSURdO1xuICAgICAgICAgIHZhciB0b0FuaW1hdGlvbiA9IGFuaW1hdGlvbnNbdG8uYW5pbWF0aW9uSURdO1xuICAgICAgICAgIHZhciBsb29rdXBLZXkgPSBmcm9tLmFuaW1hdGlvbklELnRvU3RyaW5nKCk7XG4gICAgICAgICAgaWYgKCFhbmNob3JHcm91cHNbbG9va3VwS2V5XSkge1xuICAgICAgICAgICAgdmFyIGdyb3VwID0gYW5jaG9yR3JvdXBzW2xvb2t1cEtleV0gPSB7XG4gICAgICAgICAgICAgIC8vIFRPRE8obWF0c2tvKTogZG91YmxlLWNoZWNrIHRoaXMgY29kZVxuICAgICAgICAgICAgICBiZWZvcmVTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZnJvbUFuaW1hdGlvbi5iZWZvcmVTdGFydCgpO1xuICAgICAgICAgICAgICAgIHRvQW5pbWF0aW9uLmJlZm9yZVN0YXJ0KCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmcm9tQW5pbWF0aW9uLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdG9BbmltYXRpb24uY2xvc2UoKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2xhc3NlczogY3NzQ2xhc3Nlc0ludGVyc2VjdGlvbihmcm9tQW5pbWF0aW9uLmNsYXNzZXMsIHRvQW5pbWF0aW9uLmNsYXNzZXMpLFxuICAgICAgICAgICAgICBmcm9tOiBmcm9tQW5pbWF0aW9uLFxuICAgICAgICAgICAgICB0bzogdG9BbmltYXRpb24sXG4gICAgICAgICAgICAgIGFuY2hvcnM6IFtdIC8vIFRPRE8obWF0c2tvKTogY2hhbmdlIHRvIHJlZmVyZW5jZSBub2Rlc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gdGhlIGFuY2hvciBhbmltYXRpb25zIHJlcXVpcmUgdGhhdCB0aGUgZnJvbSBhbmQgdG8gZWxlbWVudHMgYm90aCBoYXZlIGF0IGxlYXN0XG4gICAgICAgICAgICAvLyBvbmUgc2hhcmVkIENTUyBjbGFzcyB3aGljaCBlZmZpY3RpdmVseSBtYXJyaWVzIHRoZSB0d28gZWxlbWVudHMgdG9nZXRoZXIgdG8gdXNlXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBhbmltYXRpb24gZHJpdmVyIGFuZCB0byBwcm9wZXJseSBzZXF1ZW5jZSB0aGUgYW5jaG9yIGFuaW1hdGlvbi5cbiAgICAgICAgICAgIGlmIChncm91cC5jbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBwcmVwYXJlZEFuaW1hdGlvbnMucHVzaChncm91cCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwcmVwYXJlZEFuaW1hdGlvbnMucHVzaChmcm9tQW5pbWF0aW9uKTtcbiAgICAgICAgICAgICAgcHJlcGFyZWRBbmltYXRpb25zLnB1c2godG9BbmltYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGFuY2hvckdyb3Vwc1tsb29rdXBLZXldLmFuY2hvcnMucHVzaCh7XG4gICAgICAgICAgICAnb3V0JzogZnJvbS5lbGVtZW50LCAnaW4nOiB0by5lbGVtZW50XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwcmVwYXJlZEFuaW1hdGlvbnM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNzc0NsYXNzZXNJbnRlcnNlY3Rpb24oYSxiKSB7XG4gICAgICAgIGEgPSBhLnNwbGl0KCcgJyk7XG4gICAgICAgIGIgPSBiLnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBtYXRjaGVzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGFhID0gYVtpXTtcbiAgICAgICAgICBpZiAoYWEuc3Vic3RyaW5nKDAsMykgPT09ICduZy0nKSBjb250aW51ZTtcblxuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGFhID09PSBiW2pdKSB7XG4gICAgICAgICAgICAgIG1hdGNoZXMucHVzaChhYSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXRjaGVzLmpvaW4oJyAnKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaW52b2tlRmlyc3REcml2ZXIoYW5pbWF0aW9uRGV0YWlscywgb25CZWZvcmVDbGFzc2VzQXBwbGllZENiKSB7XG4gICAgICAgIC8vIHdlIGxvb3AgaW4gcmV2ZXJzZSBvcmRlciBzaW5jZSB0aGUgbW9yZSBnZW5lcmFsIGRyaXZlcnMgKGxpa2UgQ1NTIGFuZCBKUylcbiAgICAgICAgLy8gbWF5IGF0dGVtcHQgbW9yZSBlbGVtZW50cywgYnV0IGN1c3RvbSBkcml2ZXJzIGFyZSBtb3JlIHBhcnRpY3VsYXJcbiAgICAgICAgZm9yICh2YXIgaSA9IGRyaXZlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB2YXIgZHJpdmVyTmFtZSA9IGRyaXZlcnNbaV07XG4gICAgICAgICAgaWYgKCEkaW5qZWN0b3IuaGFzKGRyaXZlck5hbWUpKSBjb250aW51ZTsgLy8gVE9ETyhtYXRza28pOiByZW1vdmUgdGhpcyBjaGVja1xuXG4gICAgICAgICAgdmFyIGZhY3RvcnkgPSAkaW5qZWN0b3IuZ2V0KGRyaXZlck5hbWUpO1xuICAgICAgICAgIHZhciBkcml2ZXIgPSBmYWN0b3J5KGFuaW1hdGlvbkRldGFpbHMsIG9uQmVmb3JlQ2xhc3Nlc0FwcGxpZWRDYik7XG4gICAgICAgICAgaWYgKGRyaXZlcikge1xuICAgICAgICAgICAgcmV0dXJuIGRyaXZlcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYmVmb3JlU3RhcnQoKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoTkdfQU5JTUFURV9DTEFTU05BTUUpO1xuICAgICAgICBpZiAodGVtcENsYXNzZXMpIHtcbiAgICAgICAgICAkJGpxTGl0ZS5hZGRDbGFzcyhlbGVtZW50LCB0ZW1wQ2xhc3Nlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlQW5pbWF0aW9uUnVubmVycyhhbmltYXRpb24sIG5ld1J1bm5lcikge1xuICAgICAgICBpZiAoYW5pbWF0aW9uLmZyb20gJiYgYW5pbWF0aW9uLnRvKSB7XG4gICAgICAgICAgdXBkYXRlKGFuaW1hdGlvbi5mcm9tLmVsZW1lbnQpO1xuICAgICAgICAgIHVwZGF0ZShhbmltYXRpb24udG8uZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlKGFuaW1hdGlvbi5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZShlbGVtZW50KSB7XG4gICAgICAgICAgZ2V0UnVubmVyKGVsZW1lbnQpLnNldEhvc3QobmV3UnVubmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVEZXN0cm95ZWRFbGVtZW50KCkge1xuICAgICAgICB2YXIgcnVubmVyID0gZ2V0UnVubmVyKGVsZW1lbnQpO1xuICAgICAgICBpZiAocnVubmVyICYmIChldmVudCAhPT0gJ2xlYXZlJyB8fCAhb3B0aW9ucy4kJGRvbU9wZXJhdGlvbkZpcmVkKSkge1xuICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbG9zZShyZWplY3RlZCkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgZWxlbWVudC5vZmYoJyRkZXN0cm95JywgaGFuZGxlRGVzdHJveWVkRWxlbWVudCk7XG4gICAgICAgIHJlbW92ZVJ1bm5lcihlbGVtZW50KTtcblxuICAgICAgICBhcHBseUFuaW1hdGlvbkNsYXNzZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLmRvbU9wZXJhdGlvbigpO1xuXG4gICAgICAgIGlmICh0ZW1wQ2xhc3Nlcykge1xuICAgICAgICAgICQkanFMaXRlLnJlbW92ZUNsYXNzKGVsZW1lbnQsIHRlbXBDbGFzc2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoTkdfQU5JTUFURV9DTEFTU05BTUUpO1xuICAgICAgICBydW5uZXIuY29tcGxldGUoIXJlamVjdGVkKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XTtcbn1dO1xuXG4vKiBnbG9iYWwgYW5ndWxhckFuaW1hdGVNb2R1bGU6IHRydWUsXG5cbiAgICQkQm9keVByb3ZpZGVyLFxuICAgJCRyQUZNdXRleEZhY3RvcnksXG4gICAkJEFuaW1hdGVDaGlsZHJlbkRpcmVjdGl2ZSxcbiAgICQkQW5pbWF0ZVJ1bm5lckZhY3RvcnksXG4gICAkJEFuaW1hdGVRdWV1ZVByb3ZpZGVyLFxuICAgJCRBbmltYXRpb25Qcm92aWRlcixcbiAgICRBbmltYXRlQ3NzUHJvdmlkZXIsXG4gICAkJEFuaW1hdGVDc3NEcml2ZXJQcm92aWRlcixcbiAgICQkQW5pbWF0ZUpzUHJvdmlkZXIsXG4gICAkJEFuaW1hdGVKc0RyaXZlclByb3ZpZGVyLFxuKi9cblxuLyoqXG4gKiBAbmdkb2MgbW9kdWxlXG4gKiBAbmFtZSBuZ0FuaW1hdGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoZSBgbmdBbmltYXRlYCBtb2R1bGUgcHJvdmlkZXMgc3VwcG9ydCBmb3IgQ1NTLWJhc2VkIGFuaW1hdGlvbnMgKGtleWZyYW1lcyBhbmQgdHJhbnNpdGlvbnMpIGFzIHdlbGwgYXMgSmF2YVNjcmlwdC1iYXNlZCBhbmltYXRpb25zIHZpYVxuICogY2FsbGJhY2sgaG9va3MuIEFuaW1hdGlvbnMgYXJlIG5vdCBlbmFibGVkIGJ5IGRlZmF1bHQsIGhvd2V2ZXIsIGJ5IGluY2x1ZGluZyBgbmdBbmltYXRlYCB0aGVuIHRoZSBhbmltYXRpb24gaG9va3MgYXJlIGVuYWJsZWQgZm9yIGFuIEFuZ3VsYXIgYXBwLlxuICpcbiAqIDxkaXYgZG9jLW1vZHVsZS1jb21wb25lbnRzPVwibmdBbmltYXRlXCI+PC9kaXY+XG4gKlxuICogIyBVc2FnZVxuICogU2ltcGx5IHB1dCwgdGhlcmUgYXJlIHR3byB3YXlzIHRvIG1ha2UgdXNlIG9mIGFuaW1hdGlvbnMgd2hlbiBuZ0FuaW1hdGUgaXMgdXNlZDogYnkgdXNpbmcgKipDU1MqKiBhbmQgKipKYXZhU2NyaXB0KiouIFRoZSBmb3JtZXIgd29ya3MgcHVyZWx5IGJhc2VkXG4gKiB1c2luZyBDU1MgKGJ5IHVzaW5nIG1hdGNoaW5nIENTUyBzZWxlY3RvcnMvc3R5bGVzKSBhbmQgdGhlIGxhdHRlciB0cmlnZ2VycyBhbmltYXRpb25zIHRoYXQgYXJlIHJlZ2lzdGVyZWQgdmlhIGBtb2R1bGUuYW5pbWF0aW9uKClgLiBGb3JcbiAqIGJvdGggQ1NTIGFuZCBKUyBhbmltYXRpb25zIHRoZSBzb2xlIHJlcXVpcmVtZW50IGlzIHRvIGhhdmUgYSBtYXRjaGluZyBgQ1NTIGNsYXNzYCB0aGF0IGV4aXN0cyBib3RoIGluIHRoZSByZWdpc3RlcmVkIGFuaW1hdGlvbiBhbmQgd2l0aGluXG4gKiB0aGUgSFRNTCBlbGVtZW50IHRoYXQgdGhlIGFuaW1hdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBvbi5cbiAqXG4gKiAjIyBEaXJlY3RpdmUgU3VwcG9ydFxuICogVGhlIGZvbGxvd2luZyBkaXJlY3RpdmVzIGFyZSBcImFuaW1hdGlvbiBhd2FyZVwiOlxuICpcbiAqIHwgRGlyZWN0aXZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBTdXBwb3J0ZWQgQW5pbWF0aW9ucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gKiB8IHtAbGluayBuZy5kaXJlY3RpdmU6bmdSZXBlYXQjYW5pbWF0aW9ucyBuZ1JlcGVhdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgZW50ZXIsIGxlYXZlIGFuZCBtb3ZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwge0BsaW5rIG5nUm91dGUuZGlyZWN0aXZlOm5nVmlldyNhbmltYXRpb25zIG5nVmlld30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBlbnRlciBhbmQgbGVhdmUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nSW5jbHVkZSNhbmltYXRpb25zIG5nSW5jbHVkZX0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGVudGVyIGFuZCBsZWF2ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBuZy5kaXJlY3RpdmU6bmdTd2l0Y2gjYW5pbWF0aW9ucyBuZ1N3aXRjaH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgZW50ZXIgYW5kIGxlYXZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwge0BsaW5rIG5nLmRpcmVjdGl2ZTpuZ0lmI2FuaW1hdGlvbnMgbmdJZn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBlbnRlciBhbmQgbGVhdmUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nQ2xhc3MjYW5pbWF0aW9ucyBuZ0NsYXNzfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGFkZCBhbmQgcmVtb3ZlICh0aGUgQ1NTIGNsYXNzKGVzKSBwcmVzZW50KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBuZy5kaXJlY3RpdmU6bmdTaG93I2FuaW1hdGlvbnMgbmdTaG93fSAmIHtAbGluayBuZy5kaXJlY3RpdmU6bmdIaWRlI2FuaW1hdGlvbnMgbmdIaWRlfSAgICAgICAgICAgIHwgYWRkIGFuZCByZW1vdmUgKHRoZSBuZy1oaWRlIGNsYXNzIHZhbHVlKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwge0BsaW5rIG5nLmRpcmVjdGl2ZTpmb3JtI2FuaW1hdGlvbi1ob29rcyBmb3JtfSAmIHtAbGluayBuZy5kaXJlY3RpdmU6bmdNb2RlbCNhbmltYXRpb24taG9va3MgbmdNb2RlbH0gICAgfCBhZGQgYW5kIHJlbW92ZSAoZGlydHksIHByaXN0aW5lLCB2YWxpZCwgaW52YWxpZCAmIGFsbCBvdGhlciB2YWxpZGF0aW9ucykgfFxuICogfCB7QGxpbmsgbW9kdWxlOm5nTWVzc2FnZXMjYW5pbWF0aW9ucyBuZ01lc3NhZ2VzfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGFkZCBhbmQgcmVtb3ZlIChuZy1hY3RpdmUgJiBuZy1pbmFjdGl2ZSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBtb2R1bGU6bmdNZXNzYWdlcyNhbmltYXRpb25zIG5nTWVzc2FnZX0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgZW50ZXIgYW5kIGxlYXZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqXG4gKiAoTW9yZSBpbmZvcm1hdGlvbiBjYW4gYmUgZm91bmQgYnkgdmlzaXRpbmcgZWFjaCB0aGUgZG9jdW1lbnRhdGlvbiBhc3NvY2lhdGVkIHdpdGggZWFjaCBkaXJlY3RpdmUuKVxuICpcbiAqICMjIENTUy1iYXNlZCBBbmltYXRpb25zXG4gKlxuICogQ1NTLWJhc2VkIGFuaW1hdGlvbnMgd2l0aCBuZ0FuaW1hdGUgYXJlIHVuaXF1ZSBzaW5jZSB0aGV5IHJlcXVpcmUgbm8gSmF2YVNjcmlwdCBjb2RlIGF0IGFsbC4gQnkgdXNpbmcgYSBDU1MgY2xhc3MgdGhhdCB3ZSByZWZlcmVuY2UgYmV0d2VlbiBvdXIgSFRNTFxuICogYW5kIENTUyBjb2RlIHdlIGNhbiBjcmVhdGUgYW4gYW5pbWF0aW9uIHRoYXQgd2lsbCBiZSBwaWNrZWQgdXAgYnkgQW5ndWxhciB3aGVuIGFuIHRoZSB1bmRlcmx5aW5nIGRpcmVjdGl2ZSBwZXJmb3JtcyBhbiBvcGVyYXRpb24uXG4gKlxuICogVGhlIGV4YW1wbGUgYmVsb3cgc2hvd3MgaG93IGFuIGBlbnRlcmAgYW5pbWF0aW9uIGNhbiBiZSBtYWRlIHBvc3NpYmxlIG9uIGEgZWxlbWVudCB1c2luZyBgbmctaWZgOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgbmctaWY9XCJib29sXCIgY2xhc3M9XCJmYWRlXCI+XG4gKiAgICBGYWRlIG1lIGluIG91dFxuICogPC9kaXY+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwiYm9vbD10cnVlXCI+RmFkZSBJbiE8L2J1dHRvbj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJib29sPWZhbHNlXCI+RmFkZSBPdXQhPC9idXR0b24+XG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UgdGhlIENTUyBjbGFzcyAqKmZhZGUqKj8gV2UgY2FuIG5vdyBjcmVhdGUgdGhlIENTUyB0cmFuc2l0aW9uIGNvZGUgdGhhdCByZWZlcmVuY2VzIHRoaXMgY2xhc3M6XG4gKlxuICogYGBgY3NzXG4gKiAvJiM0MjsgVGhlIHN0YXJ0aW5nIENTUyBzdHlsZXMgZm9yIHRoZSBlbnRlciBhbmltYXRpb24gJiM0MjsvXG4gKiAuZmFkZS5uZy1lbnRlciB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKlxuICogLyYjNDI7IFRoZSBmaW5pc2hpbmcgQ1NTIHN0eWxlcyBmb3IgdGhlIGVudGVyIGFuaW1hdGlvbiAmIzQyOy9cbiAqIC5mYWRlLm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSB7XG4gKiAgIG9wYWNpdHk6MTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSBrZXkgdGhpbmcgdG8gcmVtZW1iZXIgaGVyZSBpcyB0aGF0LCBkZXBlbmRpbmcgb24gdGhlIGFuaW1hdGlvbiBldmVudCAod2hpY2ggZWFjaCBvZiB0aGUgZGlyZWN0aXZlcyBhYm92ZSB0cmlnZ2VyIGRlcGVuZGluZyBvbiB3aGF0J3MgZ29pbmcgb24pIHR3b1xuICogZ2VuZXJhdGVkIENTUyBjbGFzc2VzIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudDsgaW4gdGhlIGV4YW1wbGUgYWJvdmUgd2UgaGF2ZSBgLm5nLWVudGVyYCBhbmQgYC5uZy1lbnRlci1hY3RpdmVgLiBGb3IgQ1NTIHRyYW5zaXRpb25zLCB0aGUgdHJhbnNpdGlvblxuICogY29kZSAqKm11c3QqKiBiZSBkZWZpbmVkIHdpdGhpbiB0aGUgc3RhcnRpbmcgQ1NTIGNsYXNzIChpbiB0aGlzIGNhc2UgYC5uZy1lbnRlcmApLiBUaGUgZGVzdGluYXRpb24gY2xhc3MgaXMgd2hhdCB0aGUgdHJhbnNpdGlvbiB3aWxsIGFuaW1hdGUgdG93YXJkcy5cbiAqXG4gKiBJZiBmb3IgZXhhbXBsZSB3ZSB3YW50ZWQgdG8gY3JlYXRlIGFuaW1hdGlvbnMgZm9yIGBsZWF2ZWAgYW5kIGBtb3ZlYCAobmdSZXBlYXQgdHJpZ2dlcnMgbW92ZSkgdGhlbiB3ZSBjYW4gZG8gc28gdXNpbmcgdGhlIHNhbWUgQ1NTIG5hbWluZyBjb252ZW50aW9uczpcbiAqXG4gKiBgYGBjc3NcbiAqIC8mIzQyOyBub3cgdGhlIGVsZW1lbnQgd2lsbCBmYWRlIG91dCBiZWZvcmUgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBET00gJiM0MjsvXG4gKiAuZmFkZS5uZy1sZWF2ZSB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogICBvcGFjaXR5OjE7XG4gKiB9XG4gKiAuZmFkZS5uZy1sZWF2ZS5uZy1sZWF2ZS1hY3RpdmUge1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBXZSBjYW4gYWxzbyBtYWtlIHVzZSBvZiAqKkNTUyBLZXlmcmFtZXMqKiBieSByZWZlcmVuY2luZyB0aGUga2V5ZnJhbWUgYW5pbWF0aW9uIHdpdGhpbiB0aGUgc3RhcnRpbmcgQ1NTIGNsYXNzOlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IHRoZXJlIGlzIG5vIG5lZWQgdG8gZGVmaW5lIGFueXRoaW5nIGluc2lkZSBvZiB0aGUgZGVzdGluYXRpb25cbiAqIENTUyBjbGFzcyBzaW5jZSB0aGUga2V5ZnJhbWUgd2lsbCB0YWtlIGNoYXJnZSBvZiB0aGUgYW5pbWF0aW9uICYjNDI7L1xuICogLmZhZGUubmctbGVhdmUge1xuICogICBhbmltYXRpb246IG15X2ZhZGVfYW5pbWF0aW9uIDAuNXMgbGluZWFyO1xuICogICAtd2Via2l0LWFuaW1hdGlvbjogbXlfZmFkZV9hbmltYXRpb24gMC41cyBsaW5lYXI7XG4gKiB9XG4gKlxuICogQGtleWZyYW1lcyBteV9mYWRlX2FuaW1hdGlvbiB7XG4gKiAgIGZyb20geyBvcGFjaXR5OjE7IH1cbiAqICAgdG8geyBvcGFjaXR5OjA7IH1cbiAqIH1cbiAqXG4gKiBALXdlYmtpdC1rZXlmcmFtZXMgbXlfZmFkZV9hbmltYXRpb24ge1xuICogICBmcm9tIHsgb3BhY2l0eToxOyB9XG4gKiAgIHRvIHsgb3BhY2l0eTowOyB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBGZWVsIGZyZWUgYWxzbyBtaXggdHJhbnNpdGlvbnMgYW5kIGtleWZyYW1lcyB0b2dldGhlciBhcyB3ZWxsIGFzIGFueSBvdGhlciBDU1MgY2xhc3NlcyBvbiB0aGUgc2FtZSBlbGVtZW50LlxuICpcbiAqICMjIyBDU1MgQ2xhc3MtYmFzZWQgQW5pbWF0aW9uc1xuICpcbiAqIENsYXNzLWJhc2VkIGFuaW1hdGlvbnMgKGFuaW1hdGlvbnMgdGhhdCBhcmUgdHJpZ2dlcmVkIHZpYSBgbmdDbGFzc2AsIGBuZ1Nob3dgLCBgbmdIaWRlYCBhbmQgc29tZSBvdGhlciBkaXJlY3RpdmVzKSBoYXZlIGEgc2xpZ2h0bHkgZGlmZmVyZW50XG4gKiBuYW1pbmcgY29udmVudGlvbi4gQ2xhc3MtYmFzZWQgYW5pbWF0aW9ucyBhcmUgYmFzaWMgZW5vdWdoIHRoYXQgYSBzdGFuZGFyZCB0cmFuc2l0aW9uIG9yIGtleWZyYW1lIGNhbiBiZSByZWZlcmVuY2VkIG9uIHRoZSBjbGFzcyBiZWluZyBhZGRlZFxuICogYW5kIHJlbW92ZWQuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgd2Ugd2FudGVkIHRvIGRvIGEgQ1NTIGFuaW1hdGlvbiBmb3IgYG5nSGlkZWAgdGhlbiB3ZSBwbGFjZSBhbiBhbmltYXRpb24gb24gdGhlIGAubmctaGlkZWAgQ1NTIGNsYXNzOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgbmctc2hvdz1cImJvb2xcIiBjbGFzcz1cImZhZGVcIj5cbiAqICAgU2hvdyBhbmQgaGlkZSBtZVxuICogPC9kaXY+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwiYm9vbD10cnVlXCI+VG9nZ2xlPC9idXR0b24+XG4gKlxuICogPHN0eWxlPlxuICogLmZhZGUubmctaGlkZSB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKiA8L3N0eWxlPlxuICogYGBgXG4gKlxuICogQWxsIHRoYXQgaXMgZ29pbmcgb24gaGVyZSB3aXRoIG5nU2hvdy9uZ0hpZGUgYmVoaW5kIHRoZSBzY2VuZXMgaXMgdGhlIGAubmctaGlkZWAgY2xhc3MgaXMgYWRkZWQvcmVtb3ZlZCAod2hlbiB0aGUgaGlkZGVuIHN0YXRlIGlzIHZhbGlkKS4gU2luY2VcbiAqIG5nU2hvdyBhbmQgbmdIaWRlIGFyZSBhbmltYXRpb24gYXdhcmUgdGhlbiB3ZSBjYW4gbWF0Y2ggdXAgYSB0cmFuc2l0aW9uIGFuZCBuZ0FuaW1hdGUgaGFuZGxlcyB0aGUgcmVzdC5cbiAqXG4gKiBJbiBhZGRpdGlvbiB0aGUgYWRkaXRpb24gYW5kIHJlbW92YWwgb2YgdGhlIENTUyBjbGFzcywgbmdBbmltYXRlIGFsc28gcHJvdmlkZXMgdHdvIGhlbHBlciBtZXRob2RzIHRoYXQgd2UgY2FuIHVzZSB0byBmdXJ0aGVyIGRlY29yYXRlIHRoZSBhbmltYXRpb25cbiAqIHdpdGggQ1NTIHN0eWxlcy5cbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IG5nLWNsYXNzPVwie29uOm9uT2ZmfVwiIGNsYXNzPVwiaGlnaGxpZ2h0XCI+XG4gKiAgIEhpZ2hsaWdodCB0aGlzIGJveFxuICogPC9kaXY+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwib25PZmY9IW9uT2ZmXCI+VG9nZ2xlPC9idXR0b24+XG4gKlxuICogPHN0eWxlPlxuICogLmhpZ2hsaWdodCB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogfVxuICogLmhpZ2hsaWdodC5vbi1hZGQge1xuICogICBiYWNrZ3JvdW5kOndoaXRlO1xuICogfVxuICogLmhpZ2hsaWdodC5vbiB7XG4gKiAgIGJhY2tncm91bmQ6eWVsbG93O1xuICogfVxuICogLmhpZ2hsaWdodC5vbi1yZW1vdmUge1xuICogICBiYWNrZ3JvdW5kOmJsYWNrO1xuICogfVxuICogPC9zdHlsZT5cbiAqIGBgYFxuICpcbiAqIFdlIGNhbiBhbHNvIG1ha2UgdXNlIG9mIENTUyBrZXlmcmFtZXMgYnkgcGxhY2luZyB0aGVtIHdpdGhpbiB0aGUgQ1NTIGNsYXNzZXMuXG4gKlxuICpcbiAqICMjIyBDU1MgU3RhZ2dlcmluZyBBbmltYXRpb25zXG4gKiBBIFN0YWdnZXJpbmcgYW5pbWF0aW9uIGlzIGEgY29sbGVjdGlvbiBvZiBhbmltYXRpb25zIHRoYXQgYXJlIGlzc3VlZCB3aXRoIGEgc2xpZ2h0IGRlbGF5IGluIGJldHdlZW4gZWFjaCBzdWNjZXNzaXZlIG9wZXJhdGlvbiByZXN1bHRpbmcgaW4gYVxuICogY3VydGFpbi1saWtlIGVmZmVjdC4gVGhlIG5nQW5pbWF0ZSBtb2R1bGUgKHZlcnNpb25zID49MS4yKSBzdXBwb3J0cyBzdGFnZ2VyaW5nIGFuaW1hdGlvbnMgYW5kIHRoZSBzdGFnZ2VyIGVmZmVjdCBjYW4gYmVcbiAqIHBlcmZvcm1lZCBieSBjcmVhdGluZyBhICoqbmctRVZFTlQtc3RhZ2dlcioqIENTUyBjbGFzcyBhbmQgYXR0YWNoaW5nIHRoYXQgY2xhc3MgdG8gdGhlIGJhc2UgQ1NTIGNsYXNzIHVzZWQgZm9yXG4gKiB0aGUgYW5pbWF0aW9uLiBUaGUgc3R5bGUgcHJvcGVydHkgZXhwZWN0ZWQgd2l0aGluIHRoZSBzdGFnZ2VyIGNsYXNzIGNhbiBlaXRoZXIgYmUgYSAqKnRyYW5zaXRpb24tZGVsYXkqKiBvciBhblxuICogKiphbmltYXRpb24tZGVsYXkqKiBwcm9wZXJ0eSAob3IgYm90aCBpZiB5b3VyIGFuaW1hdGlvbiBjb250YWlucyBib3RoIHRyYW5zaXRpb25zIGFuZCBrZXlmcmFtZSBhbmltYXRpb25zKS5cbiAqXG4gKiBgYGBjc3NcbiAqIC5teS1hbmltYXRpb24ubmctZW50ZXIge1xuICogICAvJiM0Mjsgc3RhbmRhcmQgdHJhbnNpdGlvbiBjb2RlICYjNDI7L1xuICogICB0cmFuc2l0aW9uOiAxcyBsaW5lYXIgYWxsO1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKiAubXktYW5pbWF0aW9uLm5nLWVudGVyLXN0YWdnZXIge1xuICogICAvJiM0MjsgdGhpcyB3aWxsIGhhdmUgYSAxMDBtcyBkZWxheSBiZXR3ZWVuIGVhY2ggc3VjY2Vzc2l2ZSBsZWF2ZSBhbmltYXRpb24gJiM0MjsvXG4gKiAgIHRyYW5zaXRpb24tZGVsYXk6IDAuMXM7XG4gKlxuICogICAvJiM0MjsgaW4gY2FzZSB0aGUgc3RhZ2dlciBkb2Vzbid0IHdvcmsgdGhlbiB0aGUgZHVyYXRpb24gdmFsdWVcbiAqICAgIG11c3QgYmUgc2V0IHRvIDAgdG8gYXZvaWQgYW4gYWNjaWRlbnRhbCBDU1MgaW5oZXJpdGFuY2UgJiM0MjsvXG4gKiAgIHRyYW5zaXRpb24tZHVyYXRpb246IDBzO1xuICogfVxuICogLm15LWFuaW1hdGlvbi5uZy1lbnRlci5uZy1lbnRlci1hY3RpdmUge1xuICogICAvJiM0Mjsgc3RhbmRhcmQgdHJhbnNpdGlvbiBzdHlsZXMgJiM0MjsvXG4gKiAgIG9wYWNpdHk6MTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFN0YWdnZXJpbmcgYW5pbWF0aW9ucyB3b3JrIGJ5IGRlZmF1bHQgaW4gbmdSZXBlYXQgKHNvIGxvbmcgYXMgdGhlIENTUyBjbGFzcyBpcyBkZWZpbmVkKS4gT3V0c2lkZSBvZiBuZ1JlcGVhdCwgdG8gdXNlIHN0YWdnZXJpbmcgYW5pbWF0aW9uc1xuICogb24geW91ciBvd24sIHRoZXkgY2FuIGJlIHRyaWdnZXJlZCBieSBmaXJpbmcgbXVsdGlwbGUgY2FsbHMgdG8gdGhlIHNhbWUgZXZlbnQgb24gJGFuaW1hdGUuIEhvd2V2ZXIsIHRoZSByZXN0cmljdGlvbnMgc3Vycm91bmRpbmcgdGhpc1xuICogYXJlIHRoYXQgZWFjaCBvZiB0aGUgZWxlbWVudHMgbXVzdCBoYXZlIHRoZSBzYW1lIENTUyBjbGFzc05hbWUgdmFsdWUgYXMgd2VsbCBhcyB0aGUgc2FtZSBwYXJlbnQgZWxlbWVudC4gQSBzdGFnZ2VyIG9wZXJhdGlvblxuICogd2lsbCBhbHNvIGJlIHJlc2V0IGlmIG9uZSBvciBtb3JlIGFuaW1hdGlvbiBmcmFtZXMgaGF2ZSBwYXNzZWQgc2luY2UgdGhlIG11bHRpcGxlIGNhbGxzIHRvIGAkYW5pbWF0ZWAgd2VyZSBmaXJlZC5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIGNvZGUgd2lsbCBpc3N1ZSB0aGUgKipuZy1sZWF2ZS1zdGFnZ2VyKiogZXZlbnQgb24gdGhlIGVsZW1lbnQgcHJvdmlkZWQ6XG4gKlxuICogYGBganNcbiAqIHZhciBraWRzID0gcGFyZW50LmNoaWxkcmVuKCk7XG4gKlxuICogJGFuaW1hdGUubGVhdmUoa2lkc1swXSk7IC8vc3RhZ2dlciBpbmRleD0wXG4gKiAkYW5pbWF0ZS5sZWF2ZShraWRzWzFdKTsgLy9zdGFnZ2VyIGluZGV4PTFcbiAqICRhbmltYXRlLmxlYXZlKGtpZHNbMl0pOyAvL3N0YWdnZXIgaW5kZXg9MlxuICogJGFuaW1hdGUubGVhdmUoa2lkc1szXSk7IC8vc3RhZ2dlciBpbmRleD0zXG4gKiAkYW5pbWF0ZS5sZWF2ZShraWRzWzRdKTsgLy9zdGFnZ2VyIGluZGV4PTRcbiAqXG4gKiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICogICAvL3N0YWdnZXIgaGFzIHJlc2V0IGl0c2VsZlxuICogICAkYW5pbWF0ZS5sZWF2ZShraWRzWzVdKTsgLy9zdGFnZ2VyIGluZGV4PTBcbiAqICAgJGFuaW1hdGUubGVhdmUoa2lkc1s2XSk7IC8vc3RhZ2dlciBpbmRleD0xXG4gKlxuICogICAkc2NvcGUuJGRpZ2VzdCgpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBTdGFnZ2VyIGFuaW1hdGlvbnMgYXJlIGN1cnJlbnRseSBvbmx5IHN1cHBvcnRlZCB3aXRoaW4gQ1NTLWRlZmluZWQgYW5pbWF0aW9ucy5cbiAqXG4gKiAjIyMgVGhlIGBuZy1hbmltYXRlYCBDU1MgY2xhc3NcbiAqXG4gKiBXaGVuIG5nQW5pbWF0ZSBpcyBhbmltYXRpbmcgYW4gZWxlbWVudCBpdCB3aWxsIGFwcGx5IHRoZSBgbmctYW5pbWF0ZWAgQ1NTIGNsYXNzIHRvIHRoZSBlbGVtZW50IGZvciB0aGUgZHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvbi5cbiAqIFRoaXMgaXMgYSB0ZW1wb3JhcnkgQ1NTIGNsYXNzIGFuZCBpdCB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgYW5pbWF0aW9uIGlzIG92ZXIgKGZvciBib3RoIEphdmFTY3JpcHQgYW5kIENTUy1iYXNlZCBhbmltYXRpb25zKS5cbiAqXG4gKiBUaGVyZWZvcmUsIGFuaW1hdGlvbnMgY2FuIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudCB1c2luZyB0aGlzIHRlbXBvcmFyeSBjbGFzcyBkaXJlY3RseSB2aWEgQ1NTLlxuICpcbiAqIGBgYGNzc1xuICogLnppcHBlci5uZy1hbmltYXRlIHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiB9XG4gKiAuemlwcGVyLm5nLWVudGVyIHtcbiAqICAgb3BhY2l0eTowO1xuICogfVxuICogLnppcHBlci5uZy1lbnRlci5uZy1lbnRlci1hY3RpdmUge1xuICogICBvcGFjaXR5OjE7XG4gKiB9XG4gKiAuemlwcGVyLm5nLWxlYXZlIHtcbiAqICAgb3BhY2l0eToxO1xuICogfVxuICogLnppcHBlci5uZy1sZWF2ZS5uZy1sZWF2ZS1hY3RpdmUge1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBgbmctYW5pbWF0ZWAgQ1NTIGNsYXNzIGlzIHJlc2VydmVkIGFuZCBpdCBjYW5ub3QgYmUgYXBwbGllZCBvbiBhbiBlbGVtZW50IGRpcmVjdGx5IHNpbmNlIG5nQW5pbWF0ZSB3aWxsIGFsd2F5cyByZW1vdmVcbiAqIHRoZSBDU1MgY2xhc3Mgb25jZSBhbiBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4pXG4gKlxuICpcbiAqICMjIEphdmFTY3JpcHQtYmFzZWQgQW5pbWF0aW9uc1xuICpcbiAqIG5nQW5pbWF0ZSBhbHNvIGFsbG93cyBmb3IgYW5pbWF0aW9ucyB0byBiZSBjb25zdW1lZCBieSBKYXZhU2NyaXB0IGNvZGUuIFRoZSBhcHByb2FjaCBpcyBzaW1pbGFyIHRvIENTUy1iYXNlZCBhbmltYXRpb25zICh3aGVyZSB0aGVyZSBpcyBhIHNoYXJlZFxuICogQ1NTIGNsYXNzIHRoYXQgaXMgcmVmZXJlbmNlZCBpbiBvdXIgSFRNTCBjb2RlKSBidXQgaW4gYWRkaXRpb24gd2UgbmVlZCB0byByZWdpc3RlciB0aGUgSmF2YVNjcmlwdCBhbmltYXRpb24gb24gdGhlIG1vZHVsZS4gQnkgbWFraW5nIHVzZSBvZiB0aGVcbiAqIGBtb2R1bGUuYW5pbWF0aW9uKClgIG1vZHVsZSBmdW5jdGlvbiB3ZSBjYW4gcmVnaXN0ZXIgdGhlIGFpbm1hdGlvbi5cbiAqXG4gKiBMZXQncyBzZWUgYW4gZXhhbXBsZSBvZiBhIGVudGVyL2xlYXZlIGFuaW1hdGlvbiB1c2luZyBgbmdSZXBlYXRgOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgbmctcmVwZWF0PVwiaXRlbSBpbiBpdGVtc1wiIGNsYXNzPVwic2xpZGVcIj5cbiAqICAge3sgaXRlbSB9fVxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBTZWUgdGhlICoqc2xpZGUqKiBDU1MgY2xhc3M/IExldCdzIHVzZSB0aGF0IGNsYXNzIHRvIGRlZmluZSBhbiBhbmltYXRpb24gdGhhdCB3ZSdsbCBzdHJ1Y3R1cmUgaW4gb3VyIG1vZHVsZSBjb2RlIGJ5IHVzaW5nIGBtb2R1bGUuYW5pbWF0aW9uYDpcbiAqXG4gKiBgYGBqc1xuICogbXlNb2R1bGUuYW5pbWF0aW9uKCcuc2xpZGUnLCBbZnVuY3Rpb24oKSB7XG4gKiAgIHJldHVybiB7XG4gKiAgICAgLy8gbWFrZSBub3RlIHRoYXQgb3RoZXIgZXZlbnRzIChsaWtlIGFkZENsYXNzL3JlbW92ZUNsYXNzKVxuICogICAgIC8vIGhhdmUgZGlmZmVyZW50IGZ1bmN0aW9uIGlucHV0IHBhcmFtZXRlcnNcbiAqICAgICBlbnRlcjogZnVuY3Rpb24oZWxlbWVudCwgZG9uZUZuKSB7XG4gKiAgICAgICBqUXVlcnkoZWxlbWVudCkuZmFkZUluKDEwMDAsIGRvbmVGbik7XG4gKlxuICogICAgICAgLy8gcmVtZW1iZXIgdG8gY2FsbCBkb25lRm4gc28gdGhhdCBhbmd1bGFyXG4gKiAgICAgICAvLyBrbm93cyB0aGF0IHRoZSBhbmltYXRpb24gaGFzIGNvbmNsdWRlZFxuICogICAgIH0sXG4gKlxuICogICAgIG1vdmU6IGZ1bmN0aW9uKGVsZW1lbnQsIGRvbmVGbikge1xuICogICAgICAgalF1ZXJ5KGVsZW1lbnQpLmZhZGVJbigxMDAwLCBkb25lRm4pO1xuICogICAgIH0sXG4gKlxuICogICAgIGxlYXZlOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIGpRdWVyeShlbGVtZW50KS5mYWRlT3V0KDEwMDAsIGRvbmVGbik7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XVxuICogYGBgXG4gKlxuICogVGhlIG5pY2UgdGhpbmcgYWJvdXQgSlMtYmFzZWQgYW5pbWF0aW9ucyBpcyB0aGF0IHdlIGNhbiBpbmplY3Qgb3RoZXIgc2VydmljZXMgYW5kIG1ha2UgdXNlIG9mIGFkdmFuY2VkIGFuaW1hdGlvbiBsaWJyYXJpZXMgc3VjaCBhc1xuICogZ3JlZW5zb2NrLmpzIGFuZCB2ZWxvY2l0eS5qcy5cbiAqXG4gKiBJZiBvdXIgYW5pbWF0aW9uIGNvZGUgY2xhc3MtYmFzZWQgKG1lYW5pbmcgdGhhdCBzb21ldGhpbmcgbGlrZSBgbmdDbGFzc2AsIGBuZ0hpZGVgIGFuZCBgbmdTaG93YCB0cmlnZ2VycyBpdCkgdGhlbiB3ZSBjYW4gc3RpbGwgZGVmaW5lXG4gKiBvdXIgYW5pbWF0aW9ucyBpbnNpZGUgb2YgdGhlIHNhbWUgcmVnaXN0ZXJlZCBhbmltYXRpb24sIGhvd2V2ZXIsIHRoZSBmdW5jdGlvbiBpbnB1dCBhcmd1bWVudHMgYXJlIGEgYml0IGRpZmZlcmVudDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IG5nLWNsYXNzPVwiY29sb3JcIiBjbGFzcz1cImNvbG9yZnVsXCI+XG4gKiAgIHRoaXMgYm94IGlzIG1vb2R5XG4gKiA8L2Rpdj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJjb2xvcj0ncmVkJ1wiPkNoYW5nZSB0byByZWQ8L2J1dHRvbj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJjb2xvcj0nYmx1ZSdcIj5DaGFuZ2UgdG8gYmx1ZTwvYnV0dG9uPlxuICogPGJ1dHRvbiBuZy1jbGljaz1cImNvbG9yPSdncmVlbidcIj5DaGFuZ2UgdG8gZ3JlZW48L2J1dHRvbj5cbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBteU1vZHVsZS5hbmltYXRpb24oJy5jb2xvcmZ1bCcsIFtmdW5jdGlvbigpIHtcbiAqICAgcmV0dXJuIHtcbiAqICAgICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lLCBkb25lRm4pIHtcbiAqICAgICAgIC8vIGRvIHNvbWUgY29vbCBhbmltYXRpb24gYW5kIGNhbGwgdGhlIGRvbmVGblxuICogICAgIH0sXG4gKiAgICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSwgZG9uZUZuKSB7XG4gKiAgICAgICAvLyBkbyBzb21lIGNvb2wgYW5pbWF0aW9uIGFuZCBjYWxsIHRoZSBkb25lRm5cbiAqICAgICB9LFxuICogICAgIHNldENsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBhZGRlZENsYXNzLCByZW1vdmVkQ2xhc3MsIGRvbmVGbikge1xuICogICAgICAgLy8gZG8gc29tZSBjb29sIGFuaW1hdGlvbiBhbmQgY2FsbCB0aGUgZG9uZUZuXG4gKiAgICAgfVxuICogICB9XG4gKiB9XVxuICogYGBgXG4gKlxuICogIyMgQ1NTICsgSlMgQW5pbWF0aW9ucyBUb2dldGhlclxuICpcbiAqIEFuZ3VsYXJKUyAxLjQgYW5kIGhpZ2hlciBoYXMgdGFrZW4gc3RlcHMgdG8gbWFrZSB0aGUgYW1hbGdhbWF0aW9uIG9mIENTUyBhbmQgSlMgYW5pbWF0aW9ucyBtb3JlIGZsZXhpYmxlLiBIb3dldmVyLCB1bmxpa2UgZWFybGllciB2ZXJzaW9ucyBvZiBBbmd1bGFyLFxuICogZGVmaW5pbmcgQ1NTIGFuZCBKUyBhbmltYXRpb25zIHRvIHdvcmsgb2ZmIG9mIHRoZSBzYW1lIENTUyBjbGFzcyB3aWxsIG5vdCB3b3JrIGFueW1vcmUuIFRoZXJlZm9yZSB0aGUgZXhhbXBsZSBiZWxvdyB3aWxsIG9ubHkgcmVzdWx0IGluICoqSlMgYW5pbWF0aW9ucyB0YWtpbmdcbiAqIGNoYXJnZSBvZiB0aGUgYW5pbWF0aW9uKio6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1pZj1cImJvb2xcIiBjbGFzcz1cInNsaWRlXCI+XG4gKiAgIFNsaWRlIGluIGFuZCBvdXRcbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogYGBganNcbiAqIG15TW9kdWxlLmFuaW1hdGlvbignLnNsaWRlJywgW2Z1bmN0aW9uKCkge1xuICogICByZXR1cm4ge1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIGpRdWVyeShlbGVtZW50KS5zbGlkZUluKDEwMDAsIGRvbmVGbik7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XVxuICogYGBgXG4gKlxuICogYGBgY3NzXG4gKiAuc2xpZGUubmctZW50ZXIge1xuICogICB0cmFuc2l0aW9uOjAuNXMgbGluZWFyIGFsbDtcbiAqICAgdHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTEwMHB4KTtcbiAqIH1cbiAqIC5zbGlkZS5uZy1lbnRlci5uZy1lbnRlci1hY3RpdmUge1xuICogICB0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIERvZXMgdGhpcyBtZWFuIHRoYXQgQ1NTIGFuZCBKUyBhbmltYXRpb25zIGNhbm5vdCBiZSB1c2VkIHRvZ2V0aGVyPyBEbyBKUy1iYXNlZCBhbmltYXRpb25zIGFsd2F5cyBoYXZlIGhpZ2hlciBwcmlvcml0eT8gV2UgY2FuIG1ha2UgdXAgZm9yIHRoZVxuICogbGFjayBvZiBDU1MgYW5pbWF0aW9ucyBieSB1c2luZyB0aGUgYCRhbmltYXRlQ3NzYCBzZXJ2aWNlIHRvIHRyaWdnZXIgb3VyIG93biB0d2Vha2VkLW91dCwgQ1NTLWJhc2VkIGFuaW1hdGlvbnMgZGlyZWN0bHkgZnJvbVxuICogb3VyIG93biBKUy1iYXNlZCBhbmltYXRpb24gY29kZTpcbiAqXG4gKiBgYGBqc1xuICogbXlNb2R1bGUuYW5pbWF0aW9uKCcuc2xpZGUnLCBbJyRhbmltYXRlQ3NzJywgZnVuY3Rpb24oJGFuaW1hdGVDc3MpIHtcbiAqICAgcmV0dXJuIHtcbiAqICAgICBlbnRlcjogZnVuY3Rpb24oZWxlbWVudCwgZG9uZUZuKSB7XG4qICAgICAgICAvLyB0aGlzIHdpbGwgdHJpZ2dlciBgLnNsaWRlLm5nLWVudGVyYCBhbmQgYC5zbGlkZS5uZy1lbnRlci1hY3RpdmVgLlxuICogICAgICAgdmFyIHJ1bm5lciA9ICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgICAgICAgZXZlbnQ6ICdlbnRlcicsXG4gKiAgICAgICAgIHN0cnVjdHVyYWw6IHRydWVcbiAqICAgICAgIH0pLnN0YXJ0KCk7XG4qICAgICAgICBydW5uZXIuZG9uZShkb25lRm4pO1xuICogICAgIH1cbiAqICAgfVxuICogfV1cbiAqIGBgYFxuICpcbiAqIFRoZSBuaWNlIHRoaW5nIGhlcmUgaXMgdGhhdCB3ZSBjYW4gc2F2ZSBiYW5kd2lkdGggYnkgc3RpY2tpbmcgdG8gb3VyIENTUy1iYXNlZCBhbmltYXRpb24gY29kZSBhbmQgd2UgZG9uJ3QgbmVlZCB0byByZWx5IG9uIGEgM3JkLXBhcnR5IGFuaW1hdGlvbiBmcmFtZXdvcmsuXG4gKlxuICogVGhlIGAkYW5pbWF0ZUNzc2Agc2VydmljZSBpcyB2ZXJ5IHBvd2VyZnVsIHNpbmNlIHdlIGNhbiBmZWVkIGluIGFsbCBraW5kcyBvZiBleHRyYSBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBldmFsdWF0ZWQgYW5kIGZlZCBpbnRvIGEgQ1NTIHRyYW5zaXRpb24gb3JcbiAqIGtleWZyYW1lIGFuaW1hdGlvbi4gRm9yIGV4YW1wbGUgaWYgd2Ugd2FudGVkIHRvIGFuaW1hdGUgdGhlIGhlaWdodCBvZiBhbiBlbGVtZW50IHdoaWxlIGFkZGluZyBhbmQgcmVtb3ZpbmcgY2xhc3NlcyB0aGVuIHdlIGNhbiBkbyBzbyBieSBwcm92aWRpbmcgdGhhdFxuICogZGF0YSBpbnRvIGAkYW5pbWF0ZUNzc2AgZGlyZWN0bHk6XG4gKlxuICogYGBganNcbiAqIG15TW9kdWxlLmFuaW1hdGlvbignLnNsaWRlJywgWyckYW5pbWF0ZUNzcycsIGZ1bmN0aW9uKCRhbmltYXRlQ3NzKSB7XG4gKiAgIHJldHVybiB7XG4gKiAgICAgZW50ZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGRvbmVGbikge1xuICogICAgICAgdmFyIHJ1bm5lciA9ICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgICAgICAgZXZlbnQ6ICdlbnRlcicsXG4gKiAgICAgICAgIHN0cnVjdHVyYWw6IHRydWUsXG4gKiAgICAgICAgIGFkZENsYXNzOiAnbWFyb29uLXNldHRpbmcnLFxuICogICAgICAgICBmcm9tOiB7IGhlaWdodDowIH0sXG4gKiAgICAgICAgIHRvOiB7IGhlaWdodDogMjAwIH1cbiAqICAgICAgIH0pLnN0YXJ0KCk7XG4gKlxuICogICAgICAgcnVubmVyLmRvbmUoZG9uZUZuKTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1dXG4gKiBgYGBcbiAqXG4gKiBOb3cgd2UgY2FuIGZpbGwgaW4gdGhlIHJlc3QgdmlhIG91ciB0cmFuc2l0aW9uIENTUyBjb2RlOlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IHRoZSB0cmFuc2l0aW9uIHRlbGxzIG5nQW5pbWF0ZSB0byBtYWtlIHRoZSBhbmltYXRpb24gaGFwcGVuICYjNDI7L1xuICogLnNsaWRlLm5nLWVudGVyIHsgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7IH1cbiAqXG4gKiAvJiM0MjsgdGhpcyBleHRyYSBDU1MgY2xhc3Mgd2lsbCBiZSBhYnNvcmJlZCBpbnRvIHRoZSB0cmFuc2l0aW9uXG4gKiBzaW5jZSB0aGUgJGFuaW1hdGVDc3MgY29kZSBpcyBhZGRpbmcgdGhlIGNsYXNzICYjNDI7L1xuICogLm1hcm9vbi1zZXR0aW5nIHsgYmFja2dyb3VuZDpyZWQ7IH1cbiAqIGBgYFxuICpcbiAqIEFuZCBgJGFuaW1hdGVDc3NgIHdpbGwgZmlndXJlIG91dCB0aGUgcmVzdC4gSnVzdCBtYWtlIHN1cmUgdG8gaGF2ZSB0aGUgYGRvbmUoKWAgY2FsbGJhY2sgZmlyZSB0aGUgYGRvbmVGbmAgZnVuY3Rpb24gdG8gc2lnbmFsIHdoZW4gdGhlIGFuaW1hdGlvbiBpcyBvdmVyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgd2hhdCdzIHBvc3NpYmxlIGJlIHN1cmUgdG8gdmlzaXQgdGhlIHtAbGluayBuZ0FuaW1hdGUuJGFuaW1hdGVDc3MgJGFuaW1hdGVDc3Mgc2VydmljZX0uXG4gKlxuICogIyMgQW5pbWF0aW9uIEFuY2hvcmluZyAodmlhIGBuZy1hbmltYXRlLXJlZmApXG4gKlxuICogbmdBbmltYXRlIGluIEFuZ3VsYXJKUyAxLjQgY29tZXMgcGFja2VkIHdpdGggdGhlIGFiaWxpdHkgdG8gY3Jvc3MtYW5pbWF0ZSBlbGVtZW50cyBiZXR3ZWVuXG4gKiBzdHJ1Y3R1cmFsIGFyZWFzIG9mIGFuIGFwcGxpY2F0aW9uIChsaWtlIHZpZXdzKSBieSBwYWlyaW5nIHVwIGVsZW1lbnRzIHVzaW5nIGFuIGF0dHJpYnV0ZVxuICogY2FsbGVkIGBuZy1hbmltYXRlLXJlZmAuXG4gKlxuICogTGV0J3Mgc2F5IGZvciBleGFtcGxlIHdlIGhhdmUgdHdvIHZpZXdzIHRoYXQgYXJlIG1hbmFnZWQgYnkgYG5nLXZpZXdgIGFuZCB3ZSB3YW50IHRvIHNob3dcbiAqIHRoYXQgdGhlcmUgaXMgYSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0d28gY29tcG9uZW50cyBzaXR1YXRlZCBpbiB3aXRoaW4gdGhlc2Ugdmlld3MuIEJ5IHVzaW5nIHRoZVxuICogYG5nLWFuaW1hdGUtcmVmYCBhdHRyaWJ1dGUgd2UgY2FuIGlkZW50aWZ5IHRoYXQgdGhlIHR3byBjb21wb25lbnRzIGFyZSBwYWlyZWQgdG9nZXRoZXIgYW5kIHdlXG4gKiBjYW4gdGhlbiBhdHRhY2ggYW4gYW5pbWF0aW9uLCB3aGljaCBpcyB0cmlnZ2VyZWQgd2hlbiB0aGUgdmlldyBjaGFuZ2VzLlxuICpcbiAqIFNheSBmb3IgZXhhbXBsZSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8IS0tIGluZGV4Lmh0bWwgLS0+XG4gKiA8ZGl2IG5nLXZpZXcgY2xhc3M9XCJ2aWV3LWFuaW1hdGlvblwiPlxuICogPC9kaXY+XG4gKlxuICogPCEtLSBob21lLmh0bWwgLS0+XG4gKiA8YSBocmVmPVwiIy9iYW5uZXItcGFnZVwiPlxuICogICA8aW1nIHNyYz1cIi4vYmFubmVyLmpwZ1wiIGNsYXNzPVwiYmFubmVyXCIgbmctYW5pbWF0ZS1yZWY9XCJiYW5uZXJcIj5cbiAqIDwvYT5cbiAqXG4gKiA8IS0tIGJhbm5lci1wYWdlLmh0bWwgLS0+XG4gKiA8aW1nIHNyYz1cIi4vYmFubmVyLmpwZ1wiIGNsYXNzPVwiYmFubmVyXCIgbmctYW5pbWF0ZS1yZWY9XCJiYW5uZXJcIj5cbiAqIGBgYFxuICpcbiAqIE5vdywgd2hlbiB0aGUgdmlldyBjaGFuZ2VzIChvbmNlIHRoZSBsaW5rIGlzIGNsaWNrZWQpLCBuZ0FuaW1hdGUgd2lsbCBleGFtaW5lIHRoZVxuICogSFRNTCBjb250ZW50cyB0byBzZWUgaWYgdGhlcmUgaXMgYSBtYXRjaCByZWZlcmVuY2UgYmV0d2VlbiBhbnkgY29tcG9uZW50cyBpbiB0aGUgdmlld1xuICogdGhhdCBpcyBsZWF2aW5nIGFuZCB0aGUgdmlldyB0aGF0IGlzIGVudGVyaW5nLiBJdCB3aWxsIHNjYW4gYm90aCB0aGUgdmlldyB3aGljaCBpcyBiZWluZ1xuICogcmVtb3ZlZCAobGVhdmUpIGFuZCBpbnNlcnRlZCAoZW50ZXIpIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IHBhaXJlZCBET00gZWxlbWVudHMgdGhhdFxuICogY29udGFpbiBhIG1hdGNoaW5nIHJlZiB2YWx1ZS5cbiAqXG4gKiBUaGUgdHdvIGltYWdlcyBtYXRjaCBzaW5jZSB0aGV5IHNoYXJlIHRoZSBzYW1lIHJlZiB2YWx1ZS4gbmdBbmltYXRlIHdpbGwgbm93IGNyZWF0ZSBhXG4gKiB0cmFuc3BvcnQgZWxlbWVudCAod2hpY2ggaXMgYSBjbG9uZSBvZiB0aGUgZmlyc3QgaW1hZ2UgZWxlbWVudCkgYW5kIGl0IHdpbGwgdGhlbiBhdHRlbXB0XG4gKiB0byBhbmltYXRlIHRvIHRoZSBwb3NpdGlvbiBvZiB0aGUgc2Vjb25kIGltYWdlIGVsZW1lbnQgaW4gdGhlIG5leHQgdmlldy4gRm9yIHRoZSBhbmltYXRpb24gdG9cbiAqIHdvcmsgYSBzcGVjaWFsIENTUyBjbGFzcyBjYWxsZWQgYG5nLWFuY2hvcmAgd2lsbCBiZSBhZGRlZCB0byB0aGUgdHJhbnNwb3J0ZWQgZWxlbWVudC5cbiAqXG4gKiBXZSBjYW4gbm93IGF0dGFjaCBhIHRyYW5zaXRpb24gb250byB0aGUgYC5iYW5uZXIubmctYW5jaG9yYCBDU1MgY2xhc3MgYW5kIHRoZW5cbiAqIG5nQW5pbWF0ZSB3aWxsIGhhbmRsZSB0aGUgZW50aXJlIHRyYW5zaXRpb24gZm9yIHVzIGFzIHdlbGwgYXMgdGhlIGFkZGl0aW9uIGFuZCByZW1vdmFsIG9mXG4gKiBhbnkgY2hhbmdlcyBvZiBDU1MgY2xhc3NlcyBiZXR3ZWVuIHRoZSBlbGVtZW50czpcbiAqXG4gKiBgYGBjc3NcbiAqIC5iYW5uZXIubmctYW5jaG9yIHtcbiAqICAgLyYjNDI7IHRoaXMgYW5pbWF0aW9uIHdpbGwgbGFzdCBmb3IgMSBzZWNvbmQgc2luY2UgdGhlcmUgYXJlXG4gKiAgICAgICAgICB0d28gcGhhc2VzIHRvIHRoZSBhbmltYXRpb24gKGFuIGBpbmAgYW5kIGFuIGBvdXRgIHBoYXNlKSAmIzQyOy9cbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBXZSBhbHNvICoqbXVzdCoqIGluY2x1ZGUgYW5pbWF0aW9ucyBmb3IgdGhlIHZpZXdzIHRoYXQgYXJlIGJlaW5nIGVudGVyZWQgYW5kIHJlbW92ZWRcbiAqIChvdGhlcndpc2UgYW5jaG9yaW5nIHdvdWxkbid0IGJlIHBvc3NpYmxlIHNpbmNlIHRoZSBuZXcgdmlldyB3b3VsZCBiZSBpbnNlcnRlZCByaWdodCBhd2F5KS5cbiAqXG4gKiBgYGBjc3NcbiAqIC52aWV3LWFuaW1hdGlvbi5uZy1lbnRlciwgLnZpZXctYW5pbWF0aW9uLm5nLWxlYXZlIHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiAgIHBvc2l0aW9uOmZpeGVkO1xuICogICBsZWZ0OjA7XG4gKiAgIHRvcDowO1xuICogICB3aWR0aDoxMDAlO1xuICogfVxuICogLnZpZXctYW5pbWF0aW9uLm5nLWVudGVyIHtcbiAqICAgdHJhbnNmb3JtOnRyYW5zbGF0ZVgoMTAwJSk7XG4gKiB9XG4gKiAudmlldy1hbmltYXRpb24ubmctbGVhdmUsXG4gKiAudmlldy1hbmltYXRpb24ubmctZW50ZXIubmctZW50ZXItYWN0aXZlIHtcbiAqICAgdHJhbnNmb3JtOnRyYW5zbGF0ZVgoMCUpO1xuICogfVxuICogLnZpZXctYW5pbWF0aW9uLm5nLWxlYXZlLm5nLWxlYXZlLWFjdGl2ZSB7XG4gKiAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKC0xMDAlKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE5vdyB3ZSBjYW4ganVtcCBiYWNrIHRvIHRoZSBhbmNob3IgYW5pbWF0aW9uLiBXaGVuIHRoZSBhbmltYXRpb24gaGFwcGVucywgdGhlcmUgYXJlIHR3byBzdGFnZXMgdGhhdCBvY2N1cjpcbiAqIGFuIGBvdXRgIGFuZCBhbiBgaW5gIHN0YWdlLiBUaGUgYG91dGAgc3RhZ2UgaGFwcGVucyBmaXJzdCBhbmQgdGhhdCBpcyB3aGVuIHRoZSBlbGVtZW50IGlzIGFuaW1hdGVkIGF3YXlcbiAqIGZyb20gaXRzIG9yaWdpbi4gT25jZSB0aGF0IGFuaW1hdGlvbiBpcyBvdmVyIHRoZW4gdGhlIGBpbmAgc3RhZ2Ugb2NjdXJzIHdoaWNoIGFuaW1hdGVzIHRoZVxuICogZWxlbWVudCB0byBpdHMgZGVzdGluYXRpb24uIFRoZSByZWFzb24gd2h5IHRoZXJlIGFyZSB0d28gYW5pbWF0aW9ucyBpcyB0byBnaXZlIGVub3VnaCB0aW1lXG4gKiBmb3IgdGhlIGVudGVyIGFuaW1hdGlvbiBvbiB0aGUgbmV3IGVsZW1lbnQgdG8gYmUgcmVhZHkuXG4gKlxuICogVGhlIGV4YW1wbGUgYWJvdmUgc2V0cyB1cCBhIHRyYW5zaXRpb24gZm9yIGJvdGggdGhlIGluIGFuZCBvdXQgcGhhc2VzLCBidXQgd2UgY2FuIGFsc28gdGFyZ2V0IHRoZSBvdXQgb3JcbiAqIGluIHBoYXNlcyBkaXJlY3RseSB2aWEgYG5nLWFuY2hvci1vdXRgIGFuZCBgbmctYW5jaG9yLWluYC5cbiAqXG4gKiBgYGBjc3NcbiAqIC5iYW5uZXIubmctYW5jaG9yLW91dCB7XG4gKiAgIHRyYW5zaXRpb246IDAuNXMgbGluZWFyIGFsbDtcbiAqXG4gKiAgIC8mIzQyOyB0aGUgc2NhbGUgd2lsbCBiZSBhcHBsaWVkIGR1cmluZyB0aGUgb3V0IGFuaW1hdGlvbixcbiAqICAgICAgICAgIGJ1dCB3aWxsIGJlIGFuaW1hdGVkIGF3YXkgd2hlbiB0aGUgaW4gYW5pbWF0aW9uIHJ1bnMgJiM0MjsvXG4gKiAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcbiAqIH1cbiAqXG4gKiAuYmFubmVyLm5nLWFuY2hvci1pbiB7XG4gKiAgIHRyYW5zaXRpb246IDFzIGxpbmVhciBhbGw7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKlxuICpcbiAqXG4gKiAjIyMgQW5jaG9yaW5nIERlbW9cbiAqXG4gIDxleGFtcGxlIG1vZHVsZT1cImFuY2hvcmluZ0V4YW1wbGVcIlxuICAgICAgICAgICBuYW1lPVwiYW5jaG9yaW5nRXhhbXBsZVwiXG4gICAgICAgICAgIGlkPVwiYW5jaG9yaW5nRXhhbXBsZVwiXG4gICAgICAgICAgIGRlcHM9XCJhbmd1bGFyLWFuaW1hdGUuanM7YW5ndWxhci1yb3V0ZS5qc1wiXG4gICAgICAgICAgIGFuaW1hdGlvbnM9XCJ0cnVlXCI+XG4gICAgPGZpbGUgbmFtZT1cImluZGV4Lmh0bWxcIj5cbiAgICAgIDxhIGhyZWY9XCIjL1wiPkhvbWU8L2E+XG4gICAgICA8aHIgLz5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IG5nLXZpZXcgY2xhc3M9XCJ2aWV3XCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2ZpbGU+XG4gICAgPGZpbGUgbmFtZT1cInNjcmlwdC5qc1wiPlxuICAgICAgYW5ndWxhci5tb2R1bGUoJ2FuY2hvcmluZ0V4YW1wbGUnLCBbJ25nQW5pbWF0ZScsICduZ1JvdXRlJ10pXG4gICAgICAgIC5jb25maWcoWyckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICAgICAgICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlciBhcyBob21lJ1xuICAgICAgICAgIH0pO1xuICAgICAgICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy9wcm9maWxlLzppZCcsIHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncHJvZmlsZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9maWxlQ29udHJvbGxlciBhcyBwcm9maWxlJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XSlcbiAgICAgICAgLnJ1bihbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5yZWNvcmRzID0gW1xuICAgICAgICAgICAgeyBpZDoxLCB0aXRsZTogXCJNaXNzIEJldWxhaCBSb29iXCIgfSxcbiAgICAgICAgICAgIHsgaWQ6MiwgdGl0bGU6IFwiVHJlbnQgTW9yaXNzZXR0ZVwiIH0sXG4gICAgICAgICAgICB7IGlkOjMsIHRpdGxlOiBcIk1pc3MgQXZhIFBvdXJvc1wiIH0sXG4gICAgICAgICAgICB7IGlkOjQsIHRpdGxlOiBcIlJvZCBQb3Vyb3NcIiB9LFxuICAgICAgICAgICAgeyBpZDo1LCB0aXRsZTogXCJBYmR1bCBSaWNlXCIgfSxcbiAgICAgICAgICAgIHsgaWQ6NiwgdGl0bGU6IFwiTGF1cmllIFJ1dGhlcmZvcmQgU3IuXCIgfSxcbiAgICAgICAgICAgIHsgaWQ6NywgdGl0bGU6IFwiTmFraWEgTWNMYXVnaGxpblwiIH0sXG4gICAgICAgICAgICB7IGlkOjgsIHRpdGxlOiBcIkpvcmRvbiBCbGFuZGEgRFZNXCIgfSxcbiAgICAgICAgICAgIHsgaWQ6OSwgdGl0bGU6IFwiUmhvZGEgSGFuZFwiIH0sXG4gICAgICAgICAgICB7IGlkOjEwLCB0aXRsZTogXCJBbGV4YW5kcmVhIFNhdWVyXCIgfVxuICAgICAgICAgIF07XG4gICAgICAgIH1dKVxuICAgICAgICAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBbZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy9lbXB0eVxuICAgICAgICB9XSlcbiAgICAgICAgLmNvbnRyb2xsZXIoJ1Byb2ZpbGVDb250cm9sbGVyJywgWyckcm9vdFNjb3BlJywgJyRyb3V0ZVBhcmFtcycsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRyb3V0ZVBhcmFtcykge1xuICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KCRyb3V0ZVBhcmFtcy5pZCwgMTApO1xuICAgICAgICAgIHZhciByZWNvcmQgPSAkcm9vdFNjb3BlLnJlY29yZHNbaW5kZXggLSAxXTtcblxuICAgICAgICAgIHRoaXMudGl0bGUgPSByZWNvcmQudGl0bGU7XG4gICAgICAgICAgdGhpcy5pZCA9IHJlY29yZC5pZDtcbiAgICAgICAgfV0pO1xuICAgIDwvZmlsZT5cbiAgICA8ZmlsZSBuYW1lPVwiaG9tZS5odG1sXCI+XG4gICAgICA8aDI+V2VsY29tZSB0byB0aGUgaG9tZSBwYWdlPC9oMT5cbiAgICAgIDxwPlBsZWFzZSBjbGljayBvbiBhbiBlbGVtZW50PC9wPlxuICAgICAgPGEgY2xhc3M9XCJyZWNvcmRcIlxuICAgICAgICAgbmctaHJlZj1cIiMvcHJvZmlsZS97eyByZWNvcmQuaWQgfX1cIlxuICAgICAgICAgbmctYW5pbWF0ZS1yZWY9XCJ7eyByZWNvcmQuaWQgfX1cIlxuICAgICAgICAgbmctcmVwZWF0PVwicmVjb3JkIGluIHJlY29yZHNcIj5cbiAgICAgICAge3sgcmVjb3JkLnRpdGxlIH19XG4gICAgICA8L2E+XG4gICAgPC9maWxlPlxuICAgIDxmaWxlIG5hbWU9XCJwcm9maWxlLmh0bWxcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJwcm9maWxlIHJlY29yZFwiIG5nLWFuaW1hdGUtcmVmPVwie3sgcHJvZmlsZS5pZCB9fVwiPlxuICAgICAgICB7eyBwcm9maWxlLnRpdGxlIH19XG4gICAgICA8L2Rpdj5cbiAgICA8L2ZpbGU+XG4gICAgPGZpbGUgbmFtZT1cImFuaW1hdGlvbnMuY3NzXCI+XG4gICAgICAucmVjb3JkIHtcbiAgICAgICAgZGlzcGxheTpibG9jaztcbiAgICAgICAgZm9udC1zaXplOjIwcHg7XG4gICAgICB9XG4gICAgICAucHJvZmlsZSB7XG4gICAgICAgIGJhY2tncm91bmQ6YmxhY2s7XG4gICAgICAgIGNvbG9yOndoaXRlO1xuICAgICAgICBmb250LXNpemU6MTAwcHg7XG4gICAgICB9XG4gICAgICAudmlldy1jb250YWluZXIge1xuICAgICAgICBwb3NpdGlvbjpyZWxhdGl2ZTtcbiAgICAgIH1cbiAgICAgIC52aWV3LWNvbnRhaW5lciA+IC52aWV3Lm5nLWFuaW1hdGUge1xuICAgICAgICBwb3NpdGlvbjphYnNvbHV0ZTtcbiAgICAgICAgdG9wOjA7XG4gICAgICAgIGxlZnQ6MDtcbiAgICAgICAgd2lkdGg6MTAwJTtcbiAgICAgICAgbWluLWhlaWdodDo1MDBweDtcbiAgICAgIH1cbiAgICAgIC52aWV3Lm5nLWVudGVyLCAudmlldy5uZy1sZWF2ZSxcbiAgICAgIC5yZWNvcmQubmctYW5jaG9yIHtcbiAgICAgICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gICAgICB9XG4gICAgICAudmlldy5uZy1lbnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKDEwMCUpO1xuICAgICAgfVxuICAgICAgLnZpZXcubmctZW50ZXIubmctZW50ZXItYWN0aXZlLCAudmlldy5uZy1sZWF2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKDAlKTtcbiAgICAgIH1cbiAgICAgIC52aWV3Lm5nLWxlYXZlLm5nLWxlYXZlLWFjdGl2ZSB7XG4gICAgICAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKC0xMDAlKTtcbiAgICAgIH1cbiAgICAgIC5yZWNvcmQubmctYW5jaG9yLW91dCB7XG4gICAgICAgIGJhY2tncm91bmQ6cmVkO1xuICAgICAgfVxuICAgIDwvZmlsZT5cbiAgPC9leGFtcGxlPlxuICpcbiAqICMjIyBIb3cgaXMgdGhlIGVsZW1lbnQgdHJhbnNwb3J0ZWQ/XG4gKlxuICogV2hlbiBhbiBhbmNob3IgYW5pbWF0aW9uIG9jY3VycywgbmdBbmltYXRlIHdpbGwgY2xvbmUgdGhlIHN0YXJ0aW5nIGVsZW1lbnQgYW5kIHBvc2l0aW9uIGl0IGV4YWN0bHkgd2hlcmUgdGhlIHN0YXJ0aW5nXG4gKiBlbGVtZW50IGlzIGxvY2F0ZWQgb24gc2NyZWVuIHZpYSBhYnNvbHV0ZSBwb3NpdGlvbmluZy4gVGhlIGNsb25lZCBlbGVtZW50IHdpbGwgYmUgcGxhY2VkIGluc2lkZSBvZiB0aGUgcm9vdCBlbGVtZW50XG4gKiBvZiB0aGUgYXBwbGljYXRpb24gKHdoZXJlIG5nLWFwcCB3YXMgZGVmaW5lZCkgYW5kIGFsbCBvZiB0aGUgQ1NTIGNsYXNzZXMgb2YgdGhlIHN0YXJ0aW5nIGVsZW1lbnQgd2lsbCBiZSBhcHBsaWVkLiBUaGVcbiAqIGVsZW1lbnQgd2lsbCB0aGVuIGFuaW1hdGUgaW50byB0aGUgYG91dGAgYW5kIGBpbmAgYW5pbWF0aW9ucyBhbmQgd2lsbCBldmVudHVhbGx5IHJlYWNoIHRoZSBjb29yZGluYXRlcyBhbmQgbWF0Y2hcbiAqIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBkZXN0aW5hdGlvbiBlbGVtZW50LiBEdXJpbmcgdGhlIGVudGlyZSBhbmltYXRpb24gYSBDU1MgY2xhc3Mgb2YgYC5uZy1hbmltYXRlLXNoaW1gIHdpbGwgYmUgYXBwbGllZFxuICogdG8gYm90aCB0aGUgc3RhcnRpbmcgYW5kIGRlc3RpbmF0aW9uIGVsZW1lbnRzIGluIG9yZGVyIHRvIGhpZGUgdGhlbSBmcm9tIGJlaW5nIHZpc2libGUgKHRoZSBDU1Mgc3R5bGluZyBmb3IgdGhlIGNsYXNzXG4gKiBpczogYHZpc2liaWxpdHk6aGlkZGVuYCkuIE9uY2UgdGhlIGFuY2hvciByZWFjaGVzIGl0cyBkZXN0aW5hdGlvbiB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhbmQgdGhlIGRlc3RpbmF0aW9uIGVsZW1lbnRcbiAqIHdpbGwgYmVjb21lIHZpc2libGUgc2luY2UgdGhlIHNoaW0gY2xhc3Mgd2lsbCBiZSByZW1vdmVkLlxuICpcbiAqICMjIyBIb3cgaXMgdGhlIG1vcnBoaW5nIGhhbmRsZWQ/XG4gKlxuICogQ1NTIEFuY2hvcmluZyByZWxpZXMgb24gdHJhbnNpdGlvbnMgYW5kIGtleWZyYW1lcyBhbmQgdGhlIGludGVybmFsIGNvZGUgaXMgaW50ZWxsaWdlbnQgZW5vdWdoIHRvIGZpZ3VyZSBvdXRcbiAqIHdoYXQgQ1NTIGNsYXNzZXMgZGlmZmVyIGJldHdlZW4gdGhlIHN0YXJ0aW5nIGVsZW1lbnQgYW5kIHRoZSBkZXN0aW5hdGlvbiBlbGVtZW50LiBUaGVzZSBkaWZmZXJlbnQgQ1NTIGNsYXNzZXNcbiAqIHdpbGwgYmUgYWRkZWQvcmVtb3ZlZCBvbiB0aGUgYW5jaG9yIGVsZW1lbnQgYW5kIGEgdHJhbnNpdGlvbiB3aWxsIGJlIGFwcGxpZWQgKHRoZSB0cmFuc2l0aW9uIHRoYXQgaXMgcHJvdmlkZWRcbiAqIGluIHRoZSBhbmNob3IgY2xhc3MpLiBMb25nIHN0b3J5IHNob3J0LCBuZ0FuaW1hdGUgd2lsbCBmaWd1cmUgb3V0IHdoYXQgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZSB3aGljaCB3aWxsXG4gKiBtYWtlIHRoZSB0cmFuc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFzIHNtb290aCBhbmQgYXV0b21hdGljIGFzIHBvc3NpYmxlLiBCZSBzdXJlIHRvIHVzZSBzaW1wbGUgQ1NTIGNsYXNzZXMgdGhhdFxuICogZG8gbm90IHJlbHkgb24gRE9NIG5lc3Rpbmcgc3RydWN0dXJlIHNvIHRoYXQgdGhlIGFuY2hvciBlbGVtZW50IGFwcGVhcnMgdGhlIHNhbWUgYXMgdGhlIHN0YXJ0aW5nIGVsZW1lbnQgKHNpbmNlXG4gKiB0aGUgY2xvbmVkIGVsZW1lbnQgaXMgcGxhY2VkIGluc2lkZSBvZiByb290IGVsZW1lbnQgd2hpY2ggaXMgbGlrZWx5IGNsb3NlIHRvIHRoZSBib2R5IGVsZW1lbnQpLlxuICpcbiAqIE5vdGUgdGhhdCBpZiB0aGUgcm9vdCBlbGVtZW50IGlzIG9uIHRoZSBgPGh0bWw+YCBlbGVtZW50IHRoZW4gdGhlIGNsb25lZCBub2RlIHdpbGwgYmUgcGxhY2VkIGluc2lkZSBvZiBib2R5LlxuICpcbiAqXG4gKiAjIyBVc2luZyAkYW5pbWF0ZSBpbiB5b3VyIGRpcmVjdGl2ZSBjb2RlXG4gKlxuICogU28gZmFyIHdlJ3ZlIGV4cGxvcmVkIGhvdyB0byBmZWVkIGluIGFuaW1hdGlvbnMgaW50byBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uLCBidXQgaG93IGRvIHdlIHRyaWdnZXIgYW5pbWF0aW9ucyB3aXRoaW4gb3VyIG93biBkaXJlY3RpdmVzIGluIG91ciBhcHBsaWNhdGlvbj9cbiAqIEJ5IGluamVjdGluZyB0aGUgYCRhbmltYXRlYCBzZXJ2aWNlIGludG8gb3VyIGRpcmVjdGl2ZSBjb2RlLCB3ZSBjYW4gdHJpZ2dlciBzdHJ1Y3R1cmFsIGFuZCBjbGFzcy1iYXNlZCBob29rcyB3aGljaCBjYW4gdGhlbiBiZSBjb25zdW1lZCBieSBhbmltYXRpb25zLiBMZXQnc1xuICogaW1hZ2luZSB3ZSBoYXZlIGEgZ3JlZXRpbmcgYm94IHRoYXQgc2hvd3MgYW5kIGhpZGVzIGl0c2VsZiB3aGVuIHRoZSBkYXRhIGNoYW5nZXNcbiAqXG4gKiBgYGBodG1sXG4gKiA8Z3JlZXRpbmctYm94IGFjdGl2ZT1cIm9uT3JPZmZcIj5IaSB0aGVyZTwvZ3JlZXRpbmctYm94PlxuICogYGBgXG4gKlxuICogYGBganNcbiAqIG5nTW9kdWxlLmRpcmVjdGl2ZSgnZ3JlZXRpbmdCb3gnLCBbJyRhbmltYXRlJywgZnVuY3Rpb24oJGFuaW1hdGUpIHtcbiAqICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICogICAgIGF0dHJzLiRvYnNlcnZlKCdhY3RpdmUnLCBmdW5jdGlvbih2YWx1ZSkge1xuICogICAgICAgdmFsdWUgPyAkYW5pbWF0ZS5hZGRDbGFzcyhlbGVtZW50LCAnb24nKSA6ICRhbmltYXRlLnJlbW92ZUNsYXNzKGVsZW1lbnQsICdvbicpO1xuICogICAgIH0pO1xuICogICB9KTtcbiAqIH1dKTtcbiAqIGBgYFxuICpcbiAqIE5vdyB0aGUgYG9uYCBDU1MgY2xhc3MgaXMgYWRkZWQgYW5kIHJlbW92ZWQgb24gdGhlIGdyZWV0aW5nIGJveCBjb21wb25lbnQuIE5vdyBpZiB3ZSBhZGQgYSBDU1MgY2xhc3Mgb24gdG9wIG9mIHRoZSBncmVldGluZyBib3ggZWxlbWVudFxuICogaW4gb3VyIEhUTUwgY29kZSB0aGVuIHdlIGNhbiB0cmlnZ2VyIGEgQ1NTIG9yIEpTIGFuaW1hdGlvbiB0byBoYXBwZW4uXG4gKlxuICogYGBgY3NzXG4gKiAvJiM0Mjsgbm9ybWFsbHkgd2Ugd291bGQgY3JlYXRlIGEgQ1NTIGNsYXNzIHRvIHJlZmVyZW5jZSBvbiB0aGUgZWxlbWVudCAmIzQyOy9cbiAqIGdyZWV0aW5nLWJveC5vbiB7IHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsOyBiYWNrZ3JvdW5kOmdyZWVuOyBjb2xvcjp3aGl0ZTsgfVxuICogYGBgXG4gKlxuICogVGhlIGAkYW5pbWF0ZWAgc2VydmljZSBjb250YWlucyBhIHZhcmlldHkgb2Ygb3RoZXIgbWV0aG9kcyBsaWtlIGBlbnRlcmAsIGBsZWF2ZWAsIGBhbmltYXRlYCBhbmQgYHNldENsYXNzYC4gVG8gbGVhcm4gbW9yZSBhYm91dCB3aGF0J3NcbiAqIHBvc3NpYmxlIGJlIHN1cmUgdG8gdmlzaXQgdGhlIHtAbGluayBuZy4kYW5pbWF0ZSAkYW5pbWF0ZSBzZXJ2aWNlIEFQSSBwYWdlfS5cbiAqXG4gKlxuICogIyMjIFByZXZlbnRpbmcgQ29sbGlzaW9ucyBXaXRoIFRoaXJkIFBhcnR5IExpYnJhcmllc1xuICpcbiAqIFNvbWUgdGhpcmQtcGFydHkgZnJhbWV3b3JrcyBwbGFjZSBhbmltYXRpb24gZHVyYXRpb24gZGVmYXVsdHMgYWNyb3NzIG1hbnkgZWxlbWVudCBvciBjbGFzc05hbWVcbiAqIHNlbGVjdG9ycyBpbiBvcmRlciB0byBtYWtlIHRoZWlyIGNvZGUgc21hbGwgYW5kIHJldXNlYWJsZS4gVGhpcyBjYW4gbGVhZCB0byBpc3N1ZXMgd2l0aCBuZ0FuaW1hdGUsIHdoaWNoXG4gKiBpcyBleHBlY3RpbmcgYWN0dWFsIGFuaW1hdGlvbnMgb24gdGhlc2UgZWxlbWVudHMgYW5kIGhhcyB0byB3YWl0IGZvciB0aGVpciBjb21wbGV0aW9uLlxuICpcbiAqIFlvdSBjYW4gcHJldmVudCB0aGlzIHVud2FudGVkIGJlaGF2aW9yIGJ5IHVzaW5nIGEgcHJlZml4IG9uIGFsbCB5b3VyIGFuaW1hdGlvbiBjbGFzc2VzOlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IHByZWZpeGVkIHdpdGggYW5pbWF0ZS0gJiM0MjsvXG4gKiAuYW5pbWF0ZS1mYWRlLWFkZC5hbmltYXRlLWZhZGUtYWRkLWFjdGl2ZSB7XG4gKiAgIHRyYW5zaXRpb246MXMgbGluZWFyIGFsbDtcbiAqICAgb3BhY2l0eTowO1xuICogfVxuICogYGBgXG4gKlxuICogWW91IHRoZW4gY29uZmlndXJlIGAkYW5pbWF0ZWAgdG8gZW5mb3JjZSB0aGlzIHByZWZpeDpcbiAqXG4gKiBgYGBqc1xuICogJGFuaW1hdGVQcm92aWRlci5jbGFzc05hbWVGaWx0ZXIoL2FuaW1hdGUtLyk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIGFsc28gbWF5IHByb3ZpZGUgeW91ciBhcHBsaWNhdGlvbiB3aXRoIGEgc3BlZWQgYm9vc3Qgc2luY2Ugb25seSBzcGVjaWZpYyBlbGVtZW50cyBjb250YWluaW5nIENTUyBjbGFzcyBwcmVmaXhcbiAqIHdpbGwgYmUgZXZhbHVhdGVkIGZvciBhbmltYXRpb24gd2hlbiBhbnkgRE9NIGNoYW5nZXMgb2NjdXIgaW4gdGhlIGFwcGxpY2F0aW9uLlxuICpcbiAqICMjIENhbGxiYWNrcyBhbmQgUHJvbWlzZXNcbiAqXG4gKiBXaGVuIGAkYW5pbWF0ZWAgaXMgY2FsbGVkIGl0IHJldHVybnMgYSBwcm9taXNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2FwdHVyZSB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGVuZGVkLiBUaGVyZWZvcmUgaWYgd2Ugd2VyZSB0byB0cmlnZ2VyXG4gKiBhbiBhbmltYXRpb24gKHdpdGhpbiBvdXIgZGlyZWN0aXZlIGNvZGUpIHRoZW4gd2UgY2FuIGNvbnRpbnVlIHBlcmZvcm1pbmcgZGlyZWN0aXZlIGFuZCBzY29wZSByZWxhdGVkIGFjdGl2aXRpZXMgYWZ0ZXIgdGhlIGFuaW1hdGlvbiBoYXNcbiAqIGVuZGVkIGJ5IGNoYWluaW5nIG9udG8gdGhlIHJldHVybmVkIHByb21pc2UgdGhhdCBhbmltYXRpb24gbWV0aG9kIHJldHVybnMuXG4gKlxuICogYGBganNcbiAqIC8vIHNvbWV3aGVyZSB3aXRoaW4gdGhlIGRlcHRocyBvZiB0aGUgZGlyZWN0aXZlXG4gKiAkYW5pbWF0ZS5lbnRlcihlbGVtZW50LCBwYXJlbnQpLnRoZW4oZnVuY3Rpb24oKSB7XG4gKiAgIC8vdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIChOb3RlIHRoYXQgZWFybGllciB2ZXJzaW9ucyBvZiBBbmd1bGFyIHByaW9yIHRvIHYxLjQgcmVxdWlyZWQgdGhlIHByb21pc2UgY29kZSB0byBiZSB3cmFwcGVkIHVzaW5nIGAkc2NvcGUuJGFwcGx5KC4uLilgLiBUaGlzIGlzIG5vdCB0aGUgY2FzZVxuICogYW55bW9yZS4pXG4gKlxuICogSW4gYWRkaXRpb24gdG8gdGhlIGFuaW1hdGlvbiBwcm9taXNlLCB3ZSBjYW4gYWxzbyBtYWtlIHVzZSBvZiBhbmltYXRpb24tcmVsYXRlZCBjYWxsYmFja3Mgd2l0aGluIG91ciBkaXJlY3RpdmVzIGFuZCBjb250cm9sbGVyIGNvZGUgYnkgcmVnaXN0ZXJpbmdcbiAqIGFuIGV2ZW50IGxpc3RlbmVyIHVzaW5nIHRoZSBgJGFuaW1hdGVgIHNlcnZpY2UuIExldCdzIHNheSBmb3IgZXhhbXBsZSB0aGF0IGFuIGFuaW1hdGlvbiB3YXMgdHJpZ2dlcmVkIG9uIG91ciB2aWV3XG4gKiByb3V0aW5nIGNvbnRyb2xsZXIgdG8gaG9vayBpbnRvIHRoYXQ6XG4gKlxuICogYGBganNcbiAqIG5nTW9kdWxlLmNvbnRyb2xsZXIoJ0hvbWVQYWdlQ29udHJvbGxlcicsIFsnJGFuaW1hdGUnLCBmdW5jdGlvbigkYW5pbWF0ZSkge1xuICogICAkYW5pbWF0ZS5vbignZW50ZXInLCBuZ1ZpZXdFbGVtZW50LCBmdW5jdGlvbihlbGVtZW50KSB7XG4gKiAgICAgLy8gdGhlIGFuaW1hdGlvbiBmb3IgdGhpcyByb3V0ZSBoYXMgY29tcGxldGVkXG4gKiAgIH1dKTtcbiAqIH1dKVxuICogYGBgXG4gKlxuICogKE5vdGUgdGhhdCB5b3Ugd2lsbCBuZWVkIHRvIHRyaWdnZXIgYSBkaWdlc3Qgd2l0aGluIHRoZSBjYWxsYmFjayB0byBnZXQgYW5ndWxhciB0byBub3RpY2UgYW55IHNjb3BlLXJlbGF0ZWQgY2hhbmdlcy4pXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGFuaW1hdGVcbiAqIEBraW5kIG9iamVjdFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVGhlIG5nQW5pbWF0ZSBgJGFuaW1hdGVgIHNlcnZpY2UgZG9jdW1lbnRhdGlvbiBpcyB0aGUgc2FtZSBmb3IgdGhlIGNvcmUgYCRhbmltYXRlYCBzZXJ2aWNlLlxuICpcbiAqIENsaWNrIGhlcmUge0BsaW5rIG5nLiRhbmltYXRlICRhbmltYXRlIHRvIGxlYXJuIG1vcmUgYWJvdXQgYW5pbWF0aW9ucyB3aXRoIGAkYW5pbWF0ZWB9LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbmdBbmltYXRlJywgW10pXG4gIC5wcm92aWRlcignJCRib2R5JywgJCRCb2R5UHJvdmlkZXIpXG5cbiAgLmRpcmVjdGl2ZSgnbmdBbmltYXRlQ2hpbGRyZW4nLCAkJEFuaW1hdGVDaGlsZHJlbkRpcmVjdGl2ZSlcblxuICAuZmFjdG9yeSgnJCRyQUZNdXRleCcsICQkckFGTXV0ZXhGYWN0b3J5KVxuXG4gIC5mYWN0b3J5KCckJEFuaW1hdGVSdW5uZXInLCAkJEFuaW1hdGVSdW5uZXJGYWN0b3J5KVxuXG4gIC5wcm92aWRlcignJCRhbmltYXRlUXVldWUnLCAkJEFuaW1hdGVRdWV1ZVByb3ZpZGVyKVxuICAucHJvdmlkZXIoJyQkYW5pbWF0aW9uJywgJCRBbmltYXRpb25Qcm92aWRlcilcblxuICAucHJvdmlkZXIoJyRhbmltYXRlQ3NzJywgJEFuaW1hdGVDc3NQcm92aWRlcilcbiAgLnByb3ZpZGVyKCckJGFuaW1hdGVDc3NEcml2ZXInLCAkJEFuaW1hdGVDc3NEcml2ZXJQcm92aWRlcilcblxuICAucHJvdmlkZXIoJyQkYW5pbWF0ZUpzJywgJCRBbmltYXRlSnNQcm92aWRlcilcbiAgLnByb3ZpZGVyKCckJGFuaW1hdGVKc0RyaXZlcicsICQkQW5pbWF0ZUpzRHJpdmVyUHJvdmlkZXIpO1xuXG5cbn0pKHdpbmRvdywgd2luZG93LmFuZ3VsYXIpO1xuIiwicmVxdWlyZSgnLi9hbmd1bGFyLWFuaW1hdGUnKTtcbm1vZHVsZS5leHBvcnRzID0gJ25nQW5pbWF0ZSc7XG4iLCIvKipcbiAqIEBsaWNlbnNlIEFuZ3VsYXJKUyB2MS40LjRcbiAqIChjKSAyMDEwLTIwMTUgR29vZ2xlLCBJbmMuIGh0dHA6Ly9hbmd1bGFyanMub3JnXG4gKiBMaWNlbnNlOiBNSVRcbiAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgYW5ndWxhciwgdW5kZWZpbmVkKSB7J3VzZSBzdHJpY3QnO1xuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAgICAgQW55IGNvbW1pdHMgdG8gdGhpcyBmaWxlIHNob3VsZCBiZSByZXZpZXdlZCB3aXRoIHNlY3VyaXR5IGluIG1pbmQuICAqXG4gKiAgIENoYW5nZXMgdG8gdGhpcyBmaWxlIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgc2VjdXJpdHkgdnVsbmVyYWJpbGl0aWVzLiAqXG4gKiAgICAgICAgICBBbiBhcHByb3ZhbCBmcm9tIDIgQ29yZSBtZW1iZXJzIHdpdGggaGlzdG9yeSBvZiBtb2RpZnlpbmcgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIGZpbGUgaXMgcmVxdWlyZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgRG9lcyB0aGUgY2hhbmdlIHNvbWVob3cgYWxsb3cgZm9yIGFyYml0cmFyeSBqYXZhc2NyaXB0IHRvIGJlIGV4ZWN1dGVkPyAqXG4gKiAgICBPciBhbGxvd3MgZm9yIHNvbWVvbmUgdG8gY2hhbmdlIHRoZSBwcm90b3R5cGUgb2YgYnVpbHQtaW4gb2JqZWN0cz8gICAqXG4gKiAgICAgT3IgZ2l2ZXMgdW5kZXNpcmVkIGFjY2VzcyB0byB2YXJpYWJsZXMgbGlrZXMgZG9jdW1lbnQgb3Igd2luZG93PyAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG52YXIgJHNhbml0aXplTWluRXJyID0gYW5ndWxhci4kJG1pbkVycignJHNhbml0aXplJyk7XG5cbi8qKlxuICogQG5nZG9jIG1vZHVsZVxuICogQG5hbWUgbmdTYW5pdGl6ZVxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogIyBuZ1Nhbml0aXplXG4gKlxuICogVGhlIGBuZ1Nhbml0aXplYCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25hbGl0eSB0byBzYW5pdGl6ZSBIVE1MLlxuICpcbiAqXG4gKiA8ZGl2IGRvYy1tb2R1bGUtY29tcG9uZW50cz1cIm5nU2FuaXRpemVcIj48L2Rpdj5cbiAqXG4gKiBTZWUge0BsaW5rIG5nU2FuaXRpemUuJHNhbml0aXplIGAkc2FuaXRpemVgfSBmb3IgdXNhZ2UuXG4gKi9cblxuLypcbiAqIEhUTUwgUGFyc2VyIEJ5IE1pc2tvIEhldmVyeSAobWlza29AaGV2ZXJ5LmNvbSlcbiAqIGJhc2VkIG9uOiAgSFRNTCBQYXJzZXIgQnkgSm9obiBSZXNpZyAoZWpvaG4ub3JnKVxuICogT3JpZ2luYWwgY29kZSBieSBFcmlrIEFydmlkc3NvbiwgTW96aWxsYSBQdWJsaWMgTGljZW5zZVxuICogaHR0cDovL2VyaWsuZWFlLm5ldC9zaW1wbGVodG1scGFyc2VyL3NpbXBsZWh0bWxwYXJzZXIuanNcbiAqXG4gKiAvLyBVc2UgbGlrZSBzbzpcbiAqIGh0bWxQYXJzZXIoaHRtbFN0cmluZywge1xuICogICAgIHN0YXJ0OiBmdW5jdGlvbih0YWcsIGF0dHJzLCB1bmFyeSkge30sXG4gKiAgICAgZW5kOiBmdW5jdGlvbih0YWcpIHt9LFxuICogICAgIGNoYXJzOiBmdW5jdGlvbih0ZXh0KSB7fSxcbiAqICAgICBjb21tZW50OiBmdW5jdGlvbih0ZXh0KSB7fVxuICogfSk7XG4gKlxuICovXG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJHNhbml0aXplXG4gKiBAa2luZCBmdW5jdGlvblxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogICBUaGUgaW5wdXQgaXMgc2FuaXRpemVkIGJ5IHBhcnNpbmcgdGhlIEhUTUwgaW50byB0b2tlbnMuIEFsbCBzYWZlIHRva2VucyAoZnJvbSBhIHdoaXRlbGlzdCkgYXJlXG4gKiAgIHRoZW4gc2VyaWFsaXplZCBiYWNrIHRvIHByb3Blcmx5IGVzY2FwZWQgaHRtbCBzdHJpbmcuIFRoaXMgbWVhbnMgdGhhdCBubyB1bnNhZmUgaW5wdXQgY2FuIG1ha2VcbiAqICAgaXQgaW50byB0aGUgcmV0dXJuZWQgc3RyaW5nLCBob3dldmVyLCBzaW5jZSBvdXIgcGFyc2VyIGlzIG1vcmUgc3RyaWN0IHRoYW4gYSB0eXBpY2FsIGJyb3dzZXJcbiAqICAgcGFyc2VyLCBpdCdzIHBvc3NpYmxlIHRoYXQgc29tZSBvYnNjdXJlIGlucHV0LCB3aGljaCB3b3VsZCBiZSByZWNvZ25pemVkIGFzIHZhbGlkIEhUTUwgYnkgYVxuICogICBicm93c2VyLCB3b24ndCBtYWtlIGl0IHRocm91Z2ggdGhlIHNhbml0aXplci4gVGhlIGlucHV0IG1heSBhbHNvIGNvbnRhaW4gU1ZHIG1hcmt1cC5cbiAqICAgVGhlIHdoaXRlbGlzdCBpcyBjb25maWd1cmVkIHVzaW5nIHRoZSBmdW5jdGlvbnMgYGFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0YCBhbmRcbiAqICAgYGltZ1NyY1Nhbml0aXphdGlvbldoaXRlbGlzdGAgb2Yge0BsaW5rIG5nLiRjb21waWxlUHJvdmlkZXIgYCRjb21waWxlUHJvdmlkZXJgfS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIGlucHV0LlxuICogQHJldHVybnMge3N0cmluZ30gU2FuaXRpemVkIEhUTUwuXG4gKlxuICogQGV4YW1wbGVcbiAgIDxleGFtcGxlIG1vZHVsZT1cInNhbml0aXplRXhhbXBsZVwiIGRlcHM9XCJhbmd1bGFyLXNhbml0aXplLmpzXCI+XG4gICA8ZmlsZSBuYW1lPVwiaW5kZXguaHRtbFwiPlxuICAgICA8c2NyaXB0PlxuICAgICAgICAgYW5ndWxhci5tb2R1bGUoJ3Nhbml0aXplRXhhbXBsZScsIFsnbmdTYW5pdGl6ZSddKVxuICAgICAgICAgICAuY29udHJvbGxlcignRXhhbXBsZUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckc2NlJywgZnVuY3Rpb24oJHNjb3BlLCAkc2NlKSB7XG4gICAgICAgICAgICAgJHNjb3BlLnNuaXBwZXQgPVxuICAgICAgICAgICAgICAgJzxwIHN0eWxlPVwiY29sb3I6Ymx1ZVwiPmFuIGh0bWxcXG4nICtcbiAgICAgICAgICAgICAgICc8ZW0gb25tb3VzZW92ZXI9XCJ0aGlzLnRleHRDb250ZW50PVxcJ1BXTjNEIVxcJ1wiPmNsaWNrIGhlcmU8L2VtPlxcbicgK1xuICAgICAgICAgICAgICAgJ3NuaXBwZXQ8L3A+JztcbiAgICAgICAgICAgICAkc2NvcGUuZGVsaWJlcmF0ZWx5VHJ1c3REYW5nZXJvdXNTbmlwcGV0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCgkc2NvcGUuc25pcHBldCk7XG4gICAgICAgICAgICAgfTtcbiAgICAgICAgICAgfV0pO1xuICAgICA8L3NjcmlwdD5cbiAgICAgPGRpdiBuZy1jb250cm9sbGVyPVwiRXhhbXBsZUNvbnRyb2xsZXJcIj5cbiAgICAgICAgU25pcHBldDogPHRleHRhcmVhIG5nLW1vZGVsPVwic25pcHBldFwiIGNvbHM9XCI2MFwiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT5cbiAgICAgICA8dGFibGU+XG4gICAgICAgICA8dHI+XG4gICAgICAgICAgIDx0ZD5EaXJlY3RpdmU8L3RkPlxuICAgICAgICAgICA8dGQ+SG93PC90ZD5cbiAgICAgICAgICAgPHRkPlNvdXJjZTwvdGQ+XG4gICAgICAgICAgIDx0ZD5SZW5kZXJlZDwvdGQ+XG4gICAgICAgICA8L3RyPlxuICAgICAgICAgPHRyIGlkPVwiYmluZC1odG1sLXdpdGgtc2FuaXRpemVcIj5cbiAgICAgICAgICAgPHRkPm5nLWJpbmQtaHRtbDwvdGQ+XG4gICAgICAgICAgIDx0ZD5BdXRvbWF0aWNhbGx5IHVzZXMgJHNhbml0aXplPC90ZD5cbiAgICAgICAgICAgPHRkPjxwcmU+Jmx0O2RpdiBuZy1iaW5kLWh0bWw9XCJzbmlwcGV0XCImZ3Q7PGJyLz4mbHQ7L2RpdiZndDs8L3ByZT48L3RkPlxuICAgICAgICAgICA8dGQ+PGRpdiBuZy1iaW5kLWh0bWw9XCJzbmlwcGV0XCI+PC9kaXY+PC90ZD5cbiAgICAgICAgIDwvdHI+XG4gICAgICAgICA8dHIgaWQ9XCJiaW5kLWh0bWwtd2l0aC10cnVzdFwiPlxuICAgICAgICAgICA8dGQ+bmctYmluZC1odG1sPC90ZD5cbiAgICAgICAgICAgPHRkPkJ5cGFzcyAkc2FuaXRpemUgYnkgZXhwbGljaXRseSB0cnVzdGluZyB0aGUgZGFuZ2Vyb3VzIHZhbHVlPC90ZD5cbiAgICAgICAgICAgPHRkPlxuICAgICAgICAgICA8cHJlPiZsdDtkaXYgbmctYmluZC1odG1sPVwiZGVsaWJlcmF0ZWx5VHJ1c3REYW5nZXJvdXNTbmlwcGV0KClcIiZndDtcbiZsdDsvZGl2Jmd0OzwvcHJlPlxuICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICA8dGQ+PGRpdiBuZy1iaW5kLWh0bWw9XCJkZWxpYmVyYXRlbHlUcnVzdERhbmdlcm91c1NuaXBwZXQoKVwiPjwvZGl2PjwvdGQ+XG4gICAgICAgICA8L3RyPlxuICAgICAgICAgPHRyIGlkPVwiYmluZC1kZWZhdWx0XCI+XG4gICAgICAgICAgIDx0ZD5uZy1iaW5kPC90ZD5cbiAgICAgICAgICAgPHRkPkF1dG9tYXRpY2FsbHkgZXNjYXBlczwvdGQ+XG4gICAgICAgICAgIDx0ZD48cHJlPiZsdDtkaXYgbmctYmluZD1cInNuaXBwZXRcIiZndDs8YnIvPiZsdDsvZGl2Jmd0OzwvcHJlPjwvdGQ+XG4gICAgICAgICAgIDx0ZD48ZGl2IG5nLWJpbmQ9XCJzbmlwcGV0XCI+PC9kaXY+PC90ZD5cbiAgICAgICAgIDwvdHI+XG4gICAgICAgPC90YWJsZT5cbiAgICAgICA8L2Rpdj5cbiAgIDwvZmlsZT5cbiAgIDxmaWxlIG5hbWU9XCJwcm90cmFjdG9yLmpzXCIgdHlwZT1cInByb3RyYWN0b3JcIj5cbiAgICAgaXQoJ3Nob3VsZCBzYW5pdGl6ZSB0aGUgaHRtbCBzbmlwcGV0IGJ5IGRlZmF1bHQnLCBmdW5jdGlvbigpIHtcbiAgICAgICBleHBlY3QoZWxlbWVudChieS5jc3MoJyNiaW5kLWh0bWwtd2l0aC1zYW5pdGl6ZSBkaXYnKSkuZ2V0SW5uZXJIdG1sKCkpLlxuICAgICAgICAgdG9CZSgnPHA+YW4gaHRtbFxcbjxlbT5jbGljayBoZXJlPC9lbT5cXG5zbmlwcGV0PC9wPicpO1xuICAgICB9KTtcblxuICAgICBpdCgnc2hvdWxkIGlubGluZSByYXcgc25pcHBldCBpZiBib3VuZCB0byBhIHRydXN0ZWQgdmFsdWUnLCBmdW5jdGlvbigpIHtcbiAgICAgICBleHBlY3QoZWxlbWVudChieS5jc3MoJyNiaW5kLWh0bWwtd2l0aC10cnVzdCBkaXYnKSkuZ2V0SW5uZXJIdG1sKCkpLlxuICAgICAgICAgdG9CZShcIjxwIHN0eWxlPVxcXCJjb2xvcjpibHVlXFxcIj5hbiBodG1sXFxuXCIgK1xuICAgICAgICAgICAgICBcIjxlbSBvbm1vdXNlb3Zlcj1cXFwidGhpcy50ZXh0Q29udGVudD0nUFdOM0QhJ1xcXCI+Y2xpY2sgaGVyZTwvZW0+XFxuXCIgK1xuICAgICAgICAgICAgICBcInNuaXBwZXQ8L3A+XCIpO1xuICAgICB9KTtcblxuICAgICBpdCgnc2hvdWxkIGVzY2FwZSBzbmlwcGV0IHdpdGhvdXQgYW55IGZpbHRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmNzcygnI2JpbmQtZGVmYXVsdCBkaXYnKSkuZ2V0SW5uZXJIdG1sKCkpLlxuICAgICAgICAgdG9CZShcIiZsdDtwIHN0eWxlPVxcXCJjb2xvcjpibHVlXFxcIiZndDthbiBodG1sXFxuXCIgK1xuICAgICAgICAgICAgICBcIiZsdDtlbSBvbm1vdXNlb3Zlcj1cXFwidGhpcy50ZXh0Q29udGVudD0nUFdOM0QhJ1xcXCImZ3Q7Y2xpY2sgaGVyZSZsdDsvZW0mZ3Q7XFxuXCIgK1xuICAgICAgICAgICAgICBcInNuaXBwZXQmbHQ7L3AmZ3Q7XCIpO1xuICAgICB9KTtcblxuICAgICBpdCgnc2hvdWxkIHVwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgIGVsZW1lbnQoYnkubW9kZWwoJ3NuaXBwZXQnKSkuY2xlYXIoKTtcbiAgICAgICBlbGVtZW50KGJ5Lm1vZGVsKCdzbmlwcGV0JykpLnNlbmRLZXlzKCduZXcgPGIgb25jbGljaz1cImFsZXJ0KDEpXCI+dGV4dDwvYj4nKTtcbiAgICAgICBleHBlY3QoZWxlbWVudChieS5jc3MoJyNiaW5kLWh0bWwtd2l0aC1zYW5pdGl6ZSBkaXYnKSkuZ2V0SW5uZXJIdG1sKCkpLlxuICAgICAgICAgdG9CZSgnbmV3IDxiPnRleHQ8L2I+Jyk7XG4gICAgICAgZXhwZWN0KGVsZW1lbnQoYnkuY3NzKCcjYmluZC1odG1sLXdpdGgtdHJ1c3QgZGl2JykpLmdldElubmVySHRtbCgpKS50b0JlKFxuICAgICAgICAgJ25ldyA8YiBvbmNsaWNrPVwiYWxlcnQoMSlcIj50ZXh0PC9iPicpO1xuICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmNzcygnI2JpbmQtZGVmYXVsdCBkaXYnKSkuZ2V0SW5uZXJIdG1sKCkpLnRvQmUoXG4gICAgICAgICBcIm5ldyAmbHQ7YiBvbmNsaWNrPVxcXCJhbGVydCgxKVxcXCImZ3Q7dGV4dCZsdDsvYiZndDtcIik7XG4gICAgIH0pO1xuICAgPC9maWxlPlxuICAgPC9leGFtcGxlPlxuICovXG5mdW5jdGlvbiAkU2FuaXRpemVQcm92aWRlcigpIHtcbiAgdGhpcy4kZ2V0ID0gWyckJHNhbml0aXplVXJpJywgZnVuY3Rpb24oJCRzYW5pdGl6ZVVyaSkge1xuICAgIHJldHVybiBmdW5jdGlvbihodG1sKSB7XG4gICAgICB2YXIgYnVmID0gW107XG4gICAgICBodG1sUGFyc2VyKGh0bWwsIGh0bWxTYW5pdGl6ZVdyaXRlcihidWYsIGZ1bmN0aW9uKHVyaSwgaXNJbWFnZSkge1xuICAgICAgICByZXR1cm4gIS9edW5zYWZlLy50ZXN0KCQkc2FuaXRpemVVcmkodXJpLCBpc0ltYWdlKSk7XG4gICAgICB9KSk7XG4gICAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICAgIH07XG4gIH1dO1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZVRleHQoY2hhcnMpIHtcbiAgdmFyIGJ1ZiA9IFtdO1xuICB2YXIgd3JpdGVyID0gaHRtbFNhbml0aXplV3JpdGVyKGJ1ZiwgYW5ndWxhci5ub29wKTtcbiAgd3JpdGVyLmNoYXJzKGNoYXJzKTtcbiAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbn1cblxuXG4vLyBSZWd1bGFyIEV4cHJlc3Npb25zIGZvciBwYXJzaW5nIHRhZ3MgYW5kIGF0dHJpYnV0ZXNcbnZhciBTVEFSVF9UQUdfUkVHRVhQID1cbiAgICAgICAvXjwoKD86W2EtekEtWl0pW1xcdzotXSopKCg/OlxccytbXFx3Oi1dKyg/Olxccyo9XFxzKig/Oig/OlwiW15cIl0qXCIpfCg/OidbXiddKicpfFtePlxcc10rKSk/KSopXFxzKihcXC8/KVxccyooPj8pLyxcbiAgRU5EX1RBR19SRUdFWFAgPSAvXjxcXC9cXHMqKFtcXHc6LV0rKVtePl0qPi8sXG4gIEFUVFJfUkVHRVhQID0gLyhbXFx3Oi1dKykoPzpcXHMqPVxccyooPzooPzpcIigoPzpbXlwiXSkqKVwiKXwoPzonKCg/OlteJ10pKiknKXwoW14+XFxzXSspKSk/L2csXG4gIEJFR0lOX1RBR19SRUdFWFAgPSAvXjwvLFxuICBCRUdJTkdfRU5EX1RBR0VfUkVHRVhQID0gL148XFwvLyxcbiAgQ09NTUVOVF9SRUdFWFAgPSAvPCEtLSguKj8pLS0+L2csXG4gIERPQ1RZUEVfUkVHRVhQID0gLzwhRE9DVFlQRShbXj5dKj8pPi9pLFxuICBDREFUQV9SRUdFWFAgPSAvPCFcXFtDREFUQVxcWyguKj8pXV0+L2csXG4gIFNVUlJPR0FURV9QQUlSX1JFR0VYUCA9IC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdL2csXG4gIC8vIE1hdGNoIGV2ZXJ5dGhpbmcgb3V0c2lkZSBvZiBub3JtYWwgY2hhcnMgYW5kIFwiIChxdW90ZSBjaGFyYWN0ZXIpXG4gIE5PTl9BTFBIQU5VTUVSSUNfUkVHRVhQID0gLyhbXlxcIy1+fCB8IV0pL2c7XG5cblxuLy8gR29vZCBzb3VyY2Ugb2YgaW5mbyBhYm91dCBlbGVtZW50cyBhbmQgYXR0cmlidXRlc1xuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI3NlbWFudGljc1xuLy8gaHR0cDovL3NpbW9uLmh0bWw1Lm9yZy9odG1sLWVsZW1lbnRzXG5cbi8vIFNhZmUgVm9pZCBFbGVtZW50cyAtIEhUTUw1XG4vLyBodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjL092ZXJ2aWV3Lmh0bWwjdm9pZC1lbGVtZW50c1xudmFyIHZvaWRFbGVtZW50cyA9IG1ha2VNYXAoXCJhcmVhLGJyLGNvbCxocixpbWcsd2JyXCIpO1xuXG4vLyBFbGVtZW50cyB0aGF0IHlvdSBjYW4sIGludGVudGlvbmFsbHksIGxlYXZlIG9wZW4gKGFuZCB3aGljaCBjbG9zZSB0aGVtc2VsdmVzKVxuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI29wdGlvbmFsLXRhZ3NcbnZhciBvcHRpb25hbEVuZFRhZ0Jsb2NrRWxlbWVudHMgPSBtYWtlTWFwKFwiY29sZ3JvdXAsZGQsZHQsbGkscCx0Ym9keSx0ZCx0Zm9vdCx0aCx0aGVhZCx0clwiKSxcbiAgICBvcHRpb25hbEVuZFRhZ0lubGluZUVsZW1lbnRzID0gbWFrZU1hcChcInJwLHJ0XCIpLFxuICAgIG9wdGlvbmFsRW5kVGFnRWxlbWVudHMgPSBhbmd1bGFyLmV4dGVuZCh7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWxFbmRUYWdJbmxpbmVFbGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWxFbmRUYWdCbG9ja0VsZW1lbnRzKTtcblxuLy8gU2FmZSBCbG9jayBFbGVtZW50cyAtIEhUTUw1XG52YXIgYmxvY2tFbGVtZW50cyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBvcHRpb25hbEVuZFRhZ0Jsb2NrRWxlbWVudHMsIG1ha2VNYXAoXCJhZGRyZXNzLGFydGljbGUsXCIgK1xuICAgICAgICBcImFzaWRlLGJsb2NrcXVvdGUsY2FwdGlvbixjZW50ZXIsZGVsLGRpcixkaXYsZGwsZmlndXJlLGZpZ2NhcHRpb24sZm9vdGVyLGgxLGgyLGgzLGg0LGg1LFwiICtcbiAgICAgICAgXCJoNixoZWFkZXIsaGdyb3VwLGhyLGlucyxtYXAsbWVudSxuYXYsb2wscHJlLHNjcmlwdCxzZWN0aW9uLHRhYmxlLHVsXCIpKTtcblxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTDVcbnZhciBpbmxpbmVFbGVtZW50cyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBvcHRpb25hbEVuZFRhZ0lubGluZUVsZW1lbnRzLCBtYWtlTWFwKFwiYSxhYmJyLGFjcm9ueW0sYixcIiArXG4gICAgICAgIFwiYmRpLGJkbyxiaWcsYnIsY2l0ZSxjb2RlLGRlbCxkZm4sZW0sZm9udCxpLGltZyxpbnMsa2JkLGxhYmVsLG1hcCxtYXJrLHEscnVieSxycCxydCxzLFwiICtcbiAgICAgICAgXCJzYW1wLHNtYWxsLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRpbWUsdHQsdSx2YXJcIikpO1xuXG4vLyBTVkcgRWxlbWVudHNcbi8vIGh0dHBzOi8vd2lraS53aGF0d2cub3JnL3dpa2kvU2FuaXRpemF0aW9uX3J1bGVzI3N2Z19FbGVtZW50c1xuLy8gTm90ZTogdGhlIGVsZW1lbnRzIGFuaW1hdGUsYW5pbWF0ZUNvbG9yLGFuaW1hdGVNb3Rpb24sYW5pbWF0ZVRyYW5zZm9ybSxzZXQgYXJlIGludGVudGlvbmFsbHkgb21pdHRlZC5cbi8vIFRoZXkgY2FuIHBvdGVudGlhbGx5IGFsbG93IGZvciBhcmJpdHJhcnkgamF2YXNjcmlwdCB0byBiZSBleGVjdXRlZC4gU2VlICMxMTI5MFxudmFyIHN2Z0VsZW1lbnRzID0gbWFrZU1hcChcImNpcmNsZSxkZWZzLGRlc2MsZWxsaXBzZSxmb250LWZhY2UsZm9udC1mYWNlLW5hbWUsZm9udC1mYWNlLXNyYyxnLGdseXBoLFwiICtcbiAgICAgICAgXCJoa2VybixpbWFnZSxsaW5lYXJHcmFkaWVudCxsaW5lLG1hcmtlcixtZXRhZGF0YSxtaXNzaW5nLWdseXBoLG1wYXRoLHBhdGgscG9seWdvbixwb2x5bGluZSxcIiArXG4gICAgICAgIFwicmFkaWFsR3JhZGllbnQscmVjdCxzdG9wLHN2Zyxzd2l0Y2gsdGV4dCx0aXRsZSx0c3Bhbix1c2VcIik7XG5cbi8vIFNwZWNpYWwgRWxlbWVudHMgKGNhbiBjb250YWluIGFueXRoaW5nKVxudmFyIHNwZWNpYWxFbGVtZW50cyA9IG1ha2VNYXAoXCJzY3JpcHQsc3R5bGVcIik7XG5cbnZhciB2YWxpZEVsZW1lbnRzID0gYW5ndWxhci5leHRlbmQoe30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvaWRFbGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tFbGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5saW5lRWxlbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsRW5kVGFnRWxlbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN2Z0VsZW1lbnRzKTtcblxuLy9BdHRyaWJ1dGVzIHRoYXQgaGF2ZSBocmVmIGFuZCBoZW5jZSBuZWVkIHRvIGJlIHNhbml0aXplZFxudmFyIHVyaUF0dHJzID0gbWFrZU1hcChcImJhY2tncm91bmQsY2l0ZSxocmVmLGxvbmdkZXNjLHNyYyx1c2VtYXAseGxpbms6aHJlZlwiKTtcblxudmFyIGh0bWxBdHRycyA9IG1ha2VNYXAoJ2FiYnIsYWxpZ24sYWx0LGF4aXMsYmdjb2xvcixib3JkZXIsY2VsbHBhZGRpbmcsY2VsbHNwYWNpbmcsY2xhc3MsY2xlYXIsJyArXG4gICAgJ2NvbG9yLGNvbHMsY29sc3Bhbixjb21wYWN0LGNvb3JkcyxkaXIsZmFjZSxoZWFkZXJzLGhlaWdodCxocmVmbGFuZyxoc3BhY2UsJyArXG4gICAgJ2lzbWFwLGxhbmcsbGFuZ3VhZ2Usbm9ocmVmLG5vd3JhcCxyZWwscmV2LHJvd3Mscm93c3BhbixydWxlcywnICtcbiAgICAnc2NvcGUsc2Nyb2xsaW5nLHNoYXBlLHNpemUsc3BhbixzdGFydCxzdW1tYXJ5LHRhYmluZGV4LHRhcmdldCx0aXRsZSx0eXBlLCcgK1xuICAgICd2YWxpZ24sdmFsdWUsdnNwYWNlLHdpZHRoJyk7XG5cbi8vIFNWRyBhdHRyaWJ1dGVzICh3aXRob3V0IFwiaWRcIiBhbmQgXCJuYW1lXCIgYXR0cmlidXRlcylcbi8vIGh0dHBzOi8vd2lraS53aGF0d2cub3JnL3dpa2kvU2FuaXRpemF0aW9uX3J1bGVzI3N2Z19BdHRyaWJ1dGVzXG52YXIgc3ZnQXR0cnMgPSBtYWtlTWFwKCdhY2NlbnQtaGVpZ2h0LGFjY3VtdWxhdGUsYWRkaXRpdmUsYWxwaGFiZXRpYyxhcmFiaWMtZm9ybSxhc2NlbnQsJyArXG4gICAgJ2Jhc2VQcm9maWxlLGJib3gsYmVnaW4sYnksY2FsY01vZGUsY2FwLWhlaWdodCxjbGFzcyxjb2xvcixjb2xvci1yZW5kZXJpbmcsY29udGVudCwnICtcbiAgICAnY3gsY3ksZCxkeCxkeSxkZXNjZW50LGRpc3BsYXksZHVyLGVuZCxmaWxsLGZpbGwtcnVsZSxmb250LWZhbWlseSxmb250LXNpemUsZm9udC1zdHJldGNoLCcgK1xuICAgICdmb250LXN0eWxlLGZvbnQtdmFyaWFudCxmb250LXdlaWdodCxmcm9tLGZ4LGZ5LGcxLGcyLGdseXBoLW5hbWUsZ3JhZGllbnRVbml0cyxoYW5naW5nLCcgK1xuICAgICdoZWlnaHQsaG9yaXotYWR2LXgsaG9yaXotb3JpZ2luLXgsaWRlb2dyYXBoaWMsayxrZXlQb2ludHMsa2V5U3BsaW5lcyxrZXlUaW1lcyxsYW5nLCcgK1xuICAgICdtYXJrZXItZW5kLG1hcmtlci1taWQsbWFya2VyLXN0YXJ0LG1hcmtlckhlaWdodCxtYXJrZXJVbml0cyxtYXJrZXJXaWR0aCxtYXRoZW1hdGljYWwsJyArXG4gICAgJ21heCxtaW4sb2Zmc2V0LG9wYWNpdHksb3JpZW50LG9yaWdpbixvdmVybGluZS1wb3NpdGlvbixvdmVybGluZS10aGlja25lc3MscGFub3NlLTEsJyArXG4gICAgJ3BhdGgscGF0aExlbmd0aCxwb2ludHMscHJlc2VydmVBc3BlY3RSYXRpbyxyLHJlZlgscmVmWSxyZXBlYXRDb3VudCxyZXBlYXREdXIsJyArXG4gICAgJ3JlcXVpcmVkRXh0ZW5zaW9ucyxyZXF1aXJlZEZlYXR1cmVzLHJlc3RhcnQscm90YXRlLHJ4LHJ5LHNsb3BlLHN0ZW1oLHN0ZW12LHN0b3AtY29sb3IsJyArXG4gICAgJ3N0b3Atb3BhY2l0eSxzdHJpa2V0aHJvdWdoLXBvc2l0aW9uLHN0cmlrZXRocm91Z2gtdGhpY2tuZXNzLHN0cm9rZSxzdHJva2UtZGFzaGFycmF5LCcgK1xuICAgICdzdHJva2UtZGFzaG9mZnNldCxzdHJva2UtbGluZWNhcCxzdHJva2UtbGluZWpvaW4sc3Ryb2tlLW1pdGVybGltaXQsc3Ryb2tlLW9wYWNpdHksJyArXG4gICAgJ3N0cm9rZS13aWR0aCxzeXN0ZW1MYW5ndWFnZSx0YXJnZXQsdGV4dC1hbmNob3IsdG8sdHJhbnNmb3JtLHR5cGUsdTEsdTIsdW5kZXJsaW5lLXBvc2l0aW9uLCcgK1xuICAgICd1bmRlcmxpbmUtdGhpY2tuZXNzLHVuaWNvZGUsdW5pY29kZS1yYW5nZSx1bml0cy1wZXItZW0sdmFsdWVzLHZlcnNpb24sdmlld0JveCx2aXNpYmlsaXR5LCcgK1xuICAgICd3aWR0aCx3aWR0aHMseCx4LWhlaWdodCx4MSx4Mix4bGluazphY3R1YXRlLHhsaW5rOmFyY3JvbGUseGxpbms6cm9sZSx4bGluazpzaG93LHhsaW5rOnRpdGxlLCcgK1xuICAgICd4bGluazp0eXBlLHhtbDpiYXNlLHhtbDpsYW5nLHhtbDpzcGFjZSx4bWxucyx4bWxuczp4bGluayx5LHkxLHkyLHpvb21BbmRQYW4nLCB0cnVlKTtcblxudmFyIHZhbGlkQXR0cnMgPSBhbmd1bGFyLmV4dGVuZCh7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJpQXR0cnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN2Z0F0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sQXR0cnMpO1xuXG5mdW5jdGlvbiBtYWtlTWFwKHN0ciwgbG93ZXJjYXNlS2V5cykge1xuICB2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KCcsJyksIGk7XG4gIGZvciAoaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIG9ialtsb3dlcmNhc2VLZXlzID8gYW5ndWxhci5sb3dlcmNhc2UoaXRlbXNbaV0pIDogaXRlbXNbaV1dID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG5cbi8qKlxuICogQGV4YW1wbGVcbiAqIGh0bWxQYXJzZXIoaHRtbFN0cmluZywge1xuICogICAgIHN0YXJ0OiBmdW5jdGlvbih0YWcsIGF0dHJzLCB1bmFyeSkge30sXG4gKiAgICAgZW5kOiBmdW5jdGlvbih0YWcpIHt9LFxuICogICAgIGNoYXJzOiBmdW5jdGlvbih0ZXh0KSB7fSxcbiAqICAgICBjb21tZW50OiBmdW5jdGlvbih0ZXh0KSB7fVxuICogfSk7XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgc3RyaW5nXG4gKiBAcGFyYW0ge29iamVjdH0gaGFuZGxlclxuICovXG5mdW5jdGlvbiBodG1sUGFyc2VyKGh0bWwsIGhhbmRsZXIpIHtcbiAgaWYgKHR5cGVvZiBodG1sICE9PSAnc3RyaW5nJykge1xuICAgIGlmIChodG1sID09PSBudWxsIHx8IHR5cGVvZiBodG1sID09PSAndW5kZWZpbmVkJykge1xuICAgICAgaHRtbCA9ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICBodG1sID0gJycgKyBodG1sO1xuICAgIH1cbiAgfVxuICB2YXIgaW5kZXgsIGNoYXJzLCBtYXRjaCwgc3RhY2sgPSBbXSwgbGFzdCA9IGh0bWwsIHRleHQ7XG4gIHN0YWNrLmxhc3QgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdOyB9O1xuXG4gIHdoaWxlIChodG1sKSB7XG4gICAgdGV4dCA9ICcnO1xuICAgIGNoYXJzID0gdHJ1ZTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBub3QgaW4gYSBzY3JpcHQgb3Igc3R5bGUgZWxlbWVudFxuICAgIGlmICghc3RhY2subGFzdCgpIHx8ICFzcGVjaWFsRWxlbWVudHNbc3RhY2subGFzdCgpXSkge1xuXG4gICAgICAvLyBDb21tZW50XG4gICAgICBpZiAoaHRtbC5pbmRleE9mKFwiPCEtLVwiKSA9PT0gMCkge1xuICAgICAgICAvLyBjb21tZW50cyBjb250YWluaW5nIC0tIGFyZSBub3QgYWxsb3dlZCB1bmxlc3MgdGhleSB0ZXJtaW5hdGUgdGhlIGNvbW1lbnRcbiAgICAgICAgaW5kZXggPSBodG1sLmluZGV4T2YoXCItLVwiLCA0KTtcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBodG1sLmxhc3RJbmRleE9mKFwiLS0+XCIsIGluZGV4KSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICBpZiAoaGFuZGxlci5jb21tZW50KSBoYW5kbGVyLmNvbW1lbnQoaHRtbC5zdWJzdHJpbmcoNCwgaW5kZXgpKTtcbiAgICAgICAgICBodG1sID0gaHRtbC5zdWJzdHJpbmcoaW5kZXggKyAzKTtcbiAgICAgICAgICBjaGFycyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAvLyBET0NUWVBFXG4gICAgICB9IGVsc2UgaWYgKERPQ1RZUEVfUkVHRVhQLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgbWF0Y2ggPSBodG1sLm1hdGNoKERPQ1RZUEVfUkVHRVhQKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKG1hdGNoWzBdLCAnJyk7XG4gICAgICAgICAgY2hhcnMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgLy8gZW5kIHRhZ1xuICAgICAgfSBlbHNlIGlmIChCRUdJTkdfRU5EX1RBR0VfUkVHRVhQLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgbWF0Y2ggPSBodG1sLm1hdGNoKEVORF9UQUdfUkVHRVhQKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBodG1sID0gaHRtbC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgICAgICBtYXRjaFswXS5yZXBsYWNlKEVORF9UQUdfUkVHRVhQLCBwYXJzZUVuZFRhZyk7XG4gICAgICAgICAgY2hhcnMgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAvLyBzdGFydCB0YWdcbiAgICAgIH0gZWxzZSBpZiAoQkVHSU5fVEFHX1JFR0VYUC50ZXN0KGh0bWwpKSB7XG4gICAgICAgIG1hdGNoID0gaHRtbC5tYXRjaChTVEFSVF9UQUdfUkVHRVhQKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAvLyBXZSBvbmx5IGhhdmUgYSB2YWxpZCBzdGFydC10YWcgaWYgdGhlcmUgaXMgYSAnPicuXG4gICAgICAgICAgaWYgKG1hdGNoWzRdKSB7XG4gICAgICAgICAgICBodG1sID0gaHRtbC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgICAgICAgIG1hdGNoWzBdLnJlcGxhY2UoU1RBUlRfVEFHX1JFR0VYUCwgcGFyc2VTdGFydFRhZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoYXJzID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gbm8gZW5kaW5nIHRhZyBmb3VuZCAtLS0gdGhpcyBwaWVjZSBzaG91bGQgYmUgZW5jb2RlZCBhcyBhbiBlbnRpdHkuXG4gICAgICAgICAgdGV4dCArPSAnPCc7XG4gICAgICAgICAgaHRtbCA9IGh0bWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFycykge1xuICAgICAgICBpbmRleCA9IGh0bWwuaW5kZXhPZihcIjxcIik7XG5cbiAgICAgICAgdGV4dCArPSBpbmRleCA8IDAgPyBodG1sIDogaHRtbC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICBodG1sID0gaW5kZXggPCAwID8gXCJcIiA6IGh0bWwuc3Vic3RyaW5nKGluZGV4KTtcblxuICAgICAgICBpZiAoaGFuZGxlci5jaGFycykgaGFuZGxlci5jaGFycyhkZWNvZGVFbnRpdGllcyh0ZXh0KSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSUUgdmVyc2lvbnMgOSBhbmQgMTAgZG8gbm90IHVuZGVyc3RhbmQgdGhlIHJlZ2V4ICdbXl0nLCBzbyB1c2luZyBhIHdvcmthcm91bmQgd2l0aCBbXFxXXFx3XS5cbiAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UobmV3IFJlZ0V4cChcIihbXFxcXFdcXFxcd10qKTxcXFxccypcXFxcL1xcXFxzKlwiICsgc3RhY2subGFzdCgpICsgXCJbXj5dKj5cIiwgJ2knKSxcbiAgICAgICAgZnVuY3Rpb24oYWxsLCB0ZXh0KSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShDT01NRU5UX1JFR0VYUCwgXCIkMVwiKS5yZXBsYWNlKENEQVRBX1JFR0VYUCwgXCIkMVwiKTtcblxuICAgICAgICAgIGlmIChoYW5kbGVyLmNoYXJzKSBoYW5kbGVyLmNoYXJzKGRlY29kZUVudGl0aWVzKHRleHQpKTtcblxuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfSk7XG5cbiAgICAgIHBhcnNlRW5kVGFnKFwiXCIsIHN0YWNrLmxhc3QoKSk7XG4gICAgfVxuXG4gICAgaWYgKGh0bWwgPT0gbGFzdCkge1xuICAgICAgdGhyb3cgJHNhbml0aXplTWluRXJyKCdiYWRwYXJzZScsIFwiVGhlIHNhbml0aXplciB3YXMgdW5hYmxlIHRvIHBhcnNlIHRoZSBmb2xsb3dpbmcgYmxvY2sgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib2YgaHRtbDogezB9XCIsIGh0bWwpO1xuICAgIH1cbiAgICBsYXN0ID0gaHRtbDtcbiAgfVxuXG4gIC8vIENsZWFuIHVwIGFueSByZW1haW5pbmcgdGFnc1xuICBwYXJzZUVuZFRhZygpO1xuXG4gIGZ1bmN0aW9uIHBhcnNlU3RhcnRUYWcodGFnLCB0YWdOYW1lLCByZXN0LCB1bmFyeSkge1xuICAgIHRhZ05hbWUgPSBhbmd1bGFyLmxvd2VyY2FzZSh0YWdOYW1lKTtcbiAgICBpZiAoYmxvY2tFbGVtZW50c1t0YWdOYW1lXSkge1xuICAgICAgd2hpbGUgKHN0YWNrLmxhc3QoKSAmJiBpbmxpbmVFbGVtZW50c1tzdGFjay5sYXN0KCldKSB7XG4gICAgICAgIHBhcnNlRW5kVGFnKFwiXCIsIHN0YWNrLmxhc3QoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbmFsRW5kVGFnRWxlbWVudHNbdGFnTmFtZV0gJiYgc3RhY2subGFzdCgpID09IHRhZ05hbWUpIHtcbiAgICAgIHBhcnNlRW5kVGFnKFwiXCIsIHRhZ05hbWUpO1xuICAgIH1cblxuICAgIHVuYXJ5ID0gdm9pZEVsZW1lbnRzW3RhZ05hbWVdIHx8ICEhdW5hcnk7XG5cbiAgICBpZiAoIXVuYXJ5KSB7XG4gICAgICBzdGFjay5wdXNoKHRhZ05hbWUpO1xuICAgIH1cblxuICAgIHZhciBhdHRycyA9IHt9O1xuXG4gICAgcmVzdC5yZXBsYWNlKEFUVFJfUkVHRVhQLFxuICAgICAgZnVuY3Rpb24obWF0Y2gsIG5hbWUsIGRvdWJsZVF1b3RlZFZhbHVlLCBzaW5nbGVRdW90ZWRWYWx1ZSwgdW5xdW90ZWRWYWx1ZSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBkb3VibGVRdW90ZWRWYWx1ZVxuICAgICAgICAgIHx8IHNpbmdsZVF1b3RlZFZhbHVlXG4gICAgICAgICAgfHwgdW5xdW90ZWRWYWx1ZVxuICAgICAgICAgIHx8ICcnO1xuXG4gICAgICAgIGF0dHJzW25hbWVdID0gZGVjb2RlRW50aXRpZXModmFsdWUpO1xuICAgIH0pO1xuICAgIGlmIChoYW5kbGVyLnN0YXJ0KSBoYW5kbGVyLnN0YXJ0KHRhZ05hbWUsIGF0dHJzLCB1bmFyeSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUVuZFRhZyh0YWcsIHRhZ05hbWUpIHtcbiAgICB2YXIgcG9zID0gMCwgaTtcbiAgICB0YWdOYW1lID0gYW5ndWxhci5sb3dlcmNhc2UodGFnTmFtZSk7XG4gICAgaWYgKHRhZ05hbWUpIHtcbiAgICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3Qgb3BlbmVkIHRhZyBvZiB0aGUgc2FtZSB0eXBlXG4gICAgICBmb3IgKHBvcyA9IHN0YWNrLmxlbmd0aCAtIDE7IHBvcyA+PSAwOyBwb3MtLSkge1xuICAgICAgICBpZiAoc3RhY2tbcG9zXSA9PSB0YWdOYW1lKSBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zID49IDApIHtcbiAgICAgIC8vIENsb3NlIGFsbCB0aGUgb3BlbiBlbGVtZW50cywgdXAgdGhlIHN0YWNrXG4gICAgICBmb3IgKGkgPSBzdGFjay5sZW5ndGggLSAxOyBpID49IHBvczsgaS0tKVxuICAgICAgICBpZiAoaGFuZGxlci5lbmQpIGhhbmRsZXIuZW5kKHN0YWNrW2ldKTtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBvcGVuIGVsZW1lbnRzIGZyb20gdGhlIHN0YWNrXG4gICAgICBzdGFjay5sZW5ndGggPSBwb3M7XG4gICAgfVxuICB9XG59XG5cbnZhciBoaWRkZW5QcmU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbi8qKlxuICogZGVjb2RlcyBhbGwgZW50aXRpZXMgaW50byByZWd1bGFyIHN0cmluZ1xuICogQHBhcmFtIHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIHN0cmluZyB3aXRoIGRlY29kZWQgZW50aXRpZXMuXG4gKi9cbmZ1bmN0aW9uIGRlY29kZUVudGl0aWVzKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpIHsgcmV0dXJuICcnOyB9XG5cbiAgaGlkZGVuUHJlLmlubmVySFRNTCA9IHZhbHVlLnJlcGxhY2UoLzwvZyxcIiZsdDtcIik7XG4gIC8vIGlubmVyVGV4dCBkZXBlbmRzIG9uIHN0eWxpbmcgYXMgaXQgZG9lc24ndCBkaXNwbGF5IGhpZGRlbiBlbGVtZW50cy5cbiAgLy8gVGhlcmVmb3JlLCBpdCdzIGJldHRlciB0byB1c2UgdGV4dENvbnRlbnQgbm90IHRvIGNhdXNlIHVubmVjZXNzYXJ5IHJlZmxvd3MuXG4gIHJldHVybiBoaWRkZW5QcmUudGV4dENvbnRlbnQ7XG59XG5cbi8qKlxuICogRXNjYXBlcyBhbGwgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNoYXJhY3RlcnMsIHNvIHRoYXQgdGhlXG4gKiByZXN1bHRpbmcgc3RyaW5nIGNhbiBiZSBzYWZlbHkgaW5zZXJ0ZWQgaW50byBhdHRyaWJ1dGUgb3JcbiAqIGVsZW1lbnQgdGV4dC5cbiAqIEBwYXJhbSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ30gZXNjYXBlZCB0ZXh0XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUVudGl0aWVzKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5cbiAgICByZXBsYWNlKC8mL2csICcmYW1wOycpLlxuICAgIHJlcGxhY2UoU1VSUk9HQVRFX1BBSVJfUkVHRVhQLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIGhpID0gdmFsdWUuY2hhckNvZGVBdCgwKTtcbiAgICAgIHZhciBsb3cgPSB2YWx1ZS5jaGFyQ29kZUF0KDEpO1xuICAgICAgcmV0dXJuICcmIycgKyAoKChoaSAtIDB4RDgwMCkgKiAweDQwMCkgKyAobG93IC0gMHhEQzAwKSArIDB4MTAwMDApICsgJzsnO1xuICAgIH0pLlxuICAgIHJlcGxhY2UoTk9OX0FMUEhBTlVNRVJJQ19SRUdFWFAsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gJyYjJyArIHZhbHVlLmNoYXJDb2RlQXQoMCkgKyAnOyc7XG4gICAgfSkuXG4gICAgcmVwbGFjZSgvPC9nLCAnJmx0OycpLlxuICAgIHJlcGxhY2UoLz4vZywgJyZndDsnKTtcbn1cblxuLyoqXG4gKiBjcmVhdGUgYW4gSFRNTC9YTUwgd3JpdGVyIHdoaWNoIHdyaXRlcyB0byBidWZmZXJcbiAqIEBwYXJhbSB7QXJyYXl9IGJ1ZiB1c2UgYnVmLmphaW4oJycpIHRvIGdldCBvdXQgc2FuaXRpemVkIGh0bWwgc3RyaW5nXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBpbiB0aGUgZm9ybSBvZiB7XG4gKiAgICAgc3RhcnQ6IGZ1bmN0aW9uKHRhZywgYXR0cnMsIHVuYXJ5KSB7fSxcbiAqICAgICBlbmQ6IGZ1bmN0aW9uKHRhZykge30sXG4gKiAgICAgY2hhcnM6IGZ1bmN0aW9uKHRleHQpIHt9LFxuICogICAgIGNvbW1lbnQ6IGZ1bmN0aW9uKHRleHQpIHt9XG4gKiB9XG4gKi9cbmZ1bmN0aW9uIGh0bWxTYW5pdGl6ZVdyaXRlcihidWYsIHVyaVZhbGlkYXRvcikge1xuICB2YXIgaWdub3JlID0gZmFsc2U7XG4gIHZhciBvdXQgPSBhbmd1bGFyLmJpbmQoYnVmLCBidWYucHVzaCk7XG4gIHJldHVybiB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uKHRhZywgYXR0cnMsIHVuYXJ5KSB7XG4gICAgICB0YWcgPSBhbmd1bGFyLmxvd2VyY2FzZSh0YWcpO1xuICAgICAgaWYgKCFpZ25vcmUgJiYgc3BlY2lhbEVsZW1lbnRzW3RhZ10pIHtcbiAgICAgICAgaWdub3JlID0gdGFnO1xuICAgICAgfVxuICAgICAgaWYgKCFpZ25vcmUgJiYgdmFsaWRFbGVtZW50c1t0YWddID09PSB0cnVlKSB7XG4gICAgICAgIG91dCgnPCcpO1xuICAgICAgICBvdXQodGFnKTtcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGF0dHJzLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgdmFyIGxrZXk9YW5ndWxhci5sb3dlcmNhc2Uoa2V5KTtcbiAgICAgICAgICB2YXIgaXNJbWFnZSA9ICh0YWcgPT09ICdpbWcnICYmIGxrZXkgPT09ICdzcmMnKSB8fCAobGtleSA9PT0gJ2JhY2tncm91bmQnKTtcbiAgICAgICAgICBpZiAodmFsaWRBdHRyc1tsa2V5XSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgKHVyaUF0dHJzW2xrZXldICE9PSB0cnVlIHx8IHVyaVZhbGlkYXRvcih2YWx1ZSwgaXNJbWFnZSkpKSB7XG4gICAgICAgICAgICBvdXQoJyAnKTtcbiAgICAgICAgICAgIG91dChrZXkpO1xuICAgICAgICAgICAgb3V0KCc9XCInKTtcbiAgICAgICAgICAgIG91dChlbmNvZGVFbnRpdGllcyh2YWx1ZSkpO1xuICAgICAgICAgICAgb3V0KCdcIicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG91dCh1bmFyeSA/ICcvPicgOiAnPicpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW5kOiBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgdGFnID0gYW5ndWxhci5sb3dlcmNhc2UodGFnKTtcbiAgICAgICAgaWYgKCFpZ25vcmUgJiYgdmFsaWRFbGVtZW50c1t0YWddID09PSB0cnVlKSB7XG4gICAgICAgICAgb3V0KCc8LycpO1xuICAgICAgICAgIG91dCh0YWcpO1xuICAgICAgICAgIG91dCgnPicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YWcgPT0gaWdub3JlKSB7XG4gICAgICAgICAgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgY2hhcnM6IGZ1bmN0aW9uKGNoYXJzKSB7XG4gICAgICAgIGlmICghaWdub3JlKSB7XG4gICAgICAgICAgb3V0KGVuY29kZUVudGl0aWVzKGNoYXJzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcbn1cblxuXG4vLyBkZWZpbmUgbmdTYW5pdGl6ZSBtb2R1bGUgYW5kIHJlZ2lzdGVyICRzYW5pdGl6ZSBzZXJ2aWNlXG5hbmd1bGFyLm1vZHVsZSgnbmdTYW5pdGl6ZScsIFtdKS5wcm92aWRlcignJHNhbml0aXplJywgJFNhbml0aXplUHJvdmlkZXIpO1xuXG4vKiBnbG9iYWwgc2FuaXRpemVUZXh0OiBmYWxzZSAqL1xuXG4vKipcbiAqIEBuZ2RvYyBmaWx0ZXJcbiAqIEBuYW1lIGxpbmt5XG4gKiBAa2luZCBmdW5jdGlvblxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogRmluZHMgbGlua3MgaW4gdGV4dCBpbnB1dCBhbmQgdHVybnMgdGhlbSBpbnRvIGh0bWwgbGlua3MuIFN1cHBvcnRzIGh0dHAvaHR0cHMvZnRwL21haWx0byBhbmRcbiAqIHBsYWluIGVtYWlsIGFkZHJlc3MgbGlua3MuXG4gKlxuICogUmVxdWlyZXMgdGhlIHtAbGluayBuZ1Nhbml0aXplIGBuZ1Nhbml0aXplYH0gbW9kdWxlIHRvIGJlIGluc3RhbGxlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBJbnB1dCB0ZXh0LlxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldCBXaW5kb3cgKF9ibGFua3xfc2VsZnxfcGFyZW50fF90b3ApIG9yIG5hbWVkIGZyYW1lIHRvIG9wZW4gbGlua3MgaW4uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIdG1sLWxpbmtpZmllZCB0ZXh0LlxuICpcbiAqIEB1c2FnZVxuICAgPHNwYW4gbmctYmluZC1odG1sPVwibGlua3lfZXhwcmVzc2lvbiB8IGxpbmt5XCI+PC9zcGFuPlxuICpcbiAqIEBleGFtcGxlXG4gICA8ZXhhbXBsZSBtb2R1bGU9XCJsaW5reUV4YW1wbGVcIiBkZXBzPVwiYW5ndWxhci1zYW5pdGl6ZS5qc1wiPlxuICAgICA8ZmlsZSBuYW1lPVwiaW5kZXguaHRtbFwiPlxuICAgICAgIDxzY3JpcHQ+XG4gICAgICAgICBhbmd1bGFyLm1vZHVsZSgnbGlua3lFeGFtcGxlJywgWyduZ1Nhbml0aXplJ10pXG4gICAgICAgICAgIC5jb250cm9sbGVyKCdFeGFtcGxlQ29udHJvbGxlcicsIFsnJHNjb3BlJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAgICAgICAgJHNjb3BlLnNuaXBwZXQgPVxuICAgICAgICAgICAgICAgJ1ByZXR0eSB0ZXh0IHdpdGggc29tZSBsaW5rczpcXG4nK1xuICAgICAgICAgICAgICAgJ2h0dHA6Ly9hbmd1bGFyanMub3JnLyxcXG4nK1xuICAgICAgICAgICAgICAgJ21haWx0bzp1c0Bzb21ld2hlcmUub3JnLFxcbicrXG4gICAgICAgICAgICAgICAnYW5vdGhlckBzb21ld2hlcmUub3JnLFxcbicrXG4gICAgICAgICAgICAgICAnYW5kIG9uZSBtb3JlOiBmdHA6Ly8xMjcuMC4wLjEvLic7XG4gICAgICAgICAgICAgJHNjb3BlLnNuaXBwZXRXaXRoVGFyZ2V0ID0gJ2h0dHA6Ly9hbmd1bGFyanMub3JnLyc7XG4gICAgICAgICAgIH1dKTtcbiAgICAgICA8L3NjcmlwdD5cbiAgICAgICA8ZGl2IG5nLWNvbnRyb2xsZXI9XCJFeGFtcGxlQ29udHJvbGxlclwiPlxuICAgICAgIFNuaXBwZXQ6IDx0ZXh0YXJlYSBuZy1tb2RlbD1cInNuaXBwZXRcIiBjb2xzPVwiNjBcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+XG4gICAgICAgPHRhYmxlPlxuICAgICAgICAgPHRyPlxuICAgICAgICAgICA8dGQ+RmlsdGVyPC90ZD5cbiAgICAgICAgICAgPHRkPlNvdXJjZTwvdGQ+XG4gICAgICAgICAgIDx0ZD5SZW5kZXJlZDwvdGQ+XG4gICAgICAgICA8L3RyPlxuICAgICAgICAgPHRyIGlkPVwibGlua3ktZmlsdGVyXCI+XG4gICAgICAgICAgIDx0ZD5saW5reSBmaWx0ZXI8L3RkPlxuICAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICAgPHByZT4mbHQ7ZGl2IG5nLWJpbmQtaHRtbD1cInNuaXBwZXQgfCBsaW5reVwiJmd0Ozxicj4mbHQ7L2RpdiZndDs8L3ByZT5cbiAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgPHRkPlxuICAgICAgICAgICAgIDxkaXYgbmctYmluZC1odG1sPVwic25pcHBldCB8IGxpbmt5XCI+PC9kaXY+XG4gICAgICAgICAgIDwvdGQ+XG4gICAgICAgICA8L3RyPlxuICAgICAgICAgPHRyIGlkPVwibGlua3ktdGFyZ2V0XCI+XG4gICAgICAgICAgPHRkPmxpbmt5IHRhcmdldDwvdGQ+XG4gICAgICAgICAgPHRkPlxuICAgICAgICAgICAgPHByZT4mbHQ7ZGl2IG5nLWJpbmQtaHRtbD1cInNuaXBwZXRXaXRoVGFyZ2V0IHwgbGlua3k6J19ibGFuaydcIiZndDs8YnI+Jmx0Oy9kaXYmZ3Q7PC9wcmU+XG4gICAgICAgICAgPC90ZD5cbiAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICA8ZGl2IG5nLWJpbmQtaHRtbD1cInNuaXBwZXRXaXRoVGFyZ2V0IHwgbGlua3k6J19ibGFuaydcIj48L2Rpdj5cbiAgICAgICAgICA8L3RkPlxuICAgICAgICAgPC90cj5cbiAgICAgICAgIDx0ciBpZD1cImVzY2FwZWQtaHRtbFwiPlxuICAgICAgICAgICA8dGQ+bm8gZmlsdGVyPC90ZD5cbiAgICAgICAgICAgPHRkPjxwcmU+Jmx0O2RpdiBuZy1iaW5kPVwic25pcHBldFwiJmd0Ozxicj4mbHQ7L2RpdiZndDs8L3ByZT48L3RkPlxuICAgICAgICAgICA8dGQ+PGRpdiBuZy1iaW5kPVwic25pcHBldFwiPjwvZGl2PjwvdGQ+XG4gICAgICAgICA8L3RyPlxuICAgICAgIDwvdGFibGU+XG4gICAgIDwvZmlsZT5cbiAgICAgPGZpbGUgbmFtZT1cInByb3RyYWN0b3IuanNcIiB0eXBlPVwicHJvdHJhY3RvclwiPlxuICAgICAgIGl0KCdzaG91bGQgbGlua2lmeSB0aGUgc25pcHBldCB3aXRoIHVybHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmlkKCdsaW5reS1maWx0ZXInKSkuZWxlbWVudChieS5iaW5kaW5nKCdzbmlwcGV0IHwgbGlua3knKSkuZ2V0VGV4dCgpKS5cbiAgICAgICAgICAgICB0b0JlKCdQcmV0dHkgdGV4dCB3aXRoIHNvbWUgbGlua3M6IGh0dHA6Ly9hbmd1bGFyanMub3JnLywgdXNAc29tZXdoZXJlLm9yZywgJyArXG4gICAgICAgICAgICAgICAgICAnYW5vdGhlckBzb21ld2hlcmUub3JnLCBhbmQgb25lIG1vcmU6IGZ0cDovLzEyNy4wLjAuMS8uJyk7XG4gICAgICAgICBleHBlY3QoZWxlbWVudC5hbGwoYnkuY3NzKCcjbGlua3ktZmlsdGVyIGEnKSkuY291bnQoKSkudG9FcXVhbCg0KTtcbiAgICAgICB9KTtcblxuICAgICAgIGl0KCdzaG91bGQgbm90IGxpbmtpZnkgc25pcHBldCB3aXRob3V0IHRoZSBsaW5reSBmaWx0ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmlkKCdlc2NhcGVkLWh0bWwnKSkuZWxlbWVudChieS5iaW5kaW5nKCdzbmlwcGV0JykpLmdldFRleHQoKSkuXG4gICAgICAgICAgICAgdG9CZSgnUHJldHR5IHRleHQgd2l0aCBzb21lIGxpbmtzOiBodHRwOi8vYW5ndWxhcmpzLm9yZy8sIG1haWx0bzp1c0Bzb21ld2hlcmUub3JnLCAnICtcbiAgICAgICAgICAgICAgICAgICdhbm90aGVyQHNvbWV3aGVyZS5vcmcsIGFuZCBvbmUgbW9yZTogZnRwOi8vMTI3LjAuMC4xLy4nKTtcbiAgICAgICAgIGV4cGVjdChlbGVtZW50LmFsbChieS5jc3MoJyNlc2NhcGVkLWh0bWwgYScpKS5jb3VudCgpKS50b0VxdWFsKDApO1xuICAgICAgIH0pO1xuXG4gICAgICAgaXQoJ3Nob3VsZCB1cGRhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIGVsZW1lbnQoYnkubW9kZWwoJ3NuaXBwZXQnKSkuY2xlYXIoKTtcbiAgICAgICAgIGVsZW1lbnQoYnkubW9kZWwoJ3NuaXBwZXQnKSkuc2VuZEtleXMoJ25ldyBodHRwOi8vbGluay4nKTtcbiAgICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmlkKCdsaW5reS1maWx0ZXInKSkuZWxlbWVudChieS5iaW5kaW5nKCdzbmlwcGV0IHwgbGlua3knKSkuZ2V0VGV4dCgpKS5cbiAgICAgICAgICAgICB0b0JlKCduZXcgaHR0cDovL2xpbmsuJyk7XG4gICAgICAgICBleHBlY3QoZWxlbWVudC5hbGwoYnkuY3NzKCcjbGlua3ktZmlsdGVyIGEnKSkuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICAgICAgIGV4cGVjdChlbGVtZW50KGJ5LmlkKCdlc2NhcGVkLWh0bWwnKSkuZWxlbWVudChieS5iaW5kaW5nKCdzbmlwcGV0JykpLmdldFRleHQoKSlcbiAgICAgICAgICAgICAudG9CZSgnbmV3IGh0dHA6Ly9saW5rLicpO1xuICAgICAgIH0pO1xuXG4gICAgICAgaXQoJ3Nob3VsZCB3b3JrIHdpdGggdGhlIHRhcmdldCBwcm9wZXJ0eScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBlY3QoZWxlbWVudChieS5pZCgnbGlua3ktdGFyZ2V0JykpLlxuICAgICAgICAgICAgZWxlbWVudChieS5iaW5kaW5nKFwic25pcHBldFdpdGhUYXJnZXQgfCBsaW5reTonX2JsYW5rJ1wiKSkuZ2V0VGV4dCgpKS5cbiAgICAgICAgICAgIHRvQmUoJ2h0dHA6Ly9hbmd1bGFyanMub3JnLycpO1xuICAgICAgICBleHBlY3QoZWxlbWVudChieS5jc3MoJyNsaW5reS10YXJnZXQgYScpKS5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpKS50b0VxdWFsKCdfYmxhbmsnKTtcbiAgICAgICB9KTtcbiAgICAgPC9maWxlPlxuICAgPC9leGFtcGxlPlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbmdTYW5pdGl6ZScpLmZpbHRlcignbGlua3knLCBbJyRzYW5pdGl6ZScsIGZ1bmN0aW9uKCRzYW5pdGl6ZSkge1xuICB2YXIgTElOS1lfVVJMX1JFR0VYUCA9XG4gICAgICAgIC8oKGZ0cHxodHRwcz8pOlxcL1xcL3wod3d3XFwuKXwobWFpbHRvOik/W0EtWmEtejAtOS5fJSstXStAKVxcUypbXlxccy47LCgpe308PlwiXFx1MjAxZFxcdTIwMTldL2ksXG4gICAgICBNQUlMVE9fUkVHRVhQID0gL15tYWlsdG86L2k7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHRhcmdldCkge1xuICAgIGlmICghdGV4dCkgcmV0dXJuIHRleHQ7XG4gICAgdmFyIG1hdGNoO1xuICAgIHZhciByYXcgPSB0ZXh0O1xuICAgIHZhciBodG1sID0gW107XG4gICAgdmFyIHVybDtcbiAgICB2YXIgaTtcbiAgICB3aGlsZSAoKG1hdGNoID0gcmF3Lm1hdGNoKExJTktZX1VSTF9SRUdFWFApKSkge1xuICAgICAgLy8gV2UgY2FuIG5vdCBlbmQgaW4gdGhlc2UgYXMgdGhleSBhcmUgc29tZXRpbWVzIGZvdW5kIGF0IHRoZSBlbmQgb2YgdGhlIHNlbnRlbmNlXG4gICAgICB1cmwgPSBtYXRjaFswXTtcbiAgICAgIC8vIGlmIHdlIGRpZCBub3QgbWF0Y2ggZnRwL2h0dHAvd3d3L21haWx0byB0aGVuIGFzc3VtZSBtYWlsdG9cbiAgICAgIGlmICghbWF0Y2hbMl0gJiYgIW1hdGNoWzRdKSB7XG4gICAgICAgIHVybCA9IChtYXRjaFszXSA/ICdodHRwOi8vJyA6ICdtYWlsdG86JykgKyB1cmw7XG4gICAgICB9XG4gICAgICBpID0gbWF0Y2guaW5kZXg7XG4gICAgICBhZGRUZXh0KHJhdy5zdWJzdHIoMCwgaSkpO1xuICAgICAgYWRkTGluayh1cmwsIG1hdGNoWzBdLnJlcGxhY2UoTUFJTFRPX1JFR0VYUCwgJycpKTtcbiAgICAgIHJhdyA9IHJhdy5zdWJzdHJpbmcoaSArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuICAgIGFkZFRleHQocmF3KTtcbiAgICByZXR1cm4gJHNhbml0aXplKGh0bWwuam9pbignJykpO1xuXG4gICAgZnVuY3Rpb24gYWRkVGV4dCh0ZXh0KSB7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaHRtbC5wdXNoKHNhbml0aXplVGV4dCh0ZXh0KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkTGluayh1cmwsIHRleHQpIHtcbiAgICAgIGh0bWwucHVzaCgnPGEgJyk7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQodGFyZ2V0KSkge1xuICAgICAgICBodG1sLnB1c2goJ3RhcmdldD1cIicsXG4gICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICAnXCIgJyk7XG4gICAgICB9XG4gICAgICBodG1sLnB1c2goJ2hyZWY9XCInLFxuICAgICAgICAgICAgICAgIHVybC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JyksXG4gICAgICAgICAgICAgICAgJ1wiPicpO1xuICAgICAgYWRkVGV4dCh0ZXh0KTtcbiAgICAgIGh0bWwucHVzaCgnPC9hPicpO1xuICAgIH1cbiAgfTtcbn1dKTtcblxuXG59KSh3aW5kb3csIHdpbmRvdy5hbmd1bGFyKTtcbiIsInJlcXVpcmUoJy4vYW5ndWxhci1zYW5pdGl6ZScpO1xubW9kdWxlLmV4cG9ydHMgPSAnbmdTYW5pdGl6ZSc7XG4iLCIvKipcbiAqIEBsaWNlbnNlIEFuZ3VsYXJKUyB2MS40LjRcbiAqIChjKSAyMDEwLTIwMTUgR29vZ2xlLCBJbmMuIGh0dHA6Ly9hbmd1bGFyanMub3JnXG4gKiBMaWNlbnNlOiBNSVRcbiAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgYW5ndWxhciwgdW5kZWZpbmVkKSB7J3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ2RvYyBtb2R1bGVcbiAqIEBuYW1lIG5nVG91Y2hcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICMgbmdUb3VjaFxuICpcbiAqIFRoZSBgbmdUb3VjaGAgbW9kdWxlIHByb3ZpZGVzIHRvdWNoIGV2ZW50cyBhbmQgb3RoZXIgaGVscGVycyBmb3IgdG91Y2gtZW5hYmxlZCBkZXZpY2VzLlxuICogVGhlIGltcGxlbWVudGF0aW9uIGlzIGJhc2VkIG9uIGpRdWVyeSBNb2JpbGUgdG91Y2ggZXZlbnQgaGFuZGxpbmdcbiAqIChbanF1ZXJ5bW9iaWxlLmNvbV0oaHR0cDovL2pxdWVyeW1vYmlsZS5jb20vKSkuXG4gKlxuICpcbiAqIFNlZSB7QGxpbmsgbmdUb3VjaC4kc3dpcGUgYCRzd2lwZWB9IGZvciB1c2FnZS5cbiAqXG4gKiA8ZGl2IGRvYy1tb2R1bGUtY29tcG9uZW50cz1cIm5nVG91Y2hcIj48L2Rpdj5cbiAqXG4gKi9cblxuLy8gZGVmaW5lIG5nVG91Y2ggbW9kdWxlXG4vKiBnbG9iYWwgLW5nVG91Y2ggKi9cbnZhciBuZ1RvdWNoID0gYW5ndWxhci5tb2R1bGUoJ25nVG91Y2gnLCBbXSk7XG5cbmZ1bmN0aW9uIG5vZGVOYW1lXyhlbGVtZW50KSB7XG4gIHJldHVybiBhbmd1bGFyLmxvd2VyY2FzZShlbGVtZW50Lm5vZGVOYW1lIHx8IChlbGVtZW50WzBdICYmIGVsZW1lbnRbMF0ubm9kZU5hbWUpKTtcbn1cblxuLyogZ2xvYmFsIG5nVG91Y2g6IGZhbHNlICovXG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2Mgc2VydmljZVxuICAgICAqIEBuYW1lICRzd2lwZVxuICAgICAqXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogVGhlIGAkc3dpcGVgIHNlcnZpY2UgaXMgYSBzZXJ2aWNlIHRoYXQgYWJzdHJhY3RzIHRoZSBtZXNzaWVyIGRldGFpbHMgb2YgaG9sZC1hbmQtZHJhZyBzd2lwZVxuICAgICAqIGJlaGF2aW9yLCB0byBtYWtlIGltcGxlbWVudGluZyBzd2lwZS1yZWxhdGVkIGRpcmVjdGl2ZXMgbW9yZSBjb252ZW5pZW50LlxuICAgICAqXG4gICAgICogUmVxdWlyZXMgdGhlIHtAbGluayBuZ1RvdWNoIGBuZ1RvdWNoYH0gbW9kdWxlIHRvIGJlIGluc3RhbGxlZC5cbiAgICAgKlxuICAgICAqIGAkc3dpcGVgIGlzIHVzZWQgYnkgdGhlIGBuZ1N3aXBlTGVmdGAgYW5kIGBuZ1N3aXBlUmlnaHRgIGRpcmVjdGl2ZXMgaW4gYG5nVG91Y2hgLCBhbmQgYnlcbiAgICAgKiBgbmdDYXJvdXNlbGAgaW4gYSBzZXBhcmF0ZSBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiAjIFVzYWdlXG4gICAgICogVGhlIGAkc3dpcGVgIHNlcnZpY2UgaXMgYW4gb2JqZWN0IHdpdGggYSBzaW5nbGUgbWV0aG9kOiBgYmluZGAuIGBiaW5kYCB0YWtlcyBhbiBlbGVtZW50XG4gICAgICogd2hpY2ggaXMgdG8gYmUgd2F0Y2hlZCBmb3Igc3dpcGVzLCBhbmQgYW4gb2JqZWN0IHdpdGggZm91ciBoYW5kbGVyIGZ1bmN0aW9ucy4gU2VlIHRoZVxuICAgICAqIGRvY3VtZW50YXRpb24gZm9yIGBiaW5kYCBiZWxvdy5cbiAgICAgKi9cblxubmdUb3VjaC5mYWN0b3J5KCckc3dpcGUnLCBbZnVuY3Rpb24oKSB7XG4gIC8vIFRoZSB0b3RhbCBkaXN0YW5jZSBpbiBhbnkgZGlyZWN0aW9uIGJlZm9yZSB3ZSBtYWtlIHRoZSBjYWxsIG9uIHN3aXBlIHZzLiBzY3JvbGwuXG4gIHZhciBNT1ZFX0JVRkZFUl9SQURJVVMgPSAxMDtcblxuICB2YXIgUE9JTlRFUl9FVkVOVFMgPSB7XG4gICAgJ21vdXNlJzoge1xuICAgICAgc3RhcnQ6ICdtb3VzZWRvd24nLFxuICAgICAgbW92ZTogJ21vdXNlbW92ZScsXG4gICAgICBlbmQ6ICdtb3VzZXVwJ1xuICAgIH0sXG4gICAgJ3RvdWNoJzoge1xuICAgICAgc3RhcnQ6ICd0b3VjaHN0YXJ0JyxcbiAgICAgIG1vdmU6ICd0b3VjaG1vdmUnLFxuICAgICAgZW5kOiAndG91Y2hlbmQnLFxuICAgICAgY2FuY2VsOiAndG91Y2hjYW5jZWwnXG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldENvb3JkaW5hdGVzKGV2ZW50KSB7XG4gICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50IHx8IGV2ZW50O1xuICAgIHZhciB0b3VjaGVzID0gb3JpZ2luYWxFdmVudC50b3VjaGVzICYmIG9yaWdpbmFsRXZlbnQudG91Y2hlcy5sZW5ndGggPyBvcmlnaW5hbEV2ZW50LnRvdWNoZXMgOiBbb3JpZ2luYWxFdmVudF07XG4gICAgdmFyIGUgPSAob3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlcyAmJiBvcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKSB8fCB0b3VjaGVzWzBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGUuY2xpZW50WCxcbiAgICAgIHk6IGUuY2xpZW50WVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRFdmVudHMocG9pbnRlclR5cGVzLCBldmVudFR5cGUpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgYW5ndWxhci5mb3JFYWNoKHBvaW50ZXJUeXBlcywgZnVuY3Rpb24ocG9pbnRlclR5cGUpIHtcbiAgICAgIHZhciBldmVudE5hbWUgPSBQT0lOVEVSX0VWRU5UU1twb2ludGVyVHlwZV1bZXZlbnRUeXBlXTtcbiAgICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgICAgcmVzLnB1c2goZXZlbnROYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRzd2lwZSNiaW5kXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBUaGUgbWFpbiBtZXRob2Qgb2YgYCRzd2lwZWAuIEl0IHRha2VzIGFuIGVsZW1lbnQgdG8gYmUgd2F0Y2hlZCBmb3Igc3dpcGUgbW90aW9ucywgYW5kIGFuXG4gICAgICogb2JqZWN0IGNvbnRhaW5pbmcgZXZlbnQgaGFuZGxlcnMuXG4gICAgICogVGhlIHBvaW50ZXIgdHlwZXMgdGhhdCBzaG91bGQgYmUgdXNlZCBjYW4gYmUgc3BlY2lmaWVkIHZpYSB0aGUgb3B0aW9uYWxcbiAgICAgKiB0aGlyZCBhcmd1bWVudCwgd2hpY2ggaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBgJ21vdXNlJ2AgYW5kIGAndG91Y2gnYC4gQnkgZGVmYXVsdCxcbiAgICAgKiBgJHN3aXBlYCB3aWxsIGxpc3RlbiBmb3IgYG1vdXNlYCBhbmQgYHRvdWNoYCBldmVudHMuXG4gICAgICpcbiAgICAgKiBUaGUgZm91ciBldmVudHMgYXJlIGBzdGFydGAsIGBtb3ZlYCwgYGVuZGAsIGFuZCBgY2FuY2VsYC4gYHN0YXJ0YCwgYG1vdmVgLCBhbmQgYGVuZGBcbiAgICAgKiByZWNlaXZlIGFzIGEgcGFyYW1ldGVyIGEgY29vcmRpbmF0ZXMgb2JqZWN0IG9mIHRoZSBmb3JtIGB7IHg6IDE1MCwgeTogMzEwIH1gIGFuZCB0aGUgcmF3XG4gICAgICogYGV2ZW50YC4gYGNhbmNlbGAgcmVjZWl2ZXMgdGhlIHJhdyBgZXZlbnRgIGFzIGl0cyBzaW5nbGUgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogYHN0YXJ0YCBpcyBjYWxsZWQgb24gZWl0aGVyIGBtb3VzZWRvd25gIG9yIGB0b3VjaHN0YXJ0YC4gQWZ0ZXIgdGhpcyBldmVudCwgYCRzd2lwZWAgaXNcbiAgICAgKiB3YXRjaGluZyBmb3IgYHRvdWNobW92ZWAgb3IgYG1vdXNlbW92ZWAgZXZlbnRzLiBUaGVzZSBldmVudHMgYXJlIGlnbm9yZWQgdW50aWwgdGhlIHRvdGFsXG4gICAgICogZGlzdGFuY2UgbW92ZWQgaW4gZWl0aGVyIGRpbWVuc2lvbiBleGNlZWRzIGEgc21hbGwgdGhyZXNob2xkLlxuICAgICAqXG4gICAgICogT25jZSB0aGlzIHRocmVzaG9sZCBpcyBleGNlZWRlZCwgZWl0aGVyIHRoZSBob3Jpem9udGFsIG9yIHZlcnRpY2FsIGRlbHRhIGlzIGdyZWF0ZXIuXG4gICAgICogLSBJZiB0aGUgaG9yaXpvbnRhbCBkaXN0YW5jZSBpcyBncmVhdGVyLCB0aGlzIGlzIGEgc3dpcGUgYW5kIGBtb3ZlYCBhbmQgYGVuZGAgZXZlbnRzIGZvbGxvdy5cbiAgICAgKiAtIElmIHRoZSB2ZXJ0aWNhbCBkaXN0YW5jZSBpcyBncmVhdGVyLCB0aGlzIGlzIGEgc2Nyb2xsLCBhbmQgd2UgbGV0IHRoZSBicm93c2VyIHRha2Ugb3Zlci5cbiAgICAgKiAgIEEgYGNhbmNlbGAgZXZlbnQgaXMgc2VudC5cbiAgICAgKlxuICAgICAqIGBtb3ZlYCBpcyBjYWxsZWQgb24gYG1vdXNlbW92ZWAgYW5kIGB0b3VjaG1vdmVgIGFmdGVyIHRoZSBhYm92ZSBsb2dpYyBoYXMgZGV0ZXJtaW5lZCB0aGF0XG4gICAgICogYSBzd2lwZSBpcyBpbiBwcm9ncmVzcy5cbiAgICAgKlxuICAgICAqIGBlbmRgIGlzIGNhbGxlZCB3aGVuIGEgc3dpcGUgaXMgc3VjY2Vzc2Z1bGx5IGNvbXBsZXRlZCB3aXRoIGEgYHRvdWNoZW5kYCBvciBgbW91c2V1cGAuXG4gICAgICpcbiAgICAgKiBgY2FuY2VsYCBpcyBjYWxsZWQgZWl0aGVyIG9uIGEgYHRvdWNoY2FuY2VsYCBmcm9tIHRoZSBicm93c2VyLCBvciB3aGVuIHdlIGJlZ2luIHNjcm9sbGluZ1xuICAgICAqIGFzIGRlc2NyaWJlZCBhYm92ZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGJpbmQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50SGFuZGxlcnMsIHBvaW50ZXJUeXBlcykge1xuICAgICAgLy8gQWJzb2x1dGUgdG90YWwgbW92ZW1lbnQsIHVzZWQgdG8gY29udHJvbCBzd2lwZSB2cy4gc2Nyb2xsLlxuICAgICAgdmFyIHRvdGFsWCwgdG90YWxZO1xuICAgICAgLy8gQ29vcmRpbmF0ZXMgb2YgdGhlIHN0YXJ0IHBvc2l0aW9uLlxuICAgICAgdmFyIHN0YXJ0Q29vcmRzO1xuICAgICAgLy8gTGFzdCBldmVudCdzIHBvc2l0aW9uLlxuICAgICAgdmFyIGxhc3RQb3M7XG4gICAgICAvLyBXaGV0aGVyIGEgc3dpcGUgaXMgYWN0aXZlLlxuICAgICAgdmFyIGFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICBwb2ludGVyVHlwZXMgPSBwb2ludGVyVHlwZXMgfHwgWydtb3VzZScsICd0b3VjaCddO1xuICAgICAgZWxlbWVudC5vbihnZXRFdmVudHMocG9pbnRlclR5cGVzLCAnc3RhcnQnKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgc3RhcnRDb29yZHMgPSBnZXRDb29yZGluYXRlcyhldmVudCk7XG4gICAgICAgIGFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRvdGFsWCA9IDA7XG4gICAgICAgIHRvdGFsWSA9IDA7XG4gICAgICAgIGxhc3RQb3MgPSBzdGFydENvb3JkcztcbiAgICAgICAgZXZlbnRIYW5kbGVyc1snc3RhcnQnXSAmJiBldmVudEhhbmRsZXJzWydzdGFydCddKHN0YXJ0Q29vcmRzLCBldmVudCk7XG4gICAgICB9KTtcbiAgICAgIHZhciBldmVudHMgPSBnZXRFdmVudHMocG9pbnRlclR5cGVzLCAnY2FuY2VsJyk7XG4gICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgIGVsZW1lbnQub24oZXZlbnRzLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIGV2ZW50SGFuZGxlcnNbJ2NhbmNlbCddICYmIGV2ZW50SGFuZGxlcnNbJ2NhbmNlbCddKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnQub24oZ2V0RXZlbnRzKHBvaW50ZXJUeXBlcywgJ21vdmUnKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcblxuICAgICAgICAvLyBBbmRyb2lkIHdpbGwgc2VuZCBhIHRvdWNoY2FuY2VsIGlmIGl0IHRoaW5rcyB3ZSdyZSBzdGFydGluZyB0byBzY3JvbGwuXG4gICAgICAgIC8vIFNvIHdoZW4gdGhlIHRvdGFsIGRpc3RhbmNlICgrIG9yIC0gb3IgYm90aCkgZXhjZWVkcyAxMHB4IGluIGVpdGhlciBkaXJlY3Rpb24sXG4gICAgICAgIC8vIHdlIGVpdGhlcjpcbiAgICAgICAgLy8gLSBPbiB0b3RhbFggPiB0b3RhbFksIHdlIHNlbmQgcHJldmVudERlZmF1bHQoKSBhbmQgdHJlYXQgdGhpcyBhcyBhIHN3aXBlLlxuICAgICAgICAvLyAtIE9uIHRvdGFsWSA+IHRvdGFsWCwgd2UgbGV0IHRoZSBicm93c2VyIGhhbmRsZSBpdCBhcyBhIHNjcm9sbC5cblxuICAgICAgICBpZiAoIXN0YXJ0Q29vcmRzKSByZXR1cm47XG4gICAgICAgIHZhciBjb29yZHMgPSBnZXRDb29yZGluYXRlcyhldmVudCk7XG5cbiAgICAgICAgdG90YWxYICs9IE1hdGguYWJzKGNvb3Jkcy54IC0gbGFzdFBvcy54KTtcbiAgICAgICAgdG90YWxZICs9IE1hdGguYWJzKGNvb3Jkcy55IC0gbGFzdFBvcy55KTtcblxuICAgICAgICBsYXN0UG9zID0gY29vcmRzO1xuXG4gICAgICAgIGlmICh0b3RhbFggPCBNT1ZFX0JVRkZFUl9SQURJVVMgJiYgdG90YWxZIDwgTU9WRV9CVUZGRVJfUkFESVVTKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT25lIG9mIHRvdGFsWCBvciB0b3RhbFkgaGFzIGV4Y2VlZGVkIHRoZSBidWZmZXIsIHNvIGRlY2lkZSBvbiBzd2lwZSB2cy4gc2Nyb2xsLlxuICAgICAgICBpZiAodG90YWxZID4gdG90YWxYKSB7XG4gICAgICAgICAgLy8gQWxsb3cgbmF0aXZlIHNjcm9sbGluZyB0byB0YWtlIG92ZXIuXG4gICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgZXZlbnRIYW5kbGVyc1snY2FuY2VsJ10gJiYgZXZlbnRIYW5kbGVyc1snY2FuY2VsJ10oZXZlbnQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBQcmV2ZW50IHRoZSBicm93c2VyIGZyb20gc2Nyb2xsaW5nLlxuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZXZlbnRIYW5kbGVyc1snbW92ZSddICYmIGV2ZW50SGFuZGxlcnNbJ21vdmUnXShjb29yZHMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGVsZW1lbnQub24oZ2V0RXZlbnRzKHBvaW50ZXJUeXBlcywgJ2VuZCcpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIWFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgZXZlbnRIYW5kbGVyc1snZW5kJ10gJiYgZXZlbnRIYW5kbGVyc1snZW5kJ10oZ2V0Q29vcmRpbmF0ZXMoZXZlbnQpLCBldmVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XSk7XG5cbi8qIGdsb2JhbCBuZ1RvdWNoOiBmYWxzZSxcbiAgbm9kZU5hbWVfOiBmYWxzZVxuKi9cblxuLyoqXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBuZ0NsaWNrXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBBIG1vcmUgcG93ZXJmdWwgcmVwbGFjZW1lbnQgZm9yIHRoZSBkZWZhdWx0IG5nQ2xpY2sgZGVzaWduZWQgdG8gYmUgdXNlZCBvbiB0b3VjaHNjcmVlblxuICogZGV2aWNlcy4gTW9zdCBtb2JpbGUgYnJvd3NlcnMgd2FpdCBhYm91dCAzMDBtcyBhZnRlciBhIHRhcC1hbmQtcmVsZWFzZSBiZWZvcmUgc2VuZGluZ1xuICogdGhlIGNsaWNrIGV2ZW50LiBUaGlzIHZlcnNpb24gaGFuZGxlcyB0aGVtIGltbWVkaWF0ZWx5LCBhbmQgdGhlbiBwcmV2ZW50cyB0aGVcbiAqIGZvbGxvd2luZyBjbGljayBldmVudCBmcm9tIHByb3BhZ2F0aW5nLlxuICpcbiAqIFJlcXVpcmVzIHRoZSB7QGxpbmsgbmdUb3VjaCBgbmdUb3VjaGB9IG1vZHVsZSB0byBiZSBpbnN0YWxsZWQuXG4gKlxuICogVGhpcyBkaXJlY3RpdmUgY2FuIGZhbGwgYmFjayB0byB1c2luZyBhbiBvcmRpbmFyeSBjbGljayBldmVudCwgYW5kIHNvIHdvcmtzIG9uIGRlc2t0b3BcbiAqIGJyb3dzZXJzIGFzIHdlbGwgYXMgbW9iaWxlLlxuICpcbiAqIFRoaXMgZGlyZWN0aXZlIGFsc28gc2V0cyB0aGUgQ1NTIGNsYXNzIGBuZy1jbGljay1hY3RpdmVgIHdoaWxlIHRoZSBlbGVtZW50IGlzIGJlaW5nIGhlbGRcbiAqIGRvd24gKGJ5IGEgbW91c2UgY2xpY2sgb3IgdG91Y2gpIHNvIHlvdSBjYW4gcmVzdHlsZSB0aGUgZGVwcmVzc2VkIGVsZW1lbnQgaWYgeW91IHdpc2guXG4gKlxuICogQGVsZW1lbnQgQU5ZXG4gKiBAcGFyYW0ge2V4cHJlc3Npb259IG5nQ2xpY2sge0BsaW5rIGd1aWRlL2V4cHJlc3Npb24gRXhwcmVzc2lvbn0gdG8gZXZhbHVhdGVcbiAqIHVwb24gdGFwLiAoRXZlbnQgb2JqZWN0IGlzIGF2YWlsYWJsZSBhcyBgJGV2ZW50YClcbiAqXG4gKiBAZXhhbXBsZVxuICAgIDxleGFtcGxlIG1vZHVsZT1cIm5nQ2xpY2tFeGFtcGxlXCIgZGVwcz1cImFuZ3VsYXItdG91Y2guanNcIj5cbiAgICAgIDxmaWxlIG5hbWU9XCJpbmRleC5odG1sXCI+XG4gICAgICAgIDxidXR0b24gbmctY2xpY2s9XCJjb3VudCA9IGNvdW50ICsgMVwiIG5nLWluaXQ9XCJjb3VudD0wXCI+XG4gICAgICAgICAgSW5jcmVtZW50XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICBjb3VudDoge3sgY291bnQgfX1cbiAgICAgIDwvZmlsZT5cbiAgICAgIDxmaWxlIG5hbWU9XCJzY3JpcHQuanNcIj5cbiAgICAgICAgYW5ndWxhci5tb2R1bGUoJ25nQ2xpY2tFeGFtcGxlJywgWyduZ1RvdWNoJ10pO1xuICAgICAgPC9maWxlPlxuICAgIDwvZXhhbXBsZT5cbiAqL1xuXG5uZ1RvdWNoLmNvbmZpZyhbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCduZ0NsaWNrRGlyZWN0aXZlJywgWyckZGVsZWdhdGUnLCBmdW5jdGlvbigkZGVsZWdhdGUpIHtcbiAgICAvLyBkcm9wIHRoZSBkZWZhdWx0IG5nQ2xpY2sgZGlyZWN0aXZlXG4gICAgJGRlbGVnYXRlLnNoaWZ0KCk7XG4gICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgfV0pO1xufV0pO1xuXG5uZ1RvdWNoLmRpcmVjdGl2ZSgnbmdDbGljaycsIFsnJHBhcnNlJywgJyR0aW1lb3V0JywgJyRyb290RWxlbWVudCcsXG4gICAgZnVuY3Rpb24oJHBhcnNlLCAkdGltZW91dCwgJHJvb3RFbGVtZW50KSB7XG4gIHZhciBUQVBfRFVSQVRJT04gPSA3NTA7IC8vIFNob3J0ZXIgdGhhbiA3NTBtcyBpcyBhIHRhcCwgbG9uZ2VyIGlzIGEgdGFwaG9sZCBvciBkcmFnLlxuICB2YXIgTU9WRV9UT0xFUkFOQ0UgPSAxMjsgLy8gMTJweCBzZWVtcyB0byB3b3JrIGluIG1vc3QgbW9iaWxlIGJyb3dzZXJzLlxuICB2YXIgUFJFVkVOVF9EVVJBVElPTiA9IDI1MDA7IC8vIDIuNSBzZWNvbmRzIG1heGltdW0gZnJvbSBwcmV2ZW50R2hvc3RDbGljayBjYWxsIHRvIGNsaWNrXG4gIHZhciBDTElDS0JVU1RFUl9USFJFU0hPTEQgPSAyNTsgLy8gMjUgcGl4ZWxzIGluIGFueSBkaW1lbnNpb24gaXMgdGhlIGxpbWl0IGZvciBidXN0aW5nIGNsaWNrcy5cblxuICB2YXIgQUNUSVZFX0NMQVNTX05BTUUgPSAnbmctY2xpY2stYWN0aXZlJztcbiAgdmFyIGxhc3RQcmV2ZW50ZWRUaW1lO1xuICB2YXIgdG91Y2hDb29yZGluYXRlcztcbiAgdmFyIGxhc3RMYWJlbENsaWNrQ29vcmRpbmF0ZXM7XG5cblxuICAvLyBUQVAgRVZFTlRTIEFORCBHSE9TVCBDTElDS1NcbiAgLy9cbiAgLy8gV2h5IHRhcCBldmVudHM/XG4gIC8vIE1vYmlsZSBicm93c2VycyBkZXRlY3QgYSB0YXAsIHRoZW4gd2FpdCBhIG1vbWVudCAodXN1YWxseSB+MzAwbXMpIHRvIHNlZSBpZiB5b3UncmVcbiAgLy8gZG91YmxlLXRhcHBpbmcsIGFuZCB0aGVuIGZpcmUgYSBjbGljayBldmVudC5cbiAgLy9cbiAgLy8gVGhpcyBkZWxheSBzdWNrcyBhbmQgbWFrZXMgbW9iaWxlIGFwcHMgZmVlbCB1bnJlc3BvbnNpdmUuXG4gIC8vIFNvIHdlIGRldGVjdCB0b3VjaHN0YXJ0LCB0b3VjaGNhbmNlbCBhbmQgdG91Y2hlbmQgb3Vyc2VsdmVzIGFuZCBkZXRlcm1pbmUgd2hlblxuICAvLyB0aGUgdXNlciBoYXMgdGFwcGVkIG9uIHNvbWV0aGluZy5cbiAgLy9cbiAgLy8gV2hhdCBoYXBwZW5zIHdoZW4gdGhlIGJyb3dzZXIgdGhlbiBnZW5lcmF0ZXMgYSBjbGljayBldmVudD9cbiAgLy8gVGhlIGJyb3dzZXIsIG9mIGNvdXJzZSwgYWxzbyBkZXRlY3RzIHRoZSB0YXAgYW5kIGZpcmVzIGEgY2xpY2sgYWZ0ZXIgYSBkZWxheS4gVGhpcyByZXN1bHRzIGluXG4gIC8vIHRhcHBpbmcvY2xpY2tpbmcgdHdpY2UuIFdlIGRvIFwiY2xpY2tidXN0aW5nXCIgdG8gcHJldmVudCBpdC5cbiAgLy9cbiAgLy8gSG93IGRvZXMgaXQgd29yaz9cbiAgLy8gV2UgYXR0YWNoIGdsb2JhbCB0b3VjaHN0YXJ0IGFuZCBjbGljayBoYW5kbGVycywgdGhhdCBydW4gZHVyaW5nIHRoZSBjYXB0dXJlIChlYXJseSkgcGhhc2UuXG4gIC8vIFNvIHRoZSBzZXF1ZW5jZSBmb3IgYSB0YXAgaXM6XG4gIC8vIC0gZ2xvYmFsIHRvdWNoc3RhcnQ6IFNldHMgYW4gXCJhbGxvd2FibGUgcmVnaW9uXCIgYXQgdGhlIHBvaW50IHRvdWNoZWQuXG4gIC8vIC0gZWxlbWVudCdzIHRvdWNoc3RhcnQ6IFN0YXJ0cyBhIHRvdWNoXG4gIC8vICgtIHRvdWNoY2FuY2VsIGVuZHMgdGhlIHRvdWNoLCBubyBjbGljayBmb2xsb3dzKVxuICAvLyAtIGVsZW1lbnQncyB0b3VjaGVuZDogRGV0ZXJtaW5lcyBpZiB0aGUgdGFwIGlzIHZhbGlkIChkaWRuJ3QgbW92ZSB0b28gZmFyIGF3YXksIGRpZG4ndCBob2xkXG4gIC8vICAgdG9vIGxvbmcpIGFuZCBmaXJlcyB0aGUgdXNlcidzIHRhcCBoYW5kbGVyLiBUaGUgdG91Y2hlbmQgYWxzbyBjYWxscyBwcmV2ZW50R2hvc3RDbGljaygpLlxuICAvLyAtIHByZXZlbnRHaG9zdENsaWNrKCkgcmVtb3ZlcyB0aGUgYWxsb3dhYmxlIHJlZ2lvbiB0aGUgZ2xvYmFsIHRvdWNoc3RhcnQgY3JlYXRlZC5cbiAgLy8gLSBUaGUgYnJvd3NlciBnZW5lcmF0ZXMgYSBjbGljayBldmVudC5cbiAgLy8gLSBUaGUgZ2xvYmFsIGNsaWNrIGhhbmRsZXIgY2F0Y2hlcyB0aGUgY2xpY2ssIGFuZCBjaGVja3Mgd2hldGhlciBpdCB3YXMgaW4gYW4gYWxsb3dhYmxlIHJlZ2lvbi5cbiAgLy8gICAgIC0gSWYgcHJldmVudEdob3N0Q2xpY2sgd2FzIGNhbGxlZCwgdGhlIHJlZ2lvbiB3aWxsIGhhdmUgYmVlbiByZW1vdmVkLCB0aGUgY2xpY2sgaXMgYnVzdGVkLlxuICAvLyAgICAgLSBJZiB0aGUgcmVnaW9uIGlzIHN0aWxsIHRoZXJlLCB0aGUgY2xpY2sgcHJvY2VlZHMgbm9ybWFsbHkuIFRoZXJlZm9yZSBjbGlja3Mgb24gbGlua3MgYW5kXG4gIC8vICAgICAgIG90aGVyIGVsZW1lbnRzIHdpdGhvdXQgbmdUYXAgb24gdGhlbSB3b3JrIG5vcm1hbGx5LlxuICAvL1xuICAvLyBUaGlzIGlzIGFuIHVnbHksIHRlcnJpYmxlIGhhY2shXG4gIC8vIFllYWgsIHRlbGwgbWUgYWJvdXQgaXQuIFRoZSBhbHRlcm5hdGl2ZXMgYXJlIHVzaW5nIHRoZSBzbG93IGNsaWNrIGV2ZW50cywgb3IgbWFraW5nIG91ciB1c2Vyc1xuICAvLyBkZWFsIHdpdGggdGhlIGdob3N0IGNsaWNrcywgc28gSSBjb25zaWRlciB0aGlzIHRoZSBsZWFzdCBvZiBldmlscy4gRm9ydHVuYXRlbHkgQW5ndWxhclxuICAvLyBlbmNhcHN1bGF0ZXMgdGhpcyB1Z2x5IGxvZ2ljIGF3YXkgZnJvbSB0aGUgdXNlci5cbiAgLy9cbiAgLy8gV2h5IG5vdCBqdXN0IHB1dCBjbGljayBoYW5kbGVycyBvbiB0aGUgZWxlbWVudD9cbiAgLy8gV2UgZG8gdGhhdCB0b28sIGp1c3QgdG8gYmUgc3VyZS4gSWYgdGhlIHRhcCBldmVudCBjYXVzZWQgdGhlIERPTSB0byBjaGFuZ2UsXG4gIC8vIGl0IGlzIHBvc3NpYmxlIGFub3RoZXIgZWxlbWVudCBpcyBub3cgaW4gdGhhdCBwb3NpdGlvbi4gVG8gdGFrZSBhY2NvdW50IGZvciB0aGVzZSBwb3NzaWJseVxuICAvLyBkaXN0aW5jdCBlbGVtZW50cywgdGhlIGhhbmRsZXJzIGFyZSBnbG9iYWwgYW5kIGNhcmUgb25seSBhYm91dCBjb29yZGluYXRlcy5cblxuICAvLyBDaGVja3MgaWYgdGhlIGNvb3JkaW5hdGVzIGFyZSBjbG9zZSBlbm91Z2ggdG8gYmUgd2l0aGluIHRoZSByZWdpb24uXG4gIGZ1bmN0aW9uIGhpdCh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiBNYXRoLmFicyh4MSAtIHgyKSA8IENMSUNLQlVTVEVSX1RIUkVTSE9MRCAmJiBNYXRoLmFicyh5MSAtIHkyKSA8IENMSUNLQlVTVEVSX1RIUkVTSE9MRDtcbiAgfVxuXG4gIC8vIENoZWNrcyBhIGxpc3Qgb2YgYWxsb3dhYmxlIHJlZ2lvbnMgYWdhaW5zdCBhIGNsaWNrIGxvY2F0aW9uLlxuICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNsaWNrIHNob3VsZCBiZSBhbGxvd2VkLlxuICAvLyBTcGxpY2VzIG91dCB0aGUgYWxsb3dhYmxlIHJlZ2lvbiBmcm9tIHRoZSBsaXN0IGFmdGVyIGl0IGhhcyBiZWVuIHVzZWQuXG4gIGZ1bmN0aW9uIGNoZWNrQWxsb3dhYmxlUmVnaW9ucyh0b3VjaENvb3JkaW5hdGVzLCB4LCB5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaENvb3JkaW5hdGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAoaGl0KHRvdWNoQ29vcmRpbmF0ZXNbaV0sIHRvdWNoQ29vcmRpbmF0ZXNbaSArIDFdLCB4LCB5KSkge1xuICAgICAgICB0b3VjaENvb3JkaW5hdGVzLnNwbGljZShpLCBpICsgMik7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBhbGxvd2FibGUgcmVnaW9uXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTsgLy8gTm8gYWxsb3dhYmxlIHJlZ2lvbjsgYnVzdCBpdC5cbiAgfVxuXG4gIC8vIEdsb2JhbCBjbGljayBoYW5kbGVyIHRoYXQgcHJldmVudHMgdGhlIGNsaWNrIGlmIGl0J3MgaW4gYSBidXN0YWJsZSB6b25lIGFuZCBwcmV2ZW50R2hvc3RDbGlja1xuICAvLyB3YXMgY2FsbGVkIHJlY2VudGx5LlxuICBmdW5jdGlvbiBvbkNsaWNrKGV2ZW50KSB7XG4gICAgaWYgKERhdGUubm93KCkgLSBsYXN0UHJldmVudGVkVGltZSA+IFBSRVZFTlRfRFVSQVRJT04pIHtcbiAgICAgIHJldHVybjsgLy8gVG9vIG9sZC5cbiAgICB9XG5cbiAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPyBldmVudC50b3VjaGVzIDogW2V2ZW50XTtcbiAgICB2YXIgeCA9IHRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICB2YXIgeSA9IHRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICAvLyBXb3JrIGFyb3VuZCBkZXNrdG9wIFdlYmtpdCBxdWlyayB3aGVyZSBjbGlja2luZyBhIGxhYmVsIHdpbGwgZmlyZSB0d28gY2xpY2tzIChvbiB0aGUgbGFiZWxcbiAgICAvLyBhbmQgb24gdGhlIGlucHV0IGVsZW1lbnQpLiBEZXBlbmRpbmcgb24gdGhlIGV4YWN0IGJyb3dzZXIsIHRoaXMgc2Vjb25kIGNsaWNrIHdlIGRvbid0IHdhbnRcbiAgICAvLyB0byBidXN0IGhhcyBlaXRoZXIgKDAsMCksIG5lZ2F0aXZlIGNvb3JkaW5hdGVzLCBvciBjb29yZGluYXRlcyBlcXVhbCB0byB0cmlnZ2VyaW5nIGxhYmVsXG4gICAgLy8gY2xpY2sgZXZlbnRcbiAgICBpZiAoeCA8IDEgJiYgeSA8IDEpIHtcbiAgICAgIHJldHVybjsgLy8gb2Zmc2NyZWVuXG4gICAgfVxuICAgIGlmIChsYXN0TGFiZWxDbGlja0Nvb3JkaW5hdGVzICYmXG4gICAgICAgIGxhc3RMYWJlbENsaWNrQ29vcmRpbmF0ZXNbMF0gPT09IHggJiYgbGFzdExhYmVsQ2xpY2tDb29yZGluYXRlc1sxXSA9PT0geSkge1xuICAgICAgcmV0dXJuOyAvLyBpbnB1dCBjbGljayB0cmlnZ2VyZWQgYnkgbGFiZWwgY2xpY2tcbiAgICB9XG4gICAgLy8gcmVzZXQgbGFiZWwgY2xpY2sgY29vcmRpbmF0ZXMgb24gZmlyc3Qgc3Vic2VxdWVudCBjbGlja1xuICAgIGlmIChsYXN0TGFiZWxDbGlja0Nvb3JkaW5hdGVzKSB7XG4gICAgICBsYXN0TGFiZWxDbGlja0Nvb3JkaW5hdGVzID0gbnVsbDtcbiAgICB9XG4gICAgLy8gcmVtZW1iZXIgbGFiZWwgY2xpY2sgY29vcmRpbmF0ZXMgdG8gcHJldmVudCBjbGljayBidXN0aW5nIG9mIHRyaWdnZXIgY2xpY2sgZXZlbnQgb24gaW5wdXRcbiAgICBpZiAobm9kZU5hbWVfKGV2ZW50LnRhcmdldCkgPT09ICdsYWJlbCcpIHtcbiAgICAgIGxhc3RMYWJlbENsaWNrQ29vcmRpbmF0ZXMgPSBbeCwgeV07XG4gICAgfVxuXG4gICAgLy8gTG9vayBmb3IgYW4gYWxsb3dhYmxlIHJlZ2lvbiBjb250YWluaW5nIHRoaXMgY2xpY2suXG4gICAgLy8gSWYgd2UgZmluZCBvbmUsIHRoYXQgbWVhbnMgaXQgd2FzIGNyZWF0ZWQgYnkgdG91Y2hzdGFydCBhbmQgbm90IHJlbW92ZWQgYnlcbiAgICAvLyBwcmV2ZW50R2hvc3RDbGljaywgc28gd2UgZG9uJ3QgYnVzdCBpdC5cbiAgICBpZiAoY2hlY2tBbGxvd2FibGVSZWdpb25zKHRvdWNoQ29vcmRpbmF0ZXMsIHgsIHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgZGlkbid0IGZpbmQgYW4gYWxsb3dhYmxlIHJlZ2lvbiwgYnVzdCB0aGUgY2xpY2suXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIC8vIEJsdXIgZm9jdXNlZCBmb3JtIGVsZW1lbnRzXG4gICAgZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5ibHVyICYmIGV2ZW50LnRhcmdldC5ibHVyKCk7XG4gIH1cblxuXG4gIC8vIEdsb2JhbCB0b3VjaHN0YXJ0IGhhbmRsZXIgdGhhdCBjcmVhdGVzIGFuIGFsbG93YWJsZSByZWdpb24gZm9yIGEgY2xpY2sgZXZlbnQuXG4gIC8vIFRoaXMgYWxsb3dhYmxlIHJlZ2lvbiBjYW4gYmUgcmVtb3ZlZCBieSBwcmV2ZW50R2hvc3RDbGljayBpZiB3ZSB3YW50IHRvIGJ1c3QgaXQuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChldmVudCkge1xuICAgIHZhciB0b3VjaGVzID0gZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA/IGV2ZW50LnRvdWNoZXMgOiBbZXZlbnRdO1xuICAgIHZhciB4ID0gdG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHZhciB5ID0gdG91Y2hlc1swXS5jbGllbnRZO1xuICAgIHRvdWNoQ29vcmRpbmF0ZXMucHVzaCh4LCB5KTtcblxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBhbGxvd2FibGUgcmVnaW9uLlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaENvb3JkaW5hdGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGlmICh0b3VjaENvb3JkaW5hdGVzW2ldID09IHggJiYgdG91Y2hDb29yZGluYXRlc1tpICsgMV0gPT0geSkge1xuICAgICAgICAgIHRvdWNoQ29vcmRpbmF0ZXMuc3BsaWNlKGksIGkgKyAyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCBQUkVWRU5UX0RVUkFUSU9OLCBmYWxzZSk7XG4gIH1cblxuICAvLyBPbiB0aGUgZmlyc3QgY2FsbCwgYXR0YWNoZXMgc29tZSBldmVudCBoYW5kbGVycy4gVGhlbiB3aGVuZXZlciBpdCBnZXRzIGNhbGxlZCwgaXQgY3JlYXRlcyBhXG4gIC8vIHpvbmUgYXJvdW5kIHRoZSB0b3VjaHN0YXJ0IHdoZXJlIGNsaWNrcyB3aWxsIGdldCBidXN0ZWQuXG4gIGZ1bmN0aW9uIHByZXZlbnRHaG9zdENsaWNrKHgsIHkpIHtcbiAgICBpZiAoIXRvdWNoQ29vcmRpbmF0ZXMpIHtcbiAgICAgICRyb290RWxlbWVudFswXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQ2xpY2ssIHRydWUpO1xuICAgICAgJHJvb3RFbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIHRydWUpO1xuICAgICAgdG91Y2hDb29yZGluYXRlcyA9IFtdO1xuICAgIH1cblxuICAgIGxhc3RQcmV2ZW50ZWRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIGNoZWNrQWxsb3dhYmxlUmVnaW9ucyh0b3VjaENvb3JkaW5hdGVzLCB4LCB5KTtcbiAgfVxuXG4gIC8vIEFjdHVhbCBsaW5raW5nIGZ1bmN0aW9uLlxuICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICB2YXIgY2xpY2tIYW5kbGVyID0gJHBhcnNlKGF0dHIubmdDbGljayksXG4gICAgICAgIHRhcHBpbmcgPSBmYWxzZSxcbiAgICAgICAgdGFwRWxlbWVudCwgIC8vIFVzZWQgdG8gYmx1ciB0aGUgZWxlbWVudCBhZnRlciBhIHRhcC5cbiAgICAgICAgc3RhcnRUaW1lLCAgIC8vIFVzZWQgdG8gY2hlY2sgaWYgdGhlIHRhcCB3YXMgaGVsZCB0b28gbG9uZy5cbiAgICAgICAgdG91Y2hTdGFydFgsXG4gICAgICAgIHRvdWNoU3RhcnRZO1xuXG4gICAgZnVuY3Rpb24gcmVzZXRTdGF0ZSgpIHtcbiAgICAgIHRhcHBpbmcgPSBmYWxzZTtcbiAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoQUNUSVZFX0NMQVNTX05BTUUpO1xuICAgIH1cblxuICAgIGVsZW1lbnQub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgdGFwcGluZyA9IHRydWU7XG4gICAgICB0YXBFbGVtZW50ID0gZXZlbnQudGFyZ2V0ID8gZXZlbnQudGFyZ2V0IDogZXZlbnQuc3JjRWxlbWVudDsgLy8gSUUgdXNlcyBzcmNFbGVtZW50LlxuICAgICAgLy8gSGFjayBmb3IgU2FmYXJpLCB3aGljaCBjYW4gdGFyZ2V0IHRleHQgbm9kZXMgaW5zdGVhZCBvZiBjb250YWluZXJzLlxuICAgICAgaWYgKHRhcEVsZW1lbnQubm9kZVR5cGUgPT0gMykge1xuICAgICAgICB0YXBFbGVtZW50ID0gdGFwRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50LmFkZENsYXNzKEFDVElWRV9DTEFTU19OQU1FKTtcblxuICAgICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgLy8gVXNlIGpRdWVyeSBvcmlnaW5hbEV2ZW50XG4gICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQgfHwgZXZlbnQ7XG4gICAgICB2YXIgdG91Y2hlcyA9IG9yaWdpbmFsRXZlbnQudG91Y2hlcyAmJiBvcmlnaW5hbEV2ZW50LnRvdWNoZXMubGVuZ3RoID8gb3JpZ2luYWxFdmVudC50b3VjaGVzIDogW29yaWdpbmFsRXZlbnRdO1xuICAgICAgdmFyIGUgPSB0b3VjaGVzWzBdO1xuICAgICAgdG91Y2hTdGFydFggPSBlLmNsaWVudFg7XG4gICAgICB0b3VjaFN0YXJ0WSA9IGUuY2xpZW50WTtcbiAgICB9KTtcblxuICAgIGVsZW1lbnQub24oJ3RvdWNoY2FuY2VsJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHJlc2V0U3RhdGUoKTtcbiAgICB9KTtcblxuICAgIGVsZW1lbnQub24oJ3RvdWNoZW5kJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBkaWZmID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgLy8gVXNlIGpRdWVyeSBvcmlnaW5hbEV2ZW50XG4gICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQgfHwgZXZlbnQ7XG4gICAgICB2YXIgdG91Y2hlcyA9IChvcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIG9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSA/XG4gICAgICAgICAgb3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlcyA6XG4gICAgICAgICAgKChvcmlnaW5hbEV2ZW50LnRvdWNoZXMgJiYgb3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aCkgPyBvcmlnaW5hbEV2ZW50LnRvdWNoZXMgOiBbb3JpZ2luYWxFdmVudF0pO1xuICAgICAgdmFyIGUgPSB0b3VjaGVzWzBdO1xuICAgICAgdmFyIHggPSBlLmNsaWVudFg7XG4gICAgICB2YXIgeSA9IGUuY2xpZW50WTtcbiAgICAgIHZhciBkaXN0ID0gTWF0aC5zcXJ0KE1hdGgucG93KHggLSB0b3VjaFN0YXJ0WCwgMikgKyBNYXRoLnBvdyh5IC0gdG91Y2hTdGFydFksIDIpKTtcblxuICAgICAgaWYgKHRhcHBpbmcgJiYgZGlmZiA8IFRBUF9EVVJBVElPTiAmJiBkaXN0IDwgTU9WRV9UT0xFUkFOQ0UpIHtcbiAgICAgICAgLy8gQ2FsbCBwcmV2ZW50R2hvc3RDbGljayBzbyB0aGUgY2xpY2tidXN0ZXIgd2lsbCBjYXRjaCB0aGUgY29ycmVzcG9uZGluZyBjbGljay5cbiAgICAgICAgcHJldmVudEdob3N0Q2xpY2soeCwgeSk7XG5cbiAgICAgICAgLy8gQmx1ciB0aGUgZm9jdXNlZCBlbGVtZW50ICh0aGUgYnV0dG9uLCBwcm9iYWJseSkgYmVmb3JlIGZpcmluZyB0aGUgY2FsbGJhY2suXG4gICAgICAgIC8vIFRoaXMgZG9lc24ndCB3b3JrIHBlcmZlY3RseSBvbiBBbmRyb2lkIENocm9tZSwgYnV0IHNlZW1zIHRvIHdvcmsgZWxzZXdoZXJlLlxuICAgICAgICAvLyBJIGNvdWxkbid0IGdldCBhbnl0aGluZyB0byB3b3JrIHJlbGlhYmx5IG9uIEFuZHJvaWQgQ2hyb21lLlxuICAgICAgICBpZiAodGFwRWxlbWVudCkge1xuICAgICAgICAgIHRhcEVsZW1lbnQuYmx1cigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhbmd1bGFyLmlzRGVmaW5lZChhdHRyLmRpc2FibGVkKSB8fCBhdHRyLmRpc2FibGVkID09PSBmYWxzZSkge1xuICAgICAgICAgIGVsZW1lbnQudHJpZ2dlckhhbmRsZXIoJ2NsaWNrJywgW2V2ZW50XSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzZXRTdGF0ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gSGFjayBmb3IgaU9TIFNhZmFyaSdzIGJlbmVmaXQuIEl0IGdvZXMgc2VhcmNoaW5nIGZvciBvbmNsaWNrIGhhbmRsZXJzIGFuZCBpcyBsaWFibGUgdG8gY2xpY2tcbiAgICAvLyBzb21ldGhpbmcgZWxzZSBuZWFyYnkuXG4gICAgZWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHsgfTtcblxuICAgIC8vIEFjdHVhbCBjbGljayBoYW5kbGVyLlxuICAgIC8vIFRoZXJlIGFyZSB0aHJlZSBkaWZmZXJlbnQga2luZHMgb2YgY2xpY2tzLCBvbmx5IHR3byBvZiB3aGljaCByZWFjaCB0aGlzIHBvaW50LlxuICAgIC8vIC0gT24gZGVza3RvcCBicm93c2VycyB3aXRob3V0IHRvdWNoIGV2ZW50cywgdGhlaXIgY2xpY2tzIHdpbGwgYWx3YXlzIGNvbWUgaGVyZS5cbiAgICAvLyAtIE9uIG1vYmlsZSBicm93c2VycywgdGhlIHNpbXVsYXRlZCBcImZhc3RcIiBjbGljayB3aWxsIGNhbGwgdGhpcy5cbiAgICAvLyAtIEJ1dCB0aGUgYnJvd3NlcidzIGZvbGxvdy11cCBzbG93IGNsaWNrIHdpbGwgYmUgXCJidXN0ZWRcIiBiZWZvcmUgaXQgcmVhY2hlcyB0aGlzIGhhbmRsZXIuXG4gICAgLy8gVGhlcmVmb3JlIGl0J3Mgc2FmZSB0byB1c2UgdGhpcyBkaXJlY3RpdmUgb24gYm90aCBtb2JpbGUgYW5kIGRlc2t0b3AuXG4gICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCwgdG91Y2hlbmQpIHtcbiAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgY2xpY2tIYW5kbGVyKHNjb3BlLCB7JGV2ZW50OiAodG91Y2hlbmQgfHwgZXZlbnQpfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBlbGVtZW50LmFkZENsYXNzKEFDVElWRV9DTEFTU19OQU1FKTtcbiAgICB9KTtcblxuICAgIGVsZW1lbnQub24oJ21vdXNlbW92ZSBtb3VzZXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoQUNUSVZFX0NMQVNTX05BTUUpO1xuICAgIH0pO1xuXG4gIH07XG59XSk7XG5cbi8qIGdsb2JhbCBuZ1RvdWNoOiBmYWxzZSAqL1xuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG5nU3dpcGVMZWZ0XG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBTcGVjaWZ5IGN1c3RvbSBiZWhhdmlvciB3aGVuIGFuIGVsZW1lbnQgaXMgc3dpcGVkIHRvIHRoZSBsZWZ0IG9uIGEgdG91Y2hzY3JlZW4gZGV2aWNlLlxuICogQSBsZWZ0d2FyZCBzd2lwZSBpcyBhIHF1aWNrLCByaWdodC10by1sZWZ0IHNsaWRlIG9mIHRoZSBmaW5nZXIuXG4gKiBUaG91Z2ggbmdTd2lwZUxlZnQgaXMgZGVzaWduZWQgZm9yIHRvdWNoLWJhc2VkIGRldmljZXMsIGl0IHdpbGwgd29yayB3aXRoIGEgbW91c2UgY2xpY2sgYW5kIGRyYWdcbiAqIHRvby5cbiAqXG4gKiBUbyBkaXNhYmxlIHRoZSBtb3VzZSBjbGljayBhbmQgZHJhZyBmdW5jdGlvbmFsaXR5LCBhZGQgYG5nLXN3aXBlLWRpc2FibGUtbW91c2VgIHRvXG4gKiB0aGUgYG5nLXN3aXBlLWxlZnRgIG9yIGBuZy1zd2lwZS1yaWdodGAgRE9NIEVsZW1lbnQuXG4gKlxuICogUmVxdWlyZXMgdGhlIHtAbGluayBuZ1RvdWNoIGBuZ1RvdWNoYH0gbW9kdWxlIHRvIGJlIGluc3RhbGxlZC5cbiAqXG4gKiBAZWxlbWVudCBBTllcbiAqIEBwYXJhbSB7ZXhwcmVzc2lvbn0gbmdTd2lwZUxlZnQge0BsaW5rIGd1aWRlL2V4cHJlc3Npb24gRXhwcmVzc2lvbn0gdG8gZXZhbHVhdGVcbiAqIHVwb24gbGVmdCBzd2lwZS4gKEV2ZW50IG9iamVjdCBpcyBhdmFpbGFibGUgYXMgYCRldmVudGApXG4gKlxuICogQGV4YW1wbGVcbiAgICA8ZXhhbXBsZSBtb2R1bGU9XCJuZ1N3aXBlTGVmdEV4YW1wbGVcIiBkZXBzPVwiYW5ndWxhci10b3VjaC5qc1wiPlxuICAgICAgPGZpbGUgbmFtZT1cImluZGV4Lmh0bWxcIj5cbiAgICAgICAgPGRpdiBuZy1zaG93PVwiIXNob3dBY3Rpb25zXCIgbmctc3dpcGUtbGVmdD1cInNob3dBY3Rpb25zID0gdHJ1ZVwiPlxuICAgICAgICAgIFNvbWUgbGlzdCBjb250ZW50LCBsaWtlIGFuIGVtYWlsIGluIHRoZSBpbmJveFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBuZy1zaG93PVwic2hvd0FjdGlvbnNcIiBuZy1zd2lwZS1yaWdodD1cInNob3dBY3Rpb25zID0gZmFsc2VcIj5cbiAgICAgICAgICA8YnV0dG9uIG5nLWNsaWNrPVwicmVwbHkoKVwiPlJlcGx5PC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBuZy1jbGljaz1cImRlbGV0ZSgpXCI+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9maWxlPlxuICAgICAgPGZpbGUgbmFtZT1cInNjcmlwdC5qc1wiPlxuICAgICAgICBhbmd1bGFyLm1vZHVsZSgnbmdTd2lwZUxlZnRFeGFtcGxlJywgWyduZ1RvdWNoJ10pO1xuICAgICAgPC9maWxlPlxuICAgIDwvZXhhbXBsZT5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG5nU3dpcGVSaWdodFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogU3BlY2lmeSBjdXN0b20gYmVoYXZpb3Igd2hlbiBhbiBlbGVtZW50IGlzIHN3aXBlZCB0byB0aGUgcmlnaHQgb24gYSB0b3VjaHNjcmVlbiBkZXZpY2UuXG4gKiBBIHJpZ2h0d2FyZCBzd2lwZSBpcyBhIHF1aWNrLCBsZWZ0LXRvLXJpZ2h0IHNsaWRlIG9mIHRoZSBmaW5nZXIuXG4gKiBUaG91Z2ggbmdTd2lwZVJpZ2h0IGlzIGRlc2lnbmVkIGZvciB0b3VjaC1iYXNlZCBkZXZpY2VzLCBpdCB3aWxsIHdvcmsgd2l0aCBhIG1vdXNlIGNsaWNrIGFuZCBkcmFnXG4gKiB0b28uXG4gKlxuICogUmVxdWlyZXMgdGhlIHtAbGluayBuZ1RvdWNoIGBuZ1RvdWNoYH0gbW9kdWxlIHRvIGJlIGluc3RhbGxlZC5cbiAqXG4gKiBAZWxlbWVudCBBTllcbiAqIEBwYXJhbSB7ZXhwcmVzc2lvbn0gbmdTd2lwZVJpZ2h0IHtAbGluayBndWlkZS9leHByZXNzaW9uIEV4cHJlc3Npb259IHRvIGV2YWx1YXRlXG4gKiB1cG9uIHJpZ2h0IHN3aXBlLiAoRXZlbnQgb2JqZWN0IGlzIGF2YWlsYWJsZSBhcyBgJGV2ZW50YClcbiAqXG4gKiBAZXhhbXBsZVxuICAgIDxleGFtcGxlIG1vZHVsZT1cIm5nU3dpcGVSaWdodEV4YW1wbGVcIiBkZXBzPVwiYW5ndWxhci10b3VjaC5qc1wiPlxuICAgICAgPGZpbGUgbmFtZT1cImluZGV4Lmh0bWxcIj5cbiAgICAgICAgPGRpdiBuZy1zaG93PVwiIXNob3dBY3Rpb25zXCIgbmctc3dpcGUtbGVmdD1cInNob3dBY3Rpb25zID0gdHJ1ZVwiPlxuICAgICAgICAgIFNvbWUgbGlzdCBjb250ZW50LCBsaWtlIGFuIGVtYWlsIGluIHRoZSBpbmJveFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBuZy1zaG93PVwic2hvd0FjdGlvbnNcIiBuZy1zd2lwZS1yaWdodD1cInNob3dBY3Rpb25zID0gZmFsc2VcIj5cbiAgICAgICAgICA8YnV0dG9uIG5nLWNsaWNrPVwicmVwbHkoKVwiPlJlcGx5PC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBuZy1jbGljaz1cImRlbGV0ZSgpXCI+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9maWxlPlxuICAgICAgPGZpbGUgbmFtZT1cInNjcmlwdC5qc1wiPlxuICAgICAgICBhbmd1bGFyLm1vZHVsZSgnbmdTd2lwZVJpZ2h0RXhhbXBsZScsIFsnbmdUb3VjaCddKTtcbiAgICAgIDwvZmlsZT5cbiAgICA8L2V4YW1wbGU+XG4gKi9cblxuZnVuY3Rpb24gbWFrZVN3aXBlRGlyZWN0aXZlKGRpcmVjdGl2ZU5hbWUsIGRpcmVjdGlvbiwgZXZlbnROYW1lKSB7XG4gIG5nVG91Y2guZGlyZWN0aXZlKGRpcmVjdGl2ZU5hbWUsIFsnJHBhcnNlJywgJyRzd2lwZScsIGZ1bmN0aW9uKCRwYXJzZSwgJHN3aXBlKSB7XG4gICAgLy8gVGhlIG1heGltdW0gdmVydGljYWwgZGVsdGEgZm9yIGEgc3dpcGUgc2hvdWxkIGJlIGxlc3MgdGhhbiA3NXB4LlxuICAgIHZhciBNQVhfVkVSVElDQUxfRElTVEFOQ0UgPSA3NTtcbiAgICAvLyBWZXJ0aWNhbCBkaXN0YW5jZSBzaG91bGQgbm90IGJlIG1vcmUgdGhhbiBhIGZyYWN0aW9uIG9mIHRoZSBob3Jpem9udGFsIGRpc3RhbmNlLlxuICAgIHZhciBNQVhfVkVSVElDQUxfUkFUSU8gPSAwLjM7XG4gICAgLy8gQXQgbGVhc3QgYSAzMHB4IGxhdGVyYWwgbW90aW9uIGlzIG5lY2Vzc2FyeSBmb3IgYSBzd2lwZS5cbiAgICB2YXIgTUlOX0hPUklaT05UQUxfRElTVEFOQ0UgPSAzMDtcblxuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xuICAgICAgdmFyIHN3aXBlSGFuZGxlciA9ICRwYXJzZShhdHRyW2RpcmVjdGl2ZU5hbWVdKTtcblxuICAgICAgdmFyIHN0YXJ0Q29vcmRzLCB2YWxpZDtcblxuICAgICAgZnVuY3Rpb24gdmFsaWRTd2lwZShjb29yZHMpIHtcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBpdCdzIHdpdGhpbiB0aGUgY29vcmRpbmF0ZXMuXG4gICAgICAgIC8vIEFic29sdXRlIHZlcnRpY2FsIGRpc3RhbmNlIG11c3QgYmUgd2l0aGluIHRvbGVyYW5jZXMuXG4gICAgICAgIC8vIEhvcml6b250YWwgZGlzdGFuY2UsIHdlIHRha2UgdGhlIGN1cnJlbnQgWCAtIHRoZSBzdGFydGluZyBYLlxuICAgICAgICAvLyBUaGlzIGlzIG5lZ2F0aXZlIGZvciBsZWZ0d2FyZCBzd2lwZXMgYW5kIHBvc2l0aXZlIGZvciByaWdodHdhcmQgc3dpcGVzLlxuICAgICAgICAvLyBBZnRlciBtdWx0aXBseWluZyBieSB0aGUgZGlyZWN0aW9uICgtMSBmb3IgbGVmdCwgKzEgZm9yIHJpZ2h0KSwgbGVnYWwgc3dpcGVzXG4gICAgICAgIC8vIChpZS4gc2FtZSBkaXJlY3Rpb24gYXMgdGhlIGRpcmVjdGl2ZSB3YW50cykgd2lsbCBoYXZlIGEgcG9zaXRpdmUgZGVsdGEgYW5kXG4gICAgICAgIC8vIGlsbGVnYWwgb25lcyBhIG5lZ2F0aXZlIGRlbHRhLlxuICAgICAgICAvLyBUaGVyZWZvcmUgdGhpcyBkZWx0YSBtdXN0IGJlIHBvc2l0aXZlLCBhbmQgbGFyZ2VyIHRoYW4gdGhlIG1pbmltdW0uXG4gICAgICAgIGlmICghc3RhcnRDb29yZHMpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIGRlbHRhWSA9IE1hdGguYWJzKGNvb3Jkcy55IC0gc3RhcnRDb29yZHMueSk7XG4gICAgICAgIHZhciBkZWx0YVggPSAoY29vcmRzLnggLSBzdGFydENvb3Jkcy54KSAqIGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIHZhbGlkICYmIC8vIFNob3J0IGNpcmN1aXQgZm9yIGFscmVhZHktaW52YWxpZGF0ZWQgc3dpcGVzLlxuICAgICAgICAgICAgZGVsdGFZIDwgTUFYX1ZFUlRJQ0FMX0RJU1RBTkNFICYmXG4gICAgICAgICAgICBkZWx0YVggPiAwICYmXG4gICAgICAgICAgICBkZWx0YVggPiBNSU5fSE9SSVpPTlRBTF9ESVNUQU5DRSAmJlxuICAgICAgICAgICAgZGVsdGFZIC8gZGVsdGFYIDwgTUFYX1ZFUlRJQ0FMX1JBVElPO1xuICAgICAgfVxuXG4gICAgICB2YXIgcG9pbnRlclR5cGVzID0gWyd0b3VjaCddO1xuICAgICAgaWYgKCFhbmd1bGFyLmlzRGVmaW5lZChhdHRyWyduZ1N3aXBlRGlzYWJsZU1vdXNlJ10pKSB7XG4gICAgICAgIHBvaW50ZXJUeXBlcy5wdXNoKCdtb3VzZScpO1xuICAgICAgfVxuICAgICAgJHN3aXBlLmJpbmQoZWxlbWVudCwge1xuICAgICAgICAnc3RhcnQnOiBmdW5jdGlvbihjb29yZHMsIGV2ZW50KSB7XG4gICAgICAgICAgc3RhcnRDb29yZHMgPSBjb29yZHM7XG4gICAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICAnY2FuY2VsJzogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICAnZW5kJzogZnVuY3Rpb24oY29vcmRzLCBldmVudCkge1xuICAgICAgICAgIGlmICh2YWxpZFN3aXBlKGNvb3JkcykpIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC50cmlnZ2VySGFuZGxlcihldmVudE5hbWUpO1xuICAgICAgICAgICAgICBzd2lwZUhhbmRsZXIoc2NvcGUsIHskZXZlbnQ6IGV2ZW50fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHBvaW50ZXJUeXBlcyk7XG4gICAgfTtcbiAgfV0pO1xufVxuXG4vLyBMZWZ0IGlzIG5lZ2F0aXZlIFgtY29vcmRpbmF0ZSwgcmlnaHQgaXMgcG9zaXRpdmUuXG5tYWtlU3dpcGVEaXJlY3RpdmUoJ25nU3dpcGVMZWZ0JywgLTEsICdzd2lwZWxlZnQnKTtcbm1ha2VTd2lwZURpcmVjdGl2ZSgnbmdTd2lwZVJpZ2h0JywgMSwgJ3N3aXBlcmlnaHQnKTtcblxuXG5cbn0pKHdpbmRvdywgd2luZG93LmFuZ3VsYXIpO1xuIiwicmVxdWlyZSgnLi9hbmd1bGFyLXRvdWNoJyk7XG5tb2R1bGUuZXhwb3J0cyA9ICduZ1RvdWNoJztcbiJdfQ==

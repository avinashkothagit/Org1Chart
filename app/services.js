'use strict';

var module = angular.module('orgchart.services', []);

var headers = function () {
    return {
        headers: {
            'Access-Token': canvasContext.client.oauthToken,
            'Instance-Url': canvasContext.client.instanceUrl
        }
    }
};

//local storage caching
module.service('orgChartCacheService', function ($http, $angularCacheFactory, $q) {

    //default cache definition
    var employeeCache = $angularCacheFactory('employeeCache', {
        maxAge: 43200000, //12 hours
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
            if ((valueIndex != -1) && (splitStr.length > (valueIndex + 1)) && (!isNaN(splitStr[valueIndex + 1]))) {
                valueIndex = splitStr[valueIndex + 1];
                employeeCache.setOptions({maxAge: (parseInt(valueIndex) * 1000)});
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

});

module.factory('Search', ['$http', function ($http) {
    return {
        getSearch: function (searchQuery) {
            //default 'application/json' content type.
            return $http.post('/services/orgchart', searchQuery, headers());
        }
    };
}]);

module.service('sharedFunctions', function () {
    //hides search results element
    this.toggleSearchDisplay = function (value) {
        var wrapperEle = document.getElementById("searchResultWrapper");

        wrapperEle.className = value;
    };
});
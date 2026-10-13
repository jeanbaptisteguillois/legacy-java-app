(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('NotificationService', ['$http', 'API_BASE_URL', NotificationService]);

    function NotificationService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/notifications';

        return {
            getAll: getAll,
            sendTest: sendTest
        };

        function getAll() {
            return $http.get(baseUrl);
        }

        function sendTest() {
            return $http.post(baseUrl + '/test');
        }
    }
})();

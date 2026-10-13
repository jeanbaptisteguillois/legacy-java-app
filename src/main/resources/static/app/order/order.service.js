(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('OrderService', ['$http', 'API_BASE_URL', OrderService]);

    function OrderService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/orders';

        return {
            getAll: getAll,
            getById: getById,
            place: place,
            updateStatus: updateStatus,
            cancel: cancel
        };

        function getAll() {
            return $http.get(baseUrl);
        }

        function getById(id) {
            return $http.get(baseUrl + '/' + id);
        }

        function place(orderRequest) {
            return $http.post(baseUrl, orderRequest);
        }

        function updateStatus(id, status) {
            return $http.put(baseUrl + '/' + id + '/status', null, {
                params: { value: status }
            });
        }

        function cancel(id) {
            return $http.put(baseUrl + '/' + id + '/cancel', null);
        }
    }
})();

(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('CustomerService', ['$http', 'API_BASE_URL', CustomerService]);

    function CustomerService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/customers';

        return {
            getAll: getAll,
            getById: getById,
            create: create,
            update: update,
            remove: remove
        };

        function getAll() {
            return $http.get(baseUrl);
        }

        function getById(id) {
            return $http.get(baseUrl + '/' + id);
        }

        function create(customer) {
            return $http.post(baseUrl, customer);
        }

        function update(id, customer) {
            return $http.put(baseUrl + '/' + id, customer);
        }

        function remove(id) {
            return $http.delete(baseUrl + '/' + id);
        }
    }
})();

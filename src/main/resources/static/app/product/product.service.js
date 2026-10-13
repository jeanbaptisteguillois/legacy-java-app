(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('ProductService', ['$http', 'API_BASE_URL', ProductService]);

    function ProductService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/products';

        return {
            getAll: getAll,
            getLowStock: getLowStock,
            getById: getById,
            create: create,
            update: update,
            remove: remove
        };

        function getAll() {
            return $http.get(baseUrl);
        }

        function getLowStock() {
            return $http.get(baseUrl + '/low-stock');
        }

        function getById(id) {
            return $http.get(baseUrl + '/' + id);
        }

        function create(product) {
            return $http.post(baseUrl, product);
        }

        function update(id, product) {
            return $http.put(baseUrl + '/' + id, product);
        }

        function remove(id) {
            return $http.delete(baseUrl + '/' + id);
        }
    }
})();

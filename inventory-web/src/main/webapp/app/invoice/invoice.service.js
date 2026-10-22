(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('InvoiceService', ['$http', 'API_BASE_URL', InvoiceService]);

    function InvoiceService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/invoices';

        return {
            getAll: getAll,
            generate: generate,
            markPaid: markPaid
        };

        function getAll() {
            return $http.get(baseUrl);
        }

        function generate(orderId) {
            return $http.post(baseUrl + '/generate/' + orderId);
        }

        function markPaid(id) {
            return $http.put(baseUrl + '/' + id + '/mark-paid', null);
        }
    }
})();

(function () {
    'use strict';

    angular.module('inventoryApp')
        .factory('ReportService', ['$http', 'API_BASE_URL', ReportService]);

    function ReportService($http, API_BASE_URL) {
        var baseUrl = API_BASE_URL + '/reports';

        return {
            getSalesSummary: getSalesSummary,
            getLowStockAlerts: getLowStockAlerts,
            dispatchLowStockAlerts: dispatchLowStockAlerts
        };

        function getSalesSummary() {
            return $http.get(baseUrl + '/sales-summary');
        }

        function getLowStockAlerts() {
            return $http.get(baseUrl + '/low-stock-alerts');
        }

        function dispatchLowStockAlerts() {
            return $http.post(baseUrl + '/low-stock-alerts/dispatch');
        }
    }
})();

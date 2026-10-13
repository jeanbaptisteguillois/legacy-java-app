(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('DashboardController', ['ReportService', DashboardController]);

    function DashboardController(ReportService) {
        var vm = this;

        vm.summary = null;
        vm.lowStockAlerts = [];
        vm.loading = true;
        vm.error = null;
        vm.dispatchAlerts = dispatchAlerts;

        activate();

        function activate() {
            ReportService.getSalesSummary().then(function (response) {
                vm.summary = response.data;
            });
            ReportService.getLowStockAlerts().then(function (response) {
                vm.lowStockAlerts = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load dashboard data (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function dispatchAlerts() {
            ReportService.dispatchLowStockAlerts();
        }
    }
})();

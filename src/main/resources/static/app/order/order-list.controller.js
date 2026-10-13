(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('OrderListController', ['OrderService', OrderListController]);

    function OrderListController(OrderService) {
        var vm = this;

        vm.orders = [];
        vm.loading = true;
        vm.error = null;
        vm.cancelOrder = cancelOrder;
        vm.markShipped = markShipped;

        activate();

        function activate() {
            OrderService.getAll().then(function (response) {
                vm.orders = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load orders (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function cancelOrder(order) {
            if (!window.confirm('Cancel order #' + order.id + '?')) {
                return;
            }
            OrderService.cancel(order.id).then(function () {
                order.status = 'CANCELLED';
            });
        }

        function markShipped(order) {
            OrderService.updateStatus(order.id, 'SHIPPED').then(function (response) {
                order.status = response.data.status;
            });
        }
    }
})();

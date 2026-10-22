(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('OrderNewController', ['$location', 'OrderService', 'CustomerService', 'ProductService', OrderNewController]);

    function OrderNewController($location, OrderService, CustomerService, ProductService) {
        var vm = this;

        vm.customers = [];
        vm.products = [];
        vm.request = {
            customerId: null,
            lineItems: []
        };
        vm.saving = false;
        vm.error = null;
        vm.addLineItem = addLineItem;
        vm.removeLineItem = removeLineItem;
        vm.submitOrder = submitOrder;

        activate();

        function activate() {
            CustomerService.getAll().then(function (response) {
                vm.customers = response.data;
            });
            ProductService.getAll().then(function (response) {
                vm.products = response.data;
            });
            addLineItem();
        }

        function addLineItem() {
            vm.request.lineItems.push({ productId: null, quantity: 1 });
        }

        function removeLineItem(index) {
            vm.request.lineItems.splice(index, 1);
        }

        function submitOrder() {
            vm.saving = true;
            OrderService.place(vm.request).then(function () {
                $location.path('/orders');
            }, function (response) {
                vm.error = response.data || ('Failed to place order (status ' + response.status + ')');
                vm.saving = false;
            });
        }
    }
})();

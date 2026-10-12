(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('CustomerListController', ['CustomerService', CustomerListController]);

    function CustomerListController(CustomerService) {
        var vm = this;

        vm.customers = [];
        vm.loading = true;
        vm.error = null;
        vm.deleteCustomer = deleteCustomer;

        activate();

        function activate() {
            CustomerService.getAll().then(function (response) {
                vm.customers = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load customers (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function deleteCustomer(customer) {
            if (!window.confirm('Delete customer ' + customer.email + '?')) {
                return;
            }
            CustomerService.remove(customer.id).then(function () {
                vm.customers = vm.customers.filter(function (c) {
                    return c.id !== customer.id;
                });
            });
        }
    }
})();

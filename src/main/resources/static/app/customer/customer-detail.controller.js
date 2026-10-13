(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('CustomerDetailController', ['$routeParams', '$location', 'CustomerService', CustomerDetailController]);

    function CustomerDetailController($routeParams, $location, CustomerService) {
        var vm = this;

        vm.customer = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            shippingAddress: ''
        };
        vm.isNew = !$routeParams.customerId;
        vm.saving = false;
        vm.error = null;
        vm.save = save;

        activate();

        function activate() {
            if (!vm.isNew) {
                CustomerService.getById($routeParams.customerId).then(function (response) {
                    vm.customer = response.data;
                });
            }
        }

        function save() {
            vm.saving = true;
            var request = vm.isNew
                ? CustomerService.create(vm.customer)
                : CustomerService.update(vm.customer.id, vm.customer);

            request.then(function () {
                $location.path('/customers');
            }, function (response) {
                vm.error = 'Failed to save customer (status ' + response.status + ')';
                vm.saving = false;
            });
        }
    }
})();

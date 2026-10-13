(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('ProductDetailController', ['$routeParams', '$location', 'ProductService', ProductDetailController]);

    function ProductDetailController($routeParams, $location, ProductService) {
        var vm = this;

        vm.product = {
            sku: '',
            name: '',
            description: '',
            unitPrice: 0,
            quantityOnHand: 0,
            reorderThreshold: 0
        };
        vm.isNew = !$routeParams.productId;
        vm.saving = false;
        vm.error = null;
        vm.save = save;

        activate();

        function activate() {
            if (!vm.isNew) {
                ProductService.getById($routeParams.productId).then(function (response) {
                    vm.product = response.data;
                });
            }
        }

        function save() {
            vm.saving = true;
            var request = vm.isNew
                ? ProductService.create(vm.product)
                : ProductService.update(vm.product.id, vm.product);

            request.then(function () {
                $location.path('/products');
            }, function (response) {
                vm.error = 'Failed to save product (status ' + response.status + ')';
                vm.saving = false;
            });
        }
    }
})();

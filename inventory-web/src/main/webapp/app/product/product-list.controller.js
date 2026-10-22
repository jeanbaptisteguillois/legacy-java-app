(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('ProductListController', ['ProductService', ProductListController]);

    function ProductListController(ProductService) {
        var vm = this;

        vm.products = [];
        vm.loading = true;
        vm.error = null;
        vm.deleteProduct = deleteProduct;

        activate();

        function activate() {
            ProductService.getAll().then(function (response) {
                vm.products = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load products (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function deleteProduct(product) {
            if (!window.confirm('Delete product ' + product.sku + '?')) {
                return;
            }
            ProductService.remove(product.id).then(function () {
                vm.products = vm.products.filter(function (p) {
                    return p.id !== product.id;
                });
            });
        }
    }
})();

(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('InvoiceListController', ['InvoiceService', InvoiceListController]);

    function InvoiceListController(InvoiceService) {
        var vm = this;

        vm.invoices = [];
        vm.loading = true;
        vm.error = null;
        vm.generateOrderId = null;
        vm.generateInvoice = generateInvoice;
        vm.markPaid = markPaid;

        activate();

        function activate() {
            InvoiceService.getAll().then(function (response) {
                vm.invoices = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load invoices (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function generateInvoice() {
            if (!vm.generateOrderId) {
                return;
            }
            InvoiceService.generate(vm.generateOrderId).then(function (response) {
                vm.invoices.unshift(response.data);
                vm.generateOrderId = null;
            }, function (response) {
                vm.error = response.data || ('Failed to generate invoice (status ' + response.status + ')');
            });
        }

        function markPaid(invoice) {
            InvoiceService.markPaid(invoice.id).then(function (response) {
                invoice.paymentStatus = response.data.paymentStatus;
            });
        }
    }
})();

(function () {
    'use strict';

    angular.module('inventoryApp')
        .controller('NotificationListController', ['NotificationService', NotificationListController]);

    function NotificationListController(NotificationService) {
        var vm = this;

        vm.notifications = [];
        vm.loading = true;
        vm.error = null;
        vm.sendTest = sendTest;

        activate();

        function activate() {
            NotificationService.getAll().then(function (response) {
                vm.notifications = response.data;
                vm.loading = false;
            }, function (response) {
                vm.error = 'Failed to load notifications (status ' + response.status + ')';
                vm.loading = false;
            });
        }

        function sendTest() {
            NotificationService.sendTest().then(function (response) {
                vm.notifications.unshift(response.data);
            });
        }
    }
})();

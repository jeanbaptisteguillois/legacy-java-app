(function () {
    'use strict';

    angular.module('inventoryApp')
        .config(['$routeProvider', '$locationProvider', configRoutes]);

    function configRoutes($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix('!');

        $routeProvider
            .when('/dashboard', {
                templateUrl: 'app/report/dashboard.html',
                controller: 'DashboardController',
                controllerAs: 'vm'
            })
            .when('/products', {
                templateUrl: 'app/product/product-list.html',
                controller: 'ProductListController',
                controllerAs: 'vm'
            })
            .when('/products/new', {
                templateUrl: 'app/product/product-detail.html',
                controller: 'ProductDetailController',
                controllerAs: 'vm'
            })
            .when('/products/:productId', {
                templateUrl: 'app/product/product-detail.html',
                controller: 'ProductDetailController',
                controllerAs: 'vm'
            })
            .when('/customers', {
                templateUrl: 'app/customer/customer-list.html',
                controller: 'CustomerListController',
                controllerAs: 'vm'
            })
            .when('/customers/new', {
                templateUrl: 'app/customer/customer-detail.html',
                controller: 'CustomerDetailController',
                controllerAs: 'vm'
            })
            .when('/customers/:customerId', {
                templateUrl: 'app/customer/customer-detail.html',
                controller: 'CustomerDetailController',
                controllerAs: 'vm'
            })
            .when('/orders', {
                templateUrl: 'app/order/order-list.html',
                controller: 'OrderListController',
                controllerAs: 'vm'
            })
            .when('/orders/new', {
                templateUrl: 'app/order/order-new.html',
                controller: 'OrderNewController',
                controllerAs: 'vm'
            })
            .when('/invoices', {
                templateUrl: 'app/invoice/invoice-list.html',
                controller: 'InvoiceListController',
                controllerAs: 'vm'
            })
            .when('/notifications', {
                templateUrl: 'app/notification/notification-list.html',
                controller: 'NotificationListController',
                controllerAs: 'vm'
            })
            .otherwise({
                redirectTo: '/dashboard'
            });
    }
})();

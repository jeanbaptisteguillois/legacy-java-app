import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './shared/AppLayout';
import { DashboardPage } from './features/report/DashboardPage';
import { ProductListPage } from './features/product/ProductListPage';
import { ProductDetailPage } from './features/product/ProductDetailPage';
import { CustomerListPage } from './features/customer/CustomerListPage';
import { CustomerDetailPage } from './features/customer/CustomerDetailPage';
import { OrderListPage } from './features/order/OrderListPage';
import { OrderNewPage } from './features/order/OrderNewPage';
import { InvoiceListPage } from './features/invoice/InvoiceListPage';
import { NotificationListPage } from './features/notification/NotificationListPage';

/**
 * Path routing port of the AngularJS `$routeProvider` table (hashbang dropped).
 * `/` and every unknown location redirect to /dashboard, matching `.otherwise()`.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/new', element: <ProductDetailPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'customers', element: <CustomerListPage /> },
      { path: 'customers/new', element: <CustomerDetailPage /> },
      { path: 'customers/:customerId', element: <CustomerDetailPage /> },
      { path: 'orders', element: <OrderListPage /> },
      { path: 'orders/new', element: <OrderNewPage /> },
      { path: 'invoices', element: <InvoiceListPage /> },
      { path: 'notifications', element: <NotificationListPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

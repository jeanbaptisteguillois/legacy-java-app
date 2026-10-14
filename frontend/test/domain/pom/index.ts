/**
 * Single entry point for Layer 1. Scenarios only ever import from here.
 */
import { Page } from '@playwright/test';

export type { ApiCall } from './base-page';
export { ProductCatalogPage, ProductFormPage } from './product-pages';
export { CustomerDirectoryPage, CustomerFormPage } from './customer-pages';
export { OrderBookPage, OrderPlacementPage } from './order-pages';
export { InvoiceLedgerPage, NotificationLogPage, DashboardPage } from './back-office-pages';
export { AppShell } from './app-shell';
export { DataLayerGateway } from './data-layer-gateway';

import { ProductCatalogPage, ProductFormPage } from './product-pages';
import { CustomerDirectoryPage, CustomerFormPage } from './customer-pages';
import { OrderBookPage, OrderPlacementPage } from './order-pages';
import { InvoiceLedgerPage, NotificationLogPage, DashboardPage } from './back-office-pages';
import { AppShell } from './app-shell';
import { DataLayerGateway } from './data-layer-gateway';

export interface Application {
  shell: AppShell;
  productCatalog: ProductCatalogPage;
  productForm: ProductFormPage;
  customerDirectory: CustomerDirectoryPage;
  customerForm: CustomerFormPage;
  orderBook: OrderBookPage;
  orderPlacement: OrderPlacementPage;
  invoiceLedger: InvoiceLedgerPage;
  notificationLog: NotificationLogPage;
  dashboard: DashboardPage;
  dataLayer: DataLayerGateway;
}

export function application(page: Page): Application {
  return {
    shell: new AppShell(page),
    productCatalog: new ProductCatalogPage(page),
    productForm: new ProductFormPage(page),
    customerDirectory: new CustomerDirectoryPage(page),
    customerForm: new CustomerFormPage(page),
    orderBook: new OrderBookPage(page),
    orderPlacement: new OrderPlacementPage(page),
    invoiceLedger: new InvoiceLedgerPage(page),
    notificationLog: new NotificationLogPage(page),
    dashboard: new DashboardPage(page),
    dataLayer: new DataLayerGateway(page),
  };
}

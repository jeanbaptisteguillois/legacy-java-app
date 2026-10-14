import { CustomerService } from '../services/customer.service';
import { InvoiceService } from '../services/invoice.service';
import { NotificationService } from '../services/notification.service';
import { OrderService } from '../services/order.service';
import { ProductService } from '../services/product.service';
import { ReportService } from '../services/report.service';

/**
 * The AngularJS app let Playwright reach its data layer through the injector
 * (`injector.get('ProductService')`). React has no injector, so the same six
 * service modules are published on `window` under their domain names. The
 * `DataLayerGateway` page object drives this bridge; nothing in the UI uses it.
 */
export const services = {
  ProductService,
  CustomerService,
  OrderService,
  InvoiceService,
  NotificationService,
  ReportService,
} as const;

export type ServiceRegistry = typeof services;

declare global {
  interface Window {
    __services__?: ServiceRegistry;
  }
}

export function exposeServices(): void {
  window.__services__ = services;
}

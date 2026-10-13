import { Page } from '@playwright/test';
import { installQuiescenceProbe, waitForQuiescence } from './base-page';

export interface DataLayerResult<T = any> {
  status: number;
  data: T;
}

/**
 * Drives the application's own data-access layer (its service modules) inside
 * the running app, for behaviour the UI never reaches — low-stock lookups,
 * single-record fetches, validation rejections.
 *
 * The method signatures below are the contract; the React POM reimplements the
 * bodies against the React service modules.
 */
export class DataLayerGateway {
  constructor(private readonly page: Page) {}

  /** Loads the application so its services are available. */
  async open(): Promise<void> {
    await installQuiescenceProbe(this.page);
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // The service registry is published by main.tsx before the first render.
    await this.page.waitForFunction(() => !!(window as any).__services__);
    await waitForQuiescence(this.page);
  }

  /**
   * React port of the AngularJS injector lookup.
   *
   * `injector.get('ProductService')` becomes `window.__services__.ProductService`
   * (published by `src/services/registry.ts`). The service modules keep the
   * `$http` contract: they resolve with `{ status, data }` and reject with an
   * `HttpError` carrying the same two properties, so the resolve/reject
   * normalisation below is unchanged in meaning.
   */
  private invoke(service: string, method: string, args: unknown[] = []): Promise<DataLayerResult> {
    return this.page.evaluate(
      ({ service, method, args }) => {
        const registry = (window as any).__services__;
        if (!registry) {
          throw new Error(
            'window.__services__ is not available — the React app did not expose its data layer'
          );
        }
        const target = registry[service];
        if (!target || typeof target[method] !== 'function') {
          throw new Error(`No data-layer operation ${service}.${method}`);
        }
        return Promise.resolve(target[method].apply(target, args)).then(
          (res: any) => ({ status: res.status, data: res.data }),
          (err: any) => ({ status: err && err.status, data: err && err.data })
        );
      },
      { service, method, args }
    );
  }

  // ----------------------------------------------------------------- products
  fetchProductsNeedingReorder(): Promise<DataLayerResult<any[]>> {
    return this.invoke('ProductService', 'getLowStock');
  }

  fetchProduct(id: number): Promise<DataLayerResult> {
    return this.invoke('ProductService', 'getById', [id]);
  }

  createProduct(product: Record<string, unknown>): Promise<DataLayerResult> {
    return this.invoke('ProductService', 'create', [product]);
  }

  updateProduct(id: number, product: Record<string, unknown>): Promise<DataLayerResult> {
    return this.invoke('ProductService', 'update', [id, product]);
  }

  deleteProduct(id: number): Promise<DataLayerResult> {
    return this.invoke('ProductService', 'remove', [id]);
  }

  // ---------------------------------------------------------------- customers
  fetchCustomer(id: number): Promise<DataLayerResult> {
    return this.invoke('CustomerService', 'getById', [id]);
  }

  createCustomer(customer: Record<string, unknown>): Promise<DataLayerResult> {
    return this.invoke('CustomerService', 'create', [customer]);
  }

  updateCustomer(id: number, customer: Record<string, unknown>): Promise<DataLayerResult> {
    return this.invoke('CustomerService', 'update', [id, customer]);
  }

  deleteCustomer(id: number): Promise<DataLayerResult> {
    return this.invoke('CustomerService', 'remove', [id]);
  }

  // ------------------------------------------------------------------- orders
  fetchOrder(id: number): Promise<DataLayerResult> {
    return this.invoke('OrderService', 'getById', [id]);
  }

  changeOrderStatus(id: number, status: string): Promise<DataLayerResult> {
    return this.invoke('OrderService', 'updateStatus', [id, status]);
  }

  cancelOrder(id: number): Promise<DataLayerResult> {
    return this.invoke('OrderService', 'cancel', [id]);
  }

  // ----------------------------------------------------------------- invoices
  markInvoicePaid(id: number): Promise<DataLayerResult> {
    return this.invoke('InvoiceService', 'markPaid', [id]);
  }

  // ------------------------------------------------------------ notifications
  fetchNotifications(): Promise<DataLayerResult<any[]>> {
    return this.invoke('NotificationService', 'getAll');
  }

  sendTestNotification(): Promise<DataLayerResult> {
    return this.invoke('NotificationService', 'sendTest');
  }

  // ------------------------------------------------------------------ reports
  fetchSalesSummary(): Promise<DataLayerResult> {
    return this.invoke('ReportService', 'getSalesSummary');
  }

  dispatchLowStockAlerts(): Promise<DataLayerResult> {
    return this.invoke('ReportService', 'dispatchLowStockAlerts');
  }
}

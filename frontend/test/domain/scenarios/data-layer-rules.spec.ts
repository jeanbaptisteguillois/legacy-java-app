/**
 * Layer 1 — Data layer behaviour the user interface never reaches directly:
 * reorder lookups, single-record retrieval, and the rules the backend enforces
 * when a request is not allowed.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Data layer rules exposed through the application services', () => {
  test.beforeEach(async ({ page }) => {
    await application(page).dataLayer.open();
  });

  test('A reorder lookup returns only products whose stock has fallen to or below their reorder threshold', async ({ page }) => {
    const result = await application(page).dataLayer.fetchProductsNeedingReorder();

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    for (const product of result.data) {
      expect(product.quantityOnHand).toBeLessThanOrEqual(product.reorderThreshold);
    }
  });

  test('A single order can be retrieved by its number, and an unknown number reports that nothing was found', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    const found = await dataLayer.fetchOrder(1002);
    expect(found.status).toBe(200);
    expect(found.data.status).toBe('CONFIRMED');

    const missing = await dataLayer.fetchOrder(999999);
    expect(missing.status).toBe(404);
  });

  test('An order cannot be moved into a fulfilment state that does not exist', async ({ page }) => {
    const result = await application(page).dataLayer.changeOrderStatus(1001, 'NONSENSE');
    expect(result.status).toBe(400);
  });

  test('An order that has already been delivered can no longer be cancelled', async ({ page }) => {
    const result = await application(page).dataLayer.cancelOrder(1004);
    expect(result.status).toBe(409);
  });

  test('Deleting a customer or a product that does not exist reports that nothing was found', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    expect((await dataLayer.deleteCustomer(999999)).status).toBe(404);
    expect((await dataLayer.deleteProduct(999999)).status).toBe(404);
  });

  test('An invoice that has already been settled cannot be marked as paid a second time', async ({ page }) => {
    const result = await application(page).dataLayer.markInvoicePaid(501);
    expect(result.status).toBe(409);
  });

  test('A single product and a single customer can each be retrieved by identity, including the derived low stock flag', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    const product = await dataLayer.fetchProduct(3);
    expect(product.status).toBe(200);
    expect(product.data.sku).toBe('SKU-1003');
    expect(product.data.lowStock).toBe(true);

    const customer = await dataLayer.fetchCustomer(3);
    expect(customer.status).toBe(200);
    expect(customer.data.email).toBe('grace@example.com');
  });

  test('Trading figures are summarised across all orders and invoices, and low stock alerts can be dispatched on demand', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    const summary = await dataLayer.fetchSalesSummary();
    expect(summary.status).toBe(200);
    expect(summary.data.totalOrders).toBe(5);
    expect(summary.data.pendingInvoices).toBe(1);

    const dispatched = await dataLayer.dispatchLowStockAlerts();
    expect(dispatched.status).toBe(200);
    expect(dispatched.data.dispatched).toBeGreaterThan(0);
  });

  test('Amending a customer or a product stores the new values and returns the updated record', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    const customer = await dataLayer.updateCustomer(1, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+44 000',
      shippingAddress: 'X',
    });
    expect(customer.status).toBe(200);
    expect(customer.data.phone).toBe('+44 000');

    const product = await dataLayer.updateProduct(1, {
      sku: 'SKU-1001',
      name: 'Widget Standard',
      unitPrice: 20,
      quantityOnHand: 5,
      reorderThreshold: 25,
    });
    expect(product.status).toBe(200);
    expect(product.data.lowStock).toBe(true);
  });

  test('The notification history can be retrieved and a test notification is recorded against the test recipient', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    const all = await dataLayer.fetchNotifications();
    expect(all.status).toBe(200);
    expect(all.data.length).toBe(3);

    const sent = await dataLayer.sendTestNotification();
    expect(sent.status).toBe(201);
    expect(sent.data.recipient).toBe('test@example.com');
  });

  test('Creating a product or a customer without the mandatory details is rejected as invalid', async ({ page }) => {
    const dataLayer = application(page).dataLayer;

    expect((await dataLayer.createProduct({ name: 'No SKU' })).status).toBe(400);
    expect((await dataLayer.createCustomer({ firstName: 'Only' })).status).toBe(400);
  });
});

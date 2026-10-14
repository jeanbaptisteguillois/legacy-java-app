/**
 * Layer 1 — Order fulfilment behaviour.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Order book', () => {
  test('The actions offered on an order depend on how far through fulfilment it is', async ({ page }) => {
    const app = application(page);
    await app.orderBook.open();

    expect(await app.orderBook.heading()).toBe('Orders');
    expect(await app.orderBook.recordCount()).toBe(5);

    // A newly placed order can be shipped or cancelled.
    expect(await app.orderBook.canMarkOrderShipped(1001)).toBe(true);
    expect(await app.orderBook.canCancelOrder(1001)).toBe(true);

    // An order already in transit can only be cancelled.
    expect(await app.orderBook.canMarkOrderShipped(1003)).toBe(false);
    expect(await app.orderBook.canCancelOrder(1003)).toBe(true);

    // A delivered order is final.
    expect(await app.orderBook.availableActionCountForOrder(1004)).toBe(0);

    // A cancelled order is final.
    expect(await app.orderBook.availableActionCountForOrder(1005)).toBe(0);
  });

  test('When no orders have been placed the order book is presented with no entries', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.orderBook.open();

    expect(await app.orderBook.recordTableIsVisible()).toBe(true);
    expect(await app.orderBook.recordCount()).toBe(0);
  });

  test('The user is told the order book is loading and the orders replace that message once they arrive', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.orderBook.openWithoutWaitingForData();

    expect(await app.orderBook.loadingIndicatorIsVisible()).toBe(true);

    await backend.delay(0);
    await app.orderBook.settle();
    expect(await app.orderBook.recordTableIsVisible()).toBe(true);
  });

  test('If the order book cannot be retrieved the user is shown an explanatory failure message', async ({ page, backend }) => {
    await backend.failures([{ method: 'GET', path: '^/api/orders$', status: 500 }]);
    const app = application(page);
    await app.orderBook.openWithoutWaitingForData();
    await app.orderBook.settle();

    expect(await app.orderBook.errorMessage()).toBe('Failed to load orders (status 500)');
  });

  test('Dispatching a newly placed order moves it to shipped and withdraws the dispatch action', async ({ page }) => {
    const app = application(page);
    await app.orderBook.open();
    expect(await app.orderBook.statusOfOrder(1001)).toBe('NEW');

    const call = await app.orderBook.markOrderShipped(1001);
    expect(call.method).toBe('PUT');
    expect(call.path).toBe('/api/orders/1001/status?value=SHIPPED');

    expect(await app.orderBook.statusOfOrder(1001)).toBe('SHIPPED');
    expect(await app.orderBook.canMarkOrderShipped(1001)).toBe(false);
  });

  test('A confirmed order can also be dispatched directly to shipped', async ({ page }) => {
    const app = application(page);
    await app.orderBook.open();
    expect(await app.orderBook.statusOfOrder(1002)).toBe('CONFIRMED');

    await app.orderBook.markOrderShipped(1002);
    expect(await app.orderBook.statusOfOrder(1002)).toBe('SHIPPED');
  });

  test('Declining the cancellation warning leaves the order untouched and sends nothing to the backend', async ({ page }) => {
    const app = application(page);
    await app.orderBook.open();

    expect(await app.orderBook.declineCancellationOfOrder(1001)).toBe(true);
    expect(await app.orderBook.statusOfOrder(1001)).toBe('NEW');
  });

  test('Confirming the cancellation warning cancels the order and leaves it with no further actions', async ({ page }) => {
    const app = application(page);
    await app.orderBook.open();

    const call = await app.orderBook.cancelOrder(1001);
    expect(call.method).toBe('PUT');
    expect(call.path).toBe('/api/orders/1001/cancel');

    expect(await app.orderBook.statusOfOrder(1001)).toBe('CANCELLED');
    expect(await app.orderBook.availableActionCountForOrder(1001)).toBe(0);
  });
});

test.describe('Order placement', () => {
  test('An order for several different products can be placed for a chosen customer', async ({ page, backend }) => {
    const app = application(page);
    await app.orderPlacement.open();

    expect(await app.orderPlacement.heading()).toBe('New Order');
    // The order starts with one line item ready to fill in.
    expect(await app.orderPlacement.lineItemCount()).toBe(1);

    await app.orderPlacement.chooseCustomer('Ada Lovelace');
    await app.orderPlacement.chooseProductForLineItem(0, 'SKU-1001');
    await app.orderPlacement.setQuantityForLineItem(0, 2);

    await app.orderPlacement.addLineItem();
    expect(await app.orderPlacement.lineItemCount()).toBe(2);
    await app.orderPlacement.chooseProductForLineItem(1, 'SKU-1004');
    await app.orderPlacement.setQuantityForLineItem(1, 3);

    const call = await app.orderPlacement.placeOrder();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/orders');

    expect(await app.orderBook.heading()).toBe('Orders');
    expect((await backend.state()).counts.orders).toBe(6);
  });

  test('Line items can be added and removed again while composing an order', async ({ page }) => {
    const app = application(page);
    await app.orderPlacement.open();

    await app.orderPlacement.addLineItem();
    await app.orderPlacement.addLineItem();
    expect(await app.orderPlacement.lineItemCount()).toBe(3);

    await app.orderPlacement.removeLineItem(1);
    expect(await app.orderPlacement.lineItemCount()).toBe(2);

    await app.orderPlacement.removeLineItem(0);
    expect(await app.orderPlacement.lineItemCount()).toBe(1);
  });

  test('An order cannot be placed until both a customer and a product have been chosen', async ({ page }) => {
    const app = application(page);
    await app.orderPlacement.open();
    expect(await app.orderPlacement.isPlaceOrderAllowed()).toBe(false);

    await app.orderPlacement.chooseCustomer('Grace Hopper');
    expect(await app.orderPlacement.isPlaceOrderAllowed()).toBe(false);

    await app.orderPlacement.chooseProductForLineItem(0, 'SKU-1001');
    expect(await app.orderPlacement.isPlaceOrderAllowed()).toBe(true);
  });

  test('Ordering more units than are in stock is refused and the backend explanation is shown verbatim so the user can amend the order', async ({ page }) => {
    const app = application(page);
    await app.orderPlacement.open();

    await app.orderPlacement.chooseCustomer('Alan Turing');
    await app.orderPlacement.chooseProductForLineItem(0, 'SKU-1003');
    await app.orderPlacement.setQuantityForLineItem(0, 5);

    await app.orderPlacement.placeOrder();

    expect(await app.orderPlacement.errorMessage()).toContain('Insufficient stock for SKU-1003');
    expect(await app.orderPlacement.heading()).toBe('New Order');
    expect(await app.orderPlacement.isPlaceOrderAllowed()).toBe(true);
  });

  test('If order placement fails without any explanation the user still gets a generic failure message', async ({ page, backend }) => {
    await backend.failures([{ method: 'POST', path: '^/api/orders$', status: 500 }]);
    const app = application(page);
    await app.orderPlacement.open();

    await app.orderPlacement.chooseCustomer('Ada Lovelace');
    await app.orderPlacement.chooseProductForLineItem(0, 'SKU-1001');

    await app.orderPlacement.placeOrder();
    expect(await app.orderPlacement.errorMessage()).toBe('Failed to place order (status 500)');
  });
});

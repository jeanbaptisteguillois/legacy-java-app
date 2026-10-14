/**
 * Layer 1 — Invoicing and billing behaviour.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Invoice ledger', () => {
  test('Settling an invoice is only offered for invoices that are still outstanding', async ({ page }) => {
    const app = application(page);
    await app.invoiceLedger.open();

    expect(await app.invoiceLedger.heading()).toBe('Invoices');
    expect(await app.invoiceLedger.recordCount()).toBe(2);
    expect(await app.invoiceLedger.isSettlementOfferedForInvoiceWithStatus('PAID')).toBe(false);
    expect(await app.invoiceLedger.isSettlementOfferedForInvoiceWithStatus('PENDING')).toBe(true);
  });

  test('Recording a payment against an outstanding invoice marks it as paid for everyone', async ({ page }) => {
    const app = application(page);
    await app.invoiceLedger.open();

    const call = await app.invoiceLedger.markFirstPendingInvoiceAsPaid();
    expect(call.method).toBe('PUT');
    expect(call.path).toMatch(/^\/api\/invoices\/\d+\/mark-paid$/);

    expect(await app.invoiceLedger.hasAnyInvoiceWithStatus('PENDING')).toBe(false);
    expect(await app.invoiceLedger.invoiceCountWithStatus('PAID')).toBe(2);
  });

  test('Asking to invoice an order without naming one does nothing at all and raises no false alarm', async ({ page, backend }) => {
    const app = application(page);
    await app.invoiceLedger.open();
    const before = (await backend.state()).counts.invoices;

    expect(await app.invoiceLedger.generateInvoiceWithoutOrderNumber()).toBe(true);

    expect((await backend.state()).counts.invoices).toBe(before);
    expect(await app.invoiceLedger.isFreeOfErrors()).toBe(true);
  });

  test('Invoicing an eligible order produces a new invoice at the top of the ledger and clears the entry field', async ({ page }) => {
    const app = application(page);
    await app.invoiceLedger.open();

    await app.invoiceLedger.enterOrderNumberToInvoice(1001);
    const call = await app.invoiceLedger.generateInvoice();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/invoices/generate/1001');

    expect(await app.invoiceLedger.recordCount()).toBe(3);
    expect(await app.invoiceLedger.orderNumberOfRow(0)).toBe('1001');
    expect(await app.invoiceLedger.enteredOrderNumber()).toBe('');
  });

  test('Invoicing an order that has already been invoiced is refused with the reason given by the backend', async ({ page }) => {
    const app = application(page);
    await app.invoiceLedger.open();

    await app.invoiceLedger.enterOrderNumberToInvoice(1003);
    await app.invoiceLedger.generateInvoice();

    expect(await app.invoiceLedger.errorMessage()).toContain('already exists for order 1003');
  });

  test('Invoicing an order that does not exist is refused with the reason given by the backend', async ({ page }) => {
    const app = application(page);
    await app.invoiceLedger.open();

    await app.invoiceLedger.enterOrderNumberToInvoice(424242);
    await app.invoiceLedger.generateInvoice();

    expect(await app.invoiceLedger.errorMessage()).toContain('No order with id 424242');
  });

  test('If invoice generation fails without any explanation the user still gets a generic failure message', async ({ page, backend }) => {
    await backend.failures([{ method: 'POST', path: '^/api/invoices/generate/', status: 500 }]);
    const app = application(page);
    await app.invoiceLedger.open();

    await app.invoiceLedger.enterOrderNumberToInvoice(1002);
    await app.invoiceLedger.generateInvoice();

    expect(await app.invoiceLedger.errorMessage()).toBe('Failed to generate invoice (status 500)');
  });

  test('When nothing has been invoiced yet the ledger is presented with no entries', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.invoiceLedger.open();

    expect(await app.invoiceLedger.recordTableIsVisible()).toBe(true);
    expect(await app.invoiceLedger.recordCount()).toBe(0);
  });

  test('The user is told the ledger is loading and the invoices replace that message once they arrive', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.invoiceLedger.openWithoutWaitingForData();

    expect(await app.invoiceLedger.loadingIndicatorIsVisible()).toBe(true);

    await backend.delay(0);
    await app.invoiceLedger.settle();
    expect(await app.invoiceLedger.recordTableIsVisible()).toBe(true);
  });

  test('If the ledger cannot be retrieved the failure is reported and the user is left with an empty but usable ledger', async ({ page, backend }) => {
    await backend.failures([{ method: 'GET', path: '^/api/invoices$', status: 503 }]);
    const app = application(page);
    await app.invoiceLedger.openWithoutWaitingForData();
    await app.invoiceLedger.settle();

    expect(await app.invoiceLedger.errorMessage()).toBe('Failed to load invoices (status 503)');
    expect(await app.invoiceLedger.recordCount()).toBe(0);
  });
});

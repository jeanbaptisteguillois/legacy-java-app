/**
 * Layer 1 — Customer directory behaviour.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Customer directory', () => {
  test('A sales user sees every registered customer with their contact details', async ({ page }) => {
    const app = application(page);
    await app.customerDirectory.open();

    expect(await app.customerDirectory.heading()).toBe('Customers');
    expect(await app.customerDirectory.recordCount()).toBe(3);

    const first = await app.customerDirectory.customerAtRow(0);
    expect(first.name).toContain('Ada Lovelace');
    expect(first.email).toBe('ada@example.com');
  });

  test('When no customers are registered the directory is presented with no entries', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.customerDirectory.open();

    expect(await app.customerDirectory.recordTableIsVisible()).toBe(true);
    expect(await app.customerDirectory.recordCount()).toBe(0);
  });

  test('The user is told the directory is loading and the customer list replaces that message once it arrives', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.customerDirectory.openWithoutWaitingForData();

    expect(await app.customerDirectory.loadingIndicatorIsVisible()).toBe(true);

    await backend.delay(0);
    await app.customerDirectory.settle();
    expect(await app.customerDirectory.recordTableIsVisible()).toBe(true);
  });

  test('If the directory cannot be retrieved the user is shown an explanatory failure message', async ({ page, backend }) => {
    await backend.failures([{ method: 'GET', path: '^/api/customers$', status: 502 }]);
    const app = application(page);
    await app.customerDirectory.openWithoutWaitingForData();
    await app.customerDirectory.settle();

    expect(await app.customerDirectory.errorMessage()).toBe('Failed to load customers (status 502)');
  });

  test('Removing a customer only happens once the user confirms the warning, and is abandoned if they decline it', async ({ page }) => {
    const app = application(page);
    await app.customerDirectory.open();

    expect(await app.customerDirectory.declineDeletionOfLastCustomer()).toBe(true);
    expect(await app.customerDirectory.recordCount()).toBe(3);

    const call = await app.customerDirectory.deleteLastCustomer();
    expect(call.method).toBe('DELETE');
    expect(call.path).toMatch(/^\/api\/customers\/\d+$/);

    expect(await app.customerDirectory.recordCount()).toBe(2);
    expect(await app.customerDirectory.listedEmails()).not.toContain('grace@example.com');
  });
});

test.describe('Customer record maintenance', () => {
  test('A new customer can be registered and immediately appears in the directory', async ({ page, backend }) => {
    const app = application(page);
    await app.customerForm.openBlankForm();

    expect(await app.customerForm.heading()).toBe('New Customer');
    expect(await app.customerForm.valueOf('firstName')).toBe('');
    expect(await app.customerForm.isSaveAllowed()).toBe(false);

    await app.customerForm.enter({
      firstName: 'Margaret',
      lastName: 'Hamilton',
      email: 'margaret@example.com',
      phone: '+1 617 555 0144',
      shippingAddress: '5 Apollo Drive, Cambridge MA',
    });
    expect(await app.customerForm.isSaveAllowed()).toBe(true);

    const call = await app.customerForm.save();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/customers');

    expect(await app.customerDirectory.heading()).toBe('Customers');
    expect(await app.customerDirectory.listedEmails()).toContain('margaret@example.com');
    expect((await backend.state()).counts.customers).toBe(4);
  });

  test('A customer with a malformed email address cannot be saved until the address is corrected', async ({ page }) => {
    const app = application(page);
    await app.customerForm.openBlankForm();

    await app.customerForm.enter({ firstName: 'Bad', lastName: 'Email', email: 'not-an-email' });
    expect(await app.customerForm.isSaveAllowed()).toBe(false);

    await app.customerForm.enter({ email: 'good@example.com' });
    expect(await app.customerForm.isSaveAllowed()).toBe(true);
  });

  test('An existing customer opens pre-filled with their stored details and amendments are persisted', async ({ page }) => {
    const app = application(page);
    await app.customerForm.openCustomer(2);

    expect(await app.customerForm.heading()).toBe('Edit Customer');
    expect(await app.customerForm.valueOf('firstName')).toBe('Alan');
    expect(await app.customerForm.valueOf('email')).toBe('alan@example.com');

    await app.customerForm.enter({ phone: '+44 1908 555 000' });
    const call = await app.customerForm.save();
    expect(call.method).toBe('PUT');
    expect(call.path).toBe('/api/customers/2');

    expect(await app.customerDirectory.heading()).toBe('Customers');
    expect(await app.customerDirectory.listedPhoneNumbers()).toContain('+44 1908 555 000');
  });

  test('If registering a customer is rejected by the backend the user keeps the form and sees why it failed', async ({ page, backend }) => {
    await backend.failures([{ method: 'POST', path: '^/api/customers$', status: 409 }]);
    const app = application(page);
    await app.customerForm.openBlankForm();

    await app.customerForm.enter({ firstName: 'Dup', lastName: 'Licate', email: 'ada@example.com' });
    await app.customerForm.save();

    expect(await app.customerForm.errorMessage()).toBe('Failed to save customer (status 409)');
    expect(await app.customerForm.heading()).toBe('New Customer');
  });

  test('If amending a customer is rejected by the backend the failure is reported on the record being edited', async ({ page, backend }) => {
    await backend.failures([{ method: 'PUT', path: '^/api/customers/', status: 500 }]);
    const app = application(page);
    await app.customerForm.openCustomer(1);

    await app.customerForm.enter({ lastName: 'Byron' });
    await app.customerForm.save();

    expect(await app.customerForm.errorMessage()).toBe('Failed to save customer (status 500)');
  });

  test('Selecting a customer from the directory opens that customer record for editing', async ({ page }) => {
    const app = application(page);
    await app.customerDirectory.open();
    const form = await app.customerDirectory.openCustomerFromRow(0);

    expect(await form.heading()).toBe('Edit Customer');
    expect(await form.valueOf('firstName')).toBe('Ada');
  });
});

/**
 * Layer 1 — Application navigation behaviour.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Navigating the application', () => {
  test('Every main menu entry takes the user to the section it names', async ({ page }) => {
    const app = application(page);
    await app.shell.openApplicationRoot();

    for (const section of ['Products', 'Customers', 'Orders', 'Invoices', 'Notifications', 'Dashboard']) {
      await app.shell.followMainMenuItem(section);
      expect(await app.shell.currentSectionHeading()).toBe(section);
    }
  });

  test('A destination the application does not recognise falls back to the dashboard instead of a blank screen', async ({ page }) => {
    const app = application(page);
    await app.shell.openUnknownLocation();

    expect(await app.shell.currentSectionHeading()).toBe('Dashboard');
    expect(await app.shell.isLocatedOnDashboard()).toBe(true);
  });

  test('Opening the application without a destination lands the user on the dashboard', async ({ page }) => {
    const app = application(page);
    await app.shell.openApplicationRoot();

    expect(await app.shell.currentSectionHeading()).toBe('Dashboard');
  });

  test('A shared link to a single product record opens that record directly on a cold start', async ({ page }) => {
    const app = application(page);
    await app.productForm.openProductOnColdLoad(4);

    expect(await app.productForm.heading()).toBe('Edit Product');
    expect(await app.productForm.valueOf('sku')).toBe('SKU-1004');
  });
});

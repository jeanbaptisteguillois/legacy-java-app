/**
 * Layer 1 — Operational notifications behaviour.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Notification log', () => {
  test('Every notification the system has attempted is listed, showing whether delivery succeeded or failed', async ({ page }) => {
    const app = application(page);
    await app.notificationLog.open();

    expect(await app.notificationLog.heading()).toBe('Notifications');
    expect(await app.notificationLog.recordCount()).toBe(3);
    expect(await app.notificationLog.firstSuccessfulDeliveryLabel()).toBe('Yes');
    expect(await app.notificationLog.firstFailedDeliveryLabel()).toBe('No');
  });

  test('Sending a test notification records a fresh delivery attempt each time it is used', async ({ page }) => {
    const app = application(page);
    await app.notificationLog.open();
    expect(await app.notificationLog.recordCount()).toBe(3);

    const call = await app.notificationLog.sendTestNotification();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/notifications/test');

    expect(await app.notificationLog.recordCount()).toBe(4);
    expect(await app.notificationLog.recipientOfRow(0)).toBe('test@example.com');

    await app.notificationLog.sendTestNotification();
    expect(await app.notificationLog.recordCount()).toBe(5);
  });

  test('When nothing has been notified yet the log is presented with no entries', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.notificationLog.open();

    expect(await app.notificationLog.recordTableIsVisible()).toBe(true);
    expect(await app.notificationLog.recordCount()).toBe(0);
  });

  test('The user is told the log is loading and the notifications replace that message once they arrive', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.notificationLog.openWithoutWaitingForData();

    expect(await app.notificationLog.loadingIndicatorIsVisible()).toBe(true);

    await backend.delay(0);
    await app.notificationLog.settle();
    expect(await app.notificationLog.recordTableIsVisible()).toBe(true);
  });

  test('If the log cannot be retrieved the failure is reported and no notifications are shown', async ({ page, backend }) => {
    await backend.failures([{ method: 'GET', path: '^/api/notifications$', status: 500 }]);
    const app = application(page);
    await app.notificationLog.openWithoutWaitingForData();
    await app.notificationLog.settle();

    expect(await app.notificationLog.errorMessage()).toBe('Failed to load notifications (status 500)');
    expect(await app.notificationLog.recordCount()).toBe(0);
  });
});

test.describe('Management dashboard', () => {
  test('A manager sees headline trading figures alongside the products that need reordering', async ({ page }) => {
    const app = application(page);
    await app.dashboard.open();

    expect(await app.dashboard.heading()).toBe('Dashboard');
    expect(await app.dashboard.firstSummaryTitle()).toBe('Total Orders');
    expect(await app.dashboard.firstSummaryValue()).not.toBe('');
    expect(await app.dashboard.lowStockAlertCount()).toBeGreaterThan(0);
    expect(await app.dashboard.isDispatchOffered()).toBe(true);
    expect(await app.dashboard.isNoAlertsMessageShown()).toBe(false);
  });

  test('Dispatching the low stock alerts to the operations team emits new notifications', async ({ page, backend }) => {
    const app = application(page);
    await app.dashboard.open();
    const before = (await backend.state()).counts.notifications;

    const call = await app.dashboard.dispatchLowStockAlerts();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/reports/low-stock-alerts/dispatch');

    expect((await backend.state()).counts.notifications).toBeGreaterThan(before);
  });

  test('When nothing needs reordering the manager is told so and is offered no dispatch action', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.dashboard.open();

    expect(await app.dashboard.isNoAlertsMessageShown()).toBe(true);
    expect(await app.dashboard.isDispatchOffered()).toBe(false);
    expect(await app.dashboard.lowStockAlertCount()).toBe(0);
  });

  test('The dashboard reports that it is still gathering figures and clears that message once they arrive', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.dashboard.openWithoutWaitingForData();

    expect(await app.dashboard.loadingIndicatorIsVisible()).toBe(true);

    await backend.delay(0);
    await app.dashboard.settle();
    expect(await app.dashboard.loadingIndicatorIsGone()).toBe(true);
  });

  test('If the reporting data cannot be gathered the failure is reported and no misleading figures are displayed', async ({ page, backend }) => {
    await backend.failures([
      { method: 'GET', path: '^/api/reports/low-stock-alerts$', status: 503 },
      { method: 'GET', path: '^/api/reports/sales-summary$', status: 500 },
    ]);
    const app = application(page);
    await app.dashboard.openWithoutWaitingForData();
    await app.dashboard.settle();

    expect(await app.dashboard.errorMessage()).toBe('Failed to load dashboard data (status 503)');
    expect(await app.dashboard.isSummaryShown()).toBe(false);
  });
});

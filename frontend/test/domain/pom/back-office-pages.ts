import { Locator } from '@playwright/test';
import { ApiCall, BasePage } from './base-page';

/** The invoice ledger, including invoice generation. */
export class InvoiceLedgerPage extends BasePage {
  protected readonly route = '/invoices';
  protected readonly loadingNoun = 'invoices';

  private invoiceWithStatus(status: string): Locator {
    return this.rows().filter({ hasText: status }).first();
  }

  async paymentStatusOfRow(index: number): Promise<string> {
    return (await this.rows().nth(index).locator('td').nth(6).innerText()).trim();
  }

  async invoiceCountWithStatus(status: string): Promise<number> {
    return this.rows().filter({ hasText: status }).count();
  }

  async hasAnyInvoiceWithStatus(status: string): Promise<boolean> {
    return (await this.invoiceCountWithStatus(status)) > 0;
  }

  /** Whether the user is offered a "settle this invoice" action. */
  async isSettlementOfferedForInvoiceWithStatus(status: string): Promise<boolean> {
    return (await this.invoiceWithStatus(status).locator('button').count()) > 0;
  }

  async orderNumberOfRow(index: number): Promise<string> {
    return (await this.rows().nth(index).locator('td').nth(1).innerText()).trim();
  }

  async markFirstPendingInvoiceAsPaid(): Promise<ApiCall> {
    return this.capture(/^\/api\/invoices\/\d+\/mark-paid$/, () =>
      this.invoiceWithStatus('PENDING').locator('button').click()
    );
  }

  async enterOrderNumberToInvoice(orderNumber: number): Promise<void> {
    await this.page.fill('#generateOrderId', String(orderNumber));
  }

  async enteredOrderNumber(): Promise<string> {
    return this.page.locator('#generateOrderId').inputValue();
  }

  async generateInvoice(): Promise<ApiCall> {
    return this.capture(/^\/api\/invoices\/generate\/\d+$/, () =>
      this.generateButton().click()
    );
  }

  /** Requests generation with no order number; reports that no call was made. */
  async generateInvoiceWithoutOrderNumber(): Promise<boolean> {
    return this.captureNothing(/^\/api\/invoices\/generate/, () => this.generateButton().click());
  }

  private generateButton(): Locator {
    return this.page.locator('button.btn-primary', { hasText: 'Generate Invoice' });
  }
}

/** The outbound notification log. */
export class NotificationLogPage extends BasePage {
  protected readonly route = '/notifications';
  protected readonly loadingNoun = 'notifications';

  async recipientOfRow(index: number): Promise<string> {
    return (await this.rows().nth(index).locator('td').nth(2).innerText()).trim();
  }

  /** Per-row delivery outcome as shown to the user ("Yes" / "No"). */
  async firstSuccessfulDeliveryLabel(): Promise<string> {
    const label = this.page.locator('.label-success').first();
    await label.waitFor({ state: 'visible' });
    return (await label.innerText()).trim();
  }

  async firstFailedDeliveryLabel(): Promise<string> {
    const label = this.page.locator('.label-danger').first();
    await label.waitFor({ state: 'visible' });
    return (await label.innerText()).trim();
  }

  async sendTestNotification(): Promise<ApiCall> {
    return this.capture(/^\/api\/notifications\/test$/, () =>
      this.page.locator('button.btn-primary', { hasText: 'Send Test Notification' }).click()
    );
  }
}

/** The management dashboard: sales summary + low stock alerts. */
export class DashboardPage extends BasePage {
  protected readonly route = '/dashboard';
  protected readonly loadingNoun = 'dashboard';

  async isSummaryShown(): Promise<boolean> {
    return (await this.page.locator('.row .panel').count()) > 0;
  }

  async firstSummaryTitle(): Promise<string> {
    const heading = this.page.locator('.row .panel-heading').first();
    await heading.waitFor({ state: 'visible' });
    // textContent, not innerText: the panel heading is styled uppercase.
    return ((await heading.textContent()) || '').trim();
  }

  async firstSummaryValue(): Promise<string> {
    const body = this.page.locator('.panel-body').first();
    await body.waitFor({ state: 'visible' });
    return (await body.innerText()).trim();
  }

  async lowStockAlertCount(): Promise<number> {
    return this.recordCount();
  }

  async isDispatchOffered(): Promise<boolean> {
    return (await this.dispatchButton().count()) > 0;
  }

  async isNoAlertsMessageShown(): Promise<boolean> {
    const message = this.page.locator('p', { hasText: 'No low stock alerts.' });
    return (await message.count()) > 0 && (await message.first().isVisible());
  }

  async dispatchLowStockAlerts(): Promise<ApiCall> {
    return this.capture(/^\/api\/reports\/low-stock-alerts\/dispatch$/, () =>
      this.dispatchButton().click()
    );
  }

  private dispatchButton(): Locator {
    return this.page.locator('button.btn-warning');
  }
}

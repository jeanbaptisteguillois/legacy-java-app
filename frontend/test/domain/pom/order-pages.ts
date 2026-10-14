import { Locator } from '@playwright/test';
import { ApiCall, BasePage } from './base-page';

/** The order book listing. */
export class OrderBookPage extends BasePage {
  protected readonly route = '/orders';
  protected readonly loadingNoun = 'orders';

  private orderRow(orderNumber: number): Locator {
    return this.rows().filter({ hasText: String(orderNumber) }).first();
  }

  async statusOfOrder(orderNumber: number): Promise<string> {
    const cell = this.orderRow(orderNumber).locator('td').nth(3);
    await cell.waitFor({ state: 'visible' });
    return (await cell.innerText()).trim();
  }

  async canMarkOrderShipped(orderNumber: number): Promise<boolean> {
    return (await this.orderRow(orderNumber).locator('button.btn-default').count()) > 0;
  }

  async canCancelOrder(orderNumber: number): Promise<boolean> {
    return (await this.orderRow(orderNumber).locator('button.btn-danger').count()) > 0;
  }

  /** How many actions the order offers the user at all. */
  async availableActionCountForOrder(orderNumber: number): Promise<number> {
    return this.orderRow(orderNumber).locator('button').count();
  }

  async markOrderShipped(orderNumber: number): Promise<ApiCall> {
    return this.capture(/^\/api\/orders\/\d+\/status$/, () =>
      this.orderRow(orderNumber).locator('button.btn-default').click()
    );
  }

  async cancelOrder(orderNumber: number): Promise<ApiCall> {
    this.acceptNextConfirmation();
    return this.capture(/^\/api\/orders\/\d+\/cancel$/, () =>
      this.orderRow(orderNumber).locator('button.btn-danger').click()
    );
  }

  async declineCancellationOfOrder(orderNumber: number): Promise<boolean> {
    this.declineNextConfirmation();
    return this.captureNothing(/^\/api\/orders\/\d+\/cancel$/, () =>
      this.orderRow(orderNumber).locator('button.btn-danger').click()
    );
  }
}

/** The order placement form. */
export class OrderPlacementPage extends BasePage {
  protected readonly route = '/orders/new';
  protected readonly loadingNoun = 'orders';

  private lineItems(): Locator {
    return this.page.locator('.form-inline');
  }

  private lineItem(index: number): Locator {
    return this.lineItems().nth(index);
  }

  async lineItemCount(): Promise<number> {
    return this.lineItems().count();
  }

  async chooseCustomer(fullName: string): Promise<void> {
    await this.page.selectOption('#customer', { label: fullName });
  }

  async chooseProductForLineItem(index: number, sku: string): Promise<void> {
    const select = this.lineItem(index).locator('select');
    const label = (await select.locator('option').allInnerTexts()).find((text) =>
      text.trim().startsWith(`${sku} -`)
    );
    if (!label) {
      throw new Error(`No selectable product for SKU ${sku}`);
    }
    await select.selectOption({ label: label.trim() });
  }

  async setQuantityForLineItem(index: number, quantity: number): Promise<void> {
    await this.lineItem(index).locator('input[type="number"]').fill(String(quantity));
  }

  async addLineItem(): Promise<void> {
    await this.page.locator('button.btn-default', { hasText: 'Add Line Item' }).click();
  }

  async removeLineItem(index: number): Promise<void> {
    await this.lineItem(index).locator('button.btn-danger').click();
  }

  async isPlaceOrderAllowed(): Promise<boolean> {
    return this.page.locator('button[type="submit"]').isEnabled();
  }

  async placeOrder(): Promise<ApiCall> {
    return this.capture(/^\/api\/orders$/, () =>
      this.page.locator('button[type="submit"]').click()
    );
  }
}

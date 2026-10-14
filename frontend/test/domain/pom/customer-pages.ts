import { Locator } from '@playwright/test';
import { ApiCall, BasePage } from './base-page';

export interface CustomerFormValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
}

export interface CustomerSummary {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
}

/** The customer directory listing. */
export class CustomerDirectoryPage extends BasePage {
  protected readonly route = '/customers';
  protected readonly loadingNoun = 'customers';

  private row(index: number): Locator {
    return this.rows().nth(index);
  }

  async customerAtRow(index: number): Promise<CustomerSummary> {
    const cells = this.row(index).locator('td');
    return {
      name: (await cells.nth(0).innerText()).trim(),
      email: (await cells.nth(1).innerText()).trim(),
      phone: (await cells.nth(2).innerText()).trim(),
      shippingAddress: (await cells.nth(3).innerText()).trim(),
    };
  }

  async listedEmails(): Promise<string[]> {
    const emails: string[] = [];
    const total = await this.recordCount();
    for (let i = 0; i < total; i += 1) emails.push((await this.customerAtRow(i)).email);
    return emails;
  }

  async listedPhoneNumbers(): Promise<string[]> {
    const phones: string[] = [];
    const total = await this.recordCount();
    for (let i = 0; i < total; i += 1) phones.push((await this.customerAtRow(i)).phone);
    return phones;
  }

  async deleteLastCustomer(): Promise<ApiCall> {
    this.acceptNextConfirmation();
    return this.capture(/^\/api\/customers\/\d+$/, () =>
      this.rows().last().locator('button.btn-danger').click()
    );
  }

  async declineDeletionOfLastCustomer(): Promise<boolean> {
    this.declineNextConfirmation();
    return this.captureNothing(/^\/api\/customers\/\d+$/, () =>
      this.rows().last().locator('button.btn-danger').click()
    );
  }

  async openCustomerFromRow(index: number): Promise<CustomerFormPage> {
    await this.row(index).locator('a').click();
    const form = new CustomerFormPage(this.page);
    await form.settle();
    return form;
  }
}

/** The create / edit customer form. */
export class CustomerFormPage extends BasePage {
  protected readonly route = '/customers/new';
  protected readonly loadingNoun = 'customers';

  async openBlankForm(): Promise<void> {
    await this.open();
  }

  async openCustomer(id: number): Promise<void> {
    await this.navigateTo(`/customers/${id}`);
  }

  async enter(values: CustomerFormValues): Promise<void> {
    for (const [field, value] of Object.entries(values)) {
      await this.page.fill(`#${field}`, String(value));
    }
  }

  async valueOf(field: keyof CustomerFormValues): Promise<string> {
    return this.page.locator(`#${field}`).inputValue();
  }

  async isSaveAllowed(): Promise<boolean> {
    return this.page.locator('button[type="submit"]').isEnabled();
  }

  async save(): Promise<ApiCall> {
    return this.capture(/^\/api\/customers(\/\d+)?$/, () =>
      this.page.locator('button[type="submit"]').click()
    );
  }
}

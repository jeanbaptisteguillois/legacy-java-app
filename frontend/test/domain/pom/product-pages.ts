import { Page, Locator } from '@playwright/test';
import { ApiCall, BasePage } from './base-page';

export interface ProductFormValues {
  sku?: string;
  name?: string;
  description?: string;
  unitPrice?: string;
  quantityOnHand?: string;
  reorderThreshold?: string;
}

/** The product catalogue listing. */
export class ProductCatalogPage extends BasePage {
  protected readonly route = '/products';
  protected readonly loadingNoun = 'products';

  private row(index: number): Locator {
    return this.rows().nth(index);
  }

  async skuOfRow(index: number): Promise<string> {
    return (await this.row(index).locator('td').first().innerText()).trim();
  }

  async listedSkus(): Promise<string[]> {
    const skus: string[] = [];
    const total = await this.recordCount();
    for (let i = 0; i < total; i += 1) skus.push(await this.skuOfRow(i));
    return skus;
  }

  /** How many listed products are visually flagged as needing a reorder. */
  async lowStockFlagCount(): Promise<number> {
    return this.page.locator('table tbody tr.danger').count();
  }

  /** Deletes a product, confirming the warning prompt. */
  async deleteProductAtRow(index: number): Promise<ApiCall> {
    this.acceptNextConfirmation();
    return this.capture(/^\/api\/products\/\d+$/, () =>
      this.row(index).locator('button.btn-danger').click()
    );
  }

  /** Starts a deletion then declines the warning prompt. */
  async declineDeletionOfProductAtRow(index: number): Promise<boolean> {
    this.declineNextConfirmation();
    return this.captureNothing(/^\/api\/products\/\d+$/, () =>
      this.row(index).locator('button.btn-danger').click()
    );
  }

  /** Follows a listed product's name through to its edit form. */
  async openProductFromRow(index: number): Promise<ProductFormPage> {
    await this.row(index).locator('a').click();
    const form = new ProductFormPage(this.page);
    await form.settle();
    return form;
  }
}

/** The create / edit product form. */
export class ProductFormPage extends BasePage {
  protected readonly route = '/products/new';
  protected readonly loadingNoun = 'products';

  constructor(page: Page) {
    super(page);
  }

  async openBlankForm(): Promise<void> {
    await this.open();
  }

  async openProduct(id: number): Promise<void> {
    await this.navigateTo(`/products/${id}`);
  }

  /** Cold browser load straight onto a product's edit form. */
  async openProductOnColdLoad(id: number): Promise<void> {
    await this.load(`/products/${id}`);
    await this.settle();
  }

  async enter(values: ProductFormValues): Promise<void> {
    for (const [field, value] of Object.entries(values)) {
      await this.page.fill(`#${field}`, String(value));
    }
  }

  async valueOf(field: keyof ProductFormValues): Promise<string> {
    return this.page.locator(`#${field}`).inputValue();
  }

  async isSaveAllowed(): Promise<boolean> {
    return this.page.locator('button[type="submit"]').isEnabled();
  }

  /** Saves the form and reports the backend call that was issued. */
  async save(): Promise<ApiCall> {
    return this.capture(/^\/api\/products(\/\d+)?$/, () =>
      this.page.locator('button[type="submit"]').click()
    );
  }
}

/**
 * Layer 1 — Product catalogue behaviour.
 * Business language only: no selectors, no DOM vocabulary.
 */
import { test, expect } from '../support/fixtures';
import { application } from '../pom';

test.describe('Product catalogue', () => {
  test('An inventory manager sees every catalogued product and the ones that have fallen to their reorder threshold are highlighted', async ({ page }) => {
    const app = application(page);
    await app.productCatalog.open();

    expect(await app.productCatalog.heading()).toBe('Products');
    expect(await app.productCatalog.recordCount()).toBe(4);
    expect(await app.productCatalog.skuOfRow(0)).toBe('SKU-1001');
    expect(await app.productCatalog.lowStockFlagCount()).toBeGreaterThan(0);
  });

  test('When no products have been catalogued yet the catalogue is still presented, simply with no entries', async ({ page, backend }) => {
    await backend.reset('empty');
    const app = application(page);
    await app.productCatalog.open();

    expect(await app.productCatalog.recordTableIsVisible()).toBe(true);
    expect(await app.productCatalog.recordCount()).toBe(0);
  });

  test('While the catalogue is still being retrieved the user is told it is loading, and the product list appears only once the data arrives', async ({ page, backend }) => {
    await backend.delay(900);
    const app = application(page);
    await app.productCatalog.openWithoutWaitingForData();

    expect(await app.productCatalog.loadingIndicatorIsVisible()).toBe(true);
    expect(await app.productCatalog.isRecordTableRendered()).toBe(false);

    await backend.delay(0);
    await app.productCatalog.settle();
    expect(await app.productCatalog.recordTableIsVisible()).toBe(true);
  });

  test('If the catalogue cannot be retrieved the user is shown an explanatory failure message instead of an empty screen', async ({ page, backend }) => {
    await backend.failures([{ method: 'GET', path: '^/api/products$', status: 500 }]);
    const app = application(page);
    await app.productCatalog.openWithoutWaitingForData();
    await app.productCatalog.settle();

    expect(await app.productCatalog.errorMessage()).toBe('Failed to load products (status 500)');
  });

  test('Declining the deletion warning leaves the product in the catalogue and sends nothing to the backend', async ({ page }) => {
    const app = application(page);
    await app.productCatalog.open();
    expect(await app.productCatalog.recordCount()).toBe(4);

    expect(await app.productCatalog.declineDeletionOfProductAtRow(0)).toBe(true);
    expect(await app.productCatalog.recordCount()).toBe(4);
  });

  test('Confirming the deletion warning removes the product from the catalogue and deletes it in the backend', async ({ page }) => {
    const app = application(page);
    await app.productCatalog.open();
    expect(await app.productCatalog.recordCount()).toBe(4);

    const call = await app.productCatalog.deleteProductAtRow(0);
    expect(call.method).toBe('DELETE');
    expect(call.path).toMatch(/^\/api\/products\/\d+$/);

    expect(await app.productCatalog.recordCount()).toBe(3);
    expect(await app.productCatalog.listedSkus()).not.toContain('SKU-1001');
  });
});

test.describe('Product record maintenance', () => {
  test('A new product can be catalogued from a blank form and is then visible in the catalogue', async ({ page, backend }) => {
    const app = application(page);
    await app.productForm.openBlankForm();

    expect(await app.productForm.heading()).toBe('New Product');
    expect(await app.productForm.valueOf('sku')).toBe('');

    await app.productForm.enter({
      sku: 'SKU-9001',
      name: 'Freshly Created Widget',
      description: 'Created by the behavioural suite',
      unitPrice: '42.5',
      quantityOnHand: '30',
      reorderThreshold: '5',
    });

    const call = await app.productForm.save();
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/products');

    expect(await app.productCatalog.heading()).toBe('Products');
    expect(await app.productCatalog.listedSkus()).toContain('SKU-9001');
    expect((await backend.state()).counts.products).toBe(5);
  });

  test('A product cannot be saved until every mandatory commercial detail has been supplied', async ({ page }) => {
    const app = application(page);
    await app.productForm.openBlankForm();
    expect(await app.productForm.isSaveAllowed()).toBe(false);

    await app.productForm.enter({ sku: 'SKU-9002' });
    expect(await app.productForm.isSaveAllowed()).toBe(false);

    await app.productForm.enter({
      name: 'Partially filled',
      unitPrice: '1',
      quantityOnHand: '1',
      reorderThreshold: '1',
    });
    expect(await app.productForm.isSaveAllowed()).toBe(true);
  });

  test('An existing product opens pre-filled with its stored details and the changes are persisted', async ({ page }) => {
    const app = application(page);
    await app.productForm.openProduct(2);

    expect(await app.productForm.heading()).toBe('Edit Product');
    expect(await app.productForm.valueOf('sku')).toBe('SKU-1002');
    expect(await app.productForm.valueOf('name')).toBe('Widget Heavy Duty');

    await app.productForm.enter({ name: 'Widget Heavy Duty MK2', quantityOnHand: '77' });
    const call = await app.productForm.save();
    expect(call.method).toBe('PUT');
    expect(call.path).toBe('/api/products/2');

    expect(await app.productCatalog.heading()).toBe('Products');
    expect(await app.productCatalog.recordCount()).toBe(4);
  });

  test('If the backend rejects a brand new product the user keeps their work, sees why it failed and can try again', async ({ page, backend }) => {
    await backend.failures([{ method: 'POST', path: '^/api/products$', status: 422 }]);
    const app = application(page);
    await app.productForm.openBlankForm();

    await app.productForm.enter({
      sku: 'SKU-BAD',
      name: 'Will not save',
      unitPrice: '1',
      quantityOnHand: '1',
      reorderThreshold: '1',
    });
    await app.productForm.save();

    expect(await app.productForm.errorMessage()).toBe('Failed to save product (status 422)');
    expect(await app.productForm.heading()).toBe('New Product');
    expect(await app.productForm.isSaveAllowed()).toBe(true);
  });

  test('If the backend rejects an amendment to an existing product the user stays on the record with a failure message', async ({ page, backend }) => {
    await backend.failures([{ method: 'PUT', path: '^/api/products/', status: 500 }]);
    const app = application(page);
    await app.productForm.openProduct(1);

    await app.productForm.enter({ name: 'Doomed rename' });
    await app.productForm.save();

    expect(await app.productForm.errorMessage()).toBe('Failed to save product (status 500)');
    expect(await app.productForm.heading()).toBe('Edit Product');
  });

  test('Selecting a product from the catalogue opens that product record for editing', async ({ page }) => {
    const app = application(page);
    await app.productCatalog.open();
    const form = await app.productCatalog.openProductFromRow(0);

    expect(await form.heading()).toBe('Edit Product');
    expect(await form.valueOf('sku')).toBe('SKU-1001');
  });
});

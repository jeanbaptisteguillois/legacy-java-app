import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../../services/product.service';
import { statusOf } from '../../api/http';
import type { ProductDraft } from '../../api/types';
import { ErrorBanner } from '../../shared/Feedback';

interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  quantityOnHand: number;
  reorderThreshold: number;
}

const BLANK: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  unitPrice: 0,
  quantityOnHand: 0,
  reorderThreshold: 0,
};

/** React port of `ProductDetailController` + `product-detail.html`. */
export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isNew = !productId;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<ProductFormValues>({
    mode: 'onChange',
    defaultValues: BLANK,
  });

  const existing = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => (await ProductService.getById(productId as string)).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing.data) {
      reset({
        sku: existing.data.sku,
        name: existing.data.name,
        description: existing.data.description ?? '',
        unitPrice: existing.data.unitPrice,
        quantityOnHand: existing.data.quantityOnHand,
        reorderThreshold: existing.data.reorderThreshold,
      });
    }
  }, [existing.data, reset]);

  async function save(values: ProductFormValues): Promise<void> {
    setSaving(true);
    const draft: ProductDraft = { ...values };
    try {
      if (isNew) {
        await ProductService.create(draft);
      } else {
        await ProductService.update(existing.data?.id ?? (productId as string), draft);
      }
      navigate('/products');
    } catch (requestError) {
      setError(`Failed to save product (status ${statusOf(requestError)})`);
      setSaving(false);
    }
  }

  return (
    <>
      {isNew ? <h2>New Product</h2> : <h2>Edit Product</h2>}

      <ErrorBanner message={error} />

      <form name="productForm" onSubmit={handleSubmit(save)} noValidate>
        <div className="form-group">
          <label htmlFor="sku">SKU</label>
          <input
            type="text"
            className="form-control"
            id="sku"
            required
            {...register('sku', { required: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            required
            {...register('name', { required: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea className="form-control" id="description" {...register('description')} />
        </div>
        <div className="form-group">
          <label htmlFor="unitPrice">Unit Price</label>
          <input
            type="number"
            className="form-control"
            id="unitPrice"
            min="0"
            step="0.01"
            required
            {...register('unitPrice', { required: true, min: 0, valueAsNumber: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantityOnHand">Quantity On Hand</label>
          <input
            type="number"
            className="form-control"
            id="quantityOnHand"
            min="0"
            required
            {...register('quantityOnHand', { required: true, min: 0, valueAsNumber: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reorderThreshold">Reorder Threshold</label>
          <input
            type="number"
            className="form-control"
            id="reorderThreshold"
            min="0"
            required
            {...register('reorderThreshold', { required: true, min: 0, valueAsNumber: true })}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || !formState.isValid}>
          Save
        </button>
        <Link className="btn btn-default" to="/products">
          Cancel
        </Link>
      </form>
    </>
  );
}

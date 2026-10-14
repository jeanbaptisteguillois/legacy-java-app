import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { messageOrStatus } from '../../api/http';
import type { OrderRequest } from '../../api/types';
import { ErrorBanner } from '../../shared/Feedback';

interface OrderFormValues {
  customerId: string;
  lineItems: { productId: string; quantity: number }[];
}

/** React port of `OrderNewController` + `order-new.html`. */
export function OrderNewPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await CustomerService.getAll()).data,
  });
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await ProductService.getAll()).data,
  });

  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const { register, handleSubmit, control, formState } = useForm<OrderFormValues>({
    mode: 'onChange',
    defaultValues: { customerId: '', lineItems: [{ productId: '', quantity: 1 }] },
  });

  const lineItems = useFieldArray({ control, name: 'lineItems' });

  async function submitOrder(values: OrderFormValues): Promise<void> {
    setSaving(true);
    const request: OrderRequest = {
      customerId: values.customerId === '' ? null : Number(values.customerId),
      lineItems: values.lineItems.map((item) => ({
        productId: item.productId === '' ? null : Number(item.productId),
        quantity: Number(item.quantity),
      })),
    };
    try {
      await OrderService.place(request);
      navigate('/orders');
    } catch (requestError) {
      setError(messageOrStatus(requestError, 'Failed to place order'));
      setSaving(false);
    }
  }

  return (
    <>
      <h2>New Order</h2>

      <ErrorBanner message={error} />

      <form name="orderForm" onSubmit={handleSubmit(submitOrder)} noValidate>
        <div className="form-group">
          <label htmlFor="customer">Customer</label>
          <select
            className="form-control"
            id="customer"
            required
            {...register('customerId', { required: true })}
          >
            <option value="" />
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {`${customer.firstName} ${customer.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <h4>Line Items</h4>
        {lineItems.fields.map((field, index) => (
          <div className="form-inline" key={field.id} style={{ marginBottom: '8px' }}>
            <select
              className="form-control"
              required
              {...register(`lineItems.${index}.productId` as const, { required: true })}
            >
              <option value="" />
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {`${product.sku} - ${product.name}`}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="form-control"
              min="1"
              required
              style={{ width: '80px', marginLeft: '8px' }}
              {...register(`lineItems.${index}.quantity` as const, {
                required: true,
                min: 1,
                valueAsNumber: true,
              })}
            />
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => lineItems.remove(index)}
              style={{ marginLeft: '8px' }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-default"
          onClick={() => lineItems.append({ productId: '', quantity: 1 })}
        >
          Add Line Item
        </button>

        <div style={{ marginTop: '16px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving || !formState.isValid}>
            Place Order
          </button>
          <Link className="btn btn-default" to="/orders">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

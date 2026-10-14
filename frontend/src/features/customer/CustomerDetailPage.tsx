import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '../../services/customer.service';
import { statusOf } from '../../api/http';
import type { CustomerDraft } from '../../api/types';
import { ErrorBanner } from '../../shared/Feedback';

/** AngularJS' own `input[type=email]` validation pattern (ng.EMAIL_REGEXP). */
const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

interface CustomerFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: string;
}

const BLANK: CustomerFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  shippingAddress: '',
};

/** React port of `CustomerDetailController` + `customer-detail.html`. */
export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const isNew = !customerId;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<CustomerFormValues>({
    mode: 'onChange',
    defaultValues: BLANK,
  });

  const existing = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => (await CustomerService.getById(customerId as string)).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing.data) {
      reset({
        firstName: existing.data.firstName,
        lastName: existing.data.lastName,
        email: existing.data.email,
        phone: existing.data.phone ?? '',
        shippingAddress: existing.data.shippingAddress ?? '',
      });
    }
  }, [existing.data, reset]);

  async function save(values: CustomerFormValues): Promise<void> {
    setSaving(true);
    const draft: CustomerDraft = { ...values };
    try {
      if (isNew) {
        await CustomerService.create(draft);
      } else {
        await CustomerService.update(existing.data?.id ?? (customerId as string), draft);
      }
      navigate('/customers');
    } catch (requestError) {
      setError(`Failed to save customer (status ${statusOf(requestError)})`);
      setSaving(false);
    }
  }

  return (
    <>
      {isNew ? <h2>New Customer</h2> : <h2>Edit Customer</h2>}

      <ErrorBanner message={error} />

      <form name="customerForm" onSubmit={handleSubmit(save)} noValidate>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            className="form-control"
            id="firstName"
            required
            {...register('firstName', { required: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            className="form-control"
            id="lastName"
            required
            {...register('lastName', { required: true })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            required
            {...register('email', { required: true, pattern: EMAIL_REGEXP })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input type="text" className="form-control" id="phone" {...register('phone')} />
        </div>
        <div className="form-group">
          <label htmlFor="shippingAddress">Shipping Address</label>
          <textarea
            className="form-control"
            id="shippingAddress"
            {...register('shippingAddress')}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || !formState.isValid}>
          Save
        </button>
        <Link className="btn btn-default" to="/customers">
          Cancel
        </Link>
      </form>
    </>
  );
}

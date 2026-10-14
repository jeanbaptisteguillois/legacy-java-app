import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CustomerService } from '../../services/customer.service';
import { statusOf } from '../../api/http';
import type { Customer } from '../../api/types';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `CustomerListController` + `customer-list.html`. */
export function CustomerListPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await CustomerService.getAll()).data,
  });

  const removeCustomer = useMutation({
    mutationFn: (customer: Customer) => CustomerService.remove(customer.id),
    onSuccess: (_response, customer) => {
      queryClient.setQueryData<Customer[]>(['customers'], (current) =>
        (current ?? []).filter((c) => c.id !== customer.id)
      );
    },
  });

  const loading = query.isPending;
  const customers = query.data ?? [];
  const error = query.isError ? `Failed to load customers (status ${statusOf(query.error)})` : null;

  function deleteCustomer(customer: Customer): void {
    if (!window.confirm(`Delete customer ${customer.email}?`)) {
      return;
    }
    removeCustomer.mutate(customer);
  }

  return (
    <>
      <h2>Customers</h2>

      <Link className="btn btn-primary" to="/customers/new">
        Add Customer
      </Link>

      {loading && <LoadingIndicator noun="customers" />}
      <ErrorBanner message={error} />

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Shipping Address</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link to={`/customers/${customer.id}`}>
                    {customer.firstName} {customer.lastName}
                  </Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.shippingAddress}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteCustomer(customer)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

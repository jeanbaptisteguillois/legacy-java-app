import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { OrderService } from '../../services/order.service';
import { statusOf } from '../../api/http';
import type { Order } from '../../api/types';
import { currency, dateShort } from '../../shared/filters';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `OrderListController` + `order-list.html`. */
export function OrderListPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await OrderService.getAll()).data,
  });

  function patchStatus(orderId: number, status: Order['status']): void {
    queryClient.setQueryData<Order[]>(['orders'], (current) =>
      (current ?? []).map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  }

  const markShippedMutation = useMutation({
    mutationFn: (order: Order) => OrderService.updateStatus(order.id, 'SHIPPED'),
    onSuccess: (response, order) => {
      patchStatus(order.id, response.data.status);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (order: Order) => OrderService.cancel(order.id),
    onSuccess: (_response, order) => {
      patchStatus(order.id, 'CANCELLED');
    },
  });

  const loading = query.isPending;
  const orders = query.data ?? [];
  const error = query.isError ? `Failed to load orders (status ${statusOf(query.error)})` : null;

  function cancelOrder(order: Order): void {
    if (!window.confirm(`Cancel order #${order.id}?`)) {
      return;
    }
    cancelMutation.mutate(order);
  }

  return (
    <>
      <h2>Orders</h2>

      <Link className="btn btn-primary" to="/orders/new">
        New Order
      </Link>

      {loading && <LoadingIndicator noun="orders" />}
      <ErrorBanner message={error} />

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {order.customer.firstName} {order.customer.lastName}
                </td>
                <td>{dateShort(order.orderDate)}</td>
                <td>{order.status}</td>
                <td>{currency(order.totalAmount)}</td>
                <td>
                  {(order.status === 'NEW' || order.status === 'CONFIRMED') && (
                    <button
                      className="btn btn-sm btn-default"
                      onClick={() => markShippedMutation.mutate(order)}
                    >
                      Mark Shipped
                    </button>
                  )}
                  {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                    <button className="btn btn-sm btn-danger" onClick={() => cancelOrder(order)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InvoiceService } from '../../services/invoice.service';
import { messageOrStatus, statusOf } from '../../api/http';
import type { Invoice } from '../../api/types';
import { currency, dateShort } from '../../shared/filters';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `InvoiceListController` + `invoice-list.html`. */
export function InvoiceListPage() {
  const queryClient = useQueryClient();
  const [generateOrderId, setGenerateOrderId] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await InvoiceService.getAll()).data,
  });

  const generateMutation = useMutation({
    mutationFn: (orderId: string) => InvoiceService.generate(orderId),
    onSuccess: (response) => {
      queryClient.setQueryData<Invoice[]>(['invoices'], (current) => [
        response.data,
        ...(current ?? []),
      ]);
      setGenerateOrderId('');
    },
    onError: (error) => {
      setMutationError(messageOrStatus(error, 'Failed to generate invoice'));
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoice: Invoice) => InvoiceService.markPaid(invoice.id),
    onSuccess: (response, invoice) => {
      queryClient.setQueryData<Invoice[]>(['invoices'], (current) =>
        (current ?? []).map((item) =>
          item.id === invoice.id ? { ...item, paymentStatus: response.data.paymentStatus } : item
        )
      );
    },
  });

  const loading = query.isPending;
  const invoices = query.data ?? [];
  const loadError = query.isError
    ? `Failed to load invoices (status ${statusOf(query.error)})`
    : null;
  const error = mutationError ?? loadError;

  function generateInvoice(): void {
    // AngularJS guard: `if (!vm.generateOrderId) { return; }` — no request at all.
    if (!generateOrderId) {
      return;
    }
    setMutationError(null);
    generateMutation.mutate(generateOrderId);
  }

  return (
    <>
      <h2>Invoices</h2>

      <div className="form-inline" style={{ marginBottom: '16px' }}>
        <label htmlFor="generateOrderId">Order ID:</label>
        <input
          type="number"
          className="form-control"
          id="generateOrderId"
          value={generateOrderId}
          onChange={(event) => setGenerateOrderId(event.target.value)}
          style={{ width: '100px', marginLeft: '8px' }}
        />
        <button
          className="btn btn-primary"
          onClick={generateInvoice}
          style={{ marginLeft: '8px' }}
        >
          Generate Invoice
        </button>
      </div>

      {loading && <LoadingIndicator noun="invoices" />}
      <ErrorBanner message={error} />

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order #</th>
              <th>Issue Date</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.order.id}</td>
                <td>{dateShort(invoice.issueDate)}</td>
                <td>{currency(invoice.subtotal)}</td>
                <td>{currency(invoice.taxAmount)}</td>
                <td>{currency(invoice.totalAmount)}</td>
                <td>{invoice.paymentStatus}</td>
                <td>
                  {invoice.paymentStatus === 'PENDING' && (
                    <button
                      className="btn btn-sm btn-default"
                      onClick={() => markPaidMutation.mutate(invoice)}
                    >
                      Mark Paid
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

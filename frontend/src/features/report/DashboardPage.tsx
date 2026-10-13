import { useMutation, useQuery } from '@tanstack/react-query';
import { ReportService } from '../../services/report.service';
import { statusOf } from '../../api/http';
import { currency } from '../../shared/filters';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `DashboardController` + `dashboard.html`. */
export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['sales-summary'],
    queryFn: async () => (await ReportService.getSalesSummary()).data,
  });

  const alertsQuery = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => (await ReportService.getLowStockAlerts()).data,
  });

  const dispatchMutation = useMutation({
    mutationFn: () => ReportService.dispatchLowStockAlerts(),
  });

  // AngularJS tied `vm.loading` / `vm.error` to the low-stock-alerts request only.
  const loading = alertsQuery.isPending;
  const error = alertsQuery.isError
    ? `Failed to load dashboard data (status ${statusOf(alertsQuery.error)})`
    : null;
  const summary = summaryQuery.data;
  const lowStockAlerts = alertsQuery.data ?? [];

  return (
    <>
      <h2>Dashboard</h2>

      {loading && <LoadingIndicator noun="dashboard" />}
      <ErrorBanner message={error} />

      {summary && (
        <div className="row">
          <div className="col-md-3">
            <div className="panel panel-default">
              <div className="panel-heading">Total Orders</div>
              <div className="panel-body">{summary.totalOrders}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="panel panel-default">
              <div className="panel-heading">Total Revenue</div>
              <div className="panel-body">{currency(summary.totalRevenue)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="panel panel-default">
              <div className="panel-heading">Average Order Value</div>
              <div className="panel-body">{currency(summary.averageOrderValue)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="panel panel-default">
              <div className="panel-heading">Pending Invoices</div>
              <div className="panel-body">{summary.pendingInvoices}</div>
            </div>
          </div>
        </div>
      )}

      <h3>Low Stock Alerts</h3>
      {lowStockAlerts.length > 0 && (
        <button className="btn btn-warning" onClick={() => dispatchMutation.mutate()}>
          Dispatch Alerts to Ops
        </button>
      )}

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Quantity On Hand</th>
              <th>Reorder Threshold</th>
            </tr>
          </thead>
          <tbody>
            {lowStockAlerts.map((alert) => (
              <tr key={alert.productId} className="danger">
                <td>{alert.sku}</td>
                <td>{alert.productName}</td>
                <td>{alert.quantityOnHand}</td>
                <td>{alert.reorderThreshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && lowStockAlerts.length === 0 && (
        <p>No low stock alerts.</p>
      )}
    </>
  );
}

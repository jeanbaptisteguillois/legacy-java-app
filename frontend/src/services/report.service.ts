import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { LowStockAlert, SalesSummary } from '../api/types';

/** React port of the AngularJS `ReportService` factory. */
const baseUrl = `${API_BASE_URL}/reports`;

export const ReportService = {
  getSalesSummary: (): Promise<HttpResponse<SalesSummary>> =>
    http.get<SalesSummary>(`${baseUrl}/sales-summary`),

  getLowStockAlerts: (): Promise<HttpResponse<LowStockAlert[]>> =>
    http.get<LowStockAlert[]>(`${baseUrl}/low-stock-alerts`),

  dispatchLowStockAlerts: (): Promise<HttpResponse<{ dispatched: number }>> =>
    http.post<{ dispatched: number }>(`${baseUrl}/low-stock-alerts/dispatch`),
};

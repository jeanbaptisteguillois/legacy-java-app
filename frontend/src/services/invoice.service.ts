import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { Invoice } from '../api/types';

/** React port of the AngularJS `InvoiceService` factory. */
const baseUrl = `${API_BASE_URL}/invoices`;

export const InvoiceService = {
  getAll: (): Promise<HttpResponse<Invoice[]>> => http.get<Invoice[]>(baseUrl),

  generate: (orderId: number | string): Promise<HttpResponse<Invoice>> =>
    http.post<Invoice>(`${baseUrl}/generate/${orderId}`),

  markPaid: (id: number | string): Promise<HttpResponse<Invoice>> =>
    http.put<Invoice>(`${baseUrl}/${id}/mark-paid`, null),
};

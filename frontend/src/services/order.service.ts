import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { Order, OrderRequest } from '../api/types';

/** React port of the AngularJS `OrderService` factory. */
const baseUrl = `${API_BASE_URL}/orders`;

export const OrderService = {
  getAll: (): Promise<HttpResponse<Order[]>> => http.get<Order[]>(baseUrl),

  getById: (id: number | string): Promise<HttpResponse<Order>> =>
    http.get<Order>(`${baseUrl}/${id}`),

  place: (orderRequest: OrderRequest): Promise<HttpResponse<Order>> =>
    http.post<Order>(baseUrl, orderRequest),

  /** PUT /api/orders/:id/status?value=STATUS with a null body, as in AngularJS. */
  updateStatus: (id: number | string, status: string): Promise<HttpResponse<Order>> =>
    http.put<Order>(`${baseUrl}/${id}/status`, null, { params: { value: status } }),

  cancel: (id: number | string): Promise<HttpResponse<Order>> =>
    http.put<Order>(`${baseUrl}/${id}/cancel`, null),
};

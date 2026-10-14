import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { Customer, CustomerDraft } from '../api/types';

/** React port of the AngularJS `CustomerService` factory. */
const baseUrl = `${API_BASE_URL}/customers`;

export const CustomerService = {
  getAll: (): Promise<HttpResponse<Customer[]>> => http.get<Customer[]>(baseUrl),

  getById: (id: number | string): Promise<HttpResponse<Customer>> =>
    http.get<Customer>(`${baseUrl}/${id}`),

  create: (customer: CustomerDraft): Promise<HttpResponse<Customer>> =>
    http.post<Customer>(baseUrl, customer),

  update: (id: number | string, customer: CustomerDraft): Promise<HttpResponse<Customer>> =>
    http.put<Customer>(`${baseUrl}/${id}`, customer),

  remove: (id: number | string): Promise<HttpResponse<{ deleted: number }>> =>
    http.delete<{ deleted: number }>(`${baseUrl}/${id}`),
};

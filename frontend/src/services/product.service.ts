import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { Product, ProductDraft } from '../api/types';

/** React port of the AngularJS `ProductService` factory. */
const baseUrl = `${API_BASE_URL}/products`;

export const ProductService = {
  getAll: (): Promise<HttpResponse<Product[]>> => http.get<Product[]>(baseUrl),

  getLowStock: (): Promise<HttpResponse<Product[]>> => http.get<Product[]>(`${baseUrl}/low-stock`),

  getById: (id: number | string): Promise<HttpResponse<Product>> =>
    http.get<Product>(`${baseUrl}/${id}`),

  create: (product: ProductDraft): Promise<HttpResponse<Product>> =>
    http.post<Product>(baseUrl, product),

  update: (id: number | string, product: ProductDraft): Promise<HttpResponse<Product>> =>
    http.put<Product>(`${baseUrl}/${id}`, product),

  remove: (id: number | string): Promise<HttpResponse<{ deleted: number }>> =>
    http.delete<{ deleted: number }>(`${baseUrl}/${id}`),
};

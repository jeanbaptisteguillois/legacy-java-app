import { API_BASE_URL, http, type HttpResponse } from '../api/http';
import type { Notification } from '../api/types';

/** React port of the AngularJS `NotificationService` factory. */
const baseUrl = `${API_BASE_URL}/notifications`;

export const NotificationService = {
  getAll: (): Promise<HttpResponse<Notification[]>> => http.get<Notification[]>(baseUrl),

  sendTest: (): Promise<HttpResponse<Notification>> => http.post<Notification>(`${baseUrl}/test`),
};

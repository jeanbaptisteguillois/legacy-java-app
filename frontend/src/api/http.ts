/**
 * Centralised HTTP layer — the React equivalent of AngularJS `$http`.
 *
 * Every call returns an `HttpResponse<T>` ({ status, data }) and rejects with an
 * `HttpError` carrying the same shape, so the service modules (and the
 * test-only data-layer bridge on `window`) behave exactly like the
 * `$http` promises the AngularJS controllers consumed.
 */

/** Base URL of the REST API — the AngularJS app used the `API_BASE_URL` constant 'api'. */
export const API_BASE_URL = 'api';

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
}

export class HttpError<T = unknown> extends Error implements HttpResponse<T> {
  readonly status: number;
  readonly data: T;

  constructor(status: number, data: T) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions {
  /** Query string parameters, e.g. `{ value: 'SHIPPED' }`. */
  params?: Record<string, string | number | boolean | null | undefined>;
}

function withParams(url: string, params: RequestOptions['params']): string {
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/** Mirrors AngularJS' response transform: JSON when the server says so, text otherwise. */
async function readBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (text.length === 0) return null;
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return text;
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options?: RequestOptions
): Promise<HttpResponse<T>> {
  const init: RequestInit = { method, headers: {} };

  if (body !== undefined && body !== null) {
    init.headers = { 'Content-Type': 'application/json;charset=utf-8' };
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`/${withParams(url, options?.params)}`, init);
  const data = (await readBody(response)) as T;

  if (!response.ok) {
    throw new HttpError<T>(response.status, data);
  }
  return { status: response.status, data };
}

export const http = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, body, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, undefined, options),
};

/** Builds the error banner text the AngularJS controllers produced. */
export function statusOf(error: unknown): number {
  return error instanceof HttpError ? error.status : -1;
}

/** `response.data || ('… (status N)')` — the pattern used by order/invoice controllers. */
export function messageOrStatus(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    if (typeof error.data === 'string' && error.data.length > 0) return error.data;
    return `${fallback} (status ${error.status})`;
  }
  return `${fallback} (status ${statusOf(error)})`;
}

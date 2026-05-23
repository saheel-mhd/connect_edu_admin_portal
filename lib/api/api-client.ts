import type { ApiSuccess, ApiError } from '@/types/api';
import { ApiClientError } from './api-errors';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  searchParams?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
}

/**
 * Browser fetch through the Next.js BFF proxy. Cookies carry the session;
 * the proxy attaches the Authorization header server-side.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiSuccess<T>> {
  const { method = 'GET', body, searchParams, signal } = options;

  let url = `/api/backend${path.startsWith('/') ? path : `/${path}`}`;
  if (searchParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  });

  const envelope = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiError
    | null;

  if (!res.ok || !envelope || envelope.success === false) {
    const errorEnv = envelope as ApiError | null;
    throw new ApiClientError(
      errorEnv?.message || `Request failed (${res.status})`,
      errorEnv?.errorCode || 'INTERNAL_SERVER_ERROR',
      res.status,
      errorEnv?.details,
    );
  }
  return envelope;
}

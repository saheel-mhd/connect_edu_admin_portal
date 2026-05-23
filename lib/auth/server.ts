import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminUser } from '@/types/auth';
import { isAdminRole } from './permissions';
import { SESSION_COOKIE } from './session';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:4000';

/** Server-side lookup of the currently-authenticated admin (or null). */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    const user = body?.data as AdminUser | undefined;
    if (!user || !isAdminRole(user.role)) return null;
    return user;
  } catch {
    return null;
  }
}

/** Server-side guard — redirects to /login if not an authenticated admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');
  return admin;
}

/** Server-side fetch to the backend using the caller's session cookie. */
export async function serverFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body as T;
}

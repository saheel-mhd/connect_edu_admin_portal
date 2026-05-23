import type { NextResponse } from 'next/server';

export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || 'connect_edu_admin_session';
export const REFRESH_COOKIE =
  process.env.SESSION_REFRESH_COOKIE_NAME || 'connect_edu_admin_refresh';

const SECURE = process.env.SESSION_COOKIE_SECURE === 'true';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setSessionCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE,
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set({ name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 });
  res.cookies.set({ name: REFRESH_COOKIE, value: '', path: '/', maxAge: 0 });
}

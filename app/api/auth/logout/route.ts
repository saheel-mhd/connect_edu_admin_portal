import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  clearSessionCookies,
} from '@/lib/auth/session';

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:4000';

export async function POST() {
  const jar = cookies();
  const accessToken = jar.get(SESSION_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore upstream errors — we always clear local cookies.
    }
  }

  const res = NextResponse.json({
    success: true,
    message: 'Logged out',
    data: null,
  });
  clearSessionCookies(res);
  return res;
}

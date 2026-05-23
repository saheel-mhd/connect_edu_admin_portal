import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_COOKIE, setSessionCookies } from '@/lib/auth/session';

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:4000';

export async function POST() {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      {
        success: false,
        message: 'No active session',
        errorCode: 'AUTH_UNAUTHORIZED',
      },
      { status: 401 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to reach the backend API',
        errorCode: 'BACKEND_UNAVAILABLE',
      },
      { status: 502 },
    );
  }
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok || !payload?.success) {
    return NextResponse.json(
      payload || {
        success: false,
        message: 'Session refresh failed',
        errorCode: 'AUTH_TOKEN_EXPIRED',
      },
      { status: upstream.status },
    );
  }
  const { accessToken, refreshToken: newRefresh, user } = payload.data ?? {};
  if (!accessToken || !newRefresh) {
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected response',
        errorCode: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    success: true,
    message: 'Session refreshed',
    data: { user },
  });
  setSessionCookies(res, accessToken, newRefresh);
  return res;
}

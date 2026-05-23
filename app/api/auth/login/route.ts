import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRole } from '@/lib/auth/permissions';
import { setSessionCookies } from '@/lib/auth/session';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:4000';

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Email and password are required',
        errorCode: 'VALIDATION_ERROR',
      },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
        message: 'Login failed',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
      },
      { status: upstream.status },
    );
  }

  const { user, accessToken, refreshToken } = payload.data ?? {};
  if (!user || !accessToken || !refreshToken) {
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected response from backend',
        errorCode: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }

  if (!isAdminRole(user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Admin access required',
        errorCode: 'AUTH_FORBIDDEN',
      },
      { status: 403 },
    );
  }

  const res = NextResponse.json({
    success: true,
    message: 'Authenticated',
    data: { user },
  });
  setSessionCookies(res, accessToken, refreshToken);
  return res;
}

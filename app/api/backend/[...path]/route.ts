import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:4000';

async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'Not authenticated',
        errorCode: 'AUTH_UNAUTHORIZED',
      },
      { status: 401 },
    );
  }

  const path = `/${params.path.join('/')}`;
  const url = new URL(`${BACKEND_API_URL}${path}`);
  url.search = req.nextUrl.search;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Backend API unreachable',
        errorCode: 'BACKEND_UNAVAILABLE',
      },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') || 'application/json',
    },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};

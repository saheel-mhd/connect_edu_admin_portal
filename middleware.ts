import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/mfa',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || 'connect_edu_admin_session';
const REFRESH_COOKIE =
  process.env.SESSION_REFRESH_COOKIE_NAME || 'connect_edu_admin_refresh';
const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:4000';

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const wasPublic = isPublicPath(req.nextUrl.pathname);
  url.pathname = '/login';
  url.search = '';
  if (!wasPublic) url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function clearSession(res: NextResponse): NextResponse {
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = isPublicPath(pathname);
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // No cookie → allow public pages, redirect everything else to /login.
  if (!token) {
    return isPublic ? NextResponse.next() : redirectToLogin(req);
  }

  // Cookie present — verify against the backend. If the backend rejects it
  // (expired / banned / unknown) OR is unreachable, drop the cookies and
  // send the user to /login. This prevents zombie sessions.
  let sessionValid = false;
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const body = await res.json().catch(() => null);
      const role = body?.data?.role;
      sessionValid = role === 'ADMIN' || role === 'SUPER_ADMIN';
    }
  } catch {
    sessionValid = false;
  }

  if (!sessionValid) {
    if (isPublic) {
      // Strip the bad cookies but stay on the public page (e.g. /login).
      return clearSession(NextResponse.next());
    }
    return clearSession(redirectToLogin(req));
  }

  // Authenticated admin — bounce away from /login or /.
  if (pathname === '/' || pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals, the backend proxy, and static assets.
    '/((?!api/backend|api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};

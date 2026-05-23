import { redirect } from 'next/navigation';

export default function RootIndex(): never {
  // Middleware already handles signed-in users → /dashboard; this catches the
  // anonymous case where the cookie is missing entirely.
  redirect('/login');
}

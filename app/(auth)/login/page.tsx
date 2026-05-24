'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardBody } from '@/components/ui/Card';

// Next.js 14 requires `useSearchParams` to live under a Suspense boundary
// or the page won't prerender. Wrap the form in Suspense; the outer page
// renders the card chrome so users see something while the URL parses.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCardSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body?.message || 'Sign-in failed');
        return;
      }
      router.replace(nextUrl);
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardBody className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-900">
            Connect Edu Admin
          </span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Internal portal for admins, moderators and safety reviewers.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1"
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
        <div className="text-center text-xs text-slate-500">
          <Link
            href="/forgot-password"
            className="text-brand-600 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function LoginCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardBody className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded bg-slate-100" />
      </CardBody>
    </Card>
  );
}

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// Wrap `useSearchParams` in Suspense so Next.js can prerender the shell.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardBody>
            <div className="h-32 animate-pulse rounded bg-slate-100" />
          </CardBody>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/backend/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body?.message || 'Reset failed');
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
        {done ? (
          <>
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Your password has been reset. You can now sign in.
            </p>
            <Link
              href="/login"
              className="block text-center text-sm text-brand-600 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="token">Reset token</Label>
              <Input
                id="token"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1"
              />
            </div>
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Reset password
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import type { AdminUser } from '@/types/auth';
import { RoleBadge } from '@/components/badges/StatusBadges';
import { NotificationBell } from './NotificationBell';

export function AdminHeader({ admin }: { admin: AdminUser | null }) {
  const { admin: fetched } = useCurrentAdmin();
  const display = admin ?? fetched;
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        Child-safety operations console
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        {display && (
          <>
            <Link
              href="/account"
              title="Account"
              className="hidden text-right text-sm transition hover:opacity-80 sm:block"
            >
              <div className="font-medium text-slate-900">{display.name}</div>
              <div className="text-xs text-slate-500">{display.email}</div>
            </Link>
            <RoleBadge role={display.role} />
            <Link
              href="/account"
              title="Account"
              className="h-9 w-9 rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            >
              <User className="h-5 w-5" />
            </Link>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          loading={busy}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </header>
  );
}

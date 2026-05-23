import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminBreadcrumbs } from '@/components/layout/AdminBreadcrumbs';
import { requireAdmin } from '@/lib/auth/server';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader admin={admin} />
        <main className="flex-1 px-6 py-6">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}

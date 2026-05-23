import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  RoleBadge,
  UserStatusBadge,
} from '@/components/badges/StatusBadges';
import { AccessDeniedState } from '@/components/shared/states';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import { formatDateTime } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { AdminUser } from '@/types/auth';
import { AdminActions } from './AdminActions';

interface AdminDetail extends AdminUser {
  mfaEnabled?: boolean;
}

export const dynamic = 'force-dynamic';

export default async function AdminDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const current = await getCurrentAdmin();
  if (!current || !hasPermission(current.role, 'admins.manage')) {
    return (
      <div>
        <PageHeader title="Admin detail" />
        <AccessDeniedState />
      </div>
    );
  }

  let admin: AdminDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<AdminDetail>>(
      `/admin/admins/${params.id}`,
    );
    admin = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load admin';
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/admins"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to admins
        </Link>
      </div>

      <PageHeader
        title={admin?.name || 'Admin'}
        description={admin ? `Admin ID: ${admin.id}` : undefined}
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {admin && (
        <div className="space-y-6">
          <Card>
            <CardBody className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {admin.name || '—'}
                  </h2>
                  <RoleBadge role={admin.role} />
                  <UserStatusBadge status={admin.status} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Field label="Email" value={admin.email || '—'} />
                  <Field
                    label="MFA enabled"
                    value={admin.mfaEnabled ? 'Yes' : 'No'}
                  />
                  <Field
                    label="Created"
                    value={formatDateTime(admin.createdAt)}
                  />
                  <Field
                    label="Last login"
                    value={formatDateTime(admin.lastLoginAt)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardBody>
              <AdminActions
                adminId={admin.id}
                currentRole={admin.role}
                currentStatus={admin.status}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}

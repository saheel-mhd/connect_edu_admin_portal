import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AccessDeniedState } from '@/components/shared/states';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import type { ApiSuccess } from '@/types/api';
import { BarChartCard } from './BarChartCard';

interface CountByKey {
  count: number;
  role?: string;
  status?: string;
  [key: string]: unknown;
}

interface UsersAnalytics {
  byRole?: CountByKey[];
  byStatus?: CountByKey[];
  roles?: CountByKey[];
  statuses?: CountByKey[];
  total?: number;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

function normalize(
  rows: CountByKey[] | undefined,
  field: 'role' | 'status',
): Array<{ label: string; count: number }> {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      label: String(row[field] ?? row.label ?? '—'),
      count: Number(row.count ?? 0),
    }))
    .filter((row) => row.label && !Number.isNaN(row.count));
}

export default async function UserAnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'analytics.view')) {
    return (
      <div>
        <PageHeader title="User analytics" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: UsersAnalytics | null = null;
  let error: string | null = null;
  try {
    const res =
      await serverFetch<ApiSuccess<UsersAnalytics>>('/admin/analytics/users');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load analytics';
  }

  const byRole = normalize(data?.byRole ?? data?.roles, 'role');
  const byStatus = normalize(data?.byStatus ?? data?.statuses, 'status');

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to analytics
        </Link>
      </div>

      <PageHeader
        title="User analytics"
        description="Distribution of accounts across roles and lifecycle statuses."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users by role</CardTitle>
            </CardHeader>
            <CardBody>
              <BarChartCard data={byRole} color="#0284c7" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Users by status</CardTitle>
            </CardHeader>
            <CardBody>
              <BarChartCard data={byStatus} color="#7c3aed" />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

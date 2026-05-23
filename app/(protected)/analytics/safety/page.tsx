import Link from 'next/link';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AccessDeniedState } from '@/components/shared/states';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import type { ApiSuccess } from '@/types/api';

interface SafetyAnalytics {
  openReports?: number;
  resolvedReports?: number;
  flaggedMessages?: number;
  flaggedPosts?: number;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

export default async function SafetyAnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'analytics.view')) {
    return (
      <div>
        <PageHeader title="Safety analytics" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: SafetyAnalytics | null = null;
  let error: string | null = null;
  try {
    const res =
      await serverFetch<ApiSuccess<SafetyAnalytics>>('/admin/analytics/safety');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load analytics';
  }

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
        title="Safety analytics"
        description="Open and resolved safety reports, plus flagged content volumes."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Open reports"
            value={data.openReports}
            tone="danger"
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          />
          <MetricTile
            label="Resolved reports"
            value={data.resolvedReports}
            tone="success"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          />
          <MetricTile
            label="Flagged messages"
            value={data.flaggedMessages}
            tone="warning"
            icon={<MessageSquare className="h-5 w-5 text-amber-600" />}
          />
          <MetricTile
            label="Flagged posts"
            value={data.flaggedPosts}
            tone="warning"
            icon={<FileText className="h-5 w-5 text-amber-600" />}
          />
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number | undefined;
  tone: 'danger' | 'warning' | 'success';
  icon: React.ReactNode;
}) {
  const border =
    tone === 'danger'
      ? 'border-red-200 bg-red-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-emerald-200 bg-emerald-50';
  const text =
    tone === 'danger'
      ? 'text-red-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : 'text-emerald-700';
  return (
    <Card className={border}>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wide ${text}`}>{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString() : '—'}
          </p>
        </div>
        {icon}
      </CardBody>
    </Card>
  );
}

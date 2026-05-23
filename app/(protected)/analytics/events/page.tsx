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
import { EventsChart } from './EventsChart';

interface EventsAnalytics {
  totalEvents?: number;
  totalRegistrations?: number;
  registrationsByStatus?: Array<{ status: string; count: number }>;
  byStatus?: Array<{ status: string; count: number }>;
  upcomingEvents?: number;
  pastEvents?: number;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

export default async function EventsAnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'analytics.view')) {
    return (
      <div>
        <PageHeader title="Event analytics" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: EventsAnalytics | null = null;
  let error: string | null = null;
  try {
    const res =
      await serverFetch<ApiSuccess<EventsAnalytics>>('/admin/analytics/events');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load analytics';
  }

  const rawRows = data?.registrationsByStatus ?? data?.byStatus ?? [];
  const rows = rawRows
    .map((r) => ({
      status: String(r.status ?? '—'),
      count: Number(r.count ?? 0),
    }))
    .filter((r) => r.status && !Number.isNaN(r.count));

  const totals: Array<{ label: string; value: number | undefined }> = [
    { label: 'Total events', value: data?.totalEvents },
    { label: 'Total registrations', value: data?.totalRegistrations },
    { label: 'Upcoming events', value: data?.upcomingEvents },
    { label: 'Past events', value: data?.pastEvents },
  ];

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
        title="Event analytics"
        description="Event volume and registration funnel."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {totals.map((t) =>
              t.value === undefined ? null : (
                <Card key={t.label}>
                  <CardBody>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {t.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {t.value.toLocaleString()}
                    </p>
                  </CardBody>
                </Card>
              ),
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Registrations by status</CardTitle>
            </CardHeader>
            <CardBody>
              <EventsChart data={rows} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

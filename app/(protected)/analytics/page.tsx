import Link from 'next/link';
import {
  Users,
  Calendar,
  ShieldAlert,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
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

interface OverviewData {
  totalUsers?: number;
  totalKids?: number;
  totalParents?: number;
  totalMentors?: number;
  totalOrganizations?: number;
  totalEvents?: number;
  totalPosts?: number;
  totalSkills?: number;
  openReports?: number;
  flaggedMessages?: number;
  newUsersThisWeek?: number;
  newUsersThisMonth?: number;
  [key: string]: number | undefined;
}

export const dynamic = 'force-dynamic';

export default async function AnalyticsOverviewPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'analytics.view')) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: OverviewData | null = null;
  let error: string | null = null;
  try {
    const res =
      await serverFetch<ApiSuccess<OverviewData>>('/admin/analytics/overview');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load analytics';
  }

  const tiles: Array<{ label: string; key: keyof OverviewData }> = [
    { label: 'Total users', key: 'totalUsers' },
    { label: 'Kids', key: 'totalKids' },
    { label: 'Parents', key: 'totalParents' },
    { label: 'Mentors', key: 'totalMentors' },
    { label: 'Organizations', key: 'totalOrganizations' },
    { label: 'Events', key: 'totalEvents' },
    { label: 'Posts', key: 'totalPosts' },
    { label: 'Skills', key: 'totalSkills' },
    { label: 'New users (week)', key: 'newUsersThisWeek' },
    { label: 'New users (month)', key: 'newUsersThisMonth' },
    { label: 'Open reports', key: 'openReports' },
    { label: 'Flagged messages', key: 'flaggedMessages' },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform-wide metrics, broken down by user type, content and safety."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {tiles.map((tile) => {
              const value = data?.[tile.key];
              if (value === undefined) return null;
              return (
                <Card key={String(tile.key)}>
                  <CardBody>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {tile.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {typeof value === 'number'
                        ? value.toLocaleString()
                        : value}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Detailed reports
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NavCard
            href="/analytics/users"
            title="Users"
            description="Breakdown by role and status."
            icon={<Users className="h-5 w-5 text-brand-600" />}
          />
          <NavCard
            href="/analytics/skills"
            title="Skills"
            description="Most popular skills across the platform."
            icon={<BarChart3 className="h-5 w-5 text-brand-600" />}
          />
          <NavCard
            href="/analytics/events"
            title="Events"
            description="Event registration and status counts."
            icon={<Calendar className="h-5 w-5 text-brand-600" />}
          />
          <NavCard
            href="/analytics/safety"
            title="Safety"
            description="Reports, flags and moderation activity."
            icon={<ShieldAlert className="h-5 w-5 text-red-600" />}
          />
        </div>
      </section>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition hover:border-brand-300 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardBody className="text-sm text-slate-600">{description}</CardBody>
      </Card>
    </Link>
  );
}

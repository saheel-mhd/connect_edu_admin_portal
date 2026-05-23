import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { serverFetch } from '@/lib/auth/server';
import type { ApiSuccess } from '@/types/api';

interface DashboardData {
  totalUsers: number;
  totalKids: number;
  totalParents: number;
  totalMentors: number;
  totalOrganizations: number;
  pendingMentors: number;
  pendingOrganizations: number;
  pendingPosts: number;
  pendingEvents: number;
  openReports: number;
  flaggedMessages: number;
  newUsersToday: number;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<DashboardData>>('/admin/dashboard');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load dashboard';
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Platform-wide health and safety overview."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <>
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Urgent safety
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <UrgentTile
                label="Open reports"
                value={data.openReports}
                icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                tone="danger"
              />
              <UrgentTile
                label="Flagged messages"
                value={data.flaggedMessages}
                icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                tone="danger"
              />
              <UrgentTile
                label="Pending posts"
                value={data.pendingPosts}
                icon={<FileText className="h-4 w-4 text-amber-600" />}
                tone="warning"
              />
              <UrgentTile
                label="Pending events"
                value={data.pendingEvents}
                icon={<Calendar className="h-4 w-4 text-amber-600" />}
                tone="warning"
              />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verification queue
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tile
                label="Pending mentors"
                value={data.pendingMentors}
                icon={<GraduationCap className="h-4 w-4 text-brand-600" />}
              />
              <Tile
                label="Pending organizations"
                value={data.pendingOrganizations}
                icon={<Building2 className="h-4 w-4 text-brand-600" />}
              />
              <Tile
                label="New users today"
                value={data.newUsersToday}
                icon={<UserPlus className="h-4 w-4 text-brand-600" />}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Community
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Tile
                label="Total users"
                value={data.totalUsers}
                icon={<Users className="h-4 w-4 text-slate-500" />}
              />
              <Tile label="Kids" value={data.totalKids} />
              <Tile label="Parents" value={data.totalParents} />
              <Tile label="Mentors" value={data.totalMentors} />
              <Tile label="Organizations" value={data.totalOrganizations} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon}
      </CardBody>
    </Card>
  );
}

function UrgentTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'danger' | 'warning';
}) {
  const border = tone === 'danger' ? 'border-red-200' : 'border-amber-200';
  return (
    <Card className={border}>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon}
      </CardBody>
    </Card>
  );
}

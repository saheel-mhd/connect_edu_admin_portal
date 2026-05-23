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
import { SkillsChart } from './SkillsChart';

interface SkillRow {
  skillName?: string;
  name?: string;
  count: number;
  [key: string]: unknown;
}

interface SkillsAnalytics {
  topSkills?: SkillRow[];
  skills?: SkillRow[];
  total?: number;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

export default async function SkillsAnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'analytics.view')) {
    return (
      <div>
        <PageHeader title="Skills analytics" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: SkillsAnalytics | null = null;
  let error: string | null = null;
  try {
    const res =
      await serverFetch<ApiSuccess<SkillsAnalytics>>('/admin/analytics/skills');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load analytics';
  }

  const rows = (data?.topSkills ?? data?.skills ?? []) as SkillRow[];
  const normalized = rows
    .map((r) => ({
      skillName: String(r.skillName ?? r.name ?? '—'),
      count: Number(r.count ?? 0),
    }))
    .filter((r) => r.skillName && !Number.isNaN(r.count))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

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
        title="Skills analytics"
        description="Top skills selected by mentors, kids and used across events."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Top skills</CardTitle>
          </CardHeader>
          <CardBody>
            <SkillsChart data={normalized} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

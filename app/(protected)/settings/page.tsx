import Link from 'next/link';
import { ArrowRight, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
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

interface SettingsData {
  platform?: Record<string, unknown>;
  safety?: Record<string, unknown>;
  moderation?: Record<string, unknown>;
  uploadLimits?: Record<string, unknown>;
  eventApproval?: Record<string, unknown>;
  chatRules?: Record<string, unknown>;
  notificationSettings?: Record<string, unknown>;
  adminSecurity?: Record<string, unknown>;
  [key: string]: unknown;
}

export const dynamic = 'force-dynamic';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default async function SettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'settings.manage')) {
    return (
      <div>
        <PageHeader title="Settings" />
        <AccessDeniedState />
      </div>
    );
  }

  let data: SettingsData | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<SettingsData>>('/admin/settings');
    data = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load settings';
  }

  const sections: Array<{ key: keyof SettingsData; title: string }> = [
    { key: 'platform', title: 'Platform' },
    { key: 'safety', title: 'Safety' },
    { key: 'moderation', title: 'Moderation' },
    { key: 'uploadLimits', title: 'Upload limits' },
    { key: 'eventApproval', title: 'Event approval' },
    { key: 'chatRules', title: 'Chat rules' },
    { key: 'notificationSettings', title: 'Notification settings' },
    { key: 'adminSecurity', title: 'Admin security' },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform-wide configuration. Changes are recorded in the audit log."
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/settings/safety" className="block">
          <Card className="border-red-200 bg-red-50 transition hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <CardTitle>Safety settings</CardTitle>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardBody className="text-sm text-slate-700">
              Edit safety toggles that affect every child on the platform.
            </CardBody>
          </Card>
        </Link>
        <Link href="/settings/platform" className="block">
          <Card className="transition hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-brand-600" />
                <CardTitle>Platform settings</CardTitle>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardBody className="text-sm text-slate-700">
              Edit general platform configuration such as branding, limits and
              defaults.
            </CardBody>
          </Card>
        </Link>
      </section>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sections.map((section) => {
            const value = data?.[section.key];
            if (!value || typeof value !== 'object') return null;
            const entries = Object.entries(value as Record<string, unknown>);
            if (entries.length === 0) return null;
            return (
              <Card key={String(section.key)}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardBody>
                  <dl className="divide-y divide-slate-100">
                    {entries.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-start justify-between gap-3 py-2 text-sm"
                      >
                        <dt className="text-slate-500">{humanize(k)}</dt>
                        <dd className="text-right font-medium text-slate-800">
                          {formatValue(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

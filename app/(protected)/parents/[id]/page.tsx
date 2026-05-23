import Link from 'next/link';
import { ChevronLeft, Users } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserStatusBadge } from '@/components/badges/StatusBadges';
import { SensitiveDataReveal } from '@/components/safety/SensitiveDataReveal';
import { AccessDeniedState } from '@/components/shared/states';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import {
  formatDateTime,
  maskEmail,
  maskPhone,
} from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { AdminUser } from '@/types/auth';

export const dynamic = 'force-dynamic';

interface ParentChildLink {
  id: string;
  status: string;
  approvedAt: string | null;
  kidProfile?: {
    id: string;
    displayName: string;
    parentApproved: boolean;
    user?: { id: string; name: string; status: string };
  } | null;
}

interface ParentProfile {
  id: string;
  fullName: string;
  relation: string | null;
  country: string | null;
  phone: string | null;
  children?: ParentChildLink[];
}

interface ParentDetail extends AdminUser {
  parentProfile?: ParentProfile | null;
}

export default async function ParentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'parents.view')) {
    return (
      <div>
        <PageHeader title="Parent detail" />
        <AccessDeniedState />
      </div>
    );
  }

  let parent: ParentDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<ParentDetail>>(
      `/admin/users/${params.id}`,
    );
    parent = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load parent';
  }

  const profile = parent?.parentProfile;

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/parents"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to parents
        </Link>
      </div>

      <PageHeader
        title={parent?.name || profile?.fullName || 'Parent'}
        description={parent ? `Parent ID: ${parent.id}` : undefined}
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {parent && (
        <div className="space-y-6">
          {/* Header card */}
          <Card>
            <CardBody className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {parent.name || profile?.fullName || '—'}
                  </h2>
                  <UserStatusBadge status={parent.status} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <SensitiveDataReveal
                      label="Email"
                      maskedValue={maskEmail(parent.email)}
                      revealedValue={parent.email ?? '—'}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <SensitiveDataReveal
                      label="Phone"
                      maskedValue={maskPhone(parent.phone)}
                      revealedValue={parent.phone ?? '—'}
                    />
                  </div>
                  <Field label="Country" value={parent.country || '—'} />
                  <Field label="Language" value={parent.language || '—'} />
                  <Field
                    label="Created"
                    value={formatDateTime(parent.createdAt)}
                  />
                  <Field
                    label="Last login"
                    value={formatDateTime(parent.lastLoginAt)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Parent profile */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Parent profile</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field label="Full name" value={profile.fullName || '—'} />
                <Field label="Relation" value={profile.relation || '—'} />
                <Field label="Country" value={profile.country || '—'} />
                <Field
                  label="Phone"
                  value={maskPhone(profile.phone)}
                />
              </CardBody>
            </Card>
          )}

          {/* Linked children */}
          <Card>
            <CardHeader>
              <CardTitle>Linked children</CardTitle>
              <span className="text-xs text-slate-500">
                {profile?.children?.length ?? 0} linked
              </span>
            </CardHeader>
            <CardBody>
              {profile?.children && profile.children.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {profile.children.map((link) => {
                    const kid = link.kidProfile;
                    const displayName =
                      kid?.displayName || kid?.user?.name || 'Unnamed child';
                    const approved = link.status === 'APPROVED';
                    return (
                      <li
                        key={link.id}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {displayName}
                          </p>
                          {kid?.user?.status && (
                            <p className="text-xs text-slate-500">
                              Account: {kid.user.status}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            tone={approved ? 'success' : 'pending'}
                          >
                            {link.status}
                          </Badge>
                          {kid?.user?.id && (
                            <Link
                              href={`/kids/${kid.user.id}`}
                              className="text-xs font-medium text-brand-600 hover:underline"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No children are currently linked to this parent.
                </p>
              )}
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

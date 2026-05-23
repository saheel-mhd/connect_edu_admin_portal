import Link from 'next/link';
import { ChevronLeft, Baby } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserStatusBadge } from '@/components/badges/StatusBadges';
import { AccessDeniedState } from '@/components/shared/states';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import { formatDateTime } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { AdminUser } from '@/types/auth';

export const dynamic = 'force-dynamic';

interface KidParentLink {
  id: string;
  status: string;
  approvedAt: string | null;
  parentProfile?: {
    id: string;
    fullName: string;
    relation: string | null;
    user?: { id: string; name: string };
  } | null;
}

interface KidProfile {
  id: string;
  displayName: string;
  ageGroup: string | null;
  bio: string | null;
  visibility: string;
  allowComments: boolean;
  allowChat: boolean;
  allowEventSuggestions: boolean;
  parentApproved: boolean;
  parents?: KidParentLink[];
}

interface KidDetail extends AdminUser {
  kidProfile?: KidProfile | null;
}

export default async function KidDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'kids.view')) {
    return (
      <div>
        <PageHeader title="Kid detail" />
        <AccessDeniedState />
      </div>
    );
  }

  let kid: KidDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<KidDetail>>(
      `/admin/users/${params.id}`,
    );
    kid = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load kid';
  }

  const profile = kid?.kidProfile;

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/kids"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to kids
        </Link>
      </div>

      <PageHeader
        title={profile?.displayName || kid?.name || 'Kid'}
        description={kid ? `Kid ID: ${kid.id}` : undefined}
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {kid && (
        <div className="space-y-6">
          {/* Header card */}
          <Card>
            <CardBody className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Baby className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {profile?.displayName || kid.name || '—'}
                  </h2>
                  <UserStatusBadge status={kid.status} />
                  {profile?.parentApproved !== undefined && (
                    <Badge
                      tone={profile.parentApproved ? 'success' : 'warning'}
                    >
                      {profile.parentApproved
                        ? 'Parent approved'
                        : 'Awaiting parent approval'}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Contact details are intentionally hidden on this page to
                  protect the child.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Kid profile */}
          <Card>
            <CardHeader>
              <CardTitle>Kid profile</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Field
                label="Display name"
                value={profile?.displayName || '—'}
              />
              <Field
                label="Age group"
                value={profile?.ageGroup || '—'}
              />
              <Field
                label="Visibility"
                value={profile?.visibility || '—'}
              />
              <Field
                label="Parent approved"
                value={profile?.parentApproved ? 'Yes' : 'No'}
              />
              <Field
                label="Allow comments"
                value={profile?.allowComments ? 'Yes' : 'No'}
              />
              <Field
                label="Allow chat"
                value={profile?.allowChat ? 'Yes' : 'No'}
              />
              <Field
                label="Allow event suggestions"
                value={profile?.allowEventSuggestions ? 'Yes' : 'No'}
              />
              <Field label="Country" value={kid.country || '—'} />
              <Field label="Language" value={kid.language || '—'} />
              <Field
                label="Created"
                value={formatDateTime(kid.createdAt)}
              />
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Bio
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">
                  {profile?.bio || '—'}
                </p>
              </div>
              <p className="sm:col-span-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Date of birth is masked — only age group ({profile?.ageGroup ||
                  'unknown'}) is shown.
              </p>
            </CardBody>
          </Card>

          {/* Linked parents */}
          <Card>
            <CardHeader>
              <CardTitle>Linked parents</CardTitle>
            </CardHeader>
            <CardBody>
              {profile?.parents && profile.parents.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {profile.parents.map((link) => {
                    const parent = link.parentProfile;
                    const displayName =
                      parent?.fullName || parent?.user?.name || 'Unknown parent';
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
                          {parent?.relation && (
                            <p className="text-xs text-slate-500">
                              {parent.relation}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={approved ? 'success' : 'pending'}>
                            {link.status}
                          </Badge>
                          {parent?.user?.id && (
                            <Link
                              href={`/users/${parent.user.id}`}
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
                  No parents are linked to this child.
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

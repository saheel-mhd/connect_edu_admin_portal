import Link from 'next/link';
import { ChevronLeft, User as UserIcon } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  RoleBadge,
  UserStatusBadge,
  VerificationStatusBadge,
} from '@/components/badges/StatusBadges';
import { SensitiveDataReveal } from '@/components/safety/SensitiveDataReveal';
import { serverFetch, getCurrentAdmin } from '@/lib/auth/server';
import { hasPermission } from '@/lib/auth/permissions';
import { AccessDeniedState } from '@/components/shared/states';
import {
  formatDateTime,
  maskEmail,
  maskPhone,
} from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { AdminUser } from '@/types/auth';
import type { VerificationStatus } from '@/types/admin';

export const dynamic = 'force-dynamic';

interface KidProfile {
  id: string;
  displayName: string;
  bio: string | null;
  ageGroup: string | null;
  visibility: string;
  allowComments: boolean;
  allowChat: boolean;
  allowEventSuggestions: boolean;
  parentApproved: boolean;
  parents?: Array<{
    id: string;
    status: VerificationStatus;
    approvedAt: string | null;
    parentProfile?: {
      id: string;
      fullName: string;
      user?: { id: string; name: string };
    } | null;
  }>;
  skills?: Array<{
    id: string;
    level: string | null;
    confidenceScore: number;
    skill?: { id: string; name: string } | null;
  }>;
}

interface ParentProfile {
  id: string;
  fullName: string;
  relation: string | null;
  country: string | null;
  phone: string | null;
  children?: Array<{
    id: string;
    status: VerificationStatus;
    approvedAt: string | null;
    kidProfile?: {
      id: string;
      displayName: string;
      parentApproved: boolean;
      user?: { id: string; name: string; status: string };
    } | null;
  }>;
}

interface MentorProfile {
  id: string;
  bio: string | null;
  expertiseSummary: string | null;
  yearsExperience: number | null;
  verificationStatus: VerificationStatus;
  rating: number;
  totalReviews: number;
  skills?: Array<{
    id: string;
    verified: boolean;
    skill?: { id: string; name: string } | null;
  }>;
  documents?: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    status: VerificationStatus;
  }>;
}

interface OrganizationProfile {
  id: string;
  organizationName: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  verificationStatus: VerificationStatus;
  documents?: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    status: VerificationStatus;
  }>;
}

interface UserDetail extends AdminUser {
  dateOfBirth?: string | null;
  kidProfile?: KidProfile | null;
  parentProfile?: ParentProfile | null;
  mentorProfile?: MentorProfile | null;
  organizationProfile?: OrganizationProfile | null;
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, 'users.view')) {
    return (
      <div>
        <PageHeader title="User detail" />
        <AccessDeniedState />
      </div>
    );
  }

  let user: UserDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<UserDetail>>(
      `/admin/users/${params.id}`,
    );
    user = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load user';
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to users
        </Link>
      </div>

      <PageHeader
        title={user?.name || 'User'}
        description={user ? `User ID: ${user.id}` : undefined}
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {user && (
        <div className="space-y-6">
          {/* Header card */}
          <Card>
            <CardBody className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {user.name || '—'}
                  </h2>
                  <RoleBadge role={user.role} />
                  <UserStatusBadge status={user.status} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <SensitiveDataReveal
                    label="Email"
                    maskedValue={maskEmail(user.email)}
                    revealedValue={user.email ?? '—'}
                  />
                  <SensitiveDataReveal
                    label="Phone"
                    maskedValue={maskPhone(user.phone)}
                    revealedValue={user.phone ?? '—'}
                  />
                  <Field label="Username" value={user.username || '—'} />
                  <Field label="Country" value={user.country || '—'} />
                  <Field label="Language" value={user.language || '—'} />
                  <Field
                    label="Created"
                    value={formatDateTime(user.createdAt)}
                  />
                  <Field
                    label="Last login"
                    value={formatDateTime(user.lastLoginAt)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Kid profile */}
          {user.kidProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Kid profile</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Display name"
                  value={user.kidProfile.displayName || '—'}
                />
                <Field
                  label="Age group"
                  value={user.kidProfile.ageGroup || '—'}
                />
                <Field label="Visibility" value={user.kidProfile.visibility} />
                <Field
                  label="Parent approved"
                  value={user.kidProfile.parentApproved ? 'Yes' : 'No'}
                />
                <Field
                  label="Allow comments"
                  value={user.kidProfile.allowComments ? 'Yes' : 'No'}
                />
                <Field
                  label="Allow chat"
                  value={user.kidProfile.allowChat ? 'Yes' : 'No'}
                />
                <Field
                  label="Allow event suggestions"
                  value={user.kidProfile.allowEventSuggestions ? 'Yes' : 'No'}
                />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Bio
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {user.kidProfile.bio || '—'}
                  </p>
                </div>
                {!!user.kidProfile.skills?.length && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Skills
                    </p>
                    <p className="mt-1 text-slate-800">
                      {user.kidProfile.skills
                        .map((s) => s.skill?.name)
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                )}
                {!!user.kidProfile.parents?.length && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Linked parents
                    </p>
                    <ul className="mt-1 space-y-1 text-slate-800">
                      {user.kidProfile.parents.map((link) => (
                        <li key={link.id} className="flex items-center gap-2">
                          {link.parentProfile?.user?.id ? (
                            <Link
                              href={`/users/${link.parentProfile.user.id}`}
                              className="text-brand-700 hover:underline"
                            >
                              {link.parentProfile.fullName ||
                                link.parentProfile.user.name ||
                                '—'}
                            </Link>
                          ) : (
                            <span>{link.parentProfile?.fullName || '—'}</span>
                          )}
                          <span className="text-xs text-slate-500">
                            {link.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Parent profile */}
          {user.parentProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Parent profile</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={user.parentProfile.fullName || '—'}
                />
                <Field
                  label="Relation"
                  value={user.parentProfile.relation || '—'}
                />
                <Field
                  label="Country"
                  value={user.parentProfile.country || '—'}
                />
                <Field
                  label="Phone"
                  value={maskPhone(user.parentProfile.phone)}
                />
                <Field
                  label="Linked children"
                  value={String(user.parentProfile.children?.length ?? 0)}
                />
                {!!user.parentProfile.children?.length && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Children
                    </p>
                    <ul className="mt-1 space-y-1 text-slate-800">
                      {user.parentProfile.children.map((link) => (
                        <li key={link.id} className="flex items-center gap-2">
                          {link.kidProfile?.user?.id ? (
                            <Link
                              href={`/users/${link.kidProfile.user.id}`}
                              className="text-brand-700 hover:underline"
                            >
                              {link.kidProfile.displayName ||
                                link.kidProfile.user.name ||
                                '—'}
                            </Link>
                          ) : (
                            <span>{link.kidProfile?.displayName || '—'}</span>
                          )}
                          <span className="text-xs text-slate-500">
                            {link.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Mentor profile */}
          {user.mentorProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Mentor profile</CardTitle>
                <VerificationStatusBadge
                  status={user.mentorProfile.verificationStatus}
                />
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Expertise"
                  value={user.mentorProfile.expertiseSummary || '—'}
                />
                <Field
                  label="Years of experience"
                  value={
                    user.mentorProfile.yearsExperience != null
                      ? String(user.mentorProfile.yearsExperience)
                      : '—'
                  }
                />
                <Field
                  label="Rating"
                  value={`${user.mentorProfile.rating.toFixed(1)} (${user.mentorProfile.totalReviews} reviews)`}
                />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Skills
                  </p>
                  <p className="mt-1 text-slate-800">
                    {user.mentorProfile.skills?.length
                      ? user.mentorProfile.skills
                          .map((s) => s.skill?.name)
                          .filter(Boolean)
                          .join(', ')
                      : '—'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Bio
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {user.mentorProfile.bio || '—'}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Organization profile */}
          {user.organizationProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Organization profile</CardTitle>
                <VerificationStatusBadge
                  status={user.organizationProfile.verificationStatus}
                />
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Organization name"
                  value={user.organizationProfile.organizationName || '—'}
                />
                <Field
                  label="Industry"
                  value={user.organizationProfile.industry || '—'}
                />
                <Field
                  label="Contact person"
                  value={user.organizationProfile.contactPerson || '—'}
                />
                <Field
                  label="Contact email"
                  value={maskEmail(user.organizationProfile.contactEmail)}
                />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Website
                  </p>
                  {user.organizationProfile.website ? (
                    <a
                      href={user.organizationProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-brand-700 hover:underline"
                    >
                      {user.organizationProfile.website}
                    </a>
                  ) : (
                    <p className="mt-1 text-slate-800">—</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Description
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {user.organizationProfile.description || '—'}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Footer */}
          <Card>
            <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <Field label="User ID" value={user.id} />
              <Field
                label="Updated"
                value={formatDateTime(user.updatedAt)}
              />
              <Field
                label="Date of birth"
                value={user.dateOfBirth ? 'On file (masked)' : '—'}
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

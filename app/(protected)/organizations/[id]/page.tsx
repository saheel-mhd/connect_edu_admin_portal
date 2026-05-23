import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { VerificationStatusBadge } from '@/components/badges/StatusBadges';
import { SensitiveDataReveal } from '@/components/safety/SensitiveDataReveal';
import { serverFetch } from '@/lib/auth/server';
import {
  formatDateTime,
  maskEmail,
  truncate,
} from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { VerificationStatus } from '@/types/admin';
import { OrganizationActions } from './OrganizationActions';

interface OrgDocument {
  id: string;
  fileType?: string;
  fileName?: string | null;
  fileUrl?: string;
  status?: string;
  uploadedAt?: string;
}

interface OrganizationDetail {
  id: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  organizationName?: string | null;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  documents?: OrgDocument[];
}

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

function maskFileName(name?: string | null): string {
  if (!name) return 'Document';
  if (name.length <= 12) return name;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  return `${truncate(name.replace(ext, ''), 10)}${ext}`;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  let detail: OrganizationDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<OrganizationDetail>>(
      `/admin/organizations/${params.id}`,
    );
    detail = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load organization';
  }

  const profile = detail;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>
      </div>

      <PageHeader
        title={profile?.organizationName || 'Organization'}
        description="Organization profile, verification and submitted documents."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {detail && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization profile</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">
                    {profile?.organizationName || '—'}
                  </span>
                  <VerificationStatusBadge
                    status={detail.verificationStatus}
                  />
                  {profile?.industry && (
                    <Badge tone="neutral">{profile.industry}</Badge>
                  )}
                </div>
                {profile?.website && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Website
                    </p>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile?.description && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">
                      {profile.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Contact person
                    </p>
                    <p className="mt-1 text-slate-800">
                      {profile?.contactPerson || '—'}
                    </p>
                  </div>
                  <div>
                    <SensitiveDataReveal
                      label="Contact email"
                      maskedValue={maskEmail(profile?.contactEmail)}
                      revealedValue={profile?.contactEmail || '—'}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Submitted {formatDateTime(detail.createdAt)}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardBody>
                {detail.documents && detail.documents.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {detail.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {maskFileName(doc.fileName || doc.fileType)}
                          </span>
                          {doc.status && (
                            <Badge
                              tone={
                                doc.status === 'APPROVED'
                                  ? 'success'
                                  : doc.status === 'REJECTED'
                                    ? 'danger'
                                    : 'pending'
                              }
                            >
                              {doc.status.replace('_', ' ')}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            Uploaded {formatDateTime(doc.uploadedAt)}
                          </span>
                        </div>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            Open
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No documents submitted.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <OrganizationActions id={detail.id} />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

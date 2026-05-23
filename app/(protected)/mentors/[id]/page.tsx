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
import {
  RoleBadge,
  UserStatusBadge,
  VerificationStatusBadge,
} from '@/components/badges/StatusBadges';
import { SensitiveDataReveal } from '@/components/safety/SensitiveDataReveal';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime, maskEmail, maskPhone } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { VerificationStatus } from '@/types/admin';
import type { UserRole, UserStatus } from '@/types/auth';
import { MentorActions } from './MentorActions';

interface MentorSkill {
  id: string;
  skill: { id: string; name: string };
  isVerified?: boolean;
}

interface MentorDocument {
  id: string;
  fileType?: string;
  fileUrl?: string;
  status?: string;
  uploadedAt?: string;
}

interface MentorDetail {
  id: string;
  bio?: string | null;
  expertiseSummary?: string | null;
  yearsExperience?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  mentor: {
    id: string;
    user: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      role: UserRole;
      status: UserStatus;
    };
    documents?: MentorDocument[];
  };
  mentorSkills?: MentorSkill[];
}

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function MentorDetailPage({ params }: PageProps) {
  let detail: MentorDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<MentorDetail>>(
      `/admin/mentors/${params.id}`,
    );
    detail = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load mentor';
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/mentors"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to mentors
        </Link>
      </div>

      <PageHeader
        title={detail?.mentor?.user?.name || 'Mentor'}
        description="Mentor profile, verification, skills and submitted documents."
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
                <CardTitle>User</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">
                    {detail.mentor.user.name}
                  </span>
                  <RoleBadge role={detail.mentor.user.role} />
                  <UserStatusBadge status={detail.mentor.user.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <SensitiveDataReveal
                    label="Email"
                    maskedValue={maskEmail(detail.mentor.user.email)}
                    revealedValue={detail.mentor.user.email || '—'}
                  />
                  <SensitiveDataReveal
                    label="Phone"
                    maskedValue={maskPhone(detail.mentor.user.phone)}
                    revealedValue={detail.mentor.user.phone || '—'}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mentor profile</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <VerificationStatusBadge
                    status={detail.verificationStatus}
                  />
                  {detail.rating != null && (
                    <Badge tone="info">
                      Rating {detail.rating.toFixed(1)}
                    </Badge>
                  )}
                  {detail.totalReviews != null && (
                    <Badge tone="neutral">
                      {detail.totalReviews} reviews
                    </Badge>
                  )}
                  {detail.yearsExperience != null && (
                    <Badge tone="neutral">
                      {detail.yearsExperience} yrs experience
                    </Badge>
                  )}
                </div>
                {detail.expertiseSummary && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Expertise summary
                    </p>
                    <p className="mt-1 text-slate-800">
                      {detail.expertiseSummary}
                    </p>
                  </div>
                )}
                {detail.bio && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Bio
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">
                      {detail.bio}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Submitted {formatDateTime(detail.createdAt)}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardBody>
                {detail.mentorSkills && detail.mentorSkills.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {detail.mentorSkills.map((s) => (
                      <li
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800"
                      >
                        <span>{s.skill.name}</span>
                        {s.isVerified ? (
                          <Badge tone="success">Verified</Badge>
                        ) : (
                          <Badge tone="neutral">Unverified</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No skills listed yet.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification documents</CardTitle>
              </CardHeader>
              <CardBody>
                {detail.mentor.documents &&
                detail.mentor.documents.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {detail.mentor.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {doc.fileType || 'Document'}
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
                <MentorActions id={detail.id} />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

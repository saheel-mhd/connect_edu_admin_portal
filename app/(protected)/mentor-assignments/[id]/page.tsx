import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { VerificationStatusBadge } from '@/components/badges/StatusBadges';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { VerificationStatus } from '@/types/admin';
import { AssignmentActions } from './AssignmentActions';

interface AssignmentDetail {
  id: string;
  status: string;
  parentApproved?: boolean | null;
  createdAt: string;
  endedAt?: string | null;
  mentorProfile?: {
    id: string;
    verificationStatus?: VerificationStatus | null;
    user?: { id: string; name: string } | null;
  } | null;
  kidProfile?: {
    id: string;
    displayName: string;
    ageGroup?: string | null;
    parentApproved?: boolean | null;
  } | null;
  skill?: { id: string; name: string } | null;
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'pending';
  if (status === 'ENDED') return 'neutral';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export const dynamic = 'force-dynamic';

export default async function MentorAssignmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let assignment: AssignmentDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<AssignmentDetail>>(
      `/admin/mentor-assignments/${params.id}`,
    );
    assignment = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load assignment';
  }

  const canEnd =
    !!assignment &&
    assignment.status !== 'ENDED' &&
    assignment.status !== 'CANCELLED';

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/mentor-assignments"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to assignments
        </Link>
      </div>

      <PageHeader
        title={
          assignment
            ? `Assignment #${assignment.id.slice(0, 8)}`
            : 'Mentor assignment'
        }
        description="Review and manage this mentor-to-kid assignment."
        actions={
          assignment ? (
            <AssignmentActions
              assignmentId={assignment.id}
              canEnd={canEnd}
            />
          ) : undefined
        }
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {assignment && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-1">
                  <Badge tone={statusTone(assignment.status) as never}>
                    {assignment.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Parent approved
                </p>
                <div className="mt-1">
                  {assignment.parentApproved ? (
                    <Badge tone="success">Yes</Badge>
                  ) : (
                    <Badge tone="warning">No</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 text-slate-800">
                  {formatDateTime(assignment.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Ended
                </p>
                <p className="mt-1 text-slate-800">
                  {assignment.endedAt
                    ? formatDateTime(assignment.endedAt)
                    : '—'}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentor</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p className="font-medium text-slate-900">
                {assignment.mentorProfile?.user?.name ?? '—'}
              </p>
              <p className="font-mono text-xs text-slate-500">
                {assignment.mentorProfile?.id ?? '—'}
              </p>
              {assignment.mentorProfile?.verificationStatus && (
                <VerificationStatusBadge
                  status={assignment.mentorProfile.verificationStatus}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kid</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p className="font-medium text-slate-900">
                {assignment.kidProfile?.displayName ?? '—'}
              </p>
              <p className="font-mono text-xs text-slate-500">
                {assignment.kidProfile?.id ?? '—'}
              </p>
              <p className="text-slate-700">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Age group
                </span>
                <br />
                {assignment.kidProfile?.ageGroup ?? '—'}
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Parent approved
                </span>
                <br />
                {assignment.kidProfile?.parentApproved ? (
                  <Badge tone="success">Yes</Badge>
                ) : (
                  <Badge tone="warning">No</Badge>
                )}
              </p>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Skill</CardTitle>
            </CardHeader>
            <CardBody className="text-sm">
              {assignment.skill ? (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">
                    {assignment.skill.name}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {assignment.skill.id}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">No skill linked.</span>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

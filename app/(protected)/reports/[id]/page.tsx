import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReportStatusBadge, RoleBadge } from '@/components/badges/StatusBadges';
import { FlaggedTextHighlighter } from '@/components/safety/FlaggedTextHighlighter';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { ReportStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';
import { ReportActions } from './ReportActions';

interface ReportDetail {
  id: string;
  reportedBy?: {
    id: string;
    name: string;
    email?: string | null;
    role: UserRole;
  } | null;
  targetType: string;
  targetId: string;
  postId?: string | null;
  commentId?: string | null;
  messageId?: string | null;
  eventId?: string | null;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  reviewedBy?: { id: string; name: string } | null;
  reviewedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
}

interface RelatedPreview {
  id: string;
  content?: string | null;
  title?: string | null;
  text?: string | null;
  body?: string | null;
}

export const dynamic = 'force-dynamic';

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let report: ReportDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<ReportDetail>>(
      `/admin/reports/${params.id}`,
    );
    report = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load report';
  }

  let relatedPreview: RelatedPreview | null = null;
  let relatedLabel: string | null = null;
  if (report) {
    try {
      if (report.postId) {
        const res = await serverFetch<ApiSuccess<RelatedPreview>>(
          `/admin/posts/${report.postId}`,
        );
        relatedPreview = res.data;
        relatedLabel = 'Related post';
      } else if (report.commentId) {
        const res = await serverFetch<ApiSuccess<RelatedPreview>>(
          `/admin/comments/${report.commentId}`,
        );
        relatedPreview = res.data;
        relatedLabel = 'Related comment';
      } else if (report.messageId) {
        const res = await serverFetch<ApiSuccess<RelatedPreview>>(
          `/admin/chat-safety/messages/${report.messageId}`,
        );
        relatedPreview = res.data;
        relatedLabel = 'Related message';
      } else if (report.eventId) {
        const res = await serverFetch<ApiSuccess<RelatedPreview>>(
          `/admin/events/${report.eventId}`,
        );
        relatedPreview = res.data;
        relatedLabel = 'Related event';
      }
    } catch {
      // Optional preview — silently ignore failures.
    }
  }

  function targetHref(): string | null {
    if (!report) return null;
    switch (report.targetType) {
      case 'post':
        return `/posts/${report.postId ?? report.targetId}`;
      case 'event':
        return `/events/${report.eventId ?? report.targetId}`;
      case 'comment':
        return report.postId
          ? `/posts/${report.postId}#comment-${report.commentId ?? report.targetId}`
          : null;
      case 'message':
        return null;
      case 'user':
        return `/users/${report.targetId}`;
      case 'organization':
        return `/organizations/${report.targetId}`;
      case 'mentor':
        return `/mentors/${report.targetId}`;
      case 'opportunity':
        return `/opportunities/${report.targetId}`;
      default:
        return null;
    }
  }

  const href = targetHref();

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
      </div>
      <PageHeader
        title={report ? `Report #${report.id.slice(0, 8)}` : 'Report'}
        description="Review the report context and take an action."
        actions={report ? <ReportActions reportId={report.id} /> : undefined}
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {report && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reporter</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              {report.reportedBy ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {report.reportedBy.name}
                    </span>
                    <RoleBadge role={report.reportedBy.role} />
                  </div>
                  <p className="text-slate-600">
                    Email: {maskEmail(report.reportedBy.email)}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Reporter not available</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p className="text-slate-700">
                <span className="font-medium">{report.targetType}</span>{' '}
                <span className="font-mono text-xs text-slate-500">
                  {report.targetId}
                </span>
              </p>
              {href && (
                <Link
                  href={href}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Open target →
                </Link>
              )}
              {report.targetType === 'comment' && report.postId && (
                <Link
                  href={`/posts/${report.postId}`}
                  className="block text-sm font-medium text-brand-600 hover:underline"
                >
                  View comment on post →
                </Link>
              )}
              {report.targetType === 'message' && (
                <p className="text-xs text-slate-500">
                  Message in a chat room — open from chat-safety.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardBody className="text-sm text-slate-800">
              {report.reason || <span className="text-slate-400">—</span>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardBody>
              <FlaggedTextHighlighter text={report.description} />
            </CardBody>
          </Card>

          {relatedPreview && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{relatedLabel ?? 'Related content'}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                {relatedPreview.title && (
                  <p className="font-medium text-slate-900">
                    {relatedPreview.title}
                  </p>
                )}
                <FlaggedTextHighlighter
                  text={
                    relatedPreview.content ??
                    relatedPreview.text ??
                    relatedPreview.body ??
                    null
                  }
                />
              </CardBody>
            </Card>
          )}

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <ReportStatusBadge status={report.status} />
                <span className="text-xs text-slate-500">
                  Reported {formatDateTime(report.createdAt)}
                </span>
              </div>
              {report.reviewedBy && (
                <p className="text-slate-700">
                  Reviewed by{' '}
                  <span className="font-medium">
                    {report.reviewedBy.name}
                  </span>{' '}
                  <span className="text-xs text-slate-500">
                    {report.reviewedAt
                      ? `on ${formatDateTime(report.reviewedAt)}`
                      : ''}
                  </span>
                </p>
              )}
              {report.resolutionNote && (
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Resolution note
                  </p>
                  <p className="mt-1 text-slate-800">{report.resolutionNote}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

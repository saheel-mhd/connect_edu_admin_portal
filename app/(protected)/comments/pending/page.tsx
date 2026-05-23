'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import { RoleBadge } from '@/components/badges/StatusBadges';
import { FlaggedTextHighlighter } from '@/components/safety/FlaggedTextHighlighter';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, truncate } from '@/lib/utils/format';
import type { PaginationMeta } from '@/types/api';
import type { ModerationStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';

interface PendingCommentRow {
  id: string;
  postId: string;
  text: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
}

type ActionKind = 'approve' | 'reject' | 'hide';

interface ActionTarget {
  id: string;
  kind: ActionKind;
}

export default function PendingCommentsPage() {
  const canApprove = usePermission('comments.approve');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [action, setAction] = useState<ActionTarget | null>(null);

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const query = useQuery({
    queryKey: queryKeys.commentsPending(params),
    queryFn: () =>
      apiFetch<PendingCommentRow[]>('/admin/comments/pending', {
        searchParams: params,
      }),
    enabled: canApprove,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.commentsPending(params),
    });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/comments/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      note,
    }: {
      id: string;
      reason: string;
      note?: string;
    }) =>
      apiFetch(`/admin/comments/${id}/reject`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const hideMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      note,
    }: {
      id: string;
      reason: string;
      note?: string;
    }) =>
      apiFetch(`/admin/comments/${id}/hide`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const columns = useMemo<ColumnDef<PendingCommentRow, unknown>[]>(
    () => [
      {
        header: 'Author',
        cell: ({ row }) => {
          const author = row.original.author;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-slate-900">
                {author?.name ?? '—'}
              </span>
              {author?.role && <RoleBadge role={author.role} />}
            </div>
          );
        },
      },
      {
        header: 'Post',
        cell: ({ row }) => (
          <Link
            href={`/posts/${row.original.postId}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {truncate(row.original.postId, 12)}
          </Link>
        ),
      },
      {
        header: 'Text',
        cell: ({ row }) => (
          <div className="max-w-md whitespace-normal">
            <FlaggedTextHighlighter text={row.original.text} />
          </div>
        ),
      },
      {
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => setAction({ id: row.original.id, kind: 'approve' })}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setAction({ id: row.original.id, kind: 'reject' })}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAction({ id: row.original.id, kind: 'hide' })}
            >
              Hide
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (!canApprove) {
    return (
      <div>
        <PageHeader title="Pending comments" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pending comments"
        description="Comments awaiting moderator review."
      />

      <Card>
        {query.isError ? (
          <CardBody>
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load pending comments.'
              }
              onRetry={() => query.refetch()}
            />
          </CardBody>
        ) : (
          <DataTable<PendingCommentRow>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination as PaginationMeta | undefined}
            onPageChange={setPage}
            emptyTitle="No pending comments"
            emptyDescription="The moderation queue is empty."
          />
        )}
      </Card>

      <ConfirmActionModal
        open={action?.kind === 'approve'}
        onClose={() => setAction(null)}
        onConfirm={() => action && approveMutation.mutate(action.id)}
        title="Approve comment"
        description="The comment will become visible on the platform."
        confirmLabel="Approve"
        loading={approveMutation.isPending}
      />

      <ReasonRequiredModal
        open={action?.kind === 'reject'}
        onClose={() => setAction(null)}
        onConfirm={(reason, note) =>
          action && rejectMutation.mutate({ id: action.id, reason, note })
        }
        title="Reject comment"
        description="The comment will be rejected and removed from public visibility."
        confirmLabel="Reject"
        destructive
        loading={rejectMutation.isPending}
      />

      <ReasonRequiredModal
        open={action?.kind === 'hide'}
        onClose={() => setAction(null)}
        onConfirm={(reason, note) =>
          action && hideMutation.mutate({ id: action.id, reason, note })
        }
        title="Hide comment"
        description="The comment will be hidden from the platform but retained for review."
        confirmLabel="Hide"
        destructive
        loading={hideMutation.isPending}
      />
    </div>
  );
}

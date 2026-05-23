'use client';

import { useMemo, useState } from 'react';
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
import { formatDateTime } from '@/lib/utils/format';
import type { PaginationMeta } from '@/types/api';
import type { ModerationStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';

type PostType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'PROJECT'
  | 'ACHIEVEMENT'
  | 'EVENT'
  | 'OPPORTUNITY'
  | 'REPOST';

interface PendingPostRow {
  id: string;
  type: PostType;
  caption?: string | null;
  moderationStatus: ModerationStatus;
  safetyScore: number;
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

export default function PendingPostsPage() {
  const canApprove = usePermission('posts.approve');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [action, setAction] = useState<ActionTarget | null>(null);

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const query = useQuery({
    queryKey: queryKeys.postsPending(params),
    queryFn: () =>
      apiFetch<PendingPostRow[]>('/admin/posts/pending', {
        searchParams: params,
      }),
    enabled: canApprove,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/posts/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postsPending(params) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      apiFetch(`/admin/posts/${id}/reject`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postsPending(params) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      apiFetch(`/admin/posts/${id}/hide`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postsPending(params) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setAction(null);
    },
  });

  const columns = useMemo<ColumnDef<PendingPostRow, unknown>[]>(
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
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.type}</span>
        ),
      },
      {
        header: 'Caption',
        cell: ({ row }) => (
          <div className="max-w-md whitespace-normal">
            <FlaggedTextHighlighter text={row.original.caption} />
          </div>
        ),
      },
      {
        header: 'Safety score',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.safetyScore.toFixed(2)}
          </span>
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
        <PageHeader title="Pending posts" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pending posts"
        description="Posts awaiting moderator review."
      />

      <Card>
        {query.isError ? (
          <CardBody>
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load pending posts.'
              }
              onRetry={() => query.refetch()}
            />
          </CardBody>
        ) : (
          <DataTable<PendingPostRow>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination as PaginationMeta | undefined}
            onPageChange={setPage}
            emptyTitle="No pending posts"
            emptyDescription="The moderation queue is empty."
          />
        )}
      </Card>

      <ConfirmActionModal
        open={action?.kind === 'approve'}
        onClose={() => setAction(null)}
        onConfirm={() => action && approveMutation.mutate(action.id)}
        title="Approve post"
        description="The post will become visible on the platform."
        confirmLabel="Approve"
        loading={approveMutation.isPending}
      />

      <ReasonRequiredModal
        open={action?.kind === 'reject'}
        onClose={() => setAction(null)}
        onConfirm={(reason, note) =>
          action && rejectMutation.mutate({ id: action.id, reason, note })
        }
        title="Reject post"
        description="The post will be rejected and will not be visible to other users."
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
        title="Hide post"
        description="The post will be hidden from the platform but retained for review."
        confirmLabel="Hide"
        destructive
        loading={hideMutation.isPending}
      />
    </div>
  );
}

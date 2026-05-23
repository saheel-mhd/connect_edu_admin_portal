'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import {
  ModerationStatusBadge,
  RoleBadge,
} from '@/components/badges/StatusBadges';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, truncate } from '@/lib/utils/format';
import type { PaginationMeta } from '@/types/api';
import type { ModerationStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';

interface AdminCommentRow {
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

const MODERATION_OPTIONS: Array<{ value: '' | ModerationStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'HIDDEN', label: 'Hidden' },
];

export default function CommentsListPage() {
  const canView = usePermission('comments.view');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [moderationStatus, setModerationStatus] = useState<'' | ModerationStatus>(
    '',
  );
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [action, setAction] = useState<ActionTarget | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      moderationStatus: moderationStatus || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, moderationStatus, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.comments(params),
    queryFn: () =>
      apiFetch<AdminCommentRow[]>('/admin/comments', { searchParams: params }),
    enabled: canView,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.comments(params) });
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

  const columns = useMemo<ColumnDef<AdminCommentRow, unknown>[]>(
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
          <span className="text-slate-700">
            {truncate(row.original.text, 80)}
          </span>
        ),
      },
      {
        header: 'Moderation',
        cell: ({ row }) => (
          <ModerationStatusBadge status={row.original.moderationStatus} />
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

  if (!canView) {
    return (
      <div>
        <PageHeader title="Comments" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Comments"
        description="All comments posted on the platform."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Search by text or author"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="moderationStatus">Moderation</Label>
            <Select
              id="moderationStatus"
              value={moderationStatus}
              onChange={(event) =>
                setModerationStatus(
                  event.target.value as '' | ModerationStatus,
                )
              }
              className="mt-1"
            >
              {MODERATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        {query.isError ? (
          <CardBody>
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load comments.'
              }
              onRetry={() => query.refetch()}
            />
          </CardBody>
        ) : (
          <DataTable<AdminCommentRow>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination as PaginationMeta | undefined}
            onPageChange={setPage}
            emptyTitle="No comments found"
            emptyDescription="Try adjusting your filters."
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

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, ExternalLink, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime } from '@/lib/utils/format';
import { usePagination } from '@/hooks/use-pagination';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { hasPermission } from '@/lib/auth/permissions';
import type { PaginationMeta } from '@/types/api';

interface PendingEventRow {
  id: string;
  title: string;
  ageMin?: number | null;
  ageMax?: number | null;
  startTime?: string | null;
  createdAt?: string | null;
  isOnline?: boolean | null;
  externalUrl?: string | null;
  organizationProfile?: {
    id: string;
    organizationName?: string | null;
  } | null;
}

function safeHostname(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'approve'; id: string; title: string }
  | { kind: 'reject'; id: string; title: string };

export default function PendingEventsPage() {
  const { admin } = useCurrentAdmin();
  const canApprove = admin ? hasPermission(admin.role, 'events.approve') : false;

  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const query = useQuery({
    queryKey: queryKeys.eventsPending(params),
    queryFn: () =>
      apiFetch<PendingEventRow[]>('/admin/events/pending', {
        searchParams: { page: params.page, limit: params.limit },
      }),
    enabled: canApprove,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/events/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setModal({ kind: 'none' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string; note?: string }) =>
      apiFetch(`/admin/events/${vars.id}/reject`, {
        method: 'PATCH',
        body: { reason: vars.reason, note: vars.note },
      }),
    onSuccess: () => {
      invalidate();
      setModal({ kind: 'none' });
    },
  });

  const columns = useMemo<ColumnDef<PendingEventRow, unknown>[]>(
    () => [
      {
        header: 'Title',
        cell: ({ row }) => (
          <Link
            href={`/events/${row.original.id}`}
            className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        header: 'Organization',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.organizationProfile?.organizationName ?? '—'}
          </span>
        ),
      },
      {
        header: 'Age range',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {`${row.original.ageMin ?? '—'}–${row.original.ageMax ?? '—'}`}
          </span>
        ),
      },
      {
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDateTime(row.original.startTime)}
          </span>
        ),
      },
      {
        header: 'Mode',
        cell: ({ row }) => (
          <Badge tone={row.original.isOnline ? 'info' : 'neutral'}>
            {row.original.isOnline ? 'Online' : 'Offline'}
          </Badge>
        ),
      },
      {
        header: 'External URL',
        cell: ({ row }) => {
          const host = safeHostname(row.original.externalUrl);
          if (!row.original.externalUrl || !host) {
            return <span className="text-slate-400">—</span>;
          }
          return (
            <a
              href={row.original.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`URL review: ${row.original.externalUrl}`}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {host}
            </a>
          );
        },
      },
      {
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-slate-700">
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
              onClick={() =>
                setModal({
                  kind: 'approve',
                  id: row.original.id,
                  title: row.original.title,
                })
              }
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                setModal({
                  kind: 'reject',
                  id: row.original.id,
                  title: row.original.title,
                })
              }
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (admin && !canApprove) {
    return (
      <div>
        <PageHeader title="Pending events" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <PermissionGate permission="events.approve" fallback={<AccessDeniedState />}>
      <div>
        <PageHeader
          title="Pending events"
          description="Review and decide on events awaiting approval."
        />

        <Card>
          {query.isError ? (
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load pending events.'
              }
              onRetry={() => query.refetch()}
            />
          ) : (
            <DataTable<PendingEventRow>
              data={query.data?.data ?? []}
              columns={columns}
              loading={query.isLoading}
              pagination={query.data?.pagination as PaginationMeta | undefined}
              onPageChange={setPage}
              emptyTitle="Nothing pending"
              emptyDescription="There are no events awaiting approval."
            />
          )}
        </Card>

        <ConfirmActionModal
          open={modal.kind === 'approve'}
          onClose={() => setModal({ kind: 'none' })}
          onConfirm={() => {
            if (modal.kind === 'approve') approveMutation.mutate(modal.id);
          }}
          title={
            modal.kind === 'approve'
              ? `Approve "${modal.title}"?`
              : 'Approve event?'
          }
          description="The event will become visible to families and youth in the public feed."
          confirmLabel="Approve"
          loading={approveMutation.isPending}
        />

        <ReasonRequiredModal
          open={modal.kind === 'reject'}
          onClose={() => setModal({ kind: 'none' })}
          onConfirm={(reason, note) => {
            if (modal.kind === 'reject') {
              rejectMutation.mutate({ id: modal.id, reason, note });
            }
          }}
          title={
            modal.kind === 'reject'
              ? `Reject "${modal.title}"?`
              : 'Reject event?'
          }
          description="The submitting organization will be notified of the decision."
          confirmLabel="Reject"
          destructive
          loading={rejectMutation.isPending}
        />
      </div>
    </PermissionGate>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, ExternalLink, EyeOff, X } from 'lucide-react';
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

interface PendingOpportunityRow {
  id: string;
  title: string;
  opportunityType?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  externalUrl?: string | null;
  createdAt?: string | null;
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
  | { kind: 'reject'; id: string; title: string }
  | { kind: 'hide'; id: string; title: string };

export default function PendingOpportunitiesPage() {
  const { admin } = useCurrentAdmin();
  const canApprove = admin
    ? hasPermission(admin.role, 'opportunities.approve')
    : false;

  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const query = useQuery({
    queryKey: queryKeys.opportunitiesPending(params),
    queryFn: () =>
      apiFetch<PendingOpportunityRow[]>('/admin/opportunities/pending', {
        searchParams: { page: params.page, limit: params.limit },
      }),
    enabled: canApprove,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/opportunities/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setModal({ kind: 'none' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string; note?: string }) =>
      apiFetch(`/admin/opportunities/${vars.id}/reject`, {
        method: 'PATCH',
        body: { reason: vars.reason, note: vars.note },
      }),
    onSuccess: () => {
      invalidate();
      setModal({ kind: 'none' });
    },
  });

  const hideMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string; note?: string }) =>
      apiFetch(`/admin/opportunities/${vars.id}/hide`, {
        method: 'PATCH',
        body: { reason: vars.reason, note: vars.note },
      }),
    onSuccess: () => {
      invalidate();
      setModal({ kind: 'none' });
    },
  });

  const columns = useMemo<ColumnDef<PendingOpportunityRow, unknown>[]>(
    () => [
      {
        header: 'Title',
        cell: ({ row }) => (
          <Link
            href={`/opportunities/${row.original.id}`}
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
        header: 'Type',
        cell: ({ row }) =>
          row.original.opportunityType ? (
            <Badge tone="neutral">
              {row.original.opportunityType.replace(/_/g, ' ')}
            </Badge>
          ) : (
            <span className="text-slate-400">—</span>
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setModal({
                  kind: 'hide',
                  id: row.original.id,
                  title: row.original.title,
                })
              }
            >
              <EyeOff className="h-3.5 w-3.5" /> Hide
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
        <PageHeader title="Pending opportunities" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <PermissionGate
      permission="opportunities.approve"
      fallback={<AccessDeniedState />}
    >
      <div>
        <PageHeader
          title="Pending opportunities"
          description="Review and decide on opportunities awaiting approval."
        />

        <Card>
          {query.isError ? (
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load pending opportunities.'
              }
              onRetry={() => query.refetch()}
            />
          ) : (
            <DataTable<PendingOpportunityRow>
              data={query.data?.data ?? []}
              columns={columns}
              loading={query.isLoading}
              pagination={query.data?.pagination as PaginationMeta | undefined}
              onPageChange={setPage}
              emptyTitle="Nothing pending"
              emptyDescription="There are no opportunities awaiting approval."
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
              : 'Approve opportunity?'
          }
          description="The opportunity will become visible to families and youth."
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
              : 'Reject opportunity?'
          }
          description="The submitting organization will be notified of the decision."
          confirmLabel="Reject"
          destructive
          loading={rejectMutation.isPending}
        />

        <ReasonRequiredModal
          open={modal.kind === 'hide'}
          onClose={() => setModal({ kind: 'none' })}
          onConfirm={(reason, note) => {
            if (modal.kind === 'hide') {
              hideMutation.mutate({ id: modal.id, reason, note });
            }
          }}
          title={
            modal.kind === 'hide'
              ? `Hide "${modal.title}"?`
              : 'Hide opportunity?'
          }
          description="Hidden opportunities stay in the system but are removed from public surfaces."
          confirmLabel="Hide"
          destructive
          loading={hideMutation.isPending}
        />
      </div>
    </PermissionGate>
  );
}

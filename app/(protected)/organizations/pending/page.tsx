'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, maskEmail } from '@/lib/utils/format';

interface OrgDocument {
  id: string;
  fileType?: string;
  fileUrl?: string;
  status?: string;
}

interface PendingOrganization {
  id: string;
  createdAt: string;
  organizationProfile?: {
    organizationName?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    website?: string | null;
  } | null;
  documents?: OrgDocument[];
}

type ActionType = 'approve' | 'reject' | 'request-more-info';

export default function OrganizationsPendingPage() {
  const canApprove = usePermission('organizations.approve');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.organizationsPending(params),
    queryFn: () =>
      apiFetch<PendingOrganization[]>('/admin/organizations/pending', {
        searchParams: params,
      }),
    enabled: canApprove,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      id,
      type,
      body,
    }: {
      id: string;
      type: ActionType;
      body?: { reason: string; note?: string };
    }) => {
      const path =
        type === 'approve'
          ? `/admin/organizations/${id}/approve`
          : type === 'reject'
            ? `/admin/organizations/${id}/reject`
            : `/admin/organizations/${id}/request-more-info`;
      return apiFetch<unknown>(path, {
        method: 'PATCH',
        body: type === 'approve' ? {} : body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setActiveId(null);
      setAction(null);
    },
  });

  function openAction(id: string, type: ActionType) {
    setActiveId(id);
    setAction(type);
  }
  function closeAction() {
    if (mutation.isPending) return;
    setActiveId(null);
    setAction(null);
  }

  const columns = useMemo<ColumnDef<PendingOrganization, unknown>[]>(
    () => [
      {
        header: 'Organization',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.organizationProfile?.organizationName || '—'}
          </span>
        ),
      },
      {
        header: 'Contact person',
        cell: ({ row }) =>
          row.original.organizationProfile?.contactPerson || '—',
      },
      {
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {maskEmail(row.original.organizationProfile?.contactEmail)}
          </span>
        ),
      },
      {
        header: 'Website',
        cell: ({ row }) => {
          const website = row.original.organizationProfile?.website;
          if (!website) return <span className="text-xs text-slate-400">—</span>;
          return (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {website.replace(/^https?:\/\//, '')}
            </a>
          );
        },
      },
      {
        header: 'Documents',
        cell: ({ row }) => (
          <Badge tone="neutral">
            {row.original.documents?.length ?? 0}
          </Badge>
        ),
      },
      {
        header: 'Submitted',
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
              onClick={() => openAction(row.original.id, 'approve')}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => openAction(row.original.id, 'reject')}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openAction(row.original.id, 'request-more-info')}
            >
              Request info
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
        <PageHeader title="Pending organizations" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pending organizations"
        description="Review and verify pending organization applications."
      />

      <Card>
        {error ? (
          <CardBody className="text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending organizations'}
          </CardBody>
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            loading={isLoading}
            pagination={data?.pagination}
            onPageChange={setPage}
            emptyTitle="No pending organizations"
            emptyDescription="There are no organization applications awaiting review."
          />
        )}
      </Card>

      <ConfirmActionModal
        open={action === 'approve' && !!activeId}
        onClose={closeAction}
        onConfirm={() => {
          if (!activeId) return;
          mutation.mutate({ id: activeId, type: 'approve' });
        }}
        title="Approve organization"
        description="The organization will be marked as APPROVED and notified."
        confirmLabel="Approve"
        loading={mutation.isPending}
      />

      <ReasonRequiredModal
        open={action === 'reject' && !!activeId}
        onClose={closeAction}
        onConfirm={(reason, note) => {
          if (!activeId) return;
          mutation.mutate({
            id: activeId,
            type: 'reject',
            body: { reason, note },
          });
        }}
        title="Reject organization"
        description="Provide a reason — the organization will be notified."
        confirmLabel="Reject"
        destructive
        loading={mutation.isPending}
      />

      <ReasonRequiredModal
        open={action === 'request-more-info' && !!activeId}
        onClose={closeAction}
        onConfirm={(reason, note) => {
          if (!activeId) return;
          mutation.mutate({
            id: activeId,
            type: 'request-more-info',
            body: { reason, note },
          });
        }}
        title="Request more info"
        description="Ask the organization for additional documentation or clarification."
        confirmLabel="Send request"
        loading={mutation.isPending}
      />
    </div>
  );
}

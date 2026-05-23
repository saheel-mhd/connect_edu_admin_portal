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

interface MentorSkillItem {
  id: string;
  skill: { id: string; name: string };
}

interface MentorDocument {
  id: string;
  fileType?: string;
  status?: string;
  uploadedAt?: string;
  fileUrl?: string;
}

interface PendingMentor {
  id: string;
  yearsExperience?: number | null;
  createdAt: string;
  mentor: {
    user: {
      id: string;
      name: string;
      email?: string | null;
    };
    documents?: MentorDocument[];
  };
  mentorSkills?: MentorSkillItem[];
}

type ActionType = 'approve' | 'reject' | 'request-more-info';

export default function MentorsPendingPage() {
  const canApprove = usePermission('mentors.approve');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.mentorsPending(params),
    queryFn: () =>
      apiFetch<PendingMentor[]>('/admin/mentors/pending', {
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
          ? `/admin/mentors/${id}/approve`
          : type === 'reject'
            ? `/admin/mentors/${id}/reject`
            : `/admin/mentors/${id}/request-more-info`;
      return apiFetch<unknown>(path, {
        method: 'PATCH',
        body: type === 'approve' ? {} : body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
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

  const columns = useMemo<ColumnDef<PendingMentor, unknown>[]>(
    () => [
      {
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.mentor?.user?.name || '—'}
          </span>
        ),
      },
      {
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {maskEmail(row.original.mentor?.user?.email)}
          </span>
        ),
      },
      {
        header: 'Skills',
        cell: ({ row }) => {
          const skills = row.original.mentorSkills ?? [];
          if (skills.length === 0)
            return <span className="text-xs text-slate-400">—</span>;
          const visible = skills.slice(0, 3);
          const remaining = skills.length - visible.length;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {visible.map((s) => (
                <Badge key={s.id} tone="neutral">
                  {s.skill.name}
                </Badge>
              ))}
              {remaining > 0 && <Badge tone="info">+{remaining}</Badge>}
            </div>
          );
        },
      },
      {
        header: 'Years',
        cell: ({ row }) => row.original.yearsExperience ?? '—',
      },
      {
        header: 'Documents',
        cell: ({ row }) => (
          <Badge tone="neutral">
            {row.original.mentor?.documents?.length ?? 0}
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
        <PageHeader title="Pending mentors" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pending mentors"
        description="Review and verify pending mentor applications."
      />

      <Card>
        {error ? (
          <CardBody className="text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending mentors'}
          </CardBody>
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            loading={isLoading}
            pagination={data?.pagination}
            onPageChange={setPage}
            emptyTitle="No pending mentors"
            emptyDescription="There are no mentor applications awaiting review."
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
        title="Approve mentor"
        description="The mentor will be marked as APPROVED and notified."
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
        title="Reject mentor"
        description="Provide a reason — the mentor will be notified."
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
        description="Ask the mentor for additional documentation or clarification."
        confirmLabel="Send request"
        loading={mutation.isPending}
      />
    </div>
  );
}

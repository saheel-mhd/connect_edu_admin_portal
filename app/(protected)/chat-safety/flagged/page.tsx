'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import {
  ModerationStatusBadge,
  RiskBadge,
  RoleBadge,
} from '@/components/badges/StatusBadges';
import { FlaggedTextHighlighter } from '@/components/safety/FlaggedTextHighlighter';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { formatDateTime, truncate } from '@/lib/utils/format';
import type { ModerationStatus, RiskLevel } from '@/types/admin';
import type { UserRole } from '@/types/auth';

interface FlaggedMessage {
  id: string;
  roomId: string;
  text?: string | null;
  content?: string | null;
  sender?: { id: string; name?: string | null; role?: UserRole } | null;
  safetyFlagged?: boolean | null;
  moderationStatus?: ModerationStatus | null;
  createdAt: string;
}

function deriveSeverity(message: FlaggedMessage): RiskLevel {
  if (message.moderationStatus === 'FLAGGED') return 'CRITICAL';
  return 'MEDIUM';
}

export default function FlaggedMessagesPage() {
  const canView = usePermission('chat_safety.view');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });

  const [resolveTarget, setResolveTarget] = useState<FlaggedMessage | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.chatSafety(params),
    queryFn: () =>
      apiFetch<FlaggedMessage[]>('/admin/chat-safety/flagged', {
        searchParams: params,
      }),
    enabled: canView,
  });

  async function handleResolve(reason: string, note?: string) {
    if (!resolveTarget) return;
    setPending(true);
    setError(null);
    try {
      await apiFetch(
        `/admin/chat-safety/messages/${resolveTarget.id}/resolve`,
        {
          method: 'PATCH',
          body: { reason, note },
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['chat-safety'] });
      setResolveTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setPending(false);
    }
  }

  const columns = useMemo<ColumnDef<FlaggedMessage, unknown>[]>(
    () => [
      {
        header: 'Sender',
        cell: ({ row }) => {
          const sender = row.original.sender;
          if (!sender) return <span className="text-slate-400">Unknown</span>;
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">
                {sender.name ?? 'Unknown'}
              </span>
              {sender.role && <RoleBadge role={sender.role} />}
            </div>
          );
        },
      },
      {
        header: 'Room',
        cell: ({ row }) => (
          <Link
            href={`/chat-safety/rooms/${row.original.roomId}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            #{truncate(row.original.roomId, 10)}
          </Link>
        ),
      },
      {
        header: 'Message',
        cell: ({ row }) => {
          const text = row.original.text ?? row.original.content ?? '';
          return (
            <div className="max-w-md whitespace-normal">
              <FlaggedTextHighlighter text={truncate(text, 140)} />
            </div>
          );
        },
      },
      {
        header: 'Severity',
        cell: ({ row }) => <RiskBadge level={deriveSeverity(row.original)} />,
      },
      {
        header: 'Status',
        cell: ({ row }) =>
          row.original.moderationStatus ? (
            <ModerationStatusBadge status={row.original.moderationStatus} />
          ) : (
            <span className="text-slate-400">—</span>
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setResolveTarget(row.original)}
          >
            Resolve
          </Button>
        ),
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Flagged messages"
          description="Messages flagged by automated safety checks or user reports."
        />
        <AccessDeniedState />
      </div>
    );
  }

  const rows = data?.data ?? [];
  const pageMeta = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Flagged messages"
        description="Messages flagged by automated safety checks or user reports."
      />

      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        {isError ? (
          <ErrorState
            description={
              queryError instanceof Error
                ? queryError.message
                : 'Failed to load flagged messages'
            }
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            loading={isLoading}
            pagination={pageMeta}
            onPageChange={setPage}
            emptyTitle="No flagged messages"
            emptyDescription="All clear — there are no flagged messages awaiting review."
          />
        )}
      </Card>

      <ReasonRequiredModal
        open={resolveTarget !== null}
        onClose={() => {
          if (!pending) {
            setResolveTarget(null);
            setError(null);
          }
        }}
        onConfirm={handleResolve}
        title="Resolve flagged message"
        description="Mark this flagged message as resolved. A reason is required for the audit log."
        confirmLabel="Resolve"
        loading={pending}
      />
    </div>
  );
}

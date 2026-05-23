'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { DataTable } from '@/components/tables/DataTable';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime, truncate } from '@/lib/utils/format';

interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

function shortId(id: string | null | undefined, len = 8) {
  if (!id) return '—';
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}

export default function AuditLogsPage() {
  const canView = usePermission('audit_logs.view');
  const { pagination, setPage } = usePagination();

  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [targetType, setTargetType] = useState('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      action: action.trim() || undefined,
      actorId: actorId.trim() || undefined,
      targetType: targetType.trim() || undefined,
      q: debouncedQ.trim() || undefined,
    }),
    [
      pagination.page,
      pagination.limit,
      action,
      actorId,
      targetType,
      debouncedQ,
    ],
  );

  const query = useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () =>
      apiFetch<AuditLog[]>('/admin/audit-logs', {
        searchParams: {
          page: params.page,
          limit: params.limit,
          action: params.action,
          actorId: params.actorId,
          targetType: params.targetType,
          q: params.q,
        },
      }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<AuditLog, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actor',
        header: 'Actor',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700">
            {shortId(row.original.actorId)}
          </span>
        ),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.action || '—'}
          </span>
        ),
      },
      {
        id: 'target',
        header: 'Target',
        cell: ({ row }) => {
          const type = row.original.targetType || '—';
          const id = shortId(row.original.targetId);
          return (
            <span className="font-mono text-xs text-slate-700">
              {type}#{id}
            </span>
          );
        },
      },
      {
        id: 'ip',
        header: 'IP',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700">
            {row.original.ip || '—'}
          </span>
        ),
      },
      {
        id: 'userAgent',
        header: 'User agent',
        cell: ({ row }) => (
          <span
            className="text-xs text-slate-700"
            title={row.original.userAgent || undefined}
          >
            {row.original.userAgent
              ? truncate(row.original.userAgent, 40)
              : '—'}
          </span>
        ),
      },
      {
        id: 'metadata',
        header: 'Metadata',
        cell: ({ row }) => {
          if (!row.original.metadata) {
            return <span className="text-slate-400">—</span>;
          }
          let preview: string;
          try {
            preview = JSON.stringify(row.original.metadata);
          } catch {
            preview = '[unserializable]';
          }
          return (
            <span
              className="font-mono text-xs text-slate-600"
              title={preview}
            >
              {truncate(preview, 60)}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Audit logs" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Every privileged admin action is recorded here for traceability."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label htmlFor="filter-action">Action</Label>
            <Input
              id="filter-action"
              className="mt-1"
              placeholder="e.g. user.suspend"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="filter-actor">Actor ID</Label>
            <Input
              id="filter-actor"
              className="mt-1"
              placeholder="Admin user ID"
              value={actorId}
              onChange={(event) => {
                setActorId(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="filter-target-type">Target type</Label>
            <Input
              id="filter-target-type"
              className="mt-1"
              placeholder="e.g. user, event"
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="filter-q">Search</Label>
            <Input
              id="filter-q"
              className="mt-1"
              placeholder="Free-text search…"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        {query.error ? (
          <ErrorState
            description={
              query.error instanceof Error ? query.error.message : undefined
            }
            onRetry={() => query.refetch()}
          />
        ) : (
          <DataTable<AuditLog>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination}
            onPageChange={setPage}
            emptyTitle="No audit logs match"
            emptyDescription="Adjust the filters or clear them to see recent activity."
          />
        )}
      </Card>
    </div>
  );
}

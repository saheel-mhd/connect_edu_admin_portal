'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime, truncate } from '@/lib/utils/format';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead?: boolean;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    username?: string | null;
    role: string;
  } | null;
}

export default function NotificationsPage() {
  const canSend = usePermission('notifications.send');
  const { pagination, setPage } = usePagination();

  const params = useMemo(
    () => ({ page: pagination.page, limit: pagination.limit }),
    [pagination.page, pagination.limit],
  );

  const query = useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () =>
      apiFetch<AdminNotification[]>('/admin/notifications', {
        searchParams: { page: params.page, limit: params.limit },
      }),
    enabled: canSend,
  });

  const columns = useMemo<ColumnDef<AdminNotification, unknown>[]>(
    () => [
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">
            {row.original.type || '—'}
          </span>
        ),
      },
      {
        id: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="text-slate-900">{row.original.title || '—'}</span>
        ),
      },
      {
        id: 'body',
        header: 'Body',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.body ? truncate(row.original.body, 60) : '—'}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Sent at',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'recipient',
        header: 'Recipient',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-slate-400">—</span>;
          return (
            <Link
              href={`/users/${user.id}`}
              className="text-brand-700 hover:underline"
            >
              {user.name}
              <span className="ml-1 text-xs text-slate-500">({user.role})</span>
            </Link>
          );
        },
      },
      {
        id: 'isRead',
        header: 'Status',
        cell: ({ row }) => (
          <span className="text-xs text-slate-600">
            {row.original.isRead ? 'Read' : 'Unread'}
          </span>
        ),
      },
    ],
    [],
  );

  if (!canSend) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Broadcast announcements and admin notices to platform users."
        actions={
          <Link href="/notifications/create">
            <Button>New notification</Button>
          </Link>
        }
      />

      <Card>
        {query.error ? (
          <ErrorState
            description={
              query.error instanceof Error ? query.error.message : undefined
            }
            onRetry={() => query.refetch()}
          />
        ) : (
          <DataTable<AdminNotification>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination}
            onPageChange={setPage}
            emptyTitle="No notifications sent yet"
            emptyDescription="Use the 'New notification' button to broadcast an announcement."
          />
        )}
      </Card>
    </div>
  );
}

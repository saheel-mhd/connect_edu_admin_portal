'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/tables/DataTable';
import { UserStatusBadge } from '@/components/badges/StatusBadges';
import {
  AccessDeniedState,
  ErrorState,
} from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime } from '@/lib/utils/format';
import type { AdminUser, UserStatus } from '@/types/auth';

interface KidUser extends AdminUser {
  kidProfile?: {
    displayName?: string | null;
    ageGroup?: string | null;
    visibility?: string | null;
    parentApproved?: boolean;
  } | null;
}

const STATUS_OPTIONS: { value: '' | UserStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'DELETED', label: 'Deleted' },
];

export default function KidsPage() {
  const canView = usePermission('kids.view');

  const [status, setStatus] = useState<'' | UserStatus>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const { pagination, setPage } = usePagination();

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      role: 'KID' as const,
      status: status || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, status, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.kids(params),
    queryFn: () =>
      apiFetch<KidUser[]>('/admin/users', {
        searchParams: {
          page: params.page,
          limit: params.limit,
          role: params.role,
          status: params.status,
          q: params.q,
        },
      }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<KidUser, unknown>[]>(
    () => [
      {
        id: 'displayName',
        header: 'Display name',
        cell: ({ row }) => {
          const k = row.original;
          return (
            <span className="font-medium text-slate-900">
              {k.kidProfile?.displayName || k.name || '—'}
            </span>
          );
        },
      },
      {
        id: 'ageGroup',
        header: 'Age group',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.kidProfile?.ageGroup || '—'}
          </span>
        ),
      },
      {
        id: 'parentApproved',
        header: 'Parent approved',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.kidProfile?.parentApproved ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        id: 'visibility',
        header: 'Visibility',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.kidProfile?.visibility || '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
      {
        id: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Link
            href={`/users/${row.original.id}`}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            View
          </Link>
        ),
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Kids" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Kids"
        description="Child accounts — sensitive contact details are masked by default."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              className="mt-1"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | UserStatus);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="filter-q">Search</Label>
            <Input
              id="filter-q"
              className="mt-1"
              placeholder="Search by display name or username…"
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
          <DataTable<KidUser>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination}
            onPageChange={setPage}
            emptyTitle="No kids found"
            emptyDescription="Try changing the status or search filters."
          />
        )}
      </Card>
    </div>
  );
}

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
import { PermissionGate } from '@/components/shared/PermissionGate';
import {
  AccessDeniedState,
  ErrorState,
} from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { AdminUser, UserStatus } from '@/types/auth';

const STATUS_OPTIONS: { value: '' | UserStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'DELETED', label: 'Deleted' },
];

export default function ParentsPage() {
  const canView = usePermission('parents.view');

  const [status, setStatus] = useState<'' | UserStatus>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const { pagination, setPage } = usePagination();

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      role: 'PARENT' as const,
      status: status || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, status, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.parents(params),
    queryFn: () =>
      apiFetch<AdminUser[]>('/admin/users', {
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

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.name || '—'}
          </span>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {maskEmail(row.original.email)}
          </span>
        ),
      },
      {
        id: 'country',
        header: 'Country',
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.country || '—'}</span>
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
            href={`/parents/${row.original.id}`}
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
        <PageHeader title="Parents" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <PermissionGate
      permission="parents.view"
      fallback={
        <div>
          <PageHeader title="Parents" />
          <AccessDeniedState />
        </div>
      }
    >
      <div>
        <PageHeader
          title="Parents"
          description="Parent accounts and their linked children."
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
                placeholder="Search by name, email or username…"
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
            <DataTable<AdminUser>
              data={query.data?.data ?? []}
              columns={columns}
              loading={query.isLoading}
              pagination={query.data?.pagination}
              onPageChange={setPage}
              emptyTitle="No parents found"
              emptyDescription="Try changing the status or search filters."
            />
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}

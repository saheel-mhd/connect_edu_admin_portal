'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { DataTable } from '@/components/tables/DataTable';
import {
  RoleBadge,
  UserStatusBadge,
} from '@/components/badges/StatusBadges';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { AdminUser } from '@/types/auth';

interface AdminAccount extends AdminUser {
  mfaEnabled?: boolean;
}

export default function AdminsPage() {
  const canManage = usePermission('admins.manage');
  const queryClient = useQueryClient();

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const { pagination, setPage } = usePagination();

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.admins(params),
    queryFn: () =>
      apiFetch<AdminAccount[]>('/admin/admins', {
        searchParams: {
          page: params.page,
          limit: params.limit,
          q: params.q,
        },
      }),
    enabled: canManage,
  });

  const [forceLogoutTarget, setForceLogoutTarget] =
    useState<AdminAccount | null>(null);
  const [resetMfaTarget, setResetMfaTarget] = useState<AdminAccount | null>(
    null,
  );

  const forceLogoutMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ id: string }>(`/admin/admins/${id}/force-logout`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setForceLogoutTarget(null);
    },
  });

  const resetMfaMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ id: string }>(`/admin/admins/${id}/reset-mfa`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setResetMfaTarget(null);
    },
  });

  const columns = useMemo<ColumnDef<AdminAccount, unknown>[]>(
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
          <span className="text-slate-700">{maskEmail(row.original.email)}</span>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
      {
        id: 'mfa',
        header: 'MFA',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.mfaEnabled ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        id: 'lastLoginAt',
        header: 'Last login',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDateTime(row.original.lastLoginAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admins/${a.id}`}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                View
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setForceLogoutTarget(a)}
              >
                Force logout
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setResetMfaTarget(a)}
              >
                Reset MFA
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Admins" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Manage admin accounts, roles, MFA and sessions."
        actions={
          <Link href="/admins/create">
            <Button>Create admin</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label htmlFor="filter-q">Search</Label>
            <Input
              id="filter-q"
              className="mt-1"
              placeholder="Search by name or email…"
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
          <DataTable<AdminAccount>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination}
            onPageChange={setPage}
            emptyTitle="No admins found"
            emptyDescription="Use 'Create admin' to add a new account."
          />
        )}
      </Card>

      <ConfirmActionModal
        open={!!forceLogoutTarget}
        onClose={() => setForceLogoutTarget(null)}
        onConfirm={() => {
          if (forceLogoutTarget)
            forceLogoutMutation.mutate(forceLogoutTarget.id);
        }}
        title="Force logout admin"
        description={
          forceLogoutTarget
            ? `This will immediately invalidate all sessions for ${
                forceLogoutTarget.name || maskEmail(forceLogoutTarget.email)
              }.`
            : undefined
        }
        confirmLabel="Force logout"
        destructive
        loading={forceLogoutMutation.isPending}
      />

      <ConfirmActionModal
        open={!!resetMfaTarget}
        onClose={() => setResetMfaTarget(null)}
        onConfirm={() => {
          if (resetMfaTarget) resetMfaMutation.mutate(resetMfaTarget.id);
        }}
        title="Reset MFA for admin"
        description={
          resetMfaTarget
            ? `This will remove the MFA enrollment for ${
                resetMfaTarget.name || maskEmail(resetMfaTarget.email)
              }. They will be prompted to re-enroll on next login.`
            : undefined
        }
        confirmLabel="Reset MFA"
        destructive
        loading={resetMfaMutation.isPending}
      />
    </div>
  );
}

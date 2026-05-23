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
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/tables/DataTable';
import {
  RoleBadge,
  UserStatusBadge,
} from '@/components/badges/StatusBadges';
import { PermissionGate } from '@/components/shared/PermissionGate';
import {
  AccessDeniedState,
  ErrorState,
} from '@/components/shared/states';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { Modal } from '@/components/ui/Modal';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { AdminUser, UserRole, UserStatus } from '@/types/auth';

const ROLE_OPTIONS: { value: '' | UserRole; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'KID', label: 'Kid' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'ORGANIZATION', label: 'Organization' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
];

const STATUS_OPTIONS: { value: '' | UserStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'DELETED', label: 'Deleted' },
];

const NEW_STATUS_OPTIONS: UserStatus[] = [
  'ACTIVE',
  'SUSPENDED',
  'BANNED',
  'PENDING',
  'DELETED',
];

export default function UsersPage() {
  const canView = usePermission('users.view');
  const queryClient = useQueryClient();

  const [role, setRole] = useState<'' | UserRole>('');
  const [status, setStatus] = useState<'' | UserStatus>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const { pagination, setPage } = usePagination();

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      role: role || undefined,
      status: status || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, role, status, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.users(params),
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

  // ---- Modals state ----
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>('ACTIVE');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { status: UserStatus; reason: string };
    }) =>
      apiFetch<AdminUser>(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setStatusTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ id: string }>(`/admin/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">
                {u.name || '—'}
              </span>
              <span className="text-xs text-slate-500">
                {maskEmail(u.email)}
              </span>
            </div>
          );
        },
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
        id: 'country',
        header: 'Country',
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.country || '—'}</span>
        ),
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
          const u = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${u.id}`}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                View
              </Link>
              <PermissionGate permission="users.update_status">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setStatusTarget(u);
                    setNewStatus(u.status);
                  }}
                >
                  Update status
                </Button>
              </PermissionGate>
              <PermissionGate permission="users.suspend">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteTarget(u)}
                >
                  Delete
                </Button>
              </PermissionGate>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Users" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="All accounts on the platform — kids, parents, mentors, organizations and admins."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label htmlFor="filter-role">Role</Label>
            <Select
              id="filter-role"
              className="mt-1"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as '' | UserRole);
                setPage(1);
              }}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
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
              placeholder="Search by name, email, username…"
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
            emptyTitle="No users found"
            emptyDescription="Try changing the role, status or search filters."
          />
        )}
      </Card>

      {/* Update status modal */}
      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title="Update user status"
        description={
          statusTarget
            ? `Change status for ${statusTarget.name || maskEmail(statusTarget.email)}.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="new-status">New status</Label>
            <Select
              id="new-status"
              className="mt-1"
              value={newStatus}
              onChange={(event) =>
                setNewStatus(event.target.value as UserStatus)
              }
            >
              {NEW_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <ReasonRequiredModalInline
            onCancel={() => setStatusTarget(null)}
            onConfirm={(reason) => {
              if (!statusTarget) return;
              statusMutation.mutate({
                id: statusTarget.id,
                body: { status: newStatus, reason },
              });
            }}
            loading={statusMutation.isPending}
            error={
              statusMutation.error instanceof Error
                ? statusMutation.error.message
                : null
            }
          />
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <ConfirmActionModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete user (soft)"
        description={
          deleteTarget
            ? `This will soft-delete ${
                deleteTarget.name || maskEmail(deleteTarget.email)
              }. The action is reversible by a super-admin.`
            : undefined
        }
        confirmLabel="Delete user"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

/**
 * Inline reason input + confirm/cancel — used inside the "Update status" Modal
 * so the status Select and reason live in the same dialog body.
 */
function ReasonRequiredModalInline({
  onCancel,
  onConfirm,
  loading,
  error,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = touched && reason.trim().length < 3;
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="status-reason">Reason</Label>
        <textarea
          id="status-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required — explain why this status change is being made."
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {invalid && (
          <p className="mt-1 text-xs text-red-600">
            Please provide a clear reason (at least 3 characters).
          </p>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This action will be recorded in the audit log.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setTouched(true);
            if (reason.trim().length < 3) return;
            onConfirm(reason.trim());
          }}
          loading={loading}
        >
          Update status
        </Button>
      </div>
    </div>
  );
}

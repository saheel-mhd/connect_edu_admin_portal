'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { VerificationStatusBadge } from '@/components/badges/StatusBadges';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime } from '@/lib/utils/format';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { hasPermission } from '@/lib/auth/permissions';
import type { PaginationMeta } from '@/types/api';
import type { VerificationStatus } from '@/types/admin';

interface AdminOpportunityRow {
  id: string;
  title: string;
  opportunityType?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  createdAt?: string | null;
  approvalStatus: VerificationStatus;
  organizationProfile?: {
    id: string;
    organizationName?: string | null;
  } | null;
}

const APPROVAL_OPTIONS: Array<{ value: '' | VerificationStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NEEDS_MORE_INFO', label: 'Needs more info' },
];

export default function OpportunitiesPage() {
  const { admin } = useCurrentAdmin();
  const canView = admin ? hasPermission(admin.role, 'opportunities.view') : false;

  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [approvalStatus, setApprovalStatus] = useState<'' | VerificationStatus>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      approvalStatus: approvalStatus || undefined,
      q: debouncedSearch || undefined,
    }),
    [pagination.page, pagination.limit, approvalStatus, debouncedSearch],
  );

  const query = useQuery({
    queryKey: queryKeys.opportunities(params),
    queryFn: () =>
      apiFetch<AdminOpportunityRow[]>('/admin/opportunities', {
        searchParams: {
          page: params.page,
          limit: params.limit,
          approvalStatus: params.approvalStatus,
          q: params.q,
        },
      }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<AdminOpportunityRow, unknown>[]>(
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
        header: 'Approval',
        cell: ({ row }) => (
          <VerificationStatusBadge status={row.original.approvalStatus} />
        ),
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
          <Link
            href={`/opportunities/${row.original.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            <Eye className="h-4 w-4" /> View
          </Link>
        ),
      },
    ],
    [],
  );

  if (admin && !canView) {
    return (
      <div>
        <PageHeader title="Opportunities" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <PermissionGate
      permission="opportunities.view"
      fallback={<AccessDeniedState />}
    >
      <div>
        <PageHeader
          title="Opportunities"
          description="All opportunities submitted by organizations."
        />

        <Card className="mb-4">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities…"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="approvalStatus">Approval status</Label>
              <Select
                id="approvalStatus"
                value={approvalStatus}
                onChange={(e) =>
                  setApprovalStatus(e.target.value as '' | VerificationStatus)
                }
                className="mt-1"
              >
                {APPROVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Card>
          {query.isError ? (
            <ErrorState
              description={
                query.error instanceof Error
                  ? query.error.message
                  : 'Failed to load opportunities.'
              }
              onRetry={() => query.refetch()}
            />
          ) : (
            <DataTable<AdminOpportunityRow>
              data={query.data?.data ?? []}
              columns={columns}
              loading={query.isLoading}
              pagination={query.data?.pagination as PaginationMeta | undefined}
              onPageChange={setPage}
              emptyTitle="No opportunities found"
              emptyDescription="Try adjusting your filters."
            />
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}

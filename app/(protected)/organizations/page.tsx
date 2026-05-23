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
import { VerificationStatusBadge } from '@/components/badges/StatusBadges';
import { AccessDeniedState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { VerificationStatus } from '@/types/admin';

interface OrganizationRow {
  id: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  organizationProfile?: {
    organizationName?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    website?: string | null;
  } | null;
}

type VerificationFilter = '' | VerificationStatus;

export default function OrganizationsListPage() {
  const canView = usePermission('organizations.view');
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationFilter>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      verificationStatus: verificationStatus || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, verificationStatus, debouncedQ],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.organizations(params),
    queryFn: () =>
      apiFetch<OrganizationRow[]>('/admin/organizations', {
        searchParams: params,
      }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<OrganizationRow, unknown>[]>(
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
        header: 'Verification',
        cell: ({ row }) => (
          <VerificationStatusBadge status={row.original.verificationStatus} />
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
          <Link
            href={`/organizations/${row.original.id}`}
            className="text-sm font-medium text-brand-600 hover:underline"
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
        <PageHeader title="Organizations" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Review organization profiles and verification status."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="verificationStatus">Verification</Label>
            <Select
              id="verificationStatus"
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(e.target.value as VerificationFilter)
              }
              className="mt-1"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_MORE_INFO">Needs more info</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        {error ? (
          <CardBody className="text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : 'Failed to load organizations'}
          </CardBody>
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            loading={isLoading}
            pagination={data?.pagination}
            onPageChange={setPage}
            emptyTitle="No organizations"
            emptyDescription="No organizations match the current filters."
          />
        )}
      </Card>
    </div>
  );
}

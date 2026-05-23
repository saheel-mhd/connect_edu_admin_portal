'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import {
  ReportStatusBadge,
  RoleBadge,
} from '@/components/badges/StatusBadges';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDateTime, truncate } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { ReportStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';

type TargetType =
  | 'user'
  | 'post'
  | 'comment'
  | 'message'
  | 'event'
  | 'opportunity'
  | 'organization'
  | 'mentor';

interface ReportRow {
  id: string;
  reportedBy?: { id: string; name: string; role: UserRole } | null;
  targetType: TargetType | string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
}

const STATUS_OPTIONS: { value: '' | ReportStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const TARGET_TYPE_OPTIONS: { value: '' | TargetType; label: string }[] = [
  { value: '', label: 'All target types' },
  { value: 'user', label: 'User' },
  { value: 'post', label: 'Post' },
  { value: 'comment', label: 'Comment' },
  { value: 'message', label: 'Message' },
  { value: 'event', label: 'Event' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'organization', label: 'Organization' },
  { value: 'mentor', label: 'Mentor' },
];

export default function ReportsPage() {
  const canView = usePermission('reports.view');
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [status, setStatus] = useState<'' | ReportStatus>('');
  const [targetType, setTargetType] = useState<'' | TargetType>('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 300);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status: status || undefined,
      targetType: targetType || undefined,
      q: q || undefined,
    }),
    [pagination.page, pagination.limit, status, targetType, q],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () =>
      apiFetch<ReportRow[]>('/admin/reports', { searchParams: params }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<ReportRow, unknown>[]>(
    () => [
      {
        header: 'Reporter',
        cell: ({ row }) => {
          const reporter = row.original.reportedBy;
          if (!reporter) return <span className="text-slate-400">Unknown</span>;
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">
                {reporter.name}
              </span>
              <RoleBadge role={reporter.role} />
            </div>
          );
        },
      },
      {
        header: 'Target',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.targetType} #{truncate(row.original.targetId, 8)}
          </span>
        ),
      },
      {
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {truncate(row.original.reason ?? '', 40)}
          </span>
        ),
      },
      {
        header: 'Status',
        cell: ({ row }) => <ReportStatusBadge status={row.original.status} />,
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
            href={`/reports/${row.original.id}`}
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
        <PageHeader
          title="Reports"
          description="User-submitted reports requiring review."
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
        title="Reports"
        description="User-submitted reports requiring review."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label htmlFor="report-status">Status</Label>
            <Select
              id="report-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as '' | ReportStatus)
              }
              className="mt-1"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="report-target">Target type</Label>
            <Select
              id="report-target"
              value={targetType}
              onChange={(event) =>
                setTargetType(event.target.value as '' | TargetType)
              }
              className="mt-1"
            >
              {TARGET_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="report-search">Search</Label>
            <Input
              id="report-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reason, reporter or target id…"
              className="mt-1"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        {isError ? (
          <ErrorState
            description={
              error instanceof Error ? error.message : 'Failed to load reports'
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
            emptyTitle="No reports"
            emptyDescription="No reports match the current filters."
          />
        )}
      </Card>
    </div>
  );
}

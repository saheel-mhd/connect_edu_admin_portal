'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/tables/DataTable';
import {
  ModerationStatusBadge,
  RoleBadge,
} from '@/components/badges/StatusBadges';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, truncate } from '@/lib/utils/format';
import type { PaginationMeta } from '@/types/api';
import type { ModerationStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';

type PostType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'PROJECT'
  | 'ACHIEVEMENT'
  | 'EVENT'
  | 'OPPORTUNITY'
  | 'REPOST';

interface AdminPostRow {
  id: string;
  type: PostType;
  caption?: string | null;
  moderationStatus: ModerationStatus;
  safetyScore: number;
  createdAt: string;
  reports?: Array<{ id: string }> | null;
  author?: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
}

const MODERATION_OPTIONS: Array<{ value: '' | ModerationStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'HIDDEN', label: 'Hidden' },
];

const TYPE_OPTIONS: Array<{ value: '' | PostType; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
  { value: 'REPOST', label: 'Repost' },
];

export default function PostsListPage() {
  const canView = usePermission('posts.view');
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [moderationStatus, setModerationStatus] = useState<'' | ModerationStatus>(
    '',
  );
  const [type, setType] = useState<'' | PostType>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      moderationStatus: moderationStatus || undefined,
      type: type || undefined,
      q: debouncedQ || undefined,
    }),
    [pagination.page, pagination.limit, moderationStatus, type, debouncedQ],
  );

  const query = useQuery({
    queryKey: queryKeys.posts(params),
    queryFn: () =>
      apiFetch<AdminPostRow[]>('/admin/posts', { searchParams: params }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<AdminPostRow, unknown>[]>(
    () => [
      {
        header: 'Author',
        cell: ({ row }) => {
          const author = row.original.author;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-slate-900">
                {author?.name ?? '—'}
              </span>
              {author?.role && <RoleBadge role={author.role} />}
            </div>
          );
        },
      },
      {
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.type}</span>
        ),
      },
      {
        header: 'Caption',
        cell: ({ row }) => {
          const caption = row.original.caption;
          if (!caption) return <span className="text-slate-400">—</span>;
          return (
            <span className="text-slate-700">{truncate(caption, 40)}</span>
          );
        },
      },
      {
        header: 'Moderation',
        cell: ({ row }) => (
          <ModerationStatusBadge status={row.original.moderationStatus} />
        ),
      },
      {
        header: 'Reports',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.reports?.length ?? 0}
          </span>
        ),
      },
      {
        header: 'Safety score',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.safetyScore.toFixed(2)}
          </span>
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
            href={`/posts/${row.original.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            <Eye className="h-4 w-4" /> View
          </Link>
        ),
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Posts" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Posts"
        description="All posts submitted to the platform."
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Search posts by caption or author"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="moderationStatus">Moderation</Label>
            <Select
              id="moderationStatus"
              value={moderationStatus}
              onChange={(event) =>
                setModerationStatus(
                  event.target.value as '' | ModerationStatus,
                )
              }
              className="mt-1"
            >
              {MODERATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as '' | PostType)
              }
              className="mt-1"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        {query.isError ? (
          <ErrorState
            description={
              query.error instanceof Error
                ? query.error.message
                : 'Failed to load posts.'
            }
            onRetry={() => query.refetch()}
          />
        ) : (
          <DataTable<AdminPostRow>
            data={query.data?.data ?? []}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination as PaginationMeta | undefined}
            onPageChange={setPage}
            emptyTitle="No posts found"
            emptyDescription="Try adjusting your filters."
          />
        )}
      </Card>
    </div>
  );
}

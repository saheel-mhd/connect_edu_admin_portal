'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDateTime } from '@/lib/utils/format';

type AssignmentStatus = 'ACTIVE' | 'PENDING' | 'ENDED' | 'CANCELLED';

interface AssignmentRow {
  id: string;
  status: AssignmentStatus | string;
  parentApproved?: boolean | null;
  createdAt: string;
  mentorProfile?: {
    id: string;
    user?: { id: string; name: string } | null;
  } | null;
  kidProfile?: { id: string; displayName: string } | null;
  skill?: { id: string; name: string } | null;
}

const STATUS_OPTIONS: { value: '' | AssignmentStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ENDED', label: 'Ended' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'pending';
  if (status === 'ENDED') return 'neutral';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export default function MentorAssignmentsPage() {
  const canManage = usePermission('mentor_assignments.create');
  const queryClient = useQueryClient();
  const { pagination, setPage } = usePagination({ page: 1, limit: 20 });
  const [status, setStatus] = useState<'' | AssignmentStatus>('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 300);

  const [endTarget, setEndTarget] = useState<AssignmentRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status: status || undefined,
      q: q || undefined,
    }),
    [pagination.page, pagination.limit, status, q],
  );

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.mentorAssignments(params),
    queryFn: () =>
      apiFetch<AssignmentRow[]>('/admin/mentor-assignments', {
        searchParams: params,
      }),
    enabled: canManage,
  });

  async function handleEnd() {
    if (!endTarget) return;
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/admin/mentor-assignments/${endTarget.id}/status`, {
        method: 'PATCH',
        body: { status: 'ENDED' },
      });
      await queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      setEndTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end assignment');
    } finally {
      setPending(false);
    }
  }

  const columns = useMemo<ColumnDef<AssignmentRow, unknown>[]>(
    () => [
      {
        header: 'Mentor',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.mentorProfile?.user?.name ?? '—'}
          </span>
        ),
      },
      {
        header: 'Kid',
        cell: ({ row }) => (
          <span className="text-slate-800">
            {row.original.kidProfile?.displayName ?? '—'}
          </span>
        ),
      },
      {
        header: 'Skill',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.skill?.name ?? '—'}
          </span>
        ),
      },
      {
        header: 'Parent approved',
        cell: ({ row }) =>
          row.original.parentApproved ? (
            <Badge tone="success">Yes</Badge>
          ) : (
            <Badge tone="warning">No</Badge>
          ),
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={statusTone(row.original.status) as never}>
            {row.original.status}
          </Badge>
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
          <div className="flex items-center gap-2">
            <Link
              href={`/mentor-assignments/${row.original.id}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View
            </Link>
            {row.original.status !== 'ENDED' &&
              row.original.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEndTarget(row.original)}
                >
                  End assignment
                </Button>
              )}
          </div>
        ),
      },
    ],
    [],
  );

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="Mentor assignments"
          description="Manage mentor-to-kid assignments."
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
        title="Mentor assignments"
        description="Manage mentor-to-kid assignments."
        actions={
          <Link href="/mentor-assignments/create">
            <Button>
              <Plus className="h-4 w-4" /> Create assignment
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="assignment-status">Status</Label>
            <Select
              id="assignment-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as '' | AssignmentStatus)
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
          <div className="md:col-span-2">
            <Label htmlFor="assignment-search">Search</Label>
            <Input
              id="assignment-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by mentor, kid or skill…"
              className="mt-1"
            />
          </div>
        </CardBody>
      </Card>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        {isError ? (
          <ErrorState
            description={
              queryError instanceof Error
                ? queryError.message
                : 'Failed to load mentor assignments'
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
            emptyTitle="No mentor assignments"
            emptyDescription="No assignments match the current filters."
          />
        )}
      </Card>

      <ConfirmActionModal
        open={endTarget !== null}
        onClose={() => {
          if (!pending) {
            setEndTarget(null);
            setError(null);
          }
        }}
        onConfirm={handleEnd}
        title="End mentor assignment"
        description="This will end the assignment and prevent further mentoring activity between this pair."
        confirmLabel="End assignment"
        destructive
        loading={pending}
      />
    </div>
  );
}

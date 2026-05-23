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
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { VerificationStatusBadge } from '@/components/badges/StatusBadges';
import { AccessDeniedState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { VerificationStatus } from '@/types/admin';

interface MentorSkillItem {
  id: string;
  skill: { id: string; name: string };
  isVerified?: boolean;
}

interface MentorRow {
  id: string;
  yearsExperience?: number | null;
  rating?: number | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  mentor: {
    user: {
      id: string;
      name: string;
      email?: string | null;
    };
  };
  mentorSkills?: MentorSkillItem[];
}

type VerificationFilter = '' | VerificationStatus;

export default function MentorsListPage() {
  const canView = usePermission('mentors.view');
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
    queryKey: queryKeys.mentors(params),
    queryFn: () =>
      apiFetch<MentorRow[]>('/admin/mentors', { searchParams: params }),
    enabled: canView,
  });

  const columns = useMemo<ColumnDef<MentorRow, unknown>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'mentor.user.name',
        cell: ({ row }) => {
          const user = row.original.mentor?.user;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">
                {user?.name || '—'}
              </span>
              <span className="text-xs text-slate-500">
                {maskEmail(user?.email)}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Skills',
        cell: ({ row }) => {
          const skills = row.original.mentorSkills ?? [];
          if (skills.length === 0)
            return <span className="text-xs text-slate-400">—</span>;
          const visible = skills.slice(0, 3);
          const remaining = skills.length - visible.length;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {visible.map((s) => (
                <Badge key={s.id} tone="neutral">
                  {s.skill.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge tone="info">+{remaining}</Badge>
              )}
            </div>
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
        header: 'Years',
        cell: ({ row }) => row.original.yearsExperience ?? '—',
      },
      {
        header: 'Rating',
        cell: ({ row }) =>
          row.original.rating != null ? row.original.rating.toFixed(1) : '—',
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
            href={`/mentors/${row.original.id}`}
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
        <PageHeader title="Mentors" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mentors"
        description="Review mentor profiles and verification status."
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
              : 'Failed to load mentors'}
          </CardBody>
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            loading={isLoading}
            pagination={data?.pagination}
            onPageChange={setPage}
            emptyTitle="No mentors"
            emptyDescription="No mentors match the current filters."
          />
        )}
      </Card>
    </div>
  );
}

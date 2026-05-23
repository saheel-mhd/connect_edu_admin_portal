'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { AccessDeniedState, ErrorState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { useDebounce } from '@/hooks/use-debounce';
import { usePagination } from '@/hooks/use-pagination';
import { usePermission } from '@/hooks/use-permission';
import { formatDate } from '@/lib/utils/format';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentSkillId?: string | null;
  parentSkill?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface SkillFormState {
  name: string;
  description: string;
  parentSkillId: string;
}

const EMPTY_FORM: SkillFormState = {
  name: '',
  description: '',
  parentSkillId: '',
};

export default function SkillsPage() {
  const canManage = usePermission('skills.manage');
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
    queryKey: queryKeys.skills(params),
    queryFn: () =>
      apiFetch<Skill[]>('/admin/skills', {
        searchParams: {
          page: params.page,
          limit: params.limit,
          q: params.q,
        },
      }),
    enabled: canManage,
  });

  // ---- Modal state ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Skill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreateOpen(true);
  }

  function openEdit(skill: Skill) {
    setForm({
      name: skill.name ?? '',
      description: skill.description ?? '',
      parentSkillId: skill.parentSkillId ?? '',
    });
    setFormError(null);
    setEditTarget(skill);
  }

  function closeModals() {
    setCreateOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      parentSkillId?: string;
    }) =>
      apiFetch<Skill>('/admin/skills', {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      closeModals();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Failed to create skill'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: {
        name?: string;
        description?: string;
        parentSkillId?: string | null;
      };
    }) =>
      apiFetch<Skill>(`/admin/skills/${id}`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      closeModals();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Failed to update skill'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ id: string }>(`/admin/skills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setDeleteTarget(null);
    },
  });

  const allSkills = query.data?.data ?? [];

  const columns = useMemo<ColumnDef<Skill, unknown>[]>(
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
        id: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.slug || '—'}</span>
        ),
      },
      {
        id: 'parent',
        header: 'Parent skill',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.parentSkill?.name ?? '—'}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-slate-700">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleteTarget(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Skills" />
        <AccessDeniedState />
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    const body: {
      name: string;
      description?: string;
      parentSkillId?: string | null;
    } = {
      name: form.name.trim(),
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.parentSkillId) body.parentSkillId = form.parentSkillId;

    if (editTarget) {
      // When editing, allow clearing parent by sending null.
      const updateBody: typeof body = { ...body };
      if (!form.parentSkillId) updateBody.parentSkillId = null;
      updateMutation.mutate({ id: editTarget.id, body: updateBody });
    } else {
      const createBody: {
        name: string;
        description?: string;
        parentSkillId?: string;
      } = { name: body.name };
      if (body.description) createBody.description = body.description;
      if (form.parentSkillId) createBody.parentSkillId = form.parentSkillId;
      createMutation.mutate(createBody);
    }
  }

  const formOpen = createOpen || !!editTarget;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Skills"
        description="Manage the platform's skill taxonomy used for mentors, kids and events."
        actions={
          <Button onClick={openCreate}>
            Create skill
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label htmlFor="filter-q">Search</Label>
            <Input
              id="filter-q"
              className="mt-1"
              placeholder="Search by name or slug…"
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
          <DataTable<Skill>
            data={allSkills}
            columns={columns}
            loading={query.isLoading}
            pagination={query.data?.pagination}
            onPageChange={setPage}
            emptyTitle="No skills found"
            emptyDescription="Try adjusting your search or create a new skill."
          />
        )}
      </Card>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          if (!isSubmitting) closeModals();
        }}
        title={editTarget ? 'Edit skill' : 'Create skill'}
        description={
          editTarget
            ? 'Update the skill details below.'
            : 'Add a new skill to the taxonomy.'
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              className="mt-1"
              required
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              className="mt-1"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="skill-parent">Parent skill (optional)</Label>
            <Select
              id="skill-parent"
              className="mt-1"
              value={form.parentSkillId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  parentSkillId: event.target.value,
                }))
              }
            >
              <option value="">No parent</option>
              {allSkills
                .filter((s) => !editTarget || s.id !== editTarget.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </div>
          {formError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModals}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editTarget ? 'Save changes' : 'Create skill'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmActionModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete skill"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This may impact mentors, kids and events tagged with this skill.`
            : undefined
        }
        confirmLabel="Delete skill"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

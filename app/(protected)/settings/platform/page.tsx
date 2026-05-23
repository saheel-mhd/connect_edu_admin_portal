'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState, LoadingState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { usePermission } from '@/hooks/use-permission';

type Primitive = string | number | boolean | null | undefined;

interface SettingsData {
  platform?: Record<string, Primitive>;
  [key: string]: unknown;
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default function PlatformSettingsPage() {
  const canManage = usePermission('settings.manage');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsData>('/admin/settings'),
    enabled: canManage,
  });

  const platform = useMemo(
    () => (query.data?.data ?? {}) as Record<string, Primitive>,
    [query.data],
  );

  const [values, setValues] = useState<Record<string, Primitive>>({});
  const [reasonOpen, setReasonOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data?.data) {
      setValues({ ...platform });
    }
  }, [query.data, platform]);

  const mutation = useMutation({
    mutationFn: async (body: {
      values: Record<string, unknown>;
      reason: string;
    }) =>
      apiFetch<SettingsData>('/admin/settings', {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      setSuccess('Platform settings updated.');
      setError(null);
      setReasonOpen(false);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update');
      setSuccess(null);
    },
  });

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Platform settings" />
        <AccessDeniedState />
      </div>
    );
  }

  const entries = Object.entries(values);

  function handleChange(key: string, value: Primitive) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to settings
        </Link>
      </div>

      <PageHeader
        title="Platform settings"
        description="General platform configuration. A reason is required to save changes."
      />

      {success && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardBody className="text-sm text-emerald-900">{success}</CardBody>
        </Card>
      )}

      {query.isLoading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-slate-500">
            No platform settings returned by the backend.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                setSuccess(null);
                setReasonOpen(true);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {entries.map(([key, value]) => {
                  const id = `setting-${key}`;
                  const label = humanize(key);

                  if (typeof value === 'boolean') {
                    return (
                      <label
                        key={key}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          id={id}
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          checked={value}
                          onChange={(event) =>
                            handleChange(key, event.target.checked)
                          }
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {label}
                        </span>
                      </label>
                    );
                  }

                  if (typeof value === 'number') {
                    return (
                      <div key={key}>
                        <Label htmlFor={id}>{label}</Label>
                        <Input
                          id={id}
                          type="number"
                          className="mt-1"
                          value={String(value ?? '')}
                          onChange={(event) => {
                            const n = event.target.value;
                            handleChange(
                              key,
                              n === '' ? null : Number(n),
                            );
                          }}
                        />
                      </div>
                    );
                  }

                  // Detect choice-like fields if value is a known short string.
                  const stringValue = value == null ? '' : String(value);

                  return (
                    <div key={key}>
                      <Label htmlFor={id}>{label}</Label>
                      <Input
                        id={id}
                        className="mt-1"
                        value={stringValue}
                        onChange={(event) =>
                          handleChange(key, event.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <ReasonRequiredModal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        onConfirm={(reason) => mutation.mutate({ values, reason })}
        title="Confirm platform setting changes"
        description="Provide a reason for changing platform settings."
        confirmLabel="Save changes"
        loading={mutation.isPending}
      />
    </div>
  );
}

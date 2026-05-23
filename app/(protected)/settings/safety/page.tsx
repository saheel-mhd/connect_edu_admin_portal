'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { AccessDeniedState, LoadingState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { usePermission } from '@/hooks/use-permission';

type SafetyKey =
  | 'requirePostModerationForKids'
  | 'requireEventApproval'
  | 'requireOrganizationVerification'
  | 'requireMentorVerification'
  | 'disableKidToKidChat'
  | 'disableKidToOrganizationChat'
  | 'requireParentApprovalForEvents'
  | 'requireParentApprovalForMentorAssignment';

type SafetyValues = Record<SafetyKey, boolean>;

const FIELDS: Array<{ key: SafetyKey; label: string; description: string }> = [
  {
    key: 'requirePostModerationForKids',
    label: 'Require post moderation for kids',
    description:
      'Posts authored by kid accounts must be approved before publishing.',
  },
  {
    key: 'requireEventApproval',
    label: 'Require event approval',
    description: 'Events must be approved by an admin before being published.',
  },
  {
    key: 'requireOrganizationVerification',
    label: 'Require organization verification',
    description: 'Organizations must be verified before posting events.',
  },
  {
    key: 'requireMentorVerification',
    label: 'Require mentor verification',
    description:
      'Mentors must be verified before being matched with kids.',
  },
  {
    key: 'disableKidToKidChat',
    label: 'Disable kid-to-kid chat',
    description: 'Block direct messaging between kid accounts platform-wide.',
  },
  {
    key: 'disableKidToOrganizationChat',
    label: 'Disable kid-to-organization chat',
    description: 'Block direct messaging between kid and organization accounts.',
  },
  {
    key: 'requireParentApprovalForEvents',
    label: 'Require parent approval for events',
    description: 'Kids cannot register for events without parent approval.',
  },
  {
    key: 'requireParentApprovalForMentorAssignment',
    label: 'Require parent approval for mentor assignment',
    description:
      'Mentor assignments require explicit parent approval before being active.',
  },
];

const DEFAULT_VALUES: SafetyValues = FIELDS.reduce((acc, f) => {
  acc[f.key] = false;
  return acc;
}, {} as SafetyValues);

export default function SafetySettingsPage() {
  const canManage = usePermission('settings.manage');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['settings', 'safety'],
    queryFn: () => apiFetch<SafetyValues>('/admin/settings/safety'),
    enabled: canManage,
  });

  const [values, setValues] = useState<SafetyValues>(DEFAULT_VALUES);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data?.data) {
      const incoming = query.data.data;
      setValues((prev) => {
        const next = { ...prev };
        for (const field of FIELDS) {
          const v = (incoming as Record<string, unknown>)[field.key];
          if (typeof v === 'boolean') next[field.key] = v;
        }
        return next;
      });
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async (body: { values: SafetyValues; reason: string }) =>
      apiFetch<SafetyValues>('/admin/settings/safety', {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      setSuccess('Safety settings updated.');
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
        <PageHeader title="Safety settings" />
        <AccessDeniedState />
      </div>
    );
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
        title="Safety settings"
        description="Toggles that enforce platform-wide child safety rules."
      />

      <Card className="mb-4 border-red-200 bg-red-50">
        <CardBody className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-900">
            <span className="font-medium">
              Changing safety settings affects every child on the platform.
            </span>{' '}
            Review carefully — a reason is required to save.
          </p>
        </CardBody>
      </Card>

      {success && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardBody className="text-sm text-emerald-900">{success}</CardBody>
        </Card>
      )}

      {query.isLoading ? (
        <LoadingState />
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
              {FIELDS.map((field) => (
                <label
                  key={field.key}
                  htmlFor={`field-${field.key}`}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    id={`field-${field.key}`}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={values[field.key]}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.checked,
                      }))
                    }
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {field.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {field.description}
                    </p>
                  </div>
                </label>
              ))}

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
        title="Confirm safety setting changes"
        description="Provide a reason for changing safety settings."
        confirmLabel="Save changes"
        destructive
        loading={mutation.isPending}
      />
    </div>
  );
}

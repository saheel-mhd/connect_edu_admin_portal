'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';

type ActionKind = 'resolve' | 'dismiss' | 'escalate' | 'assign' | null;

interface ReportActionsProps {
  reportId: string;
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<ActionKind>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setActive(null);
    setError(null);
  }

  async function runReason(
    endpoint: 'resolve' | 'dismiss' | 'escalate',
    reason: string,
    note?: string,
  ) {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/admin/reports/${reportId}/${endpoint}`, {
        method: 'PATCH',
        body: { reason, note },
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.report(reportId),
      });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      setActive(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setPending(false);
    }
  }

  async function runAssign() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/admin/reports/${reportId}/assign`, {
        method: 'PATCH',
        body: {},
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.report(reportId),
      });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      setActive(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <PermissionGate permission="reports.resolve">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="success" onClick={() => setActive('resolve')}>
          Resolve
        </Button>
        <Button variant="secondary" onClick={() => setActive('dismiss')}>
          Dismiss
        </Button>
        <Button variant="danger" onClick={() => setActive('escalate')}>
          Escalate
        </Button>
        <Button variant="primary" onClick={() => setActive('assign')}>
          Assign to me
        </Button>
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ReasonRequiredModal
        open={active === 'resolve'}
        onClose={close}
        onConfirm={(reason, note) => runReason('resolve', reason, note)}
        title="Resolve report"
        description="Mark this report as resolved. A reason is required for the audit log."
        confirmLabel="Resolve"
        loading={pending}
      />
      <ReasonRequiredModal
        open={active === 'dismiss'}
        onClose={close}
        onConfirm={(reason, note) => runReason('dismiss', reason, note)}
        title="Dismiss report"
        description="Mark this report as dismissed. A reason is required for the audit log."
        confirmLabel="Dismiss"
        loading={pending}
      />
      <ReasonRequiredModal
        open={active === 'escalate'}
        onClose={close}
        onConfirm={(reason, note) => runReason('escalate', reason, note)}
        title="Escalate report"
        description="Escalate this report to a senior reviewer. A reason is required."
        confirmLabel="Escalate"
        destructive
        loading={pending}
      />
      <ConfirmActionModal
        open={active === 'assign'}
        onClose={close}
        onConfirm={runAssign}
        title="Assign this report to yourself"
        description="You will become the assigned reviewer for this report."
        confirmLabel="Assign to me"
        loading={pending}
      />
    </PermissionGate>
  );
}

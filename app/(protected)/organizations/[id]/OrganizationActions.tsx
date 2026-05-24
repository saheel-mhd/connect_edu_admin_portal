'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { apiFetch } from '@/lib/api/api-client';

type ActionType = 'approve' | 'reject' | 'request-more-info';
type VerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFO';

interface Props {
  id: string;
  status: VerificationStatus;
}

/**
 * Status-aware admin actions for an organization.
 *
 *   PENDING / NEEDS_MORE_INFO → show Approve / Reject / Request more info
 *   APPROVED                  → no actions (verified, nothing to do)
 *   REJECTED                  → show Approve only (revert decision)
 */
export function OrganizationActions({ id, status }: Props) {
  const router = useRouter();
  const [action, setAction] = useState<ActionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(
    type: ActionType,
    body?: { reason: string; note?: string },
  ) {
    setLoading(true);
    setError(null);
    try {
      const path =
        type === 'approve'
          ? `/admin/organizations/${id}/approve`
          : type === 'reject'
            ? `/admin/organizations/${id}/reject`
            : `/admin/organizations/${id}/request-more-info`;
      await apiFetch<unknown>(path, {
        method: 'PATCH',
        body: type === 'approve' ? {} : body,
      });
      setAction(null);
      // Server Component re-runs and the new verificationStatus comes
      // back from the DB — the buttons rerender according to the new
      // state.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    if (loading) return;
    setAction(null);
    setError(null);
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-medium">Organization verified</p>
          <p className="mt-0.5 text-xs text-emerald-800">
            No further action needed. They can now publish events and
            opportunities.
          </p>
        </div>
      </div>
    );
  }

  const canApprove = status === 'PENDING' || status === 'NEEDS_MORE_INFO' || status === 'REJECTED';
  const canReject = status === 'PENDING' || status === 'NEEDS_MORE_INFO';
  const canRequestInfo = status === 'PENDING' || status === 'NEEDS_MORE_INFO';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {canApprove && (
          <Button variant="success" onClick={() => setAction('approve')}>
            Approve
          </Button>
        )}
        {canReject && (
          <Button variant="danger" onClick={() => setAction('reject')}>
            Reject
          </Button>
        )}
        {canRequestInfo && (
          <Button
            variant="secondary"
            onClick={() => setAction('request-more-info')}
          >
            Request more info
          </Button>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ConfirmActionModal
        open={action === 'approve'}
        onClose={close}
        onConfirm={() => runAction('approve')}
        title="Approve organization"
        description={
          status === 'REJECTED'
            ? 'This will reverse the prior rejection and verify the organization.'
            : 'The organization will be marked as APPROVED and notified.'
        }
        confirmLabel="Approve"
        loading={loading}
      />

      <ReasonRequiredModal
        open={action === 'reject'}
        onClose={close}
        onConfirm={(reason, note) => runAction('reject', { reason, note })}
        title="Reject organization"
        description="Provide a reason — the organization will be notified."
        confirmLabel="Reject"
        destructive
        loading={loading}
      />

      <ReasonRequiredModal
        open={action === 'request-more-info'}
        onClose={close}
        onConfirm={(reason, note) =>
          runAction('request-more-info', { reason, note })
        }
        title="Request more info"
        description="Ask the organization for additional documentation or clarification."
        confirmLabel="Send request"
        loading={loading}
      />
    </div>
  );
}

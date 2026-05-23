'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { apiFetch } from '@/lib/api/api-client';

type ActionType = 'approve' | 'reject' | 'request-more-info';

export function OrganizationActions({ id }: { id: string }) {
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="success" onClick={() => setAction('approve')}>
          Approve
        </Button>
        <Button variant="danger" onClick={() => setAction('reject')}>
          Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() => setAction('request-more-info')}
        >
          Request more info
        </Button>
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
        description="The organization will be marked as APPROVED and notified."
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';

type ModalKind = 'none' | 'approve' | 'reject' | 'hide';

interface OpportunityActionsProps {
  opportunityId: string;
  title: string;
}

export function OpportunityActions({
  opportunityId,
  title,
}: OpportunityActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalKind>('none');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const approve = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/opportunities/${opportunityId}/approve`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      invalidate();
      setModal('none');
      router.refresh();
    },
  });

  const reject = useMutation({
    mutationFn: (vars: { reason: string; note?: string }) =>
      apiFetch(`/admin/opportunities/${opportunityId}/reject`, {
        method: 'PATCH',
        body: vars,
      }),
    onSuccess: () => {
      invalidate();
      setModal('none');
      router.refresh();
    },
  });

  const hide = useMutation({
    mutationFn: (vars: { reason: string; note?: string }) =>
      apiFetch(`/admin/opportunities/${opportunityId}/hide`, {
        method: 'PATCH',
        body: vars,
      }),
    onSuccess: () => {
      invalidate();
      setModal('none');
      router.refresh();
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PermissionGate permission="opportunities.approve">
        <Button
          size="sm"
          variant="success"
          onClick={() => setModal('approve')}
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </Button>
      </PermissionGate>
      <PermissionGate permission="opportunities.reject">
        <Button size="sm" variant="danger" onClick={() => setModal('reject')}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </PermissionGate>
      <PermissionGate permission="opportunities.reject">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setModal('hide')}
        >
          <EyeOff className="h-3.5 w-3.5" /> Hide
        </Button>
      </PermissionGate>

      <ConfirmActionModal
        open={modal === 'approve'}
        onClose={() => setModal('none')}
        onConfirm={() => approve.mutate()}
        title={`Approve "${title}"?`}
        description="The opportunity will become visible to families and youth."
        confirmLabel="Approve"
        loading={approve.isPending}
      />

      <ReasonRequiredModal
        open={modal === 'reject'}
        onClose={() => setModal('none')}
        onConfirm={(reason, note) => reject.mutate({ reason, note })}
        title={`Reject "${title}"?`}
        description="The submitting organization will be notified of the decision."
        confirmLabel="Reject"
        destructive
        loading={reject.isPending}
      />

      <ReasonRequiredModal
        open={modal === 'hide'}
        onClose={() => setModal('none')}
        onConfirm={(reason, note) => hide.mutate({ reason, note })}
        title={`Hide "${title}"?`}
        description="Hidden opportunities stay in the system but are removed from public surfaces."
        confirmLabel="Hide"
        destructive
        loading={hide.isPending}
      />
    </div>
  );
}

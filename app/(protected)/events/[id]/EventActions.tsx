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

interface EventActionsProps {
  eventId: string;
  title: string;
}

export function EventActions({ eventId, title }: EventActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalKind>('none');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const approve = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/events/${eventId}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setModal('none');
      router.refresh();
    },
  });

  const reject = useMutation({
    mutationFn: (vars: { reason: string; note?: string }) =>
      apiFetch(`/admin/events/${eventId}/reject`, {
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
      apiFetch(`/admin/events/${eventId}/hide`, {
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
      <PermissionGate permission="events.approve">
        <Button
          size="sm"
          variant="success"
          onClick={() => setModal('approve')}
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </Button>
      </PermissionGate>
      <PermissionGate permission="events.reject">
        <Button size="sm" variant="danger" onClick={() => setModal('reject')}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </PermissionGate>
      <PermissionGate permission="events.reject">
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
        description="The event will become visible in the public feed."
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
        description="Hidden events stay in the system but are removed from public surfaces."
        confirmLabel="Hide"
        destructive
        loading={hide.isPending}
      />
    </div>
  );
}

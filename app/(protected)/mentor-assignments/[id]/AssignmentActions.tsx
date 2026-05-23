'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';

interface AssignmentActionsProps {
  assignmentId: string;
  canEnd: boolean;
}

export function AssignmentActions({
  assignmentId,
  canEnd,
}: AssignmentActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnd() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/admin/mentor-assignments/${assignmentId}/status`, {
        method: 'PATCH',
        body: { status: 'ENDED' },
      });
      await queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end assignment');
    } finally {
      setPending(false);
    }
  }

  if (!canEnd) return null;

  return (
    <PermissionGate permission="mentor_assignments.create">
      <div className="flex items-center gap-2">
        <Button variant="danger" onClick={() => setOpen(true)}>
          End assignment
        </Button>
      </div>
      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ConfirmActionModal
        open={open}
        onClose={() => {
          if (!pending) {
            setOpen(false);
            setError(null);
          }
        }}
        onConfirm={handleEnd}
        title="End mentor assignment"
        description="This will end the assignment and prevent further mentoring activity."
        confirmLabel="End assignment"
        destructive
        loading={pending}
      />
    </PermissionGate>
  );
}

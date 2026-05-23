'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';

interface RoomActionsProps {
  roomId: string;
}

export function RoomActions({ roomId }: RoomActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestrict(reason: string, note?: string) {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/admin/chat-safety/rooms/${roomId}/restrict`, {
        method: 'PATCH',
        body: { reason, note },
      });
      await queryClient.invalidateQueries({ queryKey: ['chat-safety'] });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restrict room');
    } finally {
      setPending(false);
    }
  }

  return (
    <PermissionGate permission="chat_safety.review">
      <div className="flex items-center gap-2">
        <Button variant="danger" onClick={() => setOpen(true)}>
          Restrict room
        </Button>
      </div>
      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ReasonRequiredModal
        open={open}
        onClose={() => {
          if (!pending) {
            setOpen(false);
            setError(null);
          }
        }}
        onConfirm={handleRestrict}
        title="Restrict chat room"
        description="Restricting the room blocks further messages. A reason is required for the audit log."
        confirmLabel="Restrict room"
        destructive
        loading={pending}
      />
    </PermissionGate>
  );
}

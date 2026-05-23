'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';

type ActionKind = 'approve' | 'reject' | 'hide' | 'restore';

interface PostActionsProps {
  postId: string;
}

export function PostActions({ postId }: PostActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<ActionKind | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.posts() });
    queryClient.invalidateQueries({ queryKey: queryKeys.postsPending() });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/posts/${postId}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setAction(null);
      router.refresh();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ reason, note }: { reason: string; note?: string }) =>
      apiFetch(`/admin/posts/${postId}/reject`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      invalidate();
      setAction(null);
      router.refresh();
    },
  });

  const hideMutation = useMutation({
    mutationFn: ({ reason, note }: { reason: string; note?: string }) =>
      apiFetch(`/admin/posts/${postId}/hide`, {
        method: 'PATCH',
        body: { reason, note },
      }),
    onSuccess: () => {
      invalidate();
      setAction(null);
      router.refresh();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/posts/${postId}/restore`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      setAction(null);
      router.refresh();
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PermissionGate permission="posts.approve">
        <Button
          variant="success"
          size="sm"
          onClick={() => setAction('approve')}
        >
          Approve
        </Button>
      </PermissionGate>
      <PermissionGate permission="posts.reject">
        <Button
          variant="danger"
          size="sm"
          onClick={() => setAction('reject')}
        >
          Reject
        </Button>
      </PermissionGate>
      <PermissionGate permission="posts.hide">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAction('hide')}
        >
          Hide
        </Button>
      </PermissionGate>
      <PermissionGate permission="posts.approve">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAction('restore')}
        >
          Restore
        </Button>
      </PermissionGate>

      <ConfirmActionModal
        open={action === 'approve'}
        onClose={() => setAction(null)}
        onConfirm={() => approveMutation.mutate()}
        title="Approve post"
        description="The post will become visible on the platform."
        confirmLabel="Approve"
        loading={approveMutation.isPending}
      />

      <ConfirmActionModal
        open={action === 'restore'}
        onClose={() => setAction(null)}
        onConfirm={() => restoreMutation.mutate()}
        title="Restore post"
        description="The post will be restored and made visible again."
        confirmLabel="Restore"
        loading={restoreMutation.isPending}
      />

      <ReasonRequiredModal
        open={action === 'reject'}
        onClose={() => setAction(null)}
        onConfirm={(reason, note) => rejectMutation.mutate({ reason, note })}
        title="Reject post"
        description="The post will be rejected and removed from public visibility."
        confirmLabel="Reject"
        destructive
        loading={rejectMutation.isPending}
      />

      <ReasonRequiredModal
        open={action === 'hide'}
        onClose={() => setAction(null)}
        onConfirm={(reason, note) => hideMutation.mutate({ reason, note })}
        title="Hide post"
        description="The post will be hidden from the platform but retained for review."
        confirmLabel="Hide"
        destructive
        loading={hideMutation.isPending}
      />
    </div>
  );
}

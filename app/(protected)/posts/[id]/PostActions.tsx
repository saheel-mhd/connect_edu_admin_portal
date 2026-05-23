'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';

interface PostActionsProps {
  postId: string;
}

/**
 * Admin moderation action for a post detail page. Approve/reject/hide/restore
 * happen on the queue pages — the detail view exists to inspect a post and,
 * if its content is inappropriate, remove it. One destructive action only.
 */
export function PostActions({ postId }: PostActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: ({ reason, note }: { reason: string; note?: string }) =>
      apiFetch(`/admin/posts/${postId}`, {
        method: 'DELETE',
        body: { reason: note ? `${reason} — ${note}` : reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.postsPending() });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setOpen(false);
      // Detail page no longer applies — back to the list.
      router.push('/posts');
      router.refresh();
    },
  });

  return (
    <>
      <PermissionGate permission="posts.hide">
        <Button
          variant="danger"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete post
        </Button>
      </PermissionGate>

      <ReasonRequiredModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(reason, note) => deleteMutation.mutate({ reason, note })}
        title="Delete post"
        description="The post will be removed from the platform. The author is notified and the action is recorded in the audit log."
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  );
}

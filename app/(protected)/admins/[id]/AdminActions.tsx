'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { apiFetch } from '@/lib/api/api-client';
import type { UserRole, UserStatus } from '@/types/auth';

interface AdminActionsProps {
  adminId: string;
  currentRole: UserRole;
  currentStatus: UserStatus;
}

type ModalKind = 'role' | 'status' | null;

export function AdminActions({
  adminId,
  currentRole,
  currentStatus,
}: AdminActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalKind>(null);
  const [resetMfaOpen, setResetMfaOpen] = useState(false);
  const [forceLogoutOpen, setForceLogoutOpen] = useState(false);

  // role form state
  const [roleValue, setRoleValue] = useState<UserRole>(currentRole);
  const [roleReason, setRoleReason] = useState('');

  // status form state
  const [statusValue, setStatusValue] = useState<UserStatus>(currentStatus);
  const [statusReason, setStatusReason] = useState('');

  const [error, setError] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
    router.refresh();
  }

  function closeModals() {
    setModal(null);
    setResetMfaOpen(false);
    setForceLogoutOpen(false);
    setRoleReason('');
    setStatusReason('');
    setError(null);
  }

  const roleMutation = useMutation({
    mutationFn: async (body: { role: UserRole; reason: string }) =>
      apiFetch<{ id: string }>(`/admin/admins/${adminId}/role`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      invalidate();
      closeModals();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Failed to update role'),
  });

  const statusMutation = useMutation({
    mutationFn: async (body: { status: UserStatus; reason: string }) =>
      apiFetch<{ id: string }>(`/admin/admins/${adminId}/status`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      invalidate();
      closeModals();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Failed to update status'),
  });

  const resetMfaMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ id: string }>(`/admin/admins/${adminId}/reset-mfa`, {
        method: 'POST',
      }),
    onSuccess: () => {
      invalidate();
      setResetMfaOpen(false);
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ id: string }>(`/admin/admins/${adminId}/force-logout`, {
        method: 'POST',
      }),
    onSuccess: () => {
      invalidate();
      setForceLogoutOpen(false);
    },
  });

  function submitRole() {
    setError(null);
    if (roleReason.trim().length < 3) {
      setError('Please provide a clear reason (at least 3 characters).');
      return;
    }
    roleMutation.mutate({ role: roleValue, reason: roleReason.trim() });
  }

  function submitStatus() {
    setError(null);
    if (statusReason.trim().length < 3) {
      setError('Please provide a clear reason (at least 3 characters).');
      return;
    }
    statusMutation.mutate({
      status: statusValue,
      reason: statusReason.trim(),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          setRoleValue(currentRole);
          setRoleReason('');
          setError(null);
          setModal('role');
        }}
      >
        Change role
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          setStatusValue(currentStatus);
          setStatusReason('');
          setError(null);
          setModal('status');
        }}
      >
        Change status
      </Button>
      <Button variant="secondary" onClick={() => setResetMfaOpen(true)}>
        Reset MFA
      </Button>
      <Button variant="danger" onClick={() => setForceLogoutOpen(true)}>
        Force logout
      </Button>

      {/* Change role modal */}
      <Modal
        open={modal === 'role'}
        onClose={closeModals}
        title="Change admin role"
        description="Updating an admin's role takes effect immediately."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModals}
              disabled={roleMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={submitRole} loading={roleMutation.isPending}>
              Update role
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="role-select">New role</Label>
            <Select
              id="role-select"
              className="mt-1"
              value={roleValue}
              onChange={(event) => setRoleValue(event.target.value as UserRole)}
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="role-reason">Reason</Label>
            <Textarea
              id="role-reason"
              className="mt-1"
              rows={3}
              value={roleReason}
              onChange={(event) => setRoleReason(event.target.value)}
              placeholder="Required — explain why this role change is being made."
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This action will be recorded in the audit log.
          </p>
        </div>
      </Modal>

      {/* Change status modal */}
      <Modal
        open={modal === 'status'}
        onClose={closeModals}
        title="Change admin status"
        description="Updating an admin's status takes effect immediately."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModals}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={submitStatus} loading={statusMutation.isPending}>
              Update status
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="status-select">New status</Label>
            <Select
              id="status-select"
              className="mt-1"
              value={statusValue}
              onChange={(event) =>
                setStatusValue(event.target.value as UserStatus)
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="DELETED">Deleted</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-reason">Reason</Label>
            <Textarea
              id="status-reason"
              className="mt-1"
              rows={3}
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              placeholder="Required — explain why this status change is being made."
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This action will be recorded in the audit log.
          </p>
        </div>
      </Modal>

      {/* Reset MFA */}
      <ConfirmActionModal
        open={resetMfaOpen}
        onClose={() => setResetMfaOpen(false)}
        onConfirm={() => resetMfaMutation.mutate()}
        title="Reset MFA for admin"
        description="This will remove the MFA enrollment. They will be prompted to re-enroll on next login."
        confirmLabel="Reset MFA"
        destructive
        loading={resetMfaMutation.isPending}
      />

      {/* Force logout */}
      <ConfirmActionModal
        open={forceLogoutOpen}
        onClose={() => setForceLogoutOpen(false)}
        onConfirm={() => forceLogoutMutation.mutate()}
        title="Force logout admin"
        description="This will immediately invalidate all sessions for this admin."
        confirmLabel="Force logout"
        destructive
        loading={forceLogoutMutation.isPending}
      />
    </div>
  );
}

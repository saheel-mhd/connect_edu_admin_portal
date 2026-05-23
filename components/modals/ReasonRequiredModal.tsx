'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

interface ReasonRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ReasonRequiredModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive,
  loading,
}: ReasonRequiredModalProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  function handleConfirm() {
    setTouched(true);
    if (reason.trim().length < 3) return;
    onConfirm(reason.trim(), note.trim() || undefined);
  }

  function handleClose() {
    setReason('');
    setNote('');
    setTouched(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Required — explain why this action is being taken."
            rows={3}
            className="mt-1"
          />
          {touched && reason.trim().length < 3 && (
            <p className="mt-1 text-xs text-red-600">
              Please provide a clear reason (at least 3 characters).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="note">Internal note (optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Notes are visible to other admins only."
            rows={2}
            className="mt-1"
          />
        </div>
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This action will be recorded in the audit log.
        </p>
      </div>
    </Modal>
  );
}

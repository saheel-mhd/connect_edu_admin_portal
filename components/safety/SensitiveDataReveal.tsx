'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReasonRequiredModal } from '@/components/modals/ReasonRequiredModal';

interface SensitiveDataRevealProps {
  label: string;
  maskedValue: string;
  revealedValue: ReactNode;
  /** Optional callback to log the reveal to the audit log via the backend. */
  onReveal?: (reason: string) => Promise<void> | void;
}

/** Masks sensitive child data by default; reveal requires a reason + audit log. */
export function SensitiveDataReveal({
  label,
  maskedValue,
  revealedValue,
  onReveal,
}: SensitiveDataRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm(reason: string) {
    setPending(true);
    try {
      await onReveal?.(reason);
      setRevealed(true);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-sm text-slate-900">
        {revealed ? revealedValue : maskedValue}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (revealed ? setRevealed(false) : setOpen(true))}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {revealed ? 'Hide' : 'Reveal'}
      </Button>
      <ReasonRequiredModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(reason) => handleConfirm(reason)}
        title={`Reveal ${label}`}
        description="Revealing sensitive child data requires a reason and is audit-logged."
        confirmLabel="Reveal"
        loading={pending}
      />
    </div>
  );
}

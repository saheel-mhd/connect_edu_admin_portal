'use client';

import Link from 'next/link';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { AccessDeniedState } from '@/components/shared/states';
import { usePermission } from '@/hooks/use-permission';

export default function ChatSafetyIndexPage() {
  const canView = usePermission('chat_safety.view');

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Chat safety"
          description="Review flagged direct messages and chat rooms."
        />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Chat safety"
        description="Review flagged direct messages and chat rooms."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/chat-safety/flagged" className="block">
          <Card className="transition hover:border-brand-300 hover:shadow-md">
            <CardBody className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-red-50 p-2 ring-1 ring-inset ring-red-200">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    Review flagged messages
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Inspect messages that were flagged by automated safety
                    checks or reported by users.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}

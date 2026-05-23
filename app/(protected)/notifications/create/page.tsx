'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AccessDeniedState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { usePermission } from '@/hooks/use-permission';

type TargetMode = 'all' | 'role' | 'users';
type TargetRole = 'KID' | 'PARENT' | 'MENTOR' | 'ORGANIZATION';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  targetMode: TargetMode;
  role?: TargetRole;
  userIds?: string[];
}

const TYPE_OPTIONS = [
  { value: 'ADMIN_NOTICE', label: 'Admin notice' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'SYSTEM', label: 'System' },
];

const TARGET_MODE_OPTIONS: { value: TargetMode; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'role', label: 'By role' },
  { value: 'users', label: 'Specific users' },
];

const ROLE_OPTIONS: { value: TargetRole; label: string }[] = [
  { value: 'KID', label: 'Kids' },
  { value: 'PARENT', label: 'Parents' },
  { value: 'MENTOR', label: 'Mentors' },
  { value: 'ORGANIZATION', label: 'Organizations' },
];

export default function CreateNotificationPage() {
  const canSend = usePermission('notifications.send');
  const queryClient = useQueryClient();

  const [type, setType] = useState<string>('ADMIN_NOTICE');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [role, setRole] = useState<TargetRole>('KID');
  const [userIdsInput, setUserIdsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: NotificationPayload) =>
      apiFetch<{ id: string }>('/admin/notifications', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      setSuccess('Notification sent successfully.');
      setError(null);
      setTitle('');
      setBody('');
      setUserIdsInput('');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to send notification',
      );
      setSuccess(null);
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const payload: NotificationPayload = {
      type,
      title: title.trim(),
      body: body.trim(),
      targetMode,
    };

    if (targetMode === 'role') {
      payload.role = role;
    } else if (targetMode === 'users') {
      const ids = userIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length === 0) {
        setError('Please enter at least one user ID.');
        return;
      }
      payload.userIds = ids;
    }

    mutation.mutate(payload);
  }

  if (!canSend) {
    return (
      <div>
        <PageHeader title="New notification" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to notifications
        </Link>
      </div>

      <PageHeader
        title="New notification"
        description="Broadcast a notice to all users, a role, or a specific list of accounts."
      />

      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardBody className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <span className="font-medium">
              Bulk notifications cannot be reversed — review carefully.
            </span>{' '}
            Verify the audience and message before sending.
          </p>
        </CardBody>
      </Card>

      {success && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardBody className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-900">{success}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  className="mt-1"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="targetMode">Audience</Label>
                <Select
                  id="targetMode"
                  className="mt-1"
                  value={targetMode}
                  onChange={(event) =>
                    setTargetMode(event.target.value as TargetMode)
                  }
                >
                  {TARGET_MODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {targetMode === 'role' && (
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  className="mt-1"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as TargetRole)
                  }
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {targetMode === 'users' && (
              <div>
                <Label htmlFor="userIds">User IDs</Label>
                <Textarea
                  id="userIds"
                  className="mt-1"
                  rows={3}
                  placeholder="Comma-separated user IDs"
                  value={userIdsInput}
                  onChange={(event) => setUserIdsInput(event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter user IDs separated by commas.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-1"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                className="mt-1"
                rows={5}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Link href="/notifications">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={mutation.isPending}>
                Send notification
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}


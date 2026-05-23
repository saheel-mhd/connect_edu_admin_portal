'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RoleBadge, UserStatusBadge } from '@/components/badges/StatusBadges';
import { LoadingState } from '@/components/shared/states';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { useToast } from '@/components/providers/ToastProvider';
import { apiFetch } from '@/lib/api/api-client';
import { queryKeys } from '@/lib/utils/query-keys';
import { formatDateTime } from '@/lib/utils/format';
import type { AdminUser } from '@/types/auth';

interface ProfileForm {
  name: string;
  username: string;
  avatarUrl: string;
  country: string;
  language: string;
}

const EMPTY: ProfileForm = {
  name: '',
  username: '',
  avatarUrl: '',
  country: '',
  language: '',
};

function toForm(admin: AdminUser | null): ProfileForm {
  if (!admin) return EMPTY;
  return {
    name: admin.name ?? '',
    username: admin.username ?? '',
    avatarUrl: admin.avatarUrl ?? '',
    country: admin.country ?? '',
    language: admin.language ?? '',
  };
}

export default function AccountPage() {
  const { admin, isLoading } = useCurrentAdmin();
  const queryClient = useQueryClient();
  const { show } = useToast();

  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (admin) {
      setForm(toForm(admin));
      setDirty(false);
    }
  }, [admin]);

  const mutation = useMutation({
    mutationFn: async (body: Partial<ProfileForm>) =>
      apiFetch<AdminUser>('/users/me', {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentAdmin });
      show({ kind: 'success', title: 'Profile updated' });
      setDirty(false);
    },
    onError: (err) => {
      show({
        kind: 'error',
        title: 'Could not save profile',
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  function update<K extends keyof ProfileForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!admin) return;
    const body: Partial<ProfileForm> = {};
    (Object.keys(form) as (keyof ProfileForm)[]).forEach((key) => {
      const value = form[key].trim();
      if (value !== (admin[key as keyof AdminUser] ?? '')) {
        body[key] = value;
      }
    });
    if (Object.keys(body).length === 0) {
      show({ kind: 'info', title: 'No changes to save' });
      return;
    }
    mutation.mutate(body);
  }

  if (isLoading || !admin) {
    return (
      <div>
        <PageHeader title="Account" />
        <LoadingState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Account"
        description="Your profile and security settings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    className="mt-1"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    className="mt-1"
                    value={form.username}
                    onChange={(event) => update('username', event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    className="mt-1"
                    placeholder="https://…"
                    value={form.avatarUrl}
                    onChange={(event) => update('avatarUrl', event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    className="mt-1"
                    value={form.country}
                    onChange={(event) => update('country', event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    className="mt-1"
                    placeholder="en"
                    value={form.language}
                    onChange={(event) => update('language', event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <p className="text-xs text-slate-500">
                  Email is fixed on this account — contact a super admin to
                  change it.
                </p>
                <Button type="submit" loading={mutation.isPending} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{admin.name}</p>
                  <p className="text-xs text-slate-500">{admin.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <RoleBadge role={admin.role} />
                <UserStatusBadge status={admin.status} />
              </div>
              <dl className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <dt>Created</dt>
                  <dd>{formatDateTime(admin.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Last login</dt>
                  <dd>{formatDateTime(admin.lastLoginAt)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Audit-logged.
              </p>
              <Link href="/account/security">
                <Button variant="secondary" className="w-full">
                  <KeyRound className="h-4 w-4" /> Change password
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

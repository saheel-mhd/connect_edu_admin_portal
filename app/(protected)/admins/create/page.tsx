'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, Check, Copy } from 'lucide-react';
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

type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

interface CreateAdminPayload {
  name: string;
  email: string;
  role: AdminRole;
  reason: string;
}

interface CreateAdminResponse {
  admin: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  temporaryPassword: string;
}

export default function CreateAdminPage() {
  const canManage = usePermission('admins.manage');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('ADMIN');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<CreateAdminResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: CreateAdminPayload) =>
      apiFetch<CreateAdminResponse>('/admin/admins', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setCreated(response.data);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Name is required.');
    if (!email.trim()) return setError('Email is required.');
    if (reason.trim().length < 3) {
      return setError('Please provide a clear reason (at least 3 characters).');
    }
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      role,
      reason: reason.trim(),
    });
  }

  function resetForm() {
    setName('');
    setEmail('');
    setRole('ADMIN');
    setReason('');
    setError(null);
    setCopied(false);
    setCreated(null);
  }

  async function copyPassword() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Create admin" />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/admins"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to admins
        </Link>
      </div>

      <PageHeader
        title="Create admin"
        description="Provision a new admin or super-admin account."
      />

      {created ? (
        <Card className="border-emerald-200">
          <CardBody className="space-y-4">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Admin created
                </h2>
                <p className="text-sm text-slate-600">
                  Share these credentials with{' '}
                  <span className="font-medium">{created.admin.name}</span> over
                  a secure channel. The password is shown <span className="font-medium">only once</span> — close
                  this page and it's gone.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Name
                </dt>
                <dd className="mt-0.5 text-slate-900">{created.admin.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </dt>
                <dd className="mt-0.5 text-slate-900">{created.admin.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Role
                </dt>
                <dd className="mt-0.5 text-slate-900">{created.admin.role}</dd>
              </div>
            </dl>

            <div>
              <Label>Temporary password</Label>
              <div className="mt-1 flex items-stretch gap-2">
                <code className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                  {created.temporaryPassword}
                </code>
                <Button variant="secondary" onClick={copyPassword}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-amber-700">
                The backend stored only the hash — there is no way to retrieve
                this password later.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="secondary" onClick={resetForm}>
                Create another
              </Button>
              <Link href="/admins">
                <Button>Back to admins</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardBody className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-medium">
                  Only super admins may create admin accounts.
                </span>{' '}
                A temporary password will be generated and shown only once on
                the next screen. All admin provisioning is recorded in the
                audit log.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      className="mt-1"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="mt-1"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    id="role"
                    className="mt-1"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as AdminRole)
                    }
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super admin</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    className="mt-1"
                    rows={3}
                    placeholder="Required — explain why this admin account is being created."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Link href="/admins">
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" loading={mutation.isPending}>
                    Create admin
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

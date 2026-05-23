'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { AccessDeniedState } from '@/components/shared/states';
import { apiFetch } from '@/lib/api/api-client';
import { usePermission } from '@/hooks/use-permission';

interface CreateResponse {
  id: string;
}

export default function CreateMentorAssignmentPage() {
  const canManage = usePermission('mentor_assignments.create');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [kidProfileId, setKidProfileId] = useState('');
  const [mentorProfileId, setMentorProfileId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<CreateResponse | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      router.push('/mentor-assignments');
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!kidProfileId.trim() || !mentorProfileId.trim()) {
      setError('Kid profile ID and mentor profile ID are required.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please provide a reason (at least 3 characters).');
      return;
    }
    setPending(true);
    try {
      const res = await apiFetch<CreateResponse>('/admin/mentor-assignments', {
        method: 'POST',
        body: {
          kidProfileId: kidProfileId.trim(),
          mentorProfileId: mentorProfileId.trim(),
          skillId: skillId.trim() || undefined,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      setSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setPending(false);
    }
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="Create mentor assignment"
          description="Assign a mentor to a kid for a specific skill."
        />
        <AccessDeniedState />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/mentor-assignments"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to assignments
        </Link>
      </div>
      <PageHeader
        title="Create mentor assignment"
        description="Assign a mentor to a kid for a specific skill."
      />

      {success ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardBody className="space-y-3 text-sm text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Assignment created.</span>
            </div>
            <p>
              Redirecting back to the assignments list…{' '}
              <Link
                href="/mentor-assignments"
                className="font-medium underline"
              >
                Open now
              </Link>
              .
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="kidProfileId">Kid profile ID</Label>
                <Input
                  id="kidProfileId"
                  value={kidProfileId}
                  onChange={(event) => setKidProfileId(event.target.value)}
                  placeholder="Paste the kid profile ID"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mentorProfileId">Mentor profile ID</Label>
                <Input
                  id="mentorProfileId"
                  value={mentorProfileId}
                  onChange={(event) => setMentorProfileId(event.target.value)}
                  placeholder="Paste the mentor profile ID"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="skillId">Skill ID (optional)</Label>
                <Input
                  id="skillId"
                  value={skillId}
                  onChange={(event) => setSkillId(event.target.value)}
                  placeholder="Optional — paste a skill ID"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why this mentor is being assigned (required)."
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Internal notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notes visible to other admins only."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Link href="/mentor-assignments">
                  <Button type="button" variant="secondary" disabled={pending}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" loading={pending}>
                  Create assignment
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, ExternalLink, Users } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ModerationStatusBadge,
  VerificationStatusBadge,
} from '@/components/badges/StatusBadges';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { ModerationStatus, VerificationStatus } from '@/types/admin';
import { OpportunityActions } from './OpportunityActions';

interface AdminOpportunityDetail {
  id: string;
  title: string;
  description?: string | null;
  opportunityType?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  externalUrl?: string | null;
  approvalStatus: VerificationStatus;
  moderationStatus?: ModerationStatus | null;
  createdAt?: string | null;
  organizationProfile?: {
    id: string;
    organizationName?: string | null;
    website?: string | null;
  } | null;
  opportunitySkills?: Array<{ skill?: { id: string; name: string } | null }>;
}

export const dynamic = 'force-dynamic';

function safeHostname(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let opportunity: AdminOpportunityDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<AdminOpportunityDetail>>(
      `/admin/opportunities/${params.id}`,
    );
    opportunity = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load opportunity';
  }

  if (error || !opportunity) {
    return (
      <div>
        <div className="mb-4">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to opportunities
          </Link>
        </div>
        <PageHeader title="Opportunity" />
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">
            {error ?? 'Opportunity not found.'}
          </CardBody>
        </Card>
      </div>
    );
  }

  const skills = (opportunity.opportunitySkills ?? [])
    .map((s) => s.skill?.name)
    .filter((name): name is string => Boolean(name));
  const host = safeHostname(opportunity.externalUrl);

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </Link>
      </div>

      <PageHeader
        title={opportunity.title}
        description="Opportunity details and moderation actions."
        actions={
          <OpportunityActions
            opportunityId={opportunity.id}
            title={opportunity.title}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <VerificationStatusBadge status={opportunity.approvalStatus} />
        {opportunity.moderationStatus && (
          <ModerationStatusBadge status={opportunity.moderationStatus} />
        )}
        {opportunity.opportunityType && (
          <Badge tone="info">
            {opportunity.opportunityType.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardBody>
              {opportunity.description ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {opportunity.description}
                </p>
              ) : (
                <p className="text-sm text-slate-400">No description provided.</p>
              )}
            </CardBody>
          </Card>

          {skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((name) => (
                    <Badge key={name} tone="info">
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {opportunity.externalUrl && (
            <Card>
              <CardHeader>
                <CardTitle>External URL</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <div
                  className="break-all text-sm text-slate-700"
                  title={`URL review: ${opportunity.externalUrl}`}
                >
                  <span className="text-slate-500">Domain: </span>
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                    {host ?? 'invalid URL'}
                  </span>
                  <div className="mt-1 text-xs text-slate-500">
                    {opportunity.externalUrl}
                  </div>
                </div>
                <a
                  href={opportunity.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`URL review: ${opportunity.externalUrl}`}
                >
                  <Button size="sm" variant="secondary">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                  </Button>
                </a>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardBody>
              {opportunity.organizationProfile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {opportunity.organizationProfile.organizationName ?? '—'}
                  </div>
                  <Link
                    href={`/organizations/${opportunity.organizationProfile.id}`}
                    className="inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    View organization profile
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No organization associated.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Age range
                    </dt>
                    <dd className="text-slate-800">
                      {`${opportunity.ageMin ?? '—'}–${opportunity.ageMax ?? '—'}`}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Created
                    </dt>
                    <dd className="text-slate-800">
                      {formatDateTime(opportunity.createdAt)}
                    </dd>
                  </div>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

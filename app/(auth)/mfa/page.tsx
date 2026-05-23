'use client';

import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';

/**
 * MFA UI placeholder. The platform is set up to require MFA per AGENTS.md
 * section 7.4; the backend MVP does not yet expose MFA endpoints, so this
 * page exists as a scaffold for when they land (TOTP / recovery codes).
 */
export default function MfaPage() {
  return (
    <Card>
      <CardBody className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Two-factor authentication
        </h1>
        <p className="text-sm text-slate-600">
          MFA is configured to be required for admin accounts. The MVP backend
          ships without MFA endpoints yet; once enabled, this page will collect
          your TOTP or recovery code here.
        </p>
        <Link href="/login" className="text-sm text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </CardBody>
    </Card>
  );
}

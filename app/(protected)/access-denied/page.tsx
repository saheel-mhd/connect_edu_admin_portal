import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';

export default function AccessDeniedPage() {
  return (
    <Card>
      <CardBody className="space-y-3 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          You do not have permission to view that page.
        </p>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          Back to dashboard
        </Link>
      </CardBody>
    </Card>
  );
}

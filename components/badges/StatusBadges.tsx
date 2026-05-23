import { Badge } from '@/components/ui/Badge';
import type {
  ModerationStatus,
  ReportStatus,
  RiskLevel,
  VerificationStatus,
} from '@/types/admin';
import type { UserRole, UserStatus } from '@/types/auth';

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone =
    status === 'ACTIVE'
      ? 'success'
      : status === 'PENDING'
        ? 'pending'
        : status === 'SUSPENDED'
          ? 'warning'
          : status === 'BANNED'
            ? 'danger'
            : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const tone =
    status === 'APPROVED'
      ? 'success'
      : status === 'PENDING'
        ? 'pending'
        : status === 'REJECTED'
          ? 'danger'
          : 'warning';
  return <Badge tone={tone}>{status.replace('_', ' ')}</Badge>;
}

export function ModerationStatusBadge({
  status,
}: {
  status: ModerationStatus;
}) {
  const tone =
    status === 'APPROVED'
      ? 'success'
      : status === 'PENDING'
        ? 'pending'
        : status === 'REJECTED' || status === 'HIDDEN'
          ? 'danger'
          : 'critical';
  return <Badge tone={tone}>{status}</Badge>;
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone =
    status === 'RESOLVED'
      ? 'success'
      : status === 'OPEN'
        ? 'pending'
        : status === 'IN_REVIEW'
          ? 'info'
          : status === 'ESCALATED'
            ? 'critical'
            : 'neutral';
  return <Badge tone={tone}>{status.replace('_', ' ')}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const tone =
    role === 'SUPER_ADMIN'
      ? 'critical'
      : role === 'ADMIN'
        ? 'info'
        : role === 'MENTOR' || role === 'ORGANIZATION'
          ? 'pending'
          : 'neutral';
  return <Badge tone={tone}>{role.replace('_', ' ')}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone =
    level === 'CRITICAL'
      ? 'critical'
      : level === 'HIGH'
        ? 'danger'
        : level === 'MEDIUM'
          ? 'warning'
          : 'neutral';
  return <Badge tone={tone}>{level}</Badge>;
}

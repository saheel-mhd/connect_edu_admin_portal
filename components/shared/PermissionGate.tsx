'use client';

import type { ReactNode } from 'react';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { hasPermission, type Permission } from '@/lib/auth/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Hide UI unless the current admin has the required permission. */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { admin } = useCurrentAdmin();
  if (!admin) return null;
  return hasPermission(admin.role, permission) ? <>{children}</> : <>{fallback}</>;
}

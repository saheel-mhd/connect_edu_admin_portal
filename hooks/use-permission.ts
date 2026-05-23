'use client';

import { useCurrentAdmin } from './use-current-admin';
import { hasPermission, type Permission } from '@/lib/auth/permissions';

export function usePermission(permission: Permission): boolean {
  const { admin } = useCurrentAdmin();
  return hasPermission(admin?.role, permission);
}

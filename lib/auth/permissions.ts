import type { UserRole } from '@/types/auth';

/** Admin portal permission keys (see AGENTS.md section 6). */
export type Permission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.update_status'
  | 'users.suspend'
  | 'users.ban'
  | 'kids.view'
  | 'kids.view_private'
  | 'parents.view'
  | 'mentors.view'
  | 'mentors.approve'
  | 'mentors.reject'
  | 'organizations.view'
  | 'organizations.approve'
  | 'organizations.reject'
  | 'posts.view'
  | 'posts.approve'
  | 'posts.reject'
  | 'posts.hide'
  | 'comments.view'
  | 'comments.approve'
  | 'comments.reject'
  | 'events.view'
  | 'events.approve'
  | 'events.reject'
  | 'opportunities.view'
  | 'opportunities.approve'
  | 'opportunities.reject'
  | 'chat_safety.view'
  | 'chat_safety.review'
  | 'reports.view'
  | 'reports.resolve'
  | 'mentor_assignments.create'
  | 'skills.manage'
  | 'notifications.send'
  | 'analytics.view'
  | 'audit_logs.view'
  | 'admins.manage'
  | 'settings.manage';

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'users.view',
  'users.update_status',
  'users.suspend',
  'users.ban',
  'kids.view',
  'kids.view_private',
  'parents.view',
  'mentors.view',
  'mentors.approve',
  'mentors.reject',
  'organizations.view',
  'organizations.approve',
  'organizations.reject',
  'posts.view',
  'posts.approve',
  'posts.reject',
  'posts.hide',
  'comments.view',
  'comments.approve',
  'comments.reject',
  'events.view',
  'events.approve',
  'events.reject',
  'opportunities.view',
  'opportunities.approve',
  'opportunities.reject',
  'chat_safety.view',
  'chat_safety.review',
  'reports.view',
  'reports.resolve',
  'mentor_assignments.create',
  'skills.manage',
  'notifications.send',
  'analytics.view',
  'audit_logs.view',
  'admins.manage',
  'settings.manage',
];

const SUPER_ADMIN_ONLY: Permission[] = [
  'admins.manage',
  'settings.manage',
  'users.ban',
];

/**
 * Permissions by backend UserRole. The backend exposes only ADMIN and
 * SUPER_ADMIN admin-level roles; per-admin granular RBAC is reserved for a
 * future iteration as documented in AGENTS.md.
 */
export const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter((p) => !SUPER_ADMIN_ONLY.includes(p)),
  KID: [],
  PARENT: [],
  MENTOR: [],
  ORGANIZATION: [],
};

export function hasPermission(
  role: UserRole | undefined | null,
  permission: Permission,
): boolean {
  if (!role) return false;
  return PERMISSIONS_BY_ROLE[role]?.includes(permission) ?? false;
}

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

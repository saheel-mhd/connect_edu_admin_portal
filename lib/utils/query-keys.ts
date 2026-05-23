/** Centralised TanStack Query keys for the admin portal. */
export const queryKeys = {
  currentAdmin: ['currentAdmin'] as const,
  dashboard: ['dashboard'] as const,

  users: (params: Record<string, unknown> = {}) => ['users', params] as const,
  user: (id: string) => ['user', id] as const,

  kids: (params: Record<string, unknown> = {}) => ['kids', params] as const,
  kid: (id: string) => ['kid', id] as const,

  parents: (params: Record<string, unknown> = {}) => ['parents', params] as const,

  mentors: (params: Record<string, unknown> = {}) => ['mentors', params] as const,
  mentorsPending: (params: Record<string, unknown> = {}) =>
    ['mentors', 'pending', params] as const,
  mentor: (id: string) => ['mentor', id] as const,

  organizations: (params: Record<string, unknown> = {}) =>
    ['organizations', params] as const,
  organizationsPending: (params: Record<string, unknown> = {}) =>
    ['organizations', 'pending', params] as const,
  organization: (id: string) => ['organization', id] as const,

  posts: (params: Record<string, unknown> = {}) => ['posts', params] as const,
  postsPending: (params: Record<string, unknown> = {}) =>
    ['posts', 'pending', params] as const,

  comments: (params: Record<string, unknown> = {}) =>
    ['comments', params] as const,
  commentsPending: (params: Record<string, unknown> = {}) =>
    ['comments', 'pending', params] as const,

  events: (params: Record<string, unknown> = {}) => ['events', params] as const,
  eventsPending: (params: Record<string, unknown> = {}) =>
    ['events', 'pending', params] as const,
  event: (id: string) => ['event', id] as const,

  opportunities: (params: Record<string, unknown> = {}) =>
    ['opportunities', params] as const,
  opportunitiesPending: (params: Record<string, unknown> = {}) =>
    ['opportunities', 'pending', params] as const,

  reports: (params: Record<string, unknown> = {}) => ['reports', params] as const,
  report: (id: string) => ['report', id] as const,

  chatSafety: (params: Record<string, unknown> = {}) =>
    ['chat-safety', params] as const,

  mentorAssignments: (params: Record<string, unknown> = {}) =>
    ['mentor-assignments', params] as const,

  skills: (params: Record<string, unknown> = {}) => ['skills', params] as const,

  notifications: (params: Record<string, unknown> = {}) =>
    ['notifications', params] as const,

  analytics: {
    overview: ['analytics', 'overview'] as const,
    users: ['analytics', 'users'] as const,
    skills: ['analytics', 'skills'] as const,
    events: ['analytics', 'events'] as const,
    safety: ['analytics', 'safety'] as const,
  },

  auditLogs: (params: Record<string, unknown> = {}) =>
    ['audit-logs', params] as const,

  admins: (params: Record<string, unknown> = {}) => ['admins', params] as const,

  settings: ['settings'] as const,
};

'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  kids: 'Kids',
  parents: 'Parents',
  mentors: 'Mentors',
  organizations: 'Organizations',
  'mentor-assignments': 'Mentor assignments',
  posts: 'Posts',
  comments: 'Comments',
  events: 'Events',
  opportunities: 'Opportunities',
  reports: 'Reports',
  'chat-safety': 'Chat safety',
  rooms: 'Rooms',
  messages: 'Messages',
  skills: 'Skills',
  notifications: 'Notifications',
  analytics: 'Analytics',
  safety: 'Safety',
  'audit-logs': 'Audit logs',
  admins: 'Admins',
  settings: 'Settings',
  platform: 'Platform',
  account: 'Account',
  security: 'Security',
  pending: 'Pending',
  flagged: 'Flagged',
  create: 'Create',
  edit: 'Edit',
};

function labelFor(segment: string): string {
  return (
    LABELS[segment] ??
    segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function isLikelyId(segment: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(segment) && segment.length >= 12;
}

interface Crumb {
  href: string;
  label: string;
  isLast: boolean;
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  let acc = '';
  return parts.map((part, index) => {
    acc += `/${part}`;
    return {
      href: acc,
      label: isLikelyId(part) ? `${part.slice(0, 8)}…` : labelFor(part),
      isLast: index === parts.length - 1,
    };
  });
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === '/' || pathname === '/dashboard') return null;
  const crumbs = buildCrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500"
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-100 hover:text-slate-800"
      >
        <Home className="h-3 w-3" /> Dashboard
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-slate-300" />
          {crumb.isLast ? (
            <span className="rounded px-1 py-0.5 font-medium text-slate-700">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="rounded px-1 py-0.5 hover:bg-slate-100 hover:text-slate-800"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

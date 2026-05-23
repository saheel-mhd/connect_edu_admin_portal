'use client';

import {
  AlertOctagon,
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Briefcase,
  Building2,
  GraduationCap,
  Baby,
  UserCircle2,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { hasPermission, type Permission } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard.view',
      },
    ],
  },
  {
    title: 'User management',
    items: [
      { label: 'Users', href: '/users', icon: Users, permission: 'users.view' },
      { label: 'Kids', href: '/kids', icon: Baby, permission: 'kids.view' },
      {
        label: 'Parents',
        href: '/parents',
        icon: UserCircle2,
        permission: 'parents.view',
      },
      {
        label: 'Mentors',
        href: '/mentors',
        icon: GraduationCap,
        permission: 'mentors.view',
      },
      {
        label: 'Organizations',
        href: '/organizations',
        icon: Building2,
        permission: 'organizations.view',
      },
    ],
  },
  {
    title: 'Content moderation',
    items: [
      { label: 'Posts', href: '/posts', icon: FileText, permission: 'posts.view' },
      {
        label: 'Comments',
        href: '/comments',
        icon: MessageSquare,
        permission: 'comments.view',
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: AlertOctagon,
        permission: 'reports.view',
      },
      {
        label: 'Chat safety',
        href: '/chat-safety',
        icon: ShieldAlert,
        permission: 'chat_safety.view',
      },
    ],
  },
  {
    title: 'Events & opportunities',
    items: [
      {
        label: 'Events',
        href: '/events',
        icon: Calendar,
        permission: 'events.view',
      },
      {
        label: 'Opportunities',
        href: '/opportunities',
        icon: Briefcase,
        permission: 'opportunities.view',
      },
    ],
  },
  {
    title: 'Skill growth',
    items: [
      { label: 'Skills', href: '/skills', icon: Tag, permission: 'skills.manage' },
      {
        label: 'Mentor assignments',
        href: '/mentor-assignments',
        icon: CheckSquare,
        permission: 'mentor_assignments.create',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Notifications',
        href: '/notifications',
        icon: Bell,
        permission: 'notifications.send',
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        permission: 'analytics.view',
      },
      {
        label: 'Audit logs',
        href: '/audit-logs',
        icon: ScrollText,
        permission: 'audit_logs.view',
      },
      {
        label: 'Admins',
        href: '/admins',
        icon: ShieldCheck,
        permission: 'admins.manage',
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        permission: 'settings.manage',
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin } = useCurrentAdmin();
  const role = admin?.role;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <Sparkles className="h-5 w-5 text-brand-600" />
        <span className="text-sm font-semibold text-slate-900">
          Connect Edu Admin
        </span>
      </div>
      <nav className="px-3 py-4">
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            hasPermission(role, item.permission),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                          active
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-700 hover:bg-slate-100',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

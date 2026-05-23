# Connect Edu — Admin Portal

Internal admin control center for the Connect Edu platform. Built per
[`agents.md`](./agents.md) — a child-safety operations console for admins,
moderators, safety reviewers, support agents, content/event reviewers, and
analysts.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · TanStack Query · TanStack
Table · React Hook Form · Zod · Recharts · lucide-react.

## Architecture

The portal is a **BFF**: the browser only talks to Next.js Route Handlers under
`/api/auth/*` and `/api/backend/[...path]`, which attach the session token from
an httpOnly cookie and forward to the backend API. Tokens never live in browser
storage.

- **Auth** — `/api/auth/login` proxies to backend `/auth/login`, enforces the
  admin/super-admin role, and sets `connect_edu_admin_session` +
  `connect_edu_admin_refresh` httpOnly cookies.
- **Middleware** redirects unauthenticated users to `/login` and authenticated
  users away from auth pages.
- **Permissions** — RBAC permission keys (`mentors.approve`, `users.ban`, …)
  derived from backend `UserRole` (super-admin gets all; admin gets all except
  `admins.manage` / `settings.manage` / `users.ban`).
- **Security headers** — `X-Frame-Options: DENY`, `X-Robots-Tag: noindex`,
  `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`.

## Setup

```bash
npm install
cp .env.example .env.local      # BACKEND_API_URL defaults to http://localhost:4000
npm run dev                     # http://localhost:3001
```

The backend must be running at `BACKEND_API_URL` (defaults `:4000`).

Sign in with any backend user whose role is `ADMIN` or `SUPER_ADMIN`. Seed
credentials from the backend seed: `admin@example.com / ChangeMe123!`.

## Project layout

```
app/
  layout.tsx  page.tsx  globals.css  not-found.tsx  error.tsx
  api/
    auth/{login,logout,refresh,me}/route.ts   # session BFF
    backend/[...path]/route.ts                # authenticated proxy
  (auth)/
    login/  mfa/  forgot-password/  reset-password/
  (protected)/
    layout.tsx           # requires admin; renders sidebar + header
    dashboard/
    users/  kids/  parents/
    mentors/  organizations/  mentor-assignments/
    posts/  comments/
    events/  opportunities/
    reports/  chat-safety/
    skills/  notifications/
    analytics/{users,skills,events,safety}/
    audit-logs/
    admins/  settings/{safety,platform}/
    access-denied/
components/
  ui/                    # Button, Input, Label, Select, Textarea, Card, Badge, Modal, Spinner, Skeleton
  badges/StatusBadges.tsx
  tables/{DataTable,TablePagination}.tsx
  modals/{ConfirmActionModal,ReasonRequiredModal}.tsx
  safety/{SensitiveDataReveal,FlaggedTextHighlighter}.tsx
  layout/{AdminSidebar,AdminHeader,PageHeader}.tsx
  shared/{PermissionGate,states}.tsx
  providers/QueryProvider.tsx
lib/
  api/{api-client,api-errors}.ts
  auth/{session,permissions,server}.ts
  utils/{format,query-keys}.ts
  utils.ts (cn)
hooks/  types/
middleware.ts  next.config.mjs  tailwind.config.ts
```

## Conventions

- Pages live under `app/(protected)/<path>/page.tsx`. Server Components use
  `serverFetch()`; Client Components use `apiFetch()` through the BFF proxy.
- Every list page uses `<DataTable>` + `TablePagination`. Loading/empty/error
  states use the shared helpers.
- Sensitive child data is masked by default. Revealing requires a reason and is
  audit-logged on the backend (`<SensitiveDataReveal>`).
- Approve actions use `<ConfirmActionModal>`; reject / hide / restrict /
  resolve / dismiss / escalate / status-change actions all use
  `<ReasonRequiredModal>` so a reason is always sent to the audit log.

## Build

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build
```

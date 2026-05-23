import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RoleBadge } from '@/components/badges/StatusBadges';
import { FlaggedTextHighlighter } from '@/components/safety/FlaggedTextHighlighter';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { UserRole } from '@/types/auth';
import { RoomActions } from './RoomActions';

interface RoomMember {
  id: string;
  userId?: string | null;
  name?: string | null;
  role?: UserRole | null;
}

interface RoomMessage {
  id: string;
  text?: string | null;
  content?: string | null;
  safetyFlagged?: boolean | null;
  createdAt: string;
  sender?: { id: string; name?: string | null; role?: UserRole | null } | null;
}

interface RoomDetail {
  id: string;
  type?: string | null;
  safetyStatus?: string | null;
  createdById?: string | null;
  createdAt: string;
  members?: RoomMember[];
  messages?: RoomMessage[];
}

export const dynamic = 'force-dynamic';

export default async function ChatRoomDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let room: RoomDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<RoomDetail>>(
      `/admin/chat-safety/rooms/${params.id}`,
    );
    room = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load room';
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/chat-safety/flagged"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to flagged messages
        </Link>
      </div>

      <PageHeader
        title={room ? `Chat room #${room.id.slice(0, 8)}` : 'Chat room'}
        description="Read-only safety review of a chat room."
        actions={room ? <RoomActions roomId={room.id} /> : undefined}
      />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-sm font-medium text-amber-900">
          Reviewing chat context — this view is audit-logged.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {room && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Room</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  ID
                </span>
                <br />
                <span className="font-mono text-xs text-slate-700">
                  {room.id}
                </span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Type
                </span>
                <br />
                <span className="text-slate-800">{room.type ?? '—'}</span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Safety status
                </span>
                <br />
                {room.safetyStatus ? (
                  <Badge
                    tone={
                      room.safetyStatus === 'RESTRICTED'
                        ? 'danger'
                        : room.safetyStatus === 'FLAGGED'
                          ? 'critical'
                          : 'neutral'
                    }
                  >
                    {room.safetyStatus}
                  </Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Created by
                </span>
                <br />
                <span className="font-mono text-xs text-slate-700">
                  {room.createdById ?? '—'}
                </span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Created
                </span>
                <br />
                <span className="text-slate-800">
                  {formatDateTime(room.createdAt)}
                </span>
              </p>
            </CardBody>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardBody>
              {room.members && room.members.length > 0 ? (
                <ul className="divide-y divide-slate-100 text-sm">
                  {room.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <span className="font-medium text-slate-900">
                        {member.name ?? member.userId ?? 'Unknown'}
                      </span>
                      {member.role && <RoleBadge role={member.role} />}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No members listed.</p>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardBody>
              {room.messages && room.messages.length > 0 ? (
                <ol className="space-y-3">
                  {room.messages.map((message) => (
                    <li
                      key={message.id}
                      className="rounded-md border border-slate-100 bg-white p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-800">
                          {message.sender?.name ?? 'Unknown sender'}
                        </span>
                        {message.sender?.role && (
                          <RoleBadge role={message.sender.role} />
                        )}
                        <span>{formatDateTime(message.createdAt)}</span>
                        {message.safetyFlagged && (
                          <Badge tone="critical">FLAGGED</Badge>
                        )}
                      </div>
                      <FlaggedTextHighlighter
                        text={message.text ?? message.content ?? null}
                      />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No messages.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

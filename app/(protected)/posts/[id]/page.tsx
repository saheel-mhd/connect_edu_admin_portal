import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ModerationStatusBadge,
  RoleBadge,
} from '@/components/badges/StatusBadges';
import { FlaggedTextHighlighter } from '@/components/safety/FlaggedTextHighlighter';
import { ErrorState } from '@/components/shared/states';
import { serverFetch } from '@/lib/auth/server';
import { formatDateTime, maskEmail } from '@/lib/utils/format';
import type { ApiSuccess } from '@/types/api';
import type { ModerationStatus } from '@/types/admin';
import type { UserRole } from '@/types/auth';
import { PostActions } from './PostActions';

export const dynamic = 'force-dynamic';

type PostType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'PROJECT'
  | 'ACHIEVEMENT'
  | 'EVENT'
  | 'OPPORTUNITY'
  | 'REPOST';

type MediaType = 'IMAGE' | 'VIDEO' | string;

interface PostMedia {
  id: string;
  fileUrl: string;
  type?: MediaType | null;
  mediaType?: MediaType | null;
}

interface PostSkill {
  id: string;
  skill: { id: string; name: string };
}

interface PostAuthor {
  id: string;
  name: string;
  role: UserRole;
  email?: string | null;
}

interface AdminPostDetail {
  id: string;
  type: PostType;
  caption?: string | null;
  moderationStatus: ModerationStatus;
  safetyScore: number;
  qualityScore?: number | null;
  createdAt: string;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  repostCount?: number | null;
  saveCount?: number | null;
  viewCount?: number | null;
  media?: PostMedia[] | null;
  skills?: PostSkill[] | null;
  author?: PostAuthor | null;
}

function isVideo(media: PostMedia): boolean {
  const value = (media.type ?? media.mediaType ?? '').toString().toUpperCase();
  if (value === 'VIDEO') return true;
  return /\.(mp4|mov|webm|m4v|avi)(\?.*)?$/i.test(media.fileUrl);
}

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let post: AdminPostDetail | null = null;
  let error: string | null = null;
  try {
    const res = await serverFetch<ApiSuccess<AdminPostDetail>>(
      `/admin/posts/${params.id}`,
    );
    post = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load post';
  }

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
      </div>

      <PageHeader
        title="Post detail"
        description="Review post content, media, and moderation status."
        actions={post ? <PostActions postId={post.id} /> : undefined}
      />

      {error && (
        <Card className="mb-4 border-red-200">
          <CardBody>
            <ErrorState description={error} />
          </CardBody>
        </Card>
      )}

      {post && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {post.author?.name ?? 'Unknown author'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {maskEmail(post.author?.email)}
                    </p>
                  </div>
                  {post.author?.role && <RoleBadge role={post.author.role} />}
                  <Badge tone="neutral">{post.type}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Caption
                  </p>
                  <FlaggedTextHighlighter text={post.caption} />
                </div>
              </CardBody>
            </Card>

            {post.media && post.media.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {post.media.map((media) =>
                      isVideo(media) ? (
                        <a
                          key={media.id}
                          href={media.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <Film className="h-6 w-6 text-slate-500" />
                          <span>Open video</span>
                        </a>
                      ) : (
                        <a
                          key={media.id}
                          href={media.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={media.fileUrl}
                            alt="Post media"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ),
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {post.skills && post.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {post.skills.map((s) => (
                      <Badge key={s.id} tone="neutral">
                        {s.skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Moderation</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <DetailRow label="Status">
                  <ModerationStatusBadge status={post.moderationStatus} />
                </DetailRow>
                <DetailRow label="Safety score">
                  {post.safetyScore.toFixed(2)}
                </DetailRow>
                <DetailRow label="Quality score">
                  {post.qualityScore != null
                    ? post.qualityScore.toFixed(2)
                    : '—'}
                </DetailRow>
                <DetailRow label="Created">
                  <span className="text-xs text-slate-500">
                    {formatDateTime(post.createdAt)}
                  </span>
                </DetailRow>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Likes" value={post.likeCount ?? 0} />
                  <Stat label="Comments" value={post.commentCount ?? 0} />
                  <Stat label="Shares" value={post.shareCount ?? 0} />
                  <Stat label="Reposts" value={post.repostCount ?? 0} />
                  <Stat label="Saves" value={post.saveCount ?? 0} />
                  <Stat label="Views" value={post.viewCount ?? 0} />
                </dl>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-slate-800">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

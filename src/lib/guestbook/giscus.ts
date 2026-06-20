import type { GuestNote } from './types';
import { buildBackendUrl } from '@/config/backend.config';

interface GiscusAuthor {
  login: string;
  avatarUrl: string;
  url: string;
}

interface GiscusReply {
  id: string;
  createdAt: string;
  bodyHTML: string;
  author: GiscusAuthor;
}

interface GiscusComment {
  id: string;
  createdAt: string;
  bodyHTML: string;
  author: GiscusAuthor;
  replies: GiscusReply[];
}

interface GiscusResponse {
  error?: string;
  discussion?: {
    comments: GiscusComment[];
  };
}

function stripHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() ?? '';
}

function commentToNote(c: { id: string; createdAt: string; bodyHTML: string; author: GiscusAuthor }): GuestNote {
  const text = stripHTML(c.bodyHTML);
  return {
    id: c.id,
    userId: c.author.login,
    userName: c.author.login,
    avatarUrl: c.author.avatarUrl,
    content: text || '(空)',
    createdAt: Date.parse(c.createdAt) / 1000,
  };
}

export async function fetchGiscusNotes(): Promise<GuestNote[]> {
  const url = buildBackendUrl('/api/giscus-proxy');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data: GiscusResponse = await res.json();
  if (data.error || !data.discussion) return [];

  // 只把「直接评论」(顶层 comment) 渲染成便签上墙;
  // 「跟帖回复」(comment.replies) 不上墙,仍会在下方 Giscus 评论区正常显示。
  const notes: GuestNote[] = [];
  for (const comment of data.discussion.comments) {
    notes.push(commentToNote(comment));
  }
  return notes;
}

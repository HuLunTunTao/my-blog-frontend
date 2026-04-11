import type { GuestNote } from './types';

const GISCUS_API = 'https://giscus.app/api/discussions';
const REPO = 'Shao-Xian-Cao/blog-comments';
const TERM = 'fading-note-guestbook';
const CATEGORY = 'Announcements';

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
  const url = `${GISCUS_API}?repo=${encodeURIComponent(REPO)}&term=${encodeURIComponent(TERM)}&category=${encodeURIComponent(CATEGORY)}&first=100`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data: GiscusResponse = await res.json();
  if (data.error || !data.discussion) return [];

  const notes: GuestNote[] = [];
  for (const comment of data.discussion.comments) {
    notes.push(commentToNote(comment));
    if (comment.replies) {
      for (const reply of comment.replies) {
        notes.push(commentToNote(reply));
      }
    }
  }
  return notes;
}

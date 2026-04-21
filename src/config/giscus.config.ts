const env = import.meta.env;

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  guestbookTerm: string;
}

export const giscusConfig: GiscusConfig = {
  repo: env.VITE_GISCUS_REPO ?? "",
  repoId: env.VITE_GISCUS_REPO_ID ?? "",
  category: env.VITE_GISCUS_CATEGORY ?? "Announcements",
  categoryId: env.VITE_GISCUS_CATEGORY_ID ?? "",
  guestbookTerm: env.VITE_GISCUS_GUESTBOOK_TERM ?? "fading-note-guestbook",
};

export function isGiscusConfigured(): boolean {
  return !!(giscusConfig.repo && giscusConfig.repoId);
}

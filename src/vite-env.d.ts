/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_TITLE?: string;
  readonly VITE_SITE_LOGO?: string;
  readonly VITE_AUTHOR_NAME?: string;
  readonly VITE_AUTHOR_AVATAR?: string;
  readonly VITE_AUTHOR_BIO?: string;
  readonly VITE_AUTHOR_MOTTO?: string;
  readonly VITE_SOCIAL_LINKS?: string;
  readonly VITE_GISCUS_REPO?: string;
  readonly VITE_GISCUS_REPO_ID?: string;
  readonly VITE_GISCUS_CATEGORY?: string;
  readonly VITE_GISCUS_CATEGORY_ID?: string;
  readonly VITE_GISCUS_GUESTBOOK_TERM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism';

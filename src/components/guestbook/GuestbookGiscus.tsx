import { useEffect, useRef } from 'react';
import giscusThemeCss from '@/styles/giscus-theme.css?raw';
import type { ResolvedTheme } from '@/context/ThemeContext';

const GISCUS_THEME_DATA_URL = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeCss)}`;

interface GuestbookGiscusProps {
  theme: ResolvedTheme;
  onDiscussionUpdate?: () => void;
}

export function GuestbookGiscus({ theme, onDiscussionUpdate }: GuestbookGiscusProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const callbackRef = useRef(onDiscussionUpdate);
  callbackRef.current = onDiscussionUpdate;
  const mountedRef = useRef(false);

  const giscusTheme = theme === 'dark' ? 'dark' : GISCUS_THEME_DATA_URL;

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const el = containerRef.current;
    if (!el) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Shao-Xian-Cao/blog-comments');
    script.setAttribute('data-repo-id', 'R_kgDOROYfPA');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'DIC_kwDOROYfPM4C2Q05');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', 'fading-note-guestbook');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', themeRef.current === 'dark' ? 'dark' : GISCUS_THEME_DATA_URL);
    script.setAttribute('data-lang', 'zh-CN');
    script.crossOrigin = 'anonymous';
    script.async = true;
    el.appendChild(script);
  }, []);

  // Listen for giscus discussion updates to re-fetch notes.
  useEffect(() => {
    let knownCount: number | null = null;

    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://giscus.app') return;
      const disc = e.data?.giscus?.discussion;
      if (!disc) return;

      const count = (disc.totalCommentCount ?? 0) + (disc.totalReplyCount ?? 0);

      if (knownCount === null) {
        knownCount = count;
        return;
      }

      if (count !== knownCount) {
        knownCount = count;
        callbackRef.current?.();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Hot-swap theme on the existing iframe.
  useEffect(() => {
    const targetTheme = themeRef.current === 'dark' ? 'dark' : GISCUS_THEME_DATA_URL;

    const sendTheme = () => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        'iframe.giscus-frame'
      );
      if (!iframe?.contentWindow) return false;
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: targetTheme } } },
        'https://giscus.app'
      );
      return true;
    };

    if (sendTheme()) return;

    const timers = [500, 1500, 3000].map((delay) =>
      setTimeout(() => sendTheme(), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [giscusTheme]);

  return <div ref={containerRef} className="giscus" />;
}

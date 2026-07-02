import { useEffect, useRef } from 'react';
import giscusThemeCss from '@/styles/giscus-theme.css?raw';
import giscusThemeDarkCss from '@/styles/giscus-theme-dark.css?raw';
import type { ResolvedTheme } from '@/context/ThemeContext';
import { giscusConfig, isGiscusConfigured } from '@/config/giscus.config';

const GISCUS_THEME_LIGHT = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeCss)}`;
const GISCUS_THEME_DARK = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeDarkCss)}`;

function resolveGiscusTheme(theme: ResolvedTheme): string {
  return theme === 'dark' ? GISCUS_THEME_DARK : GISCUS_THEME_LIGHT;
}

interface GuestbookGiscusProps {
  theme: ResolvedTheme;
  onDiscussionUpdate?: () => void;
}

export function GuestbookGiscus({ theme, onDiscussionUpdate }: GuestbookGiscusProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onDiscussionUpdate);
  callbackRef.current = onDiscussionUpdate;
  const mountedRef = useRef(false);

  const giscusTheme = resolveGiscusTheme(theme);

  // Mount the giscus script once.
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const host = hostRef.current;
    if (!host || !isGiscusConfigured()) return;

    const mount = document.createElement('div');
    mount.className = 'giscus';
    host.replaceChildren(mount);

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', giscusConfig.repo);
    script.setAttribute('data-repo-id', giscusConfig.repoId);
    script.setAttribute('data-category', giscusConfig.category);
    script.setAttribute('data-category-id', giscusConfig.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', giscusConfig.guestbookTerm);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'zh-CN');
    script.crossOrigin = 'anonymous';
    script.async = true;
    mount.appendChild(script);

    return () => {
      if (mount.parentNode === host) {
        host.removeChild(mount);
      }
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Hot-swap theme on the already-rendered iframe.
  useEffect(() => {
    const sendTheme = () => {
      const iframe = hostRef.current?.querySelector<HTMLIFrameElement>(
        'iframe.giscus-frame'
      );
      if (!iframe?.contentWindow) return false;
      try {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme: giscusTheme } } },
          'https://giscus.app'
        );
        return true;
      } catch {
        return false;
      }
    };

    if (sendTheme()) return;

    const timers = [500, 1500, 3000].map((delay) =>
      setTimeout(() => sendTheme(), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [giscusTheme]);

  if (!isGiscusConfigured()) return null;

  return <div ref={hostRef} />;
}

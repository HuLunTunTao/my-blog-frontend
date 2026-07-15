import { useEffect, useRef, useState } from "react";
import giscusThemeCss from "@/styles/giscus-theme.css?raw";
import giscusThemeDarkCss from "@/styles/giscus-theme-dark.css?raw";
import { useTheme } from "@/context/theme";
import { giscusConfig, isGiscusConfigured } from "@/config/giscus.config";

interface GiscusCommentsProps {
  commentId?: string;
  slug?: string;
}

const GISCUS_SCRIPT_SRC = "https://giscus.app/client.js";
const GISCUS_THEME_LIGHT = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeCss)}`;
const GISCUS_THEME_DARK = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeDarkCss)}`;

let warmedUp = false;

function ensureHeadLink(rel: string, href: string, crossOrigin?: string, asType?: string): void {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }
  if (asType) {
    link.as = asType;
  }
  document.head.appendChild(link);
}

function warmupGiscusResources(): void {
  if (typeof window === "undefined" || warmedUp) {
    return;
  }

  ensureHeadLink("dns-prefetch", "//giscus.app");
  ensureHeadLink("preconnect", "https://giscus.app", "anonymous");
  warmedUp = true;
}

export default function GiscusComments({ commentId, slug }: GiscusCommentsProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const discussionTerm = (commentId || slug || "").trim();
  const { resolvedTheme } = useTheme();
  const giscusTheme = resolvedTheme === "dark" ? GISCUS_THEME_DARK : GISCUS_THEME_LIGHT;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldLoad) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    warmupGiscusResources();
    const host = hostRef.current;
    if (!discussionTerm || !host || !isGiscusConfigured()) {
      return;
    }

    const mount = document.createElement("div");
    mount.className = "giscus";
    host.replaceChildren(mount);

    const script = document.createElement("script");
    script.src = GISCUS_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.setAttribute("data-repo", giscusConfig.repo);
    script.setAttribute("data-repo-id", giscusConfig.repoId);
    script.setAttribute("data-category", giscusConfig.category);
    script.setAttribute("data-category-id", giscusConfig.categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", discussionTerm);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", giscusTheme);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");

    mount.appendChild(script);

    return () => {
      if (mount.parentNode === host) {
        host.removeChild(mount);
      }
    };
  }, [discussionTerm, giscusTheme, shouldLoad]);

  // Hot-swap the theme on an already-rendered giscus iframe without reloading
  useEffect(() => {
    const iframe = hostRef.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        "https://giscus.app"
      );
    } catch {
      // iframe may not have navigated to giscus.app yet — ignore
    }
  }, [giscusTheme]);

  if (!discussionTerm || !isGiscusConfigured()) {
    return null;
  }

  return (
    <section id="comments" ref={sectionRef} className="mt-12 min-h-[280px] scroll-mt-24 border-t border-stone-300/60 pt-10 dark:border-stone-700/60">
      <h2 className="text-xl font-serif mb-6">评论</h2>
      {!shouldLoad && <p className="text-sm text-subtle">滚动到评论区后加载评论。</p>}
      <div ref={hostRef} />
    </section>
  );
}

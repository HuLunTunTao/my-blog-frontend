import { useEffect, useRef } from "react";
import giscusThemeCss from "@/styles/giscus-theme.css?raw";
import { useTheme } from "@/context/ThemeContext";

interface GiscusCommentsProps {
  commentId?: string;
  slug?: string;
}

const GISCUS_SCRIPT_SRC = "https://giscus.app/client.js";
const GISCUS_THEME_DATA_URL = `data:text/css;charset=utf-8,${encodeURIComponent(giscusThemeCss)}`;

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

export function warmupGiscusResources(): void {
  if (typeof window === "undefined" || warmedUp) {
    return;
  }

  ensureHeadLink("dns-prefetch", "//giscus.app");
  ensureHeadLink("preconnect", "https://giscus.app", "anonymous");
  warmedUp = true;
}

export default function GiscusComments({ commentId, slug }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const discussionTerm = (commentId || slug || "").trim();
  const { resolvedTheme } = useTheme();
  const giscusTheme = resolvedTheme === "dark" ? "dark" : GISCUS_THEME_DATA_URL;

  useEffect(() => {
    warmupGiscusResources();
    if (!discussionTerm || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = GISCUS_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.setAttribute("data-repo", "Shao-Xian-Cao/blog-comments");
    script.setAttribute("data-repo-id", "R_kgDOROYfPA");
    script.setAttribute("data-category", "Announcements");
    script.setAttribute("data-category-id", "DIC_kwDOROYfPM4C2Q05");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", discussionTerm);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", giscusTheme);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "eager");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [discussionTerm, giscusTheme]);

  // Hot-swap the theme on an already-rendered giscus iframe without reloading
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme } } },
      "https://giscus.app"
    );
  }, [giscusTheme]);

  if (!discussionTerm) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-stone-300/60 dark:border-stone-700/60 pt-10">
      <h2 className="text-xl font-serif mb-6">评论</h2>
      <div ref={containerRef} />
    </section>
  );
}

import { useEffect } from "react";
import { siteConfig } from "@/config/site.config";

const SITE_ORIGIN = "https://blog.hltt.online";
const SITE_TITLE = siteConfig.title;

export interface PageMetaOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  robots?: "index" | "noindex" | "noindex,nofollow";
  ogType?: "website" | "article";
}

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  const selector = `meta[${attr}="${name}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function removeMeta(name: string, attr: "name" | "property" = "name") {
  document.querySelector(`meta[${attr}="${name}"]`)?.remove();
}

export function applyPageMeta(options: PageMetaOptions) {
  const {
    title = SITE_TITLE,
    description = "囫囵吞桃的个人博客，记录计算机技术、学习笔记、项目实践与日常思考。",
    canonicalPath = "/",
    robots = "index",
    ogType = "website",
  } = options;

  const pageTitle = title === SITE_TITLE ? title : `${title} - ${SITE_TITLE}`;
  const canonicalURL = new URL(canonicalPath, SITE_ORIGIN).href;

  document.title = pageTitle;
  upsertMeta("description", description);
  upsertLink("canonical", canonicalURL);

  if (robots === "index") {
    removeMeta("robots");
  } else {
    upsertMeta("robots", robots);
  }

  upsertMeta("og:title", pageTitle, "property");
  upsertMeta("og:description", description, "property");
  upsertMeta("og:url", canonicalURL, "property");
  upsertMeta("og:type", ogType, "property");
  upsertMeta("og:site_name", SITE_TITLE, "property");
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    applyPageMeta(options);
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.robots,
    options.ogType,
  ]);
}

export { SITE_ORIGIN, SITE_TITLE };

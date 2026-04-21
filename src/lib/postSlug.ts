import type { Post } from "./api";

export function encodeSlugForPath(slug: string): string {
  return slug
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function decodeSlugFromPath(pathParam: string | undefined): string {
  if (!pathParam) return "";
  return pathParam
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .join("/");
}

export function toShortPostRoute(shortId: string): string {
  return `/p/${shortId}`;
}

export function toPostRoute(input: Post | string): string {
  if (typeof input === "string") {
    return `/posts/${encodeSlugForPath(input)}`;
  }
  if (input.shortId) {
    return toShortPostRoute(input.shortId);
  }
  return `/posts/${encodeSlugForPath(input.slug)}`;
}

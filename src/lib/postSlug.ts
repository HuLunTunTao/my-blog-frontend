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

export function toPostRoute(slug: string): string {
  return `/posts/${encodeSlugForPath(slug)}`;
}

const DEFAULT_BACKEND_ORIGIN = "http://localhost:8080";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeBackendOrigin(rawValue?: string): string {
  const value = rawValue?.trim();
  if (!value) return DEFAULT_BACKEND_ORIGIN;

  if (/^https?:\/\//i.test(value)) {
    return trimTrailingSlash(value);
  }

  const isLocalAddress = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(value);
  const scheme = isLocalAddress ? "http" : "https";
  return trimTrailingSlash(`${scheme}://${value}`);
}

const backendOrigin = normalizeBackendOrigin(import.meta.env.VITE_API_BASE_URL);
export const apiBaseUrl = `${backendOrigin}/api`;

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendOrigin}${normalizedPath}`;
}

const STORAGE_KEY = "blog-admin-session";

export interface AdminSession {
  token: string;
  expiresAt: string;
}

export function loadAdminSession(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

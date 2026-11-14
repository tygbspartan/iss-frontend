import type { Credentials } from "./authSlice";

// localStorage access for the admin session. Every call is wrapped: storage
// can be unavailable (private mode, blocked site data) and that must not crash.

const KEY = "iss_admin_session";

// Reads `exp` from the JWT payload so an expired token is dropped without a
// round trip. The backend still verifies the signature on every request.
const isExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const authStorage = {
  load(): Credentials | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Credentials;
      if (!session.token || !session.user || isExpired(session.token)) {
        localStorage.removeItem(KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
  save(session: Credentials) {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* session just won't survive a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

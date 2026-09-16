/**
 * Same-origin post-login path only.
 *
 * Login?redirect= and sessionStorage loginRedirect are attacker-controlled.
 * Protocol-relative values like `//evil.com` pass a naive "starts with /" check.
 * React Router's history.push then falls back to window.location.assign() when
 * pushState throws SecurityError — a live open redirect after sign-in.
 *
 * @param {string|null|undefined} raw
 * @param {string} [origin] - document origin; defaults to window.location.origin
 * @returns {string|null} pathname + search + hash on this origin, else null
 */
export function safeRedirectPath(raw, origin) {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const base =
    origin ||
    (typeof window !== 'undefined' && window.location && window.location.origin) ||
    '';
  if (!base) return null;

  let parsed;
  try {
    parsed = new URL(trimmed, base);
  } catch {
    return null;
  }

  if (parsed.origin !== base) return null;
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path === '/') return null;
  if (isLoginPath(parsed.pathname)) return null;
  return path;
}

function isLoginPath(pathname) {
  const p = String(pathname || '');
  return p === '/Login' || p.startsWith('/Login/') || /^\/(?:kr|us|jp)\/Login(?:\/|$)/i.test(p);
}

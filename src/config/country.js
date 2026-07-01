/**
 * Multi-country platform configuration layer.
 *
 * Safe, additive resolver for the "active country" — no schema, Firebase,
 * or auth changes. Used to read display-only values (app name, country
 * name, currency, default phone prefix, city/address labels) so the same
 * codebase can serve /kr, /us, /jp without forking.
 *
 * Resolution order:
 *   1. `VITE_ACTIVE_COUNTRY` env var, if set to a known country code.
 *   2. First path segment of the current URL (e.g. `/kr/...`, `/us/...`),
 *      if it matches a known country code.
 *   3. Root path `/` — always KR. Never affected by stored preference, so
 *      the existing production Zarkorea homepage never changes behavior.
 *   4. Any other path (e.g. `/Login`, `/CreateListing`) — the country
 *      last chosen via the country selector (localStorage), if any, so
 *      the selection stays consistent while browsing.
 *   5. Fallback to KR.
 */
import { kr } from './countries/kr';
import { us } from './countries/us';
import { jp } from './countries/jp';

/** Registry of all known country configs, keyed by countryCode. */
export const COUNTRIES = {
  KR: kr,
  US: us,
  JP: jp,
};

export const DEFAULT_COUNTRY_CODE = 'KR';

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

/** Extracts a known country code from a URL path like `/kr` or `/kr/listing/1`. */
export function countryCodeFromPath(pathname) {
  if (!pathname) return null;
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  const code = normalizeCode(firstSegment);
  return COUNTRIES[code] ? code : null;
}

function isRootPath(pathname) {
  if (!pathname) return true;
  return pathname.split('/').filter(Boolean).length === 0;
}

function envActiveCountryCode() {
  try {
    const envCode = normalizeCode(import.meta.env?.VITE_ACTIVE_COUNTRY);
    return COUNTRIES[envCode] ? envCode : null;
  } catch {
    return null;
  }
}

/**
 * localStorage persistence for the user's last-selected country (country
 * selector UI). Read by `resolveActiveCountryCode()` only for non-root
 * paths that don't already carry a country in the URL — root `/` and any
 * `/kr`, `/us`, `/jp` path always take priority. All access is safe/no-throw
 * (private browsing, storage disabled, SSR).
 */
const STORED_COUNTRY_KEY = 'zarkorea_active_country';

export function getStoredCountryCode() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const stored = normalizeCode(window.localStorage.getItem(STORED_COUNTRY_KEY));
    return COUNTRIES[stored] ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredCountryCode(code) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const normalized = normalizeCode(code);
    if (COUNTRIES[normalized]) {
      window.localStorage.setItem(STORED_COUNTRY_KEY, normalized);
    }
  } catch {
    // Ignore — storage may be unavailable (private browsing, quota, etc.)
  }
}

/**
 * Resolves the active country code. Safe to call outside the browser
 * (SSR/build) — falls back to KR whenever `window` isn't available.
 * @param {string} [pathnameOverride] - Pass the current route's pathname
 *   (e.g. from `useLocation()`) so callers can recompute reactively on
 *   navigation. Defaults to `window.location.pathname`.
 */
export function resolveActiveCountryCode(pathnameOverride) {
  const envCode = envActiveCountryCode();
  if (envCode) return envCode;

  const pathname =
    pathnameOverride ?? (typeof window !== 'undefined' && window.location ? window.location.pathname : '');

  const pathCode = countryCodeFromPath(pathname);
  if (pathCode) return pathCode;

  if (!isRootPath(pathname)) {
    const storedCode = getStoredCountryCode();
    if (storedCode) return storedCode;
  }

  return DEFAULT_COUNTRY_CODE;
}

/**
 * Resolves the full active country config object.
 * @param {string} [pathnameOverride] - See `resolveActiveCountryCode()`.
 */
export function getActiveCountry(pathnameOverride) {
  return COUNTRIES[resolveActiveCountryCode(pathnameOverride)] || kr;
}

export default getActiveCountry;

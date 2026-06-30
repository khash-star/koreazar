/**
 * Multi-country platform configuration layer.
 *
 * Safe, additive resolver for the "active country" — no routing, schema,
 * or auth changes. Used to read display-only values (app name, country
 * name, currency, default phone prefix, city/address labels) so the same
 * codebase can later serve /kr, /mn, /jp without forking.
 *
 * Resolution order:
 *   1. `VITE_ACTIVE_COUNTRY` env var, if set to a known country code.
 *   2. First path segment of the current URL (e.g. `/kr/...`, `/mn/...`),
 *      if it matches a known country code.
 *   3. Fallback to KR — keeps the existing Zarkorea web app unchanged.
 */
import { kr } from './countries/kr';
import { mn } from './countries/mn';
import { jp } from './countries/jp';

/** Registry of all known country configs, keyed by countryCode. */
export const COUNTRIES = {
  KR: kr,
  MN: mn,
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

function envActiveCountryCode() {
  try {
    const envCode = normalizeCode(import.meta.env?.VITE_ACTIVE_COUNTRY);
    return COUNTRIES[envCode] ? envCode : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the active country code using env override, then URL path,
 * then the KR fallback. Safe to call outside the browser (SSR/build).
 */
export function resolveActiveCountryCode() {
  const envCode = envActiveCountryCode();
  if (envCode) return envCode;

  if (typeof window !== 'undefined' && window.location) {
    const pathCode = countryCodeFromPath(window.location.pathname);
    if (pathCode) return pathCode;
  }

  return DEFAULT_COUNTRY_CODE;
}

/** Resolves the full active country config object. */
export function getActiveCountry() {
  return COUNTRIES[resolveActiveCountryCode()] || kr;
}

export default getActiveCountry;

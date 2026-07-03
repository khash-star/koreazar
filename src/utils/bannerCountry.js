/**
 * Banner country scoping.
 *
 * Existing banners (created before multi-country support) have no
 * `country_code` field at all — those must keep showing on KR exactly as
 * before (no admin action required, no data migration). New banners can
 * opt into a single market (`KR`/`US`/`JP`) or explicitly opt into every
 * market via `GLOBAL`.
 */
export const GLOBAL_BANNER_COUNTRY_CODE = 'GLOBAL';

/** Normalizes a banner's stored country_code, defaulting missing/blank to KR. */
export function normalizeBannerCountryCode(countryCode) {
  const code = String(countryCode || 'KR').trim().toUpperCase();
  return code || 'KR';
}

/** True when `banner` should be shown while browsing `marketCountryCode`. */
export function isBannerVisibleForCountry(banner, marketCountryCode) {
  const bannerCountry = normalizeBannerCountryCode(banner?.country_code);
  if (bannerCountry === GLOBAL_BANNER_COUNTRY_CODE) return true;
  return bannerCountry === String(marketCountryCode || 'KR').trim().toUpperCase();
}

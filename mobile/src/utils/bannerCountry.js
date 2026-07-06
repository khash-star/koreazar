/** Keep in sync with src/utils/bannerCountry.js (web). */
export const GLOBAL_BANNER_COUNTRY_CODE = "GLOBAL";

export function normalizeBannerCountryCode(countryCode) {
  const code = String(countryCode || "KR").trim().toUpperCase();
  return code || "KR";
}

export function isBannerVisibleForCountry(banner, marketCountryCode) {
  const bannerCountry = normalizeBannerCountryCode(banner?.country_code);
  if (bannerCountry === GLOBAL_BANNER_COUNTRY_CODE) return true;
  return bannerCountry === String(marketCountryCode || "KR").trim().toUpperCase();
}

/**
 * Mobile active-country resolver — mirrors web src/config/country.js (env-only).
 * Set EXPO_PUBLIC_ACTIVE_COUNTRY=US for Zarusa builds; omit or KR for Zarkorea.
 */
import { kr } from "./countries/kr";
import { us } from "./countries/us";
import { jp } from "./countries/jp";

export const COUNTRIES = { KR: kr, US: us, JP: jp };
export const DEFAULT_COUNTRY_CODE = "KR";

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function getActiveMobileCountryCode() {
  const envCode = normalizeCode(process.env.EXPO_PUBLIC_ACTIVE_COUNTRY);
  return COUNTRIES[envCode] ? envCode : DEFAULT_COUNTRY_CODE;
}

export function getActiveMobileCountry() {
  return COUNTRIES[getActiveMobileCountryCode()] || kr;
}

export function getCountryByCode(code) {
  const normalized = normalizeCode(code);
  return COUNTRIES[normalized] || kr;
}

export function isUsMobileMarket() {
  return getActiveMobileCountryCode() === "US";
}

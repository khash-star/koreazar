/**
 * Mobile region resolver — US Zarusa builds only.
 * KR/Zarkorea: no region (returns null).
 */
import { getActiveMobileCountryCode, isUsMobileMarket } from "./country";
import {
  getDefaultUsRegionCode,
  getUsRegion,
  isActiveUsRegion,
  normalizeRegionCode,
} from "./regions/us";

/** Active region for this build (env US → default launch region washington-dc). */
export function getActiveMobileRegionCode() {
  if (!isUsMobileMarket()) return null;
  return getDefaultUsRegionCode();
}

export function getActiveMobileRegion() {
  const code = getActiveMobileRegionCode();
  return code ? getUsRegion(code) : null;
}

export function userHasHomeRegion(userData) {
  const code = normalizeRegionCode(userData?.home_region_code);
  if (!code) return false;
  return isActiveUsRegion(code);
}

/** @deprecated Phase 1b — MVP uses build default region, no invite gate */
export function requiresUsRegionGate() {
  return false;
}

export function getMobileHomeHeaderTitle() {
  const region = getActiveMobileRegion();
  if (region) {
    return `ZARUSA — ${region.shortLabel}`;
  }
  const country = getActiveMobileCountryCode();
  if (country === "US") return "ZARUSA";
  return null;
}

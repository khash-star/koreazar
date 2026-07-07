/**
 * Mobile region resolver — US Zarusa builds only.
 * KR/Zarkorea: no region (returns null).
 * US build default: washington-dc (no user picker, no invite).
 */
import { getActiveMobileCountryCode, isUsMobileMarket } from "./country";
import { getDefaultUsRegionCode, getUsRegion } from "./regions/us";

/** Active region for this build (env US → default launch region washington-dc). */
export function getActiveMobileRegionCode() {
  if (!isUsMobileMarket()) return null;
  return getDefaultUsRegionCode();
}

export function getActiveMobileRegion() {
  const code = getActiveMobileRegionCode();
  return code ? getUsRegion(code) : null;
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

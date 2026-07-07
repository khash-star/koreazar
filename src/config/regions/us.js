/**
 * US region registry — community lock keys (not the same as state_code).
 * Only `active: true` regions are launchable. Inactive regions exist for future rollout.
 *
 * Sync: mobile/src/config/regions/us.js, api/regions.php
 */
export const US_REGIONS = {
  'washington-dc': {
    regionCode: 'washington-dc',
    label: 'Washington DC / DMV',
    shortLabel: 'DC / DMV',
    active: true,
    /** Listing metadata — allowed state_code values within this region */
    stateCodes: ['DC', 'VA', 'MD'],
    onboarding: 'default',
    browseScope: 'region_only',
  },
  chicago: {
    regionCode: 'chicago',
    label: 'Chicago',
    shortLabel: 'Chicago',
    active: false,
    stateCodes: ['IL'],
    onboarding: 'self_select',
    browseScope: 'region_only',
  },
  'new-york': {
    regionCode: 'new-york',
    label: 'New York',
    shortLabel: 'New York',
    active: false,
    stateCodes: ['NY'],
    onboarding: 'self_select',
    browseScope: 'region_only',
  },
  seattle: {
    regionCode: 'seattle',
    label: 'Seattle',
    shortLabel: 'Seattle',
    active: false,
    stateCodes: ['WA'],
    onboarding: 'self_select',
    browseScope: 'region_only',
  },
  louisiana: {
    regionCode: 'louisiana',
    label: 'Louisiana',
    shortLabel: 'Louisiana',
    active: false,
    stateCodes: ['LA'],
    onboarding: 'self_select',
    browseScope: 'region_only',
  },
};

export const DEFAULT_US_REGION_CODE = 'washington-dc';

export function normalizeRegionCode(value) {
  const code = String(value || '').trim().toLowerCase();
  return US_REGIONS[code] ? code : '';
}

export function getActiveUsRegions() {
  return Object.values(US_REGIONS).filter((r) => r.active);
}

export function getDefaultUsRegionCode() {
  const active = getActiveUsRegions();
  if (active.length === 1) return active[0].regionCode;
  return DEFAULT_US_REGION_CODE;
}

export function isActiveUsRegion(regionCode) {
  const code = normalizeRegionCode(regionCode);
  return code !== '' && US_REGIONS[code]?.active === true;
}

export function getUsRegion(regionCode) {
  const code = normalizeRegionCode(regionCode);
  return code ? US_REGIONS[code] : null;
}

export function isStateCodeAllowedForRegion(regionCode, stateCode) {
  const region = getUsRegion(regionCode);
  if (!region) return false;
  const st = String(stateCode || '').trim().toUpperCase();
  return region.stateCodes.includes(st);
}

import { getDefaultUsRegionCode } from '@/config/regions/us';

/** US web routes — default launch region (washington-dc). KR/JP unchanged. */
export function getDefaultUsRegionCodeForWeb() {
  return getDefaultUsRegionCode();
}

export function appendUsRegionScopeParams(params = {}, countryCode) {
  if (String(countryCode || '').trim().toUpperCase() !== 'US') {
    return params;
  }
  return {
    ...params,
    region_code: getDefaultUsRegionCode(),
  };
}

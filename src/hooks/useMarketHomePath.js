import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { COUNTRIES, getStoredCountryCode, resolveRouteCountryCode } from '@/config/country';
import { ROLES } from '@/constants/adminRoles';
import { useAdminAccess } from '@/hooks/useAdminAccess';

/**
 * Home path that preserves market context (/us, /kr) for admin back-links.
 * Prevents US admins from dropping to legacy `/` (KR homepage).
 */
export function resolveMarketHomePath(pathname, adminScope) {
  const routeCode = resolveRouteCountryCode(pathname);
  if (routeCode && COUNTRIES[routeCode]) {
    return COUNTRIES[routeCode].defaultRoutePrefix;
  }

  const role = adminScope?.role;
  const scopeCountry = adminScope?.countryCode
    ? String(adminScope.countryCode).trim().toUpperCase()
    : '';
  if (
    (role === ROLES.REGION_ADMIN || role === ROLES.COUNTRY_ADMIN) &&
    scopeCountry &&
    COUNTRIES[scopeCountry]
  ) {
    return COUNTRIES[scopeCountry].defaultRoutePrefix;
  }

  const stored = getStoredCountryCode();
  if (stored && COUNTRIES[stored]) {
    return COUNTRIES[stored].defaultRoutePrefix;
  }

  return '/';
}

export function useMarketHomePath() {
  const location = useLocation();
  const { adminScope } = useAdminAccess();

  return useMemo(
    () => resolveMarketHomePath(location.pathname, adminScope),
    [location.pathname, adminScope.role, adminScope.countryCode, adminScope.regionCode]
  );
}

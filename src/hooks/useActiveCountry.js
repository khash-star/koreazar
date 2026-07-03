import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveCountry, resolveRouteCountryCode } from '@/config/country';

/**
 * Reactive version of `getActiveCountry()` — recomputes whenever the route
 * (path) changes, so components stay correct across client-side navigation
 * between `/`, `/kr`, `/us`, `/jp`, etc. without a full page reload.
 */
export function useActiveCountry() {
  const location = useLocation();
  return useMemo(() => getActiveCountry(location.pathname), [location.pathname]);
}

/**
 * Strict, URL-only country code for the current route (`null` when the path
 * has no `/kr`, `/us`, `/jp` prefix). Use for listing create/edit so a
 * stale localStorage country selection never overrides what the URL says.
 * Treat `null` as KR at the call site.
 */
export function useRouteCountryCode() {
  const location = useLocation();
  return useMemo(() => resolveRouteCountryCode(location.pathname), [location.pathname]);
}

export default useActiveCountry;

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveCountry } from '@/config/country';

/**
 * Reactive version of `getActiveCountry()` — recomputes whenever the route
 * (path) changes, so components stay correct across client-side navigation
 * between `/`, `/kr`, `/mn`, `/jp`, etc. without a full page reload.
 */
export function useActiveCountry() {
  const location = useLocation();
  return useMemo(() => getActiveCountry(location.pathname), [location.pathname]);
}

export default useActiveCountry;

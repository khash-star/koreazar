import { useEffect } from 'react';
import { useActiveCountry } from '@/hooks/useActiveCountry';
import { kr } from '@/config/countries/kr';

const DEFAULT_TITLE = `${kr.appName}.com - ${kr.marketFooterTitle} | ${kr.appName} App`;
const DEFAULT_DESC = kr.marketSeoBlurb;

/**
 * Sync document title + meta description with active country (/, /kr, /us, /jp).
 * Restores KR defaults on unmount — matches index.html for the root market.
 */
export function useMarketPageMeta() {
  const activeCountry = useActiveCountry();

  useEffect(() => {
    document.title = `${activeCountry.appName}.com - ${activeCountry.marketFooterTitle}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', activeCountry.marketSeoBlurb);

    const iconHref = activeCountry.marketAppIcon || '/icon-180.png';
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon) appleIcon.setAttribute('href', iconHref);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && iconHref.endsWith('.png')) favicon.setAttribute('href', iconHref);

    return () => {
      document.title = DEFAULT_TITLE;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', DEFAULT_DESC);
      if (appleIcon) appleIcon.setAttribute('href', '/icon-180.png');
      if (favicon) favicon.setAttribute('href', '/favicon.svg');
    };
  }, [
    activeCountry.appName,
    activeCountry.marketFooterTitle,
    activeCountry.marketSeoBlurb,
    activeCountry.marketAppIcon,
  ]);
}

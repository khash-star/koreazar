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

    return () => {
      document.title = DEFAULT_TITLE;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', DEFAULT_DESC);
    };
  }, [
    activeCountry.appName,
    activeCountry.marketFooterTitle,
    activeCountry.marketSeoBlurb,
  ]);
}

/**
 * Korea (KR) country configuration.
 *
 * KR is the existing production market (Zarkorea). Values here intentionally
 * mirror the current hardcoded copy 1:1 so that resolving to KR (the default
 * fallback) does not change any visible behavior of the live site.
 */
export const kr = {
  countryCode: 'KR',
  countryName: 'Солонгос',
  appName: 'Zarkorea',
  defaultPhoneCode: '+82',
  currency: {
    code: 'KRW',
    symbol: '₩',
    // Intl.NumberFormat locale used for price formatting
    locale: 'ko-KR',
  },
  // App/UI language locale (Zarkorea UI copy is Mongolian-language)
  locale: 'mn-MN',
  // Placeholder list — not yet wired into listing forms/filters.
  // Existing `src/constants/listings.js` `locations` remains the source of
  // truth for stored listing data until a future migration step.
  cityList: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gyeonggi-do', 'Gyeongsangnam-do', 'Бусад'],
  addressLabels: {
    city: 'Хот',
    district: 'Дүүрэг',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/kr',
  marketNavbarTitle: '🇲🇳 СОЛОНГОС ДАХЬ 🇰🇷 МОНГОЛЧУУДЫН ЗАРЫН САЙТ',
  marketFooterTitle: 'Солонгос дахь Монголчуудын зарын сайт',
  marketSeoBlurb:
    'Zarkorea, Zarkorea app, Zarkorea Korea Mongolia, Солонгос зар, Заркореа — Солонгос дахь Монголчуудын №1 зарын сайт.',
};

export default kr;

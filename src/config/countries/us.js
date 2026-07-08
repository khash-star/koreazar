/**
 * United States (US) country configuration.
 *
 * Soft-launch market: listings/state filtering, currency, and per-country
 * storage paths ARE wired into the data path (MySQL `country_code` +
 * `state_code`, production DB migration applied). Still hidden from the
 * public country selector via `ENABLED_COUNTRIES` in `../country.js` until
 * launch content (banner, verified listings) is ready — see
 * `US_LAUNCH_STATE_CODES` in `src/constants/usStates.js` (DC, VA, MD for DMV MVP).
 */
export const us = {
  countryCode: 'US',
  countryName: 'Америк',
  appName: 'Zarusa',
  defaultPhoneCode: '+1',
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  locale: 'en-US',
  // DMV MVP — mirrors US_LAUNCH_STATE_CODES (DC, VA, MD).
  cityList: ['Washington DC', 'Northern Virginia (VA)', 'Maryland (MD)', 'Бусад'],
  addressLabels: {
    city: 'Хот',
    district: 'Муж',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/us',
  marketNavbarTitle: '🇲🇳 АМЕРИК ДАХЬ 🇺🇸 МОНГОЛЧУУДЫН ЗАРЫН САЙТ',
  marketFooterTitle: 'Америк дахь Монголчуудын зарын сайт',
  marketSeoBlurb:
    'Zarusa, Zarusa app, Zarusa US Mongolia, Америк зар — Америк дахь Монголчуудын зарын сайт.',
};

export default us;

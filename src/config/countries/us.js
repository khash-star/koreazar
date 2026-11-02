/**
 * United States (US) country configuration.
 *
 * Live market: `ENABLED_COUNTRIES` already includes US. `/us` is locked to
 * ZAR-USA by `lockCountrySelector: true` — do not treat “US not in
 * ENABLED_COUNTRIES” as the reason KR is hidden on that route. Listings use
 * MySQL `country_code` + `state_code` + `region_code` (washington-dc MVP).
 * States: `US_LAUNCH_STATE_CODES` in `src/constants/usStates.js` (DC, VA, MD).
 */
export const us = {
  countryCode: 'US',
  countryName: 'Америк',
  appName: 'ZAR-USA',
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
  marketWelcomeFlags: '🇲🇳 🇺🇸',
  marketSeoBlurb:
    'ZAR-USA, ZAR-USA app, ZAR-USA US Mongolia, Америк зар — Америк дахь Монголчуудын зарын сайт.',
  marketAppIcon: '/icon-us-180.png',
  /** When true, `/us` shows only US in the country selector (ZAR-USA MVP). Set false when multi-market opens. */
  lockCountrySelector: true,
};

export default us;

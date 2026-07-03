/**
 * United States (US) country configuration.
 *
 * Soft-launch market: listings/state filtering, currency, and per-country
 * storage paths ARE wired into the data path (MySQL `country_code` +
 * `state_code`, production DB migration applied). Still hidden from the
 * public country selector via `ENABLED_COUNTRIES` in `../country.js` until
 * launch content (banner, verified listings) is ready — see
 * `US_LAUNCH_STATE_CODES` in `src/constants/usStates.js` for the launch
 * state subset this cityList mirrors.
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
  // Mirrors US_LAUNCH_STATE_CODES (LA, IL, VA, NY, WA) — kept in sync so
  // this doesn't drift into listing a state that isn't actually selectable.
  // Not yet wired into any UI (CreateListing/SearchBar use the state
  // dropdown instead), kept for future city-level filtering within a state.
  cityList: ['New Orleans (LA)', 'Chicago (IL)', 'Annandale (VA)', 'New York (NY)', 'Seattle (WA)', 'Бусад'],
  addressLabels: {
    city: 'Хот',
    district: 'Муж',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/us',
};

export default us;

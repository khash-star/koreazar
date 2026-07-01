/**
 * United States (US) country configuration.
 *
 * Placeholder market for the multi-country platform. Not wired into
 * any data path yet — listings/cities/currency for US are not migrated.
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
  cityList: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Бусад'],
  addressLabels: {
    city: 'Хот',
    district: 'Муж',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/us',
};

export default us;

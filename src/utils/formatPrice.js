import { COUNTRIES, DEFAULT_COUNTRY_CODE, getActiveCountry } from '@/config/country';

export function getCountryConfig(countryCode) {
  const code = String(countryCode || DEFAULT_COUNTRY_CODE).trim().toUpperCase();
  return COUNTRIES[code] || COUNTRIES.KR;
}

/**
 * @param {number|string|null|undefined} price
 * @param {{ countryCode?: string }} [options]
 */
export function formatListingPrice(price, options = {}) {
  const { countryCode } = options;
  if (price == null || price === '' || Number(price) === 0) {
    return 'Үнэ тохирно';
  }
  const country = countryCode ? getCountryConfig(countryCode) : getActiveCountry();
  const formatted = new Intl.NumberFormat(country.currency.locale).format(Number(price));
  return `${country.currency.symbol}${formatted}`;
}

export function activeCurrencySymbol(countryCode) {
  return getCountryConfig(countryCode).currency.symbol;
}

import { getActiveMobileCountry, getCountryByCode } from "../config/country";

/**
 * @param {number|string|null|undefined} price
 * @param {{ negotiable?: boolean, countryCode?: string }} [options]
 */
export function formatListingPrice(price, options = {}) {
  const { negotiable = false, countryCode } = options;
  if (price == null || price === "" || Number(price) === 0) {
    return "Үнэ тохирно";
  }
  const country = countryCode ? getCountryByCode(countryCode) : getActiveMobileCountry();
  const formatted = new Intl.NumberFormat(country.currency.locale).format(Number(price));
  const text = `${country.currency.symbol}${formatted}`;
  return negotiable ? `${text} (тохирно)` : text;
}

export function activeCurrencySymbol() {
  return getActiveMobileCountry().currency.symbol;
}

/**
 * Whole currency units for the listing price field.
 *
 * MySQL DECIMAL(15,2) is returned as a string with a scale ("15000.00") when
 * PDO uses native prepares. Stripping every non-digit turns that into
 * "1500000", and the next mobile save writes 100× the seller's price.
 * The editor only accepts whole KRW / USD amounts, so keep the integer part.
 *
 * @param {unknown} price
 * @returns {string}
 */
export function priceToInputDigits(price) {
  if (price == null || price === "") return "";
  const raw = String(price).trim().replace(/,/g, "");
  if (raw === "") return "";
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    return String(price).replace(/\D/g, "");
  }
  return String(Math.trunc(numeric));
}

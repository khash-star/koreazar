/** Keep in sync with src/utils/listingCountry.js (web). */

export function normalizeListingCountryCode(countryCode) {
  const code = String(countryCode || "KR").trim().toUpperCase();
  return code || "KR";
}

export function isListingVisibleForMarket(listing, marketCountryCode, marketRegionCode = "") {
  if (!listing) return false;

  const market = normalizeListingCountryCode(marketCountryCode);
  const listingCountry = normalizeListingCountryCode(listing.country_code);

  if (market === "US") {
    if (listingCountry !== "US") return false;
    const marketRegion = String(marketRegionCode || "").trim().toLowerCase();
    if (!marketRegion) return true;
    const listingRegion = String(listing.region_code || "").trim().toLowerCase();
    return listingRegion === marketRegion;
  }
  if (market === "JP") {
    return listingCountry === "JP";
  }

  if (listingCountry === "US" || listingCountry === "JP") return false;

  const region = String(listing.region_code || "").trim().toLowerCase();
  if (region) return false;

  return listingCountry === "KR";
}

export function filterListingsForMarket(listings, marketCountryCode, marketRegionCode = "") {
  if (!Array.isArray(listings)) return [];
  return listings.filter((listing) =>
    isListingVisibleForMarket(listing, marketCountryCode, marketRegionCode)
  );
}

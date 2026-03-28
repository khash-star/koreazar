import * as entities from '@/api/entities';
import { fetchListingByIdResult } from '@/services/listingService';

/** Firestore listing_id болон MySQL id харьцуулах */
export function sameListingSaveId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

/**
 * saved_listings мөр бүрийг MySQL ?action=listing-ээр баталгаажуулна.
 * Зар устсан (404) бол Firestore хадгалалтыг устгана.
 * @returns {Promise<Array<object>>} saved баримтын хувьд + нэмэлт `listing` талбар
 */
export async function fetchSavedListingsResolved(email) {
  if (!email) return [];
  const saved = await entities.SavedListing.filter({ created_by: email }, '-created_date');
  const out = [];
  for (const s of saved) {
    const { listing, httpStatus } = await fetchListingByIdResult(s.listing_id);
    if (!listing && httpStatus === 404) {
      try {
        await entities.SavedListing.delete(s.id);
      } catch {
        /* ignore */
      }
      continue;
    }
    if (listing) {
      out.push({ ...s, listing });
    }
  }
  return out;
}

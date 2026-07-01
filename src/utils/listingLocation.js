import { formatUsStateLabel } from '@/constants/usStates';

/** Display label for listing location (KR city string or US state_code). */
export function getListingLocationLabel(listing) {
  if (!listing) return '';
  if (listing.state_code) {
    return formatUsStateLabel(listing.state_code);
  }
  return listing.location || '';
}

/**
 * Pending listings may be published only after Firestore config/app has loaded
 * and listingAutoApprove is true. A browser cache of the switch must not run
 * first: that publishes the moderation queue and then the switch snaps off.
 *
 * @param {boolean} loaded
 * @param {boolean} enabled
 * @returns {boolean}
 */
export function shouldRunListingAutoApprove(loaded, enabled) {
  return loaded === true && enabled === true;
}

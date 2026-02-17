/**
 * Append width param to image URL for responsive loading.
 * Use with a CDN or Firebase Resize Images extension that supports ?w= to reduce download size.
 * If the server ignores the param, full image is still returned (no break).
 * @param {string} url - Image URL (e.g. Firebase Storage getDownloadURL)
 * @param {number} w - Desired max width in pixels
 * @returns {string} url with ?w= or &w= appended
 */
export function withWidth(url, w) {
  if (!url || typeof w !== 'number') return url || '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}w=${Math.round(w)}`;
}

/**
 * Get listing image URL for a given variant (upload-time: w800, w640, w400, w150).
 * Backward compatible: string (legacy) or object; w640 байхгүй хуучин өгөгдөлд w800/w400 fallback.
 * @param {string|{ w800?: string, w640?: string, w400?: string, w150?: string }} img - One image entry from listing.images[i]
 * @param {'w800'|'w640'|'w400'|'w150'} size - Variant (detail→w800, card→w640|w400, thumb→w150)
 * @returns {string} URL to use
 */
export function getListingImageUrl(img, size) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  const url = img[size] || img.w800 || img.w640 || img.w400 || img.w150;
  return url || '';
}

/**
 * Build srcset: 400w, 640w (312px 2x slot), 800w — browser зөв сонгоно, "slightly too large" багасна.
 * @param {string|{ w800?: string, w640?: string, w400?: string, w150?: string }} img - One image entry from listing.images[i]
 * @returns {string} e.g. "url400 400w, url640 640w, url800 800w" or "" for legacy
 */
export function getListingImageSrcSet(img) {
  if (!img || typeof img === 'string') return '';
  const u400 = img.w400 || img.w640 || img.w800;
  const u640 = img.w640 || img.w800;
  const u800 = img.w800;
  if (!u400) return '';
  const parts = [];
  if (u400) parts.push(`${u400} 400w`);
  if (u640 && u640 !== u400) parts.push(`${u640} 640w`);
  if (u800 && u800 !== u640 && u800 !== u400) parts.push(`${u800} 800w`);
  return parts.join(', ');
}

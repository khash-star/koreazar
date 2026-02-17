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
 * Get listing image URL for a given variant (upload-time variants: w800, w400, w150).
 * Backward compatible: if img is a string (legacy single URL), returns it; otherwise returns img[size] or img.w800.
 * @param {string|{ w800?: string, w400?: string, w150?: string }} img - One image entry from listing.images[i]
 * @param {'w800'|'w400'|'w150'} size - Variant to use (detail→w800, card→w400, thumb→w150)
 * @returns {string} URL to use
 */
export function getListingImageUrl(img, size) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  const url = img[size] || img.w800 || img.w400 || img.w150;
  return url || '';
}

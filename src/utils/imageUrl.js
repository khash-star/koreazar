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

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

const VARIANT_FALLBACK = {
  w800: ['w800', 'w640', 'w400', 'w150'],
  w640: ['w640', 'w800', 'w400', 'w150'],
  w400: ['w400', 'w640', 'w800', 'w150'],
  w150: ['w150', 'w400', 'w640', 'w800'],
};

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  const t = value.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function pickFromObject(img, keys) {
  for (const key of keys) {
    if (isHttpUrl(img[key])) return img[key].trim();
  }
  return '';
}

/**
 * Get listing image URL for a given variant (upload-time: w800, w640, w400, w150).
 * Skips empty/invalid values so a broken w800 does not block w150 fallback.
 * @param {string|{ w800?: string, w640?: string, w400?: string, w150?: string }} img
 * @param {'w800'|'w640'|'w400'|'w150'} size
 * @returns {string}
 */
export function getListingImageUrl(img, size = 'w800') {
  if (!img) return '';
  if (typeof img === 'string') {
    return isHttpUrl(img) ? img.trim() : '';
  }
  const keys = VARIANT_FALLBACK[size] || VARIANT_FALLBACK.w800;
  return pickFromObject(img, keys);
}

/**
 * Build srcset: 400w, 640w (312px 2x slot), 800w — browser зөв сонгоно, "slightly too large" багасна.
 * @param {string|{ w800?: string, w640?: string, w400?: string, w150?: string }} img - One image entry from listing.images[i]
 * @returns {string} e.g. "url400 400w, url640 640w, url800 800w" or "" for legacy
 */
export function getListingImageSrcSet(img) {
  if (!img || typeof img === 'string') return '';
  const u400 = getListingImageUrl(img, 'w400');
  const u640 = getListingImageUrl(img, 'w640');
  const u800 = getListingImageUrl(img, 'w800');
  if (!u400) return '';
  const parts = [];
  if (u400) parts.push(`${u400} 400w`);
  if (u640 && u640 !== u400) parts.push(`${u640} 640w`);
  if (u800 && u800 !== u640 && u800 !== u400) parts.push(`${u800} 800w`);
  return parts.join(', ');
}

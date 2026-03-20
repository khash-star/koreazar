/**
 * Same logic as web `src/utils/imageUrl.js` — listing.images[i] string or { w800, w640, w400, w150 }.
 */
export function getListingImageUrl(img, size) {
  if (!img) return "";
  if (typeof img === "string") return img;
  const url = img[size] || img.w800 || img.w640 || img.w400 || img.w150;
  return url || "";
}

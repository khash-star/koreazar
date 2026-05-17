/**
 * Same logic as web `src/utils/imageUrl.js` — listing.images[i] string or { w800, w640, w400, w150 }.
 */
const VARIANT_FALLBACK = {
  w800: ["w800", "w640", "w400", "w150"],
  w640: ["w640", "w800", "w400", "w150"],
  w400: ["w400", "w640", "w800", "w150"],
  w150: ["w150", "w400", "w640", "w800"],
  w1600: ["w1600", "w800", "w640", "w400", "w150"],
};

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function pickFromObject(img, keys) {
  for (const key of keys) {
    if (isHttpUrl(img[key])) return img[key].trim();
  }
  return "";
}

export function getListingImageUrl(img, size = "w800") {
  if (!img) return "";
  if (typeof img === "string") {
    return isHttpUrl(img) ? img.trim() : "";
  }
  const keys = VARIANT_FALLBACK[size] || VARIANT_FALLBACK.w800;
  return pickFromObject(img, keys);
}

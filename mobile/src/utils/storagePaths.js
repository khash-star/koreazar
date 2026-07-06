/** Keep in sync with src/utils/storagePaths.js (web). */
import { getActiveMobileCountryCode } from "../config/country";

export const STORAGE_COUNTRY_CODES = ["KR", "US", "JP"];
export const DEFAULT_STORAGE_COUNTRY_CODE = "KR";

export function normalizeStorageCountryCode(countryCode) {
  const code = String(countryCode || DEFAULT_STORAGE_COUNTRY_CODE).trim().toUpperCase();
  return STORAGE_COUNTRY_CODES.includes(code) ? code : DEFAULT_STORAGE_COUNTRY_CODE;
}

export function storageCountrySegment(countryCode) {
  return normalizeStorageCountryCode(countryCode).toLowerCase();
}

export function currentStorageYear(date = new Date()) {
  return date.getFullYear();
}

export function buildUniqueFileName(extension = "jpg") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = String(extension || "jpg").replace(/^\./, "").toLowerCase() || "jpg";
  return `${timestamp}_${random}.${ext}`;
}

export function buildListingImageStoragePath({
  countryCode = DEFAULT_STORAGE_COUNTRY_CODE,
  listingId,
  variant,
  extension = "jpg",
} = {}) {
  const country = storageCountrySegment(countryCode);
  const year = currentStorageYear();
  const folderKey = listingId ? String(listingId) : "draft";
  const baseName = buildUniqueFileName(extension);
  const fileName = variant ? `${variant}_${baseName}` : baseName;
  return `listings/${country}/${year}/${folderKey}/${fileName}`;
}

export function buildBannerImageStoragePath({
  countryCode = DEFAULT_STORAGE_COUNTRY_CODE,
  bannerId,
  extension = "jpg",
} = {}) {
  const country = storageCountrySegment(countryCode);
  const folderKey = bannerId ? String(bannerId) : "draft";
  return `banners/${country}/${folderKey}/${buildUniqueFileName(extension)}`;
}

export function buildUserProfileStoragePath({ userId, extension = "jpg" } = {}) {
  const uid = String(userId || "unknown").trim() || "unknown";
  return `users/${uid}/profile/${buildUniqueFileName(extension)}`;
}

export function resolveUploadStoragePathFromParts({
  storagePath,
  kind = "listing",
  countryCode,
  listingId,
  bannerId,
  variant,
  extension = "jpg",
  userId,
}) {
  if (storagePath) return storagePath;
  if (kind === "banner") {
    return buildBannerImageStoragePath({ countryCode, bannerId, extension });
  }
  if (kind === "profile") {
    return buildUserProfileStoragePath({ userId, extension });
  }
  return buildListingImageStoragePath({ countryCode, listingId, variant, extension });
}

/** Active market for uploads and new listings (EXPO_PUBLIC_ACTIVE_COUNTRY). */
export function defaultMobileStorageCountryCode() {
  return normalizeStorageCountryCode(getActiveMobileCountryCode());
}

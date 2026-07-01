/** Storage folder codes aligned with listings.country_code (KR, US, JP). */
export const STORAGE_COUNTRY_CODES = ['KR', 'US', 'JP'];
export const DEFAULT_STORAGE_COUNTRY_CODE = 'KR';

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

export function buildUniqueFileName(extension = 'jpg') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = String(extension || 'jpg').replace(/^\./, '').toLowerCase() || 'jpg';
  return `${timestamp}_${random}.${ext}`;
}

export function extensionFromFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return 'jpg';
  const base = fileName.split('?')[0];
  const ext = base.includes('.') ? base.split('.').pop() : '';
  return String(ext || 'jpg').trim().toLowerCase() || 'jpg';
}

export function extensionFromMimeType(mimeType) {
  const type = String(mimeType || '').toLowerCase();
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  if (type === 'image/heic') return 'heic';
  if (type === 'image/heif') return 'heif';
  return 'jpg';
}

/**
 * listings/{kr|us|jp}/{year}/{listingId}/{variant_}timestamp_random.ext
 */
export function buildListingImageStoragePath({
  countryCode = DEFAULT_STORAGE_COUNTRY_CODE,
  listingId,
  variant,
  extension = 'jpg',
} = {}) {
  const country = storageCountrySegment(countryCode);
  const year = currentStorageYear();
  const folderKey = listingId ? String(listingId) : 'draft';
  const baseName = buildUniqueFileName(extension);
  const fileName = variant ? `${variant}_${baseName}` : baseName;
  return `listings/${country}/${year}/${folderKey}/${fileName}`;
}

/**
 * banners/{kr|us|jp}/{bannerId}/timestamp_random.ext
 */
export function buildBannerImageStoragePath({
  countryCode = DEFAULT_STORAGE_COUNTRY_CODE,
  bannerId,
  extension = 'jpg',
} = {}) {
  const country = storageCountrySegment(countryCode);
  const folderKey = bannerId ? String(bannerId) : 'draft';
  return `banners/${country}/${folderKey}/${buildUniqueFileName(extension)}`;
}

/** users/{uid}/profile/timestamp_random.ext */
export function buildUserProfileStoragePath({ userId, extension = 'jpg' } = {}) {
  const uid = String(userId || 'unknown').trim() || 'unknown';
  return `users/${uid}/profile/${buildUniqueFileName(extension)}`;
}

export function resolveUploadStoragePath(file, options = {}) {
  if (options.storagePath) return options.storagePath;

  const extension =
    options.extension ||
    extensionFromFileName(file?.name) ||
    extensionFromMimeType(file?.type);

  if (options.kind === 'banner') {
    return buildBannerImageStoragePath({
      countryCode: options.countryCode,
      bannerId: options.bannerId,
      extension,
    });
  }

  if (options.kind === 'profile') {
    return buildUserProfileStoragePath({
      userId: options.userId,
      extension,
    });
  }

  if (options.kind === 'listing' || options.listingId != null || options.variant != null) {
    return buildListingImageStoragePath({
      countryCode: options.countryCode,
      listingId: options.listingId,
      variant: options.variant,
      extension,
    });
  }

  // Legacy flat folder — existing production URLs keep working.
  return `images/${buildUniqueFileName(extension)}`;
}

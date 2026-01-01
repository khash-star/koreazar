// Usage Limits - Төлбөрт орохгүй байхын тулд хязгаарлалт
// Firebase Free Tier:
// - Firestore: 50K reads/day, 20K writes/day
// - Storage: 5GB storage, 1GB downloads/day

export const LIMITS = {
  // Image upload limits
  MAX_IMAGES_PER_LISTING: 10, // Зар тутамд хамгийн ихдээ 10 зураг
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB зураг
  
  // Listing limits
  MAX_LISTINGS_PER_USER: 50, // Хэрэглэгч тутамд хамгийн ихдээ 50 зар
  
  // Message limits
  MAX_MESSAGES_PER_CONVERSATION: 1000, // Ярилцлага тутамд хамгийн ихдээ 1000 мессеж
  MESSAGE_FETCH_LIMIT: 100, // Нэг удаа татах мессежийн тоо
  
  // Query limits (Firestore reads save хийх)
  LISTINGS_PER_PAGE: 20, // Нэг хуудас тутамд 20 зар
  CONVERSATIONS_PER_PAGE: 20, // Нэг хуудас тутамд 20 ярилцлага
  
  // Banner limits
  MAX_BANNERS: 10, // Хамгийн ихдээ 10 баннер
  MAX_BANNER_SIZE: 10 * 1024 * 1024, // 10MB баннер
  
  // Real-time refresh intervals (seconds)
  MESSAGES_REFRESH_INTERVAL: 5000, // 5 секунд тутамд мессеж refresh
  LISTINGS_REFRESH_INTERVAL: 30000, // 30 секунд тутамд зар refresh
};

/**
 * Check if user can create more listings
 */
export const canCreateListing = (userListingsCount) => {
  return userListingsCount < LIMITS.MAX_LISTINGS_PER_USER;
};

/**
 * Check if user can upload more images
 */
export const canUploadImage = (currentImageCount) => {
  return currentImageCount < LIMITS.MAX_IMAGES_PER_LISTING;
};

/**
 * Validate image file size
 */
export const validateImageSize = (file) => {
  return file.size <= LIMITS.MAX_IMAGE_SIZE;
};

/**
 * Validate banner file size
 */
export const validateBannerSize = (file) => {
  return file.size <= LIMITS.MAX_BANNER_SIZE;
};


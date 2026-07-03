// Firebase Storage Service

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import {
  buildUniqueFileName,
  extensionFromFileName,
  extensionFromMimeType,
  buildUserProfileStoragePath,
  resolveUploadStoragePath,
} from '@/utils/storagePaths';

/**
 * Зураг upload хийх (Firebase Storage)
 * @param {File} file - Upload хийх файл
 * @param {Object} [options]
 * @param {'listing'|'banner'|'profile'|'legacy'} [options.kind='listing']
 * @param {string} [options.countryCode] - KR | US | JP
 * @param {string} [options.listingId] - MySQL listing id or draft key
 * @param {string} [options.bannerId] - banner id or draft key
 * @param {string} [options.variant] - w800 | w640 | w400 | w150
 * @param {string} [options.userId] - profile uploads
 * @param {string} [options.storagePath] - explicit full path override
 */
export const uploadFile = async (file, options = {}) => {
  try {
    const storagePath = resolveUploadStoragePath(file, options);
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { file_url: downloadURL };
  } catch (error) {
    console.error('Firebase Storage upload error:', error);

    if (error.code === 'storage/unauthorized' || error.message?.includes('Storage')) {
      throw new Error('Firebase Storage идэвхжээгүй байна. Firebase Console дээр Storage идэвхжүүлнэ үү.');
    }

    throw error;
  }
};

/**
 * Зураг upload хийх (multiple files)
 */
export const uploadFiles = async (files, options = {}) => {
  try {
    const uploadPromises = files.map((file) => uploadFile(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw error;
  }
};

/**
 * Profile зураг upload — users/{uid}/profile/...
 */
export const uploadPrivateFile = async (file, userId) => {
  try {
    const extension =
      extensionFromFileName(file?.name) || extensionFromMimeType(file?.type);
    const storagePath = buildUserProfileStoragePath({ userId, extension });
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { file_url: downloadURL };
  } catch (error) {
    console.error('Firebase Storage private upload error:', error);
    throw error;
  }
};

/** @deprecated Use country-scoped paths via uploadFile options. */
export const legacyImagesPath = (fileName) => `images/${fileName || buildUniqueFileName('jpg')}`;

// Firebase Storage Service
// Base44 integrations.Core.UploadFile-ийг Firebase Storage-аар солих

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

/**
 * Зураг upload хийх (Firebase Storage)
 * Base44: base44.integrations.Core.UploadFile({ file })
 * @param {File} file - Upload хийх файл
 * @param {string} folder - Folder path (optional, default: 'images')
 * @returns {Promise<{file_url: string}>} Upload хийгдсэн файлын URL
 */
export const uploadFile = async (file, folder = 'images') => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      file_url: downloadURL
    };
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    
    // Check if Storage is not enabled
    if (error.code === 'storage/unauthorized' || error.message?.includes('Storage')) {
      throw new Error('Firebase Storage идэвхжээгүй байна. Firebase Console дээр Storage идэвхжүүлнэ үү.');
    }
    
    throw error;
  }
};

/**
 * Зураг upload хийх (multiple files)
 * @param {File[]} files - Upload хийх файлууд
 * @param {string} folder - Folder path (optional)
 * @returns {Promise<Array<{file_url: string}>>} Upload хийгдсэн файлуудын URL-ууд
 */
export const uploadFiles = async (files, folder = 'images') => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw error;
  }
};

/**
 * Private file upload (хэрэгтэй бол)
 * @param {File} file - Upload хийх файл
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (optional)
 * @returns {Promise<{file_url: string}>} Upload хийгдсэн файлын URL
 */
export const uploadPrivateFile = async (file, userId, folder = 'private') => {
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}_${randomString}.${fileExtension}`;
    
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      file_url: downloadURL
    };
  } catch (error) {
    console.error('Firebase Storage private upload error:', error);
    throw error;
  }
};


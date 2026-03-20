/**
 * Firebase Storage upload for React Native (from image picker URI).
 */
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Upload image from local URI (expo-image-picker result).
 * @param {string} uri - Local file URI (file:// or content://)
 * @returns {Promise<{file_url: string}>}
 */
export async function uploadImageFromUri(uri) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);

  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

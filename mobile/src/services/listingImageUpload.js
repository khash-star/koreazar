/**
 * Expo web fallback — unchanged single-URL upload (root web app uses its own compressor).
 */
import { uploadImageFromUri } from "./storageService";

export async function uploadListingImageVariants(uri, pickerMeta = {}) {
  const { file_url } = await uploadImageFromUri(uri, pickerMeta);
  return { w800: file_url, w640: file_url, w400: file_url, w150: file_url };
}

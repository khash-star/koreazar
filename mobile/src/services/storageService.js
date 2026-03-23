/**
 * Firebase Storage upload (expo-image-picker URI).
 * Web: fetch(blob:) works. Native: expo-file-system + uploadString base64 (RN Blob/ArrayBuffer is limited).
 */
import { Platform } from "react-native";
// SDK 55+: legacy API — main "expo-file-system" has no EncodingType; readAsStringAsync throws there.
import * as FileSystem from "expo-file-system/legacy";
import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

function contentTypeForExtension(ext) {
  const e = (ext || "jpg").toLowerCase().replace(/^\./, "");
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "heic" || e === "heif") return "image/heic";
  return "image/jpeg";
}

/**
 * Upload image from local URI (expo-image-picker result).
 * @param {string} uri - Local URI (blob: on web, file:// or content:// on native)
 * @returns {Promise<{file_url: string}>}
 */
export async function uploadImageFromUri(uri) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const contentType = contentTypeForExtension(ext);

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
  } else {
    let readUri = uri;
    if (uri.startsWith("content://")) {
      const cached = `${FileSystem.cacheDirectory}upload_${timestamp}.${ext}`;
      await FileSystem.copyAsync({ from: uri, to: cached });
      readUri = cached;
    }
    const base64 = await FileSystem.readAsStringAsync(readUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // RN: do not use Uint8Array/Blob with uploadBytes — "Creating blobs from ArrayBuffer... not supported"
    await uploadString(storageRef, base64, "base64", { contentType });
  }

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

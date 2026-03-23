/**
 * Firebase Storage upload (expo-image-picker URI).
 *
 * Web + Native: fetch(localUri) → Blob → uploadBytes()
 * (uploadString/base64-г Firebase web SDK native дээр ашиглахгүй — multipart + RN Blob хязгаарлалт.)
 *
 * Native: content:// эхлэлийг эхлээд file:// cache руу хуулна (fetch зөв ажиллахын тулд).
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
 * URI-аас Blob (RN / web хоёуланд fetch(file://) ажиллана).
 */
async function blobFromPickerUri(uri, ext, timestamp) {
  let readUri = uri;
  if (Platform.OS !== "web" && uri.startsWith("content://")) {
    const cached = `${FileSystem.cacheDirectory}upload_${timestamp}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: cached });
    readUri = cached;
  }
  const response = await fetch(readUri);
  if (!response.ok) {
    throw new Error("Зураг уншихад алдаа гарлаа.");
  }
  return response.blob();
}

function getFirebaseErrorMessage(error) {
  const code = error?.code || "";
  const serverResponse = error?.customData?.serverResponse || "";
  if (serverResponse) {
    return `${error?.message || "Upload failed"}\n${serverResponse}`;
  }
  if (code === "storage/unauthorized") {
    return "Зураг upload хийх эрхгүй байна (Storage Rules).";
  }
  if (code === "storage/canceled") {
    return "Зураг upload цуцлагдсан.";
  }
  return error?.message || "Зураг upload хийхэд алдаа гарлаа.";
}

async function uploadNativeWithFallback(storageRef, uri, ext, timestamp, contentType) {
  // 1) Preferred: local file uri -> blob
  try {
    const blob = await blobFromPickerUri(uri, ext, timestamp);
    await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
    return;
  } catch (firstErr) {
    // 2) Fallback: file -> base64 -> data URL -> blob (avoids unstable file:// fetch on some iOS builds)
    try {
      let readUri = uri;
      if (uri.startsWith("content://")) {
        const cached = `${FileSystem.cacheDirectory}upload_retry_${timestamp}.${ext}`;
        await FileSystem.copyAsync({ from: uri, to: cached });
        readUri = cached;
      }
      const base64 = await FileSystem.readAsStringAsync(readUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:${contentType};base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
      return;
    } catch (secondErr) {
      const primary = secondErr?.code ? secondErr : firstErr;
      throw new Error(getFirebaseErrorMessage(primary));
    }
  }
}

/**
 * Upload image from local URI (expo-image-picker result).
 * @param {string} uri - blob: (web), file:// or content:// (native)
 * @returns {Promise<{file_url: string}>}
 */
export async function uploadImageFromUri(uri) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const fallbackType = contentTypeForExtension(ext);

  if (Platform.OS === "web") {
    const blob = await blobFromPickerUri(uri, ext, timestamp);
    const contentType = blob.type || fallbackType;
    await uploadBytes(storageRef, blob, { contentType });
  } else {
    await uploadNativeWithFallback(storageRef, uri, ext, timestamp, fallbackType);
  }

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

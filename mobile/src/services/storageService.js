/**
 * Firebase Storage upload (expo-image-picker URI).
 * Web: fetch(blob:) works. Native: expo-file-system (fetch file:// fails on RN).
 */
import { Platform } from "react-native";
// SDK 55+: legacy API — main "expo-file-system" has no EncodingType; readAsStringAsync throws there.
import * as FileSystem from "expo-file-system/legacy";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

function base64ToUint8Array(base64) {
  const binaryString = typeof atob !== "undefined" ? atob(base64) : decodeBase64Fallback(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64Fallback(base64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  base64 = base64.replace(/=+$/, "");
  for (let i = 0; i < base64.length; i += 4) {
    const a = chars.indexOf(base64[i]);
    const b = chars.indexOf(base64[i + 1]);
    const c = chars.indexOf(base64[i + 2]);
    const d = chars.indexOf(base64[i + 3]);
    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== -1) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== -1) output += String.fromCharCode(((c & 3) << 6) | d);
  }
  return output;
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

  let blobOrBytes;

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    blobOrBytes = await response.blob();
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
    blobOrBytes = base64ToUint8Array(base64);
  }

  await uploadBytes(storageRef, blobOrBytes);
  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

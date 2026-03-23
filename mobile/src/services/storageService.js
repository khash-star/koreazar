/**
 * Firebase Storage upload (expo-image-picker URI).
 *
 * Web: fetch → Blob → uploadBytes() (ажиллана).
 * Native: Firebase JS SDK (uploadBytes/Blob) нь storage/unknown өгдөг тул REST API uploadType=media
 * ашиглана — raw bytes, Blob шаардлагагүй.
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../config/firebase";

const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

function contentTypeForExtension(ext) {
  const e = (ext || "jpg").toLowerCase().replace(/^\./, "");
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "heic" || e === "heif") return "image/heic";
  return "image/jpeg";
}

function base64ToUint8Array(b64) {
  const binary = typeof atob !== "undefined" ? atob(b64) : "";
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function blobFromPickerUri(uri, ext, timestamp) {
  let readUri = uri;
  if (Platform.OS !== "web" && uri.startsWith("content://")) {
    const cached = `${FileSystem.cacheDirectory}upload_${timestamp}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: cached });
    readUri = cached;
  }
  const response = await fetch(readUri);
  if (!response.ok) throw new Error("Зураг уншихад алдаа гарлаа.");
  return response.blob();
}

/**
 * Native-only: Firebase Storage REST API uploadType=media (raw bytes, no Blob).
 */
async function uploadViaRestApi(storageRef, bytes, contentType) {
  const user = auth.currentUser;
  if (!user) throw new Error("Нэвтэрсний дараа зураг оруулна уу.");

  const token = await user.getIdToken();
  const bucket = storageRef.bucket;
  const path = encodeURIComponent(storageRef.fullPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${path}&uploadType=media`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Firebase ${token}`);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.responseType = "text";
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Upload алдаа (${xhr.status})`;
      try {
        const j = JSON.parse(xhr.responseText || "{}");
        if (j?.error?.message) msg = j.error.message;
      } catch {
        /* ignore */
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Сүлжээний алдаа (upload)."));
    xhr.send(bytes);
  });
}

function assertStorageConfig() {
  const bucket = storage?.app?.options?.storageBucket || "";
  if (!bucket || typeof bucket !== "string") {
    throw new Error("Firebase Storage bucket тохируулагдаагүй (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET).");
  }
}

/**
 * Native: file → base64 → Uint8Array → REST API (Blob ашиглахгүй).
 */
async function uploadNative(storageRef, uri, ext, timestamp, contentType) {
  let readUri = uri;
  if (uri.startsWith("content://")) {
    const cached = `${FileSystem.cacheDirectory}upload_${timestamp}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: cached });
    readUri = cached;
  }
  const base64 = await FileSystem.readAsStringAsync(readUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ToUint8Array(base64);
  if (bytes.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Зураг хэт том. 15MB-аас бага сонгоно уу.");
  }
  await uploadViaRestApi(storageRef, bytes, contentType);
}

/**
 * Upload image from local URI (expo-image-picker result).
 */
export async function uploadImageFromUri(uri) {
  assertStorageConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const fallbackType = contentTypeForExtension(ext);

  if (Platform.OS === "web") {
    const blob = await blobFromPickerUri(uri, ext, timestamp);
    if (blob?.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error("Зураг хэт том. 15MB-аас бага сонгоно уу.");
    }
    const contentType = blob.type || fallbackType;
    await uploadBytes(storageRef, blob, { contentType });
  } else {
    await uploadNative(storageRef, uri, ext, timestamp, fallbackType);
  }

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

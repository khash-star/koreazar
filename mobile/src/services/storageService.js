/**
 * Firebase Storage upload (expo-image-picker URI).
 *
 * Web: fetch + Blob (OK in browser).
 * Native: Firebase uploadBytes/uploadString internally builds Blob from Uint8Array parts;
 * React Native Blob only allows string | Blob ("Creating blobs from ArrayBuffer..." error).
 * So on native we POST multipart/related body as raw Uint8Array via XHR (no Blob).
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SDK_VERSION } from "firebase/app";
import { storage, auth } from "../config/firebase";

function contentTypeForExtension(ext) {
  const e = (ext || "jpg").toLowerCase().replace(/^\./, "");
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "heic" || e === "heif") return "image/heic";
  return "image/jpeg";
}

function utf8Bytes(str) {
  return new TextEncoder().encode(str);
}

function concatUint8Arrays(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** Base64 → binary (no Blob). */
function base64ToUint8Array(b64) {
  const binaryString = typeof atob !== "undefined" ? atob(b64) : "";
  if (!binaryString && typeof atob === "undefined") {
    throw new Error("atob is not available for base64 decode");
  }
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Same multipart/related layout as @firebase/storage, but body is Uint8Array only.
 */
function firebaseMultipartRelatedBody({ boundary, fullPath, contentType, fileBytes }) {
  const metadataJson = JSON.stringify({
    name: fullPath,
    contentType,
  });
  const pre =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=utf-8\r\n\r\n` +
    `${metadataJson}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  return concatUint8Arrays(utf8Bytes(pre), fileBytes, utf8Bytes(post));
}

function postMultipartToFirebaseStorage(storageRef, body, boundary) {
  const bucket = storageRef.bucket;
  const fullPath = storageRef.fullPath;
  const encodedPath = encodeURIComponent(fullPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodedPath}`;

  return new Promise((resolve, reject) => {
    const user = auth.currentUser;
    if (!user) {
      reject(new Error("Нэвтэрсний дараа зураг оруулна уу."));
      return;
    }

    user
      .getIdToken()
      .then((token) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Firebase ${token}`);
        xhr.setRequestHeader("X-Goog-Upload-Protocol", "multipart");
        xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`);
        xhr.setRequestHeader("X-Firebase-Storage-Version", `webjs/${SDK_VERSION}`);
        const appId = storage.app?.options?.appId;
        if (appId) {
          xhr.setRequestHeader("X-Firebase-GMPID", appId);
        }
        xhr.responseType = "text";
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }
          let msg = `Upload failed (${xhr.status})`;
          try {
            const err = JSON.parse(xhr.responseText || "{}");
            if (err?.error?.message) msg = err.error.message;
          } catch {
            /* ignore */
          }
          reject(new Error(msg));
        };
        xhr.onerror = () => reject(new Error("Сүлжээний алдаа (upload)."));
        xhr.send(body);
      })
      .catch(reject);
  });
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
    const fileBytes = base64ToUint8Array(base64);
    const boundary =
      Math.random().toString().slice(2) + Math.random().toString().slice(2);
    const body = firebaseMultipartRelatedBody({
      boundary,
      fullPath: storageRef.fullPath,
      contentType,
      fileBytes,
    });
    await postMultipartToFirebaseStorage(storageRef, body, boundary);
  }

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

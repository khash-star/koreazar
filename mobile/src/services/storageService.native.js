/**
 * iOS / Android: Firebase Storage REST upload (multipart/Blob-оос зайлсхийх).
 */
import * as FileSystem from "expo-file-system/legacy";
import { ref, getDownloadURL } from "firebase/storage";
import { SDK_VERSION } from "firebase/app";
import { storage, auth, getStorageBucketId } from "../config/firebase";

const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;

function contentTypeForExtension(ext) {
  const e = (ext || "jpg").toLowerCase().replace(/^\./, "");
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "heic" || e === "heif") return "image/heic";
  return "image/jpeg";
}

async function uploadViaRestApi(storageRef, fileUri, contentType) {
  const user = auth.currentUser;
  if (!user) throw new Error("Нэвтэрсний дараа зураг оруулна уу.");

  const bucket = getStorageBucketId();
  if (!bucket) {
    throw new Error("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET тохируулаагүй байна.");
  }

  const token = await user.getIdToken();
  const objectPath = storageRef.fullPath;
  const nameParam = encodeURIComponent(objectPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${nameParam}&uploadType=media`;

  const appId = storage.app?.options?.appId;
  const headers = {
    Authorization: `Firebase ${token}`,
    "Content-Type": contentType,
    "X-Firebase-Storage-Version": `webjs/${SDK_VERSION}`,
  };
  if (appId) headers["X-Firebase-GMPID"] = appId;

  const res = await FileSystem.uploadAsync(url, fileUri, {
    headers,
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (res.status >= 200 && res.status < 300) return;

  let msg = `Upload алдаа (${res.status})`;
  try {
    const text = typeof res.body === "string" ? res.body : "";
    const j = JSON.parse(text || "{}");
    if (j?.error?.message) msg = j.error.message;
  } catch {
    /* ignore */
  }
  if (res.status === 404) {
    msg += `\n\nBucket "${bucket}" олдсонгүй. Firebase Console → Storage дээрх bucket болон EAS дээрх EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET яг ижил эсэхийг шалгана уу.`;
  }
  throw new Error(msg);
}

function assertStorageConfig() {
  if (!getStorageBucketId()) {
    throw new Error("Firebase Storage bucket тохируулагдаагүй (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET).");
  }
}

async function uploadNative(storageRef, uri, ext, timestamp, contentType) {
  let readUri = uri;
  if (uri.startsWith("content://")) {
    const cached = `${FileSystem.cacheDirectory}upload_${timestamp}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: cached });
    readUri = cached;
  }
  const fileInfo = await FileSystem.getInfoAsync(readUri, { size: true });
  if (!fileInfo.exists) {
    throw new Error("Зургийн файл олдсонгүй.");
  }
  if (typeof fileInfo.size === "number" && fileInfo.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Зураг хэт том. 15MB-аас бага сонгоно уу.");
  }
  await uploadViaRestApi(storageRef, readUri, contentType);
}

export async function uploadImageFromUri(uri) {
  assertStorageConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const fallbackType = contentTypeForExtension(ext);

  await uploadNative(storageRef, uri, ext, timestamp, fallbackType);

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

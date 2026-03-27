/**
 * Expo web: Blob → uploadBytes (native багцад орохгүй).
 */
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, getStorageBucketId } from "../config/firebase";

const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;

function contentTypeForExtension(ext) {
  const e = (ext || "jpg").toLowerCase().replace(/^\./, "");
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "heic" || e === "heif") return "image/heic";
  return "image/jpeg";
}

function extensionForMimeType(mimeType) {
  const t = String(mimeType || "").toLowerCase();
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  if (t === "image/gif") return "gif";
  if (t === "image/heic") return "heic";
  if (t === "image/heif") return "heif";
  return "jpg";
}

function extractExtensionFromName(fileName) {
  if (!fileName || typeof fileName !== "string") return "";
  const name = fileName.split("?")[0];
  const ext = name.includes(".") ? name.split(".").pop() : "";
  return String(ext || "").trim().toLowerCase();
}

async function blobFromPickerUri(uri) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Зураг уншихад алдаа гарлаа.");
  return response.blob();
}

function assertStorageConfig() {
  if (!getStorageBucketId()) {
    throw new Error("Firebase Storage bucket тохируулагдаагүй (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET).");
  }
}

export async function uploadImageFromUri(uri, options = {}) {
  assertStorageConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const extFromName = extractExtensionFromName(options.fileName);
  const extFromUri = extractExtensionFromName(uri);
  const extFromMime = extensionForMimeType(options.mimeType);
  const ext = extFromName || extFromUri || extFromMime || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const fallbackType = options.mimeType || contentTypeForExtension(ext);

  const blob = await blobFromPickerUri(uri);
  if (blob?.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Зураг хэт том. 15MB-аас бага сонгоно уу.");
  }
  const contentType = blob.type || fallbackType;
  await uploadBytes(storageRef, blob, { contentType });

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

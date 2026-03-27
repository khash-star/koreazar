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

export async function uploadImageFromUri(uri) {
  assertStorageConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${timestamp}_${random}.${ext}`;
  const storageRef = ref(storage, `images/${fileName}`);
  const fallbackType = contentTypeForExtension(ext);

  const blob = await blobFromPickerUri(uri);
  if (blob?.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Зураг хэт том. 15MB-аас бага сонгоно уу.");
  }
  const contentType = blob.type || fallbackType;
  await uploadBytes(storageRef, blob, { contentType });

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

/**
 * iOS / Android: Firebase Storage REST upload (multipart/Blob-оос зайлсхийх).
 */
import * as FileSystem from "expo-file-system/legacy";
import { ref, getDownloadURL } from "firebase/storage";
import { createImageVariants } from "../utils/createImageVariants";
import { normalizeImageOrientation } from "../utils/normalizeImageOrientation";
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

export async function uploadImageFromUri(uri, options = {}) {
  assertStorageConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  const suffix = options.nameSuffix ? `_${String(options.nameSuffix)}` : "";

  let uploadUri = uri;
  let uploadExt;
  let uploadType;

  if (options.format === "webp") {
    uploadExt = "webp";
    uploadType = "image/webp";
    if (!options.skipNormalize) {
      uploadUri = await normalizeImageOrientation(uri);
    }
  } else if (options.format === "jpeg" || options.format === "jpg") {
    uploadExt = "jpg";
    uploadType = "image/jpeg";
    if (!options.skipNormalize) {
      uploadUri = await normalizeImageOrientation(uri);
    }
  } else if (options.skipNormalize) {
    const extFromUri = extractExtensionFromName(uri);
    uploadExt = extFromUri || extensionForMimeType(options.mimeType) || "jpg";
    uploadType = options.mimeType || contentTypeForExtension(uploadExt);
  } else {
    const extFromName = extractExtensionFromName(options.fileName);
    const extFromUri = extractExtensionFromName(uri);
    const extFromMime = extensionForMimeType(options.mimeType);
    const ext = extFromName || extFromUri || extFromMime || "jpg";

    uploadUri = await normalizeImageOrientation(uri);
    const normalizedToJpeg =
      uploadUri !== uri || uploadUri.endsWith(".jpg") || uploadUri.endsWith(".jpeg");
    uploadExt = normalizedToJpeg ? "jpg" : ext;
    uploadType = normalizedToJpeg
      ? contentTypeForExtension("jpg")
      : options.mimeType || contentTypeForExtension(ext);
  }

  const fileName = `${timestamp}_${random}${suffix}.${uploadExt}`;
  const storageRef = ref(storage, `images/${fileName}`);

  await uploadNative(storageRef, uploadUri, uploadExt, timestamp, uploadType);

  const downloadURL = await getDownloadURL(storageRef);
  return { file_url: downloadURL };
}

/**
 * Picker URI → 4 listing variants (web CreateListing parity). All uploads must succeed or throws (no partial listing save).
 * @param {string} sourceUri
 * @param {{ mimeType?: string, fileName?: string }} [pickerMeta]
 */
export async function uploadListingImageVariants(sourceUri, pickerMeta = {}) {
  const normalized = await normalizeImageOrientation(sourceUri);
  const built = await createImageVariants(normalized);
  const format = built.format === "jpeg" ? "jpeg" : "webp";

  const specs = [
    ["w800", built.w800],
    ["w640", built.w640],
    ["w400", built.w400],
    ["w150", built.w150],
  ];

  const out = {};
  await Promise.all(
    specs.map(async ([nameSuffix, localUri]) => {
      const { file_url } = await uploadImageFromUri(localUri, {
        skipNormalize: true,
        nameSuffix,
        format,
        mimeType: format === "webp" ? "image/webp" : "image/jpeg",
        fileName: pickerMeta.fileName,
      });
      out[nameSuffix] = file_url;
    })
  );

  return {
    w800: out.w800,
    w640: out.w640,
    w400: out.w400,
    w150: out.w150,
  };
}

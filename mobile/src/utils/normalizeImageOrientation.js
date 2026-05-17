/**
 * Bake EXIF orientation into pixel data (iPhone photos). react-native Image / image-viewing
 * ignore EXIF; expo-image does not. Use before upload and before lightbox display URIs.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

/** @type {Map<string, string>} remote/local source URI → normalized file:// URI */
const memCache = new Map();

const MIN_CACHED_IMAGE_BYTES = 256;

async function isReadableImageFile(uri) {
  if (!uri || typeof uri !== "string") return false;
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return Boolean(info.exists && typeof info.size === "number" && info.size >= MIN_CACHED_IMAGE_BYTES);
  } catch {
    return false;
  }
}

async function dropBadNormalizedFile(remoteUri, filePath) {
  memCache.delete(remoteUri);
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch {
    /* ignore */
  }
}

function cacheKeyForUri(uri) {
  let h = 0;
  for (let i = 0; i < uri.length; i += 1) {
    h = (h * 31 + uri.charCodeAt(i)) | 0;
  }
  return `n${Math.abs(h).toString(36)}`;
}

/**
 * Re-encode image with orientation applied. Empty actions = respect EXIF, output upright JPEG.
 * @param {string} uri
 * @returns {Promise<string>}
 */
export async function normalizeImageOrientation(uri) {
  if (!uri || typeof uri !== "string" || Platform.OS === "web") {
    return uri;
  }

  const hit = memCache.get(uri);
  if (hit) {
    if (await isReadableImageFile(hit)) return hit;
    await dropBadNormalizedFile(uri, hit);
  }

  const key = cacheKeyForUri(uri);
  const outPath = `${FileSystem.cacheDirectory}ori_norm_${key}.jpg`;
  try {
    if (await isReadableImageFile(outPath)) {
      memCache.set(uri, outPath);
      return outPath;
    }
    await FileSystem.deleteAsync(outPath, { idempotent: true });
  } catch {
    /* continue */
  }

  let localUri = uri;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const dlPath = `${FileSystem.cacheDirectory}ori_dl_${key}`;
    try {
      const dl = await FileSystem.downloadAsync(uri, dlPath);
      localUri = dl.uri;
    } catch {
      return uri;
    }
  }

  try {
    const { uri: manipulated } = await ImageManipulator.manipulateAsync(localUri, [], {
      compress: 0.92,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    await FileSystem.copyAsync({ from: manipulated, to: outPath });
    if (await isReadableImageFile(outPath)) {
      memCache.set(uri, outPath);
      return outPath;
    }
    await dropBadNormalizedFile(uri, outPath);
    return uri;
  } catch {
    return uri;
  }
}

/** Normalize for lightbox; fall back to remote HTTPS if cache/file is unusable. */
export async function resolveLightboxDisplayUri(remoteUri) {
  const normalized = await normalizeImageOrientation(remoteUri);
  if (normalized === remoteUri) return remoteUri;
  if (await isReadableImageFile(normalized)) return normalized;
  const cacheRoot = FileSystem.cacheDirectory || "";
  if (
    normalized.startsWith("file://") ||
    (cacheRoot && normalized.startsWith(cacheRoot))
  ) {
    await dropBadNormalizedFile(remoteUri, normalized);
  }
  return remoteUri;
}

/** Clear in-memory map only (disk cache kept for faster reopen). */
export function invalidateNormalizeImageCache() {
  memCache.clear();
}

/** Run async work on indices with at most `limit` tasks in flight. */
export async function normalizeIndicesWithConcurrency(indices, limit, normalizeOne) {
  const queue = indices.filter((i) => Number.isInteger(i) && i >= 0);
  if (queue.length === 0) return;
  const workers = Math.max(1, Math.min(limit, queue.length));
  let cursor = 0;
  const runWorker = async () => {
    while (cursor < queue.length) {
      const i = queue[cursor];
      cursor += 1;
      await normalizeOne(i);
    }
  };
  await Promise.all(Array.from({ length: workers }, () => runWorker()));
}

/** current, then current±1, then remaining (for lightbox preload). */
export function lightboxNormalizeOrder(length, currentIndex) {
  if (length <= 0) return [];
  const cur = Math.min(Math.max(0, currentIndex), length - 1);
  const order = [cur];
  if (cur > 0) order.push(cur - 1);
  if (cur < length - 1) order.push(cur + 1);
  for (let i = 0; i < length; i += 1) {
    if (!order.includes(i)) order.push(i);
  }
  return order;
}

/**
 * Listing image variants — web `createImageVariants` parity (3:2 center-crop, w800/w640/w400/w150).
 * Input must be orientation-normalized `file://` URI.
 */
import { Image } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const CARD_ASPECT = 3 / 2;

const VARIANT_SPECS = [
  { key: "w800", width: 800, quality: 0.78 },
  { key: "w640", width: 640, quality: 0.76 },
  { key: "w400", width: 400, quality: 0.75 },
  { key: "w150", width: 150, quality: 0.72 },
];

function getImageSize(uri) {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err || new Error("Зургийн хэмжээ уншихад алдаа гарлаа."))
    );
  });
}

/** @param {number} iw @param {number} ih @param {number} aspect width/height */
function computeCenterCrop(iw, ih, aspect) {
  let cropW;
  let cropH;
  if (iw / ih > aspect) {
    cropH = ih;
    cropW = ih * aspect;
  } else {
    cropW = iw;
    cropH = iw / aspect;
  }
  return {
    originX: Math.max(0, Math.round((iw - cropW) / 2)),
    originY: Math.max(0, Math.round((ih - cropH) / 2)),
    width: Math.max(1, Math.round(cropW)),
    height: Math.max(1, Math.round(cropH)),
  };
}

async function renderVariants(normalizedUri, saveFormat, formatKey) {
  const { width: iw, height: ih } = await getImageSize(normalizedUri);
  const crop = computeCenterCrop(iw, ih, CARD_ASPECT);

  const out = { format: formatKey };
  await Promise.all(
    VARIANT_SPECS.map(async ({ key, width, quality }) => {
      const { uri } = await ImageManipulator.manipulateAsync(
        normalizedUri,
        [{ crop }, { resize: { width: Math.round(width) } }],
        { compress: quality, format: saveFormat }
      );
      out[key] = uri;
    })
  );
  return out;
}

/**
 * @param {string} normalizedUri — upright local URI (see normalizeImageOrientation)
 * @returns {Promise<{ format: 'webp'|'jpeg', w800: string, w640: string, w400: string, w150: string }>}
 */
export async function createImageVariants(normalizedUri) {
  if (!normalizedUri || typeof normalizedUri !== "string") {
    throw new Error("Зургийн файл олдсонгүй.");
  }
  try {
    return await renderVariants(normalizedUri, ImageManipulator.SaveFormat.WEBP, "webp");
  } catch {
    return await renderVariants(normalizedUri, ImageManipulator.SaveFormat.JPEG, "jpeg");
  }
}

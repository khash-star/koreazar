/**
 * Compress image and convert to WebP for upload (Lighthouse: modern format, smaller size).
 * MUST: all uploads store WebP only — no PNG/JPEG fallback.
 * @param {File} file - Image file to compress (JPEG/PNG/WebP)
 * @param {number} maxWidth - Maximum width (default: 1000)
 * @param {number} maxHeight - Maximum height (default: 1000)
 * @param {number} quality - Compression quality 0-1 (default: 0.75)
 * @returns {Promise<File>} Compressed image file (WebP only)
 */
export async function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const filename = file.name.replace(/\.[^.]+$/, '') + '.webp';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], filename, { type: 'image/webp', lastModified: Date.now() }));
            } else {
              reject(new Error('WebP export failed. Use a modern browser.'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

const CARD_ASPECT = 3 / 2; // 3:2 — card/UI ratio

/**
 * Center-crop image to aspect ratio (e.g. 3:2), then resize to target width. Keeps variant aligned with card UI.
 * @param {HTMLImageElement} img - Loaded image element
 * @param {number} targetWidth - Output width (height = targetWidth / aspect)
 * @param {number} aspect - Width/height ratio (e.g. 3/2)
 * @param {string} filename - Output filename
 * @param {number} quality - 0-1
 * @returns {Promise<File>}
 */
function cropCenterToAspectThenResize(img, targetWidth, aspect, filename, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const iw = img.width;
    const ih = img.height;
    let cropW, cropH;
    if (iw / ih > aspect) {
      cropH = ih;
      cropW = ih * aspect;
    } else {
      cropW = iw;
      cropH = iw / aspect;
    }
    const sx = (iw - cropW) / 2;
    const sy = (ih - cropH) / 2;
    const outW = Math.round(targetWidth);
    const outH = Math.round(targetWidth / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(new File([blob], filename, { type: 'image/webp', lastModified: Date.now() }));
        else reject(new Error('Canvas to Blob failed'));
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Create w800, w400, w150 WebP variants: center-crop to 3:2 then resize. Matches card aspect so no wasted pixels or wrong crop.
 * @param {File} file - Original image file (JPEG/PNG/WebP)
 * @returns {Promise<{ w800: File, w400: File, w150: File }>}
 */
export async function createImageVariants(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const base = file.name.replace(/\.[^.]+$/, '');
          const [w800, w400, w150] = await Promise.all([
            cropCenterToAspectThenResize(img, 800, CARD_ASPECT, `${base}_w800.webp`, 0.78),
            cropCenterToAspectThenResize(img, 400, CARD_ASPECT, `${base}_w400.webp`, 0.75),
            cropCenterToAspectThenResize(img, 150, CARD_ASPECT, `${base}_w150.webp`, 0.72),
          ]);
          resolve({ w800, w400, w150 });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
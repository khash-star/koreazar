/**
 * Compress image file before upload (Lighthouse: smaller size, WebP when supported).
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 1000, good for cards/detail)
 * @param {number} maxHeight - Maximum height (default: 1000)
 * @param {number} quality - Compression quality 0-1 (default: 0.75)
 * @returns {Promise<File>} Compressed image file (WebP or JPEG)
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

        const tryBlob = (mime, filename) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], filename, { type: mime, lastModified: Date.now() }));
              } else if (mime === 'image/webp') {
                tryBlob('image/jpeg', file.name);
              } else {
                reject(new Error('Canvas to Blob failed'));
              }
            },
            mime,
            quality
          );
        };

        tryBlob('image/webp', file.name.replace(/\.[^.]+$/, '') + '.webp');
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an already-loaded image to max dimensions and return as WebP File.
 * @param {HTMLImageElement} img - Loaded image element
 * @param {number} maxWidth - Max width
 * @param {number} maxHeight - Max height
 * @param {string} filename - Output filename
 * @param {number} quality - 0-1
 * @returns {Promise<File>}
 */
function resizeImageToFile(img, maxWidth, maxHeight, filename, quality = 0.75) {
  return new Promise((resolve, reject) => {
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
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
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
 * Create w800, w400, w150 WebP variants for marketplace listing upload.
 * Storage has no resize; we upload 3 files and use the right variant in UI (card→w400, detail→w800, thumb→w150).
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
            resizeImageToFile(img, 800, 800, `${base}_w800.webp`, 0.78),
            resizeImageToFile(img, 400, 400, `${base}_w400.webp`, 0.75),
            resizeImageToFile(img, 150, 150, `${base}_w150.webp`, 0.72),
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
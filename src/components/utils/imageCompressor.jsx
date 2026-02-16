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
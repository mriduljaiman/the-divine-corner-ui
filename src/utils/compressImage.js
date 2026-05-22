const TARGET_KB = 10;
const MAX_DIMENSION = 1200;

/**
 * Compresses an image file to under 10KB using canvas.
 * Iteratively reduces quality first, then resolution if needed.
 * Returns a new File (JPEG) ready for upload.
 *
 * Usage: const compressed = await compressImage(file);
 */
export function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_DIMENSION);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        const outputName = file.name.replace(/\.[^.]+$/, '.jpg');

        const tryCompress = (quality, scale) => {
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);

          canvas.toBlob((blob) => {
            if (blob.size <= TARGET_KB * 1024) {
              resolve(new File([blob], outputName, { type: 'image/jpeg' }));
            } else if (quality > 0.1) {
              tryCompress(+(quality - 0.1).toFixed(2), scale);
            } else if (scale > 0.2) {
              tryCompress(0.6, +(scale - 0.15).toFixed(2));
            } else {
              // Best effort — can't compress further without destroying image
              resolve(new File([blob], outputName, { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', quality);
        };

        tryCompress(0.85, 1);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

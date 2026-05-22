const TARGET_KB = 40;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 1067; // 3:4 ratio

export function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Resize to fit within 800×1067 maintaining aspect ratio
        const widthRatio = MAX_WIDTH / width;
        const heightRatio = MAX_HEIGHT / height;
        const scale = Math.min(1, widthRatio, heightRatio);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        const outputName = file.name.replace(/\.[^.]+$/, '.jpg');

        const tryCompress = (quality) => {
          canvas.toBlob((blob) => {
            if (blob.size <= TARGET_KB * 1024 || quality <= 0.5) {
              resolve(new File([blob], outputName, { type: 'image/jpeg' }));
            } else {
              tryCompress(+(quality - 0.05).toFixed(2));
            }
          }, 'image/jpeg', quality);
        };

        tryCompress(0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

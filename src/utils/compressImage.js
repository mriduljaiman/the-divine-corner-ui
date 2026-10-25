// Every product photo must be at most 20KB before it goes to Cloudinary (the server enforces
// the same limit). Quality is lowered first; if that is not enough the picture is scaled down.
export const MAX_IMAGE_KB = 20;
const MAX_BYTES = MAX_IMAGE_KB * 1024;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 1067; // 3:4 ratio
const QUALITIES = [0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.42, 0.36];
const MIN_SIDE = 120;

const toBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality);
});

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} is not a readable image`)); };
  img.src = url;
});

export async function compressImage(file) {
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_WIDTH / img.width, MAX_HEIGHT / img.height);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const outputName = file.name.replace(/\.[^.]+$/, '') + '.jpg';

  for (;;) {
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff'; // JPEG has no transparency
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    for (const q of QUALITIES) {
      const blob = await toBlob(canvas, q);
      if (blob.size <= MAX_BYTES) {
        return new File([blob], outputName, { type: 'image/jpeg' });
      }
    }
    if (Math.min(width, height) <= MIN_SIDE) {
      const blob = await toBlob(canvas, 0.25);
      if (blob.size <= MAX_BYTES) return new File([blob], outputName, { type: 'image/jpeg' });
      throw new Error(`Could not compress ${file.name} under ${MAX_IMAGE_KB}KB`);
    }
    scale *= 0.85;
  }
}

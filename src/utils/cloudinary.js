/**
 * Replace Cloudinary delivery transformation to pad-with-white.
 * Works on any stored URL regardless of what transformation was baked in at upload time.
 * c_pad: fills target box preserving aspect ratio, no cropping
 * b_white: fills padding area with white
 */
export function cloudinaryPad(url, w = 800, h = 1067) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const transform = `c_pad,w_${w},h_${h},b_white,q_75,f_jpg`;
  // Replace existing transformation (segment between /upload/ and rest of path that contains _)
  const replaced = url.replace(/\/image\/upload\/c_[^/]+\//, `/image/upload/${transform}/`);
  // If no transformation was in URL, insert after /upload/
  if (replaced === url) {
    return url.replace('/image/upload/', `/image/upload/${transform}/`);
  }
  return replaced;
}

import api from './api';

export const cloudinaryService = {
  /**
   * Upload a single image
   */
  uploadImage: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/cloudinary/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Upload multiple images
   */
  uploadMultipleImages: async (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/cloudinary/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Delete an image
   */
  deleteImage: async (publicId) => {
    const response = await api.delete('/cloudinary', {
      params: { publicId },
    });
    return response.data;
  },

  /**
   * Get optimized Cloudinary URL with transformations
   */
  getOptimizedUrl: (url, options = {}) => {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    const { width, height, quality = 'auto', format = 'auto' } = options;

    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (width || height) transformations.push('c_fill', 'g_auto');
    transformations.push(`q_${quality}`, `f_${format}`);

    const transformation = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformation}/`);
  },
};

import { useState, useRef, useCallback } from 'react';
import { cloudinaryService } from '../services/cloudinaryService';
import { FiUploadCloud, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';

const TARGET_SIZE_KB = 200;

const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 1200;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
          else { width = Math.round((width / height) * MAX); height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const tryQ = (q) => {
          canvas.toBlob((blob) => {
            if (blob.size > TARGET_SIZE_KB * 1024 && q > 0.15) tryQ(+(q - 0.1).toFixed(2));
            else resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', q);
        };
        tryQ(0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const ImageUpload = ({
  onUploadComplete,
  onUploadError,
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 10,
  existingImages = [],
  onRemoveExisting,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP';
    }
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFiles = async (files) => {
    setError('');
    const fileArray = Array.from(files);

    if (multiple && fileArray.length + existingImages.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const newPreviews = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setPreviews(newPreviews);

    setUploading(true);
    setUploadProgress(0);

    try {
      const compressed = await Promise.all(fileArray.map(compressImage));

      let results;
      if (multiple && compressed.length > 1) {
        results = await cloudinaryService.uploadMultipleImages(
          compressed,
          setUploadProgress
        );
      } else {
        const result = await cloudinaryService.uploadImage(
          compressed[0],
          setUploadProgress
        );
        results = [result];
      }

      onUploadComplete(results);
      setPreviews([]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = '';
  };

  const openFileDialog = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const removePreview = (index) => {
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  return (
    <div className="image-upload-container">
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="existing-images">
          <label className="upload-label">Current Images</label>
          <div className="image-grid">
            {existingImages.map((image, index) => (
              <div key={index} className="image-preview-item">
                <img src={image.url || image} alt={`Image ${index + 1}`} />
                {onRemoveExisting && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => onRemoveExisting(index, image)}
                    aria-label="Remove image"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openFileDialog()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="progress-text">{uploadProgress}% Uploading...</span>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="upload-icon">
              <FiUploadCloud />
            </div>
            <p className="drop-zone-text">
              Drag & drop images here or click to browse
            </p>
            <p className="drop-zone-hint">
              {multiple ? `Up to ${maxFiles} images, ` : ''}
              Auto-compressed to ~{TARGET_SIZE_KB}KB (JPEG, PNG, GIF, WebP)
            </p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previews.length > 0 && !uploading && (
        <div className="preview-section">
          <label className="upload-label">Selected Images</label>
          <div className="image-grid">
            {previews.map((preview, index) => (
              <div key={index} className="image-preview-item">
                <img src={preview.preview} alt={preview.name} />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removePreview(index)}
                  aria-label="Remove image"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

import Skeleton from './Skeleton';

const ProductCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card skeleton-card">
          {/* Image Skeleton */}
          <div className="product-image-container">
            <Skeleton variant="thumbnail" height="250px" />
          </div>

          {/* Info Skeleton */}
          <div className="product-info">
            {/* Category */}
            <Skeleton variant="text" width="30%" height="12px" />

            {/* Title */}
            <div style={{ marginTop: '8px' }}>
              <Skeleton variant="text" width="85%" height="18px" />
            </div>

            {/* Rating */}
            <div style={{ marginTop: '8px' }}>
              <Skeleton variant="text" width="50%" height="14px" />
            </div>

            {/* Price */}
            <div style={{ marginTop: '12px' }}>
              <Skeleton variant="text" width="40%" height="24px" />
            </div>
          </div>

          {/* Button Skeleton */}
          <div style={{ padding: '0 16px 16px' }}>
            <Skeleton variant="button" width="100%" height="44px" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;

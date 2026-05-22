import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import {
  FiShoppingCart,
  FiHeart,
  FiEye,
  FiStar,
  FiLoader,
  FiImage,
} from 'react-icons/fi';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      showToast.warning('Please login to add items to cart');
      return;
    }

    if (product.stockQuantity === 0) {
      showToast.error('This product is out of stock');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product.id, 1);
      showToast.addedToCart(product.name);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const showDiscountBadge = hasDiscount && discountPercent > 0;

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`} className="product-link">
        {/* Product Image */}
        <div className="product-image-container">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="product-image"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="no-image">
              <FiImage />
              <span>No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="product-badges">
            {product.featured && (
              <span className="badge badge-featured">
                <FiStar /> Featured
              </span>
            )}
            {showDiscountBadge && (
              <span className="badge badge-discount">{discountPercent}% Discount</span>
            )}
            {product.stockQuantity === 0 && (
              <span className="badge badge-out-of-stock">Out of Stock</span>
            )}
          </div>

          {/* Quick Actions Overlay */}
          <div className={`product-overlay ${isHovered ? 'visible' : ''}`}>
            <button className="overlay-btn" title="Add to Wishlist">
              <FiHeart />
            </button>
            <Link href={`/products/${product.id}`} className="overlay-btn" title="Quick View">
              <FiEye />
            </Link>
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <p className="product-category">{product.category?.name || product.categoryName || ''}</p>
          <h3 className="product-name">{product.name}</h3>

          {/* Rating placeholder */}
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={i < 4 ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <span className="rating-count">(24)</span>
          </div>

          {/* Price */}
          <div className="product-price">
            <span className="current-price">₹{displayPrice?.toLocaleString()}</span>
            {hasDiscount && (
              <span className="original-price">₹{product.price?.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <button
        className={`add-to-cart-btn ${adding ? 'loading' : ''}`}
        onClick={handleAddToCart}
        disabled={adding || product.stockQuantity === 0}
      >
        {adding ? (
          <>
            <FiLoader className="spin" /> Adding...
          </>
        ) : (
          <>
            <FiShoppingCart /> Add to Cart
          </>
        )}
      </button>
    </div>
  );
};

export default ProductCard;

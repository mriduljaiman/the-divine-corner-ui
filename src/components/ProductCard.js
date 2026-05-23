import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';
import { FiHeart, FiLoader } from 'react-icons/fi';
import { cloudinaryPad } from '../utils/cloudinary';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity === 0) {
      showToast.error('This product is out of stock');
      return;
    }
    try {
      setAdding(true);
      await addToCart(product.id, 1, { name: product.name, price: product.price, images: product.images });
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

  const imageUrl = product.images && product.images.length > 0
    ? cloudinaryPad(product.images[0])
    : null;

  return (
    <div className="meesho-card">
      <Link href={`/products/${product.id}`} className="meesho-card-link">
        {/* Image */}
        <div className="meesho-img-wrap">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="meesho-img"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="meesho-no-img">
              <span>No Image</span>
            </div>
          )}

          {/* Wishlist heart */}
          <button
            className={`meesho-wishlist-btn ${wishlisted ? 'active' : ''}`}
            aria-label="Wishlist"
            onClick={(e) => { e.preventDefault(); setWishlisted(w => !w); }}
          >
            <FiHeart size={15} />
          </button>

          {/* Out of stock overlay */}
          {product.stockQuantity === 0 && (
            <div className="meesho-oos">Out of Stock</div>
          )}

          {/* Discount badge on image */}
          {hasDiscount && discountPercent >= 5 && (
            <span className="meesho-discount-badge">{discountPercent}% off</span>
          )}
        </div>

        {/* Info */}
        <div className="meesho-info">
          <p className="meesho-name">{product.name}</p>
          <div className="meesho-price-row">
            <span className="meesho-price">₹{displayPrice?.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <>
                <span className="meesho-mrp">₹{product.price?.toLocaleString('en-IN')}</span>
                <span className="meesho-off">{discountPercent}% off</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <button
        className="meesho-add-btn"
        onClick={handleAddToCart}
        disabled={adding || product.stockQuantity === 0}
      >
        {adding && <FiLoader size={12} className="spin" />}
        {adding ? 'Adding...' : 'Add to cart'}
      </button>
    </div>
  );
};

export default ProductCard;

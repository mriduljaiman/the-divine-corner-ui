// ============ components/ProductCard.js ============
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product.id, 1);
      alert('Product added to cart!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="product-card">
      <Link href={`/products/${product.id}`}>
        <div className="product-image">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.name} />
          ) : (
            <div className="no-image">No Image</div>
          )}
          {product.featured && <span className="badge">Featured</span>}
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <div className="product-price">
            <span className="current-price">₹{displayPrice}</span>
            {hasDiscount && (
              <span className="original-price">₹{product.price}</span>
            )}
          </div>
          {product.stockQuantity === 0 && (
            <span className="out-of-stock">Out of Stock</span>
          )}
        </div>
      </Link>
      <button 
        className="btn btn-primary btn-block"
        onClick={handleAddToCart}
        disabled={adding || product.stockQuantity === 0}
      >
        {adding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ProductCard;
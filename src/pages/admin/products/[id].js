// ============ pages/products/[id].js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { productService } from '../../../services/productService';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProductById(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product.id, quantity);
      alert('Product added to cart!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (!product) return <div className="container"><h1>Product not found</h1></div>;

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discount = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-layout">
          <div className="product-images-section">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[selectedImage]} alt={product.name} />
              ) : (
                <div className="no-image-large">No Image Available</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1>{product.name}</h1>

            {product.brand && (
              <p className="product-brand">Brand: <strong>{product.brand}</strong></p>
            )}

            <div className="product-pricing">
              <span className="current-price">${displayPrice}</span>
              {hasDiscount && (
                <>
                  <span className="original-price">${product.price}</span>
                  <span className="discount-badge">{discount}% OFF</span>
                </>
              )}
            </div>

            <div className="product-availability">
              {product.stockQuantity > 0 ? (
                <span className="in-stock">
                  ✓ In Stock ({product.stockQuantity} available)
                </span>
              ) : (
                <span className="out-of-stock">✗ Out of Stock</span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary btn-large btn-block"
                onClick={handleAddToCart}
                disabled={adding || product.stockQuantity === 0}
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {product.category && (
              <div className="product-meta">
                <p>Category: <strong>{product.category.name}</strong></p>
                {product.sku && <p>SKU: <strong>{product.sku}</strong></p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
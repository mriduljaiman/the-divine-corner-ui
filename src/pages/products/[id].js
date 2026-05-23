import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { cloudinaryPad } from '../../utils/cloudinary';
import {
  FiShoppingCart, FiArrowLeft, FiStar, FiPackage,
  FiTag, FiLoader, FiImage, FiCheck, FiMinus, FiPlus
} from 'react-icons/fi';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productService.getProductById(id);
      setProduct(res.data);
    } catch {
      showToast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      showToast.warning('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }
    if (product.stockQuantity === 0) {
      showToast.error('This product is out of stock');
      return;
    }
    try {
      setAdding(true);
      await addToCart(product.id, quantity);
      showToast.addedToCart(product.name);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-loading-inner">
          <FiLoader className="spin" size={40} />
          <p>Loading product...</p>
        </div>
        <style jsx>{`
          .pd-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
          .pd-loading-inner { text-align: center; color: var(--gray-500); }
          .pd-loading-inner p { margin-top: 1rem; font-size: 1rem; }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!product) return null;

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const inStock = product.stockQuantity > 0;

  const fmt = (n) => Number(n).toLocaleString('en-IN');

  return (
    <div className="pd-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          {product.category?.name && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.id}`}>{product.category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>

        <div className="pd-layout">
          {/* Image Gallery */}
          <div className="pd-gallery">
            <div className="pd-main-image">
              {images.length > 0 && !imageError[activeImage] ? (
                <img
                  src={cloudinaryPad(images[activeImage])}
                  alt={product.name}
                  onError={() => setImageError(prev => ({ ...prev, [activeImage]: true }))}
                />
              ) : (
                <div className="pd-no-image">
                  <FiImage size={64} />
                  <span>No Image</span>
                </div>
              )}

              {/* Badges */}
              <div className="pd-badges">
                {product.featured && <span className="badge badge-featured"><FiStar size={12} /> Featured</span>}
                {hasDiscount && discountPercent > 0 && (
                  <span className="badge badge-discount">{discountPercent}% Discount</span>
                )}
                {!inStock && <span className="badge badge-out-of-stock">Out of Stock</span>}
              </div>
            </div>

            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${i === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    {!imageError[i] ? (
                      <img src={cloudinaryPad(img, 200, 267)} alt={`${product.name} ${i + 1}`} onError={() => setImageError(prev => ({ ...prev, [i]: true }))} />
                    ) : (
                      <div className="pd-thumb-placeholder"><FiImage /></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="pd-info">
            {product.category?.name && (
              <Link href={`/products?category=${product.category.id}`} className="pd-category">
                {product.category.name}
              </Link>
            )}

            <h1 className="pd-title">{product.name}</h1>

            {product.brand && (
              <p className="pd-brand">Brand: <strong>{product.brand}</strong></p>
            )}

            {/* Color Variants */}
            {(product.color || (product.variants && product.variants.length > 0)) && (
              <div className="pd-variants">
                <p className="pd-variants-label">
                  Color: <strong>{product.color || 'Default'}</strong>
                </p>
                <div className="pd-variants-swatches">
                  {/* Current product swatch */}
                  <div className="pd-swatch pd-swatch-active" title={product.color || 'Current'}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.color || 'Current'} />
                    ) : (
                      <div className="pd-swatch-dot" style={{ background: product.color?.toLowerCase() || '#ccc' }} />
                    )}
                    <span className="pd-swatch-check">✓</span>
                  </div>
                  {/* Other variants */}
                  {product.variants?.map(v => (
                    <Link key={v.id} href={`/products/${v.id}`} className="pd-swatch" title={v.color || ''}>
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.color || ''} />
                      ) : (
                        <div className="pd-swatch-dot" style={{ background: v.color?.toLowerCase() || '#ccc' }} />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="pd-rating">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={i < 4 ? 'star-filled' : 'star-empty'} size={16} />
              ))}
              <span className="pd-rating-count">(24 reviews)</span>
            </div>

            {/* Price */}
            <div className="pd-price-block">
              <span className="pd-price">₹{fmt(displayPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="pd-original-price">₹{fmt(product.price)}</span>
                  <span className="pd-discount-tag">Save {discountPercent}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={`pd-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
              {inStock ? (
                <><FiCheck size={14} /> In Stock ({product.stockQuantity} available)</>
              ) : (
                <><FiPackage size={14} /> Out of Stock</>
              )}
            </div>

            {/* Quantity */}
            {inStock && (
              <div className="pd-quantity">
                <label>Quantity</label>
                <div className="pd-qty-controls">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="pd-qty-btn"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="pd-qty-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="pd-qty-btn"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              className={`pd-add-btn ${adding ? 'loading' : ''}`}
              onClick={handleAddToCart}
              disabled={adding || !inStock}
            >
              {adding ? (
                <><FiLoader className="spin" size={18} /> Adding to Cart...</>
              ) : (
                <><FiShoppingCart size={18} /> {inStock ? 'Add to Cart' : 'Out of Stock'}</>
              )}
            </button>

            {/* Meta Info */}
            <div className="pd-meta">
              {product.sku && (
                <div className="pd-meta-row">
                  <span className="pd-meta-label"><FiTag size={13} /> SKU</span>
                  <span className="pd-meta-value">{product.sku}</span>
                </div>
              )}
              {product.category?.name && (
                <div className="pd-meta-row">
                  <span className="pd-meta-label">Category</span>
                  <span className="pd-meta-value">{product.category.name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pd-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="pd-back">
          <button onClick={() => router.back()} className="btn btn-ghost">
            <FiArrowLeft /> Back
          </button>
        </div>
      </div>

      <style jsx>{`
        .pd-page { padding: 2rem 0 4rem; }

        .pd-breadcrumb {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: var(--gray-500);
          margin-bottom: 2rem; flex-wrap: wrap;
        }
        .pd-breadcrumb a { color: var(--primary); }
        .pd-breadcrumb a:hover { text-decoration: underline; }
        .pd-breadcrumb-current { color: var(--gray-700); font-weight: 500; }

        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
          margin-bottom: 2rem;
        }

        .pd-main-image {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #fff;
          border: 1px solid var(--gray-200);
          padding: 8px;
          box-sizing: border-box;
        }
        .pd-main-image img {
          width: 100%; height: 100%; object-fit: contain; display: block;
        }
        .pd-no-image {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: var(--gray-400); gap: 1rem;
        }

        .pd-badges {
          position: absolute; top: 1rem; left: 1rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }

        .pd-thumbnails {
          display: flex; gap: 0.75rem; margin-top: 1rem;
          flex-wrap: wrap;
        }
        .pd-thumb {
          width: 72px; height: 72px;
          border-radius: var(--radius);
          overflow: hidden;
          border: 2px solid var(--gray-200);
          cursor: pointer;
          transition: border-color 0.2s;
          background: var(--gray-100);
          padding: 0;
        }
        .pd-thumb.active { border-color: var(--primary); }
        .pd-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .pd-thumb-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: var(--gray-400);
        }

        .pd-category {
          display: inline-block;
          font-size: 0.75rem; font-weight: 600;
          color: var(--primary); text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        .pd-category:hover { text-decoration: underline; }

        .pd-title {
          font-size: 1.75rem; font-weight: 700;
          color: var(--gray-900); line-height: 1.3;
          margin-bottom: 0.5rem;
        }

        .pd-brand {
          font-size: 0.9375rem; color: var(--gray-500);
          margin-bottom: 0.75rem;
        }

        .pd-rating {
          display: flex; align-items: center; gap: 0.25rem;
          margin-bottom: 1.25rem;
        }
        .pd-rating-count { font-size: 0.875rem; color: var(--gray-500); margin-left: 0.5rem; }

        .pd-price-block {
          display: flex; align-items: center; gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .pd-price { font-size: 2rem; font-weight: 800; color: var(--gray-900); }
        .pd-original-price {
          font-size: 1.125rem; color: var(--gray-400);
          text-decoration: line-through;
        }
        .pd-discount-tag {
          padding: 4px 10px;
          background: #fef2f2; color: var(--danger);
          border-radius: var(--radius-full);
          font-size: 0.8125rem; font-weight: 600;
        }

        .pd-stock {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.9rem; font-weight: 600;
          padding: 6px 14px; border-radius: var(--radius-full);
          margin-bottom: 1.5rem;
        }
        .pd-stock.in-stock { background: #f0fdf4; color: var(--success-dark); }
        .pd-stock.out-of-stock { background: #fef2f2; color: var(--danger); }

        .pd-quantity { margin-bottom: 1.5rem; }
        .pd-quantity label {
          display: block; font-size: 0.875rem;
          font-weight: 500; color: var(--gray-700);
          margin-bottom: 0.5rem;
        }
        .pd-qty-controls {
          display: inline-flex; align-items: center;
          border: 2px solid var(--gray-200); border-radius: var(--radius);
          overflow: hidden;
        }
        .pd-qty-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: var(--gray-50); border: none;
          cursor: pointer; transition: background 0.15s;
        }
        .pd-qty-btn:hover:not(:disabled) { background: var(--gray-200); }
        .pd-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pd-qty-value {
          min-width: 48px; text-align: center;
          font-weight: 600; font-size: 1rem;
        }

        .pd-add-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.625rem;
          width: 100%; padding: 1rem;
          font-size: 1rem; font-weight: 700;
          color: white;
          background: var(--primary-gradient);
          border: none; border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-primary);
          margin-bottom: 1.5rem;
        }
        .pd-add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99,102,241,0.45);
        }
        .pd-add-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pd-add-btn .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .pd-meta {
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
          padding: 1rem 0; margin-bottom: 1.5rem;
        }
        .pd-meta-row {
          display: flex; justify-content: space-between;
          padding: 0.375rem 0; font-size: 0.9rem;
        }
        .pd-meta-label { color: var(--gray-500); display: flex; align-items: center; gap: 0.375rem; }
        .pd-meta-value { font-weight: 500; color: var(--gray-800); }

        .pd-description { }
        .pd-description h3 {
          font-size: 1.125rem; font-weight: 600;
          color: var(--gray-800); margin-bottom: 0.75rem;
        }
        .pd-description p {
          font-size: 0.9375rem; line-height: 1.75;
          color: var(--gray-600); white-space: pre-wrap;
        }

        .pd-variants { margin-bottom: 1.25rem; }
        .pd-variants-label {
          font-size: 0.875rem; color: var(--gray-600);
          margin-bottom: 0.625rem;
        }
        .pd-variants-swatches { display: flex; gap: 0.625rem; flex-wrap: wrap; }
        .pd-swatch {
          position: relative;
          width: 56px; height: 56px;
          border-radius: var(--radius);
          overflow: hidden;
          border: 2px solid var(--gray-200);
          cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
          background: var(--gray-100);
          display: flex; align-items: center; justify-content: center;
          text-decoration: none;
        }
        .pd-swatch:hover { border-color: var(--primary); transform: scale(1.05); }
        .pd-swatch-active { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary); }
        .pd-swatch img { width: 100%; height: 100%; object-fit: cover; }
        .pd-swatch-dot { width: 28px; height: 28px; border-radius: 50%; }
        .pd-swatch-check {
          position: absolute; bottom: 2px; right: 3px;
          font-size: 10px; font-weight: 700;
          color: var(--primary); line-height: 1;
        }

        .pd-back { margin-top: 2rem; }

        @media (max-width: 768px) {
          .pd-layout { grid-template-columns: 1fr; gap: 1.5rem; }
          .pd-title { font-size: 1.375rem; }
          .pd-price { font-size: 1.5rem; }
          .pd-page { padding: 1rem 0 3rem; }
          .pd-breadcrumb { font-size: 0.8125rem; }
        }

        @media (max-width: 480px) {
          .pd-thumbnails { gap: 0.5rem; }
          .pd-thumb { width: 56px; height: 56px; }
        }
      `}</style>
    </div>
  );
}

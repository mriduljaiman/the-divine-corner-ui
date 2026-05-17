import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { productService } from '../../../services/productService';
import { FiSearch, FiX, FiPackage, FiEdit2, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

export default function InventorySearch() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const doSearch = useCallback(async (searchTerm) => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await productService.searchInventory(searchTerm, 0, 50);
      const data = response.data;
      const items = data.content || data || [];
      setProducts(items);
      setTotalCount(data.totalElements || items.length);
    } catch (err) {
      console.error('Inventory search error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (query.trim().length === 0) {
      setProducts([]);
      setSearched(false);
      setTotalCount(0);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      doSearch(query.trim());
    }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [query, doSearch]);

  const handleClear = () => {
    setQuery('');
    setProducts([]);
    setSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const getMarginInfo = (product) => {
    const sell = product.price;
    const cost = product.purchasingPrice;
    if (cost == null || sell == null) return null;
    const margin = sell - cost;
    const pct = sell > 0 ? ((margin / sell) * 100) : 0;
    return { margin, pct };
  };

  const getMarginStyle = (info) => {
    if (!info) return { color: 'var(--gray-400)' };
    if (info.margin < 0) return { color: 'var(--danger)' };
    if (info.margin === 0) return { color: 'var(--warning)' };
    if (info.pct < 10) return { color: 'var(--warning-dark)' };
    return { color: 'var(--success-dark)' };
  };

  const MarginIcon = ({ info }) => {
    if (!info) return null;
    if (info.margin < 0) return <FiTrendingDown />;
    if (info.margin === 0) return <FiMinus />;
    return <FiTrendingUp />;
  };

  if (authLoading) {
    return <div className="admin-page"><div className="container"><div className="loading">Loading...</div></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="container">

        {/* Page Header */}
        <div className="admin-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Inventory Search</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              Search products by name or SKU — see cost, selling price & margin
            </p>
          </div>
          <Link href="/admin/products/new" className="btn btn-primary">
            + Add Product
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: 'var(--spacing-lg)',
          maxWidth: '640px'
        }}>
          <FiSearch style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
            fontSize: '1.1rem',
            pointerEvents: 'none'
          }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            style={{
              width: '100%',
              padding: '14px 44px 14px 44px',
              fontSize: '1rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              transition: 'border-color var(--transition)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {query && (
            <button
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Results Info */}
        {searched && !loading && (
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
            {totalCount === 0
              ? `No products found for "${query}"`
              : `${totalCount} product${totalCount !== 1 ? 's' : ''} found`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>...</div>
            <p>Searching...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searched && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-3xl)',
            color: 'var(--gray-400)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border)'
          }}>
            <FiPackage style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', opacity: 0.4 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Type to search inventory</p>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-xs)' }}>
              Search by product name, SKU, or barcode
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading && searched && products.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-3xl)',
            color: 'var(--gray-400)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border)'
          }}>
            <FiSearch style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)', opacity: 0.4 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No products found</p>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-xs)' }}>
              Try a different name or SKU
            </p>
          </div>
        )}

        {/* Product Cards */}
        {!loading && products.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {products.map(product => {
              const marginInfo = getMarginInfo(product);
              const marginStyle = getMarginStyle(marginInfo);
              const hasCost = product.purchasingPrice != null;

              return (
                <div key={product.id} style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  transition: 'box-shadow var(--transition)'
                }}>

                  <div style={{ padding: 'var(--spacing-lg)' }}>
                    {/* Top Row: Name + SKU + Edit */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--gray-900)' }}>
                            {product.name}
                          </h3>
                          {product.sku && (
                            <span style={{
                              background: 'var(--primary-50)',
                              color: 'var(--primary-dark)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }}>
                              SKU: {product.sku}
                            </span>
                          )}
                          {product.brand && (
                            <span style={{
                              background: 'var(--gray-100)',
                              color: 'var(--gray-600)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {product.brand}
                            </span>
                          )}
                          <span style={{
                            background: product.active !== false ? '#dcfce7' : '#fee2e2',
                            color: product.active !== false ? 'var(--success-dark)' : 'var(--danger-dark)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {product.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {product.description && (
                          <p style={{
                            margin: '6px 0 0',
                            fontSize: '0.875rem',
                            color: 'var(--gray-500)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.5
                          }}>
                            {product.description}
                          </p>
                        )}
                      </div>

                      <Link href={`/admin/products/${product.id}`} className="btn btn-sm btn-secondary" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiEdit2 style={{ fontSize: '0.8rem' }} /> Edit
                      </Link>
                    </div>

                    {/* Price Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 'var(--spacing-sm)',
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--gray-100)'
                    }}>

                      {/* Purchasing Price */}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                          Cost Price
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: hasCost ? 'var(--gray-800)' : 'var(--gray-300)' }}>
                          {hasCost ? `₹${Number(product.purchasingPrice).toFixed(2)}` : '—'}
                        </span>
                      </div>

                      {/* Selling Price */}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                          Selling Price
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                        {product.discountPrice && product.discountPrice < product.price && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '4px' }}>
                            (Disc: ₹{Number(product.discountPrice).toFixed(2)})
                          </span>
                        )}
                      </div>

                      {/* Margin */}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                          Margin
                        </span>
                        {marginInfo ? (
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: marginStyle.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MarginIcon info={marginInfo} />
                            ₹{marginInfo.margin.toFixed(2)}
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                              ({marginInfo.pct.toFixed(1)}%)
                            </span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-300)' }}>
                            Add cost price to see margin
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                          Stock
                        </span>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: product.stockQuantity === 0
                            ? 'var(--danger)'
                            : product.stockQuantity < 10
                              ? 'var(--warning-dark)'
                              : 'var(--success-dark)'
                        }}>
                          {product.stockQuantity} units
                          {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                            <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>(Low)</span>
                          )}
                          {product.stockQuantity === 0 && (
                            <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>(Out)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    {product.category?.name && (
                      <div style={{ marginTop: 'var(--spacing-sm)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                          Category: <strong style={{ color: 'var(--gray-600)' }}>{product.category.name}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom nav */}
        {searched && products.length > 0 && totalCount > 50 && (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem', marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
            Showing first 50 results. Refine your search for more specific results.
          </p>
        )}
      </div>

      <style jsx>{`
        .admin-page a:hover, .admin-page button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}

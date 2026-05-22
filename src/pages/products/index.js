import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '../../components/ProductCard';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    page: 0,
  });

  useEffect(() => {
    categoryService.getAllActiveCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(prev => ({
      ...prev,
      categoryId: router.query.category || '',
      search: router.query.search || '',
      page: 0,
    }));
  }, [router.isReady, router.query.category, router.query.search]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.searchProducts(filters);
      setProducts(response.data.content || []);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    setFilters(prev => ({ ...prev, categoryId: '', minPrice: '', maxPrice: '', page: 0 }));
    setShowFilters(false);
  };

  const activeCategoryName = categories.find(c => String(c.id) === String(filters.categoryId))?.name;
  const hasActiveFilters = filters.categoryId || filters.minPrice || filters.maxPrice;

  return (
    <div className="products-app-page">
      {/* Top Filter Bar */}
      <div className="top-filter-bar">
        <button
          className={`filter-pill ${filters.categoryId ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          {activeCategoryName || 'Category'} <FiChevronDown size={13} />
        </button>
        <button
          className={`filter-pill ${(filters.minPrice || filters.maxPrice) ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          Price <FiChevronDown size={13} />
        </button>
        <button
          className={`filter-pill ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <FiFilter size={13} /> Filters
        </button>
        {hasActiveFilters && (
          <button className="filter-pill filter-clear-pill" onClick={clearFilters}>
            <FiX size={13} /> Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-row">
            <div className="filter-panel-group">
              <label htmlFor="fp-category">Category</label>
              <select
                id="fp-category"
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-panel-group">
              <label htmlFor="fp-min">Min Price</label>
              <input
                id="fp-min"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="₹ Min"
              />
            </div>
            <div className="filter-panel-group">
              <label htmlFor="fp-max">Max Price</label>
              <input
                id="fp-max"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="₹ Max"
              />
            </div>
          </div>
          <div className="filter-panel-actions">
            <button className="btn btn-sm btn-secondary" onClick={clearFilters}>Clear</button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowFilters(false)}>Apply</button>
          </div>
        </div>
      )}

      {/* Product count */}
      {!loading && pagination.totalElements > 0 && (
        <p className="products-result-count">{pagination.totalElements} products</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="meesho-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="meesho-skeleton-card">
              <div className="skeleton meesho-skeleton-img" />
              <div className="skeleton meesho-skeleton-line" style={{ width: '80%' }} />
              <div className="skeleton meesho-skeleton-line" style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="meesho-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="no-products-state">
          <p>No products found</p>
          {hasActiveFilters && (
            <button className="btn btn-sm btn-ghost" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="app-pagination">
          <button
            className="pag-btn"
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            ← Prev
          </button>
          <span className="pag-info">{pagination.page + 1} / {pagination.totalPages}</span>
          <button
            className="pag-btn"
            disabled={pagination.page === pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

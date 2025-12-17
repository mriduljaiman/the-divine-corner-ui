// ============ pages/products/index.js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '../../components/ProductCard';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    page: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (router.query.category) {
      setFilters(prev => ({ ...prev, categoryId: router.query.category }));
    }
  }, [router.query.category]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllActiveCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.searchProducts(filters);
      setProducts(response.data.content);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  return (
    <div className="products-page">
      <div className="container">
        <h1>Products</h1>
        
        <div className="products-layout">
          <aside className="filters-sidebar">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
              />
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
              />
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
              />
            </div>

            <button 
              className="btn btn-secondary btn-block"
              onClick={() => setFilters({
                categoryId: '',
                minPrice: '',
                maxPrice: '',
                search: '',
                page: 0
              })}
            >
              Clear Filters
            </button>
          </aside>

          <div className="products-content">
            {loading ? (
              <div className="loading">Loading products...</div>
            ) : products.length > 0 ? (
              <>
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={pagination.page === 0}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {pagination.page + 1} of {pagination.totalPages}</span>
                    <button
                      disabled={pagination.page === pagination.totalPages - 1}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-products">No products found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
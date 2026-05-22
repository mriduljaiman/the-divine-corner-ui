import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAllProducts(0, 20),
          categoryService.getAllActiveCategories(),
        ]);
        setProducts(productsRes.data.content || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-app">
      {/* Category Horizontal Scroll */}
      <div className="cat-scroll-bar">
        <div className="cat-scroll-inner">
          <Link href="/products" className="cat-chip">
            <div className="cat-chip-img-wrap">
              <span className="cat-chip-emoji">🛍️</span>
            </div>
            <span className="cat-chip-label">All</span>
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="cat-chip"
            >
              <div className="cat-chip-img-wrap">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="cat-chip-img" />
                ) : (
                  <span className="cat-chip-emoji">{cat.icon || '🏷️'}</span>
                )}
              </div>
              <span className="cat-chip-label">
                {cat.name.length > 10 ? `${cat.name.slice(0, 9)}…` : cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="home-products-section">
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
          <>
            <div className="meesho-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="home-view-more">
              <Link href="/products" className="btn btn-secondary">View All Products</Link>
            </div>
          </>
        ) : (
          <div className="home-empty">
            <p>No products available yet.</p>
            <Link href="/products" className="btn btn-primary btn-sm">Browse All</Link>
          </div>
        )}
      </div>
    </div>
  );
}

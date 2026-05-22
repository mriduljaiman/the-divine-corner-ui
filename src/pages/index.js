import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import Link from 'next/link';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAllProducts(0, 20),
        categoryService.getAllActiveCategories()
      ]);
      setProducts(productsRes.data.content || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <HeroBanner />

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="categories-section">
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <div className="categories-grid">
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="category-card"
                >
                  <div className="category-icon-wrap">
                    {category.icon ? (
                      <span className="category-emoji">{category.icon}</span>
                    ) : category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="category-img" />
                    ) : (
                      <span className="category-emoji">🛍️</span>
                    )}
                  </div>
                  <h3>{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-title">All Products</h2>
            <Link href="/products" className="view-all-link">View All →</Link>
          </div>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="no-products">No products available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

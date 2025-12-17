// ============ pages/index.js ============
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, categoriesRes] = await Promise.all([
        productService.getFeaturedProducts(),
        categoryService.getAllActiveCategories()
      ]);
      setFeatured(featuredRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to The Divine Corner</h1>
            <p>Discover amazing products at unbeatable prices</p>
            <Link href="/products" className="btn btn-primary btn-large">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

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
                {category.imageUrl && (
                  <img src={category.imageUrl} alt={category.name} />
                )}
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
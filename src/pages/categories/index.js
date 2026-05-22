import { useState, useEffect } from 'react';
import Link from 'next/link';
import { categoryService } from '../../services/categoryService';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAllActiveCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="categories-app-page">
      <h1 className="categories-page-title">Categories</h1>

      {loading ? (
        <div className="categories-app-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="categories-skeleton-card">
              <div className="skeleton categories-skeleton-img" />
              <div className="skeleton categories-skeleton-line" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="categories-app-grid">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="categories-app-card"
            >
              <div className="categories-app-img-wrap">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="categories-app-img" />
                ) : (
                  <span className="categories-app-emoji">{cat.icon || '🛒'}</span>
                )}
              </div>
              <span className="categories-app-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="no-products-state">
          <p>No categories found.</p>
        </div>
      )}
    </div>
  );
}

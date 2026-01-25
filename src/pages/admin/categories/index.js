import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/categories/${id}`);
      alert('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      alert('Failed to delete category: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Categories</h1>
        <button
          className="btn-primary"
          onClick={() => router.push('/admin/categories/new')}
        >
          + Add Category
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            {category.imageUrl && (
              <img src={category.imageUrl} alt={category.name} />
            )}
            <div className="category-info">
              <h3>{category.name}</h3>
              <p className="description">{category.description}</p>
              {category.skuPrefix && (
                <p className="sku-prefix">SKU Prefix: <strong>{category.skuPrefix}</strong></p>
              )}
              <span className={`status ${category.active ? 'active' : 'inactive'}`}>
                {category.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="category-actions">
              <button
                className="btn-edit"
                onClick={() => router.push(`/admin/categories/${category.id}`)}
              >
                Edit
              </button>
              <button
                className="btn-delete"
                onClick={() => deleteCategory(category.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="empty-state">
          <p>No categories found. Create your first category!</p>
        </div>
      )}

      <style jsx>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          margin: 0;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .category-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .category-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .category-info {
          padding: 1.5rem;
        }

        .category-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .sku-prefix {
          background: #f3f4f6;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .category-actions {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-edit, .btn-delete {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-edit {
          background: #6366f1;
          color: white;
        }

        .btn-edit:hover {
          background: #4f46e5;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
}

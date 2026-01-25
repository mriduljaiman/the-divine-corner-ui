import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export default function EditCategory() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    skuPrefix: '',
    active: true
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const response = await axios.get(`/categories/${id}`);
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        imageUrl: response.data.imageUrl || '',
        skuPrefix: response.data.skuPrefix || '',
        active: response.data.active !== false
      });
    } catch (error) {
      alert('Failed to fetch category');
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`/categories/${id}`, formData);
      alert('Category updated successfully!');
      router.push('/admin/categories');
    } catch (error) {
      alert('Failed to update category: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-container">
      <div className="form-header">
        <h1>Edit Category</h1>
        <button
          className="btn-back"
          onClick={() => router.back()}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="category-form">
        <div className="form-group">
          <label htmlFor="name">Category Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Electronics"
          />
        </div>

        <div className="form-group">
          <label htmlFor="skuPrefix">SKU Prefix</label>
          <input
            type="text"
            id="skuPrefix"
            name="skuPrefix"
            value={formData.skuPrefix}
            onChange={handleChange}
            maxLength="10"
            placeholder="e.g., ELC (max 10 characters)"
          />
          <small>This prefix will be used for auto-generating product SKUs</small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Enter category description..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .form-header h1 {
          margin: 0;
        }

        .btn-back {
          padding: 0.5rem 1rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-back:hover {
          background: #4b5563;
        }

        .category-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input:not([type="checkbox"]),
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-right: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-cancel,
        .btn-submit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #d1d5db;
        }

        .btn-submit {
          background: #6366f1;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

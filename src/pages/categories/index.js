import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { categoryService } from '../../../services/categoryService';

export default function AdminCategories() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchCategories();
    }
  }, [authLoading, isAdmin]);

  const fetchCategories = async (page = 0) => {
    try {
      setLoading(true);
      const response = await categoryService.getAllCategories(page, 20);
      setCategories(response.data.content);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryService.deleteCategory(id);
      fetchCategories(pagination.page);
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  if (authLoading || loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Manage Categories</h1>
          <Link href="/admin/categories/new" className="btn btn-primary">
            Add New Category
          </Link>
        </div>

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td>
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="table-image" />
                    ) : (
                      <div className="no-image-small">No Image</div>
                    )}
                  </td>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.description || 'N/A'}</td>
                  <td>
                    <span className={`badge ${category.active ? 'badge-success' : 'badge-danger'}`}>
                      {category.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link href={`/admin/categories/${category.id}`} className="btn btn-sm btn-secondary">
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.page === 0}
              onClick={() => fetchCategories(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page + 1} of {pagination.totalPages}</span>
            <button
              disabled={pagination.page === pagination.totalPages - 1}
              onClick={() => fetchCategories(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// ============ pages/admin/products/index.js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { productService } from '../../../services/productService';

export default function AdminProducts() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchProducts();
    }
  }, [authLoading, isAdmin]);

  const fetchProducts = async (page = 0) => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts(page, 20);
      setProducts(response.data.content);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.deleteProduct(id);
      fetchProducts(pagination.page);
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  if (authLoading || loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Manage Products</h1>
          <Link href="/admin/products/new" className="btn btn-primary">
            Add New Product
          </Link>
        </div>

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="table-image" />
                    ) : (
                      <div className="no-image-small">No Image</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td className={product.stockQuantity < 10 ? 'low-stock' : ''}>
                    {product.stockQuantity}
                  </td>
                  <td>{product.category?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link href={`/admin/products/${product.id}`} className="btn btn-sm btn-secondary">
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
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
              onClick={() => fetchProducts(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page + 1} of {pagination.totalPages}</span>
            <button
              disabled={pagination.page === pagination.totalPages - 1}
              onClick={() => fetchProducts(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import ImageUpload from '../../../components/ImageUpload';
import { showToast } from '../../../utils/toast';
import { FiPlus, FiTrash2, FiSave, FiX, FiStar } from 'react-icons/fi';

export default function NewProduct() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchasingPrice: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    categoryId: '',
    sku: '',
    brand: '',
    featured: false,
    images: []
  });

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchCategories();
    }
  }, [authLoading, isAdmin]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllActiveCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUploadComplete = (results) => {
    const newUrls = results.map(r => r.url);
    setFormData({
      ...formData,
      images: [...formData.images, ...newUrls]
    });
    showToast.success(`${results.length} image(s) uploaded successfully`);
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleAddImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, url.trim()]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const productData = {
        ...formData,
        purchasingPrice: formData.purchasingPrice ? parseFloat(formData.purchasingPrice) : null,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity),
        images: formData.images.length > 0 ? formData.images : []
      };

      await productService.createProduct(productData);
      showToast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create product';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="spinner-fullpage">
            <div className="spinner-content">
              <div className="spinner-icon" style={{ width: 48, height: 48 }}>Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Add New Product</h1>
        </div>

        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '800px' }}>
          {/* Basic Information */}
          <div className="form-section" style={{ background: 'var(--white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--gray-800)' }}>Basic Information</h3>

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Enter product description"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., PROD-001"
                />
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Samsung"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section" style={{ background: 'var(--white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--gray-800)' }}>Pricing & Stock</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Purchasing Price / Cost (₹)</label>
                <input
                  type="number"
                  name="purchasingPrice"
                  value={formData.purchasingPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.purchasingPrice && formData.price && (
              <div style={{
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-100)',
                borderRadius: 'var(--radius)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                gap: 'var(--spacing-xl)',
                flexWrap: 'wrap'
              }}>
                {(() => {
                  const cost = parseFloat(formData.purchasingPrice) || 0;
                  const sell = parseFloat(formData.price) || 0;
                  const margin = sell - cost;
                  const marginPct = sell > 0 ? ((margin / sell) * 100).toFixed(1) : 0;
                  const color = margin < 0 ? 'var(--danger)' : margin === 0 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Margin Amount</span>
                        <strong style={{ color, fontSize: '1.1rem' }}>₹{margin.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Margin %</span>
                        <strong style={{ color, fontSize: '1.1rem' }}>{marginPct}%</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Discount Price (₹)</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="form-section" style={{ background: 'var(--white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--gray-800)' }}>Product Images</h3>

            <ImageUpload
              multiple={true}
              maxFiles={5}
              existingImages={formData.images.map(url => ({ url }))}
              onUploadComplete={handleImageUploadComplete}
              onRemoveExisting={(index) => handleRemoveImage(index)}
              onUploadError={(error) => showToast.error(error)}
            />

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="btn btn-ghost btn-sm"
              >
                <FiPlus /> Add Image URL Manually
              </button>
            </div>
          </div>

          {/* Additional Options */}
          <div className="form-section" style={{ background: 'var(--white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--gray-800)' }}>Additional Options</h3>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                />
                <FiStar style={{ color: formData.featured ? 'var(--warning)' : 'var(--gray-400)' }} />
                <span>Mark as Featured Product</span>
              </label>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)', marginLeft: '28px' }}>
                Featured products appear on the home page
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="btn btn-secondary"
            >
              <FiX /> Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <FiSave /> {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import ImageUpload from '../../../components/ImageUpload';
import { showToast } from '../../../utils/toast';
import { FiSave, FiX, FiStar, FiPlus } from 'react-icons/fi';

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const { isAdmin, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
    color: '',
    variantGroupId: '',
    sizes: [],
    featured: false,
    images: []
  });

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin() && id) {
      Promise.all([fetchProduct(), fetchCategories()]);
    }
  }, [authLoading, isAdmin, id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProductById(id);
      const p = response.data;
      setFormData({
        name: p.name || '',
        description: p.description || '',
        purchasingPrice: p.purchasingPrice != null ? p.purchasingPrice : '',
        price: p.price != null ? p.price : '',
        discountPrice: p.discountPrice != null ? p.discountPrice : '',
        stockQuantity: p.stockQuantity != null ? p.stockQuantity : '',
        categoryId: p.category?.id || '',
        sku: p.sku || '',
        brand: p.brand || '',
        color: p.color || '',
        variantGroupId: p.variantGroupId || '',
        sizes: p.sizes || [],
        featured: p.featured || false,
        images: p.images || []
      });
    } catch (err) {
      showToast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllActiveCategories();
      setCategories(response.data);
    } catch (err) {
      showToast.error('Failed to load categories');
    }
  };

  const generateSku = async (categoryId) => {
    const cat = categories.find(c => String(c.id) === String(categoryId));
    if (!cat) return;
    const prefix = cat.skuPrefix || cat.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    try {
      const res = await productService.searchProducts({ categoryId, size: 1, page: 0 });
      const count = res.data.totalElements || 0;
      const num = String(count + 1).padStart(3, '0');
      setFormData(prev => ({ ...prev, sku: `${prefix}-${num}` }));
    } catch {
      setFormData(prev => ({ ...prev, sku: `${prefix}-001` }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (name === 'categoryId' && value) generateSku(value);
  };

  const handleImageUploadComplete = (results) => {
    const newUrls = results.map(r => r.url);
    setFormData({ ...formData, images: [...formData.images, ...newUrls] });
    showToast.success(`${results.length} image(s) uploaded`);
  };

  const handleRemoveImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleAddImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData({ ...formData, images: [...formData.images, url.trim()] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const productData = {
        ...formData,
        purchasingPrice: formData.purchasingPrice !== '' ? parseFloat(formData.purchasingPrice) : null,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice !== '' ? parseFloat(formData.discountPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity),
      };
      await productService.updateProduct(id, productData);
      showToast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update product';
      setError(message);
      showToast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const marginInfo = (() => {
    const cost = parseFloat(formData.purchasingPrice);
    const sell = parseFloat(formData.price);
    if (!cost || !sell) return null;
    const margin = sell - cost;
    const pct = sell > 0 ? ((margin / sell) * 100).toFixed(1) : 0;
    const color = margin < 0 ? 'var(--danger)' : margin === 0 ? 'var(--warning)' : 'var(--success)';
    return { margin, pct, color };
  })();

  if (authLoading || loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Edit Product</h1>
        </div>

        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '800px' }}>

          {/* Basic Information */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={sectionHeadStyle}>Basic Information</h3>

            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Enter product description" />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SKU <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400 }}>(auto-fills on category change)</span></label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g., BKS-001" />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Samsung" />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={sectionHeadStyle}>Pricing & Stock</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Purchasing Price / Cost (₹)</label>
                <input type="number" name="purchasingPrice" value={formData.purchasingPrice} onChange={handleChange} step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" min="0" placeholder="0.00" required />
              </div>
            </div>

            {marginInfo && (
              <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Margin Amount</span>
                  <strong style={{ color: marginInfo.color, fontSize: '1.1rem' }}>₹{marginInfo.margin.toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Margin %</span>
                  <strong style={{ color: marginInfo.color, fontSize: '1.1rem' }}>{marginInfo.pct}%</strong>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Discount Price (₹)</label>
                <input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} min="0" placeholder="0" required />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={sectionHeadStyle}>Product Images</h3>
            <ImageUpload
              multiple={true}
              maxFiles={5}
              existingImages={formData.images.map(url => ({ url }))}
              onUploadComplete={handleImageUploadComplete}
              onRemoveExisting={(index) => handleRemoveImage(index)}
              onUploadError={(err) => showToast.error(err)}
            />
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <button type="button" onClick={handleAddImageUrl} className="btn btn-ghost btn-sm">
                <FiPlus /> Add Image URL Manually
              </button>
            </div>
          </div>

          {/* Color Variants */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={{ ...sectionHeadStyle, marginBottom: '0.25rem' }}>Color Variants</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--spacing-lg)' }}>
              Link products that are the same design in different colors (like Meesho color swatches).
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-color">Color</label>
                <input id="edit-color" type="text" name="color" value={formData.color} onChange={handleChange} placeholder="e.g., Red, Blue, Black" />
              </div>
              <div className="form-group">
                <label htmlFor="edit-variantGroupId">Variant Group ID</label>
                <input id="edit-variantGroupId" type="text" name="variantGroupId" value={formData.variantGroupId} onChange={handleChange} placeholder="Same ID links products as color variants" />
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  Give all color variants the same group ID (e.g., <em>floral-kurti-001</em>)
                </p>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={{ ...sectionHeadStyle, marginBottom: '0.5rem' }}>Size Options</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              Select available sizes — only selected sizes will show to customers.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => {
                const active = formData.sizes.includes(size);
                return (
                  <label key={size} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    padding: '6px 14px',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius)',
                    background: active ? 'var(--primary)' : '#fff',
                    color: active ? '#fff' : 'var(--gray-700)',
                    fontWeight: 500, fontSize: '0.875rem', transition: 'all 0.15s'
                  }}>
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={active}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        sizes: active
                          ? prev.sizes.filter(s => s !== size)
                          : [...prev.sizes, size]
                      }))}
                    />
                    {size}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="form-section" style={sectionStyle}>
            <h3 style={sectionHeadStyle}>Additional Options</h3>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                <FiStar style={{ color: formData.featured ? 'var(--warning)' : 'var(--gray-400)' }} />
                <span>Mark as Featured Product</span>
              </label>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)', marginLeft: '28px' }}>
                Featured products appear on the home page
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/admin/products')} className="btn btn-secondary">
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const sectionStyle = {
  background: 'var(--white)',
  padding: 'var(--spacing-xl)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: 'var(--spacing-lg)',
  boxShadow: 'var(--shadow-sm)'
};

const sectionHeadStyle = {
  marginBottom: 'var(--spacing-lg)',
  color: 'var(--gray-800)'
};

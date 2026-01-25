import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import styles from '../../../styles/Admin.module.css';

export default function StockIn() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    movementDate: new Date().toISOString().slice(0, 16),
    supplierId: '',
    invoiceNumber: '',
    unitCost: '',
    remarks: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchProducts();
      fetchSuppliers();
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/products/all', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/suppliers', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // Set empty array if suppliers endpoint doesn't exist yet
      setSuppliers([]);
    }
  };

  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      productId: product.id
    }));
    setSearchTerm(`${product.name} (${product.sku})`);
    setFilteredProducts([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.productId || !formData.quantity) {
      setError('Product and quantity are required');
      return;
    }

    if (parseInt(formData.quantity) < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        movementDate: formData.movementDate ? new Date(formData.movementDate).toISOString() : null,
        supplierId: formData.supplierId || null,
        invoiceNumber: formData.invoiceNumber || null,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
        remarks: formData.remarks || null
      };

      const response = await fetch('http://localhost:8080/api/stock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Stock IN recorded successfully! New balance: ${data.balanceAfter} units`);

        // Reset form
        setFormData({
          productId: '',
          quantity: '',
          movementDate: new Date().toISOString().slice(0, 16),
          supplierId: '',
          invoiceNumber: '',
          unitCost: '',
          remarks: ''
        });
        setSearchTerm('');

        // Redirect to history after 2 seconds
        setTimeout(() => {
          router.push('/admin/stock-in/history');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to record stock IN');
      }
    } catch (error) {
      console.error('Error recording stock IN:', error);
      setError('An error occurred while recording stock IN');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (authLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className={styles.container}>
      <div className={styles.header}>
        <h1>Stock IN (Goods Inward)</h1>
        <button
          className={styles.secondaryBtn}
          onClick={() => router.push('/admin/stock-in/history')}
        >
          View History
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Product Search */}
          <div className={styles.formGroup}>
            <label>Product * (Search by Name, SKU, or Barcode)</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Start typing to search..."
              className={styles.input}
            />
            {filteredProducts.length > 0 && (
              <div className={styles.searchResults}>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={styles.searchResultItem}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <br />
                      <small>SKU: {product.sku} {product.barcode && `| Barcode: ${product.barcode}`}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className={styles.formGroup}>
            <label>Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className={styles.input}
            />
          </div>

          {/* Movement Date */}
          <div className={styles.formGroup}>
            <label>Movement Date</label>
            <input
              type="datetime-local"
              name="movementDate"
              value={formData.movementDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Supplier */}
          <div className={styles.formGroup}>
            <label>Supplier (Optional)</label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              className={styles.input}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Number */}
          <div className={styles.formGroup}>
            <label>Invoice Number (Optional)</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="e.g., INV-2024-001"
              className={styles.input}
            />
          </div>

          {/* Unit Cost */}
          <div className={styles.formGroup}>
            <label>Unit Cost ₹ (Optional)</label>
            <input
              type="number"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="e.g., 299.99"
              className={styles.input}
            />
          </div>

          {/* Remarks */}
          <div className={styles.formGroup}>
            <label>Remarks (Optional)</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional notes..."
              className={styles.input}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? 'Recording...' : 'Record Stock IN'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .${styles.searchResults} {
          position: absolute;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          max-height: 300px;
          overflow-y: auto;
          width: 100%;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .${styles.searchResultItem} {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }

        .${styles.searchResultItem}:hover {
          background-color: #f5f5f5;
        }

        .${styles.searchResultItem}:last-child {
          border-bottom: none;
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}

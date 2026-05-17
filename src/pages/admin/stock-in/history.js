import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import styles from '../../../styles/Admin.module.css';
import api from '../../../services/api';

export default function StockInHistory() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    productId: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0
  });

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchProducts();
      fetchHistory();
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, filters]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/all');
      setProducts(response.data.content || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        sort: 'movementDate,desc'
      });

      if (filters.productId) {
        params.append('productId', filters.productId);
      }
      if (filters.startDate) {
        params.append('startDate', new Date(filters.startDate).toISOString());
      }
      if (filters.endDate) {
        params.append('endDate', new Date(filters.endDate).toISOString());
      }

      const response = await api.get(`/stock-in/history?${params}`);
      const data = response.data;
      setHistory(data.content || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      productId: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleExportCSV = () => {
    const csvHeaders = [
      'Date',
      'Product',
      'SKU',
      'Quantity',
      'Balance After',
      'Supplier',
      'Invoice',
      'Unit Cost',
      'Total Value',
      'Remarks',
      'Created By'
    ];

    const csvRows = history.map(entry => [
      new Date(entry.movementDate).toLocaleString(),
      entry.productName,
      entry.productSku,
      entry.quantity,
      entry.balanceAfter,
      entry.supplierName || '-',
      entry.invoiceNumber || '-',
      entry.unitCost ? `₹${entry.unitCost.toFixed(2)}` : '-',
      entry.totalValue ? `₹${entry.totalValue.toFixed(2)}` : '-',
      entry.remarks || '-',
      entry.createdByName || '-'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-in-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (authLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className={styles.container}>
      <div className={styles.header}>
        <h1>Stock IN History</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryBtn}
            onClick={handleExportCSV}
            disabled={history.length === 0}
          >
            Export to CSV
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => router.push('/admin/stock-in')}
          >
            + New Stock IN
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.card} style={{ marginBottom: '20px' }}>
        <h3>Filters</h3>
        <div className={styles.filtersGrid}>
          <div className={styles.formGroup}>
            <label>Product</label>
            <select
              name="productId"
              value={filters.productId}
              onChange={handleFilterChange}
              className={styles.input}
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : history.length === 0 ? (
          <div className={styles.empty}>
            <p>No stock IN entries found</p>
            <button
              className={styles.primaryBtn}
              onClick={() => router.push('/admin/stock-in')}
            >
              Record First Stock IN
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Balance After</th>
                    <th>Supplier</th>
                    <th>Invoice</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(entry => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.movementDate).toLocaleString()}</td>
                      <td>{entry.productName}</td>
                      <td>{entry.productSku}</td>
                      <td className={styles.quantityIn}>+{entry.quantity}</td>
                      <td><strong>{entry.balanceAfter}</strong></td>
                      <td>{entry.supplierName || '-'}</td>
                      <td>{entry.invoiceNumber || '-'}</td>
                      <td>{entry.unitCost ? `₹${entry.unitCost.toFixed(2)}` : '-'}</td>
                      <td>{entry.totalValue ? `₹${entry.totalValue.toFixed(2)}` : '-'}</td>
                      <td>{entry.createdByName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 0}
                className={styles.paginationBtn}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.page + 1} of {pagination.totalPages} ({pagination.totalElements} total entries)
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
                className={styles.paginationBtn}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .${styles.filtersGrid} {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .${styles.headerActions} {
          display: flex;
          gap: 12px;
        }

        .${styles.quantityIn} {
          color: #28a745;
          font-weight: 600;
        }

        .${styles.tableWrapper} {
          overflow-x: auto;
        }

        .${styles.pagination} {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .${styles.paginationBtn} {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .${styles.paginationBtn}:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .${styles.paginationInfo} {
          font-size: 14px;
          color: #666;
        }

        .${styles.empty} {
          text-align: center;
          padding: 40px 20px;
        }

        .${styles.empty} p {
          margin-bottom: 20px;
          color: #666;
        }

        .${styles.loading} {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}

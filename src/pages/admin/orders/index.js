// ============ pages/admin/orders/index.js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import { adminLayout } from '../../../components/admin/AdminLayout';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAGE_SIZE = 20;

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrders() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    fetchOrders(0);
  }, [authLoading, status]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      setError('');
      const response = await orderService.getAllOrders(page, PAGE_SIZE, status);
      setOrders(response.data.content || []);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.customerEmail?.toLowerCase().includes(q)
      )
    : orders;

  if (authLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Orders ({pagination.totalElements})</h1>
          <Link href="/admin/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        <div className="ao-filters">
          <input
            type="text"
            className="ao-search"
            placeholder="Search order #, customer, phone, email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={status} onChange={e => setStatus(e.target.value)} className="ao-select">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => fetchOrders(pagination.page)} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <div className="ao-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="ao-empty">No orders found.</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const qty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  return (
                    <tr key={order.id} className="ao-row" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                      <td><strong>{order.orderNumber}</strong></td>
                      <td>{fmt(order.createdAt)}</td>
                      <td>
                        <div>{order.customerName || '—'}</div>
                        <div className="ao-sub">{order.customerPhone}</div>
                      </td>
                      <td>{qty}</td>
                      <td>₹{Number(order.totalAmount).toLocaleString('en-IN')}</td>
                      <td>
                        <div>{order.paymentMethod || '—'}</div>
                        <div className="ao-sub">{order.paymentStatus}</div>
                      </td>
                      <td>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="btn btn-sm btn-primary"
                          onClick={e => e.stopPropagation()}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={pagination.page === 0 || loading}
              onClick={() => fetchOrders(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page + 1} of {pagination.totalPages}</span>
            <button
              className="pagination-btn"
              disabled={pagination.page >= pagination.totalPages - 1 || loading}
              onClick={() => fetchOrders(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .ao-filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .ao-search {
          flex: 1; min-width: 200px; padding: 8px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem;
        }
        .ao-select { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem; }
        .ao-error { background: #fef2f2; color: #dc2626; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
        .ao-empty { padding: 48px 24px; text-align: center; color: #6b7280; background: #fff; border-radius: 8px; }
        .ao-row { cursor: pointer; }
        .ao-sub { font-size: 0.75rem; color: #9ca3af; }
      `}</style>
    </div>
  );
}

AdminOrders.getLayout = adminLayout('Online Orders');

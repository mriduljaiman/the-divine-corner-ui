import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { cloudinaryPad } from '../../utils/cloudinary';
import { FiChevronRight } from 'react-icons/fi';

const STATUS_META = {
  DELIVERED:  { label: 'Delivered',   color: '#16a34a', bg: '#f0fdf4' },
  SHIPPED:    { label: 'Shipped',      color: '#2563eb', bg: '#eff6ff' },
  PROCESSING: { label: 'Processing',  color: '#d97706', bg: '#fffbeb' },
  CONFIRMED:  { label: 'Confirmed',   color: '#2563eb', bg: '#eff6ff' },
  PENDING:    { label: 'Order Placed', color: '#6b7280', bg: '#f9fafb' },
  CANCELLED:  { label: 'Cancelled',   color: '#dc2626', bg: '#fef2f2' },
};

function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    orderService.getMyOrders(0, 50)
      .then(r => setOrders(r.data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading]);

  const filtered = search.trim()
    ? orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.items?.some(i => i.productName?.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  if (loading) return <div className="ord-loading">Loading orders…</div>;

  return (
    <div className="ord-page">
      <div className="ord-header-bar">
        <h1 className="ord-title">MY ORDERS</h1>
      </div>

      <div className="ord-search-wrap">
        <input
          className="ord-search"
          type="text"
          placeholder="Search orders"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ord-empty">
          <p>{search ? 'No orders match your search.' : "You haven't placed any orders yet."}</p>
        </div>
      ) : (
        <div className="ord-list">
          {filtered.map(order => {
            const first = order.items?.[0];
            const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            const meta = STATUS_META[order.status] || STATUS_META.PENDING;
            return (
              <div
                key={order.id}
                className="ord-row"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="ord-thumb-wrap">
                  {first?.productImage ? (
                    <img
                      src={cloudinaryPad(first.productImage, 160, 213)}
                      alt={first.productName}
                      className="ord-thumb"
                    />
                  ) : (
                    <div className="ord-thumb-placeholder" />
                  )}
                </div>

                <div className="ord-row-info">
                  <p className="ord-status-text" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="ord-date">{fmt(order.createdAt)}</p>
                  <p className="ord-name">{first?.productName || 'Order'}</p>
                  <p className="ord-qty">Qty: {totalQty}</p>
                </div>

                <FiChevronRight size={18} className="ord-chevron" />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .ord-page { background: #f3f4f6; min-height: 100vh; }
        .ord-header-bar { background: #fff; padding: 14px 16px 10px; border-bottom: 1px solid #e5e7eb; }
        .ord-title { font-size: 0.9rem; font-weight: 700; letter-spacing: 0.08em; color: #111; margin: 0; }
        .ord-search-wrap { padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; }
        .ord-search {
          width: 100%; box-sizing: border-box;
          padding: 8px 14px; border-radius: 20px;
          border: 1.5px solid #e5e7eb; background: #f9fafb;
          font-size: 0.9rem; outline: none;
        }
        .ord-search:focus { border-color: #6366f1; }
        .ord-list { display: flex; flex-direction: column; }
        .ord-row {
          display: flex; align-items: center; gap: 14px;
          background: #fff; padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer; transition: background 0.15s;
        }
        .ord-row:active { background: #f9fafb; }
        .ord-thumb-wrap {
          flex-shrink: 0; width: 68px; height: 90px;
          border-radius: 6px; overflow: hidden;
          background: #f3f4f6; border: 1px solid #e5e7eb;
        }
        .ord-thumb { width: 100%; height: 100%; object-fit: contain; display: block; }
        .ord-thumb-placeholder { width: 100%; height: 100%; background: #e5e7eb; }
        .ord-row-info { flex: 1; min-width: 0; }
        .ord-status-text { font-size: 0.9rem; font-weight: 700; margin: 0 0 2px; }
        .ord-date { font-size: 0.75rem; color: #6b7280; margin: 0 0 5px; }
        .ord-name {
          font-size: 0.82rem; color: #374151; margin: 0 0 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ord-qty { font-size: 0.78rem; color: #9ca3af; margin: 0; }
        .ord-chevron { color: #9ca3af; flex-shrink: 0; }
        .ord-empty { padding: 48px 24px; text-align: center; color: #6b7280; }
        .ord-loading { padding: 48px 24px; text-align: center; color: #6b7280; }
      `}</style>
    </div>
  );
}

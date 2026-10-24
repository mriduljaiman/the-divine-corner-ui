// ============ pages/admin/orders/[id].js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import { cloudinaryPad } from '../../../utils/cloudinary';
import { adminLayout } from '../../../components/admin/AdminLayout';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function money(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function AdminOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAdmin, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    if (!id) return;
    orderService.getOrderByIdAdmin(id)
      .then(r => applyOrder(r.data))
      .catch(err => setError(err.response?.data?.message || 'Order not found.'))
      .finally(() => setLoading(false));
  }, [authLoading, id]);

  const applyOrder = (data) => {
    setOrder(data);
    setStatus(data.status);
    setTrackingNumber(data.trackingNumber || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (status === 'DELIVERED' && order.status !== 'DELIVERED' &&
        !confirm('Mark as delivered? Cash will be recorded as collected and this cannot be undone.')) {
      return;
    }
    if (status === 'CANCELLED' && order.status !== 'CANCELLED' &&
        !confirm('Cancel this order? Stock will be added back to inventory.')) {
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await orderService.updateOrderStatus(order.id, {
        status,
        trackingNumber: trackingNumber.trim() || null,
      });
      applyOrder(response.data);
      setMessage('Order updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="loading">Loading...</div>;
  if (!order) return (
    <div className="admin-page">
      <div className="container">
        <p>{error || 'Order not found.'}</p>
        <Link href="/admin/orders" className="btn btn-primary">Back to Orders</Link>
      </div>
    </div>
  );

  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Order {order.orderNumber}</h1>
          <Link href="/admin/orders" className="btn btn-secondary">Back to Orders</Link>
        </div>

        <div className="aod-grid">
          <section className="aod-card">
            <h2>Items</h2>
            {order.items?.map(item => (
              <div key={item.id} className="aod-item">
                {item.productImage ? (
                  <img src={cloudinaryPad(item.productImage, 120, 160)} alt={item.productName} className="aod-img" />
                ) : (
                  <div className="aod-img aod-img-empty" />
                )}
                <div className="aod-item-info">
                  <Link href={`/admin/products/${item.productId}`} className="aod-item-name">
                    {item.productName}
                  </Link>
                  {item.size && <div><strong>Size: {item.size}</strong></div>}
                  <div className="aod-sub">{money(item.price)} × {item.quantity}</div>
                </div>
                <strong>{money(item.subtotal)}</strong>
              </div>
            ))}
            <div className="aod-row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="aod-row"><span>Shipping</span><span>{money(order.shippingCharges)}</span></div>
            {Number(order.discount) > 0 && (
              <div className="aod-row"><span>Discount</span><span>−{money(order.discount)}</span></div>
            )}
            <div className="aod-row aod-total"><span>Total</span><span>{money(order.totalAmount)}</span></div>
          </section>

          <div>
            <section className="aod-card">
              <h2>Status</h2>
              <p>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
              </p>
              <p className="aod-sub">Placed: {fmt(order.createdAt)}</p>
              {order.deliveredAt && <p className="aod-sub">Delivered: {fmt(order.deliveredAt)}</p>}

              <form onSubmit={handleUpdate} className="aod-form">
                <label>Update status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} disabled={isCancelled || isDelivered}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <label>Tracking number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Courier tracking ID"
                  disabled={isCancelled}
                />
                <button type="submit" className="btn btn-primary" disabled={saving || isCancelled}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {message && <div className="aod-ok">{message}</div>}
                {error && <div className="aod-err">{error}</div>}
              </form>
            </section>

            <section className="aod-card">
              <h2>Customer</h2>
              <p><strong>{order.customerName || '—'}</strong></p>
              {order.customerPhone && <p><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></p>}
              {order.customerEmail && <p><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></p>}
            </section>

            <section className="aod-card">
              <h2>Shipping Address</h2>
              <p>{order.shippingAddress}</p>
              <p>
                {[order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry]
                  .filter(Boolean).join(', ')}
              </p>
            </section>

            <section className="aod-card">
              <h2>Payment</h2>
              <p>Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : (order.paymentMethod || '—')}</p>
              <p>Status: {order.paymentStatus || '—'}</p>
            </section>
          </div>
        </div>
      </div>

      <style jsx>{`
        .aod-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
        @media (max-width: 768px) { .aod-grid { grid-template-columns: 1fr; } }
        .aod-card { background: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .aod-card h2 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 12px; }
        .aod-card p { margin: 0 0 6px; font-size: 0.9rem; color: #374151; }
        .aod-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .aod-img { width: 54px; height: 72px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; background: #f9fafb; flex-shrink: 0; }
        .aod-img-empty { background: #e5e7eb; }
        .aod-item-info { flex: 1; min-width: 0; }
        .aod-sub { font-size: 0.8rem; color: #9ca3af; }
        .aod-row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 6px 0; color: #374151; }
        .aod-total { font-weight: 700; border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 10px; color: #111; }
        .aod-form { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .aod-form label { font-size: 0.8rem; color: #6b7280; }
        .aod-form select, .aod-form input { padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem; }
        .aod-ok { color: #16a34a; font-size: 0.85rem; }
        .aod-err { color: #dc2626; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}

AdminOrderDetail.getLayout = adminLayout('Order');

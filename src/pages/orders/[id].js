import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { cloudinaryPad } from '../../utils/cloudinary';
import { FiArrowLeft, FiCheckCircle, FiClock, FiTruck, FiXCircle, FiPackage, FiMapPin } from 'react-icons/fi';

const STATUS_META = {
  DELIVERED:  { label: 'Delivered',    icon: FiCheckCircle, color: '#16a34a', bg: '#f0fdf4' },
  SHIPPED:    { label: 'Shipped',      icon: FiTruck,       color: '#2563eb', bg: '#eff6ff' },
  PROCESSING: { label: 'Processing',  icon: FiPackage,     color: '#d97706', bg: '#fffbeb' },
  CONFIRMED:  { label: 'Confirmed',   icon: FiCheckCircle, color: '#2563eb', bg: '#eff6ff' },
  PENDING:    { label: 'Order Placed', icon: FiClock,      color: '#6b7280', bg: '#f9fafb' },
  CANCELLED:  { label: 'Cancelled',   icon: FiXCircle,     color: '#dc2626', bg: '#fef2f2' },
};

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    if (!id) return;
    orderService.getOrderById(id)
      .then(r => setOrder(r.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [authLoading, id]);

  if (loading) return <div className="od-loading">Loading…</div>;
  if (error || !order) return (
    <div className="od-error">
      <p>{error || 'Order not found.'}</p>
      <Link href="/orders" className="btn btn-primary btn-sm">Back to Orders</Link>
    </div>
  );

  const meta = STATUS_META[order.status] || STATUS_META.PENDING;
  const StatusIcon = meta.icon;

  return (
    <div className="od-page">
      {/* Top bar */}
      <div className="od-topbar">
        <button className="od-back" onClick={() => router.push('/orders')}>
          <FiArrowLeft size={20} />
        </button>
        <span className="od-topbar-title">ORDER DETAILS</span>
      </div>

      {/* Items */}
      <div className="od-section">
        {order.items?.map(item => (
          <div key={item.id} className="od-item">
            <div className="od-item-img-wrap">
              {item.productImage ? (
                <img src={cloudinaryPad(item.productImage, 160, 213)} alt={item.productName} className="od-item-img" />
              ) : (
                <div className="od-item-img-placeholder" />
              )}
            </div>
            <div className="od-item-info">
              <p className="od-item-name">{item.productName}</p>
              <p className="od-item-meta">Order #{order.orderNumber}</p>
              <p className="od-item-meta">{order.paymentMethod || 'Prepaid'}</p>
              <p className="od-item-qty">Qty: {item.quantity}</p>
              <p className="od-item-price">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="od-section od-status-section" style={{ background: meta.bg }}>
        <div className="od-status-row">
          <StatusIcon size={22} color={meta.color} />
          <div>
            <p className="od-status-label" style={{ color: meta.color }}>{meta.label}</p>
            {order.status === 'DELIVERED' && order.deliveredAt && (
              <p className="od-status-date">on {fmt(order.deliveredAt)}</p>
            )}
            {order.status !== 'DELIVERED' && (
              <p className="od-status-date">Placed on {fmt(order.createdAt)}</p>
            )}
            {order.trackingNumber && (
              <p className="od-status-track">Tracking: {order.trackingNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      {order.shippingAddress && (
        <div className="od-section">
          <div className="od-section-title"><FiMapPin size={14} /> Delivery Address</div>
          <p className="od-address-line">{order.shippingAddress}</p>
          <p className="od-address-line">
            {[order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry]
              .filter(Boolean).join(', ')}
          </p>
          {order.customerPhone && <p className="od-address-line">{order.customerPhone}</p>}
        </div>
      )}

      {/* Price breakdown */}
      <div className="od-section od-price-section">
        <div className="od-section-title">Price Details</div>
        <div className="od-price-row"><span>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
        {Number(order.shippingCharges) > 0 && (
          <div className="od-price-row"><span>Shipping</span><span>₹{Number(order.shippingCharges).toLocaleString('en-IN')}</span></div>
        )}
        {Number(order.discount) > 0 && (
          <div className="od-price-row od-discount"><span>Discount</span><span>−₹{Number(order.discount).toLocaleString('en-IN')}</span></div>
        )}
        <div className="od-price-row od-total"><span>Total</span><span>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span></div>
      </div>

      <style jsx>{`
        .od-page { background: #f3f4f6; min-height: 100vh; padding-bottom: 32px; }
        .od-topbar {
          display: flex; align-items: center; gap: 12px;
          background: #fff; padding: 14px 16px;
          border-bottom: 1px solid #e5e7eb;
          position: sticky; top: 0; z-index: 10;
        }
        .od-back { background: none; border: none; cursor: pointer; padding: 0; color: #111; display: flex; }
        .od-topbar-title { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; color: #111; }
        .od-section { background: #fff; margin-top: 8px; padding: 16px; }
        .od-section-title { font-size: 0.78rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .od-item { display: flex; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid #f3f4f6; margin-bottom: 14px; }
        .od-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .od-item-img-wrap { width: 72px; height: 96px; border-radius: 6px; overflow: hidden; background: #f3f4f6; border: 1px solid #e5e7eb; flex-shrink: 0; }
        .od-item-img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .od-item-img-placeholder { width: 100%; height: 100%; background: #e5e7eb; }
        .od-item-info { flex: 1; min-width: 0; }
        .od-item-name { font-size: 0.9rem; font-weight: 600; color: #111; margin: 0 0 4px; line-height: 1.3; }
        .od-item-meta { font-size: 0.75rem; color: #9ca3af; margin: 0 0 2px; }
        .od-item-qty { font-size: 0.8rem; color: #6b7280; margin: 6px 0 2px; }
        .od-item-price { font-size: 0.95rem; font-weight: 700; color: #111; margin: 4px 0 0; }
        .od-status-section { }
        .od-status-row { display: flex; align-items: flex-start; gap: 12px; }
        .od-status-label { font-size: 1rem; font-weight: 700; margin: 0 0 2px; }
        .od-status-date { font-size: 0.78rem; color: #6b7280; margin: 0; }
        .od-status-track { font-size: 0.78rem; color: #6b7280; margin: 4px 0 0; }
        .od-address-line { font-size: 0.85rem; color: #374151; margin: 0 0 3px; line-height: 1.5; }
        .od-price-section { }
        .od-price-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #374151; padding: 4px 0; }
        .od-discount { color: #16a34a; }
        .od-total { font-weight: 700; font-size: 0.95rem; color: #111; border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 10px; }
        .od-loading, .od-error { padding: 48px 24px; text-align: center; color: #6b7280; }
        .od-error { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      `}</style>
    </div>
  );
}

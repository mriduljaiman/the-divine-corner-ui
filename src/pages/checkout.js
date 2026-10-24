import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import css from 'styled-jsx/css';
import { FiMapPin, FiPhone, FiMail, FiCheckCircle, FiShield, FiTruck, FiDollarSign } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { cloudinaryPad } from '../utils/cloudinary';
import { inr, normalizePhone } from '../utils/format';
import { showToast } from '../utils/toast';

const FIELDS = [
  { name: 'shippingAddress', label: 'House no., street, area', full: true, autoComplete: 'street-address' },
  { name: 'shippingCity', label: 'City', autoComplete: 'address-level2' },
  { name: 'shippingState', label: 'State', autoComplete: 'address-level1' },
  { name: 'shippingZipCode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 },
  { name: 'shippingCountry', label: 'Country', autoComplete: 'country-name' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [touched, setTouched] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: 'India',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'COD'
  });

  // hydrate form from the saved profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: user.address || prev.shippingAddress,
        shippingCity: user.city || prev.shippingCity,
        shippingState: user.state || prev.shippingState,
        shippingZipCode: user.zipCode || prev.shippingZipCode,
        shippingCountry: user.country || prev.shippingCountry,
        customerPhone: user.phone || prev.customerPhone,
        customerEmail: user.email || prev.customerEmail,
      }));
    }
  }, [user]);

  // client-side redirects only (wait for auth + cart to load, and not after placing the order)
  useEffect(() => {
    if (authLoading || orderPlaced) return;
    if (!isAuthenticated()) {
      router.replace('/auth/login?redirect=/checkout');
      return;
    }
    if (cart && cart.items.length === 0) {
      router.replace('/cart');
    }
  }, [authLoading, isAuthenticated, cart, orderPlaced, router]);

  if (!cart || !cart.items) {
    return <div className="loading">Loading checkout...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const errors = {
    shippingAddress: formData.shippingAddress.trim().length < 5 ? 'Enter your full address' : '',
    shippingCity: !formData.shippingCity.trim() ? 'Required' : '',
    shippingState: !formData.shippingState.trim() ? 'Required' : '',
    shippingZipCode: !/^\d{6}$/.test(formData.shippingZipCode.trim()) ? 'Enter a 6-digit pincode' : '',
    shippingCountry: !formData.shippingCountry.trim() ? 'Required' : '',
    customerPhone: !normalizePhone(formData.customerPhone) ? 'Enter a valid 10-digit mobile number' : '',
    customerEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim()) ? 'Enter a valid email' : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) {
      showToast.error(Object.values(errors).find(Boolean));
      return;
    }
    setLoading(true);
    try {
      const response = await orderService.createOrder({ ...formData, customerPhone: normalizePhone(formData.customerPhone) });
      setOrderPlaced(true);
      // Backend already empties the cart when the order is created; just resync
      fetchCart().catch(() => {});
      router.push(`/orders/${response.data.id}`);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Order placement failed');
      setLoading(false);
    }
  };

  const items = cart.items;
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = Number(cart.shippingCharges || 0);
  const grand = Number(cart.grandTotal ?? cart.totalAmount);
  const err = (name) => touched && errors[name];

  return (
    <div className="co-wrap">
      <form onSubmit={handleSubmit} className="co-inner" noValidate>
        <h1 className="co-title">Checkout</h1>
        <div className="co-steps"><span className="on">1 Cart</span><i /><span className="on">2 Address</span><i /><span>3 Confirm</span></div>

        <div className="co-layout">
          <div>
            <section className="co-card">
              <h2><FiMapPin /> Delivery address</h2>
              <div className="co-grid">
                {FIELDS.map(f => (
                  <label key={f.name} className={`co-field ${f.full ? 'full' : ''}`}>
                    <span>{f.label} *</span>
                    <input name={f.name} value={formData[f.name]} onChange={handleChange} required
                      autoComplete={f.autoComplete} inputMode={f.inputMode} maxLength={f.maxLength}
                      className={err(f.name) ? 'bad' : ''} />
                    {err(f.name) && <small>{errors[f.name]}</small>}
                  </label>
                ))}
              </div>
            </section>

            <section className="co-card">
              <h2><FiPhone /> Contact</h2>
              <div className="co-grid">
                <label className="co-field">
                  <span>Mobile number *</span>
                  <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} required
                    inputMode="numeric" autoComplete="tel" className={err('customerPhone') ? 'bad' : ''} />
                  {err('customerPhone') && <small>{errors.customerPhone}</small>}
                </label>
                <label className="co-field">
                  <span><FiMail style={{ verticalAlign: -2 }} /> Email *</span>
                  <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} required
                    autoComplete="email" className={err('customerEmail') ? 'bad' : ''} />
                  {err('customerEmail') && <small>{errors.customerEmail}</small>}
                </label>
              </div>
            </section>

            <section className="co-card">
              <h2><FiDollarSign /> Payment method</h2>
              <div className="cod">
                <FiCheckCircle />
                <div>
                  <b>Cash on Delivery</b>
                  <p>Pay in cash or UPI when your order arrives.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="co-card co-summary">
            <h2>Order summary ({count})</h2>
            <div className="co-items">
              {items.map(item => (
                <div key={item.id} className="co-item">
                  <div className="co-thumb">
                    {item.product.images?.[0] ? <img src={cloudinaryPad(item.product.images[0], 120, 150)} alt="" /> : <span>ॐ</span>}
                    <em>{item.quantity}</em>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="co-name">{item.product.name}{item.size ? ` (${item.size})` : ''} x {item.quantity}</div>
                  </div>
                  <b>{inr(item.subtotal)}</b>
                </div>
              ))}
            </div>
            <div className="row"><span>Subtotal</span><span>{inr(cart.totalAmount)}</span></div>
            <div className="row"><span>Shipping</span><span className={shipping === 0 ? 'green' : ''}>{shipping === 0 ? 'FREE' : inr(shipping)}</span></div>
            <div className="row total"><span>Total (Cash on Delivery)</span><span>{inr(grand)}</span></div>
            <button type="submit" className="place" disabled={loading || orderPlaced || items.length === 0}>
              {loading ? 'Placing Order...' : `Place Order · ${inr(grand)}`}
            </button>
            <div className="trust"><span><FiShield /> Secure</span><span><FiTruck /> Fast delivery</span></div>
            <Link href="/cart" className="back">← Back to cart</Link>
          </aside>
        </div>
      </form>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = css`
  .co-wrap { background: #f6f7fb; min-height: 80vh; padding-bottom: 96px; }
  .co-inner { max-width: 1120px; margin: 0 auto; padding: 16px 12px; }
  .co-title { font-size: 1.35rem; font-weight: 800; margin: 4px 4px 6px; }
  .co-steps { display: flex; align-items: center; gap: 8px; margin: 0 4px 16px; font-size: 0.78rem; font-weight: 700; color: #94a3b8; }
  .co-steps .on { color: #4f46e5; }
  .co-steps i { flex: 0 0 24px; height: 2px; background: #e2e8f0; }
  .co-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: start; }
  .co-card { background: #fff; border: 1px solid #edf0f5; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
  .co-card h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 800; margin: 0 0 14px; }
  .co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .co-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; font-weight: 600; color: #475569; }
  .co-field.full { grid-column: 1 / -1; }
  .co-field input { height: 46px; padding: 0 14px; border-radius: 11px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .co-field input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12); }
  .co-field input.bad { border-color: #e11d48; }
  .co-field small { color: #e11d48; font-weight: 600; }
  .cod { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: 12px; border: 2px solid #6366f1; background: #eef2ff; }
  .cod :global(svg) { color: #4f46e5; font-size: 1.3rem; margin-top: 2px; }
  .cod p { margin: 2px 0 0; font-size: 0.85rem; color: #475569; }
  .co-summary { position: sticky; top: 90px; }
  .co-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; max-height: 280px; overflow-y: auto; }
  .co-item { display: flex; gap: 10px; align-items: center; font-size: 0.88rem; }
  .co-thumb { position: relative; width: 48px; height: 60px; border-radius: 8px; background: #f7f8fb; display: grid; place-items: center; flex-shrink: 0; color: rgba(124, 29, 63, 0.35); }
  .co-thumb img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
  .co-thumb em { position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; border-radius: 10px; background: #0f172a; color: #fff; font-size: 0.7rem; font-style: normal; display: grid; place-items: center; padding: 0 5px; }
  .co-name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #334155; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.92rem; color: #334155; }
  .row.total { border-top: 1px dashed #e2e8f0; margin-top: 6px; padding-top: 12px; font-weight: 800; font-size: 1.05rem; color: #0f172a; }
  .green { color: #16a34a; }
  .place { width: 100%; height: 52px; margin-top: 14px; border: none; border-radius: 12px; font-weight: 800; font-size: 1rem; color: #fff; cursor: pointer; background: linear-gradient(135deg, #f59e0b, #f97316); box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35); }
  .place:disabled { opacity: 0.6; cursor: not-allowed; }
  .trust { display: flex; justify-content: center; gap: 16px; margin-top: 12px; font-size: 0.78rem; color: #64748b; }
  .trust span { display: inline-flex; align-items: center; gap: 5px; }
  .co-summary :global(.back) { display: block; text-align: center; margin-top: 10px; font-size: 0.85rem; color: #4f46e5; font-weight: 600; }
  @media (max-width: 900px) {
    .co-layout { grid-template-columns: 1fr; }
    .co-summary { position: static; }
  }
  @media (max-width: 520px) {
    .co-grid { grid-template-columns: 1fr; }
  }
`;

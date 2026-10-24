import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import css from 'styled-jsx/css';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiTruck, FiShield, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cloudinaryPad } from '../utils/cloudinary';
import { inr } from '../utils/format';
import { showToast } from '../utils/toast';

const FREE_SHIPPING_AT = 500;

export default function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  // client-side auth redirect (after the session check has finished)
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.replace('/auth/login?redirect=/cart');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !cart) {
    return <div className="loading">Loading cart...</div>;
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setBusyId(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setBusyId(itemId);
    try {
      await removeFromCart(itemId);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to remove item');
    } finally {
      setBusyId(null);
    }
  };

  const items = cart.items || [];
  const subtotal = Number(cart.totalAmount || 0);
  const shipping = Number(cart.shippingCharges || 0);
  const grand = Number(cart.grandTotal ?? subtotal);
  const mrpTotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const toFree = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const unavailable = items.some(i => i.product.active === false || i.quantity > i.product.stockQuantity);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-wrap">
        <div className="cart-empty">
          <div className="cart-empty-icon"><FiShoppingBag /></div>
          <h1>Your cart is empty</h1>
          <p>Looks like you haven&apos;t added anything yet.</p>
          <Link href="/products" className="cart-cta">Start shopping <FiArrowRight /></Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="cart-wrap">
      <div className="cart-inner">
        <h1 className="cart-title">My Cart <span>({count} item{count === 1 ? '' : 's'})</span></h1>

        <div className="cart-layout">
          <section>
            <div className={`ship-banner ${toFree === 0 ? 'done' : ''}`}>
              <FiTruck />
              <div style={{ flex: 1 }}>
                {toFree === 0
                  ? <b>Yay! You get FREE delivery</b>
                  : <span>Add <b>{inr(toFree)}</b> more for <b>FREE delivery</b></span>}
                <div className="ship-track"><div style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)}%` }} /></div>
              </div>
            </div>

            <div className="cart-items">
              {items.map(item => {
                const p = item.product;
                const unit = Number(p.discountPrice || p.price);
                const off = p.discountPrice && Number(p.discountPrice) < Number(p.price);
                const problem = p.active === false ? 'No longer available — please remove'
                  : p.stockQuantity === 0 ? 'Out of stock — please remove'
                    : item.quantity > p.stockQuantity ? `Only ${p.stockQuantity} left in stock` : '';
                return (
                  <div key={item.id} className={`cart-item ${busyId === item.id ? 'busy' : ''}`}>
                    <Link href={`/products/${p.id}`} className="ci-img">
                      {p.images?.[0] ? <img src={cloudinaryPad(p.images[0], 200, 260)} alt={p.name} /> : <span className="ci-ph">ॐ</span>}
                    </Link>
                    <div className="ci-body">
                      <Link href={`/products/${p.id}`} className="ci-name">{p.name}</Link>
                      {item.size && <div className="ci-meta">Size: <b>{item.size}</b></div>}
                      <div className="ci-price">
                        <b>{inr(unit)}</b>
                        {off && <><s>{inr(p.price)}</s><em>{Math.round((1 - unit / Number(p.price)) * 100)}% off</em></>}
                      </div>
                      {problem && <div className="ci-problem">{problem}</div>}
                      <div className="ci-actions">
                        <div className="stepper">
                          <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={busyId === item.id || item.quantity <= 1} aria-label="Decrease quantity"><FiMinus /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} disabled={busyId === item.id || item.quantity >= p.stockQuantity} aria-label="Increase quantity"><FiPlus /></button>
                        </div>
                        <button className="ci-remove" onClick={() => handleRemove(item.id)} disabled={busyId === item.id}>
                          <FiTrash2 /> Remove
                        </button>
                        <b className="ci-line">{inr(item.subtotal)}</b>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="cart-summary-card">
            <h2>Price details</h2>
            <div className="row"><span>Price ({count} items)</span><span>{inr(mrpTotal)}</span></div>
            {savings > 0 && <div className="row green"><span>Discount</span><span>− {inr(savings)}</span></div>}
            <div className="row"><span>Delivery</span><span className={shipping === 0 ? 'green' : ''}>{shipping === 0 ? 'FREE' : inr(shipping)}</span></div>
            <div className="row total"><span>Total amount</span><span>{inr(grand)}</span></div>
            {savings > 0 && <div className="saved">You save {inr(savings)} on this order 🎉</div>}
            <Link href="/checkout" className={`checkout-btn ${unavailable ? 'disabled' : ''}`} aria-disabled={unavailable}
              onClick={e => { if (unavailable) { e.preventDefault(); showToast.error('Please fix the items marked in red'); } }}>
              Place order <FiArrowRight />
            </Link>
            <div className="safe"><FiShield /> Cash on Delivery · Safe &amp; secure</div>
          </aside>
        </div>
      </div>

      <div className="mobile-bar">
        <div>
          <s>{savings > 0 ? inr(mrpTotal + shipping) : ''}</s>
          <b>{inr(grand)}</b>
        </div>
        <Link href="/checkout" className={`checkout-btn ${unavailable ? 'disabled' : ''}`}
          onClick={e => { if (unavailable) { e.preventDefault(); showToast.error('Please fix the items marked in red'); } }}>
          Place order
        </Link>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = css`
  .cart-wrap { background: #f6f7fb; min-height: 80vh; padding-bottom: 140px; }
  .cart-inner { max-width: 1120px; margin: 0 auto; padding: 16px 12px; }
  .cart-title { font-size: 1.3rem; font-weight: 800; margin: 4px 4px 14px; }
  .cart-title span { font-size: 0.95rem; color: #64748b; font-weight: 500; }
  .cart-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
  .ship-banner { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid #edf0f5; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; font-size: 0.88rem; color: #334155; }
  .ship-banner :global(svg) { font-size: 1.3rem; color: #ea580c; flex-shrink: 0; }
  .ship-banner.done :global(svg) { color: #16a34a; }
  .ship-banner.done b { color: #16a34a; }
  .ship-track { height: 6px; background: #f1f5f9; border-radius: 999px; margin-top: 8px; overflow: hidden; }
  .ship-track div { height: 100%; background: linear-gradient(90deg, #f59e0b, #16a34a); border-radius: 999px; transition: width 0.3s; }
  .cart-items { display: flex; flex-direction: column; gap: 12px; }
  .cart-item { display: flex; gap: 14px; background: #fff; border: 1px solid #edf0f5; border-radius: 14px; padding: 12px; transition: opacity 0.2s; }
  .cart-item.busy { opacity: 0.6; }
  .cart-item :global(.ci-img) { width: 96px; height: 124px; flex-shrink: 0; border-radius: 10px; background: #f7f8fb; overflow: hidden; display: grid; place-items: center; }
  .cart-item :global(.ci-img img) { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }
  .ci-ph { font-size: 2rem; color: rgba(124, 29, 63, 0.35); }
  .ci-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .ci-body :global(.ci-name) { font-weight: 600; color: #0f172a; font-size: 0.95rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ci-meta { font-size: 0.8rem; color: #64748b; }
  .ci-price { display: flex; align-items: baseline; gap: 8px; font-size: 0.95rem; }
  .ci-price s { color: #94a3b8; font-size: 0.8rem; }
  .ci-price em { color: #16a34a; font-style: normal; font-weight: 700; font-size: 0.8rem; }
  .ci-problem { color: #e11d48; font-size: 0.8rem; font-weight: 600; }
  .ci-actions { display: flex; align-items: center; gap: 12px; margin-top: auto; flex-wrap: wrap; }
  .stepper { display: inline-flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 999px; overflow: hidden; }
  .stepper button { width: 34px; height: 32px; border: none; background: #fff; cursor: pointer; display: grid; place-items: center; color: #0f172a; }
  .stepper button:disabled { color: #cbd5e1; cursor: not-allowed; }
  .stepper span { min-width: 30px; text-align: center; font-weight: 700; font-size: 0.9rem; }
  .ci-remove { border: none; background: none; color: #64748b; font-size: 0.82rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; padding: 6px; }
  .ci-remove:hover { color: #e11d48; }
  .ci-line { margin-left: auto; font-size: 1rem; }
  .cart-summary-card { background: #fff; border: 1px solid #edf0f5; border-radius: 14px; padding: 18px; position: sticky; top: 90px; }
  .cart-summary-card h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 0.92rem; color: #334155; }
  .row.total { border-top: 1px dashed #e2e8f0; margin-top: 6px; padding-top: 12px; font-weight: 800; font-size: 1.08rem; color: #0f172a; }
  .green, .row.green { color: #16a34a; }
  .saved { margin-top: 10px; padding: 9px 12px; background: #f0fdf4; color: #15803d; border-radius: 10px; font-size: 0.85rem; font-weight: 600; }
  :global(.checkout-btn) { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 14px; height: 50px; border-radius: 12px; font-weight: 800; color: #fff !important; text-decoration: none; background: linear-gradient(135deg, #f59e0b, #f97316); box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35); }
  :global(.checkout-btn.disabled) { background: #cbd5e1; box-shadow: none; }
  .safe { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 12px; font-size: 0.78rem; color: #64748b; }
  .mobile-bar { display: none; }
  .cart-empty { max-width: 420px; margin: 0 auto; padding: 72px 20px; text-align: center; }
  .cart-empty-icon { width: 88px; height: 88px; border-radius: 28px; margin: 0 auto 16px; display: grid; place-items: center; font-size: 2.4rem; background: #fff7ed; color: #ea580c; }
  .cart-empty h1 { font-size: 1.3rem; margin: 0 0 6px; }
  .cart-empty p { color: #64748b; margin: 0 0 20px; }
  .cart-empty :global(.cart-cta) { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-weight: 700; }
  @media (max-width: 900px) {
    .cart-layout { grid-template-columns: 1fr; }
    .cart-summary-card { position: static; }
    .cart-summary-card :global(.checkout-btn) { display: none; }
    .mobile-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      position: fixed; left: 0; right: 0; bottom: calc(60px + env(safe-area-inset-bottom)); z-index: 40;
      background: #fff; border-top: 1px solid #edf0f5; padding: 10px 14px; box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.06);
    }
    .mobile-bar s { display: block; font-size: 0.75rem; color: #94a3b8; }
    .mobile-bar b { font-size: 1.15rem; }
    .mobile-bar :global(.checkout-btn) { margin: 0; padding: 0 28px; height: 46px; }
  }
`;

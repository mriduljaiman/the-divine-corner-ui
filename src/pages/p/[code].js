// ============ pages/p/[code].js — landing page for scanned labels ============
// Customers (e.g. Google Lens) are sent to the product page; a logged-in admin sees stock,
// buying price and can drop the item straight into the current counter bill.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import css from 'styled-jsx/css';
import { FiShoppingCart, FiEye, FiEyeOff, FiEdit2, FiExternalLink, FiPackage, FiMaximize } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { addProductToDraft, loadDraft } from '../../utils/pos';
import { inr } from '../../utils/format';
import { cloudinaryPad } from '../../utils/cloudinary';
import { showToast } from '../../utils/toast';
import { productPath } from '../../utils/urls';

export default function ScanLanding() {
  const router = useRouter();
  const { code } = router.query;
  const { isAdmin, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState('loading'); // loading | admin | notfound
  const [showCost, setShowCost] = useState(false);
  const [inBill, setInBill] = useState(0);

  useEffect(() => {
    if (!code || authLoading) return;
    let alive = true;
    adminService.lookup(code)
      .then(({ data }) => {
        if (!alive) return;
        if (isAdmin()) {
          setProduct(data);
          setInBill(loadDraft().lines.find(l => l.productId === data.id)?.qty || 0);
          setState('admin');
        } else {
          router.replace(productPath(data));
        }
      })
      .catch(() => alive && setState('notfound'));
    return () => { alive = false; };
  }, [code, authLoading]);

  const addToBill = (goToPos) => {
    if (inBill + 1 > product.stockQuantity) {
      showToast.error(`Only ${product.stockQuantity} in stock`);
      return;
    }
    const d = addProductToDraft(product);
    setInBill(d.lines.find(l => l.productId === product.id)?.qty || 0);
    showToast.success('Added to bill');
    if (goToPos) router.push('/admin/pos');
  };

  if (state === 'notfound') {
    return (
      <div className="scan-wrap">
        <div className="scan-card" style={{ textAlign: 'center' }}>
          <FiPackage size={40} color="#94a3b8" />
          <h2>Product not found</h2>
          <p className="muted">This code ({code}) doesn&apos;t match any product.</p>
          <Link href="/products" className="btn btn-primary">Browse products</Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (state !== 'admin' || !product) {
    return (
      <div className="scan-wrap">
        <div className="scan-card" style={{ textAlign: 'center' }}><p className="muted">Opening product…</p></div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const listed = Number(product.discountPrice || product.price);
  const cost = product.purchasingPrice != null ? Number(product.purchasingPrice) : null;

  return (
    <div className="scan-wrap">
      <Head><title>{product.name} · Scan</title></Head>
      <div className="scan-card">
        <div className="scan-badge">Admin view</div>
        <div className="scan-head">
          {product.images?.[0]
            ? <img src={cloudinaryPad(product.images[0], 240, 240)} alt="" className="scan-img" />
            : <div className="scan-img" />}
          <div style={{ minWidth: 0 }}>
            <h1>{product.name}</h1>
            <p className="muted">{product.sku} · {product.barcode}</p>
            {product.category?.name && <p className="muted">{product.category.name}</p>}
          </div>
        </div>

        <div className="scan-grid">
          <div><span>Selling price</span><b>{inr(listed)}</b>{product.discountPrice && <s>{inr(product.price)}</s>}</div>
          <div><span>In stock</span><b className={product.stockQuantity <= (product.reorderPoint || 0) ? 'danger' : ''}>{product.stockQuantity}</b></div>
          <div>
            <span>Buying price</span>
            <button type="button" className="eye" onClick={() => setShowCost(s => !s)} aria-label="Show buying price">
              {showCost ? <><b>{cost != null ? inr(cost) : 'Not set'}</b> <FiEyeOff /></> : <><b>••••</b> <FiEye /></>}
            </button>
          </div>
          <div><span>Margin</span><b>{showCost && cost != null ? inr(listed - cost) : '••••'}</b></div>
        </div>

        {inBill > 0 && <p className="in-bill">{inBill} already in the current bill</p>}

        <button type="button" className="scan-primary" onClick={() => addToBill(true)} disabled={product.stockQuantity <= inBill}>
          <FiShoppingCart /> Add to bill &amp; open billing
        </button>
        <button type="button" className="scan-secondary" onClick={() => addToBill(false)} disabled={product.stockQuantity <= inBill}>
          <FiMaximize /> Add &amp; scan next
        </button>
        <div className="scan-links">
          <Link href={`/admin/products/${product.id}`}><FiEdit2 /> Edit product</Link>
          <Link href={productPath(product)}><FiExternalLink /> Store page</Link>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = css`
  .scan-wrap { min-height: 70vh; display: flex; align-items: flex-start; justify-content: center; padding: 24px 16px 96px; background: #f4f5fb; }
  .scan-card { width: 100%; max-width: 440px; background: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 12px 32px rgba(16,24,40,0.10); position: relative; }
  .scan-card h1 { font-size: 1.15rem; margin: 0 0 4px; line-height: 1.3; }
  .scan-card h2 { margin: 12px 0 6px; }
  .muted { color: #64748b; font-size: 0.85rem; margin: 0 0 4px; }
  .scan-badge { position: absolute; top: 14px; right: 14px; font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #efedff; color: #5b4ee6; }
  .scan-head { display: flex; gap: 14px; align-items: center; margin-bottom: 18px; padding-right: 70px; }
  .scan-img { width: 84px; height: 84px; border-radius: 14px; object-fit: contain; background: #f8f9fc; border: 1px solid #e6e8f0; flex-shrink: 0; }
  .scan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .scan-grid > div { background: #f8f9fc; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 2px; }
  .scan-grid span { font-size: 0.75rem; color: #64748b; font-weight: 600; }
  .scan-grid b { font-size: 1.15rem; }
  .scan-grid s { font-size: 0.78rem; color: #94a3b8; }
  .scan-grid .danger { color: #e11d48; }
  .eye { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; padding: 0; cursor: pointer; color: #0f172a; font: inherit; }
  .in-bill { margin: 14px 0 0; font-size: 0.85rem; color: #16a34a; font-weight: 600; }
  .scan-primary, .scan-secondary { width: 100%; height: 50px; border-radius: 14px; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; margin-top: 14px; }
  .scan-primary { border: none; color: #fff; background: linear-gradient(135deg, #5b4ee6, #7c6ff2); box-shadow: 0 8px 20px rgba(91,78,230,0.3); }
  .scan-secondary { border: 1.5px solid #e6e8f0; background: #fff; color: #0f172a; margin-top: 10px; }
  .scan-primary:disabled, .scan-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .scan-links { display: flex; justify-content: space-between; margin-top: 16px; font-size: 0.85rem; }
  .scan-links :global(a) { display: inline-flex; align-items: center; gap: 6px; color: #5b4ee6; font-weight: 600; }
`;

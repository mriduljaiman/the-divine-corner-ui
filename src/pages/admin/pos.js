// ============ pages/admin/pos.js — counter billing ============
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiCamera, FiCameraOff, FiSearch, FiTrash2, FiMinus, FiPlus, FiEye, FiEyeOff, FiUser, FiPhone,
  FiCheckCircle, FiX, FiShoppingCart, FiAlertTriangle, FiFileText,
} from 'react-icons/fi';
import { adminLayout } from '../../components/admin/AdminLayout';
import BillShare from '../../components/admin/BillShare';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { inr, normalizePhone, apiError } from '../../utils/format';
import { extractCode, addToLines, billTotals, loadDraft, saveDraft, clearDraft, beep } from '../../utils/pos';
import { cloudinaryPad } from '../../utils/cloudinary';

const Scanner = dynamic(() => import('../../components/admin/Scanner'), { ssr: false });
const METHODS = [['CASH', 'Cash'], ['UPI', 'UPI'], ['CARD', 'Card']];

export default function PosPage() {
  const router = useRouter();
  const [lines, setLines] = useState([]);
  const [customer, setCustomer] = useState({ phone: '', name: '', notes: '', method: 'CASH', paid: '', fullPaid: true });
  const [hydrated, setHydrated] = useState(false);
  const [camera, setCamera] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCost, setShowCost] = useState(new Set());
  const [flash, setFlash] = useState(null);
  const [prevDue, setPrevDue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(null);

  const cacheRef = useRef(new Map());   // code -> product, avoids re-fetching on repeated scans
  const pendingRef = useRef(new Set()); // codes being looked up right now
  const inputRef = useRef(null);

  // the mobile Scan button opens the camera straight away
  useEffect(() => {
    if (router.query.scan === '1') setCamera(true);
  }, [router.query.scan]);

  // ---------- draft persistence (survives refresh / accidental navigation)
  useEffect(() => {
    const d = loadDraft();
    setLines(d.lines || []);
    setCustomer(c => ({ ...c, ...(d.customer || {}) }));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveDraft({ lines, customer });
  }, [lines, customer, hydrated]);

  // Latest lines, updated synchronously so back-to-back scans (before React re-renders) count correctly
  const linesRef = useRef(lines);
  useEffect(() => { linesRef.current = lines; }, [lines]);

  const addProduct = useCallback((product) => {
    if (product.active === false) {
      beep(false);
      showToast.error(`${product.name} is not active`);
      return;
    }
    const existing = linesRef.current.find(l => l.productId === product.id);
    if ((existing?.qty || 0) + 1 > Number(product.stockQuantity)) {
      beep(false);
      showToast.error(`Only ${product.stockQuantity} in stock for ${product.name}`);
      return;
    }
    const next = addToLines(linesRef.current, product);
    linesRef.current = next;
    setLines(next);
    beep(true);
    setFlash(product.id);
    setTimeout(() => setFlash(f => (f === product.id ? null : f)), 700);
  }, []);

  const addByCode = useCallback(async (raw) => {
    const code = extractCode(raw);
    if (!code) return;
    const cached = cacheRef.current.get(code.toUpperCase());
    if (cached) { addProduct(cached); return; }
    if (pendingRef.current.has(code)) return;
    pendingRef.current.add(code);
    try {
      const { data } = await adminService.lookup(code);
      cacheRef.current.set(code.toUpperCase(), data);
      addProduct(data);
    } catch (err) {
      beep(false);
      showToast.error(err.response?.status === 404 ? `No product for "${code}"` : apiError(err));
    } finally {
      pendingRef.current.delete(code);
    }
  }, [addProduct]);

  // ---------- USB / Bluetooth scanners type fast and press Enter; catch them anywhere on the page
  useEffect(() => {
    let buf = '';
    let last = 0;
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const now = Date.now();
      if (now - last > 60) buf = '';
      last = now;
      if (e.key === 'Enter') {
        if (buf.length >= 4) { e.preventDefault(); addByCode(buf); }
        buf = '';
      } else if (e.key.length === 1) {
        buf += e.key;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addByCode]);

  // ---------- product search (debounced)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await adminService.searchProducts({ search: q, size: 8 });
        setResults(data.content || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const submitQuery = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const exact = results.find(r => r.barcode?.toUpperCase() === q.toUpperCase() || r.sku?.toUpperCase() === q.toUpperCase());
    if (exact) addProduct(exact);
    else if (results.length === 1) addProduct(results[0]);
    else await addByCode(q);
    setQuery('');
    setResults([]);
  };

  // ---------- previous due for the entered phone
  const phone = normalizePhone(customer.phone);
  useEffect(() => {
    setPrevDue(null);
    if (!phone) return;
    let alive = true;
    adminService.customerBills(phone).then(({ data }) => {
      if (!alive) return;
      const due = data.filter(b => !b.voided).reduce((s, b) => s + Number(b.amountDue || 0), 0);
      const name = data.find(b => b.customerName)?.customerName;
      setPrevDue({ due, bills: data.length });
      if (name) setCustomer(c => (c.name ? c : { ...c, name }));
    }).catch(() => {});
    return () => { alive = false; };
  }, [phone]);

  const totals = useMemo(() => billTotals(lines), [lines]);
  const paid = customer.fullPaid ? totals.total : Math.min(Number(customer.paid || 0), totals.total);
  const due = Math.max(0, Math.round((totals.total - paid) * 100) / 100);

  const updateLine = (id, patch) => setLines(prev => prev.map(l => (l.productId === id ? { ...l, ...patch } : l)));
  const removeLine = (id) => setLines(prev => prev.filter(l => l.productId !== id));
  const toggleCost = (id) => setShowCost(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const errors = {
    phone: !phone ? 'Enter a valid 10-digit mobile number' : '',
    lines: lines.length === 0 ? 'Scan or add at least one product' : '',
    price: lines.some(l => !(Number(l.unitPrice) > 0)) ? 'Every item needs a price' : '',
    paid: !customer.fullPaid && (customer.paid === '' || Number(customer.paid) < 0 || Number(customer.paid) > totals.total)
      ? `Received amount must be between ₹0 and ${inr(totals.total)}` : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const saveBill = async () => {
    setTouched(true);
    if (invalid) { showToast.error(Object.values(errors).find(Boolean)); return; }
    setSaving(true);
    try {
      const { data } = await adminService.createBill({
        customerName: customer.name.trim() || null,
        customerPhone: phone,
        paymentMethod: customer.method,
        amountPaid: paid,
        notes: customer.notes.trim() || null,
        items: lines.map(l => ({ productId: l.productId, quantity: l.qty, unitPrice: Number(l.unitPrice) })),
      });
      cacheRef.current.clear(); // stock changed
      clearDraft();
      setLines([]);
      setCustomer({ phone: '', name: '', notes: '', method: 'CASH', paid: '', fullPaid: true });
      setTouched(false);
      setShowCost(new Set());
      setDone(data);
      beep(true);
    } catch (err) {
      showToast.error(apiError(err, 'Could not save the bill'));
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    if (lines.length && !confirm('Clear this bill?')) return;
    setLines([]);
    setCustomer({ phone: '', name: '', notes: '', method: 'CASH', paid: '', fullPaid: true });
    setTouched(false);
  };

  return (
    <div className="pos">
      {/* ------------------------------------------------ left: scan + items */}
      <section className="pos-left">
        <div className="adm-card pos-scan-card">
          <form onSubmit={submitQuery} className="pos-search">
            <div className="adm-input-group" style={{ flex: 1 }}>
              <FiSearch />
              <input
                ref={inputRef}
                className="adm-input"
                placeholder="Scan, type barcode / SKU, or search name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
                aria-label="Scan or search product"
              />
            </div>
            <button type="button" className={`adm-btn ${camera ? 'primary' : ''}`} onClick={() => setCamera(c => !c)}>
              {camera ? <FiCameraOff /> : <FiCamera />} <span className="adm-hide-mobile">{camera ? 'Stop' : 'Camera'}</span>
            </button>
          </form>

          {(results.length > 0 || searching) && (
            <div className="pos-results">
              {searching && <div className="pos-result muted">Searching…</div>}
              {results.map(p => (
                <button key={p.id} type="button" className="pos-result" onClick={() => { addProduct(p); setQuery(''); setResults([]); inputRef.current?.focus(); }}>
                  {p.images?.[0] ? <img src={cloudinaryPad(p.images[0], 80, 80)} alt="" className="adm-thumb" /> : <span className="adm-thumb" />}
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span className="adm-truncate" style={{ display: 'block', fontWeight: 600 }}>{p.name}</span>
                    <span className="adm-card-sub">{p.sku} · {p.stockQuantity} in stock</span>
                  </span>
                  <b>{inr(p.discountPrice || p.price)}</b>
                </button>
              ))}
            </div>
          )}

          {camera && (
            <div style={{ marginTop: 12 }}>
              <Scanner onScan={addByCode} />
              <p className="adm-hint" style={{ marginTop: 6, textAlign: 'center' }}>
                Point at the label&apos;s QR / barcode — each scan adds 1 qty.
              </p>
            </div>
          )}
        </div>

        <div className="adm-card" style={{ marginTop: 16 }}>
          <div className="adm-card-head">
            <h2 className="adm-card-title"><FiShoppingCart style={{ verticalAlign: -2 }} /> Items ({totals.qty})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="adm-btn sm ghost" onClick={() => setShowCost(s => (s.size === lines.length ? new Set() : new Set(lines.map(l => l.productId))))}
                disabled={!lines.length} title="Show / hide buying prices">
                {showCost.size && showCost.size === lines.length ? <FiEyeOff /> : <FiEye />} Cost
              </button>
              <button type="button" className="adm-btn sm danger" onClick={clearAll} disabled={!lines.length}>Clear</button>
            </div>
          </div>

          {lines.length === 0 ? (
            <div className="adm-empty">
              <FiCamera />
              <h3>Scan a product to start the bill</h3>
              <p>Use the camera, a USB scanner, or search above.</p>
            </div>
          ) : (
            <div className="pos-lines">
              {lines.map(l => {
                const margin = l.cost != null ? Number(l.unitPrice || 0) - l.cost : null;
                const costOpen = showCost.has(l.productId);
                const bargained = Number(l.unitPrice) < l.mrp;
                return (
                  <div key={l.productId} className={`pos-line ${flash === l.productId ? 'flash' : ''}`}>
                    <div className="pos-line-main">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="pos-line-name">{l.name}</div>
                        <div className="adm-card-sub">
                          {l.sku} · MRP {inr(l.mrp)} · {l.stock - l.qty} left
                        </div>
                      </div>
                      <button type="button" className="adm-icon-btn" onClick={() => toggleCost(l.productId)}
                        aria-label="Show buying price" title="Show buying price">
                        {costOpen ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button type="button" className="adm-icon-btn" onClick={() => removeLine(l.productId)} aria-label="Remove item">
                        <FiTrash2 />
                      </button>
                    </div>

                    {costOpen && (
                      <div className={`pos-cost ${margin != null && margin < 0 ? 'loss' : ''}`}>
                        {l.cost == null ? 'Buying price not set for this product' : (
                          <>Bought at <b>{inr(l.cost)}</b> · Margin <b>{inr(margin)}</b>/unit
                            {margin < 0 && <> <FiAlertTriangle /> selling below cost</>}</>
                        )}
                      </div>
                    )}

                    <div className="pos-line-controls">
                      <label className="pos-price">
                        <span>Price ₹</span>
                        <input
                          type="number" inputMode="decimal" min="0" step="0.01"
                          className={`adm-input ${touched && !(Number(l.unitPrice) > 0) ? 'invalid' : ''}`}
                          value={l.unitPrice}
                          onChange={e => updateLine(l.productId, { unitPrice: e.target.value })}
                          aria-label={`Selling price for ${l.name}`}
                        />
                      </label>
                      <div className="pos-qty">
                        <button type="button" onClick={() => updateLine(l.productId, { qty: Math.max(1, l.qty - 1) })} disabled={l.qty <= 1} aria-label="Decrease"><FiMinus /></button>
                        <span>{l.qty}</span>
                        <button type="button" onClick={() => updateLine(l.productId, { qty: Math.min(l.stock, l.qty + 1) })} disabled={l.qty >= l.stock} aria-label="Increase"><FiPlus /></button>
                      </div>
                      <div className="pos-line-total">
                        {bargained && <s className="text-muted">{inr(l.mrp * l.qty)}</s>}
                        <b>{inr(Number(l.unitPrice || 0) * l.qty)}</b>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ right: customer + payment */}
      <aside className="pos-right">
        <div className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 14 }}>Customer</h2>
          <div className="adm-field">
            <label className="adm-label" htmlFor="pos-phone">Mobile number <span className="req">*</span></label>
            <div className="adm-input-group">
              <FiPhone />
              <input id="pos-phone" className={`adm-input ${touched && errors.phone ? 'invalid' : ''}`} type="tel" inputMode="numeric"
                placeholder="10-digit mobile" maxLength={14} value={customer.phone}
                onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </div>
            {touched && errors.phone && <span className="adm-error-text">{errors.phone}</span>}
            {prevDue && prevDue.due > 0 && (
              <span className="adm-badge danger" style={{ alignSelf: 'flex-start' }}>Previous due {inr(prevDue.due)}</span>
            )}
            {prevDue && prevDue.bills > 0 && prevDue.due === 0 && (
              <span className="adm-badge success" style={{ alignSelf: 'flex-start' }}>Returning customer · {prevDue.bills} bills</span>
            )}
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="pos-name">Name</label>
            <div className="adm-input-group">
              <FiUser />
              <input id="pos-name" className="adm-input" placeholder="Optional" value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 12 }}>Payment</h2>
          <div className="adm-row"><span className="text-muted">MRP total</span><span>{inr(totals.mrpTotal)}</span></div>
          {totals.savings > 0 && <div className="adm-row"><span className="text-muted">Bargain discount</span><span className="text-success">− {inr(totals.savings)}</span></div>}
          {showCost.size > 0 && totals.profit != null && (
            <div className="adm-row"><span className="text-muted">Profit on this bill</span>
              <span className={totals.profit < 0 ? 'text-danger' : 'text-success'}>{inr(totals.profit)}</span></div>
          )}
          <div className="adm-row total"><span>Total</span><span>{inr(totals.total)}</span></div>

          <div className="adm-chips" style={{ margin: '12px 0' }}>
            {METHODS.map(([v, label]) => (
              <button key={v} type="button" className={`adm-chip ${customer.method === v ? 'active' : ''}`}
                onClick={() => setCustomer(c => ({ ...c, method: v }))}>{label}</button>
            ))}
          </div>

          <label className="pos-switch">
            <input type="checkbox" checked={customer.fullPaid}
              onChange={e => setCustomer(c => ({ ...c, fullPaid: e.target.checked, paid: e.target.checked ? '' : String(totals.total) }))} />
            <span>Paid in full</span>
          </label>

          {!customer.fullPaid && (
            <div className="adm-field" style={{ marginTop: 10 }}>
              <label className="adm-label" htmlFor="pos-paid">Amount received now</label>
              <input id="pos-paid" className={`adm-input ${touched && errors.paid ? 'invalid' : ''}`} type="number" inputMode="decimal"
                min="0" step="0.01" value={customer.paid} onChange={e => setCustomer(c => ({ ...c, paid: e.target.value }))} />
              {touched && errors.paid && <span className="adm-error-text">{errors.paid}</span>}
            </div>
          )}
          {due > 0 && (
            <div className="pos-due"><span>Due (saved to customer)</span><b>{inr(due)}</b></div>
          )}

          <div className="adm-field" style={{ marginTop: 12 }}>
            <label className="adm-label" htmlFor="pos-notes">Notes</label>
            <textarea id="pos-notes" className="adm-textarea" rows={2} placeholder="e.g. will pay balance on Monday"
              value={customer.notes} onChange={e => setCustomer(c => ({ ...c, notes: e.target.value }))} />
          </div>

          <button type="button" className="adm-btn primary lg block" style={{ marginTop: 16 }} onClick={saveBill} disabled={saving}>
            <FiCheckCircle /> {saving ? 'Saving…' : `Save bill · ${inr(totals.total)}`}
          </button>
          <Link href="/admin/bills" className="adm-btn ghost block sm" style={{ marginTop: 8 }}><FiFileText /> Previous bills</Link>
        </div>
      </aside>

      {/* sticky total bar for phones */}
      {lines.length > 0 && (
        <div className="pos-mobile-bar adm-no-print">
          <div>
            <div className="adm-card-sub">{totals.qty} items</div>
            <b style={{ fontSize: '1.1rem' }}>{inr(totals.total)}</b>
          </div>
          <button type="button" className="adm-btn primary" onClick={() => document.getElementById('pos-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            Checkout
          </button>
        </div>
      )}

      {done && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal" role="dialog" aria-label="Bill saved">
            <div className="adm-modal-head adm-no-print">
              <h3><FiCheckCircle className="text-success" style={{ verticalAlign: -3 }} /> Bill saved</h3>
              <button className="adm-icon-btn" onClick={() => setDone(null)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <BillShare bill={done}>
                <button type="button" className="adm-btn primary block" onClick={() => { setDone(null); inputRef.current?.focus(); }}>
                  New bill
                </button>
              </BillShare>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pos { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
        .pos-right { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
        .pos-right :global(.adm-card + .adm-card) { margin-top: 0; }
        .pos-search { display: flex; gap: 10px; }
        .pos-results {
          margin-top: 10px; border: 1px solid var(--adm-border); border-radius: 12px; overflow: hidden; max-height: 320px; overflow-y: auto;
        }
        .pos-result {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: none; background: #fff;
          border-bottom: 1px solid #f0f2f7; cursor: pointer; font-size: 0.9rem;
        }
        .pos-result:hover { background: var(--adm-primary-soft); }
        .pos-result.muted { color: var(--adm-muted); cursor: default; }
        .pos-lines { display: flex; flex-direction: column; gap: 10px; }
        .pos-line {
          border: 1px solid var(--adm-border); border-radius: 12px; padding: 12px; background: #fff;
          transition: background 0.4s, border-color 0.4s;
        }
        .pos-line.flash { background: #f0fdf4; border-color: #86efac; }
        .pos-line-main { display: flex; align-items: center; gap: 8px; }
        .pos-line-name { font-weight: 700; font-size: 0.95rem; }
        .pos-cost {
          margin-top: 8px; padding: 8px 10px; border-radius: 9px; background: var(--adm-accent-soft); color: #92400e; font-size: 0.82rem;
        }
        .pos-cost.loss { background: var(--adm-danger-soft); color: var(--adm-danger); }
        .pos-line-controls { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
        .pos-price { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--adm-text-2); font-weight: 600; }
        .pos-price :global(.adm-input) { width: 110px; height: 38px; }
        .pos-qty { display: inline-flex; align-items: center; border: 1.5px solid var(--adm-border); border-radius: 10px; overflow: hidden; }
        .pos-qty button { width: 36px; height: 36px; border: none; background: var(--adm-surface-2); cursor: pointer; display: grid; place-items: center; }
        .pos-qty button:disabled { opacity: 0.4; cursor: not-allowed; }
        .pos-qty span { min-width: 38px; text-align: center; font-weight: 700; }
        .pos-line-total { margin-left: auto; text-align: right; display: flex; flex-direction: column; font-size: 1rem; }
        .pos-line-total s { font-size: 0.78rem; }
        .pos-switch { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
        .pos-switch input { width: 18px; height: 18px; accent-color: var(--adm-primary); }
        .pos-due {
          display: flex; justify-content: space-between; margin-top: 12px; padding: 10px 12px; border-radius: 10px;
          background: var(--adm-danger-soft); color: var(--adm-danger); font-size: 0.9rem;
        }
        .pos-mobile-bar { display: none; }
        @media (max-width: 1023px) {
          .pos { grid-template-columns: 1fr; }
          .pos-right { position: static; }
          .pos-mobile-bar {
            display: flex; justify-content: space-between; align-items: center; gap: 12px;
            position: fixed; left: 12px; right: 12px; bottom: calc(var(--adm-bottom-h) + 12px + env(safe-area-inset-bottom));
            background: #fff; border: 1px solid var(--adm-border); border-radius: 14px; padding: 10px 12px; box-shadow: var(--adm-shadow-lg); z-index: 45;
          }
        }
      `}</style>
    </div>
  );
}

PosPage.getLayout = adminLayout('New Bill');

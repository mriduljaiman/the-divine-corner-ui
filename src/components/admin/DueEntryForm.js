import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { inr, todayIso, normalizePhone, apiError } from '../../utils/format';

const blankItem = () => ({ key: Math.random().toString(36).slice(2), name: '', productId: null, quantity: '1', unitPrice: '' });

/**
 * Record a credit sale by hand: who, when, what they took, total, paid, due and a promise date.
 * Items are free text (old notebook entries) — optionally picked from the catalogue for name/price.
 * Nothing here changes stock.
 */
export default function DueEntryForm({ initialPhone = '', initialName = '', onClose, onSaved }) {
  const [f, setF] = useState({ phone: initialPhone, name: initialName, billDate: todayIso(), paid: '', method: 'CASH', dueDate: '', notes: '' });
  const [items, setItems] = useState([blankItem()]);
  const [suggest, setSuggest] = useState({ key: null, list: [] });
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setF(prev => ({ ...prev, ...patch }));
  const setItem = (key, patch) => setItems(list => list.map(i => (i.key === key ? { ...i, ...patch } : i)));

  // product suggestions for the item being typed
  useEffect(() => {
    const item = items.find(i => i.key === suggest.key);
    const q = item?.name?.trim() || '';
    if (!item || item.productId || q.length < 2) { if (suggest.list.length) setSuggest(s => ({ ...s, list: [] })); return; }
    const t = setTimeout(() => {
      adminService.searchProducts({ search: q, size: 5 }).then(r => setSuggest(s => (s.key === item.key ? { ...s, list: r.data.content || [] } : s))).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [items, suggest.key]);

  const phone = normalizePhone(f.phone);
  const total = useMemo(() => Math.round(items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0) * 100) / 100, [items]);
  const paid = Number(f.paid || 0);
  const due = Math.max(0, Math.round((total - paid) * 100) / 100);

  const errors = {
    phone: !phone ? 'Enter a valid 10-digit mobile number' : '',
    items: items.some(i => !i.name.trim() || !(Number(i.quantity) >= 1) || !(Number(i.unitPrice) > 0)) ? 'Every item needs a name, quantity and price' : '',
    paid: paid < 0 || paid > total ? `Paid must be between ₹0 and ${inr(total)}` : '',
    billDate: !f.billDate || f.billDate > todayIso() ? 'Purchase date cannot be in the future' : '',
    dueDate: f.dueDate && f.dueDate < todayIso() ? 'Promise date cannot be in the past' : '',
  };

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    const first = Object.values(errors).find(Boolean);
    if (first) { setError(first); return; }
    setError('');
    setBusy(true);
    try {
      const { data } = await adminService.manualDue({
        customerName: f.name.trim() || null,
        customerPhone: phone,
        billDate: f.billDate,
        items: items.map(i => ({ productId: i.productId, name: i.name.trim(), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        amountPaid: paid,
        paymentMethod: f.method,
        dueDate: due > 0 && f.dueDate ? f.dueDate : null,
        notes: f.notes.trim() || null,
      });
      onSaved?.(data);
    } catch (err) {
      setError(apiError(err, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <form className="adm-modal wide" onClick={e => e.stopPropagation()} onSubmit={save} noValidate aria-label="New due entry">
        <div className="adm-modal-head">
          <h3>New due entry (udhaar)</h3>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-grid adm-grid-3">
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-phone">Mobile <span className="req">*</span></label>
              <input id="de-phone" className={`adm-input ${touched && errors.phone ? 'invalid' : ''}`} type="tel" inputMode="numeric"
                value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="10-digit mobile" />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-name">Name</label>
              <input id="de-name" className="adm-input" value={f.name} onChange={e => set({ name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-date">Purchase date</label>
              <input id="de-date" className="adm-input" type="date" max={todayIso()} value={f.billDate} onChange={e => set({ billDate: e.target.value })} />
            </div>
          </div>

          <div className="adm-label" style={{ margin: '16px 0 8px' }}>What did they take?</div>
          <div className="de-items">
            {items.map((it, idx) => (
              <div key={it.key} className="de-item">
                <div style={{ position: 'relative', flex: 2, minWidth: 160 }}>
                  <input className="adm-input" placeholder={`Item ${idx + 1} (type or search)`} value={it.name} aria-label={`Item ${idx + 1} name`}
                    onFocus={() => setSuggest({ key: it.key, list: [] })}
                    onChange={e => setItem(it.key, { name: e.target.value, productId: null })} />
                  {suggest.key === it.key && suggest.list.length > 0 && (
                    <div className="de-suggest">
                      {suggest.list.map(p => (
                        <button key={p.id} type="button" onMouseDown={e => e.preventDefault()}
                          onClick={() => { setItem(it.key, { name: p.name, productId: p.id, unitPrice: String(p.discountPrice || p.price) }); setSuggest({ key: null, list: [] }); }}>
                          <span className="adm-truncate">{p.name}</span><b>{inr(p.discountPrice || p.price)}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input className="adm-input" style={{ width: 80 }} type="number" min="1" placeholder="Qty" aria-label={`Item ${idx + 1} quantity`}
                  value={it.quantity} onChange={e => setItem(it.key, { quantity: e.target.value })} />
                <input className="adm-input" style={{ width: 120 }} type="number" min="0" step="0.01" placeholder="Price ₹" aria-label={`Item ${idx + 1} price`}
                  value={it.unitPrice} onChange={e => setItem(it.key, { unitPrice: e.target.value })} />
                <b className="de-line">{inr(Number(it.quantity || 0) * Number(it.unitPrice || 0))}</b>
                <button type="button" className="adm-icon-btn" disabled={items.length === 1} aria-label="Remove item"
                  onClick={() => setItems(list => list.filter(x => x.key !== it.key))}><FiTrash2 /></button>
              </div>
            ))}
          </div>
          <button type="button" className="adm-btn sm" style={{ marginTop: 8 }} onClick={() => setItems(l => [...l, blankItem()])}><FiPlus /> Add item</button>

          <hr className="adm-divider" />
          <div className="adm-grid adm-grid-3">
            <div className="adm-field">
              <label className="adm-label">Total</label>
              <div className="de-total">{inr(total)}</div>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-paid">Paid at that time</label>
              <input id="de-paid" className={`adm-input ${touched && errors.paid ? 'invalid' : ''}`} type="number" min="0" step="0.01"
                placeholder="0" value={f.paid} onChange={e => set({ paid: e.target.value })} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Due</label>
              <div className="de-total text-danger">{inr(due)}</div>
            </div>
          </div>
          {paid > 0 && (
            <div className="adm-chips" style={{ marginTop: 10 }}>
              {['CASH', 'UPI', 'CARD'].map(m => (
                <button key={m} type="button" className={`adm-chip ${f.method === m ? 'active' : ''}`} onClick={() => set({ method: m })}>{m}</button>
              ))}
            </div>
          )}
          <div className="adm-grid adm-grid-2" style={{ marginTop: 12 }}>
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-due">Promised to pay by</label>
              <input id="de-due" className="adm-input" type="date" min={todayIso()} value={f.dueDate} onChange={e => set({ dueDate: e.target.value })} disabled={due <= 0} />
              <span className="adm-hint">You will be reminded on this date.</span>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="de-notes">Notes</label>
              <input id="de-notes" className="adm-input" value={f.notes} onChange={e => set({ notes: e.target.value })} placeholder="e.g. from old notebook, Diwali purchase" />
            </div>
          </div>
          {error && <div className="adm-error-text" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="adm-modal-foot">
          <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : `Save entry · due ${inr(due)}`}</button>
        </div>
        <style jsx>{`
          .de-items { display: flex; flex-direction: column; gap: 8px; }
          .de-item { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
          .de-line { min-width: 80px; text-align: right; }
          .de-total { height: 44px; display: flex; align-items: center; font-size: 1.2rem; font-weight: 800; }
          .de-suggest { position: absolute; top: 46px; left: 0; right: 0; z-index: 10; background: #fff; border: 1px solid var(--adm-border);
            border-radius: 10px; box-shadow: var(--adm-shadow-lg); overflow: hidden; }
          .de-suggest button { width: 100%; display: flex; gap: 8px; justify-content: space-between; padding: 9px 12px; border: none;
            background: #fff; cursor: pointer; font-size: 0.85rem; border-bottom: 1px solid #f0f2f7; }
          .de-suggest button:hover { background: var(--adm-primary-soft); }
        `}</style>
      </form>
    </div>
  );
}

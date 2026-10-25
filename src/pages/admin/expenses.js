// ============ pages/admin/expenses.js ============
import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiX } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { adminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { inr, fmtDate, todayIso, apiError } from '../../utils/format';

const CATEGORIES = ['Rent', 'Salary', 'Electricity', 'Transport', 'Packaging', 'Marketing', 'Maintenance', 'Tea / Snacks', 'Other'];
const empty = () => ({ id: null, expenseDate: todayIso(), category: 'Rent', amount: '', paymentMethod: 'CASH', note: '' });

function monthRange(offset) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = offset === 0 ? now : new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { from: iso(first), to: iso(last), label: first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
}

export default function ExpensesPage() {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const range = useMemo(() => monthRange(offset), [offset]);

  const load = () => {
    setItems(null);
    adminService.expenses({ from: range.from, to: range.to })
      .then(r => setItems(r.data))
      .catch(err => { setItems([]); showToast.error(apiError(err)); });
  };
  useEffect(load, [range.from, range.to]);

  const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);
  const byCat = useMemo(() => {
    const m = new Map();
    (items || []).forEach(e => m.set(e.category, (m.get(e.category) || 0) + Number(e.amount)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { expenseDate: form.expenseDate, category: form.category.trim(), amount: Number(form.amount), paymentMethod: form.paymentMethod, note: form.note };
    try {
      if (form.id) await adminService.updateExpense(form.id, payload);
      else await adminService.createExpense(payload);
      showToast.success(form.id ? 'Expense updated' : 'Expense added');
      setForm(null);
      load();
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (x) => {
    if (!confirm(`Delete ${x.category} expense of ${inr(x.amount)}?`)) return;
    try {
      await adminService.deleteExpense(x.id);
      showToast.success('Deleted');
      load();
    } catch (err) {
      showToast.error(apiError(err));
    }
  };

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Expenses</h1>
          <p>{range.label} · total {inr(total)}</p>
        </div>
        <div className="adm-actions">
          <div className="adm-tabs">
            <button className={`adm-tab ${offset === -1 ? 'active' : ''}`} onClick={() => setOffset(-1)}>Last month</button>
            <button className={`adm-tab ${offset === 0 ? 'active' : ''}`} onClick={() => setOffset(0)}>This month</button>
          </div>
          <button className="adm-btn primary" onClick={() => setForm(empty())}><FiPlus /> Add expense</button>
        </div>
      </div>

      <div className="adm-grid adm-grid-main">
        <section>
          {!items ? <div className="adm-skel" style={{ height: 260 }} /> : items.length === 0 ? (
            <div className="adm-card adm-empty">
              <MdCurrencyRupee />
              <h3>No expenses in {range.label}</h3>
              <button className="adm-btn primary" onClick={() => setForm(empty())}><FiPlus /> Add expense</button>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Date</th><th>Category</th><th>Note</th><th className="num">Amount</th><th /></tr></thead>
                <tbody>
                  {items.map(x => (
                    <tr key={x.id}>
                      <td>{fmtDate(x.expenseDate)}</td>
                      <td><span className="adm-badge neutral">{x.category}</span></td>
                      <td className="adm-card-sub">{x.note || '—'} <span className="adm-badge info">{x.paymentMethod}</span></td>
                      <td className="num"><b>{inr(x.amount)}</b></td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button className="adm-icon-btn" onClick={() => setForm({ ...x, amount: String(x.amount), note: x.note || '' })} aria-label="Edit"><FiEdit2 /></button>{' '}
                        <button className="adm-icon-btn" onClick={() => remove(x)} aria-label="Delete"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 12 }}>Where the money went</h2>
          {byCat.length === 0 ? <div className="adm-card-sub">Nothing yet</div> : byCat.map(([cat, amt]) => (
            <div key={cat} style={{ padding: '7px 0' }}>
              <div className="adm-row" style={{ padding: 0 }}><span>{cat}</span><b>{inr(amt)}</b></div>
              <div className="adm-bar-track" style={{ marginTop: 6 }}>
                <div className="adm-bar-fill" style={{ width: `${(amt / byCat[0][1]) * 100}%`, background: '#f59e0b' }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      {form && (
        <div className="adm-modal-backdrop" onClick={() => setForm(null)}>
          <form className="adm-modal" onClick={e => e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-head">
              <h3>{form.id ? 'Edit expense' : 'Add expense'}</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setForm(null)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-field">
                <label className="adm-label">Category <span className="req">*</span></label>
                <div className="adm-chips">
                  {CATEGORIES.map(c => {
                    const custom = !CATEGORIES.includes(form.category) || form.category === 'Other';
                    const active = c === 'Other' ? custom : form.category === c;
                    return (
                      <button key={c} type="button" className={`adm-chip ${active ? 'active' : ''}`}
                        onClick={() => setForm(f => ({ ...f, category: c === 'Other' ? '' : c }))}>{c}</button>
                    );
                  })}
                </div>
                {(!CATEGORIES.includes(form.category) || form.category === 'Other') && (
                  <input className="adm-input" required placeholder="Type a category" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                )}
              </div>
              <div className="adm-grid adm-grid-2" style={{ marginTop: 14 }}>
                <div className="adm-field">
                  <label className="adm-label">Amount (₹) <span className="req">*</span></label>
                  <input className="adm-input" type="number" step="0.01" min="0.01" required autoFocus value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Date</label>
                  <input className="adm-input" type="date" max={todayIso()} value={form.expenseDate}
                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Paid by</label>
                <div className="adm-chips">
                  {['CASH', 'UPI', 'CARD'].map(m => (
                    <button key={m} type="button" className={`adm-chip ${form.paymentMethod === m ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, paymentMethod: m }))}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Note</label>
                <input className="adm-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="adm-modal-foot">
              <button type="button" className="adm-btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

ExpensesPage.getLayout = adminLayout('Expenses');

import { useState } from 'react';
import { inr, todayIso } from '../../utils/format';

/**
 * Receive money against a due: amount, date (can be back-dated), method, note,
 * and an option to write off (forgive) the amount instead.
 */
export default function PaymentForm({ maxAmount, minDate, busy, onSubmit, onCancel, submitLabel = 'Save payment' }) {
  const [f, setF] = useState({ amount: String(maxAmount ?? ''), paidOn: todayIso(), method: 'CASH', note: '', writeOff: false });
  const [error, setError] = useState('');
  const set = (patch) => setF(prev => ({ ...prev, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!(amount > 0)) return setError('Enter an amount');
    if (maxAmount != null && amount > Number(maxAmount) + 0.001) return setError(`Cannot be more than the due (${inr(maxAmount)})`);
    if (f.paidOn > todayIso()) return setError('Date cannot be in the future');
    setError('');
    onSubmit({ amount, paidOn: f.paidOn, paymentMethod: f.method, note: f.note.trim() || null, writeOff: f.writeOff });
  };

  return (
    <form onSubmit={submit} className="pf">
      <div className="adm-grid adm-grid-2">
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-amount">{f.writeOff ? 'Amount to write off' : 'Amount received'} <span className="req">*</span></label>
          <input id="pf-amount" className="adm-input" type="number" inputMode="decimal" step="0.01" min="0.01" max={maxAmount}
            value={f.amount} onChange={e => set({ amount: e.target.value })} autoFocus />
          {maxAmount != null && (
            <button type="button" className="pf-link" onClick={() => set({ amount: String(maxAmount) })}>Full due {inr(maxAmount)}</button>
          )}
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pf-date">Date</label>
          <input id="pf-date" className="adm-input" type="date" value={f.paidOn} max={todayIso()} min={minDate || undefined}
            onChange={e => set({ paidOn: e.target.value })} />
        </div>
      </div>

      {!f.writeOff && (
        <div className="adm-field" style={{ marginTop: 12 }}>
          <label className="adm-label">Mode</label>
          <div className="adm-chips">
            {['CASH', 'UPI', 'CARD'].map(m => (
              <button key={m} type="button" className={`adm-chip ${f.method === m ? 'active' : ''}`} onClick={() => set({ method: m })}>{m}</button>
            ))}
          </div>
        </div>
      )}

      <div className="adm-field" style={{ marginTop: 12 }}>
        <label className="adm-label" htmlFor="pf-note">Note</label>
        <input id="pf-note" className="adm-input" placeholder="e.g. paid by son, final settlement" value={f.note}
          onChange={e => set({ note: e.target.value })} />
      </div>

      <label className="pf-wo">
        <input type="checkbox" checked={f.writeOff} onChange={e => set({ writeOff: e.target.checked })} />
        <span>
          <b>Write off instead</b> — forgive this amount (not counted as cash received)
        </span>
      </label>

      {error && <div className="adm-error-text" style={{ marginTop: 8 }}>{error}</div>}

      <div className="pf-actions">
        {onCancel && <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>}
        <button type="submit" className={`adm-btn ${f.writeOff ? 'danger' : 'success'}`} disabled={busy}>
          {busy ? 'Saving…' : f.writeOff ? 'Write off' : submitLabel}
        </button>
      </div>

      <style jsx>{`
        .pf-link { border: none; background: none; padding: 0; color: var(--adm-primary); font-weight: 600; font-size: 0.78rem; cursor: pointer; text-align: left; }
        .pf-wo { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; font-size: 0.82rem; color: var(--adm-text-2); cursor: pointer; }
        .pf-wo input { margin-top: 2px; accent-color: var(--adm-danger); }
        .pf-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
      `}</style>
    </form>
  );
}

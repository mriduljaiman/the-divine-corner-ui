// ============ pages/admin/bills/[id].js ============
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft, FiDollarSign, FiSlash, FiX } from 'react-icons/fi';
import { adminLayout } from '../../../components/admin/AdminLayout';
import BillShare from '../../../components/admin/BillShare';
import { adminService } from '../../../services/adminService';
import { showToast } from '../../../utils/toast';
import { inr, fmtDate, apiError } from '../../../utils/format';

export default function BillDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: '', method: 'CASH', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminService.bill(id).then(r => setBill(r.data)).catch(err => setError(apiError(err, 'Bill not found')));
  }, [id]);

  const receive = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await adminService.recordPayment(bill.id, { amount: Number(pay.amount), paymentMethod: pay.method, note: pay.note });
      setBill(data);
      setPayOpen(false);
      showToast.success('Payment recorded');
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const voidIt = async () => {
    const reason = prompt('Why are you voiding this bill? (stock will be returned)');
    if (!reason || !reason.trim()) return;
    try {
      const { data } = await adminService.voidBill(bill.id, reason.trim());
      setBill(data);
      showToast.success('Bill voided and stock returned');
    } catch (err) {
      showToast.error(apiError(err));
    }
  };

  if (error) return <div className="adm-card adm-empty"><h3>{error}</h3><Link href="/admin/bills" className="adm-btn">Back to bills</Link></div>;
  if (!bill) return <div className="adm-skel" style={{ height: 420 }} />;

  const hasDue = Number(bill.amountDue) > 0;

  return (
    <>
      <div className="adm-page-head adm-no-print">
        <div>
          <Link href="/admin/bills" className="adm-btn sm ghost" style={{ marginBottom: 6, paddingLeft: 0 }}><FiArrowLeft /> Bills</Link>
          <h1>{bill.billNumber}</h1>
          <p>{fmtDate(bill.billDate, true)} {bill.createdBy ? `· by ${bill.createdBy}` : ''}</p>
        </div>
        <div className="adm-actions">
          {hasDue && !bill.voided && (
            <button className="adm-btn success" onClick={() => { setPay({ amount: String(bill.amountDue), method: 'CASH', note: '' }); setPayOpen(true); }}>
              <FiDollarSign /> Receive due
            </button>
          )}
          {!bill.voided && <button className="adm-btn danger" onClick={voidIt}><FiSlash /> Void bill</button>}
        </div>
      </div>

      <div className="adm-grid adm-grid-main">
        <div className="adm-card">
          <BillShare bill={bill} />
        </div>
        <div className="adm-no-print">
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 10 }}>Summary</h2>
            <div className="adm-row"><span className="text-muted">Customer</span><b>{bill.customerName || 'Walk-in'}</b></div>
            <div className="adm-row"><span className="text-muted">Mobile</span><a href={`tel:${bill.customerPhone}`}>{bill.customerPhone}</a></div>
            <div className="adm-row"><span className="text-muted">Total</span><b>{inr(bill.total)}</b></div>
            <div className="adm-row"><span className="text-muted">Paid</span><b className="text-success">{inr(bill.amountPaid)}</b></div>
            <div className="adm-row"><span className="text-muted">Due</span><b className={hasDue ? 'text-danger' : ''}>{inr(bill.amountDue)}</b></div>
            {bill.items.some(i => i.costPrice != null) && (
              <div className="adm-row"><span className="text-muted">Profit</span>
                <b>{inr(bill.items.reduce((s, i) => s + (Number(i.unitPrice) - Number(i.costPrice ?? i.unitPrice)) * i.quantity, 0))}</b>
              </div>
            )}
            {bill.voided && <div className="adm-badge danger" style={{ marginTop: 8 }}>Void: {bill.voidReason}</div>}
            <hr className="adm-divider" />
            <Link href={`/admin/dues?phone=${bill.customerPhone}`} className="adm-btn sm block">Customer history</Link>
          </div>
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 10 }}>Payments received later</h2>
            {(bill.payments || []).length === 0 ? <div className="adm-card-sub">None</div> : bill.payments.map(p => (
              <div key={p.id} className="adm-row">
                <span>{fmtDate(p.paidAt, true)} <span className="adm-badge neutral">{p.paymentMethod}</span>{p.note ? <div className="adm-card-sub">{p.note}</div> : null}</span>
                <b className="text-success">{inr(p.amount)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {payOpen && (
        <div className="adm-modal-backdrop" onClick={() => setPayOpen(false)}>
          <form className="adm-modal" onClick={e => e.stopPropagation()} onSubmit={receive}>
            <div className="adm-modal-head">
              <h3>Receive payment</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setPayOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-field">
                <label className="adm-label">Amount (due {inr(bill.amountDue)})</label>
                <input className="adm-input" type="number" step="0.01" min="0.01" max={bill.amountDue} required autoFocus
                  value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="adm-field">
                <label className="adm-label">Method</label>
                <div className="adm-chips">
                  {['CASH', 'UPI', 'CARD'].map(m => (
                    <button key={m} type="button" className={`adm-chip ${pay.method === m ? 'active' : ''}`} onClick={() => setPay(p => ({ ...p, method: m }))}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Note</label>
                <input className="adm-input" value={pay.note} onChange={e => setPay(p => ({ ...p, note: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="adm-modal-foot">
              <button type="button" className="adm-btn" onClick={() => setPayOpen(false)}>Cancel</button>
              <button type="submit" className="adm-btn success" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

BillDetailPage.getLayout = adminLayout('Bill');

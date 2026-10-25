// ============ pages/admin/bills/[id].js ============
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft, FiSlash, FiX, FiPercent } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { adminLayout } from '../../../components/admin/AdminLayout';
import BillShare from '../../../components/admin/BillShare';
import PaymentForm from '../../../components/admin/PaymentForm';
import { invalidateDues, promiseText } from '../../../utils/dues';
import { adminService } from '../../../services/adminService';
import { showToast } from '../../../utils/toast';
import { inr, fmtDate, apiError } from '../../../utils/format';

export default function BillDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [discOpen, setDiscOpen] = useState(false);
  const [disc, setDisc] = useState({ amount: '', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminService.bill(id).then(r => setBill(r.data)).catch(err => setError(apiError(err, 'Bill not found')));
  }, [id]);

  const receive = async (payload) => {
    setBusy(true);
    try {
      const { data } = await adminService.recordPayment(bill.id, payload);
      setBill(data);
      setPayOpen(false);
      invalidateDues();
      showToast.success(payload.writeOff ? 'Written off' : 'Payment recorded');
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const giveDiscount = async (e) => {
    e.preventDefault();
    const amount = Number(disc.amount);
    if (!(amount > 0) || amount > Number(bill.amountDue)) {
      showToast.error(`Discount must be between ₹0 and ${inr(bill.amountDue)}`);
      return;
    }
    setBusy(true);
    try {
      const { data } = await adminService.billDiscount(bill.id, amount, disc.note);
      setBill(data);
      setDiscOpen(false);
      invalidateDues();
      showToast.success(`${inr(amount)} bargain discount applied`);
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
            <button className="adm-btn success" onClick={() => setPayOpen(true)}>
              <MdCurrencyRupee /> Receive due
            </button>
          )}
          {hasDue && !bill.voided && (
            <button className="adm-btn" onClick={() => { setDisc({ amount: String(bill.amountDue), note: '' }); setDiscOpen(true); }}>
              <FiPercent /> Bargain discount
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
            {hasDue && <div className="adm-row"><span className="text-muted">Reminder</span><span>{promiseText(bill.dueDate)}</span></div>}
            {Number(bill.writtenOff) > 0 && <div className="adm-row"><span className="text-muted">Written off</span><b>{inr(bill.writtenOff)}</b></div>}
            {bill.source === 'MANUAL' && <span className="adm-badge neutral">Manual due entry</span>}
            {bill.items.some(i => i.costPrice != null) && (
              <div className="adm-row"><span className="text-muted">Profit</span>
                <b>{inr(bill.items.reduce((s, i) => s + (Number(i.unitPrice) - Number(i.costPrice ?? i.unitPrice)) * i.quantity, 0))}</b>
              </div>
            )}
            {bill.voided && <div className="adm-badge danger" style={{ marginTop: 8 }}>Void: {bill.voidReason}</div>}
            <hr className="adm-divider" />
            <Link href={`/admin/dues/${bill.customerPhone}`} className="adm-btn sm block">Customer khata</Link>
          </div>
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 10 }}>Payments received later</h2>
            {(bill.payments || []).length === 0 ? <div className="adm-card-sub">None</div> : bill.payments.map(p => (
              <div key={p.id} className="adm-row">
                <span>{fmtDate(p.paidAt)} <span className={`adm-badge ${p.paymentMethod === 'WRITE_OFF' ? 'danger' : 'neutral'}`}>{p.paymentMethod === 'WRITE_OFF' ? 'Written off' : p.paymentMethod}</span>{p.note ? <div className="adm-card-sub">{p.note}</div> : null}</span>
                <b className="text-success">{inr(p.amount)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {discOpen && (
        <div className="adm-modal-backdrop" onClick={() => setDiscOpen(false)}>
          <form className="adm-modal" onClick={e => e.stopPropagation()} onSubmit={giveDiscount} aria-label="Bargain discount">
            <div className="adm-modal-head">
              <h3>Bargain discount</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setDiscOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <p style={{ marginTop: 0, color: 'var(--adm-text-2)', fontSize: '0.9rem' }}>
                Customer ne bargain karke kam diya tha? Discount lagane se bill ka total aur due dono kam ho jayenge — ye udhaar nahi rahega.
              </p>
              <div className="adm-field">
                <label className="adm-label" htmlFor="disc-amount">Discount amount (due {inr(bill.amountDue)})</label>
                <input id="disc-amount" className="adm-input" type="number" step="0.01" min="0.01" max={bill.amountDue} autoFocus
                  value={disc.amount} onChange={e => setDisc(d => ({ ...d, amount: e.target.value }))} />
              </div>
              <div className="adm-field">
                <label className="adm-label" htmlFor="disc-note">Note</label>
                <input id="disc-note" className="adm-input" placeholder="Optional" value={disc.note} onChange={e => setDisc(d => ({ ...d, note: e.target.value }))} />
              </div>
              <div className="adm-row" style={{ marginTop: 10 }}>
                <span className="text-muted">New total</span><b>{inr(Number(bill.total) - Number(disc.amount || 0))}</b>
              </div>
            </div>
            <div className="adm-modal-foot">
              <button type="button" className="adm-btn" onClick={() => setDiscOpen(false)}>Cancel</button>
              <button type="submit" className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Apply discount'}</button>
            </div>
          </form>
        </div>
      )}

      {payOpen && (
        <div className="adm-modal-backdrop" onClick={() => setPayOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Receive payment">
            <div className="adm-modal-head">
              <h3>Receive payment · due {inr(bill.amountDue)}</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setPayOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <PaymentForm maxAmount={Number(bill.amountDue)} minDate={(bill.billDate || '').slice(0, 10)} busy={busy}
                onSubmit={receive} onCancel={() => setPayOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

BillDetailPage.getLayout = adminLayout('Bill');

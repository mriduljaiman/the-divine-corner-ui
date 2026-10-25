// ============ pages/admin/dues/[phone].js — one customer's khata (account statement) ============
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft, FiPhone, FiPrinter, FiPlus, FiCheckCircle, FiCalendar, FiDollarSign, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { adminLayout } from '../../../components/admin/AdminLayout';
import PaymentForm from '../../../components/admin/PaymentForm';
import DueEntryForm from '../../../components/admin/DueEntryForm';
import { adminService } from '../../../services/adminService';
import { showToast } from '../../../utils/toast';
import { inr, fmtDate, todayIso, normalizePhone, apiError } from '../../../utils/format';
import { promiseText, daysAgoText, statementText, invalidateDues } from '../../../utils/dues';
import { dueReminderText, whatsappUrl } from '../../../utils/pos';

const TYPE_LABEL = { BILL: 'Purchase', PAYMENT: 'Payment', WRITE_OFF: 'Written off' };

export default function CustomerKhata() {
  const router = useRouter();
  const phone = normalizePhone(router.query.phone);
  const [ledger, setLedger] = useState(null);
  const [openBills, setOpenBills] = useState([]);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [promise, setPromise] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!phone) return;
    try {
      const [l, b] = await Promise.all([adminService.ledger(phone), adminService.customerBills(phone)]);
      setLedger(l.data);
      setOpenBills(b.data.filter(x => !x.voided && Number(x.amountDue) > 0));
      setError('');
    } catch (err) {
      setError(err.response?.status === 404 ? 'No purchases recorded for this number yet.' : apiError(err));
    }
  };
  useEffect(() => {
    if (!router.isReady) return;
    if (!phone) { setError('Invalid mobile number'); return; }
    load();
  }, [router.isReady, phone]);

  const firstOpenDate = useMemo(() => {
    const dates = openBills.map(b => (b.billDate || '').slice(0, 10)).filter(Boolean).sort();
    return dates[0];
  }, [openBills]);

  const receive = async (payload) => {
    setBusy(true);
    try {
      await adminService.collectFromCustomer(phone, payload);
      showToast.success(payload.writeOff ? `${inr(payload.amount)} written off` : `${inr(payload.amount)} received`);
      setPayOpen(false);
      invalidateDues();
      await load();
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const savePromise = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // the promise applies to everything still pending for this customer
      await Promise.all(openBills.map(b => adminService.setDueDate(b.id, promise || null)));
      showToast.success(promise ? `Reminder set for ${fmtDate(promise)}` : 'Promise date cleared');
      setDateOpen(false);
      invalidateDues();
      await load();
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const site = typeof window !== 'undefined' ? window.location.origin : '';
  const sendReminder = async () => {
    window.open(whatsappUrl(phone, dueReminderText(ledger.customerName, ledger.balance, site)), '_blank', 'noopener');
    try { await adminService.markReminded(phone); invalidateDues(); await load(); } catch { /* message still went */ }
  };
  const sendStatement = () => window.open(whatsappUrl(phone, statementText(ledger, site)), '_blank', 'noopener');

  if (error) {
    return (
      <div className="adm-card adm-empty">
        <h3>{error}</h3>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          <Link href="/admin/dues" className="adm-btn"><FiArrowLeft /> Dues</Link>
          {phone && <button className="adm-btn primary" onClick={() => setEntryOpen(true)}><FiPlus /> Add due entry</button>}
        </div>
        {entryOpen && <DueEntryForm initialPhone={phone} onClose={() => setEntryOpen(false)} onSaved={() => { setEntryOpen(false); setError(''); load(); }} />}
      </div>
    );
  }
  if (!ledger) return <div className="adm-skel" style={{ height: 420 }} />;

  const balance = Number(ledger.balance);

  return (
    <>
      <div className="adm-page-head adm-no-print">
        <div>
          <Link href="/admin/dues" className="adm-btn sm ghost" style={{ paddingLeft: 0, marginBottom: 6 }}><FiArrowLeft /> Dues</Link>
          <h1>{ledger.customerName || 'Customer'}</h1>
          <p>
            <a href={`tel:${phone}`}><FiPhone style={{ verticalAlign: -2 }} /> {phone}</a>
            {ledger.lastRemindedAt && <> · last reminded {daysAgoText(ledger.lastRemindedAt)} ({ledger.remindCount}×)</>}
          </p>
        </div>
        <div className="adm-actions">
          <button className="adm-btn" onClick={() => setEntryOpen(true)}><FiPlus /> Add purchase</button>
          <button className="adm-btn" onClick={() => window.print()}><FiPrinter /> Print</button>
          <button className="adm-btn whatsapp" onClick={sendStatement}><FaWhatsapp /> Send statement</button>
        </div>
      </div>

      <div className="adm-grid adm-grid-main adm-no-print">
        <section className={`adm-card kh-balance ${balance > 0 ? 'owes' : 'clear'}`}>
          {balance > 0 ? (
            <>
              <div className="adm-kpi-label">Balance due</div>
              <div className="kh-amount">{inr(balance)}</div>
              <div className="kh-promise"><FiCalendar /> {promiseText(ledger.nextDueDate)}</div>
              <div className="kh-actions">
                <button className="adm-btn success lg" onClick={() => setPayOpen(true)}><FiDollarSign /> Receive payment</button>
                <button className="adm-btn whatsapp lg" onClick={sendReminder}><FaWhatsapp /> Remind</button>
                <button className="adm-btn lg" onClick={() => { setPromise(ledger.nextDueDate || ''); setDateOpen(true); }}><FiCalendar /> Promise date</button>
              </div>
            </>
          ) : (
            <>
              <FiCheckCircle className="kh-ok" />
              <div className="kh-amount" style={{ color: 'var(--adm-success)' }}>Settled</div>
              <div className="adm-card-sub">Nothing pending. Hisab poora ✅</div>
            </>
          )}
        </section>
        <section className="adm-card">
          <div className="adm-row"><span className="text-muted">Total purchases</span><b>{inr(ledger.totalPurchased)}</b></div>
          <div className="adm-row"><span className="text-muted">Total paid</span><b className="text-success">{inr(ledger.totalPaid)}</b></div>
          {Number(ledger.totalWrittenOff) > 0 && <div className="adm-row"><span className="text-muted">Written off</span><b>{inr(ledger.totalWrittenOff)}</b></div>}
          <div className="adm-row total"><span>Balance</span><span className={balance > 0 ? 'text-danger' : 'text-success'}>{inr(balance)}</span></div>
          <div className="adm-card-sub" style={{ marginTop: 6 }}>{openBills.length} bill{openBills.length === 1 ? '' : 's'} pending</div>
        </section>
      </div>

      {/* statement — also what gets printed */}
      <section className="adm-card adm-print-area" style={{ marginTop: 16 }}>
        <div className="kh-print-head">
          <div>
            <b>THE DIVINE CORNER</b> — Account statement
            <div className="adm-card-sub">{ledger.customerName || ''} · {phone} · as on {fmtDate(todayIso())}</div>
          </div>
        </div>
        <div className="kh-mobile">
          {[...ledger.entries].reverse().map((e, i) => (
            <div key={i} className="kh-m-row">
              <div className="kh-m-top">
                <span className={`adm-badge ${e.type === 'BILL' ? 'pending' : e.type === 'WRITE_OFF' ? 'neutral' : 'success'}`}>{TYPE_LABEL[e.type]}</span>
                <span className="adm-card-sub">{fmtDate(e.date)}</span>
                <b className={e.type === 'BILL' ? '' : 'text-success'} style={{ marginLeft: 'auto' }}>
                  {e.type === 'BILL' ? `+ ${inr(e.debit)}` : `− ${inr(e.credit)}`}
                </b>
              </div>
              <div className="kh-desc">{e.description}{e.type === 'BILL' && <> · <Link href={`/admin/bills/${e.billId}`} className="kh-ref">{e.reference}</Link></>}</div>
              {e.note && <div className="adm-card-sub">📝 {e.note}</div>}
              <div className="adm-card-sub">Balance after: <b className={Number(e.balance) > 0 ? 'text-danger' : ''}>{inr(e.balance)}</b></div>
            </div>
          ))}
        </div>
        <div className="adm-table-wrap kh-table" style={{ boxShadow: 'none' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Date</th><th>Details</th><th className="num">Purchase</th><th className="num">Paid</th><th className="num">Balance</th></tr>
            </thead>
            <tbody>
              {ledger.entries.map((e, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                  <td>
                    <span className={`adm-badge ${e.type === 'BILL' ? 'pending' : e.type === 'WRITE_OFF' ? 'neutral' : 'success'}`}>{TYPE_LABEL[e.type]}</span>{' '}
                    {e.type === 'BILL'
                      ? <Link href={`/admin/bills/${e.billId}`} className="kh-ref">{e.reference}</Link>
                      : <span className="adm-card-sub">{e.method && e.method !== 'WRITE_OFF' ? e.method : ''}</span>}
                    <div className="kh-desc">{e.description}</div>
                    {e.note && <div className="adm-card-sub">📝 {e.note}</div>}
                  </td>
                  <td className="num">{Number(e.debit) > 0 ? inr(e.debit) : ''}</td>
                  <td className="num text-success">{Number(e.credit) > 0 ? inr(e.credit) : ''}</td>
                  <td className="num"><b className={Number(e.balance) > 0 ? 'text-danger' : ''}>{inr(e.balance)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {payOpen && (
        <div className="adm-modal-backdrop" onClick={() => setPayOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Receive payment">
            <div className="adm-modal-head">
              <h3>Receive payment · due {inr(balance)}</h3>
              <button className="adm-icon-btn" onClick={() => setPayOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <PaymentForm maxAmount={balance} minDate={firstOpenDate} busy={busy} onSubmit={receive} onCancel={() => setPayOpen(false)} />
              <p className="adm-hint" style={{ marginTop: 10 }}>Oldest bills are settled first.</p>
            </div>
          </div>
        </div>
      )}

      {dateOpen && (
        <div className="adm-modal-backdrop" onClick={() => setDateOpen(false)}>
          <form className="adm-modal" onClick={e => e.stopPropagation()} onSubmit={savePromise}>
            <div className="adm-modal-head">
              <h3>When will they pay?</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setDateOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <input className="adm-input" type="date" min={todayIso()} value={promise} onChange={e => setPromise(e.target.value)} aria-label="Promise date" />
              <div className="adm-chips" style={{ marginTop: 10 }}>
                {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7], ['In 15 days', 15]].map(([l, n]) => {
                  const d = new Date(); d.setDate(d.getDate() + n);
                  const v = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
                  return <button key={l} type="button" className={`adm-chip ${promise === v ? 'active' : ''}`} onClick={() => setPromise(v)}>{l}</button>;
                })}
              </div>
              <p className="adm-hint" style={{ marginTop: 10 }}>The customer shows up under “Remind today” on this date.</p>
            </div>
            <div className="adm-modal-foot">
              {ledger.nextDueDate && <button type="button" className="adm-btn ghost" onClick={() => setPromise('')}>Clear date</button>}
              <button type="submit" className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {entryOpen && (
        <DueEntryForm initialPhone={phone} initialName={ledger.customerName || ''} onClose={() => setEntryOpen(false)}
          onSaved={() => { setEntryOpen(false); showToast.success('Entry added'); invalidateDues(); load(); }} />
      )}

      <style jsx>{`
        .kh-balance { display: flex; flex-direction: column; justify-content: center; }
        .kh-balance.owes { background: linear-gradient(135deg, #fff1f3, #fff); border-color: #fecdd3; }
        .kh-balance.clear { background: linear-gradient(135deg, #ecfdf3, #fff); border-color: #bbf7d0; align-items: center; text-align: center; }
        .kh-amount { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: var(--adm-danger); }
        .kh-balance :global(.kh-ok) { font-size: 2.4rem; color: var(--adm-success); }
        .kh-promise { display: flex; align-items: center; gap: 6px; margin-top: 4px; color: var(--adm-text-2); font-size: 0.9rem; }
        .kh-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
        .kh-desc { font-size: 0.85rem; margin-top: 4px; }
        .kh-ref { font-weight: 600; font-size: 0.82rem; }
        .kh-print-head { display: none; margin-bottom: 12px; }
        @media print { .kh-print-head { display: block; } .kh-mobile { display: none !important; } .kh-table { display: block !important; } }
        .kh-mobile { display: none; }
        .kh-m-row { padding: 12px 0; border-bottom: 1px solid #f0f2f7; display: flex; flex-direction: column; gap: 4px; }
        .kh-m-row:last-child { border-bottom: none; }
        .kh-m-top { display: flex; align-items: center; gap: 8px; }
        @media (max-width: 640px) {
          .kh-mobile { display: block; }
          .kh-table { display: none; }
          .kh-actions :global(.adm-btn) { flex: 1 1 100%; }
          .kh-amount { font-size: 1.8rem; }
        }
      `}</style>
    </>
  );
}

CustomerKhata.getLayout = adminLayout('Customer Khata');

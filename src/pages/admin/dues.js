// ============ pages/admin/dues.js ============
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiCheckCircle, FiX, FiPhone, FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { adminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { inr, fmtDate, initials, normalizePhone, apiError } from '../../utils/format';
import { dueReminderText, whatsappUrl } from '../../utils/pos';

export default function DuesPage() {
  const router = useRouter();
  const [dues, setDues] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);       // { phone, name }
  const [history, setHistory] = useState(null);
  const [pay, setPay] = useState({ amount: '', method: 'CASH', note: '' });
  const [busy, setBusy] = useState(false);

  const load = () => adminService.dues().then(r => setDues(r.data)).catch(err => showToast.error(apiError(err)));
  useEffect(() => { load(); }, []);

  // /admin/dues?phone=98... opens that customer directly
  useEffect(() => {
    const phone = normalizePhone(router.query.phone);
    if (phone) openCustomer({ customerPhone: phone, customerName: '' });
  }, [router.query.phone]);

  const openCustomer = (d) => {
    setOpen({ phone: d.customerPhone, name: d.customerName });
    setHistory(null);
    setPay({ amount: d.totalDue ? String(d.totalDue) : '', method: 'CASH', note: '' });
    adminService.customerBills(d.customerPhone).then(r => {
      setHistory(r.data);
      const due = r.data.filter(b => !b.voided).reduce((s, b) => s + Number(b.amountDue), 0);
      const name = r.data.find(b => b.customerName)?.customerName;
      setOpen(o => ({ ...o, name: o.name || name || '' }));
      setPay(p => ({ ...p, amount: due ? String(due) : '' }));
    }).catch(err => showToast.error(apiError(err)));
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!dues) return [];
    return t ? dues.filter(d => d.customerPhone.includes(t) || (d.customerName || '').toLowerCase().includes(t)) : dues;
  }, [dues, q]);

  const total = (dues || []).reduce((s, d) => s + Number(d.totalDue), 0);
  const openDue = (history || []).filter(b => !b.voided).reduce((s, b) => s + Number(b.amountDue), 0);

  const collect = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminService.collectFromCustomer(open.phone, { amount: Number(pay.amount), paymentMethod: pay.method, note: pay.note });
      showToast.success(`${inr(pay.amount)} received`);
      await load();
      openCustomer({ customerPhone: open.phone, customerName: open.name });
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const site = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Dues</h1>
          <p>{dues ? `${dues.length} customers owe ${inr(total)} in total` : 'Loading…'}</p>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-input-group grow">
          <FiSearch />
          <input className="adm-input" placeholder="Search name or mobile" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {!dues ? <div className="adm-skel" style={{ height: 280 }} /> : filtered.length === 0 ? (
        <div className="adm-card adm-empty">
          <FiCheckCircle style={{ color: 'var(--adm-success)' }} />
          <h3>{dues.length ? 'No match' : 'No pending dues'}</h3>
          <p>{dues.length ? 'Try another search.' : 'Every customer has paid in full. 🎉'}</p>
        </div>
      ) : (
        <div className="adm-grid adm-grid-3">
          {filtered.map(d => (
            <button key={d.customerPhone} type="button" className="adm-card due-card" onClick={() => openCustomer(d)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="adm-avatar tone-danger">{initials(d.customerName || d.customerPhone)}</span>
                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <div className="adm-truncate" style={{ fontWeight: 700 }}>{d.customerName || 'Customer'}</div>
                  <div className="adm-card-sub">{d.customerPhone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-danger" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{inr(d.totalDue)}</div>
                  <div className="adm-card-sub">{d.billCount} bill{d.billCount > 1 ? 's' : ''} · {fmtDate(d.lastBillDate)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="adm-modal-backdrop" onClick={() => setOpen(null)}>
          <div className="adm-modal wide" onClick={e => e.stopPropagation()} role="dialog" aria-label="Customer dues">
            <div className="adm-modal-head">
              <h3>{open.name || 'Customer'} · {open.phone}</h3>
              <button type="button" className="adm-icon-btn" onClick={() => setOpen(null)} aria-label="Close"><FiX /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-grid adm-grid-2">
                <div className="adm-kpi" style={{ boxShadow: 'none' }}>
                  <div className="adm-kpi-label">Total due</div>
                  <div className="adm-kpi-value text-danger">{inr(openDue)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a className="adm-btn whatsapp" target="_blank" rel="noopener noreferrer"
                    href={whatsappUrl(open.phone, dueReminderText(open.name, openDue, site))}>
                    <FaWhatsapp size={18} /> Send reminder
                  </a>
                  <a className="adm-btn" href={`tel:${open.phone}`}><FiPhone /> Call</a>
                </div>
              </div>

              {openDue > 0 && (
                <form onSubmit={collect} className="adm-card" style={{ marginTop: 16, boxShadow: 'none', background: 'var(--adm-surface-2)' }}>
                  <div className="adm-card-title" style={{ marginBottom: 10 }}><FiDollarSign style={{ verticalAlign: -2 }} /> Receive payment</div>
                  <div className="adm-grid adm-grid-2">
                    <input className="adm-input" type="number" step="0.01" min="0.01" max={openDue} required
                      value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} aria-label="Amount" />
                    <div className="adm-chips">
                      {['CASH', 'UPI', 'CARD'].map(m => (
                        <button key={m} type="button" className={`adm-chip ${pay.method === m ? 'active' : ''}`} onClick={() => setPay(p => ({ ...p, method: m }))}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <input className="adm-input" style={{ marginTop: 10 }} placeholder="Note (optional)" value={pay.note}
                    onChange={e => setPay(p => ({ ...p, note: e.target.value }))} />
                  <p className="adm-hint" style={{ marginTop: 6 }}>Oldest bills are settled first.</p>
                  <button type="submit" className="adm-btn success block" disabled={busy} style={{ marginTop: 8 }}>
                    {busy ? 'Saving…' : `Save payment`}
                  </button>
                </form>
              )}

              <h4 style={{ margin: '18px 0 8px' }}>Bill history</h4>
              {!history ? <div className="adm-skel" style={{ height: 120 }} /> : history.length === 0 ? <div className="adm-card-sub">No bills</div> : (
                <div className="adm-list">
                  {history.map(b => (
                    <Link key={b.id} href={`/admin/bills/${b.id}`} className="adm-list-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{b.billNumber}</div>
                        <div className="adm-card-sub">{fmtDate(b.billDate, true)} · {b.totalQuantity} items</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{inr(b.total)}</div>
                        {b.voided ? <span className="adm-badge danger">Void</span>
                          : Number(b.amountDue) > 0 ? <span className="adm-badge pending">Due {inr(b.amountDue)}</span>
                            : <span className="adm-badge success">Paid</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .due-card { text-align: left; cursor: pointer; width: 100%; font: inherit; color: inherit; transition: transform 0.15s, box-shadow 0.15s; }
        .due-card:hover { transform: translateY(-2px); box-shadow: var(--adm-shadow-lg); }
        .adm-grid > :global(.adm-card + .adm-card) { margin-top: 0; }
      `}</style>
    </>
  );
}

DuesPage.getLayout = adminLayout('Dues');

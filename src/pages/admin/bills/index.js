// ============ pages/admin/bills/index.js ============
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiFileText, FiMaximize, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminLayout } from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import { inr, fmtDate, todayIso, apiError } from '../../../utils/format';

const RANGES = [['today', 'Today'], ['7', '7 days'], ['30', '30 days'], ['90', '90 days']];

function rangeDates(key) {
  const to = todayIso();
  if (key === 'today') return { from: to, to };
  const d = new Date(to + 'T00:00:00');
  d.setDate(d.getDate() - (Number(key) - 1));
  const from = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { from, to };
}

export default function BillsPage() {
  const router = useRouter();
  const [range, setRange] = useState('30');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [showVoid, setShowVoid] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    setError('');
    adminService.bills({ ...rangeDates(range), q: query, includeVoided: showVoid, page, size: 20 })
      .then(r => alive && setData(r.data))
      .catch(err => alive && setError(apiError(err, 'Could not load bills')));
    return () => { alive = false; };
  }, [range, query, showVoid, page]);

  const bills = data?.content || [];
  const sum = bills.filter(b => !b.voided).reduce((s, b) => s + Number(b.total), 0);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Counter bills</h1>
          <p>{data ? `${data.totalElements} bills · ${inr(sum)} on this page` : 'Loading…'}</p>
        </div>
        <Link href="/admin/pos" className="adm-btn primary"><FiMaximize /> New bill</Link>
      </div>

      <div className="adm-toolbar">
        <div className="adm-input-group grow">
          <FiSearch />
          <input className="adm-input" placeholder="Search by mobile, name or bill no." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="adm-tabs">
          {RANGES.map(([k, label]) => (
            <button key={k} className={`adm-tab ${range === k ? 'active' : ''}`} onClick={() => { setRange(k); setPage(0); }}>{label}</button>
          ))}
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
          <input type="checkbox" checked={showVoid} onChange={e => { setShowVoid(e.target.checked); setPage(0); }} /> Show void
        </label>
      </div>

      {error && <div className="adm-card text-danger">{error}</div>}

      {!data && !error ? (
        <div className="adm-skel" style={{ height: 300 }} />
      ) : bills.length === 0 ? (
        <div className="adm-card adm-empty">
          <FiFileText />
          <h3>No bills found</h3>
          <p>Bills you create at the counter will appear here.</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Customer</th>
                <th className="num">Items</th>
                <th className="num">Total</th>
                <th className="num">Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id} className="clickable" onClick={() => router.push(`/admin/bills/${b.id}`)}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{b.billNumber}</div>
                    <div className="adm-card-sub">{fmtDate(b.billDate, true)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.customerName || 'Walk-in'}</div>
                    <div className="adm-card-sub">{b.customerPhone}</div>
                  </td>
                  <td className="num">{b.totalQuantity}</td>
                  <td className="num"><b>{inr(b.total)}</b></td>
                  <td className="num">{Number(b.amountDue) > 0 ? <span className="text-danger">{inr(b.amountDue)}</span> : '—'}</td>
                  <td>
                    {b.voided ? <span className="adm-badge danger">Void</span>
                      : Number(b.amountDue) > 0 ? <span className="adm-badge pending">Due</span>
                        : <span className="adm-badge success">Paid · {b.paymentMethod}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="adm-btn sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><FiChevronLeft /> Prev</button>
          <span className="adm-card-sub">Page {page + 1} of {data.totalPages}</span>
          <button className="adm-btn sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight /></button>
        </div>
      )}
    </>
  );
}

BillsPage.getLayout = adminLayout('Bills');

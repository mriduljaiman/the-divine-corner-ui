// ============ pages/admin/dues/index.js — who owes what, sorted by urgency ============
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiCheckCircle, FiPlus, FiBell, FiAlertCircle, FiClock, FiCalendar, FiChevronRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { adminLayout } from '../../../components/admin/AdminLayout';
import DueEntryForm from '../../../components/admin/DueEntryForm';
import { adminService } from '../../../services/adminService';
import { showToast } from '../../../utils/toast';
import { inr, initials, normalizePhone, apiError } from '../../../utils/format';
import { DUE_STATUS, needsReminder, daysAgoText, promiseText, invalidateDues } from '../../../utils/dues';
import { dueReminderText, whatsappUrl } from '../../../utils/pos';

const TABS = [
  ['remind', 'Remind today'],
  ['all', 'All'],
  ['UPCOMING', 'Upcoming'],
  ['NO_DATE', 'No date'],
];

export default function DuesPage() {
  const router = useRouter();
  const [dues, setDues] = useState(null);
  const [tab, setTab] = useState('remind');
  const [q, setQ] = useState('');
  const [entryOpen, setEntryOpen] = useState(false);

  const load = () => adminService.dues()
    .then(r => setDues(r.data))
    .catch(err => { setDues([]); showToast.error(apiError(err)); });
  useEffect(() => { load(); }, []);

  // old links like /admin/dues?phone=98... go straight to the customer's khata
  useEffect(() => {
    const phone = normalizePhone(router.query.phone);
    if (phone) router.replace(`/admin/dues/${phone}`);
  }, [router.query.phone]);

  // nothing to remind today -> show everything
  useEffect(() => {
    if (dues && tab === 'remind' && !dues.some(needsReminder)) setTab('all');
  }, [dues]);

  const stats = useMemo(() => {
    const list = dues || [];
    return {
      total: list.reduce((s, d) => s + Number(d.totalDue), 0),
      overdue: list.filter(d => d.status === 'OVERDUE'),
      today: list.filter(d => d.status === 'DUE_TODAY'),
      stale: list.filter(d => d.status === 'STALE'),
    };
  }, [dues]);

  const filtered = useMemo(() => {
    let list = dues || [];
    if (tab === 'remind') list = list.filter(needsReminder);
    else if (tab !== 'all') list = list.filter(d => d.status === tab);
    const t = q.trim().toLowerCase();
    if (t) list = list.filter(d => d.customerPhone.includes(t) || (d.customerName || '').toLowerCase().includes(t));
    return list;
  }, [dues, tab, q]);

  const site = typeof window !== 'undefined' ? window.location.origin : '';
  const remind = async (d) => {
    window.open(whatsappUrl(d.customerPhone, dueReminderText(d.customerName, d.totalDue, site)), '_blank', 'noopener');
    try {
      await adminService.markReminded(d.customerPhone);
      invalidateDues();
      load();
    } catch { /* the message was still sent */ }
  };

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Dues (udhaar)</h1>
          <p>{dues ? `${dues.length} customers owe ${inr(stats.total)}` : 'Loading…'}</p>
        </div>
        <button className="adm-btn primary" onClick={() => setEntryOpen(true)}><FiPlus /> New due entry</button>
      </div>

      <div className="adm-grid adm-grid-4" style={{ marginBottom: 16 }}>
        <div className="adm-kpi hero">
          <div className="adm-kpi-top"><span className="adm-kpi-label">Total pending</span><span className="adm-kpi-icon"><FiAlertCircle /></span></div>
          <div className="adm-kpi-value">{inr(stats.total)}</div>
          <div className="adm-kpi-sub">{dues?.length || 0} customers</div>
        </div>
        <button type="button" className="adm-kpi kpi-btn" onClick={() => setTab('remind')}>
          <div className="adm-kpi-top"><span className="adm-kpi-label">Overdue</span><span className="adm-kpi-icon tone-danger"><FiBell /></span></div>
          <div className="adm-kpi-value text-danger">{stats.overdue.length}</div>
          <div className="adm-kpi-sub">{inr(stats.overdue.reduce((s, d) => s + Number(d.totalDue), 0))} past promise date</div>
        </button>
        <button type="button" className="adm-kpi kpi-btn" onClick={() => setTab('remind')}>
          <div className="adm-kpi-top"><span className="adm-kpi-label">Due today</span><span className="adm-kpi-icon tone-accent"><FiCalendar /></span></div>
          <div className="adm-kpi-value">{stats.today.length}</div>
          <div className="adm-kpi-sub">{inr(stats.today.reduce((s, d) => s + Number(d.totalDue), 0))} promised today</div>
        </button>
        <button type="button" className="adm-kpi kpi-btn" onClick={() => setTab('remind')}>
          <div className="adm-kpi-top"><span className="adm-kpi-label">Older than 30 days</span><span className="adm-kpi-icon tone-primary"><FiClock /></span></div>
          <div className="adm-kpi-value">{stats.stale.length}</div>
          <div className="adm-kpi-sub">No promise date set</div>
        </button>
      </div>

      <div className="adm-toolbar">
        <div className="adm-tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={`adm-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {label}{k === 'remind' && dues ? ` (${dues.filter(needsReminder).length})` : ''}
            </button>
          ))}
        </div>
        <div className="adm-input-group grow">
          <FiSearch />
          <input className="adm-input" placeholder="Search name or mobile" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {!dues ? <div className="adm-skel" style={{ height: 280 }} /> : filtered.length === 0 ? (
        <div className="adm-card adm-empty">
          <FiCheckCircle style={{ color: 'var(--adm-success)' }} />
          <h3>{dues.length === 0 ? 'No pending dues 🎉' : tab === 'remind' ? 'Nobody to remind today' : 'No match'}</h3>
          <p>{dues.length === 0 ? 'Every customer has paid in full.' : 'Try another tab or search.'}</p>
        </div>
      ) : (
        <div className="due-list">
          {filtered.map(d => {
            const meta = DUE_STATUS[d.status] || DUE_STATUS.NO_DATE;
            return (
              <div key={d.customerPhone} className="adm-card due-row">
                <Link href={`/admin/dues/${d.customerPhone}`} className="due-main">
                  <span className={`adm-avatar tone-${meta.tone === 'pending' ? 'accent' : meta.tone === 'neutral' ? 'primary' : meta.tone === 'shipped' ? 'primary' : meta.tone}`}>
                    {initials(d.customerName || d.customerPhone)}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="adm-truncate" style={{ fontWeight: 700 }}>{d.customerName || 'Customer'} <span className="adm-card-sub">· {d.customerPhone}</span></div>
                    <div className="due-meta">
                      <span className={`adm-badge ${meta.tone}`}>{meta.label}</span>
                      <span>{promiseText(d.nextDueDate)}</span>
                      <span>· {d.billCount} bill{d.billCount > 1 ? 's' : ''}, oldest {d.daysOutstanding}d</span>
                      {d.lastRemindedAt && <span>· reminded {daysAgoText(d.lastRemindedAt)}{d.remindCount > 1 ? ` (${d.remindCount}×)` : ''}</span>}
                    </div>
                  </div>
                  <div className="due-amt">{inr(d.totalDue)}</div>
                  <FiChevronRight className="text-muted adm-hide-mobile" />
                </Link>
                <div className="due-actions">
                  <button type="button" className="adm-btn sm whatsapp" onClick={() => remind(d)}><FaWhatsapp /> Remind</button>
                  <Link href={`/admin/dues/${d.customerPhone}`} className="adm-btn sm">Open khata</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entryOpen && (
        <DueEntryForm
          onClose={() => setEntryOpen(false)}
          onSaved={(bill) => {
            setEntryOpen(false);
            invalidateDues();
            showToast.success('Due entry saved');
            router.push(`/admin/dues/${bill.customerPhone}`);
          }}
        />
      )}

      <style jsx>{`
        .kpi-btn { text-align: left; cursor: pointer; font: inherit; color: inherit; width: 100%; }
        .due-list { display: flex; flex-direction: column; gap: 10px; }
        .due-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .due-list :global(.adm-card + .adm-card) { margin-top: 0; }
        .due-row :global(.due-main) { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; color: inherit; text-decoration: none; }
        .due-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; font-size: 0.78rem; color: var(--adm-text-2); }
        .due-amt { font-weight: 800; font-size: 1.15rem; color: var(--adm-danger); white-space: nowrap; }
        .due-actions { display: flex; gap: 8px; }
        @media (max-width: 640px) {
          .due-row { flex-direction: column; align-items: stretch; }
          .due-actions :global(.adm-btn) { flex: 1; }
        }
      `}</style>
    </>
  );
}

DuesPage.getLayout = adminLayout('Dues');

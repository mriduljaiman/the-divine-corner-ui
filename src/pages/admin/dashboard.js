// ============ pages/admin/dashboard.js ============
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiTrendingUp, FiCalendar, FiPercent, FiAlertCircle, FiUsers, FiShoppingBag, FiPackage, FiMaximize, FiTag, FiTruck, FiPlus, FiRefreshCw, FiFileText, FiBell,
} from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { adminLayout } from '../../components/admin/AdminLayout';
import SalesChart from '../../components/admin/SalesChart';
import { adminService } from '../../services/adminService';
import { inr, fmtDate, apiError } from '../../utils/format';
import { needsReminder, DUE_STATUS, promiseText } from '../../utils/dues';

function Kpi({ label, value, sub, icon: Icon, tone = 'primary', href, hero }) {
  const body = (
    <>
      <div className="adm-kpi-top">
        <span className="adm-kpi-label">{label}</span>
        <span className={`adm-kpi-icon tone-${tone}`}><Icon /></span>
      </div>
      <div className="adm-kpi-value">{value}</div>
      {sub && <div className="adm-kpi-sub">{sub}</div>}
    </>
  );
  const cls = `adm-kpi ${hero ? 'hero' : ''}`;
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, d, du] = await Promise.all([adminService.analytics(), adminService.legacyDashboard(), adminService.dues().catch(() => ({ data: [] }))]);
      setData(a.data);
      setRecent(d.data.recentOrders || []);
      setReminders((du.data || []).filter(needsReminder));
    } catch (err) {
      setError(apiError(err, 'Could not load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) {
    return (
      <div className="adm-grid adm-grid-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="adm-skel" style={{ height: 118 }} />)}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="adm-card adm-empty">
        <FiAlertCircle />
        <h3>{error}</h3>
        <button className="adm-btn" onClick={load}><FiRefreshCw /> Retry</button>
      </div>
    );
  }

  const t = data.todayStats;
  const m = data.monthStats;
  const maxTop = Math.max(1, ...data.topProducts.map(p => Number(p.revenue)));
  const maxExp = Math.max(1, ...data.expenseByCategory.map(e => Number(e.amount)));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Namaste 🙏</h1>
          <p>{new Date(data.today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="adm-actions">
          <button className="adm-btn" onClick={load} disabled={loading}><FiRefreshCw /> Refresh</button>
          <Link href="/admin/pos" className="adm-btn primary"><FiMaximize /> Scan &amp; Bill</Link>
        </div>
      </div>

      <div className="adm-grid adm-grid-4">
        <Kpi hero label="Today's sales" value={inr(t.totalSales)} icon={FiTrendingUp}
          sub={`${t.offlineBills} bills · ${t.onlineOrders} online orders`} href="/admin/bills" />
        <Kpi label="This month" value={inr(m.totalSales)} icon={FiCalendar} tone="info"
          sub={`Counter ${inr(m.offlineSales)} · Online ${inr(m.onlineSales)}`} />
        <Kpi label="Month net profit" value={inr(m.netProfit)} icon={FiPercent} tone={Number(m.netProfit) >= 0 ? 'success' : 'danger'}
          sub={`Gross ${inr(m.grossProfit)} − expenses ${inr(m.expenses)}`} href="/admin/expenses" />
        <Kpi label="Outstanding dues" value={inr(data.outstandingDue)} icon={FiAlertCircle} tone="danger"
          sub={`${data.dueCustomers} customer${data.dueCustomers === 1 ? '' : 's'} to collect from`} href="/admin/dues" />
        <Kpi label="Cash collected today" value={inr(t.collected)} icon={MdCurrencyRupee} tone="success"
          sub={`Today's profit ${inr(t.grossProfit)}`} />
        <Kpi label="Registered customers" value={data.totalCustomers} icon={FiUsers} tone="primary"
          sub={`+${data.newCustomersThisMonth} this month`} href="/admin/customers" />
        <Kpi label="Orders to process" value={data.pendingOrders} icon={FiShoppingBag} tone="accent"
          sub="Pending + confirmed" href="/admin/orders" />
        <Kpi label="Low stock" value={data.lowStockProducts} icon={FiPackage} tone="danger"
          sub={`${data.activeProducts} active products`} href="/admin/inventory" />
      </div>

      {reminders.length > 0 && (
        <section className="adm-card" style={{ marginTop: 16, borderColor: '#fecdd3', background: 'linear-gradient(135deg, #fff5f6, #fff)' }}>
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title"><FiBell style={{ verticalAlign: -2, color: 'var(--adm-danger)' }} /> Remind today ({reminders.length})</h2>
              <div className="adm-card-sub">Overdue promises, payments due today and dues older than 30 days</div>
            </div>
            <Link href="/admin/dues" className="adm-btn sm">Open dues</Link>
          </div>
          <div className="adm-list">
            {reminders.slice(0, 5).map(d => (
              <Link key={d.customerPhone} href={`/admin/dues/${d.customerPhone}`} className="adm-list-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="adm-truncate" style={{ fontWeight: 700 }}>{d.customerName || d.customerPhone}</div>
                  <div className="adm-card-sub">{promiseText(d.nextDueDate)} · {d.daysOutstanding} days old</div>
                </div>
                <span className={`adm-badge ${DUE_STATUS[d.status].tone}`}>{DUE_STATUS[d.status].label}</span>
                <b className="text-danger" style={{ minWidth: 80, textAlign: 'right' }}>{inr(d.totalDue)}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="adm-grid adm-grid-main" style={{ marginTop: 16 }}>
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Sales – last 30 days</h2>
              <div className="adm-card-sub">Online orders (excluding cancelled) and counter bills</div>
            </div>
          </div>
          <SalesChart data={data.daily} />
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Quick actions</h2>
          </div>
          <div className="adm-grid adm-grid-2">
            <Link href="/admin/pos" className="adm-btn primary"><FiMaximize /> New bill</Link>
            <Link href="/admin/products/new" className="adm-btn"><FiPlus /> Add product</Link>
            <Link href="/admin/barcodes" className="adm-btn"><FiTag /> Print labels</Link>
            <Link href="/admin/stock-in" className="adm-btn"><FiTruck /> Stock in</Link>
            <Link href="/admin/expenses" className="adm-btn"><MdCurrencyRupee /> Add expense</Link>
            <Link href="/admin/bills" className="adm-btn"><FiFileText /> All bills</Link>
          </div>
          <hr className="adm-divider" />
          <div className="adm-row"><span className="text-muted">Purchases this month</span><b>{inr(m.purchases)}</b></div>
          <div className="adm-row"><span className="text-muted">Expenses this month</span><b>{inr(m.expenses)}</b></div>
          <div className="adm-row"><span className="text-muted">Collected this month</span><b>{inr(m.collected)}</b></div>
        </section>
      </div>

      <div className="adm-grid adm-grid-3" style={{ marginTop: 16 }}>
        <section className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Top products this month</h2>
          </div>
          {data.topProducts.length === 0 ? <div className="adm-empty">No sales yet this month</div> : (
            <div className="adm-list">
              {data.topProducts.map(p => (
                <div key={p.productId} style={{ padding: '8px 0' }}>
                  <div className="adm-row" style={{ padding: 0 }}>
                    <span className="adm-truncate" style={{ fontWeight: 600 }}>{p.name}</span>
                    <b>{inr(p.revenue)}</b>
                  </div>
                  <div className="adm-bar-track" style={{ marginTop: 6 }}>
                    <div className="adm-bar-fill" style={{ width: `${(Number(p.revenue) / maxTop) * 100}%` }} />
                  </div>
                  <div className="adm-card-sub" style={{ marginTop: 4 }}>{p.quantity} sold</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Expenses by category</h2>
            <Link href="/admin/expenses" className="adm-btn sm ghost">View</Link>
          </div>
          {data.expenseByCategory.length === 0 ? <div className="adm-empty">No expenses this month</div> : (
            data.expenseByCategory.map(e => (
              <div key={e.name} style={{ padding: '8px 0' }}>
                <div className="adm-row" style={{ padding: 0 }}><span>{e.name}</span><b>{inr(e.amount)}</b></div>
                <div className="adm-bar-track" style={{ marginTop: 6 }}>
                  <div className="adm-bar-fill" style={{ width: `${(Number(e.amount) / maxExp) * 100}%`, background: '#f59e0b' }} />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Recent online orders</h2>
            <Link href="/admin/orders" className="adm-btn sm ghost">View all</Link>
          </div>
          {recent.length === 0 ? <div className="adm-empty">No orders yet</div> : (
            <div className="adm-list">
              {recent.slice(0, 6).map(o => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="adm-list-item">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="adm-truncate" style={{ fontWeight: 600 }}>{o.customerName}</div>
                    <div className="adm-card-sub">{o.orderNumber} · {fmtDate(o.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{inr(o.totalAmount)}</div>
                    <span className={`adm-badge ${o.status.toLowerCase()}`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

AdminDashboard.getLayout = adminLayout('Dashboard');

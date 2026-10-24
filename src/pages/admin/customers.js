// ============ pages/admin/customers.js ============
import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiUsers, FiPhone, FiMail } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { adminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { fmtDate, initials, normalizePhone, apiError } from '../../utils/format';

export default function CustomersPage() {
  const [users, setUsers] = useState(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  useEffect(() => {
    adminService.users(0, 200)
      .then(r => { setUsers(r.data.content || []); setTotal(r.data.totalElements || 0); })
      .catch(err => { setUsers([]); showToast.error(apiError(err)); });
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = (users || []).filter(u => u.role !== 'ADMIN');
    if (!t) return list;
    return list.filter(u => `${u.firstName} ${u.lastName} ${u.email} ${u.phone || ''} ${u.city || ''}`.toLowerCase().includes(t));
  }, [users, q]);

  const toggle = async (u) => {
    if (!confirm(`${u.active ? 'Block' : 'Unblock'} ${u.firstName}?`)) return;
    try {
      const { data } = await adminService.toggleUser(u.id);
      setUsers(list => list.map(x => (x.id === u.id ? data : x)));
    } catch (err) {
      showToast.error(apiError(err));
    }
  };

  const thisMonth = (users || []).filter(u => {
    if (!u.createdAt || u.role === 'ADMIN') return false;
    const d = new Date(u.createdAt), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Registered customers</h1>
          <p>{users ? `${Math.max(0, total - (users.filter(u => u.role === 'ADMIN').length))} customers · ${thisMonth} joined this month` : 'Loading…'}</p>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-input-group grow">
          <FiSearch />
          <input className="adm-input" placeholder="Search name, email, mobile, city" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {!users ? <div className="adm-skel" style={{ height: 300 }} /> : filtered.length === 0 ? (
        <div className="adm-card adm-empty"><FiUsers /><h3>No customers found</h3></div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Customer</th><th>Contact</th><th>City</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filtered.map(u => {
                const phone = normalizePhone(u.phone);
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="adm-avatar">{initials(`${u.firstName} ${u.lastName}`)}</span>
                        <b>{u.firstName} {u.lastName !== '-' ? u.lastName : ''}</b>
                      </div>
                    </td>
                    <td>
                      <div className="adm-card-sub"><FiMail /> {u.email}</div>
                      {u.phone && <div className="adm-card-sub"><FiPhone /> {u.phone}</div>}
                    </td>
                    <td>{u.city || '—'}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>{u.active ? <span className="adm-badge success">Active</span> : <span className="adm-badge danger">Blocked</span>}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {phone && (
                        <a className="adm-icon-btn" href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                          <FaWhatsapp />
                        </a>
                      )}{' '}
                      <button className={`adm-btn sm ${u.active ? 'danger' : ''}`} onClick={() => toggle(u)}>{u.active ? 'Block' : 'Unblock'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

CustomersPage.getLayout = adminLayout('Customers');

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  FiGrid, FiShoppingBag, FiFileText, FiAlertCircle, FiPackage, FiTag, FiLayers,
  FiSearch, FiTruck, FiUsers, FiMenu, FiX, FiLogOut, FiExternalLink, FiMaximize,
  FiShoppingCart, FiMoreHorizontal,
} from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useDueReminders } from '../../utils/dues';
import { preloadDetector } from '../../utils/barcodeReader';

export const ADMIN_NAV = [
  { title: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: FiGrid }] },
  {
    title: 'Sell',
    items: [
      { href: '/admin/pos', label: 'New Bill (POS)', icon: FiMaximize },
      { href: '/admin/bills', label: 'Bills', icon: FiFileText },
      { href: '/admin/dues', label: 'Dues', icon: FiAlertCircle },
      { href: '/admin/orders', label: 'Online Orders', icon: FiShoppingBag },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: FiPackage },
      { href: '/admin/categories', label: 'Categories', icon: FiLayers },
      { href: '/admin/barcodes', label: 'Barcode Labels', icon: FiTag },
    ],
  },
  {
    title: 'Stock & Money',
    items: [
      { href: '/admin/inventory', label: 'Inventory', icon: FiSearch },
      { href: '/admin/stock-in', label: 'Purchases / Stock In', icon: FiTruck },
      { href: '/admin/expenses', label: 'Expenses', icon: MdCurrencyRupee },
    ],
  },
  { title: 'People', items: [{ href: '/admin/customers', label: 'Customers', icon: FiUsers }] },
];

const isActive = (pathname, href) =>
  pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href + '/')) ||
  (href === '/admin/stock-in' && pathname.startsWith('/admin/stock-in'));

export default function AdminLayout({ title, children }) {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin()) {
      router.replace(user ? '/' : `/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [loading, user]);

  useEffect(() => {
    const close = () => setDrawerOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  const ready = !loading && isAdmin();
  const pathname = router.pathname;
  const remindCount = useDueReminders(ready, router.asPath);

  // get the barcode decoder ready in the background so "Scan" opens instantly
  useEffect(() => {
    if (ready) preloadDetector();
  }, [ready]);

  return (
    <div className={`adm-shell ${drawerOpen ? 'drawer-open' : ''}`}>
      <Head>
        <title>{title ? `${title} · Divine Corner Admin` : 'Divine Corner Admin'}</title>
      </Head>

      <aside className="adm-sidebar adm-no-print" aria-label="Admin navigation">
        <div className="adm-brand">
          <span className="adm-brand-mark">ॐ</span>
          <div>
            The Divine Corner
            <small>Admin Panel</small>
          </div>
        </div>
        <nav className="adm-nav">
          {ADMIN_NAV.map(group => (
            <div key={group.title} className="adm-nav-group">
              <div className="adm-nav-group-title">{group.title}</div>
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={`adm-nav-link ${isActive(pathname, href) ? 'active' : ''}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {href === '/admin/dues' && remindCount > 0 && <span className="adm-nav-badge" title="Customers to remind today">{remindCount}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }} className="adm-truncate">
            {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
          </div>
          <Link href="/"><FiExternalLink /> View store</Link>
          <button type="button" onClick={logout}><FiLogOut /> Logout</button>
        </div>
      </aside>
      <div className="adm-overlay" onClick={() => setDrawerOpen(false)} />

      <div className="adm-main">
        <header className="adm-topbar adm-no-print">
          <button className="adm-icon-btn adm-menu-btn" onClick={() => setDrawerOpen(o => !o)} aria-label="Menu">
            {drawerOpen ? <FiX /> : <FiMenu />}
          </button>
          <h1 className="adm-topbar-title">{title}</h1>
          <div className="adm-topbar-actions">
            <Link href="/admin/pos" className="adm-btn primary sm adm-hide-mobile">
              <FiMaximize /> New Bill
            </Link>
            <Link href="/" className="adm-icon-btn" aria-label="View store" title="View store">
              <FiShoppingCart />
            </Link>
          </div>
        </header>

        <main className="adm-content">
          {ready ? children : (
            <div className="adm-grid adm-grid-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="adm-skel" style={{ height: 110 }} />)}
            </div>
          )}
        </main>
      </div>

      <nav className="adm-bottom-nav adm-no-print" aria-label="Quick navigation">
        <Link href="/admin/dashboard" className={`adm-bottom-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
          <FiGrid /> Home
        </Link>
        <Link href="/admin/bills" className={`adm-bottom-link ${pathname.startsWith('/admin/bills') ? 'active' : ''}`}>
          <FiFileText /> Bills
        </Link>
        <Link href="/admin/pos?scan=1" className="adm-fab" aria-label="Scan and bill">
          <FiMaximize />
        </Link>
        <Link href="/admin/dues" className={`adm-bottom-link ${pathname.startsWith('/admin/dues') ? 'active' : ''}`} style={{ position: 'relative' }}>
          <FiAlertCircle /> Dues
          {remindCount > 0 && <span className="adm-bottom-badge">{remindCount}</span>}
        </Link>
        <button type="button" className="adm-bottom-link" onClick={() => setDrawerOpen(true)}>
          <FiMoreHorizontal /> More
        </button>
      </nav>
    </div>
  );
}

/** Use as `Page.getLayout = adminLayout('Title')`. */
export const adminLayout = (title) => function getLayout(page) {
  return <AdminLayout title={title}>{page}</AdminLayout>;
};

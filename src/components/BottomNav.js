import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiHome, FiGrid, FiShoppingBag, FiPackage, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { getCartItemsCount } = useCart();
  const cartCount = getCartItemsCount();

  if (router.pathname.startsWith('/admin')) return null;

  const tabs = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/categories', label: 'Categories', icon: FiGrid },
    { href: '/products', label: 'Products', icon: FiShoppingBag },
    { href: '/orders', label: 'My Orders', icon: FiPackage },
    { href: isAuthenticated() ? '/profile' : '/auth/login', label: 'Profile', icon: FiUser },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === '/'
          ? router.pathname === '/'
          : router.pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} />
              {tab.label === 'Products' && cartCount > 0 && (
                <span className="bottom-nav-badge">{cartCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;

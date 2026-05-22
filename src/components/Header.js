import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoryService } from '../services/categoryService';
import {
  FiMenu, FiX, FiShoppingCart, FiUser, FiLogOut,
  FiPackage, FiSettings, FiSearch, FiHeart, FiChevronRight,
} from 'react-icons/fi';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    categoryService.getAllActiveCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (router.query.search) setSearchQuery(router.query.search);
  }, [router.query.search]);

  const handleLogout = async () => {
    await logout();
    setDrawerOpen(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = value.trim();
      if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
    }, 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  const cartCount = getCartItemsCount();

  return (
    <>
      <header className="app-header">
        {/* Top Row */}
        <div className="app-header-top">
          <button className="app-icon-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <FiMenu size={22} />
          </button>

          <Link href="/" className="app-logo-link">
            <img src="/logo_tagline.png" alt="The Divine Corner" className="app-logo-img" />
          </Link>

          <div className="app-header-icons">
            <button className="app-icon-btn" aria-label="Wishlist">
              <FiHeart size={21} />
            </button>
            <Link href="/cart" className="app-icon-btn app-cart-btn" aria-label="Cart">
              <FiShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="app-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="app-header-search">
          <form onSubmit={handleSearch} className="app-search-form">
            <FiSearch className="app-search-icon" size={15} />
            <input
              type="text"
              className="app-search-input"
              placeholder="Search by Keyword or Product ID"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="app-search-clear"
                onClick={() => { setSearchQuery(''); }}
                aria-label="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          {isAuthenticated() ? (
            <div className="drawer-user-info">
              <div className="drawer-avatar">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="drawer-user-text">
                <p className="drawer-user-name">{user?.firstName} {user?.lastName}</p>
                <p className="drawer-user-email">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="drawer-guest">
              <FiUser size={32} className="drawer-guest-icon" />
              <div>
                <p className="drawer-guest-msg">Sign in to see your orders</p>
                <Link href="/auth/login" className="btn btn-primary btn-sm">Login / Register</Link>
              </div>
            </div>
          )}
          <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          <Link href="/" className="drawer-nav-link">
            <span>Home</span><FiChevronRight size={15} />
          </Link>
          <Link href="/categories" className="drawer-nav-link">
            <span>Categories</span><FiChevronRight size={15} />
          </Link>
          <Link href="/products" className="drawer-nav-link">
            <span>All Products</span><FiChevronRight size={15} />
          </Link>
          {isAuthenticated() && (
            <>
              <Link href="/orders" className="drawer-nav-link">
                <span>My Orders</span><FiChevronRight size={15} />
              </Link>
              <Link href="/profile" className="drawer-nav-link">
                <span>My Profile</span><FiChevronRight size={15} />
              </Link>
              <Link href="/cart" className="drawer-nav-link">
                <span>My Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span><FiChevronRight size={15} />
              </Link>
            </>
          )}
          {isAdmin() && (
            <Link href="/admin/dashboard" className="drawer-nav-link drawer-admin-link">
              <span><FiSettings size={14} style={{ marginRight: 6 }} />Admin Panel</span>
              <FiChevronRight size={15} />
            </Link>
          )}
        </nav>

        {categories.length > 0 && (
          <div className="drawer-categories">
            <p className="drawer-section-title">Shop by Category</p>
            {categories.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.id}`} className="drawer-nav-link">
                <span>
                  {cat.icon && <span className="drawer-cat-icon">{cat.icon}</span>}
                  {cat.name}
                </span>
                <FiChevronRight size={15} />
              </Link>
            ))}
          </div>
        )}

        {isAuthenticated() && (
          <button onClick={handleLogout} className="drawer-logout-btn">
            <FiLogOut size={15} /> Logout
          </button>
        )}
      </div>
    </>
  );
};

export default Header;

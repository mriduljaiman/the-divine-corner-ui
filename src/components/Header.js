import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoryService } from '../services/categoryService';
import {
  FiMenu,
  FiX,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiChevronDown,
  FiHome,
  FiGrid,
  FiInfo,
  FiMail,

  FiTag,
} from 'react-icons/fi';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const userMenuRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    categoryService.getAllActiveCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [router.pathname]);

  // Sync search input with URL query on page load
  useEffect(() => {
    if (router.query.search) {
      setSearchQuery(router.query.search);
    }
  }, [router.query.search]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = value.trim();
      if (q) {
        router.push(`/products?search=${encodeURIComponent(q)}`);
      }
    }, 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
    setMobileMenuOpen(false);
  };

  const cartCount = getCartItemsCount();

  const navLinks = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/products', label: 'Products', icon: FiGrid },
    { href: '/about', label: 'About', icon: FiInfo },
    { href: '/contact', label: 'Contact', icon: FiMail },
  ];

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link href="/" className="logo">
            <img
              src="/logo_tagline.png"
              alt="The Divine Corner"
              className="logo-img"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${router.pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search */}
          <div className="header-search-wrap">
            <form className="header-search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="header-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear"
                >
                  <FiX />
                </button>
              )}
            </form>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            {isAuthenticated() ? (
              <>
                <Link href="/cart" className="cart-btn">
                  <FiShoppingCart className="cart-icon" />
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </Link>

                <div className="user-menu-container" ref={userMenuRef}>
                  <button
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                  >
                    <div className="user-avatar">
                      {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="user-name">{user?.firstName}</span>
                    <FiChevronDown className={`chevron ${userMenuOpen ? 'rotate' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                      <div className="dropdown-divider" />
                      <Link href="/profile" className="dropdown-item">
                        <FiUser /> My Profile
                      </Link>
                      <Link href="/orders" className="dropdown-item">
                        <FiPackage /> My Orders
                      </Link>
                      {isAdmin() && (
                        <>
                          <div className="dropdown-divider" />
                          <Link href="/admin/dashboard" className="dropdown-item admin-link">
                            <FiSettings /> Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-item logout-btn">
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link href="/auth/login" className="btn btn-ghost">Login</Link>
                <Link href="/auth/register" className="btn btn-primary">Register</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar — always visible on mobile */}
        <div className="mobile-search-bar">
          <form className="mobile-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="mobile-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear"
              >
                <FiX />
              </button>
            )}
          </form>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-nav-links">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link ${router.pathname === link.href ? 'active' : ''}`}
                >
                  <Icon /> {link.label}
                </Link>
              );
            })}
          </nav>

          {categories.length > 0 && (
            <div className="mobile-categories">
              <p className="mobile-categories-title"><FiTag /> Categories</p>
              <div className="mobile-categories-list">
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    className="mobile-category-link"
                  >
                    {cat.icon && <span className="mobile-cat-icon">{cat.icon}</span>}
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!isAuthenticated() && (
            <div className="mobile-auth-buttons">
              <Link href="/auth/login" className="btn btn-ghost btn-block">Login</Link>
              <Link href="/auth/register" className="btn btn-primary btn-block">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

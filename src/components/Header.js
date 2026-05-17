import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
} from 'react-icons/fi';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [router.pathname]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
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
            <span className="logo-icon">✦</span>
            <span className="logo-text">The Divine Corner</span>
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

          {/* Header Actions */}
          <div className="header-actions">
            {isAuthenticated() ? (
              <>
                {/* Cart */}
                <Link href="/cart" className="cart-btn">
                  <FiShoppingCart className="cart-icon" />
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </Link>

                {/* User Menu */}
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
                <Link href="/auth/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link href="/auth/register" className="btn btn-primary">
                  Register
                </Link>
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

          {!isAuthenticated() && (
            <div className="mobile-auth-buttons">
              <Link href="/auth/login" className="btn btn-ghost btn-block">
                Login
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-block">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

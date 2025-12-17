    // ============ components/Header.js ============
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            The Divine Corner
          </Link>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <Link href="/">Home</Link>
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>

          <div className="header-actions">
            {isAuthenticated() ? (
              <>
                <Link href="/cart" className="cart-icon">
                  🛒 Cart ({getCartItemsCount()})
                </Link>
                <div className="user-menu">
                  <span className="user-name">{user?.firstName}</span>
                  <div className="dropdown">
                    <Link href="/profile">My Profile</Link>
                    <Link href="/orders">My Orders</Link>
                    {isAdmin() && (
                      <Link href="/admin/dashboard">Admin Panel</Link>
                    )}
                    <button onClick={logout}>Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-secondary">Login</Link>
                <Link href="/auth/register" className="btn btn-primary">Register</Link>
              </>
            )}

            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
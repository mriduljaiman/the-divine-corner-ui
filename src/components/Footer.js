// ============ components/Footer.js ============
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>The Divine Corner</h3>
            <p>Your trusted online store for quality products</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link href="/products">Products</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <div className="footer-section">
            <h4>Customer Service</h4>
            <Link href="/help">Help Center</Link>
            <Link href="/shipping">Shipping Info</Link>
            <Link href="/returns">Returns</Link>
          </div>

          <div className="footer-section">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href="#" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 The Divine Corner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
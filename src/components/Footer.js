import Link from 'next/link';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
} from 'react-icons/fi';
import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
} from 'react-icons/si';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>

      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link href="/" className="footer-logo">
              <span className="logo-icon">✦</span>
              <span>The Divine Corner</span>
            </Link>
            <p className="footer-description">
              Discover divine products for your everyday life. Quality, elegance, and affordability all in one place.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <SiFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <SiInstagram />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <SiX />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <SiYoutube />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <nav className="footer-links">
              <Link href="/products">All Products</Link>
              <Link href="/products?featured=true">Featured Items</Link>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="footer-section">
            <h4 className="footer-title">Customer Service</h4>
            <nav className="footer-links">
              <Link href="/help">Help Center</Link>
              <Link href="/shipping">Shipping Info</Link>
              <Link href="/returns">Returns & Refunds</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="footer-title">Contact Us</h4>
            <div className="footer-contact">
              <a href="mailto:support@divinecorner.com" className="contact-item">
                <FiMail />
                <span>support@divinecorner.com</span>
              </a>
              <a href="tel:+1234567890" className="contact-item">
                <FiPhone />
                <span>+1 (234) 567-890</span>
              </a>
              <div className="contact-item">
                <FiMapPin />
                <span>123 Divine Street, City, Country</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="newsletter">
              <h5>Subscribe to Newsletter</h5>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email for newsletter"
                />
                <button type="submit" aria-label="Subscribe">
                  <FiSend />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} The Divine Corner. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

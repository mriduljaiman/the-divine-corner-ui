import Link from 'next/link';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { SEO_PAGES } from '../config/seoPages';
import { SHOP, shopAddressText, hoursText } from '../config/shop';

// Shown under every storefront page: the shop's address (same text as Google Business
// Profile) plus links to every local landing page so Google finds and ranks them.
export default function LocalFooter() {
  return (
    <footer className="local-footer">
      <div className="local-footer-inner">
        <div>
          <b className="local-footer-name">{SHOP.name}</b>
          <p><FiMapPin /> {shopAddressText()}</p>
          {SHOP.phone && <p><FiPhone /> <a href={`tel:${SHOP.phone.replace(/\s/g, '')}`}>{SHOP.phone}</a></p>}
          {hoursText().map(line => <p key={line}><FiClock /> {line}</p>)}
          <p><FiMail /> <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a></p>
          {SHOP.mapsUrl && <p><a href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps →</a></p>}
        </div>
        <nav aria-label="Shop by need">
          <b>Shop in Jaipur</b>
          <div className="local-footer-links">
            {SEO_PAGES.map(p => <Link key={p.slug} href={`/jaipur/${p.slug}`}>{p.label}</Link>)}
          </div>
        </nav>
      </div>
      <p className="local-footer-copy">
        © {new Date().getFullYear()} {SHOP.name} · <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>
      </p>
    </footer>
  );
}

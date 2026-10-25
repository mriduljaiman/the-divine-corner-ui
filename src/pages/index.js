import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FiTruck, FiShield, FiHeadphones, FiArrowRight } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const TRUST = [
  { icon: MdCurrencyRupee, title: 'Cash on Delivery', text: 'Pay when it arrives' },
  { icon: FiTruck, title: 'Free delivery', text: 'On orders ₹500+' },
  { icon: FiShield, title: 'Genuine products', text: 'Handpicked with care' },
  { icon: FiHeadphones, title: 'Friendly support', text: 'Chat with us anytime' },
];

function Skeletons({ n = 10 }) {
  return (
    <div className="meesho-grid">
      {[...Array(n)].map((_, i) => (
        <div key={i} className="meesho-skeleton-card">
          <div className="skeleton meesho-skeleton-img" />
          <div className="skeleton meesho-skeleton-line" style={{ width: '80%' }} />
          <div className="skeleton meesho-skeleton-line" style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Each request fails independently so one slow/broken call never blanks the page
    Promise.allSettled([
      productService.getAllProducts(0, 20),
      productService.getFeaturedProducts(),
      categoryService.getAllActiveCategories(),
    ]).then(([all, feat, cats]) => {
      if (all.status === 'fulfilled') setProducts(all.value.data.content || []);
      if (feat.status === 'fulfilled') setFeatured((feat.value.data || []).slice(0, 10));
      if (cats.status === 'fulfilled') setCategories(cats.value.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="home-app">
      <Head>
        <title>The Divine Corner — Divine gifts &amp; décor</title>
        <meta name="description" content="Handpicked idols, puja essentials, décor and gifts. Cash on delivery, free delivery on orders above ₹500." />
      </Head>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker">✨ Blessings, delivered</span>
            <h1>Bring home something <span>divine</span></h1>
            <p>Idols, puja essentials, décor &amp; thoughtful gifts — handpicked and delivered to your door.</p>
            <div className="hero-cta">
              <Link href="/products" className="hero-btn primary">Shop now <FiArrowRight /></Link>
              <Link href="/categories" className="hero-btn">Browse categories</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-om">ॐ</div>
            <div className="hero-ring r1" />
            <div className="hero-ring r2" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="trust">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="trust-item">
            <span className="trust-icon"><Icon /></span>
            <div>
              <b>{title}</b>
              <small>{text}</small>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="cat-scroll-bar">
          <div className="cat-scroll-inner">
            <Link href="/products" className="cat-chip">
              <div className="cat-chip-img-wrap"><span className="cat-chip-emoji">🛍️</span></div>
              <span className="cat-chip-label">All</span>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.id}`} className="cat-chip">
                <div className="cat-chip-img-wrap">
                  {cat.imageUrl
                    ? <img src={cat.imageUrl} alt={cat.name} className="cat-chip-img" />
                    : <span className="cat-chip-emoji">{cat.icon || '🏷️'}</span>}
                </div>
                <span className="cat-chip-label">{cat.name.length > 10 ? `${cat.name.slice(0, 9)}…` : cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="store-section">
          <div className="store-section-head">
            <div>
              <h2>Featured picks</h2>
              <p>Our favourites this season</p>
            </div>
            <Link href="/products">See all</Link>
          </div>
          {loading ? <Skeletons n={5} /> : (
            <div className="meesho-grid">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      )}

      {/* Latest */}
      <section className="store-section">
        <div className="store-section-head">
          <div>
            <h2>New arrivals</h2>
            <p>Fresh additions to the store</p>
          </div>
          <Link href="/products">View all</Link>
        </div>
        {loading ? <Skeletons /> : products.length > 0 ? (
          <>
            <div className="meesho-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="home-view-more">
              <Link href="/products" className="btn">View all products</Link>
            </div>
          </>
        ) : (
          <div className="home-empty">
            <p>No products available yet.</p>
            <Link href="/products" className="btn btn-primary btn-sm">Browse All</Link>
          </div>
        )}
      </section>

      <style jsx>{`
        .hero {
          background: radial-gradient(1200px 400px at 85% 10%, rgba(249, 115, 22, 0.25), transparent 60%),
            linear-gradient(135deg, #2a0e3a 0%, #5b1a4a 45%, #8a2a3d 100%);
          color: #fff;
          overflow: hidden;
        }
        .hero-inner {
          max-width: 1280px; margin: 0 auto; padding: 28px 16px 30px;
          display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; gap: 16px;
        }
        .hero-kicker {
          display: inline-block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em;
          background: rgba(255, 255, 255, 0.14); padding: 5px 12px; border-radius: 999px; margin-bottom: 12px;
        }
        .hero h1 { color: #fff; font-size: 1.7rem; line-height: 1.15; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.02em; }
        .hero h1 span { color: #fbbf24; }
        .hero p { margin: 0 0 18px; color: rgba(255, 255, 255, 0.82); font-size: 0.92rem; max-width: 440px; }
        .hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
        .hero-cta :global(.hero-btn) {
          display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
          font-weight: 700; font-size: 0.9rem; color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.4); text-decoration: none;
        }
        .hero-cta :global(.hero-btn.primary) {
          background: linear-gradient(135deg, #f59e0b, #f97316); border-color: transparent; box-shadow: 0 10px 24px rgba(249, 115, 22, 0.4);
        }
        .hero-art { position: relative; height: 160px; display: grid; place-items: center; }
        .hero-om {
          font-size: 5.5rem; color: #fde68a; text-shadow: 0 0 40px rgba(251, 191, 36, 0.6); z-index: 1;
          animation: glow 4s ease-in-out infinite;
        }
        .hero-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(253, 230, 138, 0.35); }
        .r1 { width: 150px; height: 150px; animation: spin 30s linear infinite; border-style: dashed; }
        .r2 { width: 210px; height: 210px; opacity: 0.5; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow { 50% { text-shadow: 0 0 70px rgba(251, 191, 36, 0.9); } }

        .trust {
          max-width: 1280px; margin: 0 auto; display: flex; gap: 10px; padding: 12px;
          overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory;
        }
        .trust::-webkit-scrollbar { display: none; }
        .trust-item {
          display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #edf0f5;
          border-radius: 12px; padding: 10px 12px; flex: 0 0 auto; white-space: nowrap; scroll-snap-align: start;
        }
        .trust-icon {
          width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;
          background: #fff7ed; color: #ea580c; font-size: 1.05rem;
        }
        .trust-item b { display: block; font-size: 0.82rem; color: #0f172a; }
        .trust-item small { font-size: 0.72rem; color: #64748b; }

        @media (min-width: 768px) {
          .hero-inner { padding: 56px 24px; }
          .hero h1 { font-size: 2.8rem; }
          .hero p { font-size: 1.05rem; }
          .hero-art { height: 260px; }
          .hero-om { font-size: 9rem; }
          .r1 { width: 240px; height: 240px; }
          .r2 { width: 330px; height: 330px; }
          .trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px 24px 8px; overflow: visible; }
          .trust-item { padding: 14px 16px; }
        }
        @media (max-width: 480px) {
          .hero-inner { grid-template-columns: 1fr 96px; }
          .hero-om { font-size: 3.6rem; }
          .r1 { width: 88px; height: 88px; }
          .r2 { width: 120px; height: 120px; }
          .hero-art { height: 120px; }
        }
      `}</style>
    </div>
  );
}

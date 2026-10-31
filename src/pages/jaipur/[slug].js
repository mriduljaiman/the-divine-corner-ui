import Link from 'next/link';
import { FiMapPin, FiPhone, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Seo from '../../components/Seo';
import ProductCard from '../../components/ProductCard';
import { SEO_PAGES, seoPageBySlug } from '../../config/seoPages';
import { SHOP, shopAddressText } from '../../config/shop';
import { serverGet, publicProduct } from '../../utils/serverApi';

const MAX_PRODUCTS = 20;

export default function LocalLandingPage({ page, products, categoryId }) {
  const url = `${SHOP.url}/jaipur/${page.slug}`;
  const shopAllHref = categoryId ? `/products?category=${categoryId}` : '/products';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SHOP.url },
      { '@type': 'ListItem', position: 2, name: 'Jaipur', item: `${SHOP.url}/jaipur` },
      { '@type': 'ListItem', position: 3, name: page.label, item: url },
    ],
  };
  const faq = page.faq.length > 0 && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const itemList = products.length > 0 && {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SHOP.url}/products/${p.id}`, name: p.name })),
  };

  return (
    <div className="seo-page">
      <Seo title={page.title} description={page.description} path={`/jaipur/${page.slug}`}
        jsonLd={[breadcrumb, faq, itemList]} />

      <nav className="seo-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/jaipur">Jaipur</Link> / <span>{page.label}</span>
      </nav>

      <header className="seo-hero">
        <span className="seo-emoji" aria-hidden="true">{page.emoji}</span>
        <h1>{page.h1}</h1>
        <p>{page.intro}</p>
        <div className="seo-cta">
          {SHOP.mapsUrl && <a className="hero-btn primary" href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer"><FiMapPin /> Get directions</a>}
          {SHOP.phone && <a className="hero-btn" href={`tel:${SHOP.phone.replace(/\s/g, '')}`}><FiPhone /> Call shop</a>}
          {SHOP.whatsapp && <a className="hero-btn" href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Hi, I'm looking for ${page.label}`)}`} target="_blank" rel="noopener noreferrer"><FaWhatsapp /> WhatsApp</a>}
          <Link className="hero-btn" href={shopAllHref}>Shop online <FiArrowRight /></Link>
        </div>
      </header>

      <section className="seo-block">
        <h2>What you will find</h2>
        <ul className="seo-items">
          {page.items.map(it => <li key={it}>{it}</li>)}
        </ul>
      </section>

      {products.length > 0 && (
        <section className="store-section">
          <div className="store-section-head">
            <div><h2>{page.label} in stock</h2><p>Available at the shop and online</p></div>
            <Link href={shopAllHref}>See all</Link>
          </div>
          <div className="meesho-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="seo-block seo-visit">
        <h2>Visit our shop</h2>
        <p><FiMapPin /> <b>{SHOP.name}</b>, {shopAddressText()}</p>
        <p>
          Serving customers from {SHOP.nearbyAreas.slice(0, -1).join(', ')} and all over {SHOP.city}.
          Cash on delivery available on online orders, free delivery above ₹500.
        </p>
      </section>

      {page.faq.length > 0 && (
        <section className="seo-block">
          <h2>Frequently asked questions</h2>
          {page.faq.map(([q, a]) => (
            <details key={q} className="seo-faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      )}

      <section className="seo-block">
        <h2>More at The Divine Corner</h2>
        <div className="seo-links">
          {SEO_PAGES.filter(p => p.slug !== page.slug).map(p => (
            <Link key={p.slug} href={`/jaipur/${p.slug}`}>{p.emoji} {p.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export async function getStaticPaths() {
  return { paths: SEO_PAGES.map(p => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const page = seoPageBySlug(params.slug);
  const { categories: catNames, search } = page.match;

  const cats = catNames.length ? (await serverGet('/categories')).data || [] : [];
  const wanted = catNames.map(n => n.toLowerCase());
  const catIds = cats.filter(c => wanted.includes(c.name.toLowerCase())).map(c => c.id);

  const requests = [
    ...catIds.map(id => serverGet(`/products/search?categoryId=${id}&size=${MAX_PRODUCTS}`)),
    ...search.map(q => serverGet(`/products/search?search=${encodeURIComponent(q)}&size=${MAX_PRODUCTS}`)),
  ];
  const seen = new Set();
  const products = [];
  for (const r of await Promise.all(requests)) {
    for (const p of r.data?.content || []) {
      if (seen.has(p.id) || p.active === false) continue;
      seen.add(p.id);
      products.push(publicProduct(p));
    }
  }

  return {
    props: { page, products: products.slice(0, MAX_PRODUCTS), categoryId: catIds.length === 1 ? catIds[0] : null },
    revalidate: 3600, // new stock shows up within an hour
  };
}

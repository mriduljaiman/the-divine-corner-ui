import Link from 'next/link';
import Seo from '../../components/Seo';
import ProductCard from '../../components/ProductCard';
import { SEO_PAGES } from '../../config/seoPages';
import { SHOP } from '../../config/shop';
import { serverGet, publicProduct } from '../../utils/serverApi';
import { slugify, productPath } from '../../utils/urls';

const MAX_PRODUCTS = 100;

// Server-rendered category listing so Google sees the products (the /products?category=
// filter page loads them in the browser only).
export default function CategoryPage({ category, products, guides }) {
  const path = `/category/${slugify(category.name)}`;
  const itemList = products.length > 0 && {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SHOP.url}${productPath(p)}`, name: p.name })),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SHOP.url },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SHOP.url}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SHOP.url}${path}` },
    ],
  };

  return (
    <div className="seo-page">
      <Seo
        title={`${category.name} in Jaipur | ${SHOP.name}, Sirsi Road`}
        description={category.description
          || `Shop ${category.name.toLowerCase()} at ${SHOP.name}, Kanak Vrindavan, Sirsi Road, Jaipur. ${products.length} items in stock. Cash on delivery, free delivery above ₹500.`}
        path={path}
        jsonLd={[breadcrumb, itemList]}
      />
      <nav className="seo-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/categories">Categories</Link> / <span>{category.name}</span>
      </nav>
      <header className="seo-hero">
        <h1>{category.name} in Jaipur</h1>
        <p>
          {category.description || `${category.name} available at our shop in Kanak Vrindavan, Sirsi Road, Jaipur and online with cash on delivery.`}
        </p>
        {guides.length > 0 && (
          <div className="seo-links">
            {guides.map(g => <Link key={g.slug} href={`/jaipur/${g.slug}`}>{g.emoji} {g.label} guide</Link>)}
          </div>
        )}
      </header>

      {products.length > 0 ? (
        <div className="meesho-grid">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <p className="seo-block">New stock is on the way — visit the shop or <Link href="/contact">contact us</Link>.</p>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  const cats = (await serverGet('/categories')).data || [];
  return { paths: cats.map(c => ({ params: { slug: slugify(c.name) } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const res = await serverGet('/categories');
  if (!res.ok) throw new Error('categories unavailable'); // keep the last good page instead of a 404
  const category = res.data.find(c => slugify(c.name) === params.slug);
  if (!category) return { notFound: true, revalidate: 300 };

  const list = await serverGet(`/products/search?categoryId=${category.id}&size=${MAX_PRODUCTS}`);
  const products = (list.data?.content || []).filter(p => p.active !== false).map(publicProduct);
  const guides = SEO_PAGES.filter(p => p.match.categories.some(n => n.toLowerCase() === category.name.toLowerCase()));

  return {
    props: {
      category: { id: category.id, name: category.name, description: category.description || null },
      products,
      guides: guides.map(({ slug, label, emoji }) => ({ slug, label, emoji })),
    },
    revalidate: 900,
  };
}

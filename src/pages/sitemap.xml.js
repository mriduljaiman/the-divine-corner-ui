import { SEO_PAGES } from '../config/seoPages';
import { SHOP } from '../config/shop';
import { serverGet } from '../utils/serverApi';
import { productPath, categoryPath } from '../utils/urls';

const STATIC_PATHS = ['/', '/jaipur', '/jaipur/laddu-gopal-dress-size-chart', '/products', '/categories', '/about', '/contact', '/shipping-policy', '/return-policy'];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function getServerSideProps({ res }) {
  const [products, categories] = await Promise.all([
    serverGet('/products?page=0&size=1000&sortBy=createdAt&sortDir=DESC'),
    serverGet('/categories'),
  ]);

  const urls = [
    ...STATIC_PATHS.map(p => ({ loc: p, priority: p === '/' ? '1.0' : '0.8' })),
    ...SEO_PAGES.map(p => ({ loc: `/jaipur/${p.slug}`, priority: '0.9' })),
    ...(categories.data || []).map(c => ({ loc: categoryPath(c), priority: '0.8' })),
    ...(products.data?.content || []).filter(p => p.active !== false).map(p => ({ loc: productPath(p), priority: '0.7' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(SHOP.url + u.loc)}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }

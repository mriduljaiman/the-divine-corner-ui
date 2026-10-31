import { SHOP } from '../config/shop';
import { SHIPPING } from '../config/policy';
import { serverGet } from '../utils/serverApi';
import { productPath } from '../utils/urls';

// Google Merchant Center product feed (free listings). Add it in Merchant Center as a
// scheduled fetch of https://thedivinecorner.in/merchant-feed.xml
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => `${Number(n).toFixed(2)} INR`;

function item(p) {
  const onSale = p.discountPrice && Number(p.discountPrice) < Number(p.price);
  const desc = (p.description || '').trim()
    || `${p.name}${p.category?.name ? ` – ${p.category.name}` : ''} from ${SHOP.name}, Jaipur. Cash on delivery, free delivery on orders of ₹${SHIPPING.freeAbove}+.`;
  const [first, ...rest] = p.images || [];
  const tags = [
    ['g:id', p.sku || p.id],
    ['g:title', p.name],
    ['g:description', desc],
    ['g:link', `${SHOP.url}${productPath(p)}`],
    ['g:image_link', first],
    ...rest.slice(0, 10).map(u => ['g:additional_image_link', u]),
    ['g:availability', p.stockQuantity > 0 ? 'in_stock' : 'out_of_stock'],
    ['g:price', money(p.price)],
    onSale && ['g:sale_price', money(p.discountPrice)],
    ['g:brand', p.brand || SHOP.name],
    ['g:condition', 'new'],
    ['g:identifier_exists', 'no'],
    p.category?.name && ['g:product_type', p.category.name],
  ].filter(t => t && t[1]);
  const price = Number(onSale ? p.discountPrice : p.price);
  return `    <item>
${tags.map(([k, v]) => `      <${k}>${esc(v)}</${k}>`).join('\n')}
      <g:shipping><g:country>IN</g:country><g:price>${money(price >= SHIPPING.freeAbove ? 0 : SHIPPING.charge)}</g:price></g:shipping>
    </item>`;
}

export async function getServerSideProps({ res }) {
  const r = await serverGet('/products?page=0&size=1000&sortBy=createdAt&sortDir=DESC');
  if (!r.ok) {
    // never serve an empty feed – Merchant Center would drop every product
    res.statusCode = 503;
    res.end('backend unavailable');
    return { props: {} };
  }
  const products = (r.data.content || []).filter(p => p.active !== false && p.images?.length);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SHOP.name)}</title>
    <link>${SHOP.url}</link>
    <description>${esc(`${SHOP.name} products`)}</description>
${products.map(item).join('\n')}
  </channel>
</rss>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function MerchantFeed() { return null; }

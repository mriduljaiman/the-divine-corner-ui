import { SHOP } from '../config/shop';

// Server-side (getStaticProps / sitemap) fetch against the backend. Never throws:
// SEO pages must still render their copy when the backend is slow or down.
// On Vercel NEXT_PUBLIC_API_URL is relative ('/backend'), which only works in the
// browser, so fall back to the site's own /backend rewrite in production.
const absolute = (u) => (u && /^https?:\/\//.test(u) ? u : null);
const API = (
  absolute(process.env.BACKEND_URL)
  || absolute(process.env.NEXT_PUBLIC_API_URL)
  || (process.env.NODE_ENV === 'production' ? `${SHOP.url}/backend` : 'http://localhost:8080/api')
).replace(/\/$/, '');

export async function serverGet(path, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    return { ok: true, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

// Strip what a public page must never embed (purchase price is admin-only anyway)
export const publicProduct = ({ purchasingPrice, reorderPoint, minStockLevel, lowStock, ...p }) => p;

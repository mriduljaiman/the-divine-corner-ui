// ============ pages/admin/barcodes.js — bulk barcode / QR label generator ============
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiPrinter, FiSearch, FiTag, FiTrash2, FiLayers, FiPackage } from 'react-icons/fi';
import { adminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { inr, apiError } from '../../utils/format';

const MAX_LABELS = 2000;
const SIZES = {
  a4: { label: 'A4 sheet · 3 × 8 (64 × 34 mm)', page: '@page { size: A4; margin: 8mm 6mm; }' },
  roll: { label: 'Thermal roll · 50 × 25 mm', page: '@page { size: 50mm 25mm; margin: 0; }' },
};

/** Builds QR + Code128 images once per product (memoised by product id + code). */
async function renderCodes(products, siteUrl, cache) {
  const [{ default: QRCode }, { default: JsBarcode }] = await Promise.all([import('qrcode'), import('jsbarcode')]);
  const out = {};
  for (const p of products) {
    const key = `${p.id}:${p.barcode}`;
    if (!cache.has(key)) {
      const qr = await QRCode.toDataURL(`${siteUrl}/p/${encodeURIComponent(p.barcode)}`, {
        margin: 0, width: 220, errorCorrectionLevel: 'M',
      });
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, p.barcode, { format: 'CODE128', displayValue: false, margin: 0, height: 60, width: 2 });
      cache.set(key, { qr, bar: canvas.toDataURL('image/png') });
    }
    out[p.id] = cache.get(key);
  }
  return out;
}

export default function BarcodesPage() {
  const [mode, setMode] = useState('category');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [rows, setRows] = useState([]);           // { product, copies, include }
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [size, setSize] = useState('a4');
  const [showPrice, setShowPrice] = useState(true);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    adminService.categories().then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  // load a whole category
  useEffect(() => {
    if (mode !== 'category' || !categoryId) return;
    setLoading(true);
    adminService.searchProducts({ categoryId, size: 500 })
      .then(r => setRows((r.data.content || []).map(p => ({ product: p, copies: Math.max(0, p.stockQuantity), include: p.stockQuantity > 0 }))))
      .catch(err => showToast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, [mode, categoryId]);

  // search for individual products
  useEffect(() => {
    if (mode !== 'pick' || query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      adminService.searchProducts({ search: query.trim(), size: 10 }).then(r => setResults(r.data.content || [])).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, mode]);

  const switchMode = (m) => { setMode(m); setRows([]); setImages({}); setCategoryId(''); setQuery(''); };

  const addPicked = (p) => {
    setRows(r => (r.some(x => x.product.id === p.id) ? r : [...r, { product: p, copies: Math.max(1, p.stockQuantity), include: true }]));
    setQuery('');
    setResults([]);
  };

  const selected = rows.filter(r => r.include && r.copies > 0 && r.product.barcode);
  const totalLabels = selected.reduce((s, r) => s + Number(r.copies), 0);
  const missingCode = rows.filter(r => r.include && !r.product.barcode).length;

  // regenerate images when the selection changes
  useEffect(() => {
    if (!selected.length) { setImages({}); return; }
    let alive = true;
    renderCodes(selected.map(r => r.product), window.location.origin, cacheRef.current)
      .then(imgs => alive && setImages(imgs))
      .catch(() => alive && showToast.error('Could not generate codes'));
    return () => { alive = false; };
  }, [selected.map(r => r.product.id).join(',')]);

  const labels = useMemo(() => {
    const out = [];
    for (const r of selected) {
      for (let i = 0; i < r.copies && out.length < MAX_LABELS; i++) out.push(r.product);
    }
    return out;
  }, [selected]);

  const print = () => {
    if (!labels.length) { showToast.error('Select at least one product with quantity'); return; }
    if (totalLabels > MAX_LABELS) showToast.warning(`Only the first ${MAX_LABELS} labels will print`);
    window.print();
  };

  const setRow = (id, patch) => setRows(rs => rs.map(r => (r.product.id === id ? { ...r, ...patch } : r)));

  return (
    <>
      <style>{SIZES[size].page}</style>
      <div className="adm-page-head adm-no-print">
        <div>
          <h1>Barcode labels</h1>
          <p>Print one label per piece in stock. Scanning a label in the admin app adds it to the bill; customers scanning it land on the product page.</p>
        </div>
        <button className="adm-btn primary lg" onClick={print} disabled={!labels.length}>
          <FiPrinter /> Print {totalLabels ? `${Math.min(totalLabels, MAX_LABELS)} labels` : ''}
        </button>
      </div>

      <div className="adm-grid adm-grid-main adm-no-print">
        <section className="adm-card">
          <div className="adm-tabs" style={{ marginBottom: 14 }}>
            <button className={`adm-tab ${mode === 'category' ? 'active' : ''}`} onClick={() => switchMode('category')}><FiLayers /> By category</button>
            <button className={`adm-tab ${mode === 'pick' ? 'active' : ''}`} onClick={() => switchMode('pick')}><FiPackage /> Pick products</button>
          </div>

          {mode === 'category' ? (
            <select className="adm-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} aria-label="Category">
              <option value="">Choose a category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div style={{ position: 'relative' }}>
              <div className="adm-input-group">
                <FiSearch />
                <input className="adm-input" placeholder="Search product name, SKU or barcode" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              {results.length > 0 && (
                <div className="bc-results">
                  {results.map(p => (
                    <button key={p.id} type="button" onClick={() => addPicked(p)}>
                      <span className="adm-truncate" style={{ flex: 1, textAlign: 'left' }}>{p.name}</span>
                      <span className="adm-card-sub">{p.stockQuantity} in stock</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? <div className="adm-skel" style={{ height: 160, marginTop: 14 }} /> : rows.length === 0 ? (
            <div className="adm-empty"><FiTag /><h3>{mode === 'category' ? 'Pick a category' : 'Search and add products'}</h3></div>
          ) : (
            <div className="adm-table-wrap" style={{ marginTop: 14 }}>
              <table className="adm-table">
                <thead><tr><th /><th>Product</th><th className="num">Stock</th><th className="num">Labels</th><th /></tr></thead>
                <tbody>
                  {rows.map(({ product: p, copies, include }) => (
                    <tr key={p.id}>
                      <td><input type="checkbox" checked={include} onChange={e => setRow(p.id, { include: e.target.checked })} aria-label={`Include ${p.name}`} /></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="adm-card-sub">{p.barcode || <span className="text-danger">no barcode</span>} · {inr(p.discountPrice || p.price)}</div>
                      </td>
                      <td className="num">{p.stockQuantity}</td>
                      <td className="num">
                        <input className="adm-input" type="number" min="0" max="500" style={{ width: 80, height: 36, textAlign: 'right' }}
                          value={copies} onChange={e => setRow(p.id, { copies: Math.max(0, Math.min(500, parseInt(e.target.value || '0', 10))) })}
                          aria-label={`Labels for ${p.name}`} />
                      </td>
                      <td>
                        {mode === 'pick' && (
                          <button className="adm-icon-btn" onClick={() => setRows(rs => rs.filter(r => r.product.id !== p.id))} aria-label="Remove"><FiTrash2 /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 12 }}>Label settings</h2>
          <div className="adm-field">
            <label className="adm-label">Paper</label>
            {Object.entries(SIZES).map(([k, v]) => (
              <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', padding: '4px 0' }}>
                <input type="radio" name="size" checked={size === k} onChange={() => setSize(k)} /> {v.label}
              </label>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', marginTop: 12 }}>
            <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} /> Print selling price
          </label>
          <hr className="adm-divider" />
          <div className="adm-row"><span className="text-muted">Products</span><b>{selected.length}</b></div>
          <div className="adm-row"><span className="text-muted">Labels</span><b>{totalLabels}</b></div>
          {missingCode > 0 && <div className="adm-error-text">{missingCode} product(s) have no barcode and will be skipped.</div>}
          <p className="adm-hint" style={{ marginTop: 10 }}>Tip: choose &quot;Save as PDF&quot; in the print dialog to download the labels.</p>
          {labels[0] && images[labels[0].id] && (
            <>
              <div className="adm-label" style={{ marginTop: 12 }}>Preview</div>
              <div className={`bc-sheet ${size}`} style={{ marginTop: 6 }}>
                <Label p={labels[0]} img={images[labels[0].id]} showPrice={showPrice} />
              </div>
            </>
          )}
        </section>
      </div>

      {/* what actually gets printed */}
      <div className="adm-print-area adm-print-only">
        <div className={`bc-sheet ${size}`}>
          {labels.map((p, i) => images[p.id] && <Label key={i} p={p} img={images[p.id]} showPrice={showPrice} />)}
        </div>
      </div>

      <style jsx global>{`
        .bc-results { position: absolute; left: 0; right: 0; top: 48px; z-index: 5; background: #fff; border: 1px solid var(--adm-border);
          border-radius: 12px; box-shadow: var(--adm-shadow-lg); overflow: hidden; }
        .bc-results button { width: 100%; display: flex; gap: 10px; padding: 10px 14px; border: none; background: #fff; cursor: pointer;
          border-bottom: 1px solid #f0f2f7; font-size: 0.9rem; }
        .bc-results button:hover { background: var(--adm-primary-soft); }

        .bc-sheet.a4 { display: grid; grid-template-columns: repeat(3, 64mm); gap: 0 2mm; }
        .bc-sheet.roll { display: block; }
        .bc-label {
          box-sizing: border-box; display: flex; gap: 2mm; align-items: center; background: #fff; color: #000;
          font-family: Arial, sans-serif; overflow: hidden; page-break-inside: avoid; break-inside: avoid;
        }
        .bc-sheet.a4 .bc-label { width: 64mm; height: 34mm; padding: 2.5mm 3mm; border: 0.2mm dashed #ccc; }
        .bc-sheet.roll .bc-label { width: 50mm; height: 25mm; padding: 1.5mm 2mm; page-break-after: always; break-after: page; }
        .bc-qr { flex-shrink: 0; }
        .bc-sheet.a4 .bc-qr { width: 24mm; height: 24mm; }
        .bc-sheet.roll .bc-qr { width: 19mm; height: 19mm; }
        .bc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.6mm; }
        .bc-brand { font-size: 5.5pt; letter-spacing: 0.08em; font-weight: 700; color: #444; }
        .bc-name { font-size: 7.5pt; font-weight: 700; line-height: 1.15; max-height: 2.3em; overflow: hidden; }
        .bc-price { font-size: 10pt; font-weight: 800; }
        .bc-bar { width: 100%; height: 6mm; object-fit: fill; }
        .bc-code { font-size: 6.5pt; letter-spacing: 0.06em; }
        .bc-sheet.roll .bc-name { font-size: 6.5pt; }
        .bc-sheet.roll .bc-price { font-size: 9pt; }
        .bc-sheet.roll .bc-bar { height: 4.5mm; }
        @media print {
          .adm-print-only { display: block !important; }
          .bc-sheet.a4 .bc-label { border-color: #eee; }
        }
      `}</style>
    </>
  );
}

function Label({ p, img, showPrice }) {
  return (
    <div className="bc-label">
      <img className="bc-qr" src={img.qr} alt="" />
      <div className="bc-info">
        <div className="bc-brand">THE DIVINE CORNER</div>
        <div className="bc-name">{p.name}</div>
        {showPrice && <div className="bc-price">{inr(p.discountPrice || p.price)}</div>}
        <img className="bc-bar" src={img.bar} alt="" />
        <div className="bc-code">{p.barcode}</div>
      </div>
    </div>
  );
}

BarcodesPage.getLayout = adminLayout('Barcode Labels');

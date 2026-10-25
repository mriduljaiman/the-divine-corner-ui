// ============ pages/admin/barcodes.js — bulk barcode label PDF ============
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiSearch, FiTag, FiTrash2, FiFileText, FiX } from 'react-icons/fi';
import { adminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { inr, apiError, todayIso } from '../../utils/format';
import { SHEETS, countPages, buildLabelPdf } from '../../utils/labelPdf';

const MAX_LABELS = 3000;
const NO_CATEGORY = 'Other';

export default function BarcodesPage() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);           // { product, copies, include } from any number of categories
  const [loadingCat, setLoadingCat] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sheet, setSheet] = useState('a4');
  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState({});
  const previewCache = useRef(new Map());

  useEffect(() => {
    adminService.categories().then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  // Add products without dropping what is already in the list (dedupe by product id)
  const addProducts = (products, defaults) => {
    setRows(prev => {
      const seen = new Set(prev.map(r => r.product.id));
      const added = products.filter(p => !seen.has(p.id)).map(p => ({ product: p, ...defaults(p) }));
      return [...prev, ...added];
    });
  };

  const addCategory = async (categoryId) => {
    if (!categoryId) return;
    setLoadingCat(categoryId);
    try {
      const { data } = await adminService.searchProducts({ categoryId, size: 500 });
      const list = data.content || [];
      if (!list.length) showToast.warning('No products in this category');
      addProducts(list, p => ({ copies: Math.max(0, p.stockQuantity), include: p.stockQuantity > 0 }));
    } catch (err) {
      showToast.error(apiError(err));
    } finally {
      setLoadingCat('');
    }
  };

  // search for individual products
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      adminService.searchProducts({ search: query.trim(), size: 10 }).then(r => setResults(r.data.content || [])).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const addPicked = (p) => {
    addProducts([p], x => ({ copies: Math.max(1, x.stockQuantity), include: true }));
    setQuery('');
    setResults([]);
  };

  const setRow = (id, patch) => setRows(rs => rs.map(r => (r.product.id === id ? { ...r, ...patch } : r)));
  const catName = (p) => p.category?.name || NO_CATEGORY;

  // rows grouped by category, keeping the order categories were added
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = catName(r.product);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return [...map.entries()];
  }, [rows]);

  const setGroup = (name, include) => setRows(rs => rs.map(r => (catName(r.product) === name ? { ...r, include } : r)));
  const removeGroup = (name) => setRows(rs => rs.filter(r => catName(r.product) !== name));

  const sections = useMemo(
    () => rows.filter(r => r.include && r.copies > 0 && r.product.barcode).map(r => ({ product: r.product, copies: Number(r.copies) })),
    [rows],
  );
  const totalLabels = sections.reduce((s, x) => s + x.copies, 0);
  const pages = useMemo(() => countPages(sections, sheet, { showInfo }), [sections, sheet, showInfo]);
  const missingCode = rows.filter(r => r.include && !r.product.barcode).length;

  // small on-screen preview of the first few products
  useEffect(() => {
    let alive = true;
    (async () => {
      const { default: JsBarcode } = await import('jsbarcode');
      const out = {};
      for (const { product } of sections.slice(0, 4)) {
        if (!previewCache.current.has(product.barcode)) {
          const c = document.createElement('canvas');
          JsBarcode(c, product.barcode, { format: 'CODE128', displayValue: false, margin: 0, width: 2, height: 50 });
          previewCache.current.set(product.barcode, c.toDataURL('image/png'));
        }
        out[product.barcode] = previewCache.current.get(product.barcode);
      }
      if (alive) setPreview(out);
    })().catch(() => {});
    return () => { alive = false; };
  }, [sections]);

  const makePdf = async (action) => {
    if (!sections.length) { showToast.error('Tick at least one product with quantity'); return; }
    if (totalLabels > MAX_LABELS) { showToast.error(`Too many labels at once (max ${MAX_LABELS}). Split into smaller batches.`); return; }
    setBusy(action);
    try {
      const doc = await buildLabelPdf(sections, { sheet, showInfo });
      const name = `divine-corner-labels-${todayIso()}.pdf`;
      if (action === 'download') {
        doc.save(name);
        showToast.success(`PDF ready: ${totalLabels} labels on ${pages} page${pages === 1 ? '' : 's'}`);
      } else {
        const w = window.open(doc.output('bloburl'), '_blank');
        if (!w) doc.save(name); // popup blocked: fall back to download
      }
    } catch (err) {
      showToast.error(err.message || 'Could not create the PDF');
    } finally {
      setBusy('');
    }
  };

  const addedCats = new Set(groups.map(([n]) => n));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Barcode labels</h1>
          <p>Add products from one or more categories, tick them, set how many labels each needs, then download one PDF.</p>
        </div>
        <div className="adm-actions">
          <button className="adm-btn" onClick={() => makePdf('print')} disabled={!sections.length || !!busy}>
            <FiPrinter /> {busy === 'print' ? 'Preparing…' : 'Print'}
          </button>
          <button className="adm-btn primary lg" onClick={() => makePdf('download')} disabled={!sections.length || !!busy}>
            <FiDownload /> {busy === 'download' ? 'Creating PDF…' : `Download PDF${totalLabels ? ` · ${totalLabels} label${totalLabels === 1 ? '' : 's'}` : ''}`}
          </button>
        </div>
      </div>

      <div className="adm-grid adm-grid-main">
        <section className="adm-card">
          <div className="adm-grid adm-grid-2" style={{ alignItems: 'end' }}>
            <div className="adm-field">
              <label className="adm-label" htmlFor="bc-cat">Add a whole category</label>
              <select id="bc-cat" className="adm-select" value="" disabled={!!loadingCat}
                onChange={e => addCategory(e.target.value)} aria-label="Category">
                <option value="">{loadingCat ? 'Adding…' : 'Choose a category to add…'}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{addedCats.has(c.name) ? `✓ ${c.name} (added)` : c.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-field" style={{ position: 'relative' }}>
              <label className="adm-label" htmlFor="bc-search">…or add single products</label>
              <div className="adm-input-group">
                <FiSearch />
                <input id="bc-search" className="adm-input" placeholder="Name, SKU or barcode" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              {results.length > 0 && (
                <div className="bc-results">
                  {results.map(p => (
                    <button key={p.id} type="button" onClick={() => addPicked(p)}>
                      <span className="adm-truncate" style={{ flex: 1, textAlign: 'left' }}>{p.name}</span>
                      <span className="adm-card-sub">{catName(p)} · {p.stockQuantity} in stock</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="adm-empty"><FiTag /><h3>Add one or more categories, or search products</h3></div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
                <span className="adm-card-sub">{rows.length} products from {groups.length} categor{groups.length === 1 ? 'y' : 'ies'}</span>
                <button type="button" className="adm-btn sm ghost" onClick={() => setRows([])}><FiX /> Clear list</button>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th /><th>Product</th><th className="num">Stock</th><th className="num">Labels</th><th /></tr>
                  </thead>
                  {groups.map(([name, list]) => {
                    const all = list.every(r => r.include);
                    return (
                      <tbody key={name}>
                        <tr className="bc-group">
                          <td><input type="checkbox" checked={all} onChange={e => setGroup(name, e.target.checked)} aria-label={`Select all in ${name}`} /></td>
                          <td colSpan={3}><b>{name}</b> <span className="adm-card-sub">· {list.filter(r => r.include).length}/{list.length} ticked</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="adm-icon-btn" onClick={() => removeGroup(name)} aria-label={`Remove ${name}`}><FiTrash2 /></button>
                          </td>
                        </tr>
                        {list.map(({ product: p, copies, include }) => (
                          <tr key={p.id}>
                            <td><input type="checkbox" checked={include} onChange={e => setRow(p.id, { include: e.target.checked })} aria-label={`Include ${p.name}`} /></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div className="adm-card-sub">{p.barcode || <span className="text-danger">no barcode</span>} · {inr(p.discountPrice || p.price)}</div>
                            </td>
                            <td className="num">{p.stockQuantity}</td>
                            <td className="num">
                              <input className="adm-input" type="number" min="0" max="999" style={{ width: 84, height: 36, textAlign: 'right' }}
                                value={copies} onChange={e => setRow(p.id, { copies: Math.max(0, Math.min(999, parseInt(e.target.value || '0', 10))) })}
                                aria-label={`Labels for ${p.name}`} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="adm-icon-btn" onClick={() => setRows(rs => rs.filter(r => r.product.id !== p.id))} aria-label={`Remove ${p.name}`}><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    );
                  })}
                </table>
              </div>
            </>
          )}
        </section>

        <section className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 12 }}>PDF settings</h2>
          <div className="adm-field">
            <label className="adm-label">Paper</label>
            {Object.entries(SHEETS).map(([k, v]) => (
              <label key={k} className="bc-opt">
                <input type="radio" name="sheet" checked={sheet === k} onChange={() => setSheet(k)} /> {v.label}
              </label>
            ))}
          </div>
          <div className="adm-field">
            <label className="adm-label">On each label</label>
            <label className="bc-opt"><input type="checkbox" checked disabled /> Barcode + code</label>
            <label className="bc-opt"><input type="checkbox" checked={showInfo} onChange={e => setShowInfo(e.target.checked)} /> Product name &amp; price</label>
          </div>
          <hr className="adm-divider" />
          <div className="adm-row"><span className="text-muted">Products ticked</span><b>{sections.length}</b></div>
          <div className="adm-row"><span className="text-muted">Labels</span><b>{totalLabels}</b></div>
          <div className="adm-row"><span className="text-muted">PDF pages</span><b>{pages}</b></div>
          {missingCode > 0 && <div className="adm-error-text">{missingCode} product(s) have no barcode and will be skipped.</div>}

          {sections.length > 0 && (
            <>
              <div className="adm-label" style={{ marginTop: 14 }}><FiFileText style={{ verticalAlign: -2 }} /> Preview</div>
              <div className="bc-preview">
                {sections.slice(0, 2).map(({ product, copies }) => (
                  <div key={product.id}>
                    <div className="bc-prev-head">{product.name} · {copies} label{copies === 1 ? '' : 's'}</div>
                    <div className="bc-prev-grid">
                      {Array.from({ length: Math.min(4, copies) }).map((_, i) => (
                        <div key={i} className="bc-prev-label">
                          {showInfo && <div className="bc-prev-name">{product.name}</div>}
                          {preview[product.barcode] && <img src={preview[product.barcode]} alt="" />}
                          <div className="bc-prev-code">{product.barcode}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <style jsx global>{`
        .bc-results { position: absolute; left: 0; right: 0; top: 72px; z-index: 5; background: #fff; border: 1px solid var(--adm-border);
          border-radius: 12px; box-shadow: var(--adm-shadow-lg); overflow: hidden; }
        .bc-results button { width: 100%; display: flex; gap: 10px; padding: 10px 14px; border: none; background: #fff; cursor: pointer;
          border-bottom: 1px solid #f0f2f7; font-size: 0.9rem; }
        .bc-results button:hover { background: var(--adm-primary-soft); }
        .bc-group td { background: var(--adm-surface-2); }
        .bc-opt { display: flex; gap: 8px; align-items: flex-start; font-size: 0.88rem; padding: 4px 0; }
        .bc-preview { margin-top: 8px; padding: 12px; background: #fff; border: 1px dashed var(--adm-border); border-radius: 10px; }
        .bc-prev-head { font-size: 0.72rem; font-weight: 700; color: #555; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin: 4px 0 8px; }
        .bc-prev-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
        .bc-prev-label img { width: 100%; height: 26px; object-fit: fill; display: block; }
        .bc-prev-code { font-size: 0.58rem; letter-spacing: 0.05em; margin-top: 2px; }
        .bc-prev-name { font-size: 0.6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </>
  );
}

BarcodesPage.getLayout = adminLayout('Barcode Labels');

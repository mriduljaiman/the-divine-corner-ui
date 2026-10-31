// ============ pages/admin/products/index.js ============
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiTag, FiEye, FiEyeOff, FiPackage, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { adminLayout } from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import { productService } from '../../../services/productService';
import { showToast } from '../../../utils/toast';
import { inr, apiError } from '../../../utils/format';
import { cloudinaryPad } from '../../../utils/cloudinary';

const PAGE_SIZE = 20;

export default function AdminProducts() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [showCost, setShowCost] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => { adminService.categories().then(r => setCategories(r.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    adminService.searchProducts({ search, categoryId, page, size: PAGE_SIZE })
      .then(r => alive && setData(r.data))
      .catch(err => alive && showToast.error(apiError(err)));
    return () => { alive = false; };
  }, [search, categoryId, page, reload]);

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? It will be hidden from the store; past orders and bills stay intact.`)) return;
    try {
      await productService.deleteProduct(p.id);
      showToast.success('Product deleted');
      setReload(r => r + 1);
    } catch (err) {
      showToast.error(apiError(err, 'Failed to delete product'));
    }
  };

  const products = data?.content || [];

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Products</h1>
          <p>{data ? `${data.totalElements} active products` : 'Loading…'}</p>
        </div>
        <div className="adm-actions">
          <Link href="/admin/barcodes" className="adm-btn"><FiTag /> Labels</Link>
          <Link href="/admin/products/new" className="adm-btn primary"><FiPlus /> Add product</Link>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-input-group grow">
          <FiSearch />
          <input className="adm-input" placeholder="Search name, SKU or barcode" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="adm-select" style={{ width: 200 }} value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }} aria-label="Category">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="adm-btn" onClick={() => setShowCost(s => !s)} title="Show / hide buying prices">
          {showCost ? <FiEyeOff /> : <FiEye />} Cost
        </button>
      </div>

      {!data ? <div className="adm-skel" style={{ height: 320 }} /> : products.length === 0 ? (
        <div className="adm-card adm-empty">
          <FiPackage />
          <h3>No products found</h3>
          <Link href="/admin/products/new" className="adm-btn primary"><FiPlus /> Add product</Link>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Price</th>
                {showCost && <th className="num">Cost / margin</th>}
                <th className="num">Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const price = Number(p.discountPrice || p.price);
                const cost = p.purchasingPrice != null ? Number(p.purchasingPrice) : null;
                const low = p.stockQuantity <= (p.reorderPoint ?? 10);
                return (
                  <tr key={p.id} className="clickable" onClick={() => router.push(`/admin/products/${p.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.images?.[0]
                          ? <img src={cloudinaryPad(p.images[0], 96, 96)} alt="" className="adm-thumb" />
                          : <span className="adm-thumb" style={{ display: 'grid', placeItems: 'center', color: '#c7cbe0' }}><FiImage /></span>}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div className="adm-card-sub">{p.sku}{p.barcode ? ` · ${p.barcode}` : ''}</div>
                        </div>
                        {p.featured && <span className="adm-badge pending">Featured</span>}
                        {/* Google needs words to rank a product page – nudge the owner to write a few lines */}
                        {(p.description || '').trim().length < 40 && (
                          <span className="adm-badge danger" title="Add 1–2 lines: what it is, size/material, use. Helps Google search.">No description</span>
                        )}
                      </div>
                    </td>
                    <td>{p.category?.name || '—'}</td>
                    <td className="num">
                      <b>{inr(price)}</b>
                      {p.discountPrice && <div className="adm-card-sub"><s>{inr(p.price)}</s></div>}
                    </td>
                    {showCost && (
                      <td className="num">
                        {cost == null ? <span className="text-muted">not set</span> : (
                          <>
                            <div>{inr(cost)}</div>
                            <div className={`adm-card-sub ${price - cost < 0 ? 'text-danger' : 'text-success'}`}>{inr(price - cost)}</div>
                          </>
                        )}
                      </td>
                    )}
                    <td className="num">
                      <span className={`adm-badge ${p.stockQuantity === 0 ? 'danger' : low ? 'pending' : 'success'}`}>
                        {p.stockQuantity === 0 ? 'Out of stock' : `${p.stockQuantity} left`}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <Link href={`/admin/products/${p.id}`} className="adm-icon-btn" aria-label="Edit" title="Edit"><FiEdit2 /></Link>{' '}
                      <button className="adm-icon-btn" onClick={() => remove(p)} aria-label="Delete" title="Delete"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="adm-btn sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><FiChevronLeft /> Prev</button>
          <span className="adm-card-sub">Page {page + 1} of {data.totalPages}</span>
          <button className="adm-btn sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight /></button>
        </div>
      )}
    </>
  );
}

AdminProducts.getLayout = adminLayout('Products');

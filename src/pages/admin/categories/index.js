// ============ pages/admin/categories/index.js ============
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiLayers, FiTag } from 'react-icons/fi';
import api from '../../../services/api';
import { adminLayout } from '../../../components/admin/AdminLayout';
import { showToast } from '../../../utils/toast';
import { apiError } from '../../../utils/format';

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);

  const load = () => {
    // /categories/all includes inactive ones (the public list hides them)
    api.get('/categories/all?page=0&size=200')
      .then(r => setCategories(r.data.content || []))
      .catch(err => { setCategories([]); showToast.error(apiError(err)); });
  };
  useEffect(load, []);

  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      showToast.success('Category deleted');
      load();
    } catch (err) {
      showToast.error(apiError(err, 'Failed to delete category'));
    }
  };

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Categories</h1>
          <p>{categories ? `${categories.length} categories` : 'Loading…'}</p>
        </div>
        <Link href="/admin/categories/new" className="adm-btn primary"><FiPlus /> Add category</Link>
      </div>

      {!categories ? <div className="adm-skel" style={{ height: 200 }} /> : categories.length === 0 ? (
        <div className="adm-card adm-empty">
          <FiLayers />
          <h3>No categories yet</h3>
          <Link href="/admin/categories/new" className="adm-btn primary"><FiPlus /> Add category</Link>
        </div>
      ) : (
        <div className="adm-grid adm-grid-4">
          {categories.map(c => (
            <div key={c.id} className="adm-card cat-card">
              <div className="cat-img">
                {c.imageUrl ? <img src={c.imageUrl} alt="" /> : <span>{c.icon || <FiLayers />}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {c.skuPrefix && <span className="adm-badge neutral"><FiTag /> {c.skuPrefix}</span>}
                <span className={`adm-badge ${c.active ? 'success' : 'danger'}`}>{c.active ? 'Active' : 'Hidden'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Link href={`/admin/categories/${c.id}`} className="adm-btn sm" style={{ flex: 1 }}><FiEdit2 /> Edit</Link>
                <button className="adm-btn sm danger" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .cat-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .cat-img { width: 72px; height: 72px; border-radius: 18px; background: var(--adm-primary-soft); color: var(--adm-primary);
          display: grid; place-items: center; font-size: 1.8rem; overflow: hidden; }
        .cat-img img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </>
  );
}

AdminCategories.getLayout = adminLayout('Categories');

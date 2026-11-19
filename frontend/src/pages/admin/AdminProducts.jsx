import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { expiryState, formatDate, LOW_STOCK } from '../../lib/format';
import ProductForm from '../../components/ProductForm';
import { productToForm } from '../../lib/product';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0); // remount the form to reset it
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const [reload, setReload] = useState(0);
  const refresh = () => setReload((n) => n + 1);

  useEffect(() => {
    let active = true;
    api.get('/admin/products')
      .then((r) => { if (active) setProducts(r.data); })
      .catch((e) => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [reload]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (category ? p.category === category : true));

  const save = async (data) => {
    if (editing) await api.put(`/admin/products/${editing.id}`, data);
    else await api.post('/admin/products', data);
    setEditing(null);
    setFormKey((k) => k + 1);
    refresh();
  };

  const remove = async (p) => {
    if (!window.confirm(`حذف "${p.name}"؟`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const startEdit = (p) => {
    setEditing(p);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">إدارة المنتجات</h1>

      <ProductForm
        key={formKey}
        initial={editing ? productToForm(editing) : undefined}
        submitLabel={editing ? 'تحديث المنتج' : 'إضافة منتج'}
        onSubmit={save}
        onCancel={editing ? () => { setEditing(null); setFormKey((k) => k + 1); } : undefined}
      />

      <h2 className="mb-3 mt-10 text-2xl font-bold">المنتجات ({filtered.length})</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input w-60" placeholder="ابحث باسم المنتج" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">جميع الأصناف</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full min-w-[800px] text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>
              {['الصورة', 'الاسم', 'التكلفة', 'الربح %', 'البيع', 'الكمية', 'الصنف', 'الشركة', 'الانتهاء', ''].map((h, i) => (
                <th key={i} className="p-3 text-start font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const exp = expiryState(p.expiryDate);
              return (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="p-3">{p.image && <img src={p.image} alt="" className="h-12 w-12 rounded object-cover" />}</td>
                  <td className="p-3 font-medium"><Link to={`/product/${p.id}`} className="hover:text-brand-600">{p.name}</Link></td>
                  <td className="p-3">{p.costPrice}</td>
                  <td className="p-3">{p.profitMargin}</td>
                  <td className="p-3">{p.sellingPrice}</td>
                  <td className={`p-3 ${p.stock < LOW_STOCK ? 'font-bold text-red-600' : ''}`}>{p.stock}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">{p.company}</td>
                  <td className={`p-3 ${exp === 'expired' ? 'font-bold text-red-600' : exp === 'soon' ? 'font-bold text-amber-600' : ''}`}>
                    {formatDate(p.expiryDate)}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    <button className="btn-warn me-2 px-3 py-1.5 text-sm" onClick={() => startEdit(p)}>تحديث</button>
                    <button className="btn-danger px-3 py-1.5 text-sm" onClick={() => remove(p)}>حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-stone-500">لا توجد منتجات. أضف أول منتج من النموذج أعلاه.</p>}
      </div>
    </div>
  );
}

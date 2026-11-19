import { useState } from 'react';
import Pagination from '../../components/Pagination';
import ProductPicker from '../../components/ProductPicker';
import { api, errorMessage } from '../../lib/api';
import { formatDateTime, formatPrice } from '../../lib/format';
import { useApi } from '../../lib/hooks';

const TYPES = {
  sale: ['بيع (خروج)', 'text-brand-600'],
  purchase: ['شراء (دخول)', 'text-amber-600'],
  waste: ['تلف / خسارة', 'text-red-600'],
  adjustment: ['تعديل', 'text-stone-500'],
};
const PAGE_SIZE = 15;

export default function Stock() {
  const [product, setProduct] = useState(null);
  const [type, setType] = useState('sale');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState({ ok: true, text: '' });
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const history = useApi('/admin/movements', { type: filter || undefined, page, pageSize: PAGE_SIZE });

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ ok: true, text: '' });
    try {
      const r = await api.post('/admin/movements', {
        productId: product.id,
        type,
        quantity: Number(qty),
        unitPrice: price === '' ? null : Number(price),
        note: note || null,
      });
      setMsg({ ok: true, text: `✅ تم التسجيل. المخزون الحالي: ${r.data.stock}` });
      setProduct(null); setQty(1); setPrice(''); setNote('');
      setPage(1);
      history.reload();
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">حركة المخزون</h1>

      <form onSubmit={submit} className="card mx-auto flex max-w-xl flex-col gap-3 p-5">
        <ProductPicker value={product} onChange={setProduct} />
        <div className="grid grid-cols-3 gap-2">
          {['sale', 'purchase', 'waste'].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`rounded-lg border px-2 py-2 text-sm font-bold ${type === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 hover:bg-stone-100'}`}>
              {TYPES[t][0]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="الكمية" required />
          <input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="سعر الوحدة (اختياري)" />
        </div>
        <p className="text-xs text-stone-500">اترك السعر فارغاً: البيع بسعر البيع الحالي (مع العرض)، والشراء والتلف بسعر التكلفة.</p>
        <input className="input" placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        {msg.text && <p role="alert" className={`rounded-lg p-3 text-sm ${msg.ok ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
        <button className="btn-primary" disabled={!product}>تسجيل الحركة</button>
      </form>

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">السجل</h2>
        <select className="input w-48" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحركات</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>{['التاريخ', 'المنتج', 'النوع', 'الكمية', 'سعر الوحدة', 'المجموع', 'ملاحظة'].map((h) => <th key={h} className="p-3 text-start font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {history.data?.items.map((m) => (
              <tr key={m.id} className="border-t border-stone-200 text-sm">
                <td className="p-3">{formatDateTime(m.createdAt)}</td>
                <td className="p-3 font-medium">{m.productName}</td>
                <td className={`p-3 font-bold ${TYPES[m.type]?.[1]}`}>{TYPES[m.type]?.[0]}</td>
                <td className="p-3">{m.quantity}</td>
                <td className="p-3">{m.type === 'adjustment' ? '-' : formatPrice(m.unitPrice)}</td>
                <td className="p-3">{m.type === 'adjustment' ? '-' : formatPrice(m.total)}</td>
                <td className="p-3 text-stone-500">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.data?.items.length === 0 && <p className="p-6 text-center text-stone-500">لا توجد حركات.</p>}
      </div>
      {history.data && <Pagination page={page} total={history.data.total} pageSize={PAGE_SIZE} onChange={setPage} />}
    </div>
  );
}
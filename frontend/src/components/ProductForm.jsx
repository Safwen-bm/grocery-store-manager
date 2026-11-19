import { useState } from 'react';
import { errorMessage } from '../lib/api';
import { fileToDataUrl } from '../lib/image';

const EMPTY = {
  name: '', costPrice: '', profitMargin: '20', stock: '',
  category: '', company: '', expiryDate: '', image: null,
};

// Used by the admin page (create/edit) and by the product details page (edit).
export default function ProductForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selling = form.costPrice !== ''
    ? (parseFloat(form.costPrice) * (1 + (parseFloat(form.profitMargin) || 0) / 100)).toFixed(2)
    : '';

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setForm((f) => ({ ...f, image: null }));
      const image = await fileToDataUrl(file);
      setForm((f) => ({ ...f, image }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        costPrice: parseFloat(form.costPrice),
        profitMargin: parseFloat(form.profitMargin),
        stock: parseInt(form.stock, 10),
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-3 rounded-xl bg-white p-5 shadow">
      <input className="input" name="name" placeholder="اسم المنتج" value={form.name} onChange={set} required maxLength={120} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="number" name="costPrice" placeholder="سعر التكلفة" value={form.costPrice} onChange={set} required step="0.01" min="0" />
        <input className="input" type="number" name="profitMargin" placeholder="نسبة الربح (%)" value={form.profitMargin} onChange={set} required step="0.1" min="0" />
      </div>
      <input className="input" type="text" placeholder="سعر البيع (محسوب تلقائيًا)" value={selling} readOnly />
      <input className="input" type="number" name="stock" placeholder="الكمية" value={form.stock} onChange={set} required min="0" />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" name="category" placeholder="الصنف" value={form.category} onChange={set} required maxLength={60} />
        <input className="input" name="company" placeholder="اسم الشركة" value={form.company} onChange={set} required maxLength={60} />
      </div>
      <label className="text-sm text-stone-500">
        تاريخ الانتهاء
        <input className="input mt-1" type="date" name="expiryDate" value={form.expiryDate} onChange={set} required />
      </label>
      <input className="input" type="file" accept="image/*" onChange={handleImage} />
      {form.image && <img src={form.image} alt="معاينة" className="h-24 w-24 rounded-lg object-cover" />}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy}>{busy ? '...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  );
}

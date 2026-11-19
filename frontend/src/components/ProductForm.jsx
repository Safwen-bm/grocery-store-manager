import { useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { compressImage, thumb } from '../lib/image';
import { EMPTY_FORM } from '../lib/product';
import BarcodeScanner from './BarcodeScanner';

export default function ProductForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const selling = form.costPrice !== ''
    ? (parseFloat(form.costPrice) * (1 + (parseFloat(form.profitMargin) || 0) / 100)).toFixed(2)
    : '';

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append('file', blob, 'product.jpg');
      const r = await api.post('/admin/uploads', fd);
      setForm((f) => ({ ...f, imageUrl: r.data.url, imagePublicId: r.data.publicId }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        name: form.name,
        costPrice: parseFloat(form.costPrice),
        profitMargin: parseFloat(form.profitMargin),
        stock: parseInt(form.stock, 10),
        category: form.category,
        company: form.company,
        expiryDate: form.expiryDate,
        barcode: form.barcode.trim() || null,
        imageUrl: form.imageUrl || null,
        imagePublicId: form.imagePublicId || null,
        promoPercent: parseFloat(form.promoPercent) || 0,
        promoEndsAt: form.promoEndsAt || null,
        isFeatured: form.isFeatured,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto flex max-w-xl flex-col gap-3 p-5">
      <input className="input" name="name" placeholder="اسم المنتج" value={form.name} onChange={set} required maxLength={120} />

      <div className="flex gap-2">
        <input className="input" name="barcode" placeholder="الباركود (اختياري)" value={form.barcode} onChange={set} inputMode="numeric" maxLength={40} />
        <button type="button" className="btn-ghost shrink-0" onClick={() => setScanning(!scanning)}>📷 مسح</button>
      </div>
      {scanning && (
        <BarcodeScanner onDetected={(code) => { setForm((f) => ({ ...f, barcode: code })); setScanning(false); }} />
      )}

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

      <fieldset className="rounded-lg border border-dashed border-accent-500 p-3">
        <legend className="px-2 text-sm font-bold text-accent-600">🏷️ عرض / تخفيض</legend>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" name="promoPercent" placeholder="نسبة التخفيض %" value={form.promoPercent} onChange={set} min="0" max="90" step="1" />
          <input className="input" type="date" name="promoEndsAt" value={form.promoEndsAt} onChange={set} title="ينتهي العرض في" />
        </div>
        <label className="mt-3 flex items-center gap-2">
          <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={set} className="h-4 w-4 accent-brand-600" />
          ⭐ منتج مميز (يظهر في الواجهة)
        </label>
      </fieldset>

      <input className="input" type="file" accept="image/*" onChange={handleImage} disabled={uploading} />
      {uploading && <p className="text-sm text-stone-500">جاري رفع الصورة...</p>}
      {form.imageUrl && <img src={thumb(form.imageUrl, 200)} alt="معاينة" className="h-24 w-24 rounded-lg object-cover" />}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy || uploading}>{busy ? '...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  );
}
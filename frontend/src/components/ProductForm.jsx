import { useState } from 'react';
import { errorMessage } from '../lib/api';
import { DEFAULT_CATEGORIES } from '../lib/category';
import { useApi } from '../lib/hooks';
import { EMPTY_FORM } from '../lib/product';
import BarcodeScanner from './BarcodeScanner';
import Field from './Field';
import ImageUpload from './ImageUpload';

const NEW_CATEGORY = '__new__';
const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const toSelling = (cost, margin) => money(cost * (1 + margin / 100));
const toCost = (selling, margin) => money(selling / (1 + margin / 100));

function Section({ title, children }) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl border border-stone-200 p-4">
      <legend className="px-2 font-bold text-brand-700">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function ProductForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [edited, setEdited] = useState('cost'); // which price the user typed last
  const [newCategory, setNewCategory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const cats = useApi('/products/categories');

  const categories = [...new Set([
    ...DEFAULT_CATEGORIES,
    ...(cats.data ?? []),
    ...(form.category && !newCategory ? [form.category] : []),
  ])];

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Buying price <-> selling price: type one, the other is calculated with the margin.
  const onCost = (e) => {
    const v = e.target.value;
    setEdited('cost');
    setForm((f) => ({ ...f, costPrice: v, sellingPrice: v === '' ? '' : toSelling(parseFloat(v), parseFloat(f.profitMargin) || 0) }));
  };
  const onSelling = (e) => {
    const v = e.target.value;
    setEdited('selling');
    setForm((f) => ({ ...f, sellingPrice: v, costPrice: v === '' ? '' : toCost(parseFloat(v), parseFloat(f.profitMargin) || 0) }));
  };
  const onMargin = (e) => {
    const v = e.target.value;
    const m = parseFloat(v) || 0;
    setForm((f) => {
      if (edited === 'selling' && f.sellingPrice !== '') return { ...f, profitMargin: v, costPrice: toCost(parseFloat(f.sellingPrice), m) };
      if (f.costPrice !== '') return { ...f, profitMargin: v, sellingPrice: toSelling(parseFloat(f.costPrice), m) };
      return { ...f, profitMargin: v };
    });
  };

  const onCategory = (e) => {
    const v = e.target.value;
    setNewCategory(v === NEW_CATEGORY);
    setForm((f) => ({ ...f, category: v === NEW_CATEGORY ? '' : v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.costPrice === '' && form.sellingPrice === '') {
      setError('أدخل سعر الشراء أو سعر البيع');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name: form.name,
        costPrice: parseFloat(form.costPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        profitMargin: parseFloat(form.profitMargin) || 0,
        stock: form.stock === '' ? 0 : parseInt(form.stock, 10),
        category: form.category,
        company: form.company,
        expiryDate: form.expiryDate || null,
        barcode: form.barcode.trim() || null,
        imageUrl: form.imageUrl, // '' = no image / remove image
        imagePublicId: form.imagePublicId,
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
    <form onSubmit={submit} className="card @container mx-auto flex w-full max-w-5xl flex-col gap-4 p-5">
      <div className="grid gap-4 @3xl:grid-cols-2">
        <Section title="1. المعلومات الأساسية">
          <Field label="اسم المنتج" required>
            <input className="input" name="name" placeholder="مثال: حليب سيدي سالم 1 لتر" value={form.name} onChange={set} required maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الصنف (القسم)" required>
              <select className="input" value={newCategory ? NEW_CATEGORY : form.category} onChange={onCategory} required>
                <option value="" disabled>اختر الصنف...</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
                <option value={NEW_CATEGORY}>➕ صنف جديد...</option>
              </select>
              {newCategory && (
                <input className="input mt-2" name="category" placeholder="اسم الصنف الجديد" value={form.category} onChange={set} required maxLength={60} autoFocus />
              )}
            </Field>
            <Field label="الشركة (اختياري)">
              <input className="input" name="company" placeholder="مثال: دليس" value={form.company} onChange={set} maxLength={60} />
            </Field>
          </div>
          <Field label="الباركود (اختياري)" plain hint="الرقم المطبوع تحت الخطوط على العلبة">
            <div className="flex gap-2">
              <input className="input" name="barcode" placeholder="6191234567890" value={form.barcode} onChange={set} inputMode="numeric" maxLength={40} dir="ltr" />
              <button type="button" className="btn-ghost shrink-0" onClick={() => setScanning(!scanning)}>📷 مسح</button>
            </div>
          </Field>
          {scanning && (
            <BarcodeScanner onDetected={(code) => { setForm((f) => ({ ...f, barcode: code })); setScanning(false); }} />
          )}
        </Section>

        <Section title="2. الأسعار والمخزون">
          <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700">
            اكتب سعراً واحداً فقط: سعر الشراء فيُحسب سعر البيع، أو سعر البيع فيُحسب سعر الشراء.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="سعر الشراء" hint="ما دفعته للمورد">
              <input className="input" type="number" placeholder="1.20" value={form.costPrice} onChange={onCost} step="0.01" min="0" />
            </Field>
            <Field label="سعر البيع" hint="ما يدفعه الزبون">
              <input className="input" type="number" placeholder="1.44" value={form.sellingPrice} onChange={onSelling} step="0.01" min="0" />
            </Field>
          </div>
          <Field label="نسبة الربح %" hint="الافتراضي 20. غيّرها فقط إذا أردت ربحاً مختلفاً.">
            <input className="input" type="number" name="profitMargin" value={form.profitMargin} onChange={onMargin} step="0.1" min="0" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الكمية (اختياري)" hint="اتركه فارغاً = 0">
              <input className="input" type="number" name="stock" placeholder="24" value={form.stock} onChange={set} min="0" />
            </Field>
            <Field label="تاريخ الانتهاء (اختياري)">
              <input className="input" type="date" name="expiryDate" value={form.expiryDate} onChange={set} />
            </Field>
          </div>
        </Section>

        <Section title="3. تخفيض وتمييز (اختياري)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="نسبة التخفيض %" hint="فارغ = لا يوجد عرض">
              <input className="input" type="number" name="promoPercent" placeholder="10" value={form.promoPercent} onChange={set} min="0" max="90" step="1" />
            </Field>
            <Field label="ينتهي العرض في" hint="فارغ = بدون نهاية">
              <input className="input" type="date" name="promoEndsAt" value={form.promoEndsAt} onChange={set} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={set} className="h-4 w-4 accent-brand-600" />
            ⭐ منتج مميز (يظهر في أعلى الصفحة الرئيسية)
          </label>
        </Section>

        <Section title="4. صورة المنتج (اختياري)">
          <ImageUpload
            url={form.imageUrl}
            onBusy={setUploading}
            onChange={({ url, publicId }) => setForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
          />
        </Section>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mx-auto flex w-full max-w-md gap-2">
        <button className="btn-primary flex-1" disabled={busy || uploading}>{busy ? '...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import MovementForm from '../../components/MovementForm';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatPrice, toInputDate } from '../../lib/format';
import { useApi } from '../../lib/hooks';

const CATEGORIES = ['إيجار', 'كهرباء وماء', 'أجور', 'نقل', 'صيانة', 'مستلزمات (أكياس، تنظيف...)', 'ضرائب', 'أخرى'];

function periodRange(key) {
  const today = new Date();
  const from = new Date(today);
  if (key === 'week') from.setDate(today.getDate() - 6);
  if (key === 'month') from.setDate(1);
  if (key === '30') from.setDate(today.getDate() - 29);
  return { dateFrom: toInputDate(from), dateTo: toInputDate(today) };
}

function Card({ label, value, tone, hint }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export default function Finance() {
  const [period, setPeriod] = useState('month');
  const [tab, setTab] = useState('purchase');
  const range = periodRange(period);
  const summary = useApi('/admin/finance/summary', range);
  const expenses = useApi('/admin/expenses', range);
  const purchases = useApi('/admin/movements', { type: 'purchase', pageSize: 200, ...range });
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], amount: '', date: toInputDate(), note: '' });
  const [error, setError] = useState('');

  const s = summary.data;
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const maxDay = Math.max(1, ...(s?.daily.map((d) => d.revenue) ?? [0]));
  const refresh = () => { summary.reload(); expenses.reload(); purchases.reload(); };

  const addExpense = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/expenses', { ...form, amount: Number(form.amount), note: form.note || null });
      setForm((f) => ({ ...f, title: '', amount: '', note: '' }));
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const removeExpense = async (id) => {
    if (!window.confirm('حذف هذا المصروف؟')) return;
    await api.delete(`/admin/expenses/${id}`);
    refresh();
  };

  // Purchases + expenses in one list, newest first
  const rows = [
    ...(purchases.data?.items ?? []).map((m) => ({
      key: `p${m.id}`, kind: 'purchase', date: m.createdAt, amount: m.total,
      title: `${m.productName} × ${m.quantity}`,
      detail: [m.supplier && `المورد: ${m.supplier}`, m.note].filter(Boolean).join(' · '),
    })),
    ...(expenses.data ?? []).map((x) => ({
      key: `e${x.id}`, kind: 'expense', id: x.id, date: x.date, amount: x.amount,
      title: x.title, detail: [x.category, x.note].filter(Boolean).join(' · '),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">المالية</h1>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {[['today', 'اليوم'], ['week', '7 أيام'], ['month', 'هذا الشهر'], ['30', '30 يوماً']].map(([k, label]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`rounded-full border px-4 py-1.5 font-medium ${period === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 hover:bg-stone-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {summary.error && <p role="alert" className="text-center text-red-600">{summary.error}</p>}
      {s && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card label="💰 ما كسبته (المبيعات)" value={formatPrice(s.revenue)} tone="text-brand-600" hint="مجموع ما بِعته" />
            <Card label="💸 ما صرفته" value={formatPrice(s.moneyOut)} tone="text-red-600" hint="مشتريات البضاعة + المصاريف" />
            <Card label="📈 الربح الصافي" value={formatPrice(s.profit)} tone={s.profit >= 0 ? 'text-brand-600' : 'text-red-600'}
              hint="المبيعات − تكلفة ما بِعته − التلف − المصاريف" />
          </div>

          <div className="card mt-4 grid gap-2 p-4 text-sm md:grid-cols-4">
            <p>تكلفة ما بِعته: <b>{formatPrice(s.costOfGoods)}</b></p>
            <p>مشتريات البضاعة: <b>{formatPrice(s.stockPurchases)}</b></p>
            <p>مصاريف أخرى: <b>{formatPrice(s.expenses)}</b></p>
            <p>خسائر التلف: <b>{formatPrice(s.waste)}</b></p>
          </div>

          <section className="card mt-4 p-4">
            <h2 className="mb-3 font-bold">المبيعات اليومية</h2>
            {s.daily.length === 0 ? (
              <p className="text-sm text-stone-500">لا توجد مبيعات في هذه الفترة.</p>
            ) : (
              <div className="flex h-40 items-end gap-1.5 overflow-x-auto">
                {s.daily.map((d) => (
                  <div key={d.date} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${formatPrice(d.revenue)}`}>
                    <span className="text-[10px] text-stone-500">{Math.round(d.revenue)}</span>
                    <div className="w-full rounded-t bg-brand-500" style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}px` }} />
                    <span className="text-[10px] text-stone-500">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <h2 className="mb-3 mt-10 text-2xl font-bold">المصاريف والمشتريات</h2>
      <div className="mx-auto mb-4 grid max-w-xl grid-cols-2 gap-2">
        {[['purchase', 'cart', 'شراء بضاعة'], ['expense', 'receipt', 'مصروف عادي']].map(([k, icon, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-bold ${tab === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 hover:bg-stone-100'}`}>
            <Icon name={icon} /> {label}
          </button>
        ))}
      </div>

      {tab === 'purchase' ? (
        <>
          <MovementForm types={['purchase']} submitLabel="تسجيل الشراء" onDone={refresh} />
          <p className="mt-2 text-center text-sm text-stone-500">
            الشراء يزيد المخزون تلقائياً ويُحسب كمال مصروف. منتج جديد غير موجود؟{' '}
            <Link to="/admin/products" className="font-bold text-brand-600">أضفه من صفحة المنتجات</Link>
          </p>
        </>
      ) : (
        <form onSubmit={addExpense} className="card mx-auto grid max-w-xl gap-3 p-5 md:grid-cols-2">
          <Field label="الوصف" required className="md:col-span-2" hint="مثال: فاتورة الكهرباء، أجرة العامل، أكياس بلاستيك">
            <input className="input" name="title" value={form.title} onChange={set} required maxLength={100} />
          </Field>
          <Field label="النوع" required>
            <select className="input" name="category" value={form.category} onChange={set}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="المبلغ (د.ت)" required>
            <input className="input" type="number" name="amount" value={form.amount} onChange={set} required min="0.01" step="0.01" />
          </Field>
          <Field label="التاريخ" required className="md:col-span-2">
            <input className="input" type="date" name="date" value={form.date} onChange={set} required />
          </Field>
          <Field label="ملاحظة (اختياري)" className="md:col-span-2">
            <input className="input" name="note" value={form.note} onChange={set} maxLength={200} />
          </Field>
          {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <button className="btn-primary md:col-span-2">إضافة المصروف</button>
        </form>
      )}

      <div className="mb-2 mt-8 flex items-center justify-between">
        <h3 className="text-xl font-bold">سجل هذه الفترة</h3>
        <p className="text-sm text-stone-500">المجموع: <b className="text-red-600">{formatPrice(total)}</b></p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>{['التاريخ', 'النوع', 'التفاصيل', 'المبلغ', ''].map((h, i) => <th key={i} className="p-3 text-start font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-stone-200 text-sm">
                <td className="p-3">{formatDate(r.date)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.kind === 'purchase' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {r.kind === 'purchase' ? 'شراء بضاعة' : 'مصروف'}
                  </span>
                </td>
                <td className="p-3 font-medium">{r.title}<div className="text-xs text-stone-500">{r.detail}</div></td>
                <td className="p-3 font-bold text-red-600">{formatPrice(r.amount)}</td>
                <td className="p-3">{r.kind === 'expense' && <button className="text-red-600" onClick={() => removeExpense(r.id)}>حذف</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-stone-500">لا توجد مشتريات أو مصاريف في هذه الفترة.</p>}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatPrice, toInputDate } from '../../lib/format';
import { useApi } from '../../lib/hooks';

const CATEGORIES = ['إيجار', 'كهرباء وماء', 'أجور', 'نقل', 'صيانة', 'ضرائب', 'أخرى'];

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
  const range = periodRange(period);
  const summary = useApi('/admin/finance/summary', range);
  const expenses = useApi('/admin/expenses', range);
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], amount: '', date: toInputDate(), note: '' });
  const [error, setError] = useState('');

  const s = summary.data;
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const maxDay = Math.max(1, ...(s?.daily.map((d) => d.revenue) ?? [0]));

  const addExpense = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/expenses', { ...form, amount: Number(form.amount), note: form.note || null });
      setForm((f) => ({ ...f, title: '', amount: '', note: '' }));
      summary.reload();
      expenses.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const removeExpense = async (id) => {
    if (!window.confirm('حذف هذا المصروف؟')) return;
    await api.delete(`/admin/expenses/${id}`);
    summary.reload();
    expenses.reload();
  };

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
            <Card label="💸 ما صرفته" value={formatPrice(s.moneyOut)} tone="text-red-600" hint="شراء بضاعة + مصاريف" />
            <Card label="📈 الربح الصافي" value={formatPrice(s.profit)} tone={s.profit >= 0 ? 'text-brand-600' : 'text-red-600'}
              hint="المبيعات − تكلفة ما بِعته − التلف − المصاريف" />
          </div>

          <div className="card mt-4 grid gap-2 p-4 text-sm md:grid-cols-4">
            <p>تكلفة ما بِعته: <b>{formatPrice(s.costOfGoods)}</b></p>
            <p>شراء بضاعة: <b>{formatPrice(s.stockPurchases)}</b></p>
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

      <h2 className="mb-3 mt-10 text-2xl font-bold">المصاريف</h2>
      <form onSubmit={addExpense} className="card grid gap-3 p-5 md:grid-cols-2">
        <input className="input" name="title" placeholder="الوصف (مثال: فاتورة الكهرباء)" value={form.title} onChange={set} required maxLength={100} />
        <select className="input" name="category" value={form.category} onChange={set}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input" type="number" name="amount" placeholder="المبلغ (د.ت)" value={form.amount} onChange={set} required min="0.01" step="0.01" />
        <input className="input" type="date" name="date" value={form.date} onChange={set} required />
        <input className="input md:col-span-2" name="note" placeholder="ملاحظة (اختياري)" value={form.note} onChange={set} maxLength={200} />
        {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
        <button className="btn-primary md:col-span-2">إضافة مصروف</button>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>{['التاريخ', 'الوصف', 'النوع', 'المبلغ', ''].map((h, i) => <th key={i} className="p-3 text-start font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {expenses.data?.map((x) => (
              <tr key={x.id} className="border-t border-stone-200 text-sm">
                <td className="p-3">{formatDate(x.date)}</td>
                <td className="p-3 font-medium">{x.title}<div className="text-xs text-stone-500">{x.note}</div></td>
                <td className="p-3">{x.category}</td>
                <td className="p-3 font-bold text-red-600">{formatPrice(x.amount)}</td>
                <td className="p-3"><button className="text-red-600" onClick={() => removeExpense(x.id)}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.data?.length === 0 && <p className="p-6 text-center text-stone-500">لا توجد مصاريف في هذه الفترة.</p>}
      </div>
    </div>
  );
}
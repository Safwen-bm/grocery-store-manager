import { useState } from 'react';
import MovementForm from '../../components/MovementForm';
import Pagination from '../../components/Pagination';
import { formatDateTime, formatPrice } from '../../lib/format';
import { useApi } from '../../lib/hooks';

const TYPES = {
  sale: ['بيع', 'text-brand-600'],
  purchase: ['شراء', 'text-amber-600'],
  waste: ['تلف', 'text-red-600'],
  adjustment: ['تعديل', 'text-stone-500'],
};
const PAGE_SIZE = 15;

export default function Stock() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const history = useApi('/admin/movements', { type: filter || undefined, page, pageSize: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-center text-3xl font-bold">حركة المخزون</h1>
      <p className="mb-6 text-center text-stone-500">سجّل كل بيع أو شراء أو تلف ليبقى المخزون والأرباح دقيقة</p>

      <MovementForm onDone={() => { setPage(1); history.reload(); }} />

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">السجل</h2>
        <select className="input w-48" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحركات</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>{['التاريخ', 'المنتج', 'النوع', 'الكمية', 'سعر القطعة', 'المجموع', 'تفاصيل'].map((h) => <th key={h} className="p-3 text-start font-bold">{h}</th>)}</tr>
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
                <td className="p-3 text-stone-500">{[m.supplier && `المورد: ${m.supplier}`, m.note].filter(Boolean).join(' · ')}</td>
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
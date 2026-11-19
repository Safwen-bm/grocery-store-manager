import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, formatPrice, daysUntil } from '../../lib/format';
import { useApi } from '../../lib/hooks';

const TYPE = {
  sale: ['بيع', 'text-brand-600'],
  purchase: ['شراء', 'text-amber-600'],
  waste: ['تلف', 'text-red-600'],
  adjustment: ['تعديل', 'text-stone-500'],
};

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function List({ title, items, empty, right, tone }) {
  return (
    <section className="card p-4">
      <h2 className={`mb-3 text-lg font-bold ${tone}`}>{title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">{empty}</p>
      ) : (
        <ul className="max-h-72 divide-y divide-stone-200 overflow-y-auto">
          {items.map((p) => (
            <li key={p.id}>
              <Link to={`/product/${p.id}`} className="flex justify-between gap-3 py-2 hover:text-brand-600">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-sm text-stone-500">{right(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { data: d, error } = useApi('/admin/dashboard');
  if (error) return <p role="alert" className="p-10 text-center text-red-600">{error}</p>;
  if (!d) return <p className="p-10 text-center text-stone-500">جاري التحميل...</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">لوحة التحكم</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="عدد المنتجات" value={d.totalProducts} />
        <Stat label="مبيعات اليوم" value={formatPrice(d.todaySales)} tone="text-brand-600" />
        <Stat label="قيمة المخزون (تكلفة)" value={formatPrice(d.stockValue)} />
        <Stat label="قيمة المخزون (بيع)" value={formatPrice(d.retailValue)} />
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-3">
        <Link to="/admin/stock" className="btn-primary">📦 تسجيل حركة مخزون</Link>
        <Link to="/admin/products" className="btn-accent">➕ إضافة منتج</Link>
        <Link to="/scan" className="btn-ghost">📷 مسح باركود</Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <List title="⛔ منتهية الصلاحية (لا تزال في المخزون)" tone="text-red-600" items={d.expired}
          empty="لا توجد منتجات منتهية ✅" right={(p) => `${formatDate(p.expiryDate)} · ${p.stock}`} />
        <List title="⏳ تنتهي خلال 30 يوماً" tone="text-amber-600" items={d.expiringSoon}
          empty="لا شيء قريب الانتهاء ✅" right={(p) => `${daysUntil(p.expiryDate)} يوم · ${p.stock}`} />
        <List title="🚫 نفدت الكمية" tone="text-red-600" items={d.outOfStock}
          empty="كل المنتجات متوفرة ✅" right={(p) => p.category} />
        <List title="⚠️ كمية منخفضة" tone="text-amber-600" items={d.lowStock}
          empty="لا توجد كميات منخفضة ✅" right={(p) => `${p.stock} قطعة`} />
      </div>

      <section className="card mt-5 p-4">
        <h2 className="mb-3 text-lg font-bold">آخر الحركات</h2>
        {d.recentMovements.length === 0 ? (
          <p className="text-sm text-stone-500">لا توجد حركات بعد.</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {d.recentMovements.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span><b className={TYPE[m.type]?.[1]}>{TYPE[m.type]?.[0]}</b> · {m.productName} × {m.quantity}</span>
                <span className="text-stone-500">{formatPrice(m.total)} · {formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, errorMessage } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const productsRef = useRef(null);

  useEffect(() => {
    api.get('/products')
      .then((r) => setProducts(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (category ? p.category === category : true));

  return (
    <div>
      <section className="relative -mt-[70px] h-screen overflow-hidden">
        <img src="/home.png" alt="" className="h-full w-full object-cover brightness-70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold drop-shadow-lg md:text-6xl">مرحبًا بكم في سوبريت فايزة</h1>
          <p className="mt-3 text-xl drop-shadow md:text-2xl">تسوق أفضل المنتجات بأسعار تنافسية!</p>
          <button
            onClick={() => productsRef.current.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary mt-6 rounded-full px-8 py-3 text-lg"
          >
            تسوق الآن
          </button>
        </div>
      </section>

      <section className="mx-4 my-6 rounded-2xl bg-linear-to-br from-stone-100 to-stone-200 px-5 py-10 text-center shadow">
        <h2 className="text-3xl font-bold">اكتشف تشكيلتنا الواسعة</h2>
        <p className="mt-2 text-lg text-stone-600">منتجات عالية الجودة تناسب جميع احتياجاتك اليومية</p>
      </section>

      <section ref={productsRef} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
        <h2 className="mb-8 border-y-4 border-brand-500 py-3 text-center text-4xl font-extrabold">المنتجات</h2>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <div className="relative w-64">
            <input className="input pe-10" placeholder="ابحث باسم المنتج" value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">🔍</span>
          </div>
          <select className="input w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">جميع الأصناف</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading && <p className="text-center text-stone-500">جاري التحميل...</p>}
        {error && <p role="alert" className="text-center text-red-600">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-stone-500">لا توجد منتجات مطابقة.</p>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}

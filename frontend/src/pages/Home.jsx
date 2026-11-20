import { useRef, useState } from "react";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { categoryStyle } from "../lib/category";
import { useApi, useDebounce } from "../lib/hooks";

const PAGE_SIZE = 12;

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [promoOnly, setPromoOnly] = useState(false);
  const [page, setPage] = useState(1);
  const productsRef = useRef(null);
  const q = useDebounce(search);

  const cats = useApi("/products/categories");
  const featured = useApi("/products", { featured: true, pageSize: 8 });
  const list = useApi("/products", {
    q,
    category: category || undefined,
    sort,
    promo: promoOnly || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const filtering = q || category || promoOnly;
  const change = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <section className="relative -mt-17.5 w-full overflow-hidden">
        <img
          src="/home.png"
          alt=""
          className="block h-auto min-h-130 max-h-225 w-full object-cover object-center brightness-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold drop-shadow-lg md:text-6xl">
            مرحبًا بكم في سوبريت فايزة
          </h1>
          <p className="mt-3 text-xl drop-shadow md:text-2xl">
            منتجات طازجة · أسعار منافسة · عروض كل يوم
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() =>
                productsRef.current.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-accent rounded-full px-8 py-3 text-lg"
            >
              تسوق الآن
            </button>
            <a
              href="/scan"
              className="btn rounded-full bg-white/90 px-8 py-3 text-lg text-brand-700 hover:bg-white"
            >
              📷 مسح منتج
            </a>
          </div>
        </div>
      </section>

      {!filtering && featured.data?.items?.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          <h2 className="mb-4 text-2xl font-extrabold">⭐ منتجات مميزة</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {featured.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section
        ref={productsRef}
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10"
      >
        <h2 className="mb-6 border-y-4 border-brand-500 py-3 text-center text-4xl font-extrabold">
          المنتجات
        </h2>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => change(setCategory)("")}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${!category ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 hover:bg-stone-100"}`}
          >
            الكل
          </button>
          {cats.data?.map((c) => {
            const s = categoryStyle(c);
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => change(setCategory)(active ? "" : c)}
                className="rounded-full border px-4 py-1.5 text-sm font-medium"
                style={{
                  borderColor: s.color,
                  background: active ? s.color : s.soft,
                  color: active ? "#fff" : undefined,
                }}
              >
                {s.emoji} {c}
              </button>
            );
          })}
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <div className="relative w-64">
            <input
              className="input pe-10"
              placeholder="ابحث باسم المنتج أو الشركة"
              value={search}
              onChange={(e) => change(setSearch)(e.target.value)}
            />
            <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2">
              🔍
            </span>
          </div>
          <select
            className="input w-48"
            value={sort}
            onChange={(e) => change(setSort)(e.target.value)}
          >
            <option value="name">ترتيب: الاسم</option>
            <option value="price_asc">السعر: الأقل أولاً</option>
            <option value="price_desc">السعر: الأعلى أولاً</option>
            <option value="newest">الأحدث</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={promoOnly}
              onChange={(e) => change(setPromoOnly)(e.target.checked)}
            />
            🏷️ العروض فقط
          </label>
        </div>

        {list.loading && !list.data && (
          <p className="text-center text-stone-500">جاري التحميل...</p>
        )}
        {list.error && (
          <p role="alert" className="text-center text-red-600">
            {list.error}
          </p>
        )}
        {list.data?.items.length === 0 && (
          <p className="text-center text-stone-500">لا توجد منتجات مطابقة.</p>
        )}

        <div
          className={`grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 transition-opacity ${list.loading ? "opacity-50" : ""}`}
        >
          {list.data?.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {list.data && (
          <Pagination
            page={page}
            total={list.data.total}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              setPage(p);
              productsRef.current.scrollIntoView();
            }}
          />
        )}
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { categoryStyle } from "../lib/category";
import { formatPrice, LOW_STOCK } from "../lib/format";
import { thumb } from "../lib/image";

export default function ProductCard({ product: p }) {
  const cat = categoryStyle(p.category);
  const promo = p.promoPercent > 0;

  return (
    <Link
      to={`/product/${p.id}`}
      className="group relative block overflow-hidden rounded-xl bg-surface shadow transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="h-1.5" style={{ background: cat.color }} />
      {p.imageUrl ? (
        <img
          src={thumb(p.imageUrl)}
          alt={p.name}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-44 w-full items-center justify-center text-6xl"
          style={{ background: cat.soft }}
        >
          {cat.emoji}
        </div>
      )}
      <div className="p-4 text-center">
        <p className="text-sm italic text-stone-500">{p.company}</p>
        <h3 className="truncate text-lg font-bold">{p.name}</h3>
        <p className="font-bold text-brand-600">
          {formatPrice(p.finalPrice)}
          {promo && (
            <span className="ms-2 text-sm font-normal text-stone-400 line-through">
              {formatPrice(p.sellingPrice)}
            </span>
          )}
        </p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs"
          style={{ background: cat.soft }}
        >
          {cat.emoji} {p.category}
        </span>
      </div>

      <div className="absolute inset-s-3 top-5 flex flex-col items-start gap-1">
        {promo && (
          <span className="rounded-md bg-accent-500 px-2 py-1 text-xs font-bold text-white">
            -{Math.round(p.promoPercent)}%
          </span>
        )}
        {p.isFeatured && (
          <span className="rounded-md bg-amber-400 px-2 py-1 text-xs font-bold text-stone-900">
            ⭐ مميز
          </span>
        )}
        {p.stock === 0 ? (
          <span className="rounded-md bg-stone-700 px-2 py-1 text-xs text-white">
            غير متوفر
          </span>
        ) : p.stock < LOW_STOCK ? (
          <span className="rounded-md bg-red-500 px-2 py-1 text-xs text-white">
            كمية منخفضة
          </span>
        ) : null}
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { formatPrice, LOW_STOCK } from '../lib/format';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative block overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
    >
      {product.image ? (
        <img src={product.image} alt={product.name} loading="lazy" className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-stone-100 text-5xl">🛒</div>
      )}
      <div className="p-4 text-center">
        <p className="text-sm italic text-stone-500">{product.company}</p>
        <h3 className="truncate text-lg font-bold">{product.name}</h3>
        <p className="font-bold text-brand-600">{formatPrice(product.sellingPrice)}</p>
        <p className="text-sm text-stone-500">{product.category}</p>
      </div>
      {product.stock === 0 ? (
        <span className="absolute start-3 top-3 rounded-md bg-stone-700 px-2 py-1 text-xs text-white">غير متوفر</span>
      ) : product.stock < LOW_STOCK ? (
        <span className="absolute start-3 top-3 rounded-md bg-red-500 px-2 py-1 text-xs text-white">كمية منخفضة</span>
      ) : null}
    </Link>
  );
}

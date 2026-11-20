export default function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        className="btn-ghost px-3 py-1.5"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        السابق
      </button>
      <span className="text-sm text-stone-600">
        {page} / {pages}
      </span>
      <button
        className="btn-ghost px-3 py-1.5"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        التالي
      </button>
    </div>
  );
}

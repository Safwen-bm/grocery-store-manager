// A visible label + optional help text above/below an input.
export default function Field({ label, hint, required, plain, className = '', children }) {
  const Tag = plain ? 'div' : 'label';
  return (
    <Tag className={`block ${className}`}>
      <span className="mb-1 block text-sm font-bold text-stone-700">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </Tag>
  );
}
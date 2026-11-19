import { useState } from 'react';
import { api } from '../lib/api';
import { useApi, useDebounce } from '../lib/hooks';
import BarcodeScanner from './BarcodeScanner';

// Pick a product by typing its name or by scanning its barcode.
export default function ProductPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [scanning, setScanning] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const dq = useDebounce(q);
  const { data } = useApi('/admin/products', { q: dq, pageSize: 6 }, dq.length > 0 && !value);

  const onScan = async (code) => {
    setScanning(false);
    try {
      const r = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      setNotFound(false);
      onChange(r.data);
    } catch {
      setNotFound(true);
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-500 bg-brand-50 p-3">
        <span className="font-bold">{value.name} <span className="font-normal text-stone-500">(المخزون: {value.stock})</span></span>
        <button type="button" className="text-sm text-red-600" onClick={() => onChange(null)}>تغيير</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input className="input" placeholder="ابحث عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn-ghost shrink-0" onClick={() => setScanning(!scanning)}>📷</button>
      </div>
      {scanning && <div className="mt-2"><BarcodeScanner onDetected={onScan} /></div>}
      {notFound && <p className="mt-2 text-sm text-red-600">لا يوجد منتج بهذا الباركود.</p>}
      {dq && data?.items?.length > 0 && (
        <ul className="mt-2 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-surface">
          {data.items.map((p) => (
            <li key={p.id}>
              <button type="button" className="w-full px-3 py-2 text-start hover:bg-stone-100" onClick={() => onChange(p)}>
                {p.name} <span className="text-sm text-stone-500">· {p.company} · {p.stock}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
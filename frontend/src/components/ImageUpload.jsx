import { useRef, useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { compressImage, thumb } from '../lib/image';
import Icon from './Icon';

// Big, obvious "add a photo" box (instead of the browser's plain file input).
export default function ImageUpload({ url, onChange, onBusy }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    onBusy?.(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append('file', blob, 'product.jpg');
      const r = await api.post('/admin/uploads', fd);
      onChange({ url: r.data.url, publicId: r.data.publicId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
      onBusy?.(false);
    }
  };

  const open = () => inputRef.current.click();

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {url ? (
        <div className="flex items-center gap-4 rounded-xl border border-stone-300 p-3">
          <img src={thumb(url, 240)} alt="صورة المنتج" className="h-24 w-24 rounded-lg object-cover" />
          <div className="flex flex-col items-start gap-2">
            <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={open} disabled={uploading}>
              {uploading ? 'جاري الرفع...' : 'تغيير الصورة'}
            </button>
            <button type="button" className="text-sm text-red-600" onClick={() => onChange({ url: '', publicId: '' })}>
              حذف الصورة
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-6 text-stone-500 transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:opacity-60"
        >
          <Icon name="image" className="h-10 w-10" />
          <span className="font-bold">{uploading ? 'جاري رفع الصورة...' : 'اضغط لإضافة صورة المنتج'}</span>
          <span className="text-xs">من الهاتف: التقط صورة بالكاميرا أو اختر من المعرض</span>
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
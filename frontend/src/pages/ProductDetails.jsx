import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../lib/api';
import { categoryStyle } from '../lib/category';
import { formatDate, formatPrice } from '../lib/format';
import { useApi } from '../lib/hooks';
import { thumb } from '../lib/image';
import { productToForm } from '../lib/product';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Admins load the full record (cost, margin); visitors get the public one.
  const { data: p, error, reload } = useApi(user ? `/admin/products/${id}` : `/products/${id}`);

  const update = async (data) => {
    await api.put(`/admin/products/${id}`, data);
    setEditing(false);
    reload();
  };

  const remove = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      navigate('/');
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  if (error) {
    return (
      <div className="p-10 text-center">
        <h1 className="mb-3 text-2xl font-bold">خطأ</h1>
        <p>المنتج غير موجود أو حدث خطأ أثناء جلب البيانات.</p>
        <Link to="/" className="btn-primary mt-5">العودة إلى الرئيسية</Link>
      </div>
    );
  }
  if (!p) return <p className="p-10 text-center text-stone-500">جاري التحميل...</p>;

  const cat = categoryStyle(p.category);
  const hasPromo = p.promoActive ?? p.promoPercent > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">تفاصيل المنتج</h1>

      {editing ? (
        <ProductForm initial={productToForm(p)} submitLabel="تحديث المنتج" onSubmit={update} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="card flex flex-col gap-6 overflow-hidden p-5 md:flex-row">
            {p.imageUrl ? (
              <img src={thumb(p.imageUrl, 700)} alt={p.name} className="h-72 w-full rounded-xl object-cover md:w-72" />
            ) : (
              <div className="flex h-72 w-full items-center justify-center rounded-xl text-8xl md:w-72" style={{ background: cat.soft }}>{cat.emoji}</div>
            )}
            <div className="flex-1 space-y-1.5">
              <h2 className="mb-2 text-2xl font-bold">{p.name}</h2>
              <p className="text-2xl font-extrabold text-brand-600">
                {formatPrice(p.finalPrice)}
                {hasPromo && <span className="ms-2 text-base font-normal text-stone-400 line-through">{formatPrice(p.sellingPrice)}</span>}
              </p>
              <p><strong>الصنف:</strong> {cat.emoji} {p.category}</p>
              <p><strong>الشركة:</strong> {p.company || 'غير محدد'}</p>
              {p.barcode && <p><strong>الباركود:</strong> <span dir="ltr">{p.barcode}</span></p>}
              <p><strong>الكمية:</strong> {p.stock}</p>
              <p><strong>تاريخ الانتهاء:</strong> {formatDate(p.expiryDate)}</p>
              {user && <p><strong>سعر التكلفة:</strong> {formatPrice(p.costPrice)}</p>}
              {user && <p><strong>نسبة الربح:</strong> {p.profitMargin}%</p>}
            </div>
          </div>

          {actionError && <p role="alert" className="mt-3 text-center text-red-600">{actionError}</p>}
          {user && (
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn-warn" onClick={() => setEditing(true)}>تحديث</button>
              <button className="btn-danger" onClick={remove}>حذف</button>
            </div>
          )}
          <div className="mt-6 text-center"><Link to="/" className="btn-primary">العودة إلى الرئيسية</Link></div>
        </>
      )}
    </div>
  );
}
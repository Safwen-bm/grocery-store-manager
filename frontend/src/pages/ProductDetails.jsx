import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../lib/api';
import { formatDate, formatPrice } from '../lib/format';
import ProductForm from '../components/ProductForm';
import { productToForm } from '../lib/product';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const [reload, setReload] = useState(0);

  // Admins load the full record (cost, margin); visitors get the public one.
  useEffect(() => {
    let active = true;
    api.get(user ? `/admin/products/${id}` : `/products/${id}`)
      .then((r) => { if (active) { setProduct(r.data); setError(''); } })
      .catch(() => { if (active) setError('المنتج غير موجود أو حدث خطأ أثناء جلب البيانات.'); });
    return () => { active = false; };
  }, [id, user, reload]);

  const update = async (data) => {
    await api.put(`/admin/products/${id}`, data);
    setEditing(false);
    setReload((n) => n + 1);
  };

  const remove = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (error) {
    return (
      <div className="p-10 text-center">
        <h1 className="mb-3 text-2xl font-bold">خطأ</h1>
        <p>{error}</p>
        <Link to="/" className="btn-primary mt-5">العودة إلى الرئيسية</Link>
      </div>
    );
  }
  if (!product) return <p className="p-10 text-center text-stone-500">جاري التحميل...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">تفاصيل المنتج</h1>

      {editing ? (
        <ProductForm initial={productToForm(product)} submitLabel="تحديث المنتج" onSubmit={update} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex flex-col gap-6 rounded-xl bg-white p-5 shadow md:flex-row">
            {product.image && <img src={product.image} alt={product.name} className="h-72 w-full rounded-xl object-cover md:w-72" />}
            <div className="flex-1 space-y-1.5">
              <h2 className="mb-2 text-2xl font-bold">{product.name}</h2>
              <p><strong>السعر:</strong> {formatPrice(product.sellingPrice)}</p>
              <p><strong>الصنف:</strong> {product.category}</p>
              <p><strong>الشركة:</strong> {product.company || 'غير محدد'}</p>
              {user && <p><strong>سعر التكلفة:</strong> {formatPrice(product.costPrice)}</p>}
              {user && <p><strong>نسبة الربح:</strong> {product.profitMargin}%</p>}
              <p><strong>الكمية:</strong> {product.stock}</p>
              <p><strong>تاريخ الانتهاء:</strong> {formatDate(product.expiryDate)}</p>
            </div>
          </div>

          {user && (
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn-warn" onClick={() => setEditing(true)}>تحديث</button>
              <button className="btn-danger" onClick={remove}>حذف</button>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link to="/" className="btn-primary">العودة إلى الرئيسية</Link>
          </div>
        </>
      )}
    </div>
  );
}

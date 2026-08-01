import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    costPrice: '',
    profitMargin: '',
    stock: '',
    category: '',
    expiryDate: '',
    image: null,
    company: '',
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
      setForm({
        name: response.data.name,
        costPrice: response.data.costPrice.toString(),
        profitMargin: response.data.profitMargin.toString(),
        stock: response.data.stock.toString(),
        category: response.data.category,
        expiryDate: response.data.expiryDate.split('T')[0],
        image: response.data.image,
        company: response.data.company || 'غير محدد',
      });
      setError(null);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المنتج:', error);
      setError('المنتج غير موجود أو حدث خطأ أثناء جلب البيانات.');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      if (file) reader.readAsDataURL(file);
    } else {
      setForm((prev) => {
        const newForm = { ...prev, [name]: value };
        if (name === 'costPrice' || name === 'profitMargin') {
          const cost = parseFloat(newForm.costPrice) || 0;
          const margin = parseFloat(newForm.profitMargin) || 0;
          newForm.sellingPrice = (cost * (1 + margin / 100)).toFixed(2);
        }
        return newForm;
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/products/${id}`, {
        ...form,
        costPrice: parseFloat(form.costPrice),
        profitMargin: parseFloat(form.profitMargin),
        stock: parseInt(form.stock),
        image: form.image || product.image,
      });
      setIsEditing(false);
      fetchProduct(); // Refresh the product details
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
      setError('حدث خطأ أثناء تحديث المنتج.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await axios.delete(`/api/products/${id}`);
        navigate('/'); // Redirect to Home page after deletion
      } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        setError('حدث خطأ أثناء حذف المنتج.');
      }
    }
  };

  if (error) {
    return (
      <div className="content">
        <h1>خطأ</h1>
        <p>{error}</p>
        <Link to="/" className="back-link">العودة إلى الرئيسية</Link>
      </div>
    );
  }

  if (!product) {
    return <div className="content">جاري التحميل...</div>;
  }

  return (
    <div className="content product-details">
      <h1>تفاصيل المنتج</h1>
      {isEditing ? (
        <form onSubmit={handleUpdate}>
          <input
            type="text"
            name="name"
            placeholder="اسم المنتج"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="costPrice"
            placeholder="سعر التكلفة"
            value={form.costPrice}
            onChange={handleChange}
            required
            step="0.01"
          />
          <input
            type="number"
            name="profitMargin"
            placeholder="نسبة الربح (%)"
            value={form.profitMargin}
            onChange={handleChange}
            required
            step="0.1"
          />
          <input
            type="text"
            placeholder="سعر البيع (محسوب تلقائيًا)"
            value={
              form.costPrice
                ? (parseFloat(form.costPrice) * (1 + parseFloat(form.profitMargin || 0) / 100)).toFixed(2)
                : ''
            }
            readOnly
          />
          <input
            type="number"
            name="stock"
            placeholder="الكمية"
            value={form.stock}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="الصنف"
            value={form.category}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="company"
            placeholder="اسم الشركة"
            value={form.company}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            required
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          {form.image && (
            <img
              src={form.image}
              alt="معاينة"
              style={{ width: '100px', marginTop: '10px' }}
            />
          )}
          <button type="submit">تحديث المنتج</button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ backgroundColor: '#ff4444', marginLeft: '10px' }}
          >
            إلغاء
          </button>
        </form>
      ) : (
        <>
          <div className="product-details-card">
            {product.image && (
              <img src={product.image} alt={product.name} className="product-details-image" />
            )}
            <div className="product-details-info">
              <h2>{product.name}</h2>
              <p><strong>السعر:</strong> {product.sellingPrice} د.ت</p>
              <p><strong>الصنف:</strong> {product.category}</p>
              <p><strong>الشركة:</strong> {product.company || 'غير محدد'}</p>
              <p><strong>سعر التكلفة:</strong> {product.costPrice} د.ت</p>
              <p><strong>نسبة الربح:</strong> {product.profitMargin}%</p>
              <p><strong>الكمية:</strong> {product.stock}</p>
              <p><strong>تاريخ الانتهاء:</strong> {new Date(product.expiryDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="product-actions">
            <button
              onClick={() => setIsEditing(true)}
              style={{ backgroundColor: '#ffaa00', marginRight: '10px' }}
            >
              تحديث
            </button>
            <button
              onClick={handleDelete}
              style={{ backgroundColor: '#ff4444' }}
            >
              حذف
            </button>
          </div>
          <Link to="/" className="back-link">العودة إلى الرئيسية</Link>
        </>
      )}
    </div>
  );
}

export default ProductDetails;
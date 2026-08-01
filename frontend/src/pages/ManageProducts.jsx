import { useState, useEffect } from 'react';
import axios from 'axios';

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    costPrice: '',
    profitMargin: '20',
    stock: '',
    category: '',
    expiryDate: '',
    image: null,
    company: '', // New field for company
  });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('خطأ في جلب المنتجات:', error);
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
          const margin = parseFloat(newForm.profitMargin) || 20;
          newForm.sellingPrice = (cost * (1 + margin / 100)).toFixed(2);
        }
        return newForm;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct._id}`, {
          ...form,
          costPrice: parseFloat(form.costPrice),
          profitMargin: parseFloat(form.profitMargin),
          stock: parseInt(form.stock),
          image: form.image || editingProduct.image,
        });
        setEditingProduct(null);
      } else {
        await axios.post('/api/products', {
          ...form,
          costPrice: parseFloat(form.costPrice),
          profitMargin: parseFloat(form.profitMargin),
          stock: parseInt(form.stock),
        });
      }
      fetchProducts();
      setForm({
        name: '',
        costPrice: '',
        profitMargin: '20',
        stock: '',
        category: '',
        expiryDate: '',
        image: null,
        company: '', // Reset company field
      });
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      costPrice: product.costPrice.toString(),
      profitMargin: product.profitMargin.toString(),
      stock: product.stock.toString(),
      category: product.category,
      expiryDate: product.expiryDate.split('T')[0],
      image: product.image,
      company: product.company, // Include company in edit form
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
    }
  };

  const calculatedSellingPrice = form.costPrice
    ? (parseFloat(form.costPrice) * (1 + parseFloat(form.profitMargin || 20) / 100)).toFixed(2)
    : '';

  return (
    <div className="content">
      <h1>إدارة المنتجات</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="اسم المنتج" value={form.name} onChange={handleChange} required />
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
          value={calculatedSellingPrice}
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
        <input type="text" name="category" placeholder="الصنف" value={form.category} onChange={handleChange} required />
        <input type="text" name="company" placeholder="اسم الشركة" value={form.company} onChange={handleChange} required /> {/* New company field */}
        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required />
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
        <button type="submit">{editingProduct ? 'تحديث المنتج' : 'إضافة منتج'}</button>
        {editingProduct && (
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setForm({ name: '', costPrice: '', profitMargin: '20', stock: '', category: '', expiryDate: '', image: null, company: '' });
            }}
          >
            إلغاء
          </button>
        )}
      </form>
      <h2>المنتجات</h2>
      <table>
        <thead>
          <tr>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>سعر التكلفة</th>
            <th>نسبة الربح (%)</th>
            <th>سعر البيع</th>
            <th>الكمية</th>
            <th>الصنف</th>
            <th>الشركة</th> {/* New column for company */}
            <th>تاريخ الانتهاء</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                {product.image && <img src={product.image} alt={product.name} style={{ width: '50px' }} />}
              </td>
              <td>{product.name}</td>
              <td>{product.costPrice}</td>
              <td>{product.profitMargin}</td>
              <td>{product.sellingPrice}</td>
              <td style={{ color: product.stock < 10 ? 'red' : 'inherit' }}>
                {product.stock}
              </td>
              <td>{product.category}</td>
              <td>{product.company}</td> {/* Display company */}
              <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => handleEdit(product)}
                  style={{ backgroundColor: '#ffaa00', marginRight: '5px' }}
                >
                  تحديث
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  style={{ backgroundColor: '#ff4444' }}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageProducts;
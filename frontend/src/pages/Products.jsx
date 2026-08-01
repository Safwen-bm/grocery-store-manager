import { useState, useEffect } from 'react';
import axios from 'axios';

function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) =>
      selectedCategory ? product.category === selectedCategory : true
    );

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="content">
      <h1>المنتجات</h1>
      <input
        type="text"
        placeholder="ابحث باسم المنتج"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '10px', width: '200px' }}
      />
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={{ marginBottom: '10px', marginLeft: '10px' }}
      >
        <option value="">جميع الأصناف</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
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
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Products;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function Home() {
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

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) =>
      selectedCategory ? product.category === selectedCategory : true
    );

  const scrollToProducts = () => {
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      <div className="hero">
        <img src="/home.png" alt="Superette Faiza" className="hero-image" />
        <div className="hero-overlay">
          <h1 className="hero-title">مرحبًا بكم في سوبارات فايزة</h1>
          <p className="hero-tagline">تسوق أفضل المنتجات بأسعار تنافسية!</p>
          <button onClick={scrollToProducts} className="hero-button">تسوق الآن</button>
        </div>
      </div>
      <div className="welcome-section">
        <h2>اكتشف تشكيلتنا الواسعة</h2>
        <p>منتجات عالية الجودة تناسب جميع احتياجاتك اليومية</p>
      </div>
      <div className="products-section">
        <h1 className="products-title">المنتجات</h1>
        <div className="filters">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="ابحث باسم المنتج"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="category-wrapper">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="">جميع الأصناف</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <Link
              to={`/product/${product._id}`}
              key={product._id}
              className="product-link"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="product-card">
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-info">
                <h5 style={{ color: 'gray', fontStyle: 'italic' }}>{product.company}</h5>
                  <h3>{product.name}</h3>
                  <p>{product.sellingPrice} د.ت</p>
                  <h5 style={{ color: 'gray' }}>{product.category}</h5>
                  {product.stock < 10 && (
                    <span className="low-stock-badge">كمية منخفضة</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <footer className="footer">
        <p>سوبريت فايزة - جميع الحقوق محفوظة © 2025</p>
        <p>تواصلوا معنا: contact@superettefaiza.com</p>
      </footer>
    </div>
  );
}

export default Home;
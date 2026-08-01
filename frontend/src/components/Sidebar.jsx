import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ onLogout, isOpen }) {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <h2>لوحة التحكم</h2>
      <ul>
        <li>
          <Link to="/">الرئيسية</Link>
        </li>
        <li>
          <Link to="/manage-products">إدارة المنتجات</Link>
        </li>
        <li>
          <Link to="/products">المنتجات</Link>
        </li>
        <li>
          <button onClick={onLogout}>تسجيل الخروج</button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
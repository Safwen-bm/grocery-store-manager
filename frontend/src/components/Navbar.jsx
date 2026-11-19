import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 font-medium transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
    }`;

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
      <nav className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4">
        <Link to="/" onClick={() => setOpen(false)}>
          <img src="/case.png" alt="سوبريت فايزة" className="h-12" />
        </Link>

        <button
          className="rounded-lg p-2 hover:bg-stone-100 md:hidden"
          aria-label="القائمة"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="block h-0.5 w-6 bg-stone-700" />
          <span className="mt-1.5 block h-0.5 w-6 bg-stone-700" />
          <span className="mt-1.5 block h-0.5 w-6 bg-stone-700" />
        </button>

        <div
          className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-[70px] flex-col gap-1 bg-white p-4 shadow-md
                      md:static md:flex md:flex-row md:items-center md:p-0 md:shadow-none`}
        >
          <NavLink to="/" className={link} onClick={() => setOpen(false)}>الرئيسية</NavLink>
          {user ? (
            <>
              <NavLink to="/admin/products" className={link} onClick={() => setOpen(false)}>إدارة المنتجات</NavLink>
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-start font-medium text-red-600 hover:bg-red-50">
                تسجيل الخروج
              </button>
            </>
          ) : (
            <NavLink to="/login" className={link} onClick={() => setOpen(false)}>دخول الإدارة</NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

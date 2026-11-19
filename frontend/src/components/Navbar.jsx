import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 font-medium transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
    }`;
  const close = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  const install = async () => {
    installEvent.prompt();
    setInstallEvent(null);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface shadow-sm">
      <nav className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4">
        <Link to="/" onClick={close}><Logo /></Link>

        <button
          className="rounded-lg p-2 hover:bg-stone-100 lg:hidden"
          aria-label="القائمة"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="block h-0.5 w-6 bg-stone-700" />
          <span className="mt-1.5 block h-0.5 w-6 bg-stone-700" />
          <span className="mt-1.5 block h-0.5 w-6 bg-stone-700" />
        </button>

        <div
          className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-[70px] flex-col gap-1 bg-surface p-4 shadow-md
                      lg:static lg:flex lg:flex-row lg:items-center lg:p-0 lg:shadow-none`}
        >
          <NavLink to="/" end className={link} onClick={close}>الرئيسية</NavLink>
          <NavLink to="/scan" className={link} onClick={close}>📷 مسح منتج</NavLink>
          {user && (
            <>
              <NavLink to="/admin" end className={link} onClick={close}>لوحة التحكم</NavLink>
              <NavLink to="/admin/products" className={link} onClick={close}>المنتجات</NavLink>
              <NavLink to="/admin/stock" className={link} onClick={close}>المخزون</NavLink>
              <NavLink to="/admin/finance" className={link} onClick={close}>المالية</NavLink>
            </>
          )}
          {installEvent && (
            <button onClick={install} className="rounded-lg px-3 py-2 text-start font-medium text-accent-600 hover:bg-stone-100">
              ⬇️ تثبيت التطبيق
            </button>
          )}
          {user ? (
            <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-start font-medium text-red-600 hover:bg-red-50">
              تسجيل الخروج
            </button>
          ) : (
            <NavLink to="/login" className={link} onClick={close}>دخول الإدارة</NavLink>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
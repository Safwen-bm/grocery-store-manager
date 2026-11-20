import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const LINKS = [
  { to: '/admin', icon: 'dashboard', label: 'لوحة التحكم', end: true },
  { to: '/admin/products', icon: 'box', label: 'المنتجات' },
  { to: '/admin/stock', icon: 'stock', label: 'المخزون' },
  { to: '/admin/finance', icon: 'wallet', label: 'المالية' },
];

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

// Collapsible sidebar: pushes the content on desktop, slides over it on mobile.
export default function AdminLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(isDesktop);
  const closeOnMobile = () => { if (!isDesktop()) setOpen(false); };

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
    }`;

  return (
    <div>
      {open && <div className="fixed inset-x-0 bottom-0 top-[70px] z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed bottom-0 start-0 top-[70px] z-40 flex w-64 flex-col overflow-y-auto border-e border-stone-200 bg-surface p-3 shadow-lg transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-3 border-b border-stone-200 px-3 pb-3">
          <p className="text-xs text-stone-500">مرحباً</p>
          <p className="font-bold">{user?.username}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={link} onClick={closeOnMobile}>
              <Icon name={l.icon} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-stone-600 hover:bg-stone-100">
          <Icon name="store" /> عرض المتجر
        </Link>
      </aside>

      <div className={`transition-[margin] duration-300 ${open ? 'lg:ms-64' : ''}`}>
        <div className="sticky top-[70px] z-20 border-b border-stone-200 bg-stone-50/90 px-4 py-2 backdrop-blur">
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 font-medium shadow-sm hover:bg-stone-100"
          >
            <Icon name={open ? 'close' : 'menu'} />
            {open ? 'إخفاء القائمة' : 'القائمة'}
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
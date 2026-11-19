import { useState } from 'react';
import { toggleTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  return (
    <button
      onClick={() => setDark(toggleTheme())}
      aria-label="تبديل الوضع الليلي"
      className="rounded-lg px-3 py-2 text-lg hover:bg-stone-100"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
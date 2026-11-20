import { useState } from 'react';
import { toggleTheme } from '../lib/theme';
import Icon from './Icon';

// Standard on/off switch for dark mode
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="الوضع الليلي"
      title="الوضع الليلي"
      onClick={() => setDark(toggleTheme())}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${dark ? 'bg-brand-600' : 'bg-stone-300'}`}
    >
      <span
        className={`absolute inset-s-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform ${
          dark ? '-translate-x-5 text-brand-600' : 'text-amber-500'
        }`}
      >
        <Icon name={dark ? 'moon' : 'sun'} className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
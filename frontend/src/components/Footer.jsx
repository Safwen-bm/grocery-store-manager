import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-surface px-4 py-8 text-center text-sm text-stone-500">
      <div className="mb-3 flex justify-center"><Logo className="h-8" /></div>
      <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      <p className="mt-1">contact@superettefaiza.com</p>
    </footer>
  );
}
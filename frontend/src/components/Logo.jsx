export default function Logo({ className = 'h-10' }) {
  return (
    <span className="flex items-center gap-2">
      <img src="/icon.svg" alt="" className={className} />
      <span className="text-xl font-extrabold leading-none text-brand-700">
        سوبريت <span className="text-accent-500">فايزة</span>
      </span>
    </span>
  );
}
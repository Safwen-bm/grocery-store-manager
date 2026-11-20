// Faiza logo: a fresh-produce bag (mark) + two-line wordmark.
export default function Logo({ className = "h-11" }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2e9e5b" />
            <stop offset="1" stopColor="#0f3a22" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill="url(#logo-g)" />
        <path
          d="M18.5 26h27l-2.5 24a4 4 0 0 1-4 3.6H25a4 4 0 0 1-4-3.6z"
          fill="#fff"
        />
        <path
          d="M25 26v-4a7 7 0 0 1 14 0v4"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <g transform="translate(4.1 -0.75)">
          <path d="M32 49c-7-1-10-7-9-13 7 0 11 5 9 13z" fill="#f08a1c" />
          <path
            d="M32 49c-1.7-3.2-3.5-6.5-5.2-9.2"
            fill="none"
            stroke="#fff"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity=".85"
          />
        </g>
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-bold tracking-wide text-stone-500">
          سوبريت
        </span>
        <span className="text-2xl font-extrabold text-brand-700">فايزة</span>
      </span>
    </span>
  );
}

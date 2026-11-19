import { lazy, Suspense } from 'react';

// The camera library is heavy: only download it when a scanner is actually opened.
const Impl = lazy(() => import('./BarcodeScannerImpl'));

export default function BarcodeScanner(props) {
  return (
    <Suspense fallback={<p className="p-4 text-center text-stone-500">جاري تشغيل الكاميرا...</p>}>
      <Impl {...props} />
    </Suspense>
  );
}
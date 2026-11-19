import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats as F } from 'html5-qrcode';

const FORMATS = [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.QR_CODE];

// Opens the back camera and calls onDetected(code) once a barcode is read.
export default function BarcodeScanner({ onDetected }) {
  const [error, setError] = useState('');
  const handler = useRef(onDetected);

  useEffect(() => { handler.current = onDetected; }, [onDetected]);

  useEffect(() => {
    const scanner = new Html5Qrcode('sf-reader', { formatsToSupport: FORMATS, verbose: false });
    let done = false;
    const starting = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (text) => {
          if (done) return;
          done = true;
          navigator.vibrate?.(80);
          handler.current(text);
        },
        () => {},
      )
      .catch(() => setError('تعذر تشغيل الكاميرا. تأكد من السماح بالوصول إليها (ويلزم اتصال HTTPS على الهاتف).'));

    return () => {
      starting.then(() => scanner.stop()).then(() => scanner.clear()).catch(() => {});
    };
  }, []);

  return (
    <div>
      <div id="sf-reader" className="overflow-hidden rounded-xl bg-black" />
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
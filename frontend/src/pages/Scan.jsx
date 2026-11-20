import { useState } from "react";
import { Link } from "react-router-dom";
import BarcodeScanner from "../components/BarcodeScanner";
import { useAuth } from "../context/AuthContext";
import { api, errorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useApi } from "../lib/hooks";
import { thumb } from "../lib/image";

export default function Scan() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [manual, setManual] = useState("");
  const [session, setSession] = useState(0); // remounts the camera on "scan again"
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [stock, setStock] = useState(null);

  const {
    data: p,
    status,
    loading,
    reload,
  } = useApi(
    `/products/barcode/${encodeURIComponent(code)}`,
    undefined,
    !!code,
  );

  const again = () => {
    setCode("");
    setManual("");
    setMsg("");
    setStock(null);
    setSession((s) => s + 1);
  };

  const move = async (type) => {
    setMsg("");
    try {
      const r = await api.post("/admin/movements", {
        productId: p.id,
        type,
        quantity: Number(qty),
      });
      setStock(r.data.stock);
      setMsg(type === "sale" ? "✅ تم تسجيل البيع" : "✅ تمت إضافة المخزون");
      reload();
    } catch (e) {
      setMsg(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-center text-3xl font-bold">📷 مسح منتج</h1>
      <p className="mb-5 text-center text-stone-500">
        وجّه الكاميرا نحو الباركود لمعرفة السعر فوراً
      </p>

      {!code && (
        <>
          <BarcodeScanner key={session} onDetected={setCode} />
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) setCode(manual.trim());
            }}
          >
            <input
              className="input"
              placeholder="أو اكتب رقم الباركود"
              inputMode="numeric"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
            <button className="btn-primary shrink-0">بحث</button>
          </form>
        </>
      )}

      {code && loading && (
        <p className="text-center text-stone-500">جاري البحث...</p>
      )}

      {code && status === 404 && (
        <div className="card p-5 text-center">
          <p className="mb-1 text-lg font-bold">لا يوجد منتج بهذا الباركود</p>
          <p className="mb-4 text-stone-500" dir="ltr">
            {code}
          </p>
          {user && (
            <Link
              to={`/admin/products?barcode=${encodeURIComponent(code)}`}
              className="btn-accent mb-3 w-full"
            >
              ➕ إضافة هذا المنتج
            </Link>
          )}
          <button className="btn-ghost w-full" onClick={again}>
            مسح منتج آخر
          </button>
        </div>
      )}

      {p && (
        <div className="card overflow-hidden">
          {p.imageUrl && (
            <img
              src={thumb(p.imageUrl, 600)}
              alt={p.name}
              className="h-52 w-full object-cover"
            />
          )}
          <div className="space-y-2 p-5 text-center">
            <p className="text-sm italic text-stone-500">
              {p.company} · {p.category}
            </p>
            <h2 className="text-2xl font-bold">{p.name}</h2>
            <p className="text-4xl font-extrabold text-brand-600">
              {formatPrice(p.finalPrice)}
            </p>
            {p.promoPercent > 0 && (
              <p>
                <span className="rounded-md bg-accent-500 px-2 py-1 text-sm font-bold text-white">
                  عرض -{Math.round(p.promoPercent)}%
                </span>
                <span className="ms-2 text-stone-400 line-through">
                  {formatPrice(p.sellingPrice)}
                </span>
              </p>
            )}
            <p
              className={
                p.stock === 0 ? "font-bold text-red-600" : "text-stone-600"
              }
            >
              {p.stock === 0
                ? "غير متوفر حالياً"
                : `متوفر: ${stock ?? p.stock}`}
            </p>

            {user && (
              <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-3">
                <p className="mb-2 text-sm font-bold text-stone-500">
                  إجراء سريع (إدارة)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    className="input w-24"
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                  <button
                    className="btn-primary flex-1"
                    onClick={() => move("sale")}
                  >
                    بيع
                  </button>
                  <button
                    className="btn-warn flex-1"
                    onClick={() => move("purchase")}
                  >
                    + مخزون
                  </button>
                </div>
                {msg && <p className="mt-2 text-sm">{msg}</p>}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Link to={`/product/${p.id}`} className="btn-ghost flex-1">
                التفاصيل
              </Link>
              <button className="btn-primary flex-1" onClick={again}>
                مسح آخر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

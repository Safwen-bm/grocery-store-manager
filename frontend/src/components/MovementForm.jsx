import { useState } from "react";
import { api, errorMessage } from "../lib/api";
import Field from "./Field";
import ProductPicker from "./ProductPicker";

const TYPES = {
  sale: {
    label: "بيع",
    sub: "قطع خرجت من المخزون",
    hint: "اتركه فارغاً: يُستعمل سعر البيع الحالي (مع التخفيض إن وجد).",
  },
  purchase: {
    label: "شراء",
    sub: "قطع دخلت المخزون",
    hint: "اتركه فارغاً: يُستعمل سعر التكلفة المسجل. اكتب سعراً جديداً إذا تغيّر عند المورد.",
  },
  waste: {
    label: "تلف / ضياع",
    sub: "منتهي أو مكسور أو مسروق",
    hint: "اتركه فارغاً: تُحسب الخسارة بسعر التكلفة.",
  },
};

// One form for every stock movement. `types` decides which kinds are offered.
export default function MovementForm({
  types = ["sale", "purchase", "waste"],
  submitLabel = "تسجيل الحركة",
  onDone,
}) {
  const [product, setProduct] = useState(null);
  const [type, setType] = useState(types[0]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ ok: true, text: "" });
    try {
      const r = await api.post("/admin/movements", {
        productId: product.id,
        type,
        quantity: Number(qty),
        unitPrice: price === "" ? null : Number(price),
        supplier: type === "purchase" && supplier ? supplier : null,
        note: note || null,
      });
      setMsg({
        ok: true,
        text: `✅ تم التسجيل. المخزون الحالي: ${r.data.stock}`,
      });
      setProduct(null);
      setQty(1);
      setPrice("");
      setSupplier("");
      setNote("");
      onDone?.(r.data);
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  return (
    <form
      onSubmit={submit}
      className="card mx-auto flex max-w-xl flex-col gap-3 p-5"
    >
      <Field
        label="المنتج"
        required
        plain
        hint="اكتب الاسم أو اضغط 📷 لمسح الباركود"
      >
        <ProductPicker value={product} onChange={setProduct} />
      </Field>

      {types.length > 1 && (
        <Field label="نوع الحركة" plain>
          <div className="grid grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-2 py-2 text-center ${type === t ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 hover:bg-stone-100"}`}
              >
                <span className="block text-sm font-bold">
                  {TYPES[t].label}
                </span>
                <span className="block text-[11px] opacity-80">
                  {TYPES[t].sub}
                </span>
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="الكمية (عدد القطع)" required>
          <input
            className="input"
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </Field>
        <Field label={type === "purchase" ? "سعر شراء القطعة" : "سعر القطعة"}>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={
              product?.costPrice != null && type !== "sale"
                ? String(product.costPrice)
                : "اختياري"
            }
          />
        </Field>
      </div>
      <p className="-mt-1 text-xs text-stone-500">{TYPES[type].hint}</p>

      {type === "purchase" && (
        <Field
          label="المورد (اختياري)"
          hint="من أين اشتريت؟ مثال: شركة دليس، السوق المركزي"
        >
          <input
            className="input"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            maxLength={100}
          />
        </Field>
      )}
      <Field label="ملاحظة (اختياري)">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />
      </Field>

      {msg.text && (
        <p
          role="alert"
          className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}
        >
          {msg.text}
        </p>
      )}
      <button className="btn-primary" disabled={!product}>
        {submitLabel}
      </button>
    </form>
  );
}

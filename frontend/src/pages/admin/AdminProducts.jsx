import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/Pagination";
import ProductForm from "../../components/ProductForm";
import { api, errorMessage } from "../../lib/api";
import { expiryState, formatDate, LOW_STOCK } from "../../lib/format";
import { useApi, useDebounce } from "../../lib/hooks";
import { thumb } from "../../lib/image";
import { EMPTY_FORM, productToForm } from "../../lib/product";

const PAGE_SIZE = 15;

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const scanned = params.get("barcode"); // coming from the scan page
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [carry, setCarry] = useState({}); // keep category + company between two additions
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const q = useDebounce(search);

  const cats = useApi("/products/categories");
  const list = useApi("/admin/products", {
    q,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const resetForm = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  const save = async (data) => {
    if (editing) {
      await api.put(`/admin/products/${editing.id}`, data);
    } else {
      await api.post("/admin/products", data);
      setCarry({ category: data.category, company: data.company });
      if (scanned) setParams({}, { replace: true });
    }
    resetForm();
    list.reload();
  };

  const remove = async (p) => {
    if (!window.confirm(`حذف "${p.name}"؟`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      list.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const startEdit = (p) => {
    setEditing(p);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const initial = editing
    ? productToForm(editing)
    : { ...EMPTY_FORM, ...carry, barcode: scanned ?? "" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">إدارة المنتجات</h1>

      <ProductForm
        key={formKey}
        initial={initial}
        submitLabel={editing ? "تحديث المنتج" : "إضافة منتج"}
        onSubmit={save}
        onCancel={editing ? resetForm : undefined}
      />

      <h2 className="mb-3 mt-10 text-2xl font-bold">
        المنتجات ({list.data?.total ?? 0})
      </h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input w-60"
          placeholder="اسم / شركة / باركود"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input w-48"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">جميع الأصناف</option>
          {cats.data?.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {(error || list.error) && (
        <p role="alert" className="mb-3 text-red-600">
          {error || list.error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-225 text-start">
          <thead className="bg-stone-100 text-stone-700">
            <tr>
              {[
                "",
                "الاسم",
                "الباركود",
                "التكلفة",
                "البيع",
                "عرض",
                "الكمية",
                "الصنف",
                "الانتهاء",
                "",
              ].map((h, i) => (
                <th key={i} className="p-3 text-start font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((p) => {
              const exp = expiryState(p.expiryDate);
              return (
                <tr key={p.id} className="border-t border-stone-200">
                  <td className="p-3">
                    {p.imageUrl && (
                      <img
                        src={thumb(p.imageUrl, 100)}
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    <Link
                      to={`/product/${p.id}`}
                      className="hover:text-brand-600"
                    >
                      {p.isFeatured && "⭐ "}
                      {p.name}
                    </Link>
                    <div className="text-xs text-stone-500">{p.company}</div>
                  </td>
                  <td className="p-3 text-sm" dir="ltr">
                    {p.barcode}
                  </td>
                  <td className="p-3">{p.costPrice}</td>
                  <td className="p-3">{p.finalPrice}</td>
                  <td className="p-3">
                    {p.promoActive ? (
                      <span className="font-bold text-accent-600">
                        -{Math.round(p.promoPercent)}%
                      </span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td
                    className={`p-3 ${p.stock < LOW_STOCK ? "font-bold text-red-600" : ""}`}
                  >
                    {p.stock}
                  </td>
                  <td className="p-3">{p.category}</td>
                  <td
                    className={`p-3 ${exp === "expired" ? "font-bold text-red-600" : exp === "soon" ? "font-bold text-amber-600" : ""}`}
                  >
                    {formatDate(p.expiryDate)}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    <button
                      className="btn-warn me-2 px-3 py-1.5 text-sm"
                      onClick={() => startEdit(p)}
                    >
                      تحديث
                    </button>
                    <button
                      className="btn-danger px-3 py-1.5 text-sm"
                      onClick={() => remove(p)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.data?.items.length === 0 && (
          <p className="p-6 text-center text-stone-500">لا توجد منتجات.</p>
        )}
      </div>
      {list.data && (
        <Pagination
          page={page}
          total={list.data.total}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      )}
    </div>
  );
}

// src/pages/AdminManagerProduct.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://api.phone.sitedemo.io.vn";
const currency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);
const getAdminToken = () => localStorage.getItem("token") || "";

export default function AdminManagerProduct() {
  // ---------- data ----------
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);

  // ---------- UI state ----------
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---------- modal + form ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(getEmptyForm());
  const [objectUrls, setObjectUrls] = useState([]);

  function getEmptyForm() {
    return {
      name: "",
      description: "",
      price: 0,
      discount_price: 0,
      stock_quantity: 0,
      category_id: "",
      brand_id: "",
      color_id: "",
      color_ids: [],
      images: [],
      image_alts: [],
      primary_image_index: 0,
      is_active: true,
    };
  }

  // ---------- fetch helpers ----------
  const parseListFromResponse = (json, keyAlternative) => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (json.data && Array.isArray(json.data[keyAlternative])) return json.data[keyAlternative];
    if (Array.isArray(json.colors)) return json.colors;
    if (Array.isArray(json.brands)) return json.brands;
    return [];
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams();
      if (status !== "all") params.append("is_active", status === "active" ? "true" : "false");
      const res = await fetch(`${API_BASE}/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setProducts(list);
    } catch (err) {
      console.error("fetchProducts error", err);
      alert("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/categories?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setCategories(parseListFromResponse(json, "categories"));
    } catch (err) {
      console.warn("fetchCategories failed", err);
    }
  };

  const fetchBrands = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/brands?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setBrands(parseListFromResponse(json, "brands"));
    } catch (err) {
      console.warn("fetchBrands failed", err);
    }
  };

  const fetchColors = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/colors?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) {
        console.warn("fetchColors non-ok", res.status);
        return;
      }
      const json = await res.json();
      let list = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.data)) list = json.data;
      else if (json?.data?.colors && Array.isArray(json.data.colors)) list = json.data.colors;
      else if (Array.isArray(json.colors)) list = json.colors;
      else if (json?.data?.items && Array.isArray(json.data.items)) list = json.data.items;

      const normalized = list.map((c) => ({
        id: c.id ?? c._id ?? c.value,
        name: c.color_name ?? c.name ?? c.title ?? c.label ?? `Màu #${c.id ?? c._id ?? ""}`,
        hex: c.hex_code ?? c.hex ?? c.code ?? "",
      })).filter((c) => c.id);
      setColors(normalized);
    } catch (err) {
      console.error("Lỗi fetch colors:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchColors();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts();
    // eslint-disable-next-line
  }, [status]);

  // ---------- overview ----------
  const overview = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => !!p.is_active).length;
    const inactive = total - active;
    const stockTotal = products.reduce((s, p) => s + Number(p.stock_quantity || 0), 0);
    const inventoryValue = products.reduce((s, p) => {
      const priceEff = Number(p.discount_price || p.price || 0);
      return s + priceEff * Number(p.stock_quantity || 0);
    }, 0);
    return { total, active, inactive, stockTotal, inventoryValue };
  }, [products]);

  const topProducts = useMemo(() => {
    const withValue = products.map((p) => {
      const priceEff = Number(p.discount_price || p.price || 0);
      return { ...p, _invValue: priceEff * Number(p.stock_quantity || 0) };
    });
    return withValue.sort((a, b) => b._invValue - a._invValue).slice(0, 3);
  }, [products]);

  // ---------- filter / pagination ----------
  const filtered = useMemo(() => {
    let list = [...products];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [String(p.id), p.name || "", p.slug || "", p.brand?.name || p.brand_id || ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((p) => String(p.category_id ?? p.category?.id) === String(categoryFilter));
    }
    if (brandFilter) {
      list = list.filter((p) => String(p.brand_id ?? p.brand?.id) === String(brandFilter));
    }
    return list;
  }, [products, query, categoryFilter, brandFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // ---------- modal/form ----------
  const openCreate = () => {
    setEditing(null);
    setFormErrors({});
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    setObjectUrls([]);
    setForm(getEmptyForm());
    fetchColors();
    fetchCategories();
    fetchBrands();
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setFormErrors({});
    const categoryId = product.category_id ?? product.categoryId ?? product.category?.id ?? "";
    const brandId = product.brand_id ?? product.brandId ?? product.brand?.id ?? "";
    const colorId = product.color_id ?? product.colorId ?? product.color?.id ?? "";

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price || 0),
      discount_price: Number(product.discount_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      category_id: categoryId,
      brand_id: brandId,
      color_id: colorId,
      color_ids: Array.isArray(product.color_ids) ? product.color_ids.map(String) : [],
      images: [],
      image_alts: [],
      primary_image_index: 0,
      is_active: product.is_active ?? true,
    });
    fetchColors();
    setModalOpen(true);
  };

  useEffect(() => {
    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [objectUrls]);

  const validateForm = () => {
    const errs = {};
    if (!form.name || !String(form.name).trim()) errs.name = "Tên sản phẩm bắt buộc";
    if (form.price === "" || Number(form.price) < 0) errs.price = "Giá không hợp lệ";
    if (!form.category_id) errs.category_id = "Danh mục bắt buộc";
    if (!form.brand_id) errs.brand_id = "Thương hiệu bắt buộc";
    if (!form.color_id) errs.color_id = "Màu mặc định bắt buộc";
    if (!editing && (!form.images || form.images.length === 0)) errs.images = "Cần ít nhất 1 hình ảnh";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------- actions ----------
  const removeProduct = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchProducts();
    } catch (err) {
      console.error("removeProduct error", err);
      alert("Xóa sản phẩm thất bại.");
    }
  };

  const updateStock = async (id, newStock) => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/products/${id}/stock`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // BE expects snake_case
        body: JSON.stringify({ stock_quantity: Number(newStock), operation: "set" }),
      });
      if (!res.ok) throw new Error(`Stock failed: ${res.status}`);
      await fetchProducts();
    } catch (err) {
      console.error("updateStock error", err);
      alert("Cập nhật tồn kho thất bại.");
    }
  };

  const toggleActive = async (p) => {
    try {
      const token = getAdminToken();
      const category_id = Number(p.category_id ?? p.categoryId ?? p.category?.id);
      const brand_id = Number(p.brand_id ?? p.brandId ?? p.brand?.id);
      const color_id_raw = p.color_id ?? p.colorId ?? p.color?.id;
      const color_id = color_id_raw != null ? Number(color_id_raw) : undefined;

      if (!category_id || !brand_id || !color_id) {
        alert("Sản phẩm thiếu Danh mục/Thương hiệu/Màu mặc định. Vui lòng mở 'Sửa' và chọn đầy đủ.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: p.name,
          description: p.description || "",
          price: Number(p.price || 0),
          discount_price: Number(p.discount_price || 0),
          category_id,
          brand_id,
          color_id,
          is_active: !p.is_active,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("toggleActive failed:", res.status, t);
        throw new Error(`Update failed`);
      }
      await fetchProducts();
    } catch (err) {
      console.error("toggleActive error", err);
      alert("Cập nhật trạng thái thất bại.");
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      const token = getAdminToken();
      if (editing) {
        const payload = {
          name: form.name,
          description: form.description || "",
          price: Number(form.price),
          discount_price: Number(form.discount_price) || 0,
          category_id: Number(form.category_id),
          brand_id: Number(form.brand_id),
          is_active: !!form.is_active,
        };
        if (form.color_id) payload.color_id = Number(form.color_id);

        const res = await fetch(`${API_BASE}/api/admin/products/${editing.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("update failed:", res.status, text);
          throw new Error("Update failed");
        }
      } else {
        const fd = new FormData();
        const productPayload = {
          name: form.name,
          description: form.description || "",
          price: Number(form.price),
          discount_price: Number(form.discount_price) || 0,
          stock_quantity: Number(form.stock_quantity || 0),
          category_id: Number(form.category_id),
          brand_id: Number(form.brand_id),
          ...(form.color_id ? { color_id: Number(form.color_id) } : {}),
          ...(Array.isArray(form.color_ids) && form.color_ids.length > 0
            ? { color_ids: form.color_ids.map(Number) }
            : {}),
          is_active: !!form.is_active,
          primary_image_index: Number(form.primary_image_index || 0),
        };
        fd.append("product", new Blob([JSON.stringify(productPayload)], { type: "application/json" }));
        (form.images || []).forEach((file) => fd.append("images", file));
        if (Array.isArray(form.image_alts) && form.image_alts.length > 0) {
          fd.append("image_alts", new Blob([JSON.stringify(form.image_alts)], { type: "application/json" }));
        }

        const res = await fetch(`${API_BASE}/api/admin/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          let errText = "";
          try {
            const j = await res.json();
            errText = JSON.stringify(j);
          } catch {
            errText = await res.text();
          }
          console.error("create product failed", res.status, errText);
          throw new Error("Create failed");
        }
      }
      setModalOpen(false);
      await fetchProducts();
    } catch (err) {
      console.error("submitForm error", err);
      alert("Lưu sản phẩm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- image helpers ----------
  const onImagesChange = (filesList) => {
    const files = Array.from(filesList || []);
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setObjectUrls(newUrls);
    setForm((f) => ({ ...f, images: files, image_alts: files.map(() => ""), primary_image_index: 0 }));
  };

  const setAltAt = (idx, value) => {
    setForm((f) => {
      const alts = Array.isArray(f.image_alts) ? [...f.image_alts] : [];
      alts[idx] = value;
      return { ...f, image_alts: alts };
    });
  };

  const removeImageAt = (idx) => {
    setForm((f) => {
      const images = [...(f.images || [])];
      const alts = [...(f.image_alts || [])];
      images.splice(idx, 1);
      alts.splice(idx, 1);
      if (objectUrls[idx]) URL.revokeObjectURL(objectUrls[idx]);
      const newUrls = objectUrls.filter((_, i) => i !== idx);
      setObjectUrls(newUrls);
      const pi = f.primary_image_index || 0;
      const newPi = pi === idx ? 0 : pi > idx ? pi - 1 : pi;
      return { ...f, images, image_alts: alts, primary_image_index: newPi };
    });
  };

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = modalOpen ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalOpen]);

  // ---------- render ----------
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quản lý sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">Tìm kiếm, lọc, tồn kho, bật/tắt, thêm/sửa/xóa.</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium">Admin Panel</div>
      </div>

      {/* Overview cards - Balanced sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Tổng sản phẩm</div>
          <div className="text-3xl font-bold text-slate-900">{overview.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 p-4 bg-emerald-50 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Đang bán</div>
          <div className="text-3xl font-bold text-emerald-900">{overview.active}</div>
        </div>
        <div className="rounded-xl border border-slate-300 p-4 bg-slate-100 shadow-sm">
          <div className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-1">Ngừng bán</div>
          <div className="text-3xl font-bold text-slate-900">{overview.inactive}</div>
        </div>
        <div className="rounded-xl border border-amber-200 p-4 bg-amber-50 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Tổng tồn kho</div>
          <div className="text-3xl font-bold text-amber-900">{overview.stockTotal.toLocaleString("vi-VN")}</div>
        </div>
        <div className="rounded-xl border border-indigo-200 p-4 bg-indigo-50 shadow-sm">
          <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-1">Giá trị tồn</div>
          <div className="text-xl font-bold text-indigo-900">{currency(overview.inventoryValue)}</div>
        </div>
      </div>

      {/* Top products - Improved spacing */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-700 mb-3">Top sản phẩm (giá trị tồn kho)</div>
        {topProducts.length === 0 ? (
          <div className="text-sm text-slate-500">Không có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium">#</th>
                  <th className="py-2 px-3 font-medium">Tên</th>
                  <th className="py-2 px-3 font-medium text-right">Tồn kho</th>
                  <th className="py-2 px-3 font-medium text-right">Giá</th>
                  <th className="py-2 px-3 font-medium text-right">Giá trị tồn</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => {
                  const priceEff = Number(p.discount_price || p.price || 0);
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="py-2.5 px-3 text-slate-600">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {Number(p.stock_quantity || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{currency(priceEff)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {currency(priceEff * Number(p.stock_quantity || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toolbar - Better alignment */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên, slug, thương hiệu..."
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <select
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id ?? c.value ?? c._id} value={c.id ?? c.value ?? c._id}>
                {c.name ?? c.title ?? c.label ?? c.category_name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((b) => (
              <option key={b.id ?? b.value ?? b._id} value={b.id ?? b.value ?? b._id}>
                {b.name ?? b.title ?? b.label ?? b.brand_name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex gap-2">
          <button
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
            onClick={() => { setQuery(""); setCategoryFilter(""); setBrandFilter(""); /* status giữ trong state, nhưng không dùng filter UI */ }}
          >
            Xóa lọc
          </button>
          <button
            onClick={openCreate}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* Table - Consistent sizing */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-700">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">ID</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Tên</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Giá</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">KM</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Tồn kho</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Danh mục</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Thương hiệu</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                pageData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{currency(p.price)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-700">
                      {p.discount_price ? currency(p.discount_price) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.stock_quantity ?? 0}
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onBlur={(e) => {
                            const v = Number(e.target.value || 0);
                            if (v !== p.stock_quantity) updateStock(p.id, v);
                          }}
                        />
                        <span className="text-xs text-slate-500">({p.stock_quantity ?? 0})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{p.category?.name || p.category_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{p.brand?.name || p.brand_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "px-2.5 py-1 rounded-full text-xs font-semibold inline-block " +
                          (p.is_active
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                            : "bg-slate-200 text-slate-700 ring-1 ring-slate-300")
                        }
                      >
                        {p.is_active ? "Đang bán" : "Ngừng bán"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
                          onClick={() => toggleActive(p)}
                        >
                          {p.is_active ? "Tạm ngừng" : "Mở bán"}
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
                          onClick={() => openEdit(p)}
                        >
                          Sửa
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={() => removeProduct(p.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Better spacing */}
      <div className="flex items-center justify-between mt-5">
        <div className="text-sm text-slate-600">
          Tổng: <span className="font-semibold">{filtered.length}</span> • Trang{" "}
          <span className="font-semibold">{page}</span>/<span className="font-semibold">{totalPages}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5/Trang</option>
            <option value={10}>10/Trang</option>
            <option value={20}>20/Trang</option>
          </select>
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      {/* Modal: Create/Update - Improved form layout */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editing ? "Cập nhật thông tin cơ bản." : "Điền thông tin và tải ảnh sản phẩm."}
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={submitForm} className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        formErrors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"
                      }`}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    {formErrors.name && <p className="text-xs text-red-600 mt-1.5">{formErrors.name}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Giá (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        formErrors.price ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"
                      }`}
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))}
                    />
                    {formErrors.price && <p className="text-xs text-red-600 mt-1.5">{formErrors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Giá KM (VND)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.discount_price}
                      onChange={(e) => setForm((f) => ({ ...f, discount_price: Number(e.target.value || 0) }))}
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tồn kho ban đầu</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.stock_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value || 0) }))}
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                    <textarea
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        formErrors.category_id ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"
                      }`}
                      value={String(form.category_id || "")}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id ?? c.value ?? c._id} value={String(c.id ?? c.value ?? c._id)}>
                          {c.name ?? c.title ?? c.label ?? c.category_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category_id && <p className="text-xs text-red-600 mt-1.5">{formErrors.category_id}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Thương hiệu <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        formErrors.brand_id ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"
                      }`}
                      value={String(form.brand_id || "")}
                      onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))}
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.id ?? b.value ?? b._id} value={String(b.id ?? b.value ?? b._id)}>
                          {b.name ?? b.title ?? b.label ?? b.brand_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.brand_id && <p className="text-xs text-red-600 mt-1.5">{formErrors.brand_id}</p>}
                  </div>

                  {/* Default color */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Màu mặc định</label>
                    <select
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        formErrors.color_id ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"
                      }`}
                      value={String(form.color_id || "")}
                      onChange={(e) => setForm((f) => ({ ...f, color_id: e.target.value }))}
                    >
                      <option value="">-- Chọn màu chính --</option>
                      {colors.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}{c.hex ? ` (${c.hex})` : ""}
                        </option>
                      ))}
                    </select>
                    {formErrors.color_id && <p className="text-xs text-red-600 mt-1.5">{formErrors.color_id}</p>}
                  </div>

                  {/* Color ids */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Danh sách màu (IDs, phân cách bằng dấu phẩy)
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: 1,2,3"
                      value={(form.color_ids || []).join(",")}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          color_ids: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                            .map((x) => Number(x)),
                        }))
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Nếu không có màu, có thể để trống.</p>
                  </div>

                  {/* Images (create only) */}
                  {!editing && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Hình ảnh <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                            formErrors.images
                              ? "border-red-500 focus:ring-red-500"
                              : "border-slate-300 focus:ring-blue-500"
                          }`}
                          onChange={(e) => onImagesChange(e.target.files)}
                        />
                        {formErrors.images && <p className="text-xs text-red-600 mt-1.5">{formErrors.images}</p>}
                        {form.images?.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {form.images.map((file, idx) => (
                              <div
                                key={idx}
                                className={`relative border rounded-lg overflow-hidden ${
                                  form.primary_image_index === idx ? "ring-2 ring-blue-500" : "border-slate-200"
                                }`}
                              >
                                <img src={objectUrls[idx]} alt={`preview-${idx}`} className="w-full h-28 object-cover" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 rounded bg-white/90 border border-slate-200 hover:bg-white font-medium shadow-sm"
                                    onClick={() => setForm((f) => ({ ...f, primary_image_index: idx }))}
                                  >
                                    Ảnh chính
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 rounded bg-white/90 border border-rose-200 text-rose-600 hover:bg-white font-medium shadow-sm"
                                    onClick={() => removeImageAt(idx)}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">Yêu cầu: có ít nhất 1 hình, jpg/png/webp.</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Alt text (image_alts)</label>
                        <div className="space-y-2">
                          {form.images.map((_, idx) => (
                            <input
                              key={idx}
                              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Alt cho ảnh ${idx + 1}`}
                              value={form.image_alts[idx] || ""}
                              onChange={(e) => setAltAt(idx, e.target.value)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.is_active ? "active" : "inactive"}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "active" }))}
                    >
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                </div>

                {/* Footer sticky */}
                <div className="px-6 py-4 border-t bg-slate-50 sticky bottom-0 flex justify-end gap-3 rounded-b-2xl">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-white text-sm font-medium transition-colors"
                    onClick={() => setModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
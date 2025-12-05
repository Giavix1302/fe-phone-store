//ADMPRODUCTs

// src/pages/AdminManagerProduct.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://api.phone.sitedemo.io.vn";
const currency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---------- modal + form ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product object when editing
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(getEmptyForm());

  // preview objectURLs
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
      images: [], // File[]
      image_alts: [], // string[]
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

  // Lấy danh sách màu sắc (đồng bộ với API_BASE và getAdminToken)
  const fetchColors = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/api/admin/colors?page=1&limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        console.warn("fetchColors non-ok", res.status);
        return;
      }
      const json = await res.json();
      // Chuẩn hóa nhiều shape có thể từ BE
      let list = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.data)) list = json.data;
      else if (json?.data?.colors && Array.isArray(json.data.colors)) list = json.data.colors;
      else if (Array.isArray(json.colors)) list = json.colors;
      else if (json?.data?.items && Array.isArray(json.data.items)) list = json.data.items;

      // Chuẩn hóa field hiển thị để tránh option trống "()" 
      const normalized = list.map((c) => ({
        id: c.id ?? c._id ?? c.value,
        name: c.color_name ?? c.name ?? c.title ?? c.label ?? `Màu #${c.id ?? c._id ?? ""}`,
        hex: c.hex_code ?? c.hex ?? c.code ?? "",
      })).filter((c) => c.id); // loại bỏ item không có id

      setColors(normalized);
    } catch (err) {
      console.error("Lỗi fetch colors:", err);
    }
  };

  // load data on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchColors();
    // eslint-disable-next-line
  }, []);

  // refetch when status changes
  useEffect(() => {
    setPage(1);
    fetchProducts();
    // eslint-disable-next-line
  }, [status]);

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
    return list;
  }, [products, query]);

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
    // cleanup previews
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
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price || 0),
      discount_price: Number(product.discount_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      category_id: product.category_id ?? "",
      brand_id: product.brand_id ?? "",
      color_id: product.color_id ?? "",
      color_ids: Array.isArray(product.color_ids) ? product.color_ids.map(String) : [],
      images: [],
      image_alts: [],
      primary_image_index: 0,
      is_active: product.is_active ?? true,
    });
    // do not prefill image files for edit; images handled by separate endpoints
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
    // Bỏ yêu cầu màu mặc định
    // if (!form.color_id) errs.color_id = "Màu mặc định bắt buộc";
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
      const res = await fetch(`${API_BASE}/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: p.name,
          description: p.description || "",
          price: Number(p.price),
          discountPrice: Number(p.discount_price || 0),
          categoryId: Number(p.category_id),
          brandId: Number(p.brand_id),
          colorId: Number(p.color_id),
          isActive: !p.is_active,
        }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
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
          discountPrice: Number(form.discount_price) || 0,
          categoryId: Number(form.category_id),
          brandId: Number(form.brand_id),
          isActive: !!form.is_active,
        };
        if (form.color_id) payload.colorId = Number(form.color_id);

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
          discountPrice: Number(form.discount_price) || 0,
          stockQuantity: Number(form.stock_quantity || 0),
          categoryId: Number(form.category_id),
          brandId: Number(form.brand_id),
          ...(form.color_id ? { colorId: Number(form.color_id) } : {}),
          ...(Array.isArray(form.color_ids) && form.color_ids.length > 0
            ? { colorIds: form.color_ids.map(Number) }
            : {}),
          isActive: !!form.is_active,
          primaryImageIndex: Number(form.primary_image_index || 0),
        };
        fd.append("product", new Blob([JSON.stringify(productPayload)], { type: "application/json" }));

        (form.images || []).forEach((file) => fd.append("images", file));
        if (Array.isArray(form.image_alts) && form.image_alts.length > 0) {
          fd.append("imageAlts", new Blob([JSON.stringify(form.image_alts)], { type: "application/json" }));
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
    // revoke previous object URLs
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
      // cleanup preview URL
      if (objectUrls[idx]) URL.revokeObjectURL(objectUrls[idx]);
      const newUrls = objectUrls.filter((_, i) => i !== idx);
      setObjectUrls(newUrls);
      // adjust primary index
      const pi = f.primary_image_index || 0;
      const newPi = pi === idx ? 0 : pi > idx ? pi - 1 : pi;
      return { ...f, images, image_alts: alts, primary_image_index: newPi };
    });
  };

  // prevent background scroll when modal open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = modalOpen ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalOpen]);

  // ---------- render ----------
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>
        <p className="text-sm text-gray-600">Tìm kiếm, lọc, thêm/sửa/xóa, tồn kho, trạng thái.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên, slug, thương hiệu..."
            className="w-full border rounded-md px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select className="border rounded-md px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>

        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Thêm sản phẩm
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-md bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">KM</th>
              <th className="px-4 py-3">Tồn kho</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Thương hiệu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">Đang tải...</td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">Không có dữ liệu.</td>
              </tr>
            ) : (
              pageData.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">{currency(p.price)}</td>
                  <td className="px-4 py-3 text-green-700">{p.discount_price ? currency(p.discount_price) : "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} defaultValue={p.stock_quantity ?? 0} className="w-20 border rounded px-2 py-1" onBlur={(e) => { const v = Number(e.target.value || 0); if (v !== p.stock_quantity) updateStock(p.id, v); }} />
                      <span className="text-xs text-gray-500">hiện: {p.stock_quantity ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.category?.name || p.category_id}</td>
                  <td className="px-4 py-3 text-sm">{p.brand?.name || p.brand_id}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded text-xs " + (p.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700")}>
                      {p.is_active ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 rounded border hover:bg-gray-100" onClick={() => toggleActive(p)}>{p.is_active ? "Tạm ngừng" : "Mở bán"}</button>
                      <button className="px-3 py-1 rounded border hover:bg-gray-100" onClick={() => openEdit(p)}>Sửa</button>
                      <button className="px-3 py-1 rounded border text-red-600 hover:bg-red-50" onClick={() => removeProduct(p.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Tổng: {filtered.length} • Trang {page}/{totalPages}</div>
        <div className="flex items-center gap-2">
          <select className="border rounded-md px-2 py-1" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={5}>5/Trang</option>
            <option value={10}>10/Trang</option>
            <option value={20}>20/Trang</option>
          </select>
          <button className="px-3 py-1 rounded border hover:bg-gray-100" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Trước</button>
          <button className="px-3 py-1 rounded border hover:bg-gray-100" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau</button>
        </div>
      </div>

      {/* Modal: Create/Update */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-semibold">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
                  <p className="text-xs text-gray-500">{editing ? "Cập nhật thông tin cơ bản." : "Điền thông tin và tải ảnh sản phẩm."}</p>
                </div>
                <button className="px-3 py-1 rounded-md border bg-white hover:bg-gray-100" onClick={() => setModalOpen(false)}>Đóng</button>
              </div>

              <form onSubmit={submitForm} className="flex-1 overflow-y-auto">
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Tên sản phẩm</label>
                    <input className={`w-full border rounded-md px-3 py-2 ${formErrors.name ? "border-red-500" : ""}`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm mb-1">Giá (VND)</label>
                    <input type="number" min={0} className={`w-full border rounded-md px-3 py-2 ${formErrors.price ? "border-red-500" : ""}`} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))} />
                    {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Giá KM (VND)</label>
                    <input type="number" min={0} className="w-full border rounded-md px-3 py-2" value={form.discount_price} onChange={(e) => setForm((f) => ({ ...f, discount_price: Number(e.target.value || 0) }))} />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm mb-1">Tồn kho ban đầu</label>
                    <input type="number" min={0} className="w-full border rounded-md px-3 py-2" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value || 0) }))} />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Mô tả</label>
                    <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm mb-1">Danh mục</label>
                    <select className={`w-full border rounded-md px-3 py-2 ${formErrors.category_id ? "border-red-500" : ""}`} value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id ?? c.value ?? c._id} value={c.id ?? c.value ?? c._id}>
                          {c.name ?? c.title ?? c.label ?? c.category_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category_id && <p className="text-xs text-red-600 mt-1">{formErrors.category_id}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm mb-1">Thương hiệu</label>
                    <select className={`w-full border rounded-md px-3 py-2 ${formErrors.brand_id ? "border-red-500" : ""}`} value={form.brand_id} onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))}>
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.id ?? b.value ?? b._id} value={b.id ?? b.value ?? b._id}>
                          {b.name ?? b.title ?? b.label ?? b.brand_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.brand_id && <p className="text-xs text-red-600 mt-1">{formErrors.brand_id}</p>}
                  </div>

                  {/* Default color */}
                  <div>
                    <label className="block text-sm mb-1">Màu mặc định</label>
                    <select
                      className={`w-full border rounded-md px-3 py-2 ${formErrors.color_id ? "border-red-500" : ""}`}
                      value={form.color_id}
                      onChange={(e) => setForm((f) => ({ ...f, color_id: Number(e.target.value) }))}
                    >
                      <option value="">-- Chọn màu chính --</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.hex ? ` (${c.hex})` : ""}
                        </option>
                      ))}
                    </select>
                    {formErrors.color_id && <p className="text-xs text-red-600 mt-1">{formErrors.color_id}</p>}
                  </div>

                  {/* Color ids (chỉ input ID, bỏ dropdown) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Danh sách màu (IDs, phân cách bằng dấu phẩy)</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
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
                    <p className="text-xs text-gray-500 mt-1">Nếu không có màu, có thể để trống.</p>
                  </div>

                  {/* Images (create only) */}
                  {!editing && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Hình ảnh (chọn nhiều)</label>
                        <input type="file" multiple accept="image/*" className={`w-full border rounded-md px-3 py-2 ${formErrors.images ? "border-red-500" : ""}`} onChange={(e) => onImagesChange(e.target.files)} />
                        {formErrors.images && <p className="text-xs text-red-600 mt-1">{formErrors.images}</p>}

                        {form.images?.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {form.images.map((file, idx) => (
                              <div key={idx} className={`relative border rounded-md overflow-hidden ${form.primary_image_index === idx ? "ring-2 ring-blue-500" : ""}`}>
                                <img src={objectUrls[idx]} alt={`preview-${idx}`} className="w-full h-24 object-cover" />
                                <div className="absolute top-1 right-1 flex gap-1">
                                  <button type="button" className="text-xs px-2 py-1 rounded bg-white/80 border" onClick={() => setForm((f) => ({ ...f, primary_image_index: idx }))}>Ảnh chính</button>
                                  <button type="button" className="text-xs px-2 py-1 rounded bg-white/80 border text-red-600" onClick={() => removeImageAt(idx)}>Xóa</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">Yêu cầu: có ít nhất 1 hình, jpg/png/webp.</p>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Alt text (image_alts)</label>
                        <div className="space-y-2">
                          {form.images.map((_, idx) => (
                            <input key={idx} className="w-full border rounded-md px-3 py-2" placeholder={`Alt cho ảnh ${idx + 1}`} value={form.image_alts[idx] || ""} onChange={(e) => setAltAt(idx, e.target.value)} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm mb-1">Trạng thái</label>
                    <select className="w-full border rounded-md px-3 py-2" value={form.is_active ? "active" : "inactive"} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "active" }))}>
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                </div>

                {/* footer sticky */}
                <div className="px-6 py-4 border-t bg-gray-50 sticky bottom-0 flex justify-end gap-3">
                  <button type="button" className="px-4 py-2 rounded-md border hover:bg-gray-100" onClick={() => setModalOpen(false)}>Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

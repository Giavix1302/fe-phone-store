import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/apiConfig";

const getAdminToken = () => localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: `Bearer ${getAdminToken()}`,
  "Content-Type": "application/json",
});

const AdminCategoryBrandColor = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [stats, setStats] = useState({ byCategory: [], byBrand: [], byColor: [] });

  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({ open: false, type: "", entity: null });

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, colorRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/admin/brands`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/admin/colors`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/admin/products/stats`, { headers: authHeaders() }),
      ]);
      const catJson = await catRes.json();
      const brandJson = await brandRes.json();
      const colorJson = await colorRes.json();
      const statsJson = await statsRes.json();

      setCategories(catJson.data || []);
      setBrands(brandJson.data || []);
      setColors(colorJson.data || []);
      setStats(statsJson.data || { byCategory: [], byBrand: [], byColor: [] });
    } catch (err) {
      console.error("❌ Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await fetch(`${API_BASE_URL}/admin/${type}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      fetchAllData();
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  const openModal = (type, entity = null) => setModal({ open: true, type, entity });
  const closeModal = () => setModal({ open: false, type: "", entity: null });

  const saveEntity = async (type, data) => {
    try {
      const method = data.id ? "PUT" : "POST";
      const url = data.id
        ? `${API_BASE_URL}/admin/${type}/${data.id}`
        : `${API_BASE_URL}/admin/${type}`;
      await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(data) });
      fetchAllData();
      closeModal();
    } catch (err) {
      console.error("❌ Save error:", err);
    }
  };

  if (loading) return <div className="p-6 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🛠 Quản lý Danh mục - Thương hiệu - Màu sắc</h1>

      {/* Categories Section */}
      <Section title="Danh mục sản phẩm" onAdd={() => openModal("categories")}>
        <EntityTable
          data={categories}
          columns={["Tên danh mục"]}
          onEdit={(c) => openModal("categories", c)}
          onDelete={(c) => handleDelete("categories", c.id)}
        />
        <StatList
          title="Số sản phẩm theo danh mục"
          stats={stats.byCategory}
          keyLabel="name"
          valueLabel="count"
        />
      </Section>

      {/* Brands Section */}
      <Section title="Thương hiệu" onAdd={() => openModal("brands")}>
        <EntityTable
          data={brands}
          columns={["Tên thương hiệu"]}
          onEdit={(b) => openModal("brands", b)}
          onDelete={(b) => handleDelete("brands", b.id)}
        />
        <StatList
          title="Số sản phẩm theo thương hiệu"
          stats={stats.byBrand}
          keyLabel="name"
          valueLabel="count"
        />
      </Section>

      {/* Colors Section */}
      <Section title="Màu sắc" onAdd={() => openModal("colors")}>
        <EntityTable
          data={colors}
          columns={["Tên màu", "Mã màu"]}
          onEdit={(c) => openModal("colors", c)}
          onDelete={(c) => handleDelete("colors", c.id)}
        />
        <StatList
          title="Mức độ sử dụng màu"
          stats={stats.byColor}
          keyLabel="name"
          valueLabel="count"
          showProgress
        />
      </Section>

      {/* Modal */}
      {modal.open && (
        <Modal
          type={modal.type}
          entity={modal.entity}
          onClose={closeModal}
          onSave={saveEntity}
        />
      )}
    </div>
  );
};

const Section = ({ title, onAdd, children }) => (
  <div className="mb-8 bg-white rounded-lg p-4 shadow">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      <button
        onClick={onAdd}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Thêm
      </button>
    </div>
    {children}
  </div>
);

const EntityTable = ({ data, columns, onEdit, onDelete }) => (
  <table className="w-full table-auto border-collapse border">
    <thead>
      <tr className="bg-gray-100">
        {columns.map((col) => (
          <th key={col} className="border px-2 py-1 text-left">{col}</th>
        ))}
        <th className="border px-2 py-1 text-left">Hành động</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id} className="hover:bg-gray-50">
          {columns.map((col, idx) => (
            <td key={idx} className="border px-2 py-1">{row[col.toLowerCase()]}</td>
          ))}
          <td className="border px-2 py-1 space-x-2">
            <button onClick={() => onEdit(row)} className="text-blue-600">Sửa</button>
            <button onClick={() => onDelete(row)} className="text-red-600">Xóa</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StatList = ({ title, stats, keyLabel, valueLabel, showProgress }) => (
  <div className="mt-4">
    <div className="font-medium mb-2">{title}</div>
    <div className="space-y-2">
      {stats.map((s) => {
        const percent = showProgress && s.total ? Math.round((s[valueLabel] / s.total) * 100) : null;
        return (
          <div key={s[keyLabel]}>
            <div className="flex justify-between text-sm">
              <span>{s[keyLabel]}</span>
              <span>{s[valueLabel]}</span>
            </div>
            {showProgress && (
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-500 rounded" style={{ width: `${percent}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const Modal = ({ type, entity, onClose, onSave }) => {
  const [form, setForm] = useState(entity || { name: "", code: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(type, form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">{entity ? "Sửa" : "Thêm"} {type}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Tên</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          {type === "colors" && (
            <div>
              <label className="block text-sm mb-1">Mã màu</label>
              <input
                type="color"
                name="code"
                value={form.code || "#ffffff"}
                onChange={handleChange}
                className="w-20 h-10 border rounded p-1"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Hủy</button>
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategoryBrandColor;

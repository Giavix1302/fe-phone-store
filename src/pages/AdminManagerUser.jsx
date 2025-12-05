import { useEffect, useState, useMemo } from "react";
import { getAdminUsersAll } from "../services/UserApi";

const badgeColor = (enabled) =>
  enabled ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

export default function AdminManagerUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "enabled" | "disabled"

  // Load all users
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const all = await getAdminUsersAll({ limit: 100 });
        setUsers(all);
      } catch (e) {
        console.error(e);
        setError(e.message || "Không thể tải danh sách người dùng");
        setUsers([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Thống kê đơn giản dựa trên dữ liệu getAll (client-side)
  const overview = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => !!u.enabled).length;
    const disabled = total - active;
    const withOrders = users.filter((u) => Number(u.total_orders || 0) > 0).length;
    const totalSpent = users.reduce((sum, u) => sum + Number(u.total_spent || 0), 0);
    return { total, active, disabled, withOrders, totalSpent };
  }, [users]);

  const topCustomers = useMemo(() => {
    return [...users]
      .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
      .slice(0, 5);
  }, [users]);

  // Lọc bảng (client-side)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const okRole = roleFilter ? u.role === roleFilter : true;
      const okStatus =
        statusFilter === ""
          ? true
          : statusFilter === "enabled"
          ? !!u.enabled
          : !u.enabled;
      return okRole && okStatus;
    });
  }, [users, roleFilter, statusFilter]);

  const formatNumber = (n) => Number(n || 0).toLocaleString("vi-VN");
  const formatCurrency = (n) => `${Number(n || 0).toLocaleString("vi-VN")} ₫`;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500">Tổng quan và danh sách (tính từ dữ liệu Get All).</p>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg bg-slate-200 text-slate-700">Admin Panel</div>
      </div>

      {/* Thống kê đơn giản từ getAll */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
            <div className="text-sm text-slate-600">Tổng người dùng</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(overview.total)}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50">
            <div className="text-sm text-emerald-700">Đang hoạt động</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{formatNumber(overview.active)}</div>
          </div>
          <div className="rounded-lg border border-rose-200 p-4 bg-rose-50">
            <div className="text-sm text-rose-700">Bị vô hiệu hóa</div>
            <div className="text-2xl font-bold text-rose-900 mt-1">{formatNumber(overview.disabled)}</div>
          </div>
          <div className="rounded-lg border border-amber-200 p-4 bg-amber-50">
            <div className="text-sm text-amber-700">Có đơn hàng</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{formatNumber(overview.withOrders)}</div>
          </div>
          <div className="rounded-lg border border-indigo-200 p-4 bg-indigo-50">
            <div className="text-sm text-indigo-700">Tổng đã chi</div>
            <div className="text-2xl font-bold text-indigo-900 mt-1">{formatCurrency(overview.totalSpent)}</div>
          </div>
        </div>

        {/* Top khách hàng (từ getAll) */}
        <div className="rounded-lg border border-slate-200 p-4 bg-white mt-4">
          <div className="text-sm text-slate-600 mb-2">Top khách hàng</div>
          {topCustomers.length === 0 ? (
            <div className="text-slate-500">Không có dữ liệu</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">#</th>
                    <th className="p-2">Họ tên</th>
                    <th className="p-2">Đơn hàng</th>
                    <th className="p-2">Đã chi</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((u, idx) => (
                    <tr key={u.id ?? `${u.email}-${idx}`} className="border-t border-slate-200">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{u.full_name}</td>
                      <td className="p-2">{formatNumber(u.total_orders || 0)}</td>
                      <td className="p-2 font-medium text-slate-800">{formatCurrency(u.total_spent || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bộ lọc client-side (vai trò + trạng thái) */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Vai trò</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Trạng thái</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setRoleFilter("");
              setStatusFilter("");
            }}
            className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {loading ? (
        <div className="text-center py-10 text-slate-600">Đang tải...</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <table className="w-full">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-slate-700">
                <th className="p-3">Họ tên</th>
                <th className="p-3">Email</th>
                <th className="p-3">SĐT</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Đơn hàng</th>
                <th className="p-3">Đã chi</th>
                <th className="p-3">Lần đăng nhập cuối</th>
                <th className="p-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-slate-500">Không có người dùng</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200 hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-800">{u.full_name}</td>
                    <td className="p-3 text-slate-700">{u.email}</td>
                    <td className="p-3 text-slate-700">{u.phone || "-"}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">{u.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor(u.enabled)}`}>
                        {u.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{u.total_orders ?? 0}</td>
                    <td className="p-3 text-slate-800">{Number(u.total_spent || 0).toLocaleString()} ₫</td>
                    <td className="p-3 text-slate-700">
                      {u.last_login ? new Date(u.last_login).toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="p-3 text-slate-700">
                      {u.created_at ? new Date(u.created_at).toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
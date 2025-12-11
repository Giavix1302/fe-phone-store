import { useEffect, useState, useMemo } from "react";
import { getAdminUsersAll, getAdminUserDetail, updateAdminUserStatus } from "../services/UserApi";

const badgeColor = (enabled) =>
  enabled ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

export default function AdminManagerUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "enabled" | "disabled"
  const [updatingId, setUpdatingId] = useState(null);

  // Detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Load all users
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const all = await getAdminUsersAll({ limit: 100 });
        // CHỈ lấy khách hàng (USER), bỏ ADMIN
        const onlyUsers = Array.isArray(all) ? all.filter((u) => u.role === "USER") : [];
        setUsers(onlyUsers);
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

  const openDetail = async (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      // Gọi đúng BE: GET /api/admin/users/{user_id}
      const data = await getAdminUserDetail(user.id);
      // Chuẩn hóa dữ liệu cần thiết, bỏ trường không dùng
      const d = data || {};
      const user_info = d.user_info || {};
      const statistics = d.statistics || {};
      const recent_orders = Array.isArray(d.recent_orders) ? d.recent_orders : [];

      setDetailData({
        user_info: {
          id: user_info.id,
          email: user_info.email,
          full_name: user_info.full_name,
          phone: user_info.phone,
          address: user_info.address,
          role: user_info.role,
          enabled: !!user_info.enabled,
          created_at: user_info.created_at,
          last_login: user_info.last_login,
        },
        statistics: {
          total_orders: statistics.total_orders ?? 0,
          completed_orders: statistics.completed_orders ?? 0,
          cancelled_orders: statistics.cancelled_orders ?? 0,
          total_spent: statistics.total_spent ?? 0,
          average_order_value: statistics.average_order_value ?? 0,
        },
        recent_orders,
      });
    } catch (e) {
      console.error(e);
      // Fallback nhẹ nhàng từ bản ghi list nếu BE lỗi
      setDetailData({
        user_info: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          enabled: !!user.enabled,
          created_at: user.created_at,
          last_login: user.last_login,
        },
        statistics: {
          total_orders: user.total_orders ?? 0,
          completed_orders: undefined,
          cancelled_orders: undefined,
          total_spent: user.total_spent ?? 0,
          average_order_value:
            (Number(user.total_spent || 0) / Math.max(1, Number(user.total_orders || 0))) || 0,
        },
        recent_orders: [],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStatus = async (user, nextEnabled) => {
    if (!user?.id) return;
    setUpdatingId(user.id);
    try {
      await updateAdminUserStatus(user.id, nextEnabled, nextEnabled ? "enable-by-admin" : "disable-by-admin");
      // update list locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: nextEnabled } : u))
      );
      // update detail if open
      if (selectedUser?.id === user.id) {
        setSelectedUser((u) => (u ? { ...u, enabled: nextEnabled } : u));
        setDetailData((d) =>
          d
            ? {
                ...d,
                user_info: { ...(d.user_info || {}), enabled: nextEnabled },
              }
            : d
        );
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Không thể cập nhật trạng thái người dùng");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500"></p>
        </div>
        
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
            <option value="">Tất cả vai trò (USER)</option>
            <option value="USER">USER</option>
            {/* Không cho chọn ADMIN */}
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
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-slate-500">Không có người dùng</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200 hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-800">
                      {/* click tên để xem chi tiết */}
                      <button
                        className="text-indigo-700 hover:text-indigo-900 font-medium"
                        onClick={() => openDetail(u)}
                        title="Xem chi tiết"
                      >
                        {u.full_name}
                      </button>
                    </td>
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
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-1.5 text-xs rounded-md border border-slate-300 hover:bg-slate-100"
                          onClick={() => openDetail(u)}
                        >
                          Xem
                        </button>
                        <button
                          className={`px-3 py-1.5 text-xs rounded-md border ${
                            u.enabled
                              ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          } disabled:opacity-50`}
                          onClick={() => toggleStatus(u, !u.enabled)}
                          disabled={updatingId === u.id}
                        >
                          {u.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer chi tiết user */}
      {detailOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[680px] bg-white shadow-2xl p-0 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-indigo-100 grid place-items-center text-indigo-700 font-semibold">
                  {selectedUser?.full_name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {selectedUser?.full_name || "Khách hàng"}
                  </div>
                  <div className="text-xs text-slate-500">{selectedUser?.email}</div>
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700"
                onClick={() => setDetailOpen(false)}
              >
                Đóng
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 text-slate-600">Đang tải...</div>
            ) : !detailData ? (
              <div className="p-6 text-rose-600">Không thể lấy chi tiết user</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Info card */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <div className="font-medium text-slate-800">Thông tin khách hàng</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        detailData.user_info?.enabled
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                      }`}
                    >
                      {detailData.user_info?.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Removed avatar image, dùng badge chữ cái đầu */}
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-indigo-100 grid place-items-center text-indigo-700 font-semibold">
                        {(detailData.user_info?.full_name?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-900 font-medium">{detailData.user_info?.full_name}</div>
                        <div className="text-slate-600 text-sm">{detailData.user_info?.email}</div>
                        <div className="text-slate-600 text-sm">{detailData.user_info?.phone}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="text-slate-700 text-sm">{detailData.user_info?.address || "-"}</div>
                      <div className="text-xs text-slate-500">
                        Tạo: {detailData.user_info?.created_at ? new Date(detailData.user_info.created_at).toLocaleString("vi-VN") : "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Đăng nhập cuối: {detailData.user_info?.last_login ? new Date(detailData.user_info.last_login).toLocaleString("vi-VN") : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs text-slate-500">Tổng đơn</div>
                    <div className="text-xl font-semibold text-slate-900">
                      {detailData.statistics?.total_orders ?? 0}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50">
                    <div className="text-xs text-emerald-700">Hoàn tất</div>
                    <div className="text-xl font-semibold text-emerald-900">
                      {detailData.statistics?.completed_orders ?? 0}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-200 p-4 bg-rose-50">
                    <div className="text-xs text-rose-700">Hủy</div>
                    <div className="text-xl font-semibold text-rose-900">
                      {detailData.statistics?.cancelled_orders ?? 0}
                    </div>
                  </div>
                  <div className="rounded-lg border border-indigo-200 p-4 bg-indigo-50">
                    <div className="text-xs text-indigo-700">Đã chi</div>
                    <div className="text-xl font-semibold text-indigo-900">
                      {(detailData.statistics?.total_spent ?? 0).toLocaleString("vi-VN")} ₫
                    </div>
                    <div className="text-[11px] text-indigo-700 mt-1">
                      TB đơn: {(detailData.statistics?.average_order_value ?? 0).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>

                {/* Recent orders table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 font-medium text-slate-800">Đơn hàng gần đây</div>
                  {Array.isArray(detailData.recent_orders) && detailData.recent_orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-slate-600 text-sm">
                            <th className="p-3">Mã đơn</th>
                            <th className="p-3">Tổng</th>
                            <th className="p-3">Trạng thái</th>
                            <th className="p-3">Ngày tạo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.recent_orders.map((o) => (
                            <tr key={o.id} className="border-t border-slate-200">
                              <td className="p-3 font-medium text-slate-800">{o.order_number}</td>
                              <td className="p-3 text-slate-800">{Number(o.total_amount || 0).toLocaleString("vi-VN")} ₫</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    o.status === "DELIVERED"
                                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                                      : o.status === "CANCELLED"
                                      ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700">
                                {o.created_at ? new Date(o.created_at).toLocaleString("vi-VN") : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-slate-500">Không có dữ liệu</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
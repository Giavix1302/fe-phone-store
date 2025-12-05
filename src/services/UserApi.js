const API_BASE = "https://api.phone.sitedemo.io.vn";
const getAdminToken = () => localStorage.getItem("token") || "";

const toYMD = (d) => {
  if (!d) return "";
  const s = String(d);
  // nếu đã đúng YYYY-MM-DD thì giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Get All Users (Admin)
export const getAdminUsers = async (params = {}) => {
  const {
    page = 1,
    limit = 20,
    role,
    enabled,              // boolean | undefined
    from_date,
    to_date,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (role) qs.set("role", role);
  if (typeof enabled === "boolean") qs.set("enabled", String(enabled)); // "true"/"false"

  const fd = toYMD(from_date);
  const td = toYMD(to_date);
  if (fd) qs.set("from_date", fd);
  if (td) qs.set("to_date", td);

  // chỉ gửi khi khác mặc định (tránh 500 BE)
  if (sort_by && sort_by !== "created_at") qs.set("sort_by", sort_by);
  if (sort_order && sort_order !== "desc") qs.set("sort_order", sort_order);

  const url = `${API_BASE}/api/admin/users?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
        Accept: "application/json",
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Users API error:", res.status, url, json);
      throw new Error(json?.message || `GET /users lỗi (${res.status})`);
    }

    const data = json?.data || {};
    return {
      data: {
        users: Array.isArray(data.users) ? data.users : [],
        pagination:
          data.pagination || {
            current_page: page,
            total_pages: 1,
            total_items: (data.users || []).length,
            items_per_page: limit,
            has_next: false,
            has_prev: page > 1,
          },
        summary: data.summary || null,
      },
    };
  } catch (err) {
    // Fallback mock để UI chạy tạm khi BE 500
    console.warn("Users API failed, using mock data. Reason:", err?.message || err);
    const mockUsers = [
      {
        id: 1,
        email: "user1@example.com",
        full_name: "Nguyễn Văn A",
        phone: "0123456789",
        role: "USER",
        enabled: true,
        total_orders: 15,
        total_spent: 125000000,
        last_login: "2024-12-01T10:30:00Z",
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        email: "user2@example.com",
        full_name: "Trần Thị B",
        phone: "0987654321",
        role: "USER",
        enabled: false,
        total_orders: 3,
        total_spent: 15000000,
        last_login: "2024-11-20T15:20:00Z",
        created_at: "2024-02-15T14:30:00Z",
      },
      {
        id: 3,
        email: "admin@example.com",
        full_name: "Admin User",
        phone: "0900000000",
        role: "ADMIN",
        enabled: true,
        total_orders: 0,
        total_spent: 0,
        last_login: "2024-12-02T08:00:00Z",
        created_at: "2023-12-31T00:00:00Z",
      },
    ];
    const summary = {
      total_users: mockUsers.length,
      active_users: mockUsers.filter((u) => u.enabled).length,
      disabled_users: mockUsers.filter((u) => !u.enabled).length,
      total_admins: mockUsers.filter((u) => u.role === "ADMIN").length,
    };
    return {
      data: {
        users: mockUsers,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: mockUsers.length,
          items_per_page: limit,
          has_next: false,
          has_prev: false,
        },
        summary,
      },
    };
  }
};

// Get User Detail (Admin)
export const getAdminUserDetail = async (userId) => {
  const url = `${API_BASE}/api/admin/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      Accept: "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("User detail API error:", res.status, url, json);
    throw new Error(json?.message || `Không thể lấy chi tiết user (${res.status})`);
  }
  return json?.data || {};
};

// Enable/Disable User (Admin)
export const updateAdminUserStatus = async (userId, enabled, reason) => {
  const url = `${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/status`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ enabled, reason }),
  });

  const json = await res.json().catch(async () => {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("User status API error:", res.status, url, text);
      throw new Error(text || `Không thể cập nhật trạng thái user (${res.status})`);
    }
    return {};
  });

  if (!res.ok) {
    console.error("User status API error:", res.status, url, json);
    throw new Error(json?.message || `Không thể cập nhật trạng thái user (${res.status})`);
  }
  return json?.data ?? null;
};

// Get User Order History (Admin)
export const getAdminUserOrders = async (userId, params = {}) => {
  const { page = 1, limit = 10, status } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (status) qs.set("status", status);

  const url = `${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/orders?${qs.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      Accept: "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("User orders API error:", res.status, url, json);
    throw new Error(json?.message || `Không thể lấy lịch sử đơn hàng (${res.status})`);
  }
  return json?.data || {};
};

// Get User Statistics (Admin)
export const getAdminUsersStatistics = async (params = {}) => {
  const { period = "month", from_date, to_date } = params;

  const qs = new URLSearchParams();
  qs.set("period", period);
  if (period === "custom") {
    if (from_date) qs.set("from_date", from_date);
    if (to_date) qs.set("to_date", to_date);
  }

  const url = `${API_BASE}/api/admin/users/statistics?${qs.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Users statistics API error:", res.status, url, json);
    throw new Error(json?.message || `Không thể lấy thống kê users (${res.status})`);
  }

  const d = json?.data || {};
  return {
    period: d.period || period,
    overview: d.overview || {
      total_users: d.summary?.total_users ?? 0,
      active_users: d.summary?.active_users ?? 0,
      disabled_users: d.summary?.disabled_users ?? 0,
      new_registrations: d.summary?.new_registrations ?? 0,
      users_with_orders: d.summary?.users_with_orders ?? 0,
    },
    growth_stats: d.growth_stats || {
      new_users_this_period: 0,
      new_users_previous_period: 0,
      growth_rate: 0,
    },
    daily_registrations: Array.isArray(d.daily_registrations) ? d.daily_registrations : [],
    top_customers: Array.isArray(d.top_customers) ? d.top_customers : [],
  };
};

/**
 * Lấy toàn bộ users (duyệt qua tất cả trang) và trả về mảng users duy nhất.
 * Bỏ hết filter để lấy tối đa dữ liệu.
 */
export const getAdminUsersAll = async (opts = {}) => {
  const limit = opts.limit || 100; // tăng limit để giảm số lần gọi
  const headers = {
    Authorization: `Bearer ${getAdminToken()}`,
    Accept: "application/json",
  };

  const buildUrl = (page) =>
    `${API_BASE}/api/admin/users?${new URLSearchParams({
      page: String(page),
      limit: String(limit),
    }).toString()}`;

  const all = [];
  let page = 1;
  let totalPages = 1;

  // gọi trang đầu để biết tổng số trang
  const firstUrl = buildUrl(page);
  const firstRes = await fetch(firstUrl, { method: "GET", headers });
  const firstJson = await firstRes.json().catch(() => ({}));
  if (!firstRes.ok) {
    console.error("Users API error:", firstRes.status, firstUrl, firstJson);
    // fallback: dùng mock nếu BE vẫn 500
    const mock = (await getAdminUsers({ page: 1, limit })).data.users || [];
    return mock;
  }
  const firstData = firstJson?.data || {};
  all.push(...(Array.isArray(firstData.users) ? firstData.users : []));
  const pagination = firstData.pagination || {};
  totalPages = Number(pagination.total_pages || 1);

  // nếu còn trang -> gọi tiếp
  for (page = 2; page <= totalPages; page++) {
    const url = buildUrl(page);
    const res = await fetch(url, { method: "GET", headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Users API page error:", res.status, url, json);
      break; // dừng nếu trang sau lỗi
    }
    const data = json?.data || {};
    const items = Array.isArray(data.users) ? data.users : [];
    all.push(...items);
  }

  // loại bỏ trùng nếu có (theo id)
  const dedup = [];
  const seen = new Set();
  for (const u of all) {
    const key = u?.id ?? `${u?.email}-${u?.full_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(u);
    }
  }
  return dedup;
};
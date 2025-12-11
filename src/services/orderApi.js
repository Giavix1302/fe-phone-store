// =======================
// CLIENT ORDER API
// =======================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Tạo đơn hàng từ giỏ hàng
 */
export const createOrder = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để tạo đơn hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      shipping_address: payload.shipping_address,
      payment_method: payload.payment_method || "COD",
      note: payload.note || null,
      cart_item_ids: payload.cart_item_ids || null,
      buy_now_items: payload.buy_now_items || null,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message || "Không thể tạo đơn hàng. Vui lòng thử lại sau."
    );
  }

  return result?.data || null;
};

/**
 * Lấy danh sách đơn hàng người dùng
 */
export const getUserOrders = async (params = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để xem đơn hàng.");
  }

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.status) queryParams.append("status", params.status);
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);
  if (params.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params.sort_order) queryParams.append("sort_order", params.sort_order);

  const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.message || "Không thể lấy danh sách đơn hàng.");
  }

  return result?.data || null;
};
export const fetchUserOrders = getUserOrders;

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderDetail = async (orderNumber) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để xem chi tiết đơn hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.message || "Không thể lấy chi tiết đơn hàng.");
  }

  return result?.data || null;
};
export const fetchOrderDetail = getOrderDetail;

/**
 * Hủy đơn hàng
 */
export const cancelOrder = async (orderNumber, payload = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để hủy đơn hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.message || "Không thể hủy đơn hàng.");
  }

  return result?.data || null;
};

// =======================
// ADMIN ORDER API
// =======================

const API_BASE = "http://localhost:8080";
const getAdminToken = () => localStorage.getItem("token") || "";

/**
 * Admin – lấy tất cả đơn hàng
 */
export const getAdminOrders = async (params = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    user_id,
    from_date,
    to_date,
    search,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (status) qs.set("status", status);
  if (user_id != null) qs.set("user_id", String(user_id));
  if (from_date) qs.set("from_date", from_date);
  if (to_date) qs.set("to_date", to_date);
  if (search) qs.set("search", search);
  if (sort_by) qs.set("sort_by", sort_by);
  if (sort_order) qs.set("sort_order", sort_order);

  const res = await fetch(`${API_BASE}/api/admin/orders?${qs.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      json?.message || `Không thể lấy danh sách đơn hàng (${res.status})`
    );
  }

  const data = json?.data || {};
  const orders = Array.isArray(data.orders) ? data.orders : [];

  const pagination = data.pagination || {
    current_page: page,
    total_pages: 1,
    total_items: orders.length,
    items_per_page: limit,
    has_next: false,
    has_prev: page > 1,
  };

  const summary = data.summary || null;

  return { data: { orders, pagination, summary } };
};

/**
 * Admin – cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (orderNumber, payload) => {
  const safeOrder = encodeURIComponent(orderNumber);

  if (payload?.estimated_delivery) {
    const d = new Date(payload.estimated_delivery);
    if (!isNaN(d.getTime())) {
      payload.estimated_delivery = d.toISOString();
    }
  }

  const res = await fetch(`${API_BASE}/api/admin/orders/${safeOrder}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        text || `Không thể cập nhật trạng thái đơn hàng (${res.status})`
      );
    return null;
  }

  if (!res.ok) {
    throw new Error(
      json?.message || `Không thể cập nhật trạng thái đơn hàng (${res.status})`
    );
  }

  return json?.data ?? null;
};

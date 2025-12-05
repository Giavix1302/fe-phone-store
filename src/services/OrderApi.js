import axios from "./axiosClient";

const API_BASE = "https://api.phone.sitedemo.io.vn";
const getAdminToken = () => localStorage.getItem("token") || "";

/**
 * Get all orders (Admin)
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
    throw new Error(json?.message || `Không thể lấy danh sách đơn hàng (${res.status})`);
  }

  const data = json?.data || {};
  const orders = Array.isArray(data.orders) ? data.orders : [];
  const pagination =
    data.pagination ||
    {
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
 * Update Order Status (Admin)
 * PUT /api/admin/orders/{order_number}/status
 * payload: { status, note?, tracking_number?, shipping_partner?, estimated_delivery? }
 */
export const updateOrderStatus = async (orderNumber, payload) => {
  const safeOrder = encodeURIComponent(orderNumber);

  if (payload?.estimated_delivery) {
    const d = new Date(payload.estimated_delivery);
    if (!isNaN(d.getTime())) {
      payload.estimated_delivery = d.toISOString(); // "2024-12-05T17:00:00.000Z"
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
    if (!res.ok) throw new Error(text || `Không thể cập nhật trạng thái đơn hàng (${res.status})`);
    return null;
  }

  if (!res.ok) {
    throw new Error(json?.message || `Không thể cập nhật trạng thái đơn hàng (${res.status})`);
  }
  return json?.data ?? null;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Tạo đơn hàng từ giỏ hàng
 * POST /api/orders
 * @param {{ shipping_address: string; payment_method?: string; note?: string; cart_item_ids?: number[] }} payload
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
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể tạo đơn hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Lấy danh sách đơn hàng của người dùng
 * GET /api/orders
 * @param {{ page?: number; limit?: number; status?: string; from_date?: string; to_date?: string; sort_by?: string; sort_order?: string }} params
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
    const message =
      result?.message || "Không thể lấy danh sách đơn hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

// Alias for backward compatibility
export const fetchUserOrders = getUserOrders;

/**
 * Lấy chi tiết đơn hàng
 * GET /api/orders/{order_number}
 * @param {string} orderNumber
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
    const message =
      result?.message || "Không thể lấy chi tiết đơn hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

// Alias for backward compatibility
export const fetchOrderDetail = getOrderDetail;

/**
 * Hủy đơn hàng
 * POST /api/orders/{order_number}/cancel
 * @param {string} orderNumber
 * @param {{ reason?: string }} payload
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
    const message =
      result?.message || "Không thể hủy đơn hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};


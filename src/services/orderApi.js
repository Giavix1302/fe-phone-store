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
 * @param {{ page?: number; limit?: number; status?: string }} params
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

  const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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


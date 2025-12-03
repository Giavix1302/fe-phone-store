const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/cart/items
 * @param {{ product_id: number; color_id: number; quantity: number }} payload
 */
export const addToCart = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      product_id: payload.product_id,
      color_id: payload.color_id,
      quantity: payload.quantity,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Lấy giỏ hàng của người dùng
 * GET /api/cart
 */
export const getCart = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để xem giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể lấy thông tin giỏ hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};


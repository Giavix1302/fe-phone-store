const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/cart/items (nếu đã đăng nhập)
 * Hoặc lưu vào localStorage (nếu chưa đăng nhập - guest cart)
 * @param {{ product_id: number; color_id: number; quantity: number }} payload
 */
export const addToCart = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    const { addToGuestCart } = await import("../utils/guestCart");
    const cart = addToGuestCart(payload);
    return { items: cart, isGuest: true };
  }

  // Authenticated user - call API
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
 * GET /api/cart (nếu đã đăng nhập)
 * Hoặc trả về guest cart từ localStorage (nếu chưa đăng nhập)
 */
export const getCart = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    const { getGuestCart } = await import("../utils/guestCart");
    const guestCart = getGuestCart();
    
    return {
      items: guestCart.map((item, index) => ({
        id: `guest-${index}`,
        product_id: item.product_id,
        color_id: item.color_id,
        quantity: item.quantity,
      })),
      total_items: guestCart.length,
      total_quantity: guestCart.reduce((sum, item) => sum + item.quantity, 0),
      isGuest: true,
    };
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

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * PUT /api/cart/items/{item_id}/quantity
 * @param {number} itemId
 * @param {number} quantity
 */
export const updateQuantity = async (itemId, quantity) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để cập nhật giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}/quantity`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      quantity: quantity,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể cập nhật số lượng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Cập nhật màu sắc sản phẩm trong giỏ hàng
 * PUT /api/cart/items/{item_id}/color
 * @param {number} itemId
 * @param {number} colorId
 */
export const updateColor = async (itemId, colorId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để cập nhật giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}/color`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      color_id: colorId,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể cập nhật màu sắc. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * DELETE /api/cart/items/{item_id}
 * @param {number} itemId
 */
export const removeItem = async (itemId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể xóa sản phẩm. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Xóa toàn bộ giỏ hàng
 * DELETE /api/cart
 */
export const clearCart = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để xóa giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể xóa giỏ hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Lấy số lượng sản phẩm trong giỏ hàng
 * GET /api/cart/count (nếu đã đăng nhập)
 * Hoặc đếm từ guest cart (nếu chưa đăng nhập)
 */
export const getCartCount = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    const { getGuestCartCount } = await import("../utils/guestCart");
    return getGuestCartCount();
  }

  // Authenticated user - call API
  const response = await fetch(`${API_BASE_URL}/cart/count`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return 0;
  }

  return result?.data?.total_items || 0;
};

/**
 * Đồng bộ giỏ hàng từ localStorage khi guest user đăng nhập
 * POST /api/cart/sync
 * @param {{ guest_cart_items: Array<{ product_id: number; color_id: number; quantity: number }> }} payload
 */
export const syncCart = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để đồng bộ giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể đồng bộ giỏ hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

/**
 * Kiểm tra tính hợp lệ của giỏ hàng
 * POST /api/cart/validate
 */
export const validateCart = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để kiểm tra giỏ hàng.");
  }

  const response = await fetch(`${API_BASE_URL}/cart/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể kiểm tra giỏ hàng. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};
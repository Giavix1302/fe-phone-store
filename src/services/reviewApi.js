const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";


/**
 * Lấy danh sách đánh giá của sản phẩm
 * GET /api/products/{product_id}/reviews
 * @param {number} productId - ID của sản phẩm
 * @param {{ page?: number; limit?: number; rating?: number; sort_by?: string; sort_order?: string }} params
 */
export const fetchProductReviews = async (productId, params = {}) => {
    if (!productId) {
      throw new Error("Thiếu thông tin sản phẩm.");
    }
  
    const url = new URL(`${API_BASE_URL}/products/${productId}/reviews`);
  
    const { page = 1, limit = 10, rating, sort_by = "created_at", sort_order = "desc" } = params;
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    url.searchParams.set("sort_by", sort_by);
    url.searchParams.set("sort_order", sort_order);
    if (rating) url.searchParams.set("rating", rating);
  
    const response = await fetch(url.toString());
    const result = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message =
        result?.message || "Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.";
      throw new Error(message);
    }
  
  return result?.data || null;
  };


/**
 * Đánh giá sản phẩm trong đơn hàng
 * POST /api/orders/{order_number}/review
 * @param {string} orderNumber - Mã đơn hàng
 * @param {{ reviews: Array<{ product_id: number; rating: number; comment: string }> }} payload
 */
export const submitOrderReview = async (orderNumber, payload) => {
  if (!orderNumber) {
    throw new Error("Thiếu thông tin đơn hàng.");
  }

  if (!payload || !payload.reviews || payload.reviews.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một sản phẩm để đánh giá.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Vui lòng đăng nhập để đánh giá sản phẩm.");
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/review`, {
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
      result?.message || "Không thể gửi đánh giá. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || null;
};

  
  
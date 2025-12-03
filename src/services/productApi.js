const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Lấy danh sách sản phẩm (user)
 * GET /api/products
 * @param {{ page?: number; limit?: number; search?: string; category?: string }} params
 */
export const fetchProducts = async (params = {}) => {
  const url = new URL(`${API_BASE_URL}/products`);

  const { page = 1, limit = 12, search, category } = params;
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);
  if (search) url.searchParams.set("search", search);
  if (category) url.searchParams.set("category", category);

  const response = await fetch(url.toString());
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message ||
      "Không thể lấy danh sách sản phẩm. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return {
    items: result?.data || [],
    pagination: result?.pagination || null,
  };
};

/**
 * Lấy chi tiết sản phẩm theo slug
 * GET /api/products/{slug}
 */
export const fetchProductDetail = async (slug) => {
  if (!slug) {
    throw new Error("Thiếu thông tin sản phẩm.");
  }

  const response = await fetch(`${API_BASE_URL}/products/${slug}`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data;
};

/**
 * Lấy danh sách danh mục (user)
 * GET /api/categories
 */
export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể lấy danh sách danh mục. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || [];
};

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



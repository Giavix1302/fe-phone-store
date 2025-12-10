import { API_BASE_URL } from "./apiConfig";

/**
 * Lấy danh sách sản phẩm (user)
 * GET /api/products
 * @param {{ page?: number; limit?: number; search?: string; category?: string; brand_id?: number; min_price?: number; max_price?: number; sort_by?: string; sort_order?: string }} params
 */
export const fetchProducts = async (params = {}) => {
  const url = new URL(`${API_BASE_URL}/products`);

  const { 
    page = 1, 
    limit = 12, 
    search, 
    category_id, 
    brand_id, 
    min_price, 
    max_price, 
    sort_by, 
    sort_order 
  } = params;
  
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);
  if (search) url.searchParams.set("search", search);
  if (category_id) url.searchParams.set("category_id", category_id);
  if (brand_id) url.searchParams.set("brand_id", brand_id);
  if (min_price) url.searchParams.set("min_price", min_price);
  if (max_price) url.searchParams.set("max_price", max_price);
  if (sort_by) url.searchParams.set("sort_by", sort_by);
  if (sort_order) url.searchParams.set("sort_order", sort_order);

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
 * Lấy danh sách thương hiệu (user)
 * GET /api/brands
 */
export const fetchBrands = async () => {
  const response = await fetch(`${API_BASE_URL}/brands`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể lấy danh sách thương hiệu. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data || [];
};


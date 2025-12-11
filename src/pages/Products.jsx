import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
} from "../services/productApi";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(null);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    searchParams.get("category_id") || ""
  );
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brand_id") || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort_by") || "created_at"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sort_order") || "desc"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Load categories and brands once on mount
  useEffect(() => {
    const loadCategoriesAndBrands = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          fetchCategories(),
          fetchBrands(),
        ]);
        setCategories(categoriesData || []);
        setBrands(brandsData || []);
      } catch (err) {
        console.error("Error loading categories/brands:", err);
      }
    };
    loadCategoriesAndBrands();
  }, []);

  // Load products based on URL params
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: currentPage,
        limit: 12,
      };

      const urlSearch = searchParams.get("search");
      const urlCategoryId = searchParams.get("category_id");
      const urlBrand = searchParams.get("brand_id");
      const urlMinPrice = searchParams.get("min_price");
      const urlMaxPrice = searchParams.get("max_price");
      const urlSortBy = searchParams.get("sort_by") || "created_at";
      const urlSortOrder = searchParams.get("sort_order") || "desc";

      if (urlSearch) params.search = urlSearch;
      if (urlCategoryId) params.category_id = parseInt(urlCategoryId, 10);
      if (urlBrand) params.brand_id = parseInt(urlBrand, 10);
      if (urlMinPrice) params.min_price = parseInt(urlMinPrice, 10);
      if (urlMaxPrice) params.max_price = parseInt(urlMaxPrice, 10);
      if (urlSortBy) params.sort_by = urlSortBy;
      if (urlSortOrder) params.sort_order = urlSortOrder;

      const productsData = await fetchProducts(params);

      setProducts(productsData?.items || []);
      setPagination(productsData?.pagination || null);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải sản phẩm.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSelectedCategoryId(searchParams.get("category_id") || "");
    setSelectedBrand(searchParams.get("brand_id") || "");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSortBy(searchParams.get("sort_by") || "created_at");
    setSortOrder(searchParams.get("sort_order") || "desc");
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  const applyFilters = () => {
    const newParams = new URLSearchParams();

    if (search) newParams.set("search", search);
    if (selectedCategoryId) newParams.set("category_id", selectedCategoryId);
    if (selectedBrand) newParams.set("brand_id", selectedBrand);
    if (minPrice) newParams.set("min_price", minPrice);
    if (maxPrice) newParams.set("max_price", maxPrice);
    if (sortBy) newParams.set("sort_by", sortBy);
    if (sortOrder) newParams.set("sort_order", sortOrder);
    newParams.set("page", "1");

    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategoryId("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const formatPrice = (price) => {
    const numeric =
      typeof price === "number" ? price : parseInt(price || "0", 10) || 0;
    return numeric.toLocaleString("vi-VN") + "₫";
  };

  const getCategoryLabel = (code) => {
    if (!code) return "Tất cả sản phẩm";
    const upper = code.toUpperCase();
    if (upper === "PHONE") return "Điện thoại";
    if (upper === "TABLET") return "Máy tính bảng";
    if (upper === "LAPTOP") return "Laptop";
    return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
  };

  const activeCategory = selectedCategoryId
    ? categories.find((cat) => cat.id.toString() === selectedCategoryId)
    : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          {activeCategory?.description ||
            getCategoryLabel(activeCategory?.name) ||
            "Tất cả sản phẩm"}
        </h1>
        {activeCategory?.description && (
          <p className="text-sm text-gray-500">
            ({getCategoryLabel(activeCategory.name)})
          </p>
        )}
        <p className="text-gray-500">
          {pagination?.total_items || products.length} sản phẩm được tìm thấy
          {search ? ` cho từ khóa "${search}"` : ""}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter - Fixed */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Bộ lọc</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa tất cả
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                placeholder="Nhập tên sản phẩm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.description || getCategoryLabel(cat.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thương hiệu
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tất cả</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng giá
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Giá tối thiểu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Giá tối đa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
              >
                <option value="created_at">Ngày tạo</option>
                <option value="price">Giá</option>
                <option value="name">Tên</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>

            {/* Apply Button */}
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold mb-2">
                Không tìm thấy sản phẩm
              </h2>
              <p className="text-gray-600 mb-4">
                Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition group"
                  >
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={
                          product.primary_image
                            ? product.primary_image.startsWith("http")
                              ? product.primary_image
                              : `http://localhost:8080${product.primary_image}`
                            : "https://via.placeholder.com/300x300?text=No+Image"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {product.name}
                      </h3>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {getCategoryLabel(product.category?.name)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {product.brand?.name || ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.discount_price ? (
                          <>
                            <p className="text-lg font-bold text-red-600">
                              {formatPrice(product.discount_price || 0)}
                            </p>
                            <p className="text-sm text-gray-400 line-through">
                              {formatPrice(product.price || 0)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xl font-bold text-red-600">
                            {formatPrice(product.price || 0)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={!pagination.has_prev}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Trang {pagination.current_page} / {pagination.total_pages}
                  </span>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={!pagination.has_next}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

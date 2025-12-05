import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { fetchProducts, fetchCategories } from "../services/productApi";

const Products = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const search = searchParams.get("search") || undefined;
        const categoryFilter = category ? category.toUpperCase() : undefined;

        const [productsData, categoriesData] = await Promise.all([
          fetchProducts({
            page: 1,
            limit: 12,
            search,
            category: categoryFilter,
          }),
          fetchCategories(),
        ]);

        let list = productsData?.items || [];

        if (categoryFilter) {
          list = list.filter(
            (p) => p.category?.name?.toUpperCase() === categoryFilter
          );
        }

        setProducts(list);
        setCategories(categoriesData || []);
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi tải sản phẩm.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [category, searchParams]);

  const formatPrice = (price) => {
    const numeric =
      typeof price === "number" ? price : parseInt(price || "0", 10) || 0;
    return numeric.toLocaleString("vi-VN") + "₫";
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const getCategoryLabel = (code) => {
    if (!code) return "Tất cả sản phẩm";
    const upper = code.toUpperCase();
    if (upper === "PHONE") return "Điện thoại";
    if (upper === "TABLET") return "Máy tính bảng";
    if (upper === "LAPTOP") return "Laptop";
    return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
  };

  const activeCategoryCode = category ? category.toUpperCase() : "";
  const activeCategory =
    categories.find((cat) => cat.name === activeCategoryCode) || null;

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
          {activeCategory?.description || getCategoryLabel(activeCategoryCode)}
        </h1>
        {activeCategory?.description && (
          <p className="text-sm text-gray-500">
            ({getCategoryLabel(activeCategoryCode)})
          </p>
        )}
        <p className="text-gray-500">
          {products.length} sản phẩm được tìm thấy
          {searchParams.get("search")
            ? ` cho từ khóa "${searchParams.get("search")}"`
            : ""}
        </p>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg font-medium transition ${!activeCategoryCode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Tất cả
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/category/${cat.name.toLowerCase()}`}
                className={`px-4 py-2 rounded-lg font-medium transition ${activeCategoryCode === cat.name.toUpperCase()
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {cat.description || getCategoryLabel(cat.name)}
              </Link>
            ))}
          </div>

          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            onChange={handleSearch}
            defaultValue={searchParams.get("search") || ""}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-4">Thử tìm kiếm với từ khóa khác</p>
          <Link to="/products" className="text-blue-600 hover:underline">
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
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
                <p className="text-xl font-bold text-red-600">
                  {formatPrice(product.discount_price ?? product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;

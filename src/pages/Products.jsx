import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";

const Products = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  const allProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: "29990000",
      image:
        "https://images.unsplash.com/photo-1592286900632-b0b0d5b1a7f0?w=300&h=300&fit=crop",
      category: "iphone",
      brand: "Apple",
    },
    {
      id: 2,
      name: "Samsung Galaxy S24 Ultra",
      price: "26990000",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
      category: "samsung",
      brand: "Samsung",
    },
    {
      id: 3,
      name: "iPhone 14",
      price: "18990000",
      image:
        "https://images.unsplash.com/photo-1592286900632-b0b0d5b1a7f0?w=300&h=300&fit=crop",
      category: "iphone",
      brand: "Apple",
    },
    {
      id: 4,
      name: "Xiaomi 14 Ultra",
      price: "22990000",
      image:
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop",
      category: "xiaomi",
      brand: "Xiaomi",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      let filteredProducts = allProducts;

      // Filter by category from URL params
      if (category) {
        filteredProducts = filteredProducts.filter(
          (p) => p.category === category
        );
      }

      // Filter by search params
      const search = searchParams.get("search");
      if (search) {
        filteredProducts = filteredProducts.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setProducts(filteredProducts);
      setLoading(false);
    }, 500);
  }, [category, searchParams]);

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString("vi-VN") + "₫";
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

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
        <h1 className="text-3xl font-bold mb-4">
          {category
            ? `Sản phẩm ${category.charAt(0).toUpperCase() + category.slice(1)}`
            : "Tất cả sản phẩm"}
        </h1>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tất cả
            </Link>
            <Link
              to="/products/category/iphone"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                category === "iphone"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              iPhone
            </Link>
            <Link
              to="/products/category/samsung"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                category === "samsung"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Samsung
            </Link>
            <Link
              to="/products/category/xiaomi"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                category === "xiaomi"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Xiaomi
            </Link>
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
              to={`/products/${product.id}`}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition group"
            >
              <div className="h-48 bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-2">{product.brand}</p>
                <p className="text-xl font-bold text-red-600">
                  {formatPrice(product.price)}
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

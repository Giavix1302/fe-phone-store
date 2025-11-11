import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Mock data
  const allProducts = [
    {
      id: "1",
      name: "iPhone 15 Pro Max",
      price: "29990000",
      originalPrice: "32990000",
      image:
        "https://images.unsplash.com/photo-1592286900632-b0b0d5b1a7f0?w=500&h=500&fit=crop",
      category: "iphone",
      brand: "Apple",
      description:
        "iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp và pin lâu dài. Thiết kế Titanium cao cấp.",
      specs: [
        "Màn hình: 6.7 inch Super Retina XDR",
        "Chip: A17 Pro",
        "Camera: 48MP chính, 12MP góc siêu rộng, 12MP telephoto",
        "Pin: Lên đến 29 giờ phát video",
        "Bộ nhớ: 128GB, 256GB, 512GB, 1TB",
      ],
      inStock: true,
      rating: 4.8,
      reviews: 234,
    },
    {
      id: "2",
      name: "Samsung Galaxy S24 Ultra",
      price: "26990000",
      originalPrice: "29990000",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop",
      category: "samsung",
      brand: "Samsung",
      description:
        "Galaxy S24 Ultra với bút S Pen tích hợp, camera zoom 100x và AI thông minh. Màn hình Dynamic AMOLED 2X 6.8 inch.",
      specs: [
        "Màn hình: 6.8 inch Dynamic AMOLED 2X",
        "Chip: Snapdragon 8 Gen 3",
        "Camera: 200MP chính, zoom 100x",
        "Pin: 5000mAh, sạc nhanh 45W",
        "Bộ nhớ: 256GB, 512GB, 1TB",
      ],
      inStock: true,
      rating: 4.7,
      reviews: 189,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const foundProduct = allProducts.find((p) => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString("vi-VN") + "₫";
  };

  const handleAddToCart = () => {
    // Mock add to cart
    alert(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    // Mock buy now
    alert(`Mua ngay ${quantity} ${product.name}!`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-4">
            Sản phẩm không tồn tại hoặc đã bị xóa
          </p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition"
      >
        <span className="mr-2">←</span>
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {product.brand}
              </span>
              {product.inStock && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  Còn hàng
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {"⭐".repeat(Math.floor(product.rating))}
                <span className="ml-1 text-gray-600">({product.rating}/5)</span>
              </div>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{product.reviews} đánh giá</span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.originalPrice && (
              <p className="text-green-600 font-medium">
                Tiết kiệm:{" "}
                {formatPrice(
                  (
                    parseInt(product.originalPrice) - parseInt(product.price)
                  ).toString()
                )}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specs */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Thông số kỹ thuật</h3>
            <ul className="space-y-2">
              {product.specs.map((spec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-600">{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                🛒 Thêm vào giỏ hàng
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Mua ngay
              </button>
            </div>
          </div>

          {/* Related links */}
          <div className="pt-6 border-t border-gray-200">
            <Link
              to={`/products/category/${product.category}`}
              className="text-blue-600 hover:underline"
            >
              Xem thêm sản phẩm {product.brand} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

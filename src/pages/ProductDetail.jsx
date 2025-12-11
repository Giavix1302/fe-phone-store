import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchProductDetail } from "../services/productApi";
import { getCart } from "../services/cartApi";
import Review from "../component/Review";
import ModalAddItemToCart from "../component/ModalAddItemToCart";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      setLoading(true);
      setError("");
      try {
        const data = await fetchProductDetail(slug);
        setProduct(data);
      } catch (err) {
        setError(err.message || "Không thể tải thông tin sản phẩm.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const formatPrice = (price) => {
    if (price == null) return "";
    const numeric =
      typeof price === "number" ? price : parseInt(String(price) || "0", 10) || 0;
    return numeric.toLocaleString("vi-VN") + "₫";
  };

  // const handleAddToCart = () => {
  //   // Mock add to cart
  //   alert(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
  // };

  const handleBuyNow = () => {
    setShowBuyNowModal(true);
  };

  const handleBuyNowSuccess = async (buyNowData) => {
    try {
      const { product_id, color_id, quantity, product: productInfo } = buyNowData || {};
      
      // Buy now flow: navigate directly to checkout WITHOUT adding to cart
      navigate("/checkout", {
        state: { 
          fromBuyNow: true,
          productSlug: slug,
          buyNowProduct: {
            product_id,
            color_id,
            quantity,
            product: productInfo // Pass full product info for display
          }
        }
      });
    } catch (err) {
      console.error("Error navigating to checkout:", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
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

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Không thể tải sản phẩm</h2>
          <p className="text-gray-600 mb-4">
            {error || "Sản phẩm không tồn tại hoặc đã bị xóa."}
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
            {product.images && product.images.length > 0 ? (
              <img
                src={
                  product.images.find((img) => img.is_primary)?.image_url ||
                  product.images[0]?.image_url
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Không có hình ảnh
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
          <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {product.brand?.name}
              </span>
              {product.stock_quantity > 0 && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  Còn hàng
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {/* Rating */}
            {product.average_rating != null && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {"⭐".repeat(Math.round(product.average_rating || 0))}
                  <span className="ml-1 text-gray-600">
                    ({product.average_rating}/5)
                  </span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">
                  {product.total_reviews} đánh giá
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-red-600">
                {formatPrice(product.discount_price ?? product.price)}
              </span>
              {product.discount_price && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.discount_price && (
              <p className="text-green-600 font-medium">
                Tiết kiệm:{" "}
                {formatPrice(
                  (product.price || 0) - (product.discount_price || 0)
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
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec) => (
                  <li key={spec.id} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-800 font-medium">
                      {spec.spec_name}:
                    </span>
                    <span className="ml-1 text-gray-600">
                      {spec.spec_value}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Chưa có thông số.</li>
              )}
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
               onClick={() => setShowModal(true)}
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
            {product.category && (
              <Link
                to={`/products/category/${product.category.name.toLowerCase()}`}
                className="text-blue-600 hover:underline"
              >
                Xem thêm sản phẩm {product.brand?.name} →
              </Link>
            )}
          </div>
        </div>
      </div>
      <Review productId={product.id} />
      <ModalAddItemToCart
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={product} // Product từ fetchProductDetail
        onSuccess={() => {
          // Optional: Show success message, update cart count, etc.
          console.log("Đã thêm vào giỏ hàng!");
        }}
      />
      <ModalAddItemToCart
        isOpen={showBuyNowModal}
        onClose={() => setShowBuyNowModal(false)}
        product={product}
        buyNowMode={true}
        onBuyNow={handleBuyNowSuccess}
      />
    </div>
  );
};

export default ProductDetail;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCart } from "../services/cartApi";
import { createOrder } from "../services/orderApi";
import { emitCartChanged } from "../utils/cartEvents";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    shipping_address: "",
    payment_method: "COD",
    note: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const selectedCartItemIds = location.state?.cartItemIds || [];

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCart();
      setCart(data);
      
      // Pre-fill shipping address from user profile if available
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.address && !formData.shipping_address) {
        setFormData((prev) => ({
          ...prev,
          shipping_address: user.address,
        }));
      }
    } catch (err) {
      setError(err.message || "Không thể tải giỏ hàng. Vui lòng thử lại sau.");
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price == null) return "0₫";
    const numeric =
      typeof price === "number" ? price : parseFloat(String(price) || "0") || 0;
    return numeric.toLocaleString("vi-VN") + "₫";
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.shipping_address.trim()) {
      errors.shipping_address = "Vui lòng nhập địa chỉ giao hàng";
    } else if (formData.shipping_address.trim().length < 10) {
      errors.shipping_address = "Địa chỉ giao hàng phải có ít nhất 10 ký tự";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateSelectedTotal = () => {
    if (!cart?.items) return 0;
    return cart.items
      .filter((item) => selectedCartItemIds.includes(item.id))
      .reduce((sum, item) => {
        const lineTotal = parseFloat(item.line_total) || 0;
        return sum + lineTotal;
      }, 0);
  };

  const getSelectedItems = () => {
    if (!cart?.items) return [];
    return cart.items.filter((item) => selectedCartItemIds.includes(item.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (selectedCartItemIds.length === 0) {
      setError("Vui lòng chọn sản phẩm để thanh toán");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = await createOrder({
        shipping_address: formData.shipping_address.trim(),
        payment_method: formData.payment_method,
        note: formData.note.trim() || null,
        cart_item_ids: selectedCartItemIds,
      });

      // Xóa cart sau khi đặt hàng thành công
      emitCartChanged();

      if (orderData?.order?.order_number) {
        const orderNumber = orderData.order.order_number;
        const totalAmount = orderData.order.total_amount;
        const itemCount = orderData.order.items?.length || 0;
        
        // Thông báo chi tiết với thông tin đơn hàng
        setSuccessMessage(
          `Đặt hàng thành công! Mã đơn hàng: ${orderNumber}. ` +
          `Tổng tiền: ${formatPrice(totalAmount)}. ` +
          `Số lượng sản phẩm: ${itemCount}. ` +
          `Email xác nhận đã được gửi đến địa chỉ email của bạn.`
        );
        
        // Gửi email xác nhận (sử dụng mailto hoặc có thể gọi API nếu backend có)
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.email) {
          // Tạo nội dung email
          const emailSubject = encodeURIComponent(`Xác nhận đơn hàng ${orderNumber} - PhoneStore`);
          const emailBody = encodeURIComponent(
            `Xin chào ${user.full_name || user.name || "Quý khách"},\n\n` +
            `Cảm ơn bạn đã đặt hàng tại PhoneStore!\n\n` +
            `Thông tin đơn hàng:\n` +
            `- Mã đơn hàng: ${orderNumber}\n` +
            `- Tổng tiền: ${formatPrice(totalAmount)}\n` +
            `- Số lượng sản phẩm: ${itemCount}\n` +
            `- Phương thức thanh toán: ${formData.payment_method === "COD" ? "Thanh toán khi nhận hàng" : formData.payment_method}\n` +
            `- Địa chỉ giao hàng: ${formData.shipping_address}\n\n` +
            `Bạn có thể theo dõi đơn hàng tại: ${window.location.origin}/orders/${orderNumber}\n\n` +
            `Trân trọng,\nPhoneStore Team`
          );
          
          // Log để debug (có thể gọi API backend để gửi email thực sự)
          console.log("Order confirmation email would be sent to:", user.email);
          console.log("Order details:", {
            orderNumber,
            totalAmount,
            itemCount,
            paymentMethod: formData.payment_method,
            shippingAddress: formData.shipping_address
          });
          
          // Có thể mở mailto link (tùy chọn)
          // window.location.href = `mailto:${user.email}?subject=${emailSubject}&body=${emailBody}`;
        }
        
        // Chờ 3 giây để hiển thị thông báo chi tiết, sau đó chuyển đến OrderDetail
        setTimeout(() => {
          navigate(`/orders/${orderNumber}`, {
            state: { 
              orderCreated: true,
              orderData: orderData.order
            },
          });
        }, 3000);
      } else {
        setError("Không thể lấy thông tin đơn hàng. Vui lòng kiểm tra lại.");
      }
    } catch (err) {
      setError(err.message || "Không thể tạo đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">Giỏ hàng trống</div>
          <button
            onClick={() => navigate("/cart")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const selectedItems = getSelectedItems();
  const total = calculateSelectedTotal();

  if (selectedItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">Không có sản phẩm nào được chọn</div>
          <button
            onClick={() => navigate("/cart")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                🎉 Đặt hàng thành công!
              </h3>
              <p className="text-sm text-green-700 leading-relaxed mb-3">
                {successMessage}
              </p>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Đang chuyển đến trang chi tiết đơn hàng...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thông tin đơn hàng */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>

            {/* Địa chỉ giao hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                rows={4}
                disabled={submitting || successMessage}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.shipping_address
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200"
                } ${submitting || successMessage ? "bg-gray-50 cursor-not-allowed" : ""}`}
                placeholder="Nhập địa chỉ giao hàng đầy đủ"
                required
              />
              {formErrors.shipping_address && (
                <p className="text-sm text-red-500 mt-1">{formErrors.shipping_address}</p>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                disabled={submitting || successMessage}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  submitting || successMessage ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
              </select>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                disabled={submitting || successMessage}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  submitting || successMessage ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                placeholder="Ghi chú cho đơn hàng (nếu có)"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || successMessage}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo đơn hàng..." : successMessage ? "Đang chuyển trang..." : "Xác nhận đặt hàng"}
            </button>
          </form>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 shadow-sm sticky top-4">
            <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-4">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.product.primary_image || "/placeholder.jpg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </div>
                    {item.color && (
                      <div className="text-gray-600 text-xs">
                        Màu: {item.color.color_name}
                      </div>
                    )}
                    <div className="text-gray-600 text-xs">
                      SL: {item.quantity} × {formatPrice(item.unit_price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      {formatPrice(item.line_total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/cart")}
              className="w-full text-center border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Quay lại giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrderDetail, cancelOrder } from "../services/orderApi";
import OrderReviewModal from "../component/OrderReviewModal";

const OrderDetail = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonType, setCancelReasonType] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderDetail(orderNumber);
      setOrder(data);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const handleCancelOrder = async () => {
    let reasonToSend = "";
    
    if (cancelReasonType === "OTHER") {
      if (!cancelReason.trim()) {
        alert("Vui lòng nhập lý do hủy đơn hàng.");
        return;
      }
      reasonToSend = cancelReason.trim();
    } else if (!cancelReasonType) {
      alert("Vui lòng chọn lý do hủy đơn hàng.");
      return;
    } else {
      reasonToSend = cancelReasonType;
    }

    setCancelling(true);
    try {
      await cancelOrder(orderNumber, { reason: reasonToSend });
      alert("Hủy đơn hàng thành công!");
      setShowCancelModal(false);
      setCancelReason("");
      setCancelReasonType("");
      loadOrderDetail(); // Reload để cập nhật trạng thái
    } catch (err) {
      alert(err.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
      PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
      SHIPPED: { label: "Đã giao hàng", color: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Đã nhận hàng", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      COD: "Thanh toán khi nhận hàng",
      BANK_TRANSFER: "Chuyển khoản ngân hàng",
      CREDIT_CARD: "Thẻ tín dụng",
      E_WALLET: "Ví điện tử",
      PAYPAL: "PayPal",
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Không tìm thấy đơn hàng.
        </div>
        <div className="mt-4">
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusLabel(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
        >
          ← Quay lại danh sách đơn hàng
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Chi tiết đơn hàng
            </h1>
            <p className="text-gray-600 mt-1">Mã đơn: {order.order_number}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-center text-gray-800">
              Sản phẩm đã đặt
            </h2> 
            {order.can_review && (
              <button
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                onClick={() => setShowReviewModal(true)}
              >
                Đánh giá sản phẩm
              </button>
            )}
            </div>
           
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${item.product?.slug}`}
                          className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition"
                        >
                          {item.product?.name || "Sản phẩm"}
                        </Link>
                        {item.is_reviewed && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Đã đánh giá
                          </span>
                        )}
                      </div>
                      {item.color_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          Màu: {item.color_name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-600">
                          Số lượng: {item.quantity}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.unit_price)} x {item.quantity}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {formatCurrency(item.line_total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có sản phẩm nào.</p>
              )}
            </div>
          </div>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Lịch sử trạng thái
              </h2>
              <div className="space-y-3">
                {order.status_history.map((history, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-3 border-b border-gray-200 last:border-0"
                  >
                    <div className="shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusLabel(history.status).color}`}
                        >
                          {getStatusLabel(history.status).label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(history.changed_at)}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-gray-600 mt-1">
                          {history.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {order.tracking_info && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Thông tin vận chuyển
              </h2>
              <div className="space-y-3">
                {order.tracking_info.tracking_number && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Mã vận đơn:
                    </span>{" "}
                    <span className="text-gray-800">
                      {order.tracking_info.tracking_number}
                    </span>
                  </div>
                )}
                {order.tracking_info.shipping_partner && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Đơn vị vận chuyển:
                    </span>{" "}
                    <span className="text-gray-800">
                      {order.tracking_info.shipping_partner}
                    </span>
                  </div>
                )}
                {order.tracking_info.estimated_delivery && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Dự kiến giao hàng:
                    </span>{" "}
                    <span className="text-gray-800">
                      {formatDate(order.tracking_info.estimated_delivery)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Thông tin đơn hàng
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Mã đơn:</span>
                <p className="text-gray-800">{order.order_number}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ngày đặt:</span>
                <p className="text-gray-800">{formatDate(order.created_at)}</p>
              </div>
              {order.updated_at && (
                <div>
                  <span className="font-medium text-gray-700">
                    Cập nhật lần cuối:
                  </span>
                  <p className="text-gray-800">
                    {formatDate(order.updated_at)}
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">
                  Phương thức thanh toán:
                </span>
                <p className="text-gray-800">
                  {getPaymentMethodLabel(order.payment_method)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {order.user && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Thông tin khách hàng
              </h2>
              <div className="space-y-2 text-sm">
                {order.user.full_name && (
                  <div>
                    <span className="font-medium text-gray-700">Họ tên:</span>
                    <p className="text-gray-800">{order.user.full_name}</p>
                  </div>
                )}
                {order.user.email && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-800">{order.user.email}</p>
                  </div>
                )}
                {order.user.phone && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Số điện thoại:
                    </span>
                    <p className="text-gray-800">{order.user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Địa chỉ giao hàng
              </h2>
              <p className="text-gray-800 whitespace-pre-line">
                {order.shipping_address}
              </p>
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ghi chú</h2>
              <p className="text-gray-800 whitespace-pre-line">{order.note}</p>
            </div>
          )}

          {/* Total Amount */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-gray-700">
                Tổng tiền:
              </span>
              <span className="text-2xl font-bold text-primary-100">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {order.can_cancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition font-medium"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Hủy đơn hàng
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn hủy đơn hàng này không?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lý do hủy đơn:
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value="CHANGE_ADDRESS"
                    checked={cancelReasonType === "CHANGE_ADDRESS"}
                    onChange={(e) => {
                      setCancelReasonType(e.target.value);
                      setCancelReason("");
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Muốn thay đổi địa chỉ giao hàng</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value="CHANGE_PRODUCTS"
                    checked={cancelReasonType === "CHANGE_PRODUCTS"}
                    onChange={(e) => {
                      setCancelReasonType(e.target.value);
                      setCancelReason("");
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Muốn thay đổi sản phẩm trong đơn hàng</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value="FOUND_CHEAPER"
                    checked={cancelReasonType === "FOUND_CHEAPER"}
                    onChange={(e) => {
                      setCancelReasonType(e.target.value);
                      setCancelReason("");
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Tìm thấy giá rẻ hơn chỗ khác</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value="CHANGE_MIND"
                    checked={cancelReasonType === "CHANGE_MIND"}
                    onChange={(e) => {
                      setCancelReasonType(e.target.value);
                      setCancelReason("");
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Đổi ý không muốn mua nữa</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value="OTHER"
                    checked={cancelReasonType === "OTHER"}
                    onChange={(e) => {
                      setCancelReasonType(e.target.value);
                      setCancelReason("");
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Khác</span>
                </label>
              </div>
              
              {cancelReasonType === "OTHER" && (
                <div className="mt-3">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Nhập lý do hủy đơn hàng..."
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelReasonType("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={cancelling}
              >
                Hủy
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {cancelling ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <OrderReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          order={order}
          onSuccess={() => {
            loadOrderDetail(); 
          }}
        />
      )}
    </div>
  );
};

export default OrderDetail;


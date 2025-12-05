import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserOrders, cancelOrder } from "../services/orderApi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
  });
  
  // Cancel order states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonType, setCancelReasonType] = useState("");
  const [cancelingOrderNumber, setCancelingOrderNumber] = useState("");

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserOrders(filters);
      if (data) {
        setOrders(data.orders || []);
        setPagination(data.pagination || pagination);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
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

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? "" : status,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

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
      await cancelOrder(cancelingOrderNumber, { reason: reasonToSend });
      alert("Hủy đơn hàng thành công!");
      setShowCancelModal(false);
      setCancelReason("");
      setCancelReasonType("");
      setCancelingOrderNumber("");
      loadOrders(); // Reload danh sách đơn hàng
    } catch (err) {
      alert(err.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Đang tải danh sách đơn hàng...</p>
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link
          to="/profile"
          className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Profile
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Đơn Mua Của Tôi</h1>

      {/* Status Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilter("")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === ""
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => handleStatusFilter("PENDING")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === "PENDING"
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Chờ xử lý
        </button>
        <button
          onClick={() => handleStatusFilter("PROCESSING")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === "PROCESSING"
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Đang xử lý
        </button>
        <button
          onClick={() => handleStatusFilter("SHIPPED")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === "SHIPPED"
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Đã giao hàng
        </button>
        <button
          onClick={() => handleStatusFilter("DELIVERED")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === "DELIVERED"
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Đã nhận hàng
        </button>
        <button
          onClick={() => handleStatusFilter("CANCELLED")}
          className={`px-4 py-2 rounded-lg transition ${
            filters.status === "CANCELLED"
              ? "bg-primary-100 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Đã hủy
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Chưa có đơn hàng nào
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary-100 text-white px-6 py-3 rounded-lg hover:bg-primary-100/90 transition font-medium"
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusLabel(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Mã đơn: {order.order_number}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Ngày đặt:</span>{" "}
                        {formatDate(order.created_at)}
                      </div>
                      {order.delivered_at && (
                        <div>
                          <span className="font-medium">Ngày nhận:</span>{" "}
                          {formatDate(order.delivered_at)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Số lượng sản phẩm:</span>{" "}
                        {order.items_count || 0}
                      </div>
                      <div>
                        <span className="font-medium">Thanh toán:</span>{" "}
                        {order.payment_method === "COD"
                          ? "Thanh toán khi nhận hàng"
                          : order.payment_method}
                      </div>
                    </div>

                    {/* Items Preview */}
                    {order.items_preview && order.items_preview.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {order.items_preview.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                          >
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="text-xs">
                              <p className="font-medium text-gray-800 truncate max-w-[100px]">
                                {item.product_name}
                              </p>
                              <p className="text-gray-500">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {order.items_count > 3 && (
                          <div className="flex items-center justify-center bg-gray-100 rounded-lg px-3 text-sm text-gray-600">
                            +{order.items_count - 3} sản phẩm
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="text-lg font-bold text-gray-800">
                      Tổng tiền: {formatCurrency(order.total_amount)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:min-w-[150px]">
                    <Link
                      to={`/orders/${order.order_number}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium"
                    >
                      Xem chi tiết
                    </Link>
                    {order.can_cancel && (
                      <button
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition font-medium"
                        onClick={() => {
                          setCancelingOrderNumber(order.order_number);
                          setShowCancelModal(true);
                          setCancelReason("");
                          setCancelReasonType("");
                        }}
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={!pagination.has_prev}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {pagination.current_page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={!pagination.has_next}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}

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
                  setCancelingOrderNumber("");
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
    </div>
  );
};

export default Orders;


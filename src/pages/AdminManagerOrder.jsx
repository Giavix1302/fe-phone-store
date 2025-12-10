import { useEffect, useState } from "react";
import { getAdminOrders, updateOrderStatus } from "../services/OrderApi";
import { format } from "date-fns";

const statusColor = {
  PENDING: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  SHIPPED: "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
};

const statusFlow = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const allStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminManagerOrder() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingPartner, setShippingPartner] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const limit = 10;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ search, status, page, limit });
      console.log("🚀 ~ fetchOrders ~ res:", res);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.log("Lỗi load orders:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, page]);

  function formatIsoToVN(isoString) {
    const [datePart, timePart] = isoString.replace("Z", "").split("T");

    const [year, month, day] = datePart.split("-");
    const [hour, minute, second] = timePart.split(":");

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    // Validate status
    const allowed = statusFlow[selectedOrder.status] || [];
    if (!updateStatus || !allowed.includes(updateStatus)) {
      alert("Vui lòng chọn trạng thái hợp lệ tiếp theo.");
      return;
    }

    try {
      const data = await updateOrderStatus(selectedOrder.order_number, {
        status: updateStatus,
        note: note || undefined,
        tracking_number: trackingNumber || undefined,
        shipping_partner: shippingPartner || undefined,
        estimated_delivery: estimatedDelivery || undefined,
      });

      // Thông báo theo response
      const msg = data?.new_status
        ? `Cập nhật ${selectedOrder.order_number}: ${data.old_status} → ${data.new_status}`
        : "Cập nhật thành công!";
      alert(msg);

      // Reset form + reload
      setSelectedOrder(null);
      setNote("");
      setTrackingNumber("");
      setShippingPartner("");
      setEstimatedDelivery("");
      fetchOrders();
    } catch (err) {
      alert(err.message || "Lỗi cập nhật trạng thái!");
      console.error(err);
    }
  };

  const allowedStatuses =
    selectedOrder && statusFlow[selectedOrder.status]
      ? statusFlow[selectedOrder.status]
      : [];

  // Khi mở modal: chọn mặc định tiếp theo nếu có, nếu không chọn hiện trạng
  useEffect(() => {
    if (selectedOrder) {
      const current = selectedOrder.status;
      const nextMap = {
        PENDING: "PROCESSING",
        PROCESSING: "SHIPPED",
        SHIPPED: "DELIVERED",
      };
      setUpdateStatus(nextMap[current] || current || "PENDING");
    }
  }, [selectedOrder]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý đơn hàng</h2>
        <div className="text-sm text-slate-500"></div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Tổng đơn</div>
            <div className="text-2xl font-semibold text-slate-800">
              {summary.total_orders}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-50 shadow-sm border border-yellow-200">
            <div className="text-xs text-yellow-700">Đang chờ</div>
            <div className="text-2xl font-semibold text-yellow-800">
              {summary.pending_orders}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 shadow-sm border border-blue-200">
            <div className="text-xs text-blue-700">Đang xử lý</div>
            <div className="text-2xl font-semibold text-blue-800">
              {summary.processing_orders}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-violet-50 shadow-sm border border-violet-200">
            <div className="text-xs text-violet-700">Đã gửi</div>
            <div className="text-2xl font-semibold text-violet-800">
              {summary.shipped_orders ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 shadow-sm border border-emerald-200">
            <div className="text-xs text-emerald-700">Đã giao</div>
            <div className="text-2xl font-semibold text-emerald-800">
              {summary.delivered_orders}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 shadow-sm border border-rose-200">
            <div className="text-xs text-rose-700">Đã hủy</div>
            <div className="text-2xl font-semibold text-rose-800">
              {summary.cancelled_orders}
            </div>
          </div>
          <div className="md:col-span-6 p-4 rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Doanh thu</div>
            <div className="text-2xl font-semibold text-slate-800">
              {Number(summary.total_revenue || 0).toLocaleString()} ₫
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-80 bg-white shadow-sm"
          placeholder="Tìm kiếm theo mã đơn, user..."
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-48 bg-white shadow-sm"
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="SHIPPED">Đã gửi</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {loading && (
        <div className="text-center py-10 text-slate-600">Đang tải...</div>
      )}

      {!loading && (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <table className="w-full">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-slate-700">
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Người đặt</th>
                <th className="p-3">Số lượng</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Thanh toán</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3">SĐT</th>
                <th className="p-3">Địa chỉ giao hàng</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-slate-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}

              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`border-t border-slate-200 hover:bg-slate-50 transition ${
                    idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  <td className="p-3 font-medium text-slate-800">
                    {order.order_number}
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800">
                      {order.user?.full_name}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {order.user?.email}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">{order.items_count}</td>
                  <td className="p-3 text-slate-800">
                    {Number(order.total_amount).toLocaleString()} ₫
                  </td>
                  <td className="p-3 text-slate-700">{order.payment_method}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                        statusColor[order.status]
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">
                    {order.created_at ? formatIsoToVN(order.created_at) : "-"}
                  </td>
                  <td className="p-3 text-slate-700">
                    {order.user?.phone || "-"}
                  </td>
                  <td className="p-3 text-slate-700">
                    {order.shipping_address || "-"}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                      onClick={() => {
                        setSelectedOrder(order);
                        // chọn mặc định tiếp theo hoặc current
                        const nextMap = {
                          PENDING: "PROCESSING",
                          PROCESSING: "SHIPPED",
                          SHIPPED: "DELIVERED",
                        };
                        setUpdateStatus(
                          nextMap[order.status] || order.status || "PENDING"
                        );
                      }}
                    >
                      Cập nhật
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex justify-center mt-6 gap-3">
          <button
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
            disabled={!pagination.has_prev}
            onClick={() => setPage(page - 1)}
          >
            ←
          </button>
          <span className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
            Trang {pagination.current_page} / {pagination.total_pages}
          </span>
          <button
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
            disabled={!pagination.has_next}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-[420px] shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-600 text-white">
              <h3 className="text-lg font-semibold">
                Cập nhật trạng thái đơn hàng
              </h3>
              <p className="text-xs opacity-90 mt-1">
                {selectedOrder.order_number}
              </p>
            </div>

            <div className="px-6 py-5">
              <label className="text-sm text-slate-700 mb-1 block">
                Trạng thái
              </label>
              <select
                className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-full mb-3 bg-white shadow-sm"
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
              >
                {allStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <label className="text-sm text-slate-700 mb-1 block">
                Ghi chú
              </label>
              <textarea
                className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-full mb-3 bg-white shadow-sm"
                placeholder="Ghi chú"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Mã vận đơn
                  </label>
                  <input
                    className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-full bg-white shadow-sm"
                    placeholder="Mã vận đơn"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Đối tác vận chuyển
                  </label>
                  <input
                    className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-full bg-white shadow-sm"
                    placeholder="Đối tác vận chuyển"
                    value={shippingPartner}
                    onChange={(e) => setShippingPartner(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Dự kiến giao
                  </label>
                  <input
                    type="datetime-local"
                    className="border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 px-3 py-2 rounded-lg w-full bg-white shadow-sm"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                onClick={() => setSelectedOrder(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm transition"
                onClick={handleUpdateStatus}
                disabled={!updateStatus}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

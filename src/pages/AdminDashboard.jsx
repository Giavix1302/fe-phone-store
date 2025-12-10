import React, { useEffect, useMemo, useState } from "react";
import { parseStoredUser } from "../services/authApi";
import { API_BASE_URL } from "../services/apiConfig";
const getAdminToken = () => localStorage.getItem("token") || "";
const currency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function AdminDashboard() {
  const user = parseStoredUser();

  // periods
  const [overviewPeriod, setOverviewPeriod] = useState("today"); // today|week|month|year
  const [revenuePeriod, setRevenuePeriod] = useState("month");   // today|week|month|year|custom
  const [ordersPeriod, setOrdersPeriod] = useState("month");     // today|week|month|year|custom

  // data
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);

  // loading flags
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ---- fetch helpers ----
  const authHeaders = () => ({
    Authorization: `Bearer ${getAdminToken()}`,
    Accept: "application/json",
  });

  const fetchOverview = async (period) => {
    setLoadingOverview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/overview?period=${period}`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      setOverview(json?.data || null);
    } catch (e) {
      console.warn("overview error", e);
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchRevenue = async (period) => {
    setLoadingRevenue(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/revenue?period=${period}`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      setRevenue(json?.data || null);
    } catch (e) {
      console.warn("revenue error", e);
      setRevenue(null);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchOrders = async (period) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/orders?period=${period}`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      setOrders(json?.data || null);
    } catch (e) {
      console.warn("orders error", e);
      setOrders(null);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProductsAnalytics = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/products`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      setProducts(json?.data || null);
    } catch (e) {
      console.warn("products analytics error", e);
      setProducts(null);
    } finally {
      setLoadingProducts(false);
    }
  };

  // effects
  useEffect(() => { fetchOverview(overviewPeriod); }, [overviewPeriod]);
  useEffect(() => { fetchRevenue(revenuePeriod); }, [revenuePeriod]);
  useEffect(() => { fetchOrders(ordersPeriod); }, [ordersPeriod]);
  useEffect(() => { fetchProductsAnalytics(); }, []);

  // helpers
  const percent = (v, total) => {
    const p = total ? (Number(v || 0) / Number(total || 0)) * 100 : 0;
    return Math.max(0, Math.min(100, Math.round(p)));
  };

  const revMax = useMemo(() => {
    const arr = revenue?.daily_revenue || [];
    return arr.reduce((m, d) => Math.max(m, Number(d.revenue || 0)), 0);
  }, [revenue]);

  const ordMax = useMemo(() => {
    const arr = orders?.daily_orders || [];
    return arr.reduce((m, d) => Math.max(m, Number(d.orders || 0)), 0);
  }, [orders]);

  // Transform orders_by_status object -> array
  const ordersByStatus = useMemo(() => {
    const obj = orders?.orders_by_status || {};
    return Object.keys(obj).map((k) => ({ status: k, count: obj[k] }));
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trang quản trị</h1>
          <p className="text-gray-600 text-sm">Xin chào, <span className="font-semibold">
            {user?.full_name || user?.username || user?.email || "Admin"}
          </span></p>
        </div>
        <div className="flex gap-2">
          {["today","week","month","year"].map((p) => (
            <button
              key={p}
              className={`px-3 py-1.5 rounded-md border text-sm ${overviewPeriod===p ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 hover:bg-slate-50"}`}
              onClick={() => setOverviewPeriod(p)}
              title="Kỳ tổng quan"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <StatCard title="Doanh thu" value={currency(overview?.overview?.total_revenue)} loading={loadingOverview} />
        <StatCard title="Đơn hàng" value={overview?.overview?.total_orders ?? "-"} loading={loadingOverview} />
        <StatCard title="Người dùng" value={overview?.overview?.total_users ?? "-"} loading={loadingOverview} />
        <StatCard title="Sản phẩm" value={overview?.overview?.total_products ?? "-"} loading={loadingOverview} />
      </div>

      {/* Today + Compare + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3 text-slate-800">Hôm nay</h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span>Doanh thu</span><b>{currency(overview?.today_stats?.revenue)}</b></li>
            <li className="flex justify-between"><span>Đơn hàng</span><b>{overview?.today_stats?.orders ?? "-"}</b></li>
            <li className="flex justify-between"><span>Người dùng mới</span><b>{overview?.today_stats?.new_users ?? "-"}</b></li>
            <li className="flex justify-between"><span>Người dùng hoạt động</span><b>{overview?.today_stats?.active_users ?? "-"}</b></li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3 text-slate-800">Tăng trưởng</h3>
          <GrowthRow label="Doanh thu" val={overview?.comparisons?.revenue_growth} />
          <GrowthRow label="Đơn hàng" val={overview?.comparisons?.orders_growth} />
          <GrowthRow label="Người dùng" val={overview?.comparisons?.users_growth} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3 text-slate-800">Số liệu nhanh</h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span>Đơn chờ xử lý</span><b>{overview?.quick_stats?.pending_orders ?? "-"}</b></li>
            <li className="flex justify-between"><span>Sản phẩm sắp hết hàng</span><b>{overview?.quick_stats?.low_stock_products ?? "-"}</b></li>
            <li className="flex justify-between"><span>Đánh giá mới</span><b>{overview?.quick_stats?.recent_reviews ?? "-"}</b></li>
            <li className="flex justify-between"><span>Active users hôm nay</span><b>{overview?.quick_stats?.active_users_today ?? "-"}</b></li>
          </ul>
        </div>
      </div>

      {/* Revenue */}
      <SectionHeader
        title="Thống kê doanh thu"
        right={<PeriodSwitch value={revenuePeriod} onChange={setRevenuePeriod} />}
      />
      <div className="bg-white rounded-xl border p-4 mb-8">
        {loadingRevenue ? (
          <LoadingRow />
        ) : !revenue ? (
          <EmptyRow />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <SmallCard label="Tổng doanh thu" value={currency(revenue?.revenue_summary?.total_revenue)} />
              <SmallCard label="Tăng trưởng" value={`${Number(revenue?.revenue_summary?.revenue_growth || 0).toFixed(1)}%`} />
              <SmallCard label="Giá trị ĐH TB" value={currency(revenue?.revenue_summary?.average_order_value)} />
              <SmallCard label="Tổng đơn" value={revenue?.revenue_summary?.total_orders ?? "-"} />
            </div>

            {/* Daily revenue bars */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-2 text-slate-700">Doanh thu theo ngày</div>
              <div className="space-y-2">
                {(revenue?.daily_revenue || []).map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-600">{d.date}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded">
                      <div
                        className="h-3 bg-blue-500 rounded"
                        style={{ width: revMax ? `${Math.round((Number(d.revenue || 0) / revMax) * 100)}%` : "0%" }}
                        title={currency(d.revenue)}
                      />
                    </div>
                    <div className="w-28 text-right text-xs">{currency(d.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by category + Top revenue products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2 text-slate-700">Theo danh mục</div>
                <div className="space-y-2">
                  {(revenue?.revenue_by_category || []).map((c) => (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{c.category}</span>
                        <span className="font-medium">{currency(c.revenue)} • {c.percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded">
                        <div className="h-2 bg-emerald-500 rounded" style={{ width: `${c.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2 text-slate-700">Top sản phẩm theo doanh thu</div>
                <div className="space-y-2">
                  {(revenue?.top_revenue_products || []).map((p) => (
                    <div key={p.product_id} className="flex justify-between text-sm">
                      <div className="truncate">{p.product_name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{p.quantity_sold} bán</span>
                        <b>{currency(p.revenue)}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Orders */}
      <SectionHeader
        title="Thống kê đơn hàng"
        right={<PeriodSwitch value={ordersPeriod} onChange={setOrdersPeriod} />}
      />
      <div className="bg-white rounded-xl border p-4 mb-8">
        {loadingOrders ? (
          <LoadingRow />
        ) : !orders ? (
          <EmptyRow />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
              <SmallCard label="Tổng đơn" value={orders?.orders_summary?.total_orders ?? "-"} />
              <SmallCard label="Hoàn thành" value={orders?.orders_summary?.completed_orders ?? "-"} />
              <SmallCard label="Đã hủy" value={orders?.orders_summary?.cancelled_orders ?? "-"} />
              <SmallCard label="Tỉ lệ hoàn tất" value={`${Number(orders?.orders_summary?.completion_rate || 0).toFixed(1)}%`} />
              <SmallCard label="Giá trị ĐH TB" value={currency(orders?.orders_summary?.average_order_value)} />
            </div>

            {/* Daily orders bars */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-2 text-slate-700">Đơn hàng theo ngày</div>
              <div className="space-y-2">
                {(orders?.daily_orders || []).map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-600">{d.date}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded">
                      <div
                        className="h-3 bg-blue-500 rounded"
                        style={{ width: ordMax ? `${Math.round((Number(d.orders || 0) / ordMax) * 100)}%` : "0%" }}
                        title={`${d.orders} đơn`}
                      />
                    </div>
                    <div className="w-28 text-right text-xs">{d.orders}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders by status + Peak hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2 text-slate-700">Theo trạng thái</div>
                <div className="space-y-2">
                  {ordersByStatus.map((s) => (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{s.status}</span>
                        <span className="font-medium">{s.count} đơn</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded">
                        <div className="h-2 bg-emerald-500 rounded" style={{ width: `${percent(s.count, orders?.orders_summary?.total_orders)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2 text-slate-700">Khung giờ cao điểm</div>
                <div className="space-y-2">
                  {(orders?.peak_hours || []).map((h) => (
                    <div key={h.hour} className="flex justify-between text-sm">
                      <span>{h.hour}:00</span>
                      <span className="font-medium">{h.orders} đơn</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Products Analytics */}
      <SectionHeader title="Phân tích sản phẩm" />
      <div className="bg-white rounded-xl border p-4 mb-8">
        {loadingProducts ? (
          <LoadingRow />
        ) : !products ? (
          <EmptyRow />
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
              <SmallCard label="Tổng sản phẩm" value={products?.products_summary?.total_products ?? "-"} />
              <SmallCard label="Đang bán" value={products?.products_summary?.active_products ?? "-"} />
              <SmallCard label="Ngừng bán" value={products?.products_summary?.inactive_products ?? "-"} />
              <SmallCard label="Sắp hết hàng" value={products?.products_summary?.low_stock_products ?? "-"} />
              <SmallCard label="Hết hàng" value={products?.products_summary?.out_of_stock_products ?? "-"} />
            </div>

            {/* Top selling products */}
            <div className="mb-6">
              <div className="text-sm font-medium mb-2 text-slate-700">Sản phẩm bán chạy nhất</div>
              <div className="space-y-2">
                {(products?.best_selling_products || []).map((p) => (
                  <div key={p.product_id} className="flex justify-between text-sm">
                    <div className="truncate">{p.product_name}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{p.quantity_sold} bán</span>
                      <b>{currency(p.revenue)}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="mb-6">
              <div className="text-sm font-medium mb-2 text-slate-700">Cảnh báo tồn kho thấp</div>
              <div className="space-y-2">
                {(products?.low_stock_alerts || []).map((p) => (
                  <div key={p.product_id} className="flex justify-between text-sm">
                    <div className="truncate">{p.product_name}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-600">Tồn: {p.current_stock}</span>
                      <span className="text-xs text-slate-500">Khuyến nghị nhập: {p.recommended_reorder}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category performance */}
            <div>
              <div className="text-sm font-medium mb-2 text-slate-700">Hiệu suất theo danh mục</div>
              <div className="space-y-3">
                {(products?.category_performance || []).map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{c.category}</span>
                      <span className="font-medium">{currency(c.revenue)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded">
                      <div className="h-2 bg-indigo-500 rounded" style={{ width: `${percent(c.products_sold,  (products?.products_summary?.total_products || 0) * 5)}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Sản phẩm: {c.total_products} • Đã bán: {c.products_sold}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function StatCard({ title, value, loading }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</div>
      <div className="text-2xl font-bold">{loading ? <Skeleton className="w-24 h-6" /> : value}</div>
    </div>
  );
}

function SmallCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 shadow-sm">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="text-sm text-slate-500">Không có dữ liệu.</div>
  );
}

function GrowthRow({ label, val }) {
  const v = Number(val || 0);
  const positive = v >= 0;
  return (
    <div className="flex items-center justify-between text-sm mb-2">
      <span className="text-slate-700">{label}</span>
      <span className={positive ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
        {positive ? "+" : ""}{v.toFixed(1)}%
      </span>
    </div>
  );
}

function PeriodSwitch({ value, onChange }) {
  const list = ["today", "week", "month", "year"];
  return (
    <div className="inline-flex bg-white border rounded-md overflow-hidden">
      {list.map((p) => (
        <button
          key={p}
          className={`px-3 py-1.5 text-sm border-r last:border-r-0 ${value===p ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
          onClick={() => onChange(p)}
          type="button"
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {right}
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`bg-slate-200 rounded ${className || "w-16 h-4"}`} />;
}


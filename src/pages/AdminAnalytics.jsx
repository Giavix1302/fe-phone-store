import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ================= CONFIG ================= */
const API_BASE = "https://api.phone.sitedemo.io.vn";

const getAdminToken = () => localStorage.getItem("access_token") || "";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatRevenue = (value) => `${value} Tr`;

/* ================= COMPONENT ================= */
const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);

  /* ================= API CALL ================= */
  const fetchDashboardData = async () => {
    try {
      const token = getAdminToken();

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [overviewRes, revenueRes, orderRes, userRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/admin/dashboard/overview`, { headers }),
          fetch(`${API_BASE}/api/admin/dashboard/revenue`, { headers }),
          fetch(`${API_BASE}/api/admin/dashboard/order-status`, { headers }),
          fetch(`${API_BASE}/api/admin/dashboard/user-growth`, { headers }),
        ]);

      if (!overviewRes.ok) throw new Error("Fetch overview failed");

      const overviewJson = await overviewRes.json();
      const revenueJson = await revenueRes.json();
      const orderJson = await orderRes.json();
      const userJson = await userRes.json();

      setOverview(overviewJson.data);
      setMonthlyRevenue(revenueJson.data);
      setOrderStatus(orderJson.data);
      setUserGrowth(userJson.data);
    } catch (err) {
      console.error("❌ AdminAnalytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-lg font-medium">
        Đang tải dữ liệu thống kê...
      </div>
    );
  }

  /* ================= UI ================= */

  const StatisticCard = ({
    title,
    value,
    subText,
    trend,
    isCurrency = false,
  }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <div className="mt-1 flex justify-between items-center">
        <p className="text-3xl font-bold">
          {isCurrency ? formatCurrency(value) : value?.toLocaleString("vi-VN")}
        </p>
        {trend !== undefined && (
          <span
            className={`text-sm font-semibold ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subText && <p className="text-xs text-gray-500">{subText}</p>}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">
        📊 Bảng điều khiển thống kê Admin
      </h1>

      {/* ===== OVERVIEW ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatisticCard
          title="Tổng doanh thu"
          value={overview?.revenue}
          subText={`Đơn hoàn thành: ${overview?.completed_orders}`}
          isCurrency
        />
        <StatisticCard
          title="Tổng đơn hàng"
          value={overview?.total_orders}
          subText={`Đang chờ: ${overview?.pending_orders}`}
          trend={overview?.order_growth}
        />
        <StatisticCard
          title="Tổng người dùng"
          value={overview?.total_users}
          subText={`Hôm nay: ${overview?.new_users_today}`}
          trend={overview?.user_growth}
        />
        <StatisticCard
          title="Sản phẩm hết hàng"
          value={overview?.out_of_stock_products}
          subText={`Tổng SP: ${overview?.total_products}`}
          trend={overview?.product_stock_trend}
        />
      </section>

      <hr className="my-8" />

      {/* ===== CHARTS ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            💰 Doanh thu & Chi phí 6 tháng
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatRevenue} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Doanh thu"
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#f97316"
                strokeWidth={2}
                name="Chi phí"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📦 Trạng thái đơn hàng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {orderStatus.map((item, idx) => (
                  <Cell key={idx} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User growth */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            👤 Người dùng mới theo tháng
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#6366f1" name="Người dùng mới" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;

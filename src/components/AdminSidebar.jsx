import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    {
      path: "/admin/products",
      icon: <Package size={20} />,
      label: "Sản phẩm",
    },
    {
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />,
      label: "Đơn hàng",
    },
    {
      path: "/admin/users",
      icon: <Users size={20} />,
      label: "Người dùng",
    },
    {
      path: "/admin/analytics",
      icon: <BarChart3 size={20} />,
      label: "Thống kê",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 text-white flex flex-col z-50">
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 text-white no-underline"
        >
          <span className="text-3xl">🛍️</span>
          <span className="text-xl font-semibold">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <ul className="list-none p-0 m-0">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`
                  flex items-center gap-3 px-5 py-3 text-gray-300 no-underline transition-all
                  hover:bg-gray-800 hover:text-white
                  ${
                    isActive(item.path)
                      ? "bg-blue-900/30 text-blue-400 border-l-4 border-blue-500"
                      : ""
                  }
                `}
              >
                <span className="flex items-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center gap-3 px-5 py-3 text-gray-300 no-underline transition-all hover:bg-gray-800 hover:text-white rounded-lg"
        >
          <span className="flex items-center">
            <LogOut size={20} />
          </span>
          <span>Về trang chủ</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  User,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../services/authApi";
import { emitAuthChanged } from "../utils/authEvents";

const AdminHeader = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Mock data
  const user = {
    name: "Admin User",
    email: "admin@example.com",
    avatar: null,
  };

  const notifications = [
    {
      id: 1,
      message: "Đơn hàng mới #1234",
      time: "5 phút trước",
      unread: true,
    },
    {
      id: 2,
      message: "Sản phẩm XYZ sắp hết hàng",
      time: "1 giờ trước",
      unread: true,
    },
    {
      id: 3,
      message: "Người dùng mới đăng ký",
      time: "2 giờ trước",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      emitAuthChanged();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local data and redirect even if API fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      emitAuthChanged();
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 h-[70px] bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
      {/* Left: Search */}
      <div className="flex-1">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5 max-w-md">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, đơn hàng..."
            className="bg-transparent border-none outline-none flex-1 text-sm"
          />
        </div>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold m-0">Thông báo</h3>
                <button className="text-blue-500 text-sm hover:text-blue-600">
                  Đánh dấu đã đọc
                </button>
              </div>

              <ul className="list-none p-0 m-0 max-h-[300px] overflow-y-auto">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`
                      p-3 border-b border-gray-100 cursor-pointer transition-colors
                      hover:bg-gray-50
                      ${notif.unread ? "bg-blue-50" : ""}
                    `}
                  >
                    <p className="m-0 mb-1 text-sm">{notif.message}</p>
                    <span className="text-xs text-gray-500">{notif.time}</span>
                  </li>
                ))}
              </ul>

              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-blue-500 text-sm font-medium hover:text-blue-600">
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} />
              )}
            </div>
            <span className="text-sm font-medium hidden md:block">
              {user.name}
            </span>
            <ChevronDown size={16} className="text-gray-600" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="m-0 mb-1 text-sm font-semibold">
                    {user.name}
                  </p>
                  <p className="m-0 text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* Menu Items */}
              <ul className="list-none p-2 m-0">
                <li>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                    <User size={16} />
                    <span>Hồ sơ</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings size={16} />
                    <span>Cài đặt</span>
                  </button>
                </li>
                <li>
                  <div className="h-px bg-gray-200 my-2"></div>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
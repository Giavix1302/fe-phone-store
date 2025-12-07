import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { logout as logoutApi, parseStoredUser, fetchCurrentUserProfile } from "../services/authApi";
import { AUTH_CHANGED_EVENT, emitAuthChanged } from "../utils/authEvents";
import { CART_CHANGED_EVENT } from "../utils/cartEvents";
import { getCartCount } from "../services/cartApi";

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => parseStoredUser());
  const [cartCount, setCartCount] = useState(0);

  const syncUserFromStorage = useCallback(() => {
    setUser(parseStoredUser());
  }, []);

  const loadCartCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      try {
        const { getGuestCartCount } = await import("../utils/guestCart");
        setCartCount(getGuestCartCount());
      } catch {
        setCartCount(0);
      }
      return;
    }

    // Authenticated user - call API
    try {
      const count = await getCartCount();
      setCartCount(count);
    } catch (err) {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    loadCartCount();
  }, [loadCartCount]);

  // Function to fetch and update user avatar
  const fetchAndUpdateAvatar = useCallback(async () => {
    const token = localStorage.getItem("token");
    const currentUser = parseStoredUser();
    
    if (token && currentUser) {
      try {
        const profile = await fetchCurrentUserProfile();
        if (profile) {
          // Merge profile data with current user data
          const updatedUser = { ...currentUser, ...profile };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (error) {
        // Silently fail - avatar will show initial if not available
        console.warn("Could not fetch user profile:", error);
      }
    }
  }, []);

  // Fetch user profile to get avatar if user is logged in (on mount)
  useEffect(() => {
    fetchAndUpdateAvatar();
  }, [fetchAndUpdateAvatar]);

  useEffect(() => {
    const handleCartChanged = () => {
      loadCartCount();
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    window.addEventListener(AUTH_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleCartChanged);
    };
  }, [loadCartCount]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "user" || event.key === "token") {
        syncUserFromStorage();
      }
    };

    const handleAuthChanged = () => {
      syncUserFromStorage();
      // Fetch avatar when auth changes (e.g., after login)
      fetchAndUpdateAvatar();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [syncUserFromStorage, fetchAndUpdateAvatar]);


  const handleLogout = async () => {
    await logoutApi();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    emitAuthChanged();
    navigate("/");
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-100">
                📱 PhoneStore
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`font-medium transition ${
                  isActive("/") && location.pathname === "/"
                    ? "text-primary-100 border-b-2 border-primary-100"
                    : "text-gray-600 hover:text-primary-100"
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/products"
                className={`font-medium transition ${
                  isActive("/products")
                    ? "text-primary-100 border-b-2 border-primary-100"
                    : "text-gray-600 hover:text-primary-100"
                }`}
              >
                Sản phẩm
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className={`font-medium transition ${
                    isActive("/admin")
                      ? "text-primary-100 border-b-2 border-primary-100"
                      : "text-gray-600 hover:text-primary-100"
                  }`}
                >
                  Quản trị
                </Link>
              )}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Giỏ hàng */}
                  <Link
                    to="/cart"
                    className={`relative p-2 transition rounded-full hover:bg-gray-200 ${
                      isActive("/cart")
                        ? "text-primary-100 bg-gray-200"
                        : "text-gray-600"
                    }`}
                    title="Giỏ hàng"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Avatar User */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 transition border border-gray-200"
                  >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.full_name || user?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            e.target.style.display = "none";
                            const fallback = e.target.parentElement.querySelector(".avatar-fallback");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`avatar-fallback w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-md ${
                          user?.avatar ? "hidden" : ""
                        }`}
                      >
                        {(user?.full_name || user?.name || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <span className="text-gray-800 font-medium text-sm hidden md:block">
                        {user?.full_name || user?.name || user?.email || "User"}
                      </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Giỏ hàng - Guest */}
                  <Link
                    to="/cart"
                    className={`relative p-2 transition rounded-full hover:bg-gray-200 ${
                      isActive("/cart")
                        ? "text-primary-100 bg-gray-200"
                        : "text-gray-600"
                    }`}
                    title="Giỏ hàng"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-primary-100 font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-100 text-dark-200 px-4 py-2 rounded-lg hover:bg-primary-100 transition"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Mở menu</span>
                {isMenuOpen ? "✖️" : "☰"}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className="block px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Trang chủ
                </Link>
                <Link
                  to="/products"
                  className="block px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sản phẩm
                </Link>
                {/* Giỏ hàng - hiển thị cho cả user và guest */}
                <Link
                  to="/cart"
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-primary-100 font-medium relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>Giỏ hàng</span>
                  {cartCount > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
                {user && (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.full_name || user?.name || "User"}
                          className="w-8 h-8 rounded-full object-cover mr-2"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-white font-semibold text-xs mr-2 ${
                          user?.avatar ? "hidden" : ""
                        }`}
                      >
                        {(user?.full_name || user?.name || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <span>Hồ sơ</span>
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Quản trị
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="text-sm breadcrumbs">
          <div className="flex items-center space-x-2 text-gray-500">
            <Link to="/" className="hover:text-primary-100">
              Trang chủ
            </Link>
            {location.pathname !== "/" && (
              <>
                <span>/</span>
                <span className="text-dark-100 capitalize">
                  {location.pathname.split("/")[1]}
                </span>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-200 text-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 PhoneStore. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

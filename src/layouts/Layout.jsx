import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Mock user state - thực tế sẽ lấy từ context/redux
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
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
              <Link
                to="/cart"
                className={`font-medium transition ${
                  isActive("/cart")
                    ? "text-primary-100 border-b-2 border-primary-100"
                    : "text-gray-600 hover:text-primary-100"
                }`}
              >
                Giỏ hàng
              </Link>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="text-gray-600 hover:text-primary-100 font-medium"
                  >
                    Xin chào, {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-error-100 text-white px-4 py-2 rounded-lg hover:bg-error-200 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
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
                <Link
                  to="/cart"
                  className="block px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Giỏ hàng
                </Link>
                {user && (
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-600 hover:text-primary-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hồ sơ
                  </Link>
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

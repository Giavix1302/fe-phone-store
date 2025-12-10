import { Navigate, useLocation } from "react-router-dom";
import { parseStoredUser } from "../services/authApi";

/**
 * Route bảo vệ:
 * - Kiểm tra đã đăng nhập (có token & user)
 * - Nếu có truyền `roles` thì chỉ cho phép user có role phù hợp.
 *
 * Ví dụ dùng:
 *  - Chỉ cần đăng nhập:
 *      <PrivateRoute>
 *        <Profile />
 *      </PrivateRoute>
 *
 *  - Chỉ cho ADMIN:
 *      <PrivateRoute roles={['ADMIN']}>
 *        <AdminDashboard />
 *      </PrivateRoute>
 */
const PrivateRoute = ({ children, roles }) => {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const user = parseStoredUser();

  // Chưa đăng nhập
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra role nếu có truyền
  if (roles && roles.length > 0) {
    const userRole = user.role || user?.roles?.[0];

    if (!userRole || !roles.includes(userRole)) {
      // Không đủ quyền: điều hướng về trang chủ (hoặc trang 403 tuỳ bạn)
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
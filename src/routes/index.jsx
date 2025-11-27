import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Login from "../pages/Login";
import { Cart } from "../pages/Cart";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import PrivateRoute from "./PrivateRoute";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

// Router configuration
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Trang chủ */}
          <Route index element={<Home />} />

          {/* Sản phẩm */}
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="products/category/:category" element={<Products />} />

          {/* Giỏ hàng */}
          <Route path="cart" element={<Cart />} />

          {/* Auth routes - không cần đăng nhập */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />

          {/* Private routes - cần đăng nhập */}
          <Route
            path="profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Redirect old paths */}
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="shop" element={<Navigate to="/products" replace />} />
        </Route>

        {/* 404 Page - không có Layout */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
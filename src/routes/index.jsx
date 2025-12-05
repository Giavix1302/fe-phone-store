import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import ProductDetail from "../pages/ProductDetail";
import Profile from "../pages/Profile";
import CartPage from "../pages/Cart";  // ✅ sửa đúng tên file
import Products from "../pages/Products"; // nếu dùng trang list sản phẩm

// Layouts
import MainLayout from "../layouts/Layout";  // ❗ bạn dùng Layout.jsx (không phải MainLayout.jsx)
import AdminLayout from "../layouts/AdminLayout";

// Admin pages
import AdminDashboard from "../pages/AdminDashboard";
import AdminManagerProduct from "../pages/AdminManagerProduct";
import AdminManagerOrder from "../pages/AdminManagerOrder";
import AdminManagerUser from "../pages/AdminManagerUser";

// Middlewares
import PrivateRoute from "./PrivateRoute";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />

          {/* Customer private routes */}
          <Route
            path="profile"
            element={
              <PrivateRoute roles={["CUSTOMER"]}>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="cart"
            element={
              <PrivateRoute roles={["CUSTOMER"]}>
                <CartPage />
              </PrivateRoute>
            }
          />
        </Route>

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminManagerProduct />} />
          <Route path="orders" element={<AdminManagerOrder />} />
          <Route path="users" element={<AdminManagerUser />} />
        </Route>

        {/* NOT FOUND */}
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}

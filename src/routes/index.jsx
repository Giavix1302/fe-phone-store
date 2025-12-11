import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts
import Layout from "../layouts/Layout";
import AdminLayout from "../layouts/AdminLayout";

// Public pages
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import { Cart } from "../pages/Cart";        // cart public của bạn
import CartPage from "../pages/Cart";        // cart private của thach
import Checkout from "../pages/Checkout";
import VerifyEmail from "../pages/VerifyEmail";

// Customer pages
import Profile from "../pages/Profile";
import Orders from "../pages/Orders";
import OrderDetail from "../pages/OrderDetail";

// Admin pages
import AdminDashboard from "../pages/AdminDashboard";
// import AdminManagerProduct from "../pages/AdminManagerProduct";
// import AdminManagerOrder from "../pages/AdminManagerOrder";
// import AdminManagerUser from "../pages/AdminManagerUser";
import AdminAnalytics from "../pages/AdminAnalytics";
import AdminCategoryBrandColor from "../pages/AdminCategoryBrandColor";

// Middleware
import PrivateRoute from "./PrivateRoute";

export default function AppRouter() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          {/* PRODUCT ROUTES */}
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="products/category/:category" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />

          {/* CART PUBLIC */}
          <Route path="cart" element={<Cart />} />

          {/* CHECKOUT */}
          <Route
            path="checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />

          {/* AUTH */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* CUSTOMER PRIVATE ROUTES */}
          <Route
            path="profile"
            element={
              <PrivateRoute roles={["USER", "ADMIN"]}>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />

          <Route
            path="orders/:orderNumber"
            element={
              <PrivateRoute>
                <OrderDetail />
              </PrivateRoute>
            }
          />

          {/* CART PRIVATE (thach) */}
          <Route
            path="cart"
            element={
              <PrivateRoute roles={["USER", "ADMIN"]}>
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
          {/* <Route path="products" element={<AdminManagerProduct />} />
          <Route path="orders" element={<AdminManagerOrder />} />
          <Route path="users" element={<AdminManagerUser />} /> */}
          <Route path="category" element={<AdminCategoryBrandColor />} />
        </Route>

        {/* NOT FOUND */}
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login as loginApi } from "../services/authApi";
import { emitAuthChanged } from "../utils/authEvents";

const initialFormState = {
  email: "",
  password: "",
  rememberMe: true,
};

const validate = (values) => {
  const errors = {};

  if (!values.email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (values.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  return errors;
};

const Login = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");
    setSuccessMessage("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const loginResponse = await loginApi({
        email: formData.email.trim(),
        password: formData.password,
      });
      console.log("Login response:", loginResponse);
      localStorage.setItem("token", loginResponse.access_token);
      localStorage.setItem("user", JSON.stringify(loginResponse.user));

      emitAuthChanged();
      setSuccessMessage("Đăng nhập thành công! Đang chuyển hướng...");

      if (!formData.rememberMe) {
        localStorage.setItem("login_session", "session-only");
      } else {
        localStorage.removeItem("login_session");
      }

      if(loginResponse.user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }

      // setTimeout(() => {
      //   navigate(from, { replace: true });
      // }, 800);
    } catch (error) {
      setApiError(error.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gradient-to-br from-primary-100/20 to-gray-100 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-dark-100 mb-6">
            Welcome 👋
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Đăng nhập để tiếp tục mua sắm, quản lý đơn hàng và nhận các ưu đãi
            dành riêng cho bạn.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "Thanh toán nhanh chóng",
                desc: "Lưu thông tin và hoàn tất đơn hàng chỉ với vài bước.",
                icon: "⚡",
              },
              {
                title: "Theo dõi đơn hàng",
                desc: "Kiểm tra trạng thái giao hàng và lịch sử mua sắm.",
                icon: "📦",
              },
              {
                title: "Ưu đãi cá nhân hóa",
                desc: "Nhận thông báo sớm nhất về sản phẩm và voucher mới.",
                icon: "🎁",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start space-x-4 bg-white/60 rounded-xl p-4 shadow-sm"
              >
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-dark-100 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-dark-100 mb-2">
              Đăng nhập tài khoản
            </h1>
            <p className="text-gray-500">
              Nhập thông tin bên dưới để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
                placeholder="vidu@email.com"
                autoComplete="email"
              />
              {formErrors.email && (
                <p className="text-error-100 text-sm mt-2">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Mật khẩu
              </label>
              <div
                className={`flex items-center border rounded-xl px-4 ${
                  formErrors.password ? "border-error-100" : "border-gray-200"
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full py-3 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm text-gray-500 hover:text-primary-100"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-error-100 text-sm mt-2">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-100 focus:ring-primary-100"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-primary-100">
                Quên mật khẩu?
              </Link>
            </div>

            {apiError && (
              <div className="bg-error-100/10 border border-error-100 text-error-100 rounded-xl px-4 py-3 text-sm">
                {apiError}
              </div>
            )}

            {successMessage && (
              <div className="bg-success-100/10 border border-success-100 text-success-200 rounded-xl px-4 py-3 text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-100 text-dark-200 font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary-100 font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
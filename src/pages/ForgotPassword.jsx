import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authApi";

const initialFormState = {
  email: "",
};

const validate = (values) => {
  const errors = {};

  if (!values.email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
    errors.email = "Email không đúng định dạng.";
  }

  return errors;
};

const ForgotPassword = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      const response = await forgotPassword({
        email: formData.email.trim(),
      });

      setSuccessMessage(
        "Mã đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư rác."
      );

      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate("/reset-password", {
          replace: true,
          state: { email: formData.email.trim() },
        });
      }, 2000);
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.message || "Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại.";
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gradient-to-br from-primary-100/20 to-gray-100 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-dark-100 mb-6">
            Quên mật khẩu? 🔐
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Đừng lo lắng! Chúng tôi sẽ gửi mã đặt lại mật khẩu đến email của bạn.
            Mã này có hiệu lực trong 15 phút.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "Bảo mật tài khoản",
                desc: "Mã đặt lại mật khẩu chỉ có hiệu lực trong 15 phút để đảm bảo an toàn.",
                icon: "🔒",
              },
              {
                title: "Kiểm tra email",
                desc: "Vui lòng kiểm tra cả hộp thư đến và thư rác để tìm mã xác thực.",
                icon: "📧",
              },
              {
                title: "Hỗ trợ nhanh chóng",
                desc: "Nếu không nhận được email, bạn có thể yêu cầu gửi lại mã.",
                icon: "⚡",
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
              Quên mật khẩu
            </h1>
            <p className="text-gray-500">
              Nhập email đã đăng ký để nhận mã đặt lại mật khẩu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Email đã đăng ký
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
              {loading ? "Đang gửi..." : "Gửi mã đặt lại mật khẩu"}
            </button>
          </form>

          <div className="mt-8 space-y-3">
            <p className="text-center text-gray-500">
              Nhớ mật khẩu?{" "}
              <Link to="/login" className="text-primary-100 font-medium">
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-center text-gray-500">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-primary-100 font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


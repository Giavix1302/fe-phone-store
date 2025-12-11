import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword, forgotPassword } from "../services/authApi";

const CODE_LENGTH = 6;
const RESEND_INTERVAL = 60; // seconds

const validate = ({ email, resetCode, newPassword, confirmPassword }) => {
  const errors = {};

  if (!email) {
    errors.email = "Vui lòng nhập email đã đăng ký.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!resetCode) {
    errors.resetCode = "Vui lòng nhập mã đặt lại mật khẩu.";
  } else if (!new RegExp(`^[0-9]{${CODE_LENGTH}}$`).test(resetCode)) {
    errors.resetCode = `Mã đặt lại mật khẩu gồm ${CODE_LENGTH} chữ số.`;
  }

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới.";
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return errors;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: prefilledEmail,
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (resendSeconds > 0) {
      timer = setTimeout(() => setResendSeconds((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const maskedEmail = useMemo(() => {
    if (!formData.email || !formData.email.trim()) return "";
    const email = formData.email.trim();
    const [name, domain] = email.split("@");
    if (!domain || !name) return email;
    const maskedName =
      name.length <= 2
        ? `${name[0] || ""}***`
        : `${name.slice(0, 2)}***${name.slice(-1)}`;
    return `${maskedName}@${domain}`;
  }, [formData.email]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "resetCode"
          ? value.replace(/\D/g, "").slice(0, CODE_LENGTH)
          : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
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
      await resetPassword({
        email: formData.email.trim(),
        reset_code: formData.resetCode.trim(),
        new_password: formData.newPassword,
      });

      setSuccessMessage(
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ."
      );
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (error) {
      const errorMessage =
        error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;

    // Validate email
    const emailErrors = validate({
      email: formData.email,
      resetCode: "0".repeat(CODE_LENGTH),
      newPassword: "password",
      confirmPassword: "password",
    });
    if (emailErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: emailErrors.email }));
      setApiError("");
      setSuccessMessage("");
      return;
    }

    // Clear previous messages
    setApiError("");
    setSuccessMessage("");

    try {
      await forgotPassword({ email: formData.email.trim() });
      setSuccessMessage("Mã đặt lại mật khẩu mới đã được gửi. Vui lòng kiểm tra email.");
      setResendSeconds(RESEND_INTERVAL);
    } catch (error) {
      const errorMessage =
        error.message || "Không thể gửi lại mã. Vui lòng thử lại.";
      setApiError(errorMessage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gradient-to-br from-primary-100/20 to-gray-100 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-dark-100 mb-6">
            Đặt lại mật khẩu 🔑
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Nhập mã đặt lại mật khẩu đã được gửi đến email của bạn và tạo mật khẩu mới.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "Mã xác thực",
                desc: `Mã gồm ${CODE_LENGTH} chữ số, có hiệu lực trong 15 phút.`,
                icon: "🔢",
              },
              {
                title: "Mật khẩu mới",
                desc: "Mật khẩu phải có ít nhất 6 ký tự và khác mật khẩu cũ.",
                icon: "🔐",
              },
              {
                title: "Bảo mật",
                desc: "Sau khi đặt lại thành công, bạn sẽ cần đăng nhập lại.",
                icon: "🛡️",
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
              Đặt lại mật khẩu
            </h1>
            <p className="text-gray-500">
              {maskedEmail ? (
                <>
                  Nhập mã đã được gửi tới email{" "}
                  <span className="font-semibold text-dark-100">{maskedEmail}</span>
                </>
              ) : (
                "Nhập mã đặt lại mật khẩu và mật khẩu mới"
              )}
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
                placeholder="email@example.com"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
              />
              {formErrors.email && (
                <p className="text-error-100 text-sm mt-2">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Mã đặt lại mật khẩu
              </label>
              <input
                type="text"
                name="resetCode"
                value={formData.resetCode}
                onChange={handleChange}
                inputMode="numeric"
                placeholder={`Nhập ${CODE_LENGTH} chữ số`}
                className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-mono ${
                  formErrors.resetCode
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
              />
              {formErrors.resetCode && (
                <p className="text-error-100 text-sm mt-2">{formErrors.resetCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Mật khẩu mới
              </label>
              <div
                className={`flex items-center border rounded-xl px-4 ${
                  formErrors.newPassword ? "border-error-100" : "border-gray-200"
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full py-3 focus:outline-none"
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm text-gray-500 hover:text-primary-100"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="text-error-100 text-sm mt-2">
                  {formErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div
                className={`flex items-center border rounded-xl px-4 ${
                  formErrors.confirmPassword
                    ? "border-error-100"
                    : "border-gray-200"
                }`}
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full py-3 focus:outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-sm text-gray-500 hover:text-primary-100"
                >
                  {showConfirmPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-error-100 text-sm mt-2">
                  {formErrors.confirmPassword}
                </p>
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-primary-100 text-dark-200 font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </button>
              <button
                type="button"
                disabled={resendSeconds > 0}
                onClick={handleResend}
                className="flex-1 py-3 px-4 border border-primary-100 text-primary-100 font-semibold rounded-xl hover:bg-primary-50 transition disabled:opacity-50"
              >
                {resendSeconds > 0
                  ? `Gửi lại mã (${resendSeconds}s)`
                  : "Gửi lại mã"}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Nhớ mật khẩu?{" "}
              <Link to="/login" className="text-primary-100 font-semibold">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


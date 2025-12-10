import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendVerification, verifyEmail } from "../services/authApi";

const CODE_LENGTH = 6;
const RESEND_INTERVAL = 60; // seconds

const validate = ({ email, code }) => {
  const errors = {};

  if (!email) {
    errors.email = "Vui lòng nhập email đã đăng ký.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!code) {
    errors.code = "Vui lòng nhập mã xác thực.";
  } else if (!new RegExp(`^[0-9]{${CODE_LENGTH}}$`).test(code)) {
    errors.code = `Mã xác thực gồm ${CODE_LENGTH} chữ số.`;
  }

  return errors;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: prefilledEmail,
    code: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (resendSeconds > 0) {
      timer = setTimeout(() => setResendSeconds((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const maskedEmail = useMemo(() => {
    if (!formData.email) return "";
    const [name, domain] = formData.email.split("@");
    if (!domain) return formData.email;
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
      [name]: name === "code" ? value.replace(/\D/g, "").slice(0, CODE_LENGTH) : value,
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
      await verifyEmail({
        email: formData.email.trim(),
        verification_code: formData.code.trim(),
      });
      setSuccessMessage("Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      setApiError(error.message || "Mã xác thực không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    const emailErrors = validate({ email: formData.email, code: "0".repeat(CODE_LENGTH) });
    if (emailErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: emailErrors.email }));
      return;
    }

    setApiError("");
    try {
      await resendVerification({ email: formData.email.trim() });
      setSuccessMessage("Mã xác thực mới đã được gửi. Vui lòng kiểm tra email.");
      setResendSeconds(RESEND_INTERVAL);
    } catch (error) {
      setApiError(error.message || "Không thể gửi lại mã. Vui lòng thử lại.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-100 mb-2">
            Xác thực email của bạn
          </h1>
          <p className="text-gray-500">
            Nhập mã gồm {CODE_LENGTH} chữ số đã được gửi tới email{" "}
            <span className="font-semibold text-dark-100">{maskedEmail}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-dark-100 mb-2">
              Vì sao cần xác thực?
            </h3>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>Đảm bảo tài khoản thuộc về bạn.</li>
              <li>Giúp bảo vệ đơn hàng và thông tin thanh toán.</li>
              <li>Nhận thông báo ưu đãi, bảo hành chính xác.</li>
            </ul>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-dark-100 mb-2">
                Mẹo kiểm tra email:
              </h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Tìm trong hộp thư đến, thư cập nhật hoặc thư rác.</li>
                <li>Mã có hiệu lực trong 10 phút.</li>
                <li>Nếu chưa nhận được, hãy bấm “Gửi lại mã”.</li>
              </ul>
            </div>
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
                Mã xác thực
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="Nhập 6 chữ số"
                className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-mono ${
                  formErrors.code
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
              />
              {formErrors.code && (
                <p className="text-error-100 text-sm mt-2">{formErrors.code}</p>
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
                {loading ? "Đang xác thực..." : "Xác thực ngay"}
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
              Đã xác thực?{" "}
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

export default VerifyEmail;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authApi";

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  acceptTerms: false,
};

const validate = (values) => {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ tên.";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "Họ tên phải có ít nhất 3 ký tự.";
  }

  if (!values.email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!values.phone) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!/^0[0-9]{9}$/.test(values.phone)) {
    errors.phone = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (values.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  if (values.address && values.address.length > 500) {
    errors.address = "Địa chỉ không vượt quá 500 ký tự.";
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = "Bạn cần đồng ý với điều khoản sử dụng.";
  }

  return errors;
};

const Register = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
      };

      const response = await signup(payload);

      setSuccessMessage(
        response?.verification_required
          ? "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
          : "Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ."
      );
      setFormData(initialFormState);

      setTimeout(() => {
        if (response?.verification_required) {
          navigate("/verify-email", {
            replace: true,
            state: { email: payload.email },
          });
        } else {
          navigate("/login", { replace: true });
        }
      }, 1200);
    } catch (error) {
      setApiError(error.message || "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gradient-to-br from-primary-100/20 to-white rounded-2xl p-8 shadow-lg border border-primary-100/30">
          <h2 className="text-3xl font-bold text-dark-100 mb-4">
            Tạo tài khoản mới ✨
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Đăng ký tài khoản PhoneStore để nhận thông tin độc quyền, theo dõi
            đơn hàng và quản lý bảo hành dễ dàng.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: "🛍️",
                title: "Ưu đãi thành viên",
                desc: "Nhận voucher, flash sale và ưu đãi sinh nhật.",
              },
              {
                icon: "🔒",
                title: "Bảo mật thông tin",
                desc: "Mật khẩu được mã hóa, xác thực email chống giả mạo.",
              },
              {
                icon: "📦",
                title: "Theo dõi đơn hàng",
                desc: "Kiểm tra trạng thái đóng gói, vận chuyển, giao hàng.",
              },
              {
                icon: "💬",
                title: "Hỗ trợ 24/7",
                desc: "Đội ngũ CSKH sẵn sàng tư vấn mọi lúc.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 bg-white/80 rounded-xl p-4 shadow-sm"
              >
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-dark-100">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-dark-100 mb-2">
              Đăng ký tài khoản
            </h1>
            <p className="text-gray-500">
              Hoàn thành biểu mẫu bên dưới để bắt đầu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                    formErrors.fullName
                      ? "border-error-100 focus:ring-error-100"
                      : "border-gray-200 focus:ring-primary-100"
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-error-100 text-sm mt-2">
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                    formErrors.phone
                      ? "border-error-100 focus:ring-error-100"
                      : "border-gray-200 focus:ring-primary-100"
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-error-100 text-sm mt-2">
                    {formErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
              />
              {formErrors.email && (
                <p className="text-error-100 text-sm mt-2">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Địa chỉ (tuỳ chọn)
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                  formErrors.address
                    ? "border-error-100 focus:ring-error-100"
                    : "border-gray-200 focus:ring-primary-100"
                }`}
              />
              {formErrors.address && (
                <p className="text-error-100 text-sm mt-2">
                  {formErrors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                    formErrors.password
                      ? "border-error-100 focus:ring-error-100"
                      : "border-gray-200 focus:ring-primary-100"
                  }`}
                />
                {formErrors.password && (
                  <p className="text-error-100 text-sm mt-2">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                    formErrors.confirmPassword
                      ? "border-error-100 focus:ring-error-100"
                      : "border-gray-200 focus:ring-primary-100"
                  }`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-error-100 text-sm mt-2">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <label className="inline-flex items-start gap-3 text-gray-600">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 rounded border-gray-300 text-primary-100 focus:ring-primary-100"
                />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <Link
                    to="/terms"
                    className="text-primary-100 font-semibold hover:underline"
                  >
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link
                    to="/privacy"
                    className="text-primary-100 font-semibold hover:underline"
                  >
                    Chính sách bảo mật
                  </Link>
                  .
                </span>
              </label>
              {formErrors.acceptTerms && (
                <p className="text-error-100 text-sm">{formErrors.acceptTerms}</p>
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
              {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary-100 font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
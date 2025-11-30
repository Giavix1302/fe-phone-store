import { useMemo, useState } from "react";
import { changePassword, parseStoredUser } from "../services/authApi";

const initialPasswordState = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const Profile = () => {
  const storedUser = parseStoredUser();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const displayName = useMemo(() => {
    return (
      storedUser?.full_name ||
      storedUser?.name ||
      storedUser?.username ||
      "Người dùng"
    );
  }, [storedUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.old_password.trim()) {
      errors.old_password = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!passwordForm.new_password.trim()) {
      errors.new_password = "Vui lòng nhập mật khẩu mới.";
    } else if (passwordForm.new_password.trim().length < 6) {
      errors.new_password = "Mật khẩu mới phải có ít nhất 6 ký tự.";
    }

    if (!passwordForm.confirm_password.trim()) {
      errors.confirm_password = "Vui lòng nhập lại mật khẩu mới.";
    } else if (passwordForm.confirm_password !== passwordForm.new_password) {
      errors.confirm_password = "Mật khẩu xác nhận không khớp.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });

      setStatus({
        type: "success",
        message: "Đổi mật khẩu thành công.",
      });
      setPasswordForm(initialPasswordState);
      setFormErrors({});
      setShowPasswordForm(false);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-gray-600">{storedUser?.email}</p>
          <p className="text-gray-500 text-sm mt-1">
            {storedUser?.phone || "Chưa cập nhật số điện thoại"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
            Chỉnh sửa hồ sơ
          </button>
          <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition">
            Lịch sử đơn hàng
          </button>
          <button
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition md:col-span-2"
            onClick={() => setShowPasswordForm((prev) => !prev)}
          >
            {showPasswordForm ? "Ẩn form đổi mật khẩu" : "Thay đổi mật khẩu"}
          </button>
        </div>

        {status.message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}

        {showPasswordForm && (
          <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                name="old_password"
                value={passwordForm.old_password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.old_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-blue-200"
                }`}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
              {formErrors.old_password && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.old_password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.new_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-blue-200"
                }`}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
              {formErrors.new_password && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.new_password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.confirm_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-blue-200"
                }`}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              {formErrors.confirm_password && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.confirm_password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
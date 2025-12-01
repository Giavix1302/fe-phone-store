import { useEffect, useMemo, useState } from "react";
import {
  changePassword,
  parseStoredUser,
  uploadAvatar,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
} from "../services/authApi";

const initialPasswordState = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const Profile = () => {
  const [storedUser, setStoredUser] = useState(() => parseStoredUser());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: storedUser?.full_name || "",
    phone: storedUser?.phone || "",
    address: storedUser?.address || "",
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  useEffect(() => {
    const loadLatestProfile = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        const currentUser = parseStoredUser() || storedUser || {};
        const updatedUser = { ...currentUser, ...profile };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setStoredUser(updatedUser);
      } catch {
        console.error("Không thể tải thông tin hồ sơ mới nhất.");
      }
    };

    loadLatestProfile();
  }, []);

  useEffect(() => {
    // Đồng bộ form khi storedUser thay đổi (vd: sau khi login lại)
    setProfileForm({
      full_name: storedUser?.full_name || "",
      phone: storedUser?.phone || "",
      address: storedUser?.address || "",
    });
  }, [storedUser]);

  const displayName = useMemo(() => {
    return (
      storedUser?.full_name ||
      storedUser?.name ||
      storedUser?.username ||
      "Người dùng"
    );
  }, [storedUser]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview trước
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setStatus({ type: "", message: "" });

    setAvatarUploading(true);
    try {
      const data = await uploadAvatar(file);

      // BE có thể trả { avatar } hoặc { id, avatar, updatedAt }
      const newAvatarUrl = data?.avatar || data?.avatarUrl || null;

      if (!newAvatarUrl) {
        throw new Error("Phản hồi không hợp lệ từ máy chủ.");
      }

      // Cập nhật user trong localStorage và state
      const currentUser = parseStoredUser() || storedUser || {};
      const updatedUser = { ...currentUser, avatar: newAvatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setStoredUser(updatedUser);

      setStatus({
        type: "success",
        message: "Cập nhật ảnh đại diện thành công.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message ||
          "Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.",
      });
      // Nếu lỗi thì bỏ preview tạm
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateProfileForm = () => {
    const errors = {};

    if (!profileForm.full_name.trim()) {
      errors.full_name = "Vui lòng nhập họ và tên.";
    }

    if (profileForm.phone && !/^[0-9+\-\s]{8,20}$/.test(profileForm.phone)) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }

    if (profileForm.address && profileForm.address.length < 5) {
      errors.address = "Địa chỉ quá ngắn.";
    }

    return errors;
  };

  const handleToggleEditProfile = async () => {
    // Nếu mở form lần đầu, thử fetch profile mới nhất từ server
    if (!editingProfile) {
      try {
        const profile = await fetchCurrentUserProfile();
        const updatedUser = {
          ...(storedUser || {}),
          ...profile,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setStoredUser(updatedUser);
      } catch (error) {
        // Không chặn mở form, chỉ báo lỗi nhẹ
        setStatus({
          type: "error",
          message:
            error.message ||
            "Không thể tải thông tin hồ sơ mới nhất. Bạn vẫn có thể chỉnh sửa.",
        });
      }
    }

    setEditingProfile((prev) => !prev);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileSubmitting(true);
    try {
      const payload = {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
        address: profileForm.address.trim() || null,
      };

      const updatedProfile = await updateCurrentUserProfile(payload);

      const updatedUser = {
        ...(storedUser || {}),
        ...updatedProfile,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setStoredUser(updatedUser);

      setStatus({
        type: "success",
        message: "Cập nhật thông tin hồ sơ thành công.",
      });
      setEditingProfile(false);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message ||
          "Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại sau.",
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

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
        <div className="text-center space-y-3">
          <div className="relative w-24 h-24 mx-auto mb-2">
            {storedUser?.avatar || avatarPreview ? (
              <img
                src={avatarPreview || storedUser?.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
            )}

            <label
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer border border-gray-200"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
              <span className="text-xs font-medium text-blue-600">
                {avatarUploading ? "..." : "Sửa"}
              </span>
            </label>
          </div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-gray-600">{storedUser?.email}</p>
          <p className="text-gray-500 text-sm mt-1">
            {storedUser?.phone || "Chưa cập nhật số điện thoại"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            onClick={handleToggleEditProfile}
          >
            {editingProfile ? "Đóng chỉnh sửa" : "Chỉnh sửa hồ sơ"}
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

        {editingProfile && (
          <form
            onSubmit={handleProfileSubmit}
            className="space-y-6 border-t pt-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profileForm.full_name}
                  onChange={handleProfileFieldChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    profileErrors.full_name
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-200"
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {profileErrors.full_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {profileErrors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={storedUser?.email || ""}
                  disabled
                  className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileFieldChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    profileErrors.phone
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-200"
                  }`}
                  placeholder="Nhập số điện thoại"
                />
                {profileErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {profileErrors.phone}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <textarea
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileFieldChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                    profileErrors.address
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-200"
                  }`}
                  placeholder="Nhập địa chỉ nhận hàng của bạn"
                />
                {profileErrors.address && (
                  <p className="text-sm text-red-500 mt-1">
                    {profileErrors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setEditingProfile(false)}
                disabled={profileSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={profileSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {profileSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
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

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  changePassword,
  parseStoredUser,
  uploadAvatar,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  logout as logoutApi,
} from "../services/authApi";
import { emitAuthChanged } from "../utils/authEvents";

const initialPasswordState = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [storedUser, setStoredUser] = useState(() => parseStoredUser());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
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
    email: storedUser?.email || "",
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [showPhoneChange, setShowPhoneChange] = useState(false);

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
      email: storedUser?.email || "",
    });
  }, [storedUser]);

  // Tự động ẩn thông báo sau 2 giây
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: "", message: "" });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status.message]);

  const displayName = useMemo(() => {
    return (
      storedUser?.full_name ||
      storedUser?.name ||
      storedUser?.username ||
      "Người dùng"
    );
  }, [storedUser]);

  // Kiểm tra xem có thay đổi thông tin không
  const hasChanges = useMemo(() => {
    const currentFullName = profileForm.full_name?.trim() || "";
    const currentPhone = profileForm.phone?.trim() || "";
    const currentAddress = profileForm.address?.trim() || "";
    
    const originalFullName = storedUser?.full_name || "";
    const originalPhone = storedUser?.phone || "";
    const originalAddress = storedUser?.address || "";

    return (
      currentFullName !== originalFullName ||
      currentPhone !== originalPhone ||
      currentAddress !== originalAddress
    );
  }, [profileForm, storedUser]);

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
    if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
    }

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
      
      // Note: gender and date_of_birth might not be in API yet, but we can store them locally
      // If API supports them, add to payload:
      // gender: profileForm.gender || null,
      // date_of_birth: profileForm.date_of_birth || null,

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
      setShowPhoneChange(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex gap-4">
        {/* User Sidebar Menu */}
        <div className="w-64 bg-white shadow-lg rounded-lg flex flex-col flex-shrink-0">
          {/* User Info Header */}
          <div className="bg-primary-100 p-4 flex items-center space-x-3 flex-shrink-0 rounded-t-lg">
            {storedUser?.avatar ? (
              <img
                src={storedUser.avatar}
                alt={storedUser?.full_name || storedUser?.name || "User"}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.parentElement.querySelector(".avatar-fallback");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`avatar-fallback w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary-100 font-semibold text-base border-2 border-white shadow-md ${
                storedUser?.avatar ? "hidden" : ""
              }`}
            >
              {(storedUser?.full_name || storedUser?.name || storedUser?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {storedUser?.full_name || storedUser?.name || storedUser?.email || "User"}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-4 overflow-y-auto flex-1">
            {/* Tài Khoản Của Tôi với Submenu */}
            <div>
              <button
                onClick={() => {
                  setIsAccountMenuOpen(!isAccountMenuOpen);
                  if (!isAccountMenuOpen) {
                    setActiveTab("profile");
                    setShowPasswordForm(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-6 py-3 hover:bg-gray-100 transition ${
                  activeTab === "profile" || activeTab === "password"
                    ? "bg-gray-100 border-l-4 border-primary-100" 
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-800 font-medium">Tài Khoản Của Tôi</span>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Submenu */}
              {isAccountMenuOpen && (
                <div className="bg-gray-50">
                  <button
                    onClick={() => {
                      setActiveTab("profile");
                      setShowPasswordForm(false);
                      setEditingProfile(false);
                    }}
                    className={`w-full flex items-center px-10 py-2.5 hover:bg-gray-100 transition text-sm ${
                      activeTab === "profile" ? "text-red-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    Hồ Sơ
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("password");
                      setShowPasswordForm(true);
                    }}
                    className={`w-full flex items-center px-10 py-2.5 hover:bg-gray-100 transition text-sm ${
                      activeTab === "password" ? "text-red-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    Đổi Mật Khẩu
                  </button>
                </div>
              )}
            </div>
            
            <Link
              to="/orders"
              className={`flex items-center space-x-3 px-6 py-3 hover:bg-gray-100 transition ${
                location.pathname === "/orders" ? "bg-gray-100 border-l-4 border-primary-100" : ""
              }`}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-800 font-medium">Đơn Mua</span>
            </Link>
            
            <button
              className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-gray-100 transition text-left"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-gray-800 font-medium">Thông Báo</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={async () => {
                await logoutApi();
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                emitAuthChanged();
                navigate("/");
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Đăng Xuất</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Hồ Sơ Của Tôi</h1>
              <p className="text-gray-600 mb-6">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Form Fields */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Username - Read Only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên đăng nhập
                      </label>
                      <input
                        type="text"
                        value={storedUser?.username || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên
                      </label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
                        placeholder="Nhập tên của bạn"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={storedUser?.email ? `${storedUser.email.substring(0, 2)}*****${storedUser.email.substring(storedUser.email.indexOf('@'))}` : ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={showPhoneChange ? (profileForm.phone || "") : (storedUser?.phone && storedUser.phone.length > 2 ? `********${storedUser.phone.slice(-2)}` : "")}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          disabled={!showPhoneChange}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhoneChange(!showPhoneChange);
                            if (!showPhoneChange) {
                              setProfileForm({ ...profileForm, phone: storedUser?.phone || "" });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                        >
                          Thay Đổi
                        </button>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ
                      </label>
                      <textarea
                        name="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        rows={3}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none ${
                          profileErrors.address
                            ? "border-red-300 focus:ring-red-200"
                            : ""
                        }`}
                        placeholder="Nhập địa chỉ nhận hàng của bạn"
                      />
                      {profileErrors.address && (
                        <p className="text-sm text-red-500 mt-1">
                          {profileErrors.address}
                        </p>
                      )}
                    </div>

                    {/* Status Message */}
                    {status.message && (
                      <div
                        className={`rounded-lg border px-4 py-3 text-sm ${
                          status.type === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {status.message}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleProfileSubmit}
                        disabled={profileSubmitting || !hasChanges}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {profileSubmitting ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Avatar Upload */}
                  <div className="lg:col-span-1">
                    <div className="flex flex-col items-center">
                      <div className="relative w-32 h-32 mb-4">
                        {storedUser?.avatar || avatarPreview ? (
                          <img
                            src={avatarPreview || storedUser?.avatar}
                            alt="Avatar"
                            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-4xl">👤</span>
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                          disabled={avatarUploading}
                        />
                        <span className="inline-block px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                          {avatarUploading ? "Đang tải..." : "Chọn Ảnh"}
                        </span>
                      </label>
                      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
                        <p>Dụng lượng file tối đa 1 MB</p>
                        <p>Định dạng: .JPEG, .PNG</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Đổi mật khẩu</h1>

      <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
        {!showPasswordForm && (
          <>
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
                onClick={() => {
                  setActiveTab("password");
                  setShowPasswordForm(true);
                }}
          >
                Thay đổi mật khẩu
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

          </>
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
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
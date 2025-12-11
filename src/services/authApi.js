const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Perform login request.
 * @param {{ email: string; password: string }} payload
 * @returns {Promise<{ access_token: string; user: Record<string, any> }>}
 */
export const login = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message ||
      "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin của bạn.";
    throw new Error(message);
  }

  if (!result?.data) {
    throw new Error("Phản hồi không hợp lệ từ máy chủ.");
  }

  return result.data;
};

/**
 * Perform signup request.
 * @param {{ email: string; password: string; full_name: string; phone: string; address?: string }} payload
 * @returns {Promise<{ email: string; verification_required: boolean }>}
 */
export const signup = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message ||
      "Không thể đăng ký. Vui lòng kiểm tra lại thông tin của bạn.";
    throw new Error(message);
  }

  if (!result?.data) {
    throw new Error("Phản hồi không hợp lệ từ máy chủ.");
  }

  return result.data;
};

/**
 * Verify email with OTP code.
 * @param {{ email: string; verification_code: string }} payload
 */
export const verifyEmail = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result?.message || "Mã xác thực không hợp lệ.";
    throw new Error(message);
  }

  return result.data;
};

/**
 * Resend verification code to email.
 * @param {{ email: string }} payload
 */
export const resendVerification = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể gửi lại mã. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result.data;
};

/**
 * Call logout endpoint (best effort, errors ignored).
 */
export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.warn("Không thể gọi API logout:", error);
  }
};

export const parseStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Lấy thông tin hồ sơ người dùng hiện tại.
 * GET /auth/profile hoặc /users/me tuỳ BE
 */
export const fetchCurrentUserProfile = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  // BE có 2 endpoint: /auth/profile và /users/me, ưu tiên /auth/profile
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể lấy thông tin hồ sơ. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data;
};

/**
 * Cập nhật thông tin hồ sơ người dùng hiện tại (full/partial).
 * Sử dụng PATCH /users/me với body dạng UpdateProfileRequest.
 * @param {{ full_name?: string; phone?: string; address?: string }} payload
 */
export const updateCurrentUserProfile = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data;
};

/**
 * Change password for authenticated user.
 * @param {{ old_password: string; new_password: string }} payload
 */
export const changePassword = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message || "Không thể đổi mật khẩu. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data ?? null;
};

/**
 * Upload / cập nhật avatar người dùng hiện tại.
 * @param {File} file - File ảnh avatar
 * @returns {Promise<any>} dữ liệu `data` từ ApiResponse của BE
 */
export const uploadAvatar = async (file) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!file) {
    throw new Error("Vui lòng chọn file ảnh.");
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Không set "Content-Type" để browser tự thêm boundary cho multipart/form-data
    },
    credentials: "include",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message ||
      "Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.";
    throw new Error(message);
  }

  return result?.data;
};

/**
 * Request password reset (forgot password).
 * @param {{ email: string }} payload
 * @returns {Promise<{ email: string; message: string }>}
 */
export const forgotPassword = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      // Response is not JSON
      if (!response.ok) {
        throw new Error(
          `Không thể gửi mã đặt lại mật khẩu. Lỗi ${response.status}: ${response.statusText}`
        );
      }
      throw new Error("Phản hồi không hợp lệ từ máy chủ.");
    }

    if (!response.ok) {
      // Backend uses ErrorResponse format (not ApiResponse) for errors
      // ErrorResponse has: message, errorCode, statusCode, path, errors (optional)
      const errorMessage =
        result?.message ||
        result?.error ||
        result?.errorMessage ||
        result?.data?.message ||
        `Không thể gửi mã đặt lại mật khẩu. ${response.status === 404 ? "Email không tồn tại trong hệ thống." : response.status === 400 ? "Email không hợp lệ hoặc tài khoản chưa được kích hoạt." : response.status === 500 ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ." : "Vui lòng thử lại sau."}`;
      throw new Error(errorMessage);
    }

    // Success response uses ApiResponse format: { success: true, message: "...", data: {...} }
    return result?.data ?? result;
  } catch (error) {
    // If it's already an Error with message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(
      error?.message || "Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại sau."
    );
  }
};

/**
 * Reset password with reset code.
 * @param {{ email: string; reset_code: string; new_password: string }} payload
 * @returns {Promise<{ email: string; reset_at: string }>}
 */
export const resetPassword = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      // Response is not JSON
      if (!response.ok) {
        throw new Error(
          `Không thể đặt lại mật khẩu. Lỗi ${response.status}: ${response.statusText}`
        );
      }
      throw new Error("Phản hồi không hợp lệ từ máy chủ.");
    }

    if (!response.ok) {
      // Try to get error message from various possible fields
      const errorMessage =
        result?.message ||
        result?.error ||
        result?.errorMessage ||
        result?.data?.message ||
        `Không thể đặt lại mật khẩu. ${response.status === 400 ? "Mã đặt lại mật khẩu không đúng hoặc đã hết hạn." : response.status === 404 ? "Email không tồn tại trong hệ thống." : "Vui lòng kiểm tra lại mã xác thực."}`;
      throw new Error(errorMessage);
    }

    return result?.data ?? result;
  } catch (error) {
    // If it's already an Error with message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(
      error?.message || "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã xác thực."
    );
  }
};

/**
 * Sync guest cart after login
 * This should be called after successful login
 */
export const syncGuestCartAfterLogin = async () => {
  try {
    const { getGuestCart, clearGuestCart } = await import("../utils/guestCart");
    const { syncCart } = await import("./cartApi");
    
    const guestCart = getGuestCart();
    
    if (guestCart.length > 0) {
      const result = await syncCart({
        guest_cart_items: guestCart,
      });

      clearGuestCart();
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error("Error syncing guest cart:", error);
    return null;
  }
};


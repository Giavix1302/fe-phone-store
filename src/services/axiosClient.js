import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api", // sửa theo backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token vào request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi response
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error);
    throw error;
  }
);

export default instance;
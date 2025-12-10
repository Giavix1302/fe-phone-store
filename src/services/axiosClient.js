import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const instance = axios.create({
  baseURL: API_BASE_URL,
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

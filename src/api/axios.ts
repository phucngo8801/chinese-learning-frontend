import Axios from "axios";
import toast from "../lib/toast";
import { clearAuthToken, getAuthToken } from "../lib/authToken";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
  // UX: tránh treo request quá lâu khi backend chết / mạng kém
  timeout: 15000,
});

// ✅ Auto attach Bearer token
axios.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// (tuỳ chọn) nếu 401 thì xoá token để khỏi loop
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    // Abort/cancel (ví dụ user bấm đổi HSK liên tục) => không show toast "mất kết nối"
    if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
      return Promise.reject(err);
    }

    const status = err?.response?.status;

    // Network / CORS / server down
    if (!status) {
      toast.error("Không kết nối được server. Kiểm tra lại mạng hoặc backend.", { id: "net-down" });
      return Promise.reject(err);
    }

    // Auth expired / invalid
    if (status === 401) {
      clearAuthToken();
      // Avoid spamming toast if multiple parallel requests fail
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { id: "auth-401" });
    }

    // Rate limit
    if (status === 429) {
      toast.error("Bạn thao tác quá nhanh. Vui lòng thử lại sau vài giây.", { id: "rate-429" });
    }

    return Promise.reject(err);
  }
);

export default axios;

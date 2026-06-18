import axios from "axios";
import { message } from "antd";
import { storage } from "@/utils/storage";

const request = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// -------- 请求拦截：带上 Access Token --------
request.interceptors.request.use((config) => {
  const token = storage.get<string>("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -------- 无感刷新队列 --------
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

async function refreshAccessToken(): Promise<string> {
  const refreshToken = storage.get<string>("refreshToken");
  if (!refreshToken) throw new Error("无 Refresh Token");

  const res = await axios.post("/api/auth/refresh", { refreshToken });
  const { accessToken, refreshToken: newRefresh } = res.data.data;

  storage.set("accessToken", accessToken);
  storage.set("refreshToken", newRefresh);

  return accessToken;
}

// -------- 响应拦截 --------
request.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;

    // 401 → 尝试刷新 Token
    if (response?.status === 401 && !config._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          pendingQueue.forEach((p) => p.resolve(newToken));
          pendingQueue = [];
          return request({ ...config, _retry: true });
        } catch {
          pendingQueue.forEach((p) => p.reject(error));
          pendingQueue = [];
          storage.clear();
          // 根据当前路径跳转对应登录页：商城 → /shop/login，管理端 → /login
          const isShopPath = window.location.pathname.startsWith("/shop");
          window.location.href = isShopPath ? `/shop/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : "/login";
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // 已有刷新进行中，排队等待
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(request(config));
          },
          reject,
        });
      });
    }

    // 业务错误提示
    const msg = response?.data?.message || error.message || "网络错误";
    if (msg) message.error(msg);

    return Promise.reject(error);
  }
);

export default request;

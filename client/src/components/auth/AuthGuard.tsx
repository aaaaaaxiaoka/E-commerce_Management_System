import { Navigate } from "react-router-dom";
import { storage } from "@/utils/storage";

/**
 * 路由守卫：未登录 → 跳转登录页
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = storage.get<string>("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

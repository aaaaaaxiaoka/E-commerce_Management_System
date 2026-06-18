import { Navigate, useLocation } from "react-router-dom";
import { Result, Button } from "antd";
import { storage } from "@/utils/storage";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * 商城路由守卫：仅允许访客(guest)角色进入
 * - 未登录 → 跳转商城登录页
 * - 已登录但非 guest → 显示无权限提示 + 可跳转管理后台
 */
export default function ShopAuthGuard({ children }: { children: React.ReactNode }) {
  const token = storage.get<string>("accessToken");
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  if (!token) {
    const from = location.pathname + location.search;
    return <Navigate to={`/shop/login?redirect=${encodeURIComponent(from)}`} replace />;
  }

  // 用户信息未加载完成时放行（避免闪烁），后续渲染时会再次检查
  if (!user) {
    return <>{children}</>;
  }

  // 仅允许 guest 角色
  const roles = user.roles || [];
  if (!roles.includes("guest")) {
    return (
      <Result
        status="403"
        title="无权访问商城"
        subTitle="管理员和编辑角色不能进入商城界面，请使用访客账号登录"
        extra={
          <Button type="primary" onClick={() => window.location.href = "/dashboard"}>
            前往管理后台
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

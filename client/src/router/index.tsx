import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Spin } from "antd";
import AuthGuard from "@/components/auth/AuthGuard";
import ShopAuthGuard from "@/components/auth/ShopAuthGuard";

// ========== 懒加载所有页面 ==========
const LoginPage = lazy(() => import("@/pages/login"));
const ShopLoginPage = lazy(() => import("@/pages/shop/login"));
const ShopRegisterPage = lazy(() => import("@/pages/shop/register"));
const MainLayout = lazy(() => import("@/layouts/MainLayout"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ProductPage = lazy(() => import("@/pages/product"));
const OrderPage = lazy(() => import("@/pages/order"));
const UserPage = lazy(() => import("@/pages/system/user"));
const RolePage = lazy(() => import("@/pages/system/role"));
const MenuPage = lazy(() => import("@/pages/system/menu"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const Error404 = lazy(() => import("@/pages/error/NotFound"));

// ========== 全局 Loading ==========
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spin size="large" tip="加载中..." />
    </div>
  );
}

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoading />}>{children}</Suspense>
);

// ========== 懒加载商场页面 ==========
const ShopLayout = lazy(() => import("@/layouts/ShopLayout"));
const ProductCatalogPage = lazy(() => import("@/pages/shop"));
const CartPage = lazy(() => import("@/pages/cart"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const MyOrdersPage = lazy(() => import("@/pages/my-orders"));
const ShopProfilePage = lazy(() => import("@/pages/profile"));
const ProductDetailPage = lazy(() => import("@/pages/shop/detail"));

// ========== 路由表 ==========
export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <LazyLoad>
        <LoginPage />
      </LazyLoad>
    ),
  },
  // -------- 商城登录/注册（公开路由）--------
  {
    path: "/shop/login",
    element: <LazyLoad><ShopLoginPage /></LazyLoad>,
  },
  {
    path: "/shop/register",
    element: <LazyLoad><ShopRegisterPage /></LazyLoad>,
  },
  // -------- 商城路由（独立布局，无管理侧栏）--------
  {
    path: "/shop",
    element: (
      <ShopAuthGuard>
        <LazyLoad>
          <ShopLayout />
        </LazyLoad>
      </ShopAuthGuard>
    ),
    children: [
      { index: true, element: <LazyLoad><ProductCatalogPage /></LazyLoad> },
      { path: "cart", element: <LazyLoad><CartPage /></LazyLoad> },
      { path: "checkout", element: <LazyLoad><CheckoutPage /></LazyLoad> },
      { path: "orders", element: <LazyLoad><MyOrdersPage /></LazyLoad> },
      { path: "profile", element: <LazyLoad><ShopProfilePage /></LazyLoad> },
      { path: "product/:id", element: <LazyLoad><ProductDetailPage /></LazyLoad> },
    ],
  },
  // -------- 管理后台路由 --------
  {
    path: "/",
    element: (
      <AuthGuard>
        <LazyLoad>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </LazyLoad>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <LazyLoad>
            <DashboardPage />
          </LazyLoad>
        ),
      },
      {
        path: "product",
        element: (
          <LazyLoad>
            <ProductPage />
          </LazyLoad>
        ),
      },
      {
        path: "order",
        element: (
          <LazyLoad>
            <OrderPage />
          </LazyLoad>
        ),
      },
      {
        path: "system/user",
        element: (
          <LazyLoad>
            <UserPage />
          </LazyLoad>
        ),
      },
      {
        path: "system/role",
        element: (
          <LazyLoad>
            <RolePage />
          </LazyLoad>
        ),
      },
      {
        path: "system/menu",
        element: (
          <LazyLoad>
            <MenuPage />
          </LazyLoad>
        ),
      },
      {
        path: "profile",
        element: (
          <LazyLoad>
            <ProfilePage />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <LazyLoad>
        <Error404 />
      </LazyLoad>
    ),
  },
]);

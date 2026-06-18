import { useMemo } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Layout, Button, Dropdown, Badge, Space, Typography, theme, Breadcrumb, Avatar, Divider } from "antd";
import type { MenuProps } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  ShopOutlined,
  BulbOutlined,
  BulbFilled,
  TranslationOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useCartStore } from "@/store/useCartStore";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const NAV_LINKS = [
  { path: "/shop", label: "shop.catalog", icon: <ShopOutlined /> },
  { path: "/shop/orders", label: "shop.myOrders", icon: <OrderedListOutlined /> },
];

const BREADCRUMB_NAMES: Record<string, string> = {
  "/shop": "shop.catalog",
  "/shop/cart": "cart.title",
  "/shop/checkout": "checkout.title",
  "/shop/orders": "shop.myOrders",
};

export default function ShopLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme: themeMode, toggleTheme } = useAppStore();
  const totalCount = useCartStore((s) => s.totalCount());
  const antdTheme = theme.useToken();
  const isDark = themeMode === "dark";

  const breadcrumbItems: any[] = useMemo(() => {
    const items: any[] = [{ title: <Link to="/shop"><HomeOutlined /> {t("shop.title")}</Link> }];
    const nameKey = BREADCRUMB_NAMES[location.pathname];
    if (nameKey && location.pathname !== "/shop") {
      items.push({ title: t(nameKey) });
    }
    return items;
  }, [location.pathname, t]);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: t("shop.personalInfo"),
      onClick: () => navigate("/shop/profile"),
    },
    {
      key: "orders",
      icon: <OrderedListOutlined />,
      label: t("shop.myOrders"),
      onClick: () => navigate("/shop/orders"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("shop.logout"),
      onClick: async () => {
        await logout();
        navigate("/shop/login", { replace: true });
      },
    },
  ];

  const toggleLanguage = () => {
    const next = i18n.language === "zh-CN" ? "en-US" : "zh-CN";
    i18n.changeLanguage(next);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: antdTheme.token.colorBgLayout }}>
      {/* ---------- 顶部导航 ---------- */}
      <Header
        style={{
          padding: "0 32px",
          background: antdTheme.token.colorBgContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${antdTheme.token.colorBorderSecondary}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 56,
          lineHeight: "56px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* 左侧：Logo + 导航链接 */}
        <Space size={32}>
          <Space
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/shop")}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${antdTheme.token.colorPrimary}, ${antdTheme.token.colorPrimaryActive})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShopOutlined style={{ fontSize: 18, color: "#fff" }} />
            </div>
            <Text strong style={{ fontSize: 18, letterSpacing: -0.5 }}>
              AdminFlow
            </Text>
          </Space>

          <Space size={4}>
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  type="text"
                  onClick={() => navigate(link.path)}
                  style={{
                    color: active ? antdTheme.token.colorPrimary : undefined,
                    fontWeight: active ? 600 : 400,
                    background: active ? antdTheme.token.colorPrimaryBg : undefined,
                  }}
                  icon={link.icon}
                >
                  {t(link.label)}
                </Button>
              );
            })}
          </Space>
        </Space>

        {/* 右侧：操作区 */}
        <Space size={4}>
          <Badge count={totalCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
              onClick={() => navigate("/shop/cart")}
              style={{ width: 40, height: 40 }}
            />
          </Badge>

          <Divider type="vertical" style={{ height: 20, borderColor: antdTheme.token.colorBorderSecondary }} />

          <Button type="text" icon={<TranslationOutlined />} onClick={toggleLanguage} size="small">
            {i18n.language === "zh-CN" ? "EN" : "中文"}
          </Button>

          <Button
            type="text"
            size="small"
            icon={isDark ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleTheme}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 8, marginLeft: 4 }}
              className="hover:bg-gray-50"
            >
              <Avatar size={28} icon={<UserOutlined />}
                style={{ background: antdTheme.token.colorPrimary }}
              />
              <span style={{ fontSize: 14, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.username || t("shop.guest")}
              </span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      {/* ---------- 面包屑 ---------- */}
      <div style={{
        maxWidth: 1200, margin: "0 auto", width: "100%",
        padding: "16px 24px 0",
      }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* ---------- 内容区 ---------- */}
      <Content style={{ padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto", minHeight: 400 }}>
        <Outlet />
      </Content>

      {/* ---------- 底部 ---------- */}
      <Footer style={{
        textAlign: "center",
        background: antdTheme.token.colorBgContainer,
        borderTop: `1px solid ${antdTheme.token.colorBorderSecondary}`,
        padding: "16px 24px",
      }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          AdminFlow © {new Date().getFullYear()} — Built with React + Ant Design
        </Text>
      </Footer>
    </Layout>
  );
}

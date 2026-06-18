import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Avatar, theme, Space, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined,
  SettingOutlined, DashboardOutlined, ShoppingOutlined, OrderedListOutlined,
  TeamOutlined, MenuOutlined, BulbOutlined, BulbFilled, TranslationOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import type { MenuItem as MenuItemType } from "@/api/auth";

const { Header, Sider, Content } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  ShoppingOutlined: <ShoppingOutlined />,
  OrderedListOutlined: <OrderedListOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
};

// 菜单名称 → i18n key 映射
const menuI18nKeyMap: Record<string, string> = {
  "概览": "menu.dashboard", "Dashboard": "menu.dashboard",
  "商品管理": "menu.product", "Products": "menu.product",
  "订单管理": "menu.order", "Orders": "menu.order",
  "系统管理": "menu.system", "System": "menu.system",
  "用户管理": "menu.user", "Users": "menu.user",
  "角色管理": "menu.role", "Roles": "menu.role",
  "菜单管理": "menu.menu", "Menus": "menu.menu",
};

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const { user, menuTree, logout } = useAuthStore();
  const { theme: themeMode, toggleTheme } = useAppStore();
  const antdTheme = theme.useToken();

  const isDark = themeMode === "dark";

  // 将后端菜单树 → Ant Design Menu（翻译菜单名）
  function toAntdMenuItems(menus: MenuItemType[]): MenuProps["items"] {
    return menus
      .filter((m) => !m.hidden)
      .map((menu) => ({
        key: menu.path || `menu_${menu.id}`,
        label: t(menuI18nKeyMap[menu.name] || menu.name),
        icon: menu.icon ? iconMap[menu.icon] : undefined,
        children: menu.children ? toAntdMenuItems(menu.children) : undefined,
      }));
  }

  const antdMenuItems = toAntdMenuItems(menuTree);

  const userMenuItems: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: t("menu.profile"), onClick: () => navigate("/profile") },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: async () => { await logout(); navigate("/login", { replace: true }); } },
  ];

  const toggleLanguage = () => {
    const next = i18n.language === "zh-CN" ? "en-US" : "zh-CN";
    i18n.changeLanguage(next);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}
        style={isDark ? {} : undefined}
      >
        <div style={{
          height: 48, margin: "12px 16px", color: "#fff",
          fontSize: collapsed ? 16 : 18, fontWeight: 700,
          textAlign: "center", lineHeight: "48px",
          overflow: "hidden", whiteSpace: "nowrap",
        }}>
          {collapsed ? "🛒" : "AdminFlow"}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={antdMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: "0 24px", background: antdTheme.token.colorBgContainer,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${antdTheme.token.colorBorderSecondary}`,
        }}>
          <Button type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <Space size="middle">
            {/* 语言切换 */}
            <Tooltip title={t("lang.switch")}>
              <Button type="text" icon={<TranslationOutlined />} onClick={toggleLanguage}>
                {i18n.language === "zh-CN" ? "EN" : "中"}
              </Button>
            </Tooltip>

            {/* 主题切换 */}
            <Tooltip title={isDark ? t("theme.light") : t("theme.dark")}>
              <Button type="text"
                icon={isDark ? <BulbFilled /> : <BulbOutlined />}
                onClick={toggleTheme}
              />
            </Tooltip>

            {/* 用户下拉 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{user?.username || "未登录"}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: 16, padding: 24,
          background: antdTheme.token.colorBgContainer,
          borderRadius: antdTheme.token.borderRadiusLG,
          overflow: "auto",
        }}>
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
}

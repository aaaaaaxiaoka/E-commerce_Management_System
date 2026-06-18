import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Form, Input, Button, Card, Typography, App, Divider, Space, notification } from "antd";
import { UserOutlined, LockOutlined, ShopOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function ShopLoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      // 登录后检查角色：非 guest 用户跳转管理后台
      const roles = useAuthStore.getState().user?.roles || [];
      if (!roles.includes("guest")) {
        message.info("管理员/编辑角色请从管理后台登录");
        navigate("/dashboard", { replace: true });
        return;
      }
      message.success(t("shop.loginSuccess"));
      // 如果有 redirect 参数，跳回去；否则去商城首页
      const redirect = searchParams.get("redirect");
      navigate(redirect || "/shop", { replace: true });
    } catch (err: any) {
      // 用户不存在 → 弹窗提示注册
      const msg = err?.response?.data?.message || err?.message || "";
      if (msg.includes("用户不存在") || msg.includes("请先注册")) {
        notification.warning({
          message: t("shop.loginFailed"),
          description: t("shop.userNotFoundGoRegister"),
          btn: (
            <Button type="primary" size="small" onClick={() => navigate("/shop/register")}>
              {t("shop.createAccount")}
            </Button>
          ),
          duration: 6,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 50%, #d6e4ff 100%)",
      padding: 24,
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
        bordered={false}
      >
        {/* 顶部品牌区 */}
        <div style={{
          background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
          padding: "32px 32px 24px",
          textAlign: "center",
          color: "#fff",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <ShopOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
            AdminFlow {t("shop.title")}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
            {t("shop.loginSubtitle")}
          </Text>
        </div>

        {/* 表单区 */}
        <div style={{ padding: "32px 32px 24px" }}>
          <Form
            name="shop-login"
            size="large"
            onFinish={onFinish}
            initialValues={{ username: "", password: "" }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: t("shop.usernameRequired") }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.usernamePlaceholder")}
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: t("shop.passwordRequired") }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.passwordPlaceholder")}
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ borderRadius: 8, height: 48, fontSize: 16, fontWeight: 600 }}
              >
                {t("shop.signIn")}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t("shop.noAccount")} <Link to="/shop/register">{t("shop.createAccount")}</Link>
            </Text>
          </div>

          <Divider style={{ margin: "12px 0", fontSize: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t("shop.orBack")}</Text>
          </Divider>

          <div style={{ textAlign: "center" }}>
            <Link to="/login">
              <Button type="link" icon={<ArrowLeftOutlined />} size="small">
                {t("shop.goToAdmin")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

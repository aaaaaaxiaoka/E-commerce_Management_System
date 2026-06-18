import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, App, Divider } from "antd";
import {
  UserOutlined, LockOutlined, MailOutlined, ShopOutlined, ArrowLeftOutlined,
} from "@ant-design/icons";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function ShopRegisterPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error(t("shop.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      // 注册
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      message.success(t("shop.registerSuccess"));

      // 注册成功后自动登录
      await login({ username: values.username, password: values.password });
      navigate("/shop", { replace: true });
    } catch {
      // error handled by interceptor
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
            {t("shop.createAccount")}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
            {t("shop.registerSubtitle")}
          </Text>
        </div>

        {/* 表单区 */}
        <div style={{ padding: "32px 32px 24px" }}>
          <Form
            name="shop-register"
            size="large"
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t("shop.usernameRequired") },
                { min: 3, message: t("shop.usernameMinLen") },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.usernamePlaceholder")}
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("shop.emailRequired") },
                { type: "email", message: t("shop.emailInvalid") },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.emailPlaceholder")}
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t("shop.passwordRequired") },
                { min: 6, message: t("shop.passwordMinLen") },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.passwordPlaceholder")}
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[{ required: true, message: t("shop.confirmPasswordRequired") }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bbb" }} />}
                placeholder={t("shop.confirmPasswordPlaceholder")}
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
                {t("shop.signUp")}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t("shop.haveAccount")} <Link to="/shop/login">{t("shop.goSignIn")}</Link>
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

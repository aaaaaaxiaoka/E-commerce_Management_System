import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      // 错误已在 request 拦截器中提示，这里无需重复
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card
        style={{ width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
        bordered={false}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            AdminFlow
          </Title>
          <Text type="secondary">商品订单管理系统</Text>
        </div>

        <Form
          name="login"
          size="large"
          onFinish={onFinish}
          initialValues={{ username: "admin", password: "123456" }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            还没有账号？<Link to="/register">立即注册</Link>
            &nbsp;|&nbsp; 管理员: admin/123456
          </Text>
        </div>
      </Card>
    </div>
  );
}

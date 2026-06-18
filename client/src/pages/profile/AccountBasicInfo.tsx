import { useState, useEffect } from "react";
import { Form, Input, Button, Descriptions, Tag, App } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import UploadImage from "@/components/form/UploadImage";

export default function AccountBasicInfo() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 用户数据加载后同步到表单
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  const handleAvatarChange = async (url: string) => {
    setLoading(true);
    try {
      await updateProfile({ avatar: url });
      message.success(t("profile.updateSuccess"));
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: { phone: string; email: string }) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success(t("profile.updateSuccess"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* 头像 */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <UploadImage value={user.avatar || undefined} onChange={handleAvatarChange} />
        <div style={{ marginTop: 8, color: "#999", fontSize: 13 }}>{t("profile.updateAvatar")}</div>
      </div>

      {/* 只读信息 */}
      <Descriptions column={2} size="small" bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label={t("profile.userId")}>{user.id}</Descriptions.Item>
        <Descriptions.Item label={t("profile.username")}>{user.username}</Descriptions.Item>
        <Descriptions.Item label={t("profile.registeredAt")}>
          {user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD HH:mm") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("profile.accountStatus")}>
          <Tag color={user.status === 1 ? "green" : "red"}>
            {user.status === 1 ? t("profile.normal") : t("profile.disabled")}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 可编辑：手机号 + 邮箱 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="phone"
          label={t("profile.phone")}
          rules={[{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" }]}
        >
          <Input placeholder="请输入手机号" maxLength={11} />
        </Form.Item>
        <Form.Item
          name="email"
          label={t("profile.email")}
          rules={[{ type: "email", message: "请输入正确的邮箱" }]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t("profile.updateProfile")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

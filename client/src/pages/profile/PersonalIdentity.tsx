import { useState, useEffect } from "react";
import { Form, Input, Radio, DatePicker, Cascader, Button, App } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { regionOptions } from "@/utils/regionData";

export default function PersonalIdentity() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 用户数据加载后同步到表单（解决页面刷新后 initialValues 不更新的问题）
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        nickname: user.nickname || "",
        realName: user.realName || "",
        idNumber: user.idNumber || "",
        gender: user.gender ?? 0,
        birthday: user.birthday ? dayjs(user.birthday) : undefined,
      });
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const { region, birthday, ...rest } = values;
      await updateProfile({
        ...rest,
        birthday: birthday ? dayjs(birthday).toISOString() : undefined,
        province: region?.[0] ? regionOptions.find((o) => o.value === region[0])?.label : undefined,
        city: region?.[1]
          ? regionOptions
              .find((o) => o.value === region[0])
              ?.children?.find((c) => c.value === region[1])?.label
          : undefined,
        district: region?.[2]
          ? regionOptions
              .find((o) => o.value === region[0])
              ?.children?.find((c) => c.value === region[1])
              ?.children?.find((d) => d.value === region[2])?.label
          : undefined,
      });
      message.success(t("profile.updateSuccess"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 480 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item name="nickname" label={t("profile.nickname")} rules={[{ max: 30 }]}>
          <Input placeholder="请输入昵称" maxLength={30} />
        </Form.Item>

        <Form.Item name="realName" label={t("profile.realName")} rules={[{ max: 50 }]}>
          <Input placeholder="请输入真实姓名" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="idNumber"
          label={t("profile.idNumber")}
          rules={[{ pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: "身份证号格式不正确" }]}
        >
          <Input placeholder="请输入身份证号" maxLength={18} />
        </Form.Item>

        <Form.Item name="gender" label={t("profile.gender")}>
          <Radio.Group>
            <Radio value={0}>{t("profile.genderUnknown")}</Radio>
            <Radio value={1}>{t("profile.male")}</Radio>
            <Radio value={2}>{t("profile.female")}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="birthday" label={t("profile.birthday")}>
          <DatePicker style={{ width: "100%" }} placeholder="请选择出生日期" />
        </Form.Item>

        <Form.Item name="region" label={t("profile.region")}>
          <Cascader options={regionOptions} placeholder={t("profile.selectRegion")} />
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

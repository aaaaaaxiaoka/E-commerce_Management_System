import { useState, useEffect, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Cascader, Select, App, Tag, Popconfirm, Space, Empty } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { addressApi, type AddressItem, type AddressFormData } from "@/api/address";
import { regionOptions } from "@/utils/regionData";

const TAG_OPTIONS = [
  { labelKey: "profile.tagHome", value: "home" },
  { labelKey: "profile.tagWork", value: "work" },
  { labelKey: "profile.tagSchool", value: "school" },
  { labelKey: "profile.tagOther", value: "other" },
];

/** Cascader 编码路径 → 名称路径 ["440000","440300","440305"] → ["广东省","深圳市","南山区"] */
function codesToLabels(codes: string[]): string[] | null {
  const province = regionOptions.find((o) => o.value === codes[0]);
  if (!province) return null;
  const city = province.children?.find((c) => c.value === codes[1]);
  if (!city) return null;
  const district = city.children?.find((d) => d.value === codes[2]);
  if (!district) return null;
  return [province.label, city.label, district.label];
}

/** 名称路径 → Cascader 编码路径 ["广东省","深圳市","南山区"] → ["440000","440300","440305"] */
function labelsToCodes(labels: string[]): string[] | null {
  const province = regionOptions.find((o) => o.label === labels[0]);
  if (!province) return null;
  const city = province.children?.find((c) => c.label === labels[1]);
  if (!city) return null;
  const district = city.children?.find((d) => d.label === labels[2]);
  if (!district) return null;
  return [province.value, city.value, district.value];
}

export default function ShippingAddresses() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressApi.list();
      setAddresses(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ tag: "home", isDefault: false });
    setModalOpen(true);
  };

  const openEdit = (record: AddressItem) => {
    setEditing(record);
    const codes = labelsToCodes([record.province, record.city, record.district]);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      region: codes || undefined,
      detail: record.detail,
      zipCode: record.zipCode || "",
      tag: record.tag || "home",
      isDefault: record.isDefault,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const labels = codesToLabels(values.region);
      if (!labels) { message.error("请选择完整的省市区"); return; }
      const data: AddressFormData = {
        name: values.name,
        phone: values.phone,
        province: labels[0],
        city: labels[1],
        district: labels[2],
        detail: values.detail,
        zipCode: values.zipCode || null,
        tag: values.tag || "home",
        isDefault: values.isDefault || false,
      };

      if (editing) {
        await addressApi.update(editing.id, data);
        message.success(t("profile.addressUpdated"));
      } else {
        await addressApi.create(data);
        message.success(t("profile.addressCreated"));
      }
      setModalOpen(false);
      fetchAddresses();
    } catch {
      // validation errors handled by form
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await addressApi.remove(id);
    message.success(t("profile.addressDeleted"));
    fetchAddresses();
  };

  const handleSetDefault = async (id: number) => {
    await addressApi.setDefault(id);
    fetchAddresses();
  };

  const tagColorMap: Record<string, string> = {
    home: "blue", work: "orange", school: "green", other: "default",
  };

  const columns = [
    {
      title: t("profile.receiverName"), dataIndex: "name", key: "name", width: 100,
    },
    {
      title: t("profile.receiverPhone"), dataIndex: "phone", key: "phone", width: 130,
    },
    {
      title: t("profile.detailAddress"), key: "address",
      render: (_: any, r: AddressItem) =>
        `${r.province} ${r.city} ${r.district} ${r.detail}`,
    },
    {
      title: t("profile.addressTag"), dataIndex: "tag", key: "tag", width: 80,
      render: (tag: string | null) => {
        if (!tag) return null;
        const name = TAG_OPTIONS.find((o) => o.value === tag)?.labelKey || tag;
        return <Tag color={tagColorMap[tag] || "default"}>{t(name)}</Tag>;
      },
    },
    {
      title: t("profile.defaultAddress"), key: "isDefault", width: 80, align: "center" as const,
      render: (_: any, r: AddressItem) =>
        r.isDefault ? <Tag color="gold">{t("profile.defaultAddress")}</Tag> : null,
    },
    {
      title: t("common.actions"), key: "actions", width: 180,
      render: (_: any, r: AddressItem) => (
        <Space size="small">
          {!r.isDefault && (
            <Button type="link" size="small" icon={<StarOutlined />}
              onClick={() => handleSetDefault(r.id)}>
              {t("profile.setDefault")}
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(r)} />
          <Popconfirm title={t("profile.deleteAddressConfirm")}
            onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {t("profile.addAddress")}
        </Button>
      </div>

      <Table
        dataSource={addresses}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description={t("profile.noAddress")} /> }}
      />

      <Modal
        title={editing ? t("profile.editAddress") : t("profile.addAddress")}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t("profile.receiverName")}
            rules={[{ required: true, message: "请输入收货人" }]}>
            <Input placeholder="收货人姓名" />
          </Form.Item>
          <Form.Item name="phone" label={t("profile.receiverPhone")}
            rules={[{ required: true, pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" }]}>
            <Input placeholder="手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="region" label={t("profile.region")}
            rules={[{ required: true, message: "请选择地区" }]}>
            <Cascader options={regionOptions} placeholder={t("profile.selectRegion")} />
          </Form.Item>
          <Form.Item name="detail" label={t("profile.detailAddress")}
            rules={[{ required: true, message: "请输入详细地址" }]}>
            <Input placeholder="街道、门牌号" />
          </Form.Item>
          <Form.Item name="zipCode" label={t("profile.zipCode")}>
            <Input placeholder="邮编（选填）" />
          </Form.Item>
          <Space size="large">
            <Form.Item name="tag" label={t("profile.addressTag")}>
              <Select style={{ width: 120 }}>
                {TAG_OPTIONS.map((o) => (
                  <Select.Option key={o.value} value={o.value}>{t(o.labelKey)}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="isDefault" label={t("profile.defaultAddress")} valuePropName="checked">
              <Select style={{ width: 100 }}>
                <Select.Option value={true}>{t("common.yes")}</Select.Option>
                <Select.Option value={false}>{t("common.no")}</Select.Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

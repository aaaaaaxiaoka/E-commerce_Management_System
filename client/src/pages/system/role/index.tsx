import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, App, Tag, Table } from "antd";
import { roleApi, permissionApi, type RoleItem } from "@/api/role";
import AuthButton from "@/components/auth/AuthButton";

export default function RolePage() {
  const [data, setData] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([roleApi.list(), permissionApi.list()]);
      setData(roleRes.data.data);
      setPermissions(permRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const columns = [
    { title: "角色标识", dataIndex: "name", key: "name" },
    { title: "角色名称", dataIndex: "label", key: "label" },
    {
      title: "权限",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: RoleItem["permissions"]) =>
        perms?.map((p) => <Tag key={p.permissionId} color="purple">{p.permission.name}</Tag>),
    },
    { title: "关联用户数", dataIndex: ["_count", "users"], key: "userCount" },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: RoleItem) => (
        record.name !== "admin" && (
          <>
            <AuthButton type="link" permission="role:update" onClick={() => openEdit(record)}>
              编辑
            </AuthButton>
            <AuthButton
              type="link" danger permission="role:update"
              confirm={`确定删除角色「${record.label}」？`}
              onConfirm={() => handleDelete(record.id)}
            >删除</AuthButton>
          </>
        )
      ),
    },
  ];

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditingId(role.id);
    form.setFieldsValue({
      label: role.label,
      permissionIds: role.permissions.map((p) => p.permissionId),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingId) {
        await roleApi.update(editingId, values);
        message.success("更新成功");
      } else {
        await roleApi.create(values);
        message.success("创建成功");
      }
      setModalOpen(false);
      loadData();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    await roleApi.remove(id);
    message.success("删除成功");
    loadData();
  };

  // 按 code 前缀分组权限
  const groupedPerms: Record<string, typeof permissions> = {};
  permissions.forEach((p) => {
    const prefix = p.code.split(":")[0];
    if (!groupedPerms[prefix]) groupedPerms[prefix] = [];
    groupedPerms[prefix].push(p);
  });

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        title={() => (
          <AuthButton type="primary" permission="role:create" onClick={openCreate}>
            新增角色
          </AuthButton>
        )}
      />

      <Modal
        title={editingId ? "编辑角色" : "新增角色"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingId && (
            <Form.Item name="name" label="角色标识" rules={[{ required: true }]}>
              <Input placeholder="小写英文，如 editor" />
            </Form.Item>
          )}
          <Form.Item name="label" label="角色名称" rules={[{ required: true }]}>
            <Input placeholder="如：编辑" />
          </Form.Item>
          <Form.Item name="permissionIds" label="分配权限">
            <Select mode="multiple" placeholder="选择权限" optionFilterProp="label">
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <Select.OptGroup key={group} label={group.toUpperCase()}>
                  {perms.map((p) => (
                    <Select.Option key={p.id} value={p.id} label={p.name}>
                      {p.code} — {p.name}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

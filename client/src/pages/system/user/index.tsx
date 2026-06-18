import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Switch, App, Tag } from "antd";
import { userApi, type UserItem } from "@/api/user";
import { roleApi, type RoleItem } from "@/api/role";
import ProTable, { type ProTableColumn } from "@/components/table/ProTable";
import AuthButton from "@/components/auth/AuthButton";

export default function UserPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { roleApi.list().then((res) => setRoles(res.data.data)); }, []);

  const columns: ProTableColumn<UserItem>[] = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "用户名", dataIndex: "username", search: true },
    { title: "邮箱", dataIndex: "email" },
    {
      title: "角色",
      dataIndex: "roles",
      render: (_, record) =>
        record.roles?.map((r) => <Tag key={r.id} color="blue">{r.label}</Tag>),
    },
    {
      title: "状态",
      dataIndex: "status",
      search: true,
      searchType: "select",
      searchOptions: [{ label: "正常", value: 1 }, { label: "禁用", value: 0 }],
      render: (v) => (v ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>),
    },
    { title: "创建时间", dataIndex: "createdAt", render: (v) => new Date(v).toLocaleString() },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <>
          <AuthButton type="link" permission="user:update" onClick={() => openEdit(record)}>
            编辑
          </AuthButton>
          <AuthButton
            type="link"
            danger
            permission="user:update"
            confirm={`确定删除 ${record.username}？`}
            onConfirm={() => handleDelete(record.id)}
          >
            删除
          </AuthButton>
        </>
      ),
    },
  ];

  const fetchUsers = async (params: any) => {
    const res = await userApi.list(params);
    return res.data.data;
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, roleIds: [] });
    setModalOpen(true);
  };

  const openEdit = async (user: UserItem) => {
    setEditingId(user.id);
    form.setFieldsValue({
      email: user.email,
      status: user.status,
      roleIds: user.roles?.map((r) => r.id) ?? [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingId) {
        await userApi.update(editingId, values);
        message.success("更新成功");
      } else {
        await userApi.create(values);
        message.success("创建成功");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.remove(id);
      message.success("删除成功");
      setRefreshKey((k) => k + 1);
    } catch {}
  };

  return (
    <>
      <ProTable
        key={refreshKey}
        columns={columns}
        fetchData={fetchUsers}
        onAdd={openCreate}
        addPermission="user:create"
        addText="新增用户"
      />

      <Modal
        title={editingId ? "编辑用户" : "新增用户"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingId && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
                <Input placeholder="至少 3 个字符" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="至少 6 位" />
              </Form.Item>
            </>
          )}
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="正常" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" placeholder="选择角色">
              {roles.map((r) => (
                <Select.Option key={r.id} value={r.id}>{r.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

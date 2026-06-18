import { useState, useEffect } from "react";
import {
  Modal, Form, Input, InputNumber, Select, Switch, App, Tag, Tabs,
  Image, Upload, Button as AntButton, Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { productApi, categoryApi, type ProductItem, type CategoryItem } from "@/api/product";
import ProTable, { type ProTableColumn } from "@/components/table/ProTable";
import AuthButton from "@/components/auth/AuthButton";
import VirtualList from "@/components/common/VirtualList";
import { storage } from "@/utils/storage";

/** 解析 JSON 图片数组，返回第一张图 URL */
function getFirstImage(images: string): string {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : "";
  } catch { return ""; }
}

/** 解析 JSON 图片数组，返回所有 URL */
function parseImages(images: string): string[] {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export default function ProductPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [refreshKey, setRefreshKey] = useState(0);
  // 编辑时的临时图片列表
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([]);

  useEffect(() => { categoryApi.list().then((res) => setCategories(res.data.data)); }, []);

  // 把分类转成 Select 用的选项（带层级缩进）
  const categoryOptions = (list: CategoryItem[], level = 0): any[] =>
    list.flatMap((c) => [
      { label: level ? "　".repeat(level) + "└ " + c.name : c.name, value: c.id },
      ...categoryOptions(c.children || [], level + 1),
    ]);

  const columns: ProTableColumn<ProductItem>[] = [
    {
      title: "图片", key: "image", width: 64,
      render: (_, r) => {
        const img = getFirstImage(r.images);
        return img ? (
          <Image src={img} width={40} height={40} style={{ objectFit: "cover", borderRadius: 4 }} preview={{ mask: null }} />
        ) : <div style={{ width: 40, height: 40, background: "#f5f5f5", borderRadius: 4 }} />;
      },
    },
    { title: "商品名称", dataIndex: "name", search: true },
    { title: "分类", dataIndex: "categoryId",
      search: true, searchType: "select",
      searchOptions: categoryOptions(categories),
      render: (_, r) => r.category?.name ?? "-",
    },
    { title: "价格", dataIndex: "price", render: (v) => `¥${v?.toFixed(2)}` },
    { title: "库存", dataIndex: "stock" },
    { title: "状态", dataIndex: "status",
      search: true, searchType: "select",
      searchOptions: [{ label: "上架", value: 1 }, { label: "下架", value: 0 }],
      render: (v) => (v ? <Tag color="green">上架</Tag> : <Tag color="red">下架</Tag>),
    },
    { title: "创建时间", dataIndex: "createdAt", render: (v) => new Date(v).toLocaleString() },
    {
      title: "操作", key: "action", width: 200,
      render: (_, record) => (
        <>
          <AuthButton type="link" permission="product:update" onClick={() => openEdit(record)}>编辑</AuthButton>
          <AuthButton type="link" danger permission="product:delete"
            confirm={`确定删除「${record.name}」？`}
            onConfirm={() => handleDelete(record.id)}>删除</AuthButton>
        </>
      ),
    },
  ];

  const fetchData = async (params: any) => {
    const res = await productApi.list(params);
    return res.data.data;
  };

  const openCreate = () => {
    setEditingId(null);
    setImageFiles([]);
    form.resetFields();
    form.setFieldsValue({ status: 1, stock: 0, price: 0 });
    setModalOpen(true);
  };

  const openEdit = (product: ProductItem) => {
    setEditingId(product.id);
    form.setFieldsValue(product);
    // 初始化图片文件列表
    const urls = parseImages(product.images);
    setImageFiles(
      urls.map((url, i) => ({
        uid: `${i}`,
        name: `image-${i}`,
        status: "done" as const,
        url,
      }))
    );
    setModalOpen(true);
  };

  /* ---- 自定义上传逻辑 ---- */
  const customUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = storage.get<string>("accessToken");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "上传失败");
    return data.data.url;
  };

  const handleUpload = async (info: any) => {
    const file = info.file as File;
    // 只处理新文件（状态为 uploading）
    try {
      const url = await customUpload(file);
      message.success("图片上传成功");
      // 更新 fileList
      setImageFiles((prev) => [
        ...prev,
        { uid: `${Date.now()}`, name: file.name, status: "done", url },
      ]);
    } catch (err: any) {
      message.error(err.message || "上传失败");
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    // 将图片文件列表转换为 JSON 字符串
    const images = JSON.stringify(
      imageFiles.filter((f) => f.status === "done").map((f) => f.url || f.response?.url).filter(Boolean)
    );

    const payload = { ...values, images };

    try {
      if (editingId) {
        await productApi.update(editingId, payload);
        message.success("更新成功");
      } else {
        await productApi.create(payload);
        message.success("创建成功");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    await productApi.remove(id);
    message.success("删除成功");
    setRefreshKey((k) => k + 1);
  };

  return (
    <Tabs
      defaultActiveKey="manage"
      items={[
        {
          key: "manage",
          label: "商品管理",
          children: (
            <>
              <ProTable
                key={refreshKey}
                columns={columns}
                fetchData={fetchData}
                onAdd={openCreate}
                addPermission="product:create"
                addText="新增商品"
              />

              <Modal
                title={editingId ? "编辑商品" : "新增商品"}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                destroyOnClose
                width={600}
              >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                  <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="description" label="描述">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="categoryId" label="分类">
                    <Select options={categoryOptions(categories)} placeholder="选择分类" allowClear />
                  </Form.Item>

                  <Space size="large" style={{ width: "100%" }}>
                    <Form.Item name="price" label="价格" rules={[{ required: true }]}>
                      <InputNumber min={0} precision={2} style={{ width: 160 }} prefix="¥" />
                    </Form.Item>
                    <Form.Item name="stock" label="库存">
                      <InputNumber min={0} precision={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item name="status" label="上架" valuePropName="checked">
                      <Switch checkedChildren="上架" unCheckedChildren="下架" />
                    </Form.Item>
                  </Space>

                  {/* 图片上传 */}
                  <Form.Item label="商品图片">
                    <Upload
                      listType="picture-card"
                      fileList={imageFiles}
                      onRemove={(file) => {
                        setImageFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                      }}
                      beforeUpload={(file) => {
                        const isImage = file.type.startsWith("image/");
                        if (!isImage) { message.error("只能上传图片文件"); return false; }
                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) { message.error("图片大小不能超过 5MB"); return false; }
                        handleUpload({ file });
                        return false; // 阻止默认上传，使用自定义逻辑
                      }}
                      maxCount={5}
                    >
                      {imageFiles.length >= 5 ? null : (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>上传</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                </Form>
              </Modal>
            </>
          ),
        },
        { key: "virtual", label: "虚拟列表", children: <VirtualList /> },
      ]}
    />
  );
}

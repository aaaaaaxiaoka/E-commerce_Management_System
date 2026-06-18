import { useState } from "react";
import { Tag, App, Drawer, Descriptions, Button, Space } from "antd";
import { orderApi, type OrderItem } from "@/api/order";
import ProTable, { type ProTableColumn } from "@/components/table/ProTable";
import AuthButton from "@/components/auth/AuthButton";

// 订单状态映射
const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "待付款", color: "orange" },
  2: { label: "待发货", color: "blue" },
  3: { label: "待收货", color: "cyan" },
  4: { label: "已完成", color: "green" },
  5: { label: "已取消", color: "default" },
};

export default function OrderPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<OrderItem | null>(null);
  const { message } = App.useApp();

  const columns: ProTableColumn<OrderItem>[] = [
    { title: "订单号", dataIndex: "orderNo", search: true, width: 180 },
    { title: "用户", dataIndex: "user", render: (_, r) => r.user?.username ?? "-" },
    {
      title: "金额",
      dataIndex: "totalAmount",
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      search: true,
      searchType: "select",
      searchOptions: Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v.label, value: Number(k) })),
      render: (v) => {
        const s = STATUS_MAP[v];
        return <Tag color={s?.color}>{s?.label ?? v}</Tag>;
      },
    },
    {
      title: "商品",
      dataIndex: "items",
      render: (items) =>
        (items as any[])?.map((i: any) => `${i.product?.name ?? "-"} ×${i.quantity}`).join(", "),
    },
    { title: "下单时间", dataIndex: "createdAt", render: (v) => new Date(v).toLocaleString() },
    {
      title: "操作",
      key: "action",
      width: 240,
      render: (_, record) => (
        <Space>
          <AuthButton type="link" permission="order:detail" onClick={() => openDetail(record)}>
            详情
          </AuthButton>
          {record.status === 2 && (
            <AuthButton type="link" permission="order:ship"
              confirm="确认发货？" onConfirm={() => doAction(record.id, 3)}>
              发货
            </AuthButton>
          )}
          {record.status === 1 && (
            <AuthButton type="link" danger permission="order:ship"
              confirm="确认取消该订单？" onConfirm={() => doAction(record.id, 5)}>
              取消
            </AuthButton>
          )}
          {record.status === 3 && (
            <AuthButton type="link" permission="order:ship"
              confirm="确认完成？" onConfirm={() => doAction(record.id, 4)}>
              完成
            </AuthButton>
          )}
        </Space>
      ),
    },
  ];

  const fetchData = async (params: any) => {
    const res = await orderApi.list(params);
    return res.data.data;
  };

  const openDetail = async (record: OrderItem) => {
    setDetail(record);
    setDrawerOpen(true);
  };

  const doAction = async (id: number, status: number) => {
    try {
      await orderApi.updateStatus(id, status);
      message.success("操作成功");
      setRefreshKey((k) => k + 1);
    } catch {}
  };

  return (
    <>
      <ProTable key={refreshKey} columns={columns} fetchData={fetchData} />

      <Drawer
        title="订单详情"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[detail.status]?.color}>{STATUS_MAP[detail.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户">{detail.user?.username}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{Number(detail.totalAmount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.remark || "-"}</Descriptions.Item>
              <Descriptions.Item label="下单时间" span={2}>
                {new Date(detail.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {/* 收货地址 */}
            {(() => {
              try {
                const addr = JSON.parse(detail.address);
                return (
                  <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }} title="收货地址">
                    <Descriptions.Item label="收货人">{addr.name}</Descriptions.Item>
                    <Descriptions.Item label="电话">{addr.phone}</Descriptions.Item>
                    <Descriptions.Item label="地址" span={2}>
                      {addr.province} {addr.city} {addr.detail}
                    </Descriptions.Item>
                  </Descriptions>
                );
              } catch {
                return null;
              }
            })()}

            <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }} title="商品明细">
              {detail.items?.map((item) => (
                <Descriptions.Item key={item.id} label={item.product?.name ?? `商品#${item.productId}`}>
                  ¥{Number(item.price).toFixed(2)} × {item.quantity}
                  &nbsp;=&nbsp;¥{(Number(item.price) * item.quantity).toFixed(2)}
                </Descriptions.Item>
              ))}
            </Descriptions>

            {detail.status === 2 && (
              <Button type="primary" style={{ marginTop: 16 }}
                onClick={() => { doAction(detail.id, 3); setDrawerOpen(false); }}>
                确认发货
              </Button>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}

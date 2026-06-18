import { useState, useEffect, useCallback } from "react";
import {
  Tag, App, Drawer, Descriptions, Button, Space, Table, Typography,
  Card, Tabs, Segmented, Empty, Timeline, Statistic, Row, Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  OrderedListOutlined, AppstoreOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TruckOutlined, DollarOutlined, LoadingOutlined,
} from "@ant-design/icons";
import { orderApi, type OrderItem } from "@/api/order";
import AuthButton from "@/components/auth/AuthButton";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const STATUS_I18N: Record<number, string> = {
  1: "order.pendingPay",
  2: "order.pendingShip",
  3: "order.pendingReceive",
  4: "order.finished",
  5: "order.cancelled",
};

const STATUS_COLOR: Record<number, string> = {
  1: "orange", 2: "blue", 3: "cyan", 4: "green", 5: "default",
};

const STATUS_ICON: Record<number, React.ReactNode> = {
  1: <DollarOutlined />, 2: <ClockCircleOutlined />, 3: <TruckOutlined />,
  4: <CheckCircleOutlined />, 5: <CloseCircleOutlined />,
};

/* 状态时间线 */
const STATUS_TIMELINE: Record<number, Array<{ label: string; active: boolean }>> = {
  1: [{ label: "order.timeline.created", active: true }, { label: "order.timeline.paid", active: false }, { label: "order.timeline.shipped", active: false }, { label: "order.timeline.done", active: false }],
  2: [{ label: "order.timeline.created", active: true }, { label: "order.timeline.paid", active: true }, { label: "order.timeline.shipped", active: false }, { label: "order.timeline.done", active: false }],
  3: [{ label: "order.timeline.created", active: true }, { label: "order.timeline.paid", active: true }, { label: "order.timeline.shipped", active: true }, { label: "order.timeline.done", active: false }],
  4: [{ label: "order.timeline.created", active: true }, { label: "order.timeline.paid", active: true }, { label: "order.timeline.shipped", active: true }, { label: "order.timeline.done", active: true }],
  5: [{ label: "order.timeline.cancelled", active: true }],
};

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ list: OrderItem[]; total: number }>({ list: [], total: 0 });
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.myOrders({ page, pageSize, status: statusFilter });
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDetail = async (record: OrderItem) => {
    try {
      const res = await orderApi.detail(record.id);
      setDetail(res.data.data);
    } catch {
      setDetail(record);
    }
    setDrawerOpen(true);
  };

  const doAction = async (id: number, status: number) => {
    try {
      await orderApi.updateStatus(id, status);
      message.success(t("order.operated"));
      setRefreshKey((k) => k + 1);
      if (detail?.id === id) {
        setDetail((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {}
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: t("order.orderNo"),
      dataIndex: "orderNo",
      width: 190,
      render: (v: string, record) => (
        <Button type="link" onClick={() => openDetail(record)} style={{ padding: 0, fontWeight: 500 }}>
          {v}
        </Button>
      ),
    },
    {
      title: t("order.amount"),
      dataIndex: "totalAmount",
      width: 120,
      render: (v: number) => (
        <Text strong style={{ color: "#ff4d4f" }}>¥{v.toFixed(2)}</Text>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 110,
      render: (v: number) => {
        return <Tag color={STATUS_COLOR[v]} icon={STATUS_ICON[v]}>{t(STATUS_I18N[v]) || v}</Tag>;
      },
    },
    {
      title: t("order.items"),
      dataIndex: "items",
      ellipsis: true,
      render: (items: any[]) =>
        items?.map((i) => `${i.product?.name ?? "-"} ×${i.quantity}`).join("、") || "-",
    },
    {
      title: t("common.createTime"),
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: t("common.actions"),
      key: "action",
      width: 160,
      render: (_: any, record: OrderItem) => (
        <Space size={0}>
          {record.status === 1 && (
            <>
              <Button type="link" size="small" onClick={() => openDetail(record)}>
                {t("order.toPay")}
              </Button>
              <AuthButton type="link" size="small" danger
                confirm={t("order.cancelConfirm")}
                onConfirm={() => doAction(record.id, 5)}>
                {t("order.cancel")}
              </AuthButton>
            </>
          )}
          {record.status === 3 && (
            <>
              <Button type="link" size="small" onClick={() => openDetail(record)}>
                {t("order.detail")}
              </Button>
              <AuthButton type="link" size="small"
                confirm={t("order.confirmReceiveConfirm")}
                onConfirm={() => doAction(record.id, 4)}>
                {t("order.confirmReceive")}
              </AuthButton>
            </>
          )}
          {(record.status === 2 || record.status === 4 || record.status === 5) && (
            <Button type="link" size="small" onClick={() => openDetail(record)}>
              {t("order.detail")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /* ---- 卡片模式 ---- */
  const renderCards = () => (
    <Row gutter={[16, 16]}>
      {data.list.length === 0 ? (
        <Col span={24}><Empty description={t("shop.noOrders")} style={{ padding: 60 }} /></Col>
      ) : (
        data.list.map((order) => {
          return (
            <Col key={order.id} xs={24} sm={12} lg={8}>
              <Card hoverable onClick={() => openDetail(order)} style={{ borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>
                    {order.orderNo.slice(0, 18)}…
                  </Text>
                  <Tag color={STATUS_COLOR[order.status]} icon={STATUS_ICON[order.status]}>
                    {t(STATUS_I18N[order.status])}
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  {order.items?.slice(0, 3).map((i: any) => (
                    <div key={i.id} style={{ fontSize: 13, marginBottom: 4 }}>
                      <Text ellipsis>{i.product?.name ?? `#${i.productId}`}</Text>
                      <Text type="secondary"> ×{i.quantity}</Text>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      …{t("shop.andMore", { count: order.items.length - 3 })}
                    </Text>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                  <Text strong style={{ color: "#ff4d4f", fontSize: 18 }}>
                    ¥{order.totalAmount.toFixed(2)}
                  </Text>
                </div>
              </Card>
            </Col>
          );
        })
      )}
    </Row>
  );

  return (
    <div>
      {/* 顶部：标题 + 总览统计 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{t("shop.myOrders")}</Title>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as "table" | "card")}
          options={[
            { label: t("shop.listView"), value: "table", icon: <OrderedListOutlined /> },
            { label: t("shop.cardView"), value: "card", icon: <AppstoreOutlined /> },
          ]}
        />
      </div>

      {/* 快速统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: "order.pendingPay", value: data.list.filter(lo => lo.status === 1).length, color: "#faad14" },
          { label: "order.pendingShip", value: data.list.filter(lo => lo.status === 2).length, color: "#1677ff" },
          { label: "order.pendingReceive", value: data.list.filter(lo => lo.status === 3).length, color: "#13c2c2" },
          { label: "order.finished", value: data.list.filter(lo => lo.status === 4).length, color: "#52c41a" },
        ].map((stat) => (
          <Col xs={12} sm={6} key={stat.label}>
            <Card size="small" style={{ borderRadius: 10, textAlign: "center", background: stat.color + "10", borderColor: stat.color + "30" }}>
              <Statistic title={t(stat.label)} value={stat.value}
                valueStyle={{ color: stat.color, fontSize: 28, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 状态筛选 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10 }}
        styles={{ body: { padding: "0 16px" } }}>
        <Tabs
          activeKey={statusFilter === undefined ? "all" : String(statusFilter)}
          onChange={(key) => {
            setStatusFilter(key === "all" ? undefined : Number(key));
            setPage(1);
          }}
          size="small"
          items={[
            { key: "all", label: t("shop.allOrders") },
            ...[1, 2, 3, 4, 5].map((k) => ({
              key: String(k),
              label: <Space size={4}>{STATUS_ICON[k]} {t(STATUS_I18N[k])}</Space>,
            })),
          ]}
        />
      </Card>

      {/* 列表 / 卡片切换 */}
      {viewMode === "table" ? (
        <Card style={{ borderRadius: 12 }}>
          <Table
            key={refreshKey}
            columns={columns}
            dataSource={data.list}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total: data.total,
              showSizeChanger: true,
              showTotal: (total) => t("common.total", { total }),
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        </Card>
      ) : (
        renderCards()
      )}

      {/* 订单详情抽屉 —— 含时间线 */}
      <Drawer
        title={
          <Space>
            <OrderedListOutlined />
            <span>{t("order.detail")}</span>
            {detail && <Tag color={STATUS_COLOR[detail.status]}>{t(STATUS_I18N[detail.status])}</Tag>}
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
      >
        {detail && (
          <>
            {/* 状态时间线 */}
            {detail.status !== 5 && (
              <Timeline
                style={{ marginBottom: 24 }}
                items={(STATUS_TIMELINE[detail.status] || STATUS_TIMELINE[1]).map((step, i) => ({
                  color: step.active ? "blue" : "gray",
                  dot: step.active ? undefined : undefined,
                  children: (
                    <Text type={step.active ? undefined : "secondary"}>
                      {t(step.label)}
                    </Text>
                  ),
                }))}
              />
            )}
            {detail.status === 5 && (
              <Timeline
                style={{ marginBottom: 24 }}
                items={[
                  { color: "gray", children: t("order.timeline.created") },
                  { color: "red", children: <Text type="danger">{t("order.timeline.cancelled")}</Text> },
                ]}
              />
            )}

            {/* 基本信息 */}
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}
              title={<Text strong>{t("order.basicInfo")}</Text>}>
              <Descriptions.Item label={t("order.orderNo")}>{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label={t("order.amount")}>
                <Text strong style={{ color: "#ff4d4f" }}>¥{Number(detail.totalAmount).toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t("common.createTime")} span={2}>
                {new Date(detail.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label={t("order.remark")} span={2}>
                {detail.remark || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* 收货地址 */}
            {(() => {
              try {
                const addr = JSON.parse(detail.address);
                return (
                  <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}
                    title={<Text strong>{t("order.address")}</Text>}>
                    <Descriptions.Item label={t("checkout.receiver")}>{addr.name}</Descriptions.Item>
                    <Descriptions.Item label={t("checkout.phone")}>{addr.phone}</Descriptions.Item>
                    <Descriptions.Item label={t("order.address")} span={2}>
                      {addr.province} {addr.city} {addr.detail}
                    </Descriptions.Item>
                  </Descriptions>
                );
              } catch { return null; }
            })()}

            {/* 商品明细 */}
            <Descriptions column={1} bordered size="small"
              title={<Text strong>{t("order.items")} ({detail.items?.length || 0})</Text>}>
              {detail.items?.map((item) => (
                <Descriptions.Item key={item.id} label={item.product?.name ?? `#${item.productId}`}>
                  <Space size="large">
                    <Text>¥{Number(item.price).toFixed(2)} × {item.quantity}</Text>
                    <Text strong>= ¥{(Number(item.price) * item.quantity).toFixed(2)}</Text>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>

            {/* 底部操作 */}
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              {detail.status === 1 && (
                <Button danger size="large" onClick={() => doAction(detail.id, 5)} style={{ borderRadius: 8 }}>
                  {t("order.cancel")}
                </Button>
              )}
              {detail.status === 3 && (
                <Button type="primary" size="large"
                  onClick={() => { doAction(detail.id, 4); setDrawerOpen(false); }}
                  style={{ borderRadius: 8 }}>
                  {t("order.confirmReceive")}
                </Button>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

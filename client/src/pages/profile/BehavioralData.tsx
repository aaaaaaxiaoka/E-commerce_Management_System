import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, List, Empty, Button, Tag, Typography } from "antd";
import { ShoppingCartOutlined, OrderedListOutlined, EyeOutlined, HeartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCartStore } from "@/store/useCartStore";
import { orderApi, type OrderItem } from "@/api/order";
import dayjs from "dayjs";

const { Text } = Typography;

const statusLabels: Record<number, string> = {
  1: "pendingPay", 2: "pendingShip", 3: "pendingReceive", 4: "finished", 5: "cancelled",
};

export default function BehavioralData() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items: cartItems, totalCount, totalAmount } = useCartStore();
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    setOrdersLoading(true);
    orderApi.myOrders({ page: 1, pageSize: 5 })
      .then((res) => setRecentOrders(res.data.data.list || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => navigate("/shop/cart")}>
            <Statistic
              title={t("profile.cartSummary")}
              value={totalCount()}
              prefix={<ShoppingCartOutlined />}
              suffix={totalCount() > 0 ? ` / ¥${totalAmount().toFixed(0)}` : ""}
              valueStyle={{ color: totalCount() > 0 ? "#1677ff" : "#999" }}
            />
            {totalCount() > 0 && (
              <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }}>
                {t("profile.viewCart")} →
              </Button>
            )}
            {totalCount() === 0 && <Text type="secondary" style={{ fontSize: 12 }}>{t("profile.noCartItems")}</Text>}
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => navigate("/shop/orders")}>
            <Statistic
              title={t("profile.orderSummary")}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }}>
              {t("profile.viewOrders")} →
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 最近订单 */}
      <Card title={t("profile.recentOrders")} style={{ marginBottom: 16 }}>
        <List
          loading={ordersLoading}
          dataSource={recentOrders}
          locale={{ emptyText: <Empty description="暂无订单" /> }}
          renderItem={(order) => (
            <List.Item
              extra={
                <Tag>{t(`order.${statusLabels[order.status] || "pendingPay"}`)}</Tag>
              }
            >
              <List.Item.Meta
                title={order.orderNo}
                description={dayjs(order.createdAt).format("YYYY-MM-DD HH:mm")}
              />
              <Text strong>¥{order.totalAmount.toFixed(2)}</Text>
            </List.Item>
          )}
        />
      </Card>

      {/* 占位：浏览记录 + 收藏夹 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t("profile.browseHistory")}>
            <Empty description={t("profile.comingSoon")} image={<EyeOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t("profile.favorites")}>
            <Empty description={t("profile.comingSoon")} image={<HeartOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

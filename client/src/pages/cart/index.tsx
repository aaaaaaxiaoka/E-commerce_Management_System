import { useNavigate } from "react-router-dom";
import {
  Button, InputNumber, Empty, Typography, App, Popconfirm, Card,
  List, Divider, Space, Row, Col, Image,
} from "antd";
import {
  DeleteOutlined, ShoppingOutlined, LeftOutlined,
  MinusCircleOutlined, PlusCircleOutlined, TagOutlined,
} from "@ant-design/icons";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalCount } = useCartStore();

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <ShoppingOutlined style={{ fontSize: 80, color: "#d9d9d9", marginBottom: 24 }} />
        <Title level={4} type="secondary">{t("cart.empty")}</Title>
        <Button type="primary" size="large" icon={<ShoppingOutlined />}
          onClick={() => navigate("/shop")} style={{ marginTop: 16, borderRadius: 8 }}>
          {t("cart.goShopping")}
        </Button>
      </div>
    );
  }

  /* ---- 购物车单项 ---- */
  const CartListItem = ({ item }: { item: CartItem }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 20, padding: "20px 0",
      borderBottom: "1px solid #f0f0f0",
    }}>
      {/* 图片 */}
      <div style={{
        width: 100, height: 100, borderRadius: 12, overflow: "hidden",
        flexShrink: 0, background: "#f5f5f5",
      }}>
        {item.image ? (
          <Image src={item.image} width={100} height={100}
            style={{ objectFit: "cover" }} preview={false} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <ShoppingOutlined style={{ fontSize: 36, color: "#d9d9d9" }} />
          </div>
        )}
      </div>

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 13 }}>¥{item.price.toFixed(2)}</Text>
      </div>

      {/* 数量 */}
      <Space size={4} style={{ flexShrink: 0 }}>
        <Button size="small" type="text"
          icon={<MinusCircleOutlined />}
          disabled={item.quantity <= 1}
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
        />
        <InputNumber
          min={1} max={999}
          value={item.quantity}
          onChange={(v) => updateQuantity(item.productId, v ?? 1)}
          style={{ width: 60, textAlign: "center" }}
          size="small"
          controls={false}
        />
        <Button size="small" type="text"
          icon={<PlusCircleOutlined />}
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
        />
      </Space>

      {/* 小计 */}
      <Text strong style={{ fontSize: 16, color: "#ff4d4f", flexShrink: 0, width: 100, textAlign: "right" }}>
        ¥{(item.price * item.quantity).toFixed(2)}
      </Text>

      {/* 删除 */}
      <Popconfirm title={t("cart.removeConfirm")}
        onConfirm={() => { removeItem(item.productId); message.success(t("cart.removed")); }}>
        <Button type="text" danger icon={<DeleteOutlined />} style={{ flexShrink: 0 }} />
      </Popconfirm>
    </div>
  );

  return (
    <div>
      {/* 顶部标题 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          {t("cart.title")} <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>
            ({totalCount()} {t("cart.itemsUnit")})
          </Text>
        </Title>
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate("/shop")}>
          {t("cart.continueShopping")}
        </Button>
      </div>

      <Row gutter={24}>
        {/* 左侧：商品列表 */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "0 24px" } }}>
            {items.map((item) => (
              <CartListItem key={item.productId} item={item} />
            ))}
            <div style={{ padding: "16px 0", textAlign: "right" }}>
              <Popconfirm title={t("cart.clearConfirm")} onConfirm={clearCart}>
                <Button danger type="link" size="small">{t("cart.clear")}</Button>
              </Popconfirm>
            </div>
          </Card>
        </Col>

        {/* 右侧：订单摘要 */}
        <Col xs={24} lg={8}>
          <Card
            title={<span><TagOutlined /> {t("checkout.orderSummary")}</span>}
            style={{ borderRadius: 12, position: "sticky", top: 80 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary">{t("cart.itemsUnit")}</Text>
              <Text>{totalCount()}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary">{t("cart.productSubtotal")}</Text>
              <Text>¥{totalAmount().toFixed(2)}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary">{t("cart.shipping")}</Text>
              <Text style={{ color: "#52c41a" }}>{t("cart.freeShipping")}</Text>
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text strong style={{ fontSize: 16 }}>{t("checkout.total")}</Text>
              <Text strong style={{ fontSize: 24, color: "#ff4d4f" }}>
                ¥{totalAmount().toFixed(2)}
              </Text>
            </div>
            <Button type="primary" size="large" block
              onClick={() => navigate("/shop/checkout")}
              style={{ borderRadius: 8, height: 48, fontSize: 16, fontWeight: 600 }}
            >
              {t("cart.checkout")}
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

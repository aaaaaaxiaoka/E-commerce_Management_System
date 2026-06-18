import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Row, Col, Typography, Button, App, Tag, Skeleton, Space,
  Breadcrumb, Descriptions, Image, InputNumber, Divider,
} from "antd";
import {
  ShoppingCartOutlined, ArrowLeftOutlined, CheckOutlined,
  ShopOutlined, HomeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { productApi, type ProductItem } from "@/api/product";
import { useCartStore } from "@/store/useCartStore";

const { Title, Text, Paragraph } = Typography;

/** 解析产品图片 JSON，返回数组 */
function parseImages(images: string): string[] {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi.getById(Number(id))
      .then((res) => setProduct(res.data.data))
      .catch(() => navigate("/shop", { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    const images = parseImages(product.images);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || "",
      quantity,
    });
    setAdded(true);
    message.success({ content: t("shop.addedToCart"), key: product.id, duration: 2 });
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!product) return null;

  const images = parseImages(product.images);
  const outOfStock = product.stock <= 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* 返回按钮 */}
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
        style={{ padding: 0, marginBottom: 16 }}>
        {t("common.back")}
      </Button>

      <Row gutter={[32, 24]}>
        {/* 左侧：商品图片 */}
        <Col xs={24} md={10}>
          {images.length > 0 ? (
            <Image.PreviewGroup>
              <Image
                src={images[0]}
                alt={product.name}
                style={{
                  width: "100%", borderRadius: 12,
                  background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
                }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjZDBkMGQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+fljwvdGV4dD48L3N2Zz4="
              />
            </Image.PreviewGroup>
          ) : (
            <div style={{
              width: "100%", height: 360, borderRadius: 12,
              background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShopOutlined style={{ fontSize: 80, color: "#d9d9d9" }} />
            </div>
          )}
          {/* 缩略图列表 */}
          {images.length > 1 && (
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              {images.map((img, idx) => (
                <Col key={idx} span={6}>
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    style={{
                      width: "100%", height: 72, objectFit: "cover",
                      borderRadius: 8, cursor: "pointer", border: "1px solid #eee",
                    }}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* 右侧：商品信息 */}
        <Col xs={24} md={14}>
          {product.category?.name && (
            <Tag color="blue" style={{ marginBottom: 8, borderRadius: 4 }}>
              {product.category.name}
            </Tag>
          )}

          <Title level={3} style={{ marginBottom: 12 }}>{product.name}</Title>

          {/* 价格 */}
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 32, color: "#ff4d4f", lineHeight: 1 }}>
              ¥{product.price.toFixed(2)}
            </Text>
            {product.stock > 0 && (
              <Text type="secondary" style={{ marginLeft: 12, fontSize: 14 }}>
                {t("shop.stock")}: {product.stock}
              </Text>
            )}
            {outOfStock && (
              <Tag color="default" style={{ marginLeft: 12 }}>{t("shop.outOfStock")}</Tag>
            )}
          </div>

          <Divider />

          {/* 数量选择 + 加入购物车 */}
          {!outOfStock && (
            <div style={{ marginBottom: 24 }}>
              <Space size="middle" style={{ marginBottom: 16 }}>
                <Text>{t("cart.quantity")}:</Text>
                <InputNumber min={1} max={product.stock} value={quantity}
                  onChange={(v) => setQuantity(v || 1)} />
              </Space>
              <br />
              <Button
                type="primary" size="large"
                icon={added ? <CheckOutlined /> : <ShoppingCartOutlined />}
                onClick={handleAddToCart}
                style={{ borderRadius: 8, height: 48, minWidth: 200, fontSize: 16 }}
              >
                {added ? t("shop.added") : t("shop.addToCart")}
              </Button>
            </div>
          )}

          <Divider />

          {/* 商品详情 */}
          <Title level={5}>{t("product.description")}</Title>
          <Paragraph type="secondary" style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {product.description || "暂无商品描述"}
          </Paragraph>

          <Divider />

          <Descriptions column={2} size="small">
            <Descriptions.Item label={t("common.createTime")}>
              {dayjs(product.createdAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label={t("product.category")}>
              {product.category?.name || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
}

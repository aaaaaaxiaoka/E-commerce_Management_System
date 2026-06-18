import { useState, useEffect, useCallback } from "react";
import {
  Card, Input, Select, Row, Col, Button, App, Empty, Tag, Typography, Space,
  Skeleton, Badge, Tooltip, FloatButton,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  FireOutlined,
  EyeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { productApi, categoryApi, type ProductItem, type CategoryItem } from "@/api/product";
import { useCartStore } from "@/store/useCartStore";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { storage } from "@/utils/storage";

const { Text, Title, Paragraph } = Typography;

/** 解析产品图片 JSON，返回第一张图 */
function getFirstImage(images: string): string {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : "";
  } catch { return ""; }
}

export default function ProductCatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [addedMap, setAddedMap] = useState<Record<number, boolean>>({});

  const addItem = useCartStore((s) => s.addItem);
  const totalCount = useCartStore((s) => s.totalCount());

  const categoryOptions = useCallback((list: CategoryItem[], level = 0): any[] =>
    list.flatMap((c) => [
      { label: (level ? "　".repeat(level) + "└ " : "") + c.name, value: c.id },
      ...categoryOptions(c.children || [], level + 1),
    ]),
  []);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi
      .list({ page: 1, pageSize: 100, keyword: keyword || undefined, categoryId, status: 1 })
      .then((res) => setProducts(res.data.data.list || []))
      .finally(() => setLoading(false));
  }, [keyword, categoryId]);

  const handleAddToCart = (product: ProductItem) => {
    // 检查登录状态，未登录跳转到商城登录页
    const token = storage.get<string>("accessToken");
    if (!token) {
      const from = location.pathname + location.search;
      navigate(`/shop/login?redirect=${encodeURIComponent(from)}`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: getFirstImage(product.images),
    });
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    message.success({ content: t("shop.addedToCart"), key: product.id, duration: 2 });
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  /* ------- Hero Banner ------- */
  const HeroBanner = () => (
    <div style={{
      borderRadius: 16, padding: "40px 48px", marginBottom: 32,
      background: "linear-gradient(135deg, #1677ff 0%, #0958d9 40%, #003eb3 100%)",
      color: "#fff", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -20, top: -40, opacity: 0.15 }}>
        <ShoppingOutlined style={{ fontSize: 220 }} />
      </div>
      <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
        {t("shop.heroTitle")}
      </Title>
      <Paragraph style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, maxWidth: 480, marginBottom: 0 }}>
        {t("shop.heroSubtitle")}
      </Paragraph>
    </div>
  );

  /* ------- 骨架屏 ------- */
  const SkeletonGrid = () => (
    <Row gutter={[20, 20]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Col key={i} xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Skeleton.Image style={{ width: "100%", height: 200 }} active />
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: "60%" }} />
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div>
      <HeroBanner />

      {/* 搜索 & 筛选栏 */}
      <Card
        size="small"
        style={{ marginBottom: 24, borderRadius: 12 }}
        styles={{ body: { padding: "12px 20px" } }}
      >
        <Space size="middle" wrap style={{ width: "100%" }}>
          <Input
            placeholder={t("shop.searchProducts")}
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            allowClear
            size="large"
            style={{ width: 300 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder={t("shop.allCategories")}
            allowClear
            size="large"
            style={{ width: 200 }}
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions(categories)}
          />
          {products.length > 0 && !loading && (
            <Text type="secondary" style={{ marginLeft: "auto" }}>
              {t("shop.foundProducts", { count: products.length })}
            </Text>
          )}
        </Space>
      </Card>

      {/* 商品列表 */}
      {loading ? <SkeletonGrid /> : products.length === 0 ? (
        <Empty
          image={<ShoppingOutlined style={{ fontSize: 80, color: "#d9d9d9" }} />}
          description={<Text type="secondary">{t("shop.noProducts")}</Text>}
          style={{ padding: "80px 0" }}
        />
      ) : (
        <Row gutter={[20, 20]}>
          {products.map((product) => {
            const img = getFirstImage(product.images);
            const outOfStock = product.stock <= 0;
            const justAdded = addedMap[product.id];
            const isNew = product.stock > 50;

            return (
              <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                <Badge.Ribbon
                  text={outOfStock ? t("shop.outOfStock") : isNew ? "NEW" : ""}
                  color={outOfStock ? "default" : "red"}
                  style={{ display: outOfStock || isNew ? undefined : "none" }}
                >
                  <Card
                    hoverable
                    style={{ borderRadius: 12, overflow: "hidden", height: "100%", cursor: "pointer" }}
                    styles={{ body: { padding: "16px" } }}
                    onClick={() => navigate(`/shop/product/${product.id}`)}
                    cover={
                      <div style={{
                        position: "relative", height: 200, overflow: "hidden",
                        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
                      }}>
                        {img ? (
                          <img src={img} alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                            className="shop-card-img"
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <ShoppingOutlined style={{ fontSize: 56, color: "#d9d9d9" }} />
                          </div>
                        )}
                        {/* 悬浮遮罩 */}
                        {!outOfStock && (
                          <div className="shop-card-overlay"
                            style={{
                              position: "absolute", inset: 0,
                              background: "rgba(0,0,0,0.5)", opacity: 0,
                              transition: "opacity 0.25s",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                            }}
                          >
                            <Tooltip title={t("shop.addToCart")}>
                              <Button shape="circle" size="large" type="primary"
                                icon={justAdded ? <CheckOutlined /> : <ShoppingCartOutlined />}
                                onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                              />
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    }
                  >
                    {/* 分类标签 */}
                    {product.category?.name && (
                      <Tag color="blue" style={{ marginBottom: 8, borderRadius: 4 }}>
                        {product.category.name}
                      </Tag>
                    )}

                    <Text strong ellipsis style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
                      {product.name}
                    </Text>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 22, color: "#ff4d4f", lineHeight: 1 }}>
                        ¥{product.price.toFixed(2)}
                      </Text>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {outOfStock
                          ? <Text type="danger">{t("shop.outOfStock")}</Text>
                          : `${t("shop.stock")}: ${product.stock}`
                        }
                      </Text>
                      {!outOfStock && (
                        <Button
                          type="primary" size="small" ghost
                          icon={justAdded ? <CheckOutlined /> : <ShoppingCartOutlined />}
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          style={{ borderRadius: 6 }}
                        >
                          {justAdded ? t("shop.added") : t("shop.addToCart")}
                        </Button>
                      )}
                      {outOfStock && (
                        <Button size="small" disabled style={{ borderRadius: 6 }}>
                          {t("shop.soldOut")}
                        </Button>
                      )}
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}

      {/* 浮动购物车按钮（移动端） */}
      {totalCount > 0 && (
        <FloatButton
          type="primary"
          badge={{ count: totalCount }}
          icon={<ShoppingCartOutlined />}
          onClick={() => navigate("/shop/cart")}
          style={{ right: 32, bottom: 80, width: 56, height: 56 }}
        />
      )}

      {/* CSS for card hover effect */}
      <style>{`
        .shop-card-img:hover { transform: scale(1.08); }
        .ant-card:hover .shop-card-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

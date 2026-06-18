import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form, Input, Button, Card, Divider, Typography, App, Space,
  Steps, Row, Col, Result,
} from "antd";
import {
  UserOutlined, PhoneOutlined,
  HomeOutlined, ShoppingCartOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { useCartStore } from "@/store/useCartStore";
import { orderApi } from "@/api/order";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface AddressForm {
  name: string;
  phone: string;
  province: string;
  city: string;
  detail: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<AddressForm>();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderNo?: string } | null>(null);
  const { items, totalAmount, clearCart } = useCartStore();

  if (items.length === 0 && !orderResult) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <ShoppingCartOutlined style={{ fontSize: 80, color: "#d9d9d9", marginBottom: 24 }} />
        <Title level={4} type="secondary">{t("checkout.emptyCart")}</Title>
        <Button type="primary" size="large" onClick={() => navigate("/shop")} style={{ marginTop: 16, borderRadius: 8 }}>
          {t("cart.goShopping")}
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values: AddressForm) => {
    setSubmitting(true);
    try {
      const address = JSON.stringify({
        name: values.name,
        phone: values.phone,
        province: values.province,
        city: values.city,
        detail: values.detail,
      });

      const res = await orderApi.create({
        totalAmount: totalAmount(),
        address,
        remark: "",
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      });

      clearCart();
      setOrderResult({ success: true, orderNo: res.data.data.orderNo });
      setCurrentStep(2);
    } catch {
      // error handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- 下单成功 ---- */
  if (orderResult?.success) {
    return (
      <Result
        status="success"
        title={t("checkout.orderSuccess")}
        subTitle={
          <Space direction="vertical" size={4}>
            <Text>{t("checkout.orderNoLabel")}: <Text strong>{orderResult.orderNo}</Text></Text>
            <Text type="secondary">{t("checkout.orderSuccessDesc")}</Text>
          </Space>
        }
        extra={[
          <Button key="orders" type="primary" size="large"
            onClick={() => navigate("/shop/orders")} style={{ borderRadius: 8 }}>
            {t("shop.myOrders")}
          </Button>,
          <Button key="shop" size="large" onClick={() => navigate("/shop")} style={{ borderRadius: 8 }}>
            {t("cart.continueShopping")}
          </Button>,
        ]}
        style={{ padding: "60px 0" }}
      />
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t("checkout.title")}</Title>

      {/* 步骤条 */}
      <Steps
        current={currentStep}
        onChange={setCurrentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: t("checkout.stepAddress"), icon: <HomeOutlined /> },
          { title: t("checkout.stepConfirm"), icon: <ShoppingCartOutlined /> },
          { title: t("checkout.stepDone"), icon: <CheckCircleFilled /> },
        ]}
      />

      <Row gutter={24}>
        {/* 左侧：表单 */}
        <Col xs={24} lg={16}>
          {currentStep === 0 && (
            <Card title={<><HomeOutlined /> {t("checkout.shippingAddress")}</>}
              style={{ borderRadius: 12 }}>
              <Form form={form} layout="vertical" onFinish={() => setCurrentStep(1)}
                initialValues={{ name: "", phone: "", province: "", city: "", detail: "" }}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="name" label={t("checkout.receiver")}
                      rules={[{ required: true, message: t("checkout.receiverRequired") }]}>
                      <Input size="large" prefix={<UserOutlined style={{ color: "#bbb" }} />}
                        placeholder={t("checkout.receiverPlaceholder")} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phone" label={t("checkout.phone")}
                      rules={[
                        { required: true, message: t("checkout.phoneRequired") },
                        { pattern: /^1[3-9]\d{9}$/, message: t("checkout.phoneInvalid") },
                      ]}>
                      <Input size="large" prefix={<PhoneOutlined style={{ color: "#bbb" }} />}
                        placeholder={t("checkout.phonePlaceholder")} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="province" label={t("checkout.province")}
                      rules={[{ required: true, message: t("checkout.provinceRequired") }]}>
                      <Input size="large" placeholder={t("checkout.provincePlaceholder")} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="city" label={t("checkout.city")}
                      rules={[{ required: true, message: t("checkout.cityRequired") }]}>
                      <Input size="large" placeholder={t("checkout.cityPlaceholder")} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="detail" label={t("checkout.detailAddress")}
                  rules={[{ required: true, message: t("checkout.detailRequired") }]}>
                  <Input.TextArea rows={3} size="large"
                    placeholder={t("checkout.detailPlaceholder")} />
                </Form.Item>

                <Button type="primary" size="large" htmlType="submit"
                  style={{ borderRadius: 8, height: 48, paddingInline: 40, fontSize: 16 }}>
                  {t("checkout.nextStep")}
                </Button>
              </Form>
            </Card>
          )}

          {currentStep === 1 && (
            <Card title={<><ShoppingCartOutlined /> {t("checkout.confirmOrder")}</>}
              style={{ borderRadius: 12 }}>
              {/* 地址预览 */}
              <Card size="small" style={{ marginBottom: 24, background: "#fafafa", borderRadius: 8 }}
                title={<Text strong>{t("checkout.shippingAddress")}</Text>}
                extra={<Button type="link" size="small" onClick={() => setCurrentStep(0)}>{t("common.edit")}</Button>}
              >
                {(() => {
                  const vals = form.getFieldsValue();
                  return (
                    <div>
                      <Text strong>{vals.name}</Text>&nbsp;&nbsp;
                      <Text type="secondary">{vals.phone}</Text>
                      <br />
                      <Text type="secondary">{vals.province} {vals.city} {vals.detail}</Text>
                    </div>
                  );
                })()}
              </Card>

              {/* 订单商品 */}
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: "block", marginBottom: 12 }}>{t("checkout.orderSummary")}</Text>
                {items.map((item) => (
                  <div key={item.productId} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid #f5f5f5",
                  }}>
                    <Text ellipsis style={{ flex: 1 }}>
                      {item.name} <Text type="secondary">×{item.quantity}</Text>
                    </Text>
                    <Text>¥{(item.price * item.quantity).toFixed(2)}</Text>
                  </div>
                ))}
              </div>

              <Divider style={{ margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ fontSize: 16 }}>{t("checkout.total")}</Text>
                <Text strong style={{ fontSize: 28, color: "#ff4d4f" }}>
                  ¥{totalAmount().toFixed(2)}
                </Text>
              </div>

              <Space size="middle">
                <Button size="large" onClick={() => setCurrentStep(0)} style={{ borderRadius: 8 }}>
                  {t("common.back")}
                </Button>
                <Button type="primary" size="large" loading={submitting}
                  onClick={() => handleSubmit(form.getFieldsValue())}
                  style={{ borderRadius: 8, height: 48, paddingInline: 40, fontSize: 16 }}>
                  {t("checkout.placeOrder")}
                </Button>
              </Space>
            </Card>
          )}
        </Col>

        {/* 右侧：订单摘要边栏 */}
        <Col xs={24} lg={8}>
          <Card title={t("checkout.orderSummary")}
            style={{ borderRadius: 12, position: "sticky", top: 80 }}>
            {items.map((item) => (
              <div key={item.productId} style={{
                display: "flex", justifyContent: "space-between",
                padding: "6px 0", fontSize: 13,
              }}>
                <Text ellipsis style={{ flex: 1, marginRight: 8 }}>
                  {item.name} ×{item.quantity}
                </Text>
                <Text>¥{(item.price * item.quantity).toFixed(2)}</Text>
              </div>
            ))}
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14 }}>{t("checkout.total")}</Text>
              <Text strong style={{ fontSize: 20, color: "#ff4d4f" }}>
                ¥{totalAmount().toFixed(2)}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

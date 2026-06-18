import { Card, Row, Col, Statistic, List, Empty, Tag } from "antd";
import {
  WalletOutlined, CreditCardOutlined, GiftOutlined, DollarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default function PaymentInfo() {
  const { t } = useTranslation();

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t("profile.walletBalance")} value={0} prefix="¥" precision={2}
              valueStyle={{ color: "#1677ff" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t("profile.points")} value={0}
              prefix={<GiftOutlined />} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t("profile.coupons")} value={0}
              prefix={<DollarOutlined />} valueStyle={{ color: "#faad14" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t("profile.bankCards")} value={0}
              prefix={<CreditCardOutlined />} valueStyle={{ color: "#ff4d4f" }} />
          </Card>
        </Col>
      </Row>

      <Card title={t("profile.paymentMethods")} style={{ marginBottom: 16 }}>
        <Empty description={t("profile.comingSoon")} />
      </Card>

      <Card title={t("profile.bankCards")}>
        <List
          dataSource={[]}
          locale={{ emptyText: <Empty description={t("profile.comingSoon")} /> }}
          renderItem={() => null}
        />
      </Card>
    </div>
  );
}

import { Tabs, Typography, Card } from "antd";
import {
  UserOutlined, IdcardOutlined, EnvironmentOutlined, WalletOutlined, BarChartOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import AccountBasicInfo from "./AccountBasicInfo";
import PersonalIdentity from "./PersonalIdentity";
import ShippingAddresses from "./ShippingAddresses";
import PaymentInfo from "./PaymentInfo";
import BehavioralData from "./BehavioralData";

const { Title } = Typography;

export default function ProfilePage() {
  const { t } = useTranslation();

  const tabItems = [
    {
      key: "account",
      label: (
        <span><UserOutlined />{t("profile.accountInfo")}</span>
      ),
      children: <AccountBasicInfo />,
    },
    {
      key: "identity",
      label: (
        <span><IdcardOutlined />{t("profile.personalIdentity")}</span>
      ),
      children: <PersonalIdentity />,
    },
    {
      key: "addresses",
      label: (
        <span><EnvironmentOutlined />{t("profile.shippingAddresses")}</span>
      ),
      children: <ShippingAddresses />,
    },
    {
      key: "payment",
      label: (
        <span><WalletOutlined />{t("profile.paymentInfo")}</span>
      ),
      children: <PaymentInfo />,
    },
    {
      key: "behavior",
      label: (
        <span><BarChartOutlined />{t("profile.behavioralData")}</span>
      ),
      children: <BehavioralData />,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{t("profile.title")}</Title>
      <Card>
        <Tabs items={tabItems} tabPosition="top" />
      </Card>
    </div>
  );
}

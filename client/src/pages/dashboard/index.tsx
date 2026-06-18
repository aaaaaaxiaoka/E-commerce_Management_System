import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  ShoppingOutlined, OrderedListOutlined, DollarOutlined, UserOutlined,
} from "@ant-design/icons";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart, PieChart, BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTranslation } from "react-i18next";
import request from "@/api/request";

// 按需注册 ECharts（减少打包体积）
echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

interface Stats {
  productCount: number;
  userCount: number;
  orderCount: number;
  todayOrders: number;
  todayRevenue: number;
  recentOrders: Array<{ id: number; orderNo: string; totalAmount: number; status: number; createdAt: string; user: { username: string } }>;
}

interface ChartData {
  trend: Array<{ date: string; orders: number; revenue: number }>;
  statusDistribution: Array<{ status: number; name: string; count: number }>;
  categoryDistribution: Array<{ name: string; count: number }>;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "待付款", color: "orange" }, 2: { label: "待发货", color: "blue" },
  3: { label: "待收货", color: "cyan" }, 4: { label: "已完成", color: "green" },
  5: { label: "已取消", color: "default" },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [statsRes, chartsRes] = await Promise.all([
          request.get("/dashboard/stats"),
          request.get("/dashboard/charts", { params: { days: 7 } }),
        ]);
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 销售趋势图配置
  const trendOption = {
    tooltip: { trigger: "axis" as const },
    legend: { data: [t("dashboard.revenue"), t("dashboard.orders")] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category" as const, data: charts?.trend.map((d) => d.date) || [] },
    yAxis: [
      { type: "value" as const, name: t("dashboard.revenue") },
      { type: "value" as const, name: t("dashboard.orders") },
    ],
    series: [
      { name: t("dashboard.revenue"), type: "line", smooth: true, data: charts?.trend.map((d) => d.revenue) || [] },
      { name: t("dashboard.orders"), type: "line", smooth: true, yAxisIndex: 1, data: charts?.trend.map((d) => d.orders) || [] },
    ],
  };

  // 订单状态饼图
  const statusOption = {
    tooltip: { trigger: "item" as const },
    legend: { orient: "vertical" as const, left: "left" },
    series: [{
      name: t("dashboard.orderStatus"), type: "pie", radius: "60%", center: ["50%", "55%"],
      data: charts?.statusDistribution.map((s) => ({ name: s.name, value: s.count })) || [],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" } },
    }],
  };

  // 分类分布柱状图
  const categoryOption = {
    tooltip: { trigger: "axis" as const },
    xAxis: { type: "category" as const, data: charts?.categoryDistribution.map((c) => c.name) || [] },
    yAxis: { type: "value" as const },
    series: [{ type: "bar", data: charts?.categoryDistribution.map((c) => c.count) || [], itemStyle: { color: "#1677ff" } }],
  };

  const recentColumns = [
    { title: "订单号", dataIndex: "orderNo", key: "orderNo" },
    { title: "用户", dataIndex: ["user", "username"], key: "user" },
    { title: "金额", dataIndex: "totalAmount", key: "amount", render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: "状态", dataIndex: "status", key: "status", render: (v: number) => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label}</Tag> },
    { title: t("common.createTime"), dataIndex: "createdAt", key: "time", render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* 顶部指标卡 */}
      <Row gutter={[16, 16]}>
        {[
          { title: t("dashboard.productCount"), value: stats?.productCount ?? 0, icon: <ShoppingOutlined />, color: "#1677ff" },
          { title: t("dashboard.todayOrders"), value: stats?.todayOrders ?? 0, icon: <OrderedListOutlined />, color: "#52c41a" },
          { title: t("dashboard.todayRevenue"), value: `¥${(stats?.todayRevenue ?? 0).toFixed(2)}`, icon: <DollarOutlined />, color: "#fa8c16" },
          { title: t("dashboard.userCount"), value: stats?.userCount ?? 0, icon: <UserOutlined />, color: "#722ed1" },
        ].map((item, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card loading={loading}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: item.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={t("dashboard.salesTrend")} loading={loading}>
            <ReactEChartsCore echarts={echarts} option={trendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("dashboard.orderStatus")} loading={loading}>
            <ReactEChartsCore echarts={echarts} option={statusOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.categoryDistribution")} loading={loading}>
            <ReactEChartsCore echarts={echarts} option={categoryOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.recentOrders")} loading={loading}>
            <Table rowKey="id" columns={recentColumns} dataSource={stats?.recentOrders || []} size="small" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

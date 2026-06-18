import { useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { Input, Card, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface VirtualListProps {
  /** 数据总数，默认生成 10000 条模拟数据 */
  total?: number;
}

/**
 * 虚拟列表演示 — 使用 react-virtuoso 渲染万级数据，无卡顿
 */
export default function VirtualList({ total = 10000 }: VirtualListProps) {
  const [keyword, setKeyword] = useState("");

  // 生成模拟数据（仅一次）
  const allData = useMemo(() => {
    const categories = ["电子产品", "服装", "食品", "家居", "运动", "图书", "美妆", "玩具"];
    const statuses = [1, 1, 1, 1, 0]; // 80% 上架
    return Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      name: `商品 ${i + 1} — ${["Pro", "Max", "Lite", "Ultra", "Plus"][i % 5]} 系列`,
      category: categories[i % categories.length],
      price: Math.floor(Math.random() * 10000) + 10,
      stock: Math.floor(Math.random() * 1000),
      status: statuses[i % statuses.length],
    }));
  }, [total]);

  // 关键词筛选
  const filtered = useMemo(() => {
    if (!keyword) return allData;
    return allData.filter(
      (item) => item.name.includes(keyword) || item.category.includes(keyword)
    );
  }, [allData, keyword]);

  return (
    <Card title={`虚拟列表演示（共 ${filtered.length.toLocaleString()} 条，react-virtuoso 渲染）`} bordered={false}>
      <Input
        placeholder="搜索商品名称或分类..."
        prefix={<SearchOutlined />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 16, width: 320 }}
        allowClear
      />

      {/* 表头 */}
      <div style={{
        display: "flex", padding: "8px 16px",
        background: "#fafafa", borderBottom: "2px solid #f0f0f0",
        fontWeight: 600, fontSize: 13,
      }}>
        <span style={{ width: 60 }}>ID</span>
        <span style={{ flex: 1 }}>商品名称</span>
        <span style={{ width: 120 }}>分类</span>
        <span style={{ width: 100 }}>价格</span>
        <span style={{ width: 80 }}>库存</span>
        <span style={{ width: 80 }}>状态</span>
      </div>

      {/* 虚拟列表 */}
      <Virtuoso
        style={{ height: 500 }}
        totalCount={filtered.length}
        itemContent={(index) => {
          const item = filtered[index];
          return (
            <div style={{
              display: "flex", padding: "10px 16px",
              borderBottom: "1px solid #f5f5f5",
              fontSize: 13, alignItems: "center",
            }}>
              <span style={{ width: 60, color: "#999" }}>{item.id}</span>
              <span style={{ flex: 1 }}><Text strong>{item.name}</Text></span>
              <span style={{ width: 120, color: "#666" }}>{item.category}</span>
              <span style={{ width: 100 }}>¥{item.price}</span>
              <span style={{ width: 80 }}>{item.stock}</span>
              <span style={{ width: 80 }}>
                <Tag color={item.status ? "green" : "red"}>{item.status ? "上架" : "下架"}</Tag>
              </span>
            </div>
          );
        }}
      />
    </Card>
  );
}

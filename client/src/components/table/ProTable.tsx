import { useEffect, useState, useCallback } from "react";
import { Table, Input, Select, Button, Space, Card, Row, Col } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import { SearchOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";

export interface ProTableColumn<T = any> extends Omit<ColumnsType<T>[number], "dataIndex" | "key"> {
  dataIndex?: string;
  key?: string;
  /** 是否在搜索栏显示 */
  search?: boolean;
  /** 搜索组件类型 */
  searchType?: "input" | "select";
  /** Select 的选项 */
  searchOptions?: { label: string; value: any }[];
  /** 是否隐藏该列 */
  hideInTable?: boolean;
}

interface ProTableProps<T = any> {
  columns: ProTableColumn<T>[];
  fetchData: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    [key: string]: any;
  }) => Promise<{ list: T[]; total: number }>;
  rowKey?: string;
  /** 新增按钮 */
  onAdd?: () => void;
  addPermission?: string;
  /** 添加按钮文字 */
  addText?: string;
}

export default function ProTable<T extends Record<string, any>>({
  columns,
  fetchData,
  rowKey = "id",
  onAdd,
  addText = "新增",
}: ProTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData({ ...pagination, ...searchValues });
      setData(res.list);
      setPagination((prev) => ({ ...prev, total: res.total }));
    } finally {
      setLoading(false);
    }
  }, [fetchData, pagination.page, pagination.pageSize, searchValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    _sorter: SorterResult<T> | SorterResult<T>[]
  ) => {
    setPagination({
      page: pag.current || 1,
      pageSize: pag.pageSize || 10,
      total: pag.total || 0,
    });
  };

  const handleSearch = (key: string, value: any) => {
    setSearchValues((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchValues({});
    setPagination({ page: 1, pageSize: 10, total: 0 });
  };

  // 表格列配置（过滤 hidden 列）
  const tableColumns = columns
    .filter((col) => !col.hideInTable)
    .map((col) => ({
      ...col,
      key: col.key || col.dataIndex,
      dataIndex: col.dataIndex as string,
    })) as ColumnsType<T>;

  // 搜索栏
  const searchColumns = columns.filter((col) => col.search);

  return (
    <Card bordered={false}>
      {searchColumns.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {searchColumns.map((col) => (
            <Col key={col.key || col.dataIndex} xs={24} sm={12} md={8} lg={6}>
              {col.searchType === "select" ? (
                <Select
                  placeholder={`选择${col.title}`}
                  allowClear
                  style={{ width: "100%" }}
                  value={searchValues[col.dataIndex!]}
                  onChange={(val) => handleSearch(col.dataIndex!, val)}
                  options={col.searchOptions}
                />
              ) : (
                <Input
                  placeholder={`搜索${col.title}`}
                  allowClear
                  prefix={<SearchOutlined />}
                  value={searchValues[col.dataIndex!] || ""}
                  onChange={(e) => handleSearch(col.dataIndex!, e.target.value)}
                />
              )}
            </Col>
          ))}
          <Col>
            <Space>
              <Button type="primary" onClick={loadData}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      )}

      {onAdd && (
        <Row style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              {addText}
            </Button>
          </Col>
        </Row>
      )}

      <Table
        rowKey={rowKey}
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}

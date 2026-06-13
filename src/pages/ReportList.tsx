import React, { useEffect, useState } from 'react';
import { Table, Breadcrumb, Button, Input, Space, Tag, Avatar, Typography, Spin, Empty } from 'antd';
import * as Antd from 'antd';
const Card = Antd.Card as any;
import { SearchOutlined, PlusOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loadReportListItems, type ReportListItem } from '../services/reportListData';

const { Title, Text } = Typography;

const ReportList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    void loadReportListItems()
      .then(data => {
        if (active) {
          setItems(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const columns = [
    {
      title: 'Tên báo cáo',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReportListItem) => (
        <Text
          strong
          className="text-[#1677ff] cursor-pointer hover:underline font-medium"
          onClick={() => navigate(`/reports/${record.key}`)}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Chu kỳ',
      dataIndex: 'cycle',
      key: 'cycle',
      render: (cycle: string) => {
        let colorClass = '';
        if (cycle === 'Tuần') colorClass = 'bg-[#e6f7ff] text-[#096dd9] border-[#91d5ff]';
        if (cycle === 'Tháng') colorClass = 'bg-[#fff7e6] text-[#d46b08] border-[#ffd591]';
        if (cycle === 'Quý') colorClass = 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]';
        return (
          <span className={`px-2 py-0.5 rounded border text-xs ${colorClass}`}>
            {cycle}
          </span>
        );
      },
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string, record: ReportListItem) => (
        <span className={record.status === 'Trễ' ? 'text-red-500' : ''}>{date}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let colorClass = '';
        if (status === 'Đã nộp') colorClass = 'bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]';
        if (status === 'Chưa nộp') colorClass = 'bg-[#e6f7ff] text-[#096dd9] border-[#91d5ff]';
        if (status === 'Trễ') colorClass = 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]';
        if (status === 'Đang làm') colorClass = 'bg-[#e6f7ff] text-[#096dd9] border-[#91d5ff]';
        return (
          <span className={`px-2 py-0.5 rounded border text-xs ${colorClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      title: 'Người phụ trách',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} className="bg-orange-400" />
          <Text>{owner}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumb
            items={[
              { title: 'Trang chủ' },
              { title: 'Nhà máy' },
              { title: 'Báo cáo định kỳ' },
            ]}
            className="mb-2"
          />
          <Title level={3} className="m-0">Danh sách báo cáo</Title>
        </div>
        <Space>
          <Button icon={<FilterOutlined />}>Bộ lọc</Button>
          <Button type="primary" icon={<PlusOutlined />} className="bg-orange-500">
            Tạo báo cáo mới
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm">
        <div className="mb-4 flex justify-between items-center">
          <Input
            placeholder="Tìm kiếm tên báo cáo..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-80 rounded-lg"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <Text type="secondary">Hiển thị {filtered.length} báo cáo</Text>
        </div>
        <Spin spinning={loading}>
          {!loading && filtered.length === 0 ? (
            <Empty description="Chưa có báo cáo trên Supabase" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table
                  dataSource={filtered}
                  columns={columns}
                  pagination={false}
                  rowKey="key"
                  className="rounded-lg overflow-hidden"
                />
              </div>
              <div className="block md:hidden space-y-2">
                {filtered.map(item => (
                  <div key={item.key} className="rounded-lg border border-gray-200 p-3 bg-white shadow-sm">
                    <Text
                      strong
                      className="text-[#1677ff] cursor-pointer hover:underline font-medium"
                      onClick={() => navigate(`/reports/${item.key}`)}
                    >
                      {item.name}
                    </Text>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p>Chu kỳ: {item.cycle}</p>
                      <p className={item.status === 'Trễ' ? 'text-red-500 font-medium' : ''}>Hạn nộp: {item.deadline}</p>
                      <p>Trạng thái: {item.status}</p>
                      <p>Phụ trách: {item.owner}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ReportList;

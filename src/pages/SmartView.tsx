import React from 'react';
import { Table, Tabs, Typography, Tag, Space } from 'antd';
import * as Antd from 'antd';
const Card = Antd.Card as any;
import { SMART_VIEW_DEBT } from '../mockData';

const { Title, Text } = Typography;

const SmartView: React.FC = () => {
  const debtColumns = [
    {
      title: 'Khách hàng / Đối tác',
      dataIndex: 'customer',
      key: 'customer',
      fixed: 'left' as const,
      width: 200,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Thương Mại',
      children: [
        {
          title: 'Tổng nợ',
          dataIndex: ['trade', 'total'],
          key: 'tradeTotal',
          render: (val: number) => <Text>{val}M</Text>,
        },
        {
          title: 'Đã thu',
          dataIndex: ['trade', 'collected'],
          key: 'tradeCollected',
          render: (val: number) => <Text className="text-green-600">{val}M</Text>,
        },
        {
          title: 'Quá hạn',
          dataIndex: ['trade', 'overdue'],
          key: 'tradeOverdue',
          render: (val: number) => <Text className="text-red-600">{val}M</Text>,
        },
      ],
    },
    {
      title: 'Sản xuất (OEM)',
      children: [
        {
          title: 'Tổng nợ',
          dataIndex: ['oem', 'total'],
          key: 'oemTotal',
          render: (val: number) => <Text>{val}M</Text>,
        },
        {
          title: 'Đã thu',
          dataIndex: ['oem', 'collected'],
          key: 'oemCollected',
          render: (val: number) => <Text className="text-green-600">{val}M</Text>,
        },
        {
          title: 'Quá hạn',
          dataIndex: ['oem', 'overdue'],
          key: 'oemOverdue',
          render: (val: number) => <Text className="text-red-600">{val}M</Text>,
        },
      ],
    },
  ];

  const summaryData = [
    ...SMART_VIEW_DEBT,
    {
      key: 'total',
      customer: 'TỔNG CỘNG',
      trade: { total: 1300, collected: 1200, overdue: 100 },
      oem: { total: 500, collected: 350, overdue: 150 },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Title level={3} className="m-0">Tổng hợp Chủ đề (Smart View)</Title>
        <Space>
          <Tag color="blue">Dữ liệu thời gian thực</Tag>
          <Text type="secondary">Cập nhật: 5 phút trước</Text>
        </Space>
      </div>

      <Card className="shadow-sm">
        <Tabs
          defaultActiveKey="debt"
          items={[
            {
              key: 'debt',
              label: 'Công nợ',
              children: (
                <div className="pt-4">
                  <div className="hidden md:block">
                    <Table
                      columns={debtColumns}
                      dataSource={summaryData}
                      variant="bordered"
                      pagination={false}
                      scroll={{ x: 1000 }}
                      rowClassName={(record) => record.key === 'total' ? 'bg-gray-100 font-bold' : ''}
                    />
                  </div>
                  <div className="block md:hidden space-y-2">
                    {summaryData.map((row: any) => (
                      <div
                        key={row.key}
                        className={`rounded-lg border p-3 ${row.key === 'total' ? 'bg-gray-100 border-gray-300 font-semibold' : 'bg-white border-gray-200'}`}
                      >
                        <p className="font-medium">{row.customer}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="font-medium text-gray-600">Thương mại</p>
                            <p>Tổng nợ: {row.trade.total}M</p>
                            <p className="text-green-600">Đã thu: {row.trade.collected}M</p>
                            <p className="text-red-600">Quá hạn: {row.trade.overdue}M</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">OEM</p>
                            <p>Tổng nợ: {row.oem.total}M</p>
                            <p className="text-green-600">Đã thu: {row.oem.collected}M</p>
                            <p className="text-red-600">Quá hạn: {row.oem.overdue}M</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'inventory',
              label: 'Tồn kho',
              children: (
                <div className="py-20 text-center">
                  <Text type="secondary">Dữ liệu Tồn kho đang được tổng hợp...</Text>
                </div>
              ),
            },
            {
              key: 'sales',
              label: 'Doanh số',
              children: (
                <div className="py-20 text-center">
                  <Text type="secondary">Dữ liệu Doanh số đang được tổng hợp...</Text>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SmartView;

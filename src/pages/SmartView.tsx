import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tabs, Typography, Tag, Space, Spin, Empty } from 'antd';
import * as Antd from 'antd';
const Card = Antd.Card as any;
import { loadDebtRecords, type DebtRecord } from '../services/auxiliaryData';

const { Title, Text } = Typography;

const SmartView: React.FC = () => {
  const [rows, setRows] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadDebtRecords()
      .then(data => {
        if (active) {
          setRows(data);
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

  const summaryData = useMemo(() => {
    if (!rows.length) {
      return [];
    }
    const total = rows.reduce(
      (acc, row) => ({
        trade: {
          total: acc.trade.total + row.trade.total,
          collected: acc.trade.collected + row.trade.collected,
          overdue: acc.trade.overdue + row.trade.overdue,
        },
        oem: {
          total: acc.oem.total + row.oem.total,
          collected: acc.oem.collected + row.oem.collected,
          overdue: acc.oem.overdue + row.oem.overdue,
        },
      }),
      {
        trade: { total: 0, collected: 0, overdue: 0 },
        oem: { total: 0, collected: 0, overdue: 0 },
      }
    );
    return [
      ...rows,
      {
        key: 'total',
        customer: 'TỔNG CỘNG',
        trade: total.trade,
        oem: total.oem,
      },
    ];
  }, [rows]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Title level={3} className="m-0">Tổng hợp Chủ đề (Smart View)</Title>
        <Space>
          <Tag color="blue">Dữ liệu Supabase</Tag>
        </Space>
      </div>

      <Card className="shadow-sm">
        <Spin spinning={loading}>
          {!loading && rows.length === 0 ? (
            <Empty description="Chưa có dữ liệu công nợ trên Supabase (bảng cong_no)" />
          ) : (
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
                          rowKey="key"
                          scroll={{ x: 800 }}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SmartView;

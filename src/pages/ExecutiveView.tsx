import React, { useEffect, useState } from 'react';
import { Typography, Alert, Space, Tag, Table, Card, Spin, Empty } from 'antd';
import { WarningOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import {
  loadImportantExecutiveTasks,
  loadOverdueExecutiveTasks,
  type ExecutiveTaskRow,
} from '../services/executiveData';
import { loadSystemWarnings } from '../services/auxiliaryData';

const { Title, Text } = Typography;
const AntCard = Card as React.ComponentType<React.ComponentProps<typeof Card>>;

const ExecutiveView: React.FC = () => {
  const [overdueTasks, setOverdueTasks] = useState<ExecutiveTaskRow[]>([]);
  const [importantTasks, setImportantTasks] = useState<ExecutiveTaskRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([loadOverdueExecutiveTasks(), loadImportantExecutiveTasks(), loadSystemWarnings()])
      .then(([overdue, important, systemWarnings]) => {
        if (!active) {
          return;
        }
        setOverdueTasks(overdue);
        setImportantTasks(important);
        setWarnings(systemWarnings);
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

  const overdueColumns = [
    {
      title: 'Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong className="text-red-600 cursor-pointer hover:underline">{text}</Text>,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag color="default">{text}</Tag>,
    },
    {
      title: 'Ảnh hưởng',
      dataIndex: 'priority',
      key: 'priority',
      align: 'center' as const,
      render: (priority: number) => (
        <span className="font-bold text-red-500">
          Mức {priority}
        </span>
      ),
    },
  ];

  const importantColumns = [
    {
      title: 'Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong className="text-orange-600 cursor-pointer hover:underline">{text}</Text>,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag color="default">{text}</Tag>,
    },
    {
      title: 'Ảnh hưởng',
      dataIndex: 'priority',
      key: 'priority',
      align: 'center' as const,
      render: (priority: number) => (
        <span className="font-bold text-orange-500">
          Mức {priority}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      <div className="border-b pb-4 mb-6">
        <Title level={2} className="m-0 text-gray-800">Giao Diện Điều Hành</Title>
        <Text type="secondary" className="text-base">Tóm tắt các vấn đề trọng điểm từ Supabase.</Text>
      </div>

      <Spin spinning={loading}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AntCard
              title={<span className="text-red-600 text-lg"><ClockCircleOutlined className="mr-2" />🔴 VIỆC QUÁ HẠN CẦN XỬ LÝ</span>}
              className="shadow-sm border-t-4 border-t-red-500 rounded-lg"
              styles={{ body: { padding: 0 } }}
            >
              {overdueTasks.length === 0 ? (
                <Empty className="py-8" description="Không có việc quá hạn" />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table
                      dataSource={overdueTasks}
                      columns={overdueColumns}
                      pagination={false}
                      size="small"
                      rowKey="id"
                      className="px-2 pb-2"
                    />
                  </div>
                  <div className="block md:hidden p-3 space-y-2">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="rounded-lg border border-red-100 p-3 bg-white">
                        <p className="font-semibold text-red-600 text-sm">{task.title}</p>
                        <p className="text-xs text-gray-600 mt-1">Phòng ban: {task.department}</p>
                        <p className="text-xs text-red-500 font-medium mt-1">Ảnh hưởng: Mức {task.priority}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AntCard>

            <AntCard
              title={<span className="text-orange-600 text-lg"><FireOutlined className="mr-2" />⭐ VIỆC QUAN TRỌNG (MỨC 3-4)</span>}
              className="shadow-sm border-t-4 border-t-orange-400 rounded-lg"
              styles={{ body: { padding: 0 } }}
            >
              {importantTasks.length === 0 ? (
                <Empty className="py-8" description="Không có việc quan trọng" />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table
                      dataSource={importantTasks}
                      columns={importantColumns}
                      pagination={false}
                      size="small"
                      rowKey="id"
                      className="px-2 pb-2"
                    />
                  </div>
                  <div className="block md:hidden p-3 space-y-2">
                    {importantTasks.map(task => (
                      <div key={task.id} className="rounded-lg border border-orange-100 p-3 bg-white">
                        <p className="font-semibold text-orange-600 text-sm">{task.title}</p>
                        <p className="text-xs text-gray-600 mt-1">Phòng ban: {task.department}</p>
                        <p className="text-xs text-orange-500 font-medium mt-1">Ảnh hưởng: Mức {task.priority}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AntCard>
          </div>

          <div className="lg:col-span-1">
            <AntCard
              title={<span className="text-yellow-600 text-lg"><WarningOutlined className="mr-2" />⚠️ CẢNH BÁO HỆ THỐNG</span>}
              className="shadow-sm border border-yellow-200 bg-yellow-50 h-full rounded-lg"
              styles={{ body: { padding: '16px' } }}
            >
              {warnings.length === 0 ? (
                <Empty description="Chưa có cảnh báo (bảng canh_bao)" />
              ) : (
                <Space direction="vertical" size="middle" className="w-full">
                  {warnings.map((warning, index) => (
                    <Alert
                      key={index}
                      message={warning}
                      type="warning"
                      showIcon
                      className="bg-white border-yellow-300 shadow-sm rounded-md font-medium text-gray-700"
                    />
                  ))}
                </Space>
              )}
            </AntCard>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default ExecutiveView;

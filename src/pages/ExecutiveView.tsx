import React from 'react';
import { Typography, Alert, Space, Tag, Table, Card } from 'antd';
import { WarningOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// --- MOCK DATA CHUẨN ĐẶC TẢ ---
const OVERDUE_TASKS = [
  { id: '1', title: 'Sản xuất đơn A', department: 'Nhà máy', priority: 4 },
  { id: '2', title: 'Fix lỗi máy B', department: 'Kỹ thuật', priority: 3 },
  { id: '3', title: 'Báo cáo công nợ tháng', department: 'Kế toán', priority: 4 },
];

const IMPORTANT_TASKS = [
  { id: '4', title: 'Ký hợp đồng cung ứng vật tư', department: 'Mua hàng', priority: 4 },
  { id: '5', title: 'Duyệt thiết kế showroom mới', department: 'Marketing', priority: 3 },
];

const SYSTEM_WARNINGS = [
  'Công nợ OEM đang tăng cao vượt mức an toàn.',
  'Tồn kho vật tư chậm luân chuyển tại kho số 2.',
  'Tỷ lệ hàng lỗi line A vượt quá 5% trong tuần này.',
];

const ExecutiveView: React.FC = () => {

  // Cột cho bảng Việc Quá Hạn (Chuẩn 3 cột: Công việc | Phòng ban | Ảnh hưởng)
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

  // Cột cho bảng Việc Quan Trọng
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

      {/* HEADER */}
      <div className="border-b pb-4 mb-6">
        <Title level={2} className="m-0 text-gray-800">Giao Diện Điều Hành</Title>
        <Text type="secondary" className="text-base">Tóm tắt các vấn đề trọng điểm cần xử lý ngay.</Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CỘT TRÁI (Chiếm 2 phần): Chứa 2 bảng Công việc */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 1: VIỆC QUÁ HẠN */}
          <Card
            title={<span className="text-red-600 text-lg"><ClockCircleOutlined className="mr-2" />🔴 VIỆC QUÁ HẠN CẦN XỬ LÝ</span>}
            className="shadow-sm border-t-4 border-t-red-500 rounded-lg"
            styles={{ body: { padding: 0 } }}
          >
            <div className="hidden md:block">
              <Table
                dataSource={OVERDUE_TASKS}
                columns={overdueColumns}
                pagination={false}
                size="small"
                rowKey="id"
                className="px-2 pb-2"
              />
            </div>
            <div className="block md:hidden p-3 space-y-2">
              {OVERDUE_TASKS.map(task => (
                <div key={task.id} className="rounded-lg border border-red-100 p-3 bg-white">
                  <p className="font-semibold text-red-600 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">Phòng ban: {task.department}</p>
                  <p className="text-xs text-red-500 font-medium mt-1">Ảnh hưởng: Mức {task.priority}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 2: VIỆC QUAN TRỌNG */}
          <Card
            title={<span className="text-orange-600 text-lg"><FireOutlined className="mr-2" />⭐ VIỆC QUAN TRỌNG (MỨC 3-4)</span>}
            className="shadow-sm border-t-4 border-t-orange-400 rounded-lg"
            styles={{ body: { padding: 0 } }}
          >
            <div className="hidden md:block">
              <Table
                dataSource={IMPORTANT_TASKS}
                columns={importantColumns}
                pagination={false}
                size="small"
                rowKey="id"
                className="px-2 pb-2"
              />
            </div>
            <div className="block md:hidden p-3 space-y-2">
              {IMPORTANT_TASKS.map(task => (
                <div key={task.id} className="rounded-lg border border-orange-100 p-3 bg-white">
                  <p className="font-semibold text-orange-600 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">Phòng ban: {task.department}</p>
                  <p className="text-xs text-orange-500 font-medium mt-1">Ảnh hưởng: Mức {task.priority}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* CỘT PHẢI (Chiếm 1 phần): Chứa Cảnh báo hệ thống */}
        <div className="lg:col-span-1">

          {/* SECTION 3: CẢNH BÁO */}
          <Card
            title={<span className="text-yellow-600 text-lg"><WarningOutlined className="mr-2" />⚠️ CẢNH BÁO HỆ THỐNG</span>}
            className="shadow-sm border border-yellow-200 bg-yellow-50 h-full rounded-lg"
            styles={{ body: { padding: '16px' } }}
          >
            <Space direction="vertical" size="middle" className="w-full">
              {SYSTEM_WARNINGS.map((warning, index) => (
                <Alert
                  key={index}
                  message={warning}
                  type="warning"
                  showIcon
                  className="bg-white border-yellow-300 shadow-sm rounded-md font-medium text-gray-700"
                />
              ))}
            </Space>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ExecutiveView;
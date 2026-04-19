import React, { useState } from 'react';
import {
  Table,
  Tabs,
  Typography,
  Button,
  Space,
  Tag,
  Input,
  Switch,
  TreeSelect,
  Card,
  Tree
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FolderOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- MOCK DATA ĐỘC LẬP (Không phụ thuộc file ngoài) ---
const MOCK_USERS = [
  { key: '1', name: 'Lê Hoàng Tuyển', email: 'tuyenlh@hobiwood.com', department: 'Ban Giám Đốc', role: 'Super Admin' },
  { key: '2', name: 'Nguyễn Văn Hùng', email: 'hungnv@hobiwood.com', department: 'Nhà máy', role: 'Quản lý' },
  { key: '3', name: 'Trần Thị Lan', email: 'lantt@hobiwood.com', department: 'Kế toán', role: 'Nhân viên' },
];

const MOCK_TEMPLATES = [
  { key: '1', name: 'Mẫu Báo Cáo Sản Xuất Tuần', type: 'Excel', lastUpdate: '10/04/2026', status: 'Active' },
  { key: '2', name: 'Biểu Mẫu Đánh Giá OEM', type: 'Word', lastUpdate: '05/04/2026', status: 'Active' },
  { key: '3', name: 'Phiếu Yêu Cầu Vật Tư', type: 'PDF', lastUpdate: '12/03/2026', status: 'Inactive' },
];

const MOCK_TREE_FOLDERS = [
  { title: 'Nhà máy (Root)', key: 'nm', children: [{ title: 'Báo cáo định kỳ', key: 'nm-1' }, { title: 'Báo cáo lỗi', key: 'nm-2' }] },
  { title: 'OEM (Root)', key: 'oem' },
];

const AdminView: React.FC = () => {

  // --- CẤU HÌNH CÁC CỘT (COLUMNS) ---
  const userColumns = [
    { title: 'Tên người dùng', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'Super Admin' ? 'red' : role === 'Quản lý' ? 'green' : 'blue'}>{role}</Tag> },
    {
      title: 'Hành động', key: 'action', render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} />
          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} />
        </Space>
      )
    },
  ];

  const templateColumns = [
    { title: 'Tên biểu mẫu', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong className="text-blue-600">{text}</Text> },
    { title: 'Định dạng', dataIndex: 'type', key: 'type', render: (text: string) => <Tag>{text}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => <Badge status={status === 'Active' ? 'success' : 'default'} text={status} /> },
    { title: 'Cập nhật lần cuối', dataIndex: 'lastUpdate', key: 'lastUpdate' },
    {
      title: 'Hành động', key: 'action', render: () => (
        <Space>
          <Button size="small">Chỉnh sửa form</Button>
        </Space>
      )
    },
  ];

  const permissionColumns = [
    { title: 'Tính năng / Thư mục', dataIndex: 'feature', key: 'feature', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Xem', dataIndex: 'read', key: 'read', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Thêm/Sửa', dataIndex: 'write', key: 'write', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Xoá', dataIndex: 'delete', key: 'delete', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Phê duyệt', dataIndex: 'approve', key: 'approve', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
  ];

  const permissionData = [
    { key: '1', feature: 'Thư mục: Nhà máy', read: true, write: true, delete: false, approve: true },
    { key: '2', feature: 'Thư mục: OEM', read: true, write: false, delete: false, approve: false },
    { key: '3', feature: 'Báo cáo Cảnh báo', read: true, write: false, delete: false, approve: false },
  ];

  // --- CẤU TRÚC 4 TABS CHUẨN ĐẶC TẢ ---
  const adminTabs = [
    {
      key: 'folders',
      label: <span className="flex items-center"><FolderOutlined className="mr-2" /> Quản lý thư mục</span>,
      children: (
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Title level={4} className="m-0">Cấu trúc thư mục hệ thống</Title>
              <Text type="secondary">Tạo, xóa và sắp xếp hệ thống lưu trữ báo cáo</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Thêm thư mục gốc</Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Tree treeData={MOCK_TREE_FOLDERS} defaultExpandAll className="bg-transparent" />
          </div>
        </div>
      ),
    },
    {
      key: 'templates',
      label: <span className="flex items-center"><FileTextOutlined className="mr-2" /> Template báo cáo</span>,
      children: (
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Title level={4} className="m-0">Quản lý biểu mẫu (Templates)</Title>
              <Text type="secondary">Định nghĩa form dữ liệu cho từng loại báo cáo</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Tạo Template Mới</Button>
          </div>
          <Table columns={templateColumns} dataSource={MOCK_TEMPLATES} pagination={false} size="middle" />
        </div>
      ),
    },
    {
      key: 'users',
      label: <span className="flex items-center"><UserOutlined className="mr-2" /> Quản lý người dùng</span>,
      children: (
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Title level={4} className="m-0">Danh sách tài khoản</Title>
              <Text type="secondary">Cấp phát tài khoản cho nhân sự Hobiwood</Text>
            </div>
            <Space>
              <Input placeholder="Tìm tên/email..." prefix={<SearchOutlined />} className="w-64" />
              <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Thêm User</Button>
            </Space>
          </div>
          <Table columns={userColumns} dataSource={MOCK_USERS} pagination={false} size="middle" />
        </div>
      ),
    },
    {
      key: 'permissions',
      label: <span className="flex items-center"><SafetyCertificateOutlined className="mr-2" /> Phân quyền</span>,
      children: (
        <div className="space-y-6 px-4">
          <div className="border-b pb-4">
            <Title level={4} className="m-0">Ma trận phân quyền</Title>
            <Text type="secondary">Thiết lập quyền truy cập cho từng user hoặc phòng ban</Text>
          </div>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Text strong>Chọn đối tượng cấp quyền:</Text>
            <TreeSelect
              style={{ width: 350 }}
              placeholder="Chọn User hoặc Nhóm (Vd: Ban Giám Đốc)"
              treeDefaultExpandAll
              treeData={[
                { title: 'Nhóm: Ban Giám Đốc', value: 'bgd', children: [{ title: 'User: Lê Hoàng Tuyển', value: 'tuyenlh' }] },
                { title: 'Nhóm: Quản lý Nhà máy', value: 'qlnm', children: [{ title: 'User: Nguyễn Văn Hùng', value: 'hungnv' }] },
              ]}
            />
            <Button type="primary" className="bg-green-600 ml-auto">Lưu cấu hình</Button>
          </div>
          <Table columns={permissionColumns} dataSource={permissionData} pagination={false} size="middle" bordered />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center">
        <SettingOutlined className="text-2xl text-gray-700 mr-3" />
        <div>
          <Title level={2} className="m-0 text-gray-800">Cấu hình Hệ Thống (F-Solution)</Title>
          <Text type="secondary">Khu vực dành riêng cho Quản trị viên cấp cao</Text>
        </div>
      </div>

      <Card className="shadow-sm rounded-xl overflow-hidden border-gray-200" styles={{ body: { padding: 0 } }}>
        <Tabs
          tabPosition="left"
          defaultActiveKey="folders"
          items={adminTabs}
          className="admin-tabs-custom min-h-[600px]"
          // Custom CSS nhẹ để tab bên trái trông rộng rãi và chuyên nghiệp hơn
          tabBarStyle={{ width: 250, backgroundColor: '#fff', paddingTop: 16 }}
        />
      </Card>
    </div>
  );
};

export default AdminView;
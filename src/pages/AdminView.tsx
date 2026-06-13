import React, { useEffect, useState } from 'react';
import {
  Table,
  Tabs,
  Typography,
  Button,
  Space,
  Badge,
  Tag,
  Input,
  Switch,
  TreeSelect,
  Card,
  Tree,
  Spin,
  Empty,
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
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  loadAdminTemplates,
  loadAdminUsers,
  loadFolderTree,
  loadPermissions,
  type AdminTemplate,
  type AdminUser,
  type FolderNode,
  type PermissionRow,
} from '../services/auxiliaryData';

const { Title, Text } = Typography;
const AntCard = Card as React.ComponentType<React.ComponentProps<typeof Card>>;

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([loadAdminUsers(), loadAdminTemplates(), loadFolderTree(), loadPermissions()])
      .then(([userRows, templateRows, folderRows, permissionRows]) => {
        if (!active) {
          return;
        }
        setUsers(userRows);
        setTemplates(templateRows);
        setFolders(folderRows);
        setPermissions(permissionRows);
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
      ),
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
      ),
    },
  ];

  const permissionColumns = [
    { title: 'Tính năng / Thư mục', dataIndex: 'feature', key: 'feature', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Xem', dataIndex: 'read', key: 'read', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Thêm/Sửa', dataIndex: 'write', key: 'write', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Xoá', dataIndex: 'delete', key: 'delete', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
    { title: 'Phê duyệt', dataIndex: 'approve', key: 'approve', render: (checked: boolean) => <Switch defaultChecked={checked} size="small" /> },
  ];

  const adminTabs = [
    {
      key: 'folders',
      label: <span className="flex items-center"><FolderOutlined className="mr-2" /> Quản lý thư mục</span>,
      children: (
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Title level={4} className="m-0">Cấu trúc thư mục hệ thống</Title>
              <Text type="secondary">Dữ liệu từ Supabase (bảng thu_muc)</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Thêm thư mục gốc</Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {folders.length === 0 ? (
              <Empty description="Chưa có thư mục" />
            ) : (
              <Tree treeData={folders} defaultExpandAll className="bg-transparent" />
            )}
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
              <Text type="secondary">Dữ liệu từ Supabase (bảng mau_bao_cao)</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Tạo Template Mới</Button>
          </div>
          {templates.length === 0 ? (
            <Empty description="Chưa có template" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table columns={templateColumns} dataSource={templates} pagination={false} size="middle" rowKey="key" />
              </div>
              <div className="block md:hidden space-y-2">
                {templates.map(item => (
                  <div key={item.key} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="font-semibold text-blue-600 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600 mt-1">Định dạng: {item.type}</p>
                    <p className="text-xs text-gray-600">Cập nhật: {item.lastUpdate}</p>
                    <p className="text-xs mt-1">Trạng thái: <Tag color={item.status === 'Active' ? 'green' : 'default'}>{item.status}</Tag></p>
                  </div>
                ))}
              </div>
            </>
          )}
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
              <Text type="secondary">Dữ liệu từ Supabase (bảng nguoi_dung)</Text>
            </div>
            <Space>
              <Input placeholder="Tìm tên/email..." prefix={<SearchOutlined />} className="w-64" />
              <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600">Thêm User</Button>
            </Space>
          </div>
          {users.length === 0 ? (
            <Empty description="Chưa có người dùng" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table columns={userColumns} dataSource={users} pagination={false} size="middle" rowKey="key" />
              </div>
              <div className="block md:hidden space-y-2">
                {users.map(item => (
                  <div key={item.key} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.email}</p>
                    <p className="text-xs text-gray-600">Phòng ban: {item.department}</p>
                    <p className="text-xs mt-1">Vai trò: <Tag color={item.role === 'Super Admin' ? 'red' : item.role === 'Quản lý' ? 'green' : 'blue'}>{item.role}</Tag></p>
                  </div>
                ))}
              </div>
            </>
          )}
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
            <Text type="secondary">Dữ liệu từ Supabase (bảng phan_quyen)</Text>
          </div>
          {permissions.length === 0 ? (
            <Empty description="Chưa có phân quyền" />
          ) : (
            <>
              <div className="hidden md:block">
                <Table columns={permissionColumns} dataSource={permissions} pagination={false} size="middle" bordered rowKey="key" />
              </div>
              <div className="block md:hidden space-y-2">
                {permissions.map(item => (
                  <div key={item.key} className="rounded-lg border border-gray-200 p-3 bg-white text-xs space-y-1">
                    <p className="font-semibold">{item.feature}</p>
                    <p>Xem: {item.read ? 'Có' : 'Không'}</p>
                    <p>Sửa: {item.write ? 'Có' : 'Không'}</p>
                    <p>Xóa: {item.delete ? 'Có' : 'Không'}</p>
                    <p>Phê duyệt: {item.approve ? 'Có' : 'Không'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={3} className="m-0 flex items-center gap-2">
            <SettingOutlined className="text-blue-600" />
            Trang Quản Trị Hệ Thống
          </Title>
          <Text type="secondary">Cấu hình người dùng, thư mục, template và phân quyền — Supabase</Text>
        </div>
      </div>

      <AntCard className="shadow-sm rounded-xl">
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="folders" items={adminTabs} className="admin-tabs" />
        </Spin>
      </AntCard>
    </div>
  );
};

export default AdminView;

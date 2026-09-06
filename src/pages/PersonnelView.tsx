import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import BackButton from '../components/BackButton';
import {
  addPersonnel,
  deletePersonnel,
  editPersonnel,
  loadPersonnel,
  type PersonnelRecord,
} from '../services/auxiliaryData';

const { Text } = Typography;

type PersonnelFormValues = {
  name: string;
  department: string;
  position: string;
  email?: string;
  phone?: string;
  status: string;
  joinDate?: string;
};

function newPersonnelId() {
  return `ns-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const STATUS_OPTIONS = [
  { value: 'Đang làm', label: 'Đang làm' },
  { value: 'Thử việc', label: 'Thử việc' },
  { value: 'Nghỉ phép', label: 'Nghỉ phép' },
  { value: 'Đã nghỉ', label: 'Đã nghỉ' },
];

function statusColor(status: string): string {
  if (status === 'Đang làm') return 'green';
  if (status === 'Thử việc') return 'blue';
  if (status === 'Nghỉ phép') return 'orange';
  if (status === 'Đã nghỉ') return 'default';
  return 'default';
}

const PersonnelView: React.FC = () => {
  const [rows, setRows] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonnelRecord | null>(null);
  const [form] = Form.useForm<PersonnelFormValues>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadPersonnel();
      setRows(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được danh sách nhân sự.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row =>
      [row.name, row.department, row.position, row.email, row.phone, row.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
    queueMicrotask(() => {
      form.resetFields();
      form.setFieldsValue({ status: 'Đang làm' });
    });
  };

  const openEdit = (record: PersonnelRecord) => {
    setEditing(record);
    setModalOpen(true);
    queueMicrotask(() => {
      form.setFieldsValue({
        name: record.name,
        department: record.department,
        position: record.position,
        email: record.email,
        phone: record.phone,
        status: record.status || 'Đang làm',
        joinDate: record.joinDate,
      });
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const record: PersonnelRecord = {
        key: editing?.key || newPersonnelId(),
        name: values.name.trim(),
        department: values.department.trim(),
        position: values.position.trim(),
        email: (values.email ?? '').trim(),
        phone: (values.phone ?? '').trim(),
        status: values.status,
        joinDate: (values.joinDate ?? '').trim(),
      };

      setSaving(true);
      if (editing) {
        await editPersonnel(record);
        message.success('Đã cập nhật nhân sự.');
      } else {
        await addPersonnel(record);
        message.success('Đã thêm nhân sự.');
      }
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(error instanceof Error ? error.message : 'Lưu nhân sự thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record: PersonnelRecord) => {
    Modal.confirm({
      title: 'Xóa nhân sự?',
      content: `Xóa “${record.name}” khỏi danh sách?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deletePersonnel(record.key);
          message.success('Đã xóa nhân sự.');
          await refresh();
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Xóa thất bại.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Chức vụ', dataIndex: 'position', key: 'position' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v || '—' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColor(status)}>{status || '—'}</Tag>,
    },
    {
      title: 'Ngày vào',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (v: string) => v || '—',
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: unknown, record: PersonnelRecord) => (
        <Space size={0}>
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEdit(record)} />
          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-0 p-3 md:p-4">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#1E386B] text-white px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0 flex items-start gap-3">
            <BackButton variant="light" size="small" className="mt-0.5" />
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/80">Hồ sơ</p>
              <h2 className="m-0 mt-0.5 text-base md:text-lg font-extrabold uppercase leading-snug truncate flex items-center gap-2">
                <TeamOutlined />
                Nhân sự
              </h2>
              <p className="m-0 mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                {rows.length} người · Supabase
              </p>
            </div>
          </div>
          <Button type="primary" size="middle" icon={<PlusOutlined />} className="shrink-0 font-bold" onClick={openCreate}>
            Thêm nhân sự
          </Button>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-slate-50">
          <Input
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, phòng ban, chức vụ..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="max-w-sm"
          />
          <Text type="secondary" className="text-xs md:text-sm ml-auto">
            Hiển thị {filtered.length}/{rows.length}
          </Text>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-[#fafafa]">
          <Spin spinning={loading} tip="Đang tải nhân sự...">
            {filtered.length === 0 && !loading ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={search.trim() ? 'Không khớp từ khóa' : 'Chưa có nhân sự — bấm Thêm nhân sự'}
              >
                {!search.trim() && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    Thêm nhân sự
                  </Button>
                )}
              </Empty>
            ) : (
              <>
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <Table
                    columns={columns}
                    dataSource={filtered}
                    pagination={false}
                    size="middle"
                    rowKey="key"
                    scroll={{ x: 900 }}
                  />
                </div>
                <div className="block md:hidden space-y-2">
                  {filtered.map(item => (
                    <div key={item.key} className="rounded-lg border border-gray-200 p-3 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm m-0">{item.name}</p>
                          <p className="text-xs text-gray-600 mt-1 m-0">
                            {item.position || '—'} · {item.department || '—'}
                          </p>
                          {item.email ? <p className="text-xs text-gray-500 mt-1 m-0">{item.email}</p> : null}
                          {item.phone ? <p className="text-xs text-gray-500 m-0">{item.phone}</p> : null}
                          <p className="text-xs mt-2 m-0">
                            <Tag color={statusColor(item.status)}>{item.status || '—'}</Tag>
                            {item.joinDate ? <span className="text-gray-500 ml-1">Vào: {item.joinDate}</span> : null}
                          </p>
                        </div>
                        <Space size={0} direction="vertical">
                          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEdit(item)} />
                          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} onClick={() => handleDelete(item)} />
                        </Space>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Spin>
        </div>
      </div>

      <Modal
        title={editing ? 'Sửa nhân sự' : 'Thêm nhân sự'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        afterClose={() => form.resetFields()}
        onOk={() => void handleSave()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" size="large" className="task-detail-form mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]} className="sm:col-span-2">
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="department" label="Phòng ban" rules={[{ required: true, message: 'Nhập phòng ban' }]}>
              <Input placeholder="Phòng HCNS" />
            </Form.Item>
            <Form.Item name="position" label="Chức vụ" rules={[{ required: true, message: 'Nhập chức vụ' }]}>
              <Input placeholder="Nhân viên" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input placeholder="email@hobiwood.com" />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="09xx xxx xxx" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="joinDate" label="Ngày vào làm">
              <Input placeholder="01/01/2024" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PersonnelView;

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
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
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


function renderStatusBadge(status?: string) {
  const s = status || 'Đang làm';
  if (s === 'Đang làm') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Đang làm
      </span>
    );
  }
  if (s === 'Thử việc') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Thử việc
      </span>
    );
  }
  if (s === 'Nghỉ phép') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Nghỉ phép
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      Đã nghỉ
    </span>
  );
}

const PersonnelView: React.FC = () => {
  const [rows, setRows] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: rows.length,
      'Đang làm': 0,
      'Thử việc': 0,
      'Nghỉ phép': 0,
      'Đã nghỉ': 0,
    };
    for (const r of rows) {
      const s = r.status || 'Đang làm';
      if (c[s] !== undefined) {
        c[s]++;
      } else {
        c[s] = 1;
      }
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'all') {
      list = list.filter(row => (row.status || 'Đang làm') === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(row =>
      [row.name, row.department, row.position, row.email, row.phone, row.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search, statusFilter]);

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
      render: (text: string) => <Text strong className="text-slate-900">{text}</Text>,
    },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Chức vụ', dataIndex: 'position', key: 'position' },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v: string) =>
        v ? (
          <a href={`mailto:${v}`} className="text-[#0047AB] hover:underline text-xs">
            {v}
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) =>
        v ? (
          <a href={`tel:${v}`} className="text-slate-700 font-semibold hover:underline text-xs">
            {v}
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusBadge(status),
    },
    {
      title: 'Ngày vào',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (v: string) => v || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      render: (_: unknown, record: PersonnelRecord) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined className="text-[#0047AB]" />}
            onClick={() => openEdit(record)}
            className="hover:!bg-blue-50 rounded-md"
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined className="text-rose-500" />}
            onClick={() => handleDelete(record)}
            className="hover:!bg-rose-50 rounded-md"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 min-h-0 p-2 sm:p-3 md:p-4">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header: Midnight Cobalt (#0047AB) Gradient */}
        <div className="bg-gradient-to-r from-[#00327D] via-[#0047AB] to-[#1E386B] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 shadow-sm">
          <div className="min-w-0 flex items-center gap-2 sm:gap-3">
            <BackButton
              variant="light"
              size="small"
              label=""
              className="!w-9 !h-9 !min-w-[36px] !p-0 !rounded-xl !border-white/25 !bg-white/10 !text-white flex items-center justify-center hover:!bg-white/20 transition-all shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-white leading-tight truncate flex items-center gap-1.5">
                  <TeamOutlined className="text-[#F38320]" />
                  Hồ sơ nhân sự
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white/90">
                  {rows.length} người
                </span>
              </div>
              <p className="m-0 text-[11px] text-blue-100/80 font-medium truncate">
                {filtered.length}/{rows.length} nhân sự · Supabase HRM
              </p>
            </div>
          </div>
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            onClick={openCreate}
            className="shrink-0 !bg-[#F38320] hover:!bg-[#d96f12] !border-none !text-white font-bold !rounded-xl shadow-md flex items-center gap-1 text-xs sm:text-sm px-3 sm:px-4 py-1.5 h-9"
          >
            <span className="hidden sm:inline">Thêm nhân sự</span>
            <span className="sm:hidden">Thêm</span>
          </Button>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200/80 bg-white flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, phòng ban, chức vụ, SĐT..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="flex-1 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-xs sm:text-sm"
            />
            <span className="text-slate-500 text-xs shrink-0 font-medium hidden sm:inline">
              Hiển thị <strong className="text-slate-800">{filtered.length}</strong>/{rows.length}
            </span>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: 'all', label: 'Tất cả', count: counts.all },
              { key: 'Đang làm', label: 'Đang làm', count: counts['Đang làm'] },
              { key: 'Thử việc', label: 'Thử việc', count: counts['Thử việc'] },
              { key: 'Nghỉ phép', label: 'Nghỉ phép', count: counts['Nghỉ phép'] },
              { key: 'Đã nghỉ', label: 'Đã nghỉ', count: counts['Đã nghỉ'] },
            ].map(tab => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-[#0047AB] text-white shadow-sm ring-1 ring-[#0047AB]'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.count ?? 0}
                  </span>
                </button>
              );
            })}
            <span className="text-slate-400 text-[11px] ml-auto shrink-0 font-medium sm:hidden">
              {filtered.length}/{rows.length}
            </span>
          </div>
        </div>

        {/* Content list / Table */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50/60">
          <Spin spinning={loading} tip="Đang tải nhân sự...">
            {filtered.length === 0 && !loading ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search.trim() || statusFilter !== 'all'
                    ? 'Không tìm thấy nhân sự phù hợp bộ lọc'
                    : 'Chưa có nhân sự — bấm Thêm nhân sự để bắt đầu'
                }
              >
                {!search.trim() && statusFilter === 'all' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    className="!bg-[#F38320] hover:!bg-[#d96f12] !border-none !rounded-xl font-bold"
                  >
                    Thêm nhân sự mới
                  </Button>
                )}
              </Empty>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <Table
                    columns={columns}
                    dataSource={filtered}
                    pagination={false}
                    size="middle"
                    rowKey="key"
                    scroll={{ x: 900 }}
                  />
                </div>

                {/* Mobile Stitch Card Layout */}
                <div className="block md:hidden space-y-3">
                  {filtered.map(item => {
                    return (
                      <article
                        key={item.key}
                        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm transition-all hover:border-slate-300"
                      >
                        {/* Top: Full Name & Position/Department (NO AVATAR, FULL WIDTH) */}
                        <div>
                          <h2 className="text-base font-bold text-slate-900 leading-snug m-0">
                            {item.name}
                          </h2>
                          <div className="flex items-center text-xs text-slate-600 mt-1.5 flex-wrap gap-1.5">
                            <span className="font-semibold text-[#0047AB] bg-blue-50/90 px-2 py-0.5 rounded-md text-[11px]">
                              {item.position || 'Nhân viên'}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600 font-medium text-[11px]">
                              {item.department || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Contact Details */}
                        {(item.email || item.phone) && (
                          <div className="pt-2.5 mt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                            {item.email && (
                              <div className="flex items-center gap-2">
                                <MailOutlined className="text-slate-400 text-xs flex-shrink-0" />
                                <a
                                  href={`mailto:${item.email}`}
                                  className="text-slate-600 hover:text-[#0047AB] font-normal"
                                >
                                  {item.email}
                                </a>
                              </div>
                            )}
                            {item.phone && (
                              <div className="flex items-center gap-2">
                                <PhoneOutlined className="text-slate-400 text-xs flex-shrink-0" />
                                <a
                                  href={`tel:${item.phone}`}
                                  className="text-slate-800 hover:text-[#0047AB] font-semibold tracking-wide"
                                >
                                  {item.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bottom Line: Status Badge + Hire Date on left, and ALL ACTIONS on the right */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderStatusBadge(item.status)}
                            {item.joinDate && (
                              <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <CalendarOutlined className="text-slate-400 text-xs" />
                                <span>
                                  Vào: <strong className="text-slate-700">{item.joinDate}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Moved to Bottom Line */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0047AB] border border-slate-200 text-xs font-semibold transition active:scale-95"
                            >
                              <EditOutlined className="text-xs text-[#0047AB]" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition active:scale-95"
                            >
                              <DeleteOutlined className="text-xs text-rose-500" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </Spin>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <TeamOutlined className="text-[#0047AB]" />
            <span>{editing ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        afterClose={() => form.resetFields()}
        onOk={() => void handleSave()}
        okText="Lưu thông tin"
        cancelText="Hủy"
        okButtonProps={{
          className: '!bg-[#F38320] hover:!bg-[#d96f12] !border-none !text-white font-bold !rounded-xl',
        }}
        cancelButtonProps={{
          className: '!rounded-xl font-medium',
        }}
        confirmLoading={saving}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" size="middle" className="task-detail-form mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label={<span className="font-semibold text-slate-700">Họ và tên</span>}
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              className="sm:col-span-2"
            >
              <Input placeholder="Ví dụ: Nguyễn Văn A" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="department"
              label={<span className="font-semibold text-slate-700">Phòng ban</span>}
              rules={[{ required: true, message: 'Vui lòng nhập phòng ban' }]}
            >
              <Input placeholder="Ví dụ: Ban IT, HCNS, Kinh Doanh" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="position"
              label={<span className="font-semibold text-slate-700">Chức vụ</span>}
              rules={[{ required: true, message: 'Vui lòng nhập chức vụ' }]}
            >
              <Input placeholder="Ví dụ: Trưởng nhóm, Chuyên viên" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span className="font-semibold text-slate-700">Email</span>}
            >
              <Input placeholder="email@hobiwood.com" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={<span className="font-semibold text-slate-700">Số điện thoại</span>}
            >
              <Input placeholder="09xx xxx xxx" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="status"
              label={<span className="font-semibold text-slate-700">Trạng thái</span>}
              rules={[{ required: true, message: 'Chọn trạng thái' }]}
            >
              <Select options={STATUS_OPTIONS} className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="joinDate"
              label={<span className="font-semibold text-slate-700">Ngày vào làm</span>}
            >
              <Input placeholder="DD/MM/YYYY" className="rounded-lg" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PersonnelView;

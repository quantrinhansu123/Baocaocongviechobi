import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Tag,
  Select,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckSquareOutlined,
  PlusOutlined,
  LinkOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';

const { Text } = Typography;

// ─── GENERATE 52 TUẦN ────────────────────────────────────────────────────────
const generateWeeks = () => {
  const weeks = [];
  let start = dayjs('2026-01-04');
  for (let i = 1; i <= 52; i++) {
    const end = start.add(6, 'day');
    weeks.push({
      value: `week_${i}`,
      label: `Tuần ${i}  (${start.format('DD/MM')} - ${end.format('DD/MM')})`,
    });
    start = start.add(7, 'day');
  }
  return weeks;
};
const WEEK_OPTIONS = generateWeeks();

// ─── CẤU TRÚC TỔ CHỨC 22/04/2026 (4 khối → phòng ban) ─────────────────────────
type DeptSpec = { key: string; name: string };

type BlockSpec = {
  key: string;
  label: string;
  /** Màu chữ tiêu đề khối (cấp 1) */
  titleClass: string;
  /** Màu phụ cho cấp phòng (cấp 2) */
  deptTitleClass: string;
  depts: DeptSpec[];
};

const ORG_BLOCKS: BlockSpec[] = [
  {
    key: 'bld',
    label: 'BAN LÃNH ĐẠO',
    titleClass: 'text-[#1E386B]',
    deptTitleClass: 'text-[#1e40af]',
    depts: [
      { key: 'bld-ca-nhan', name: 'CÔNG VIỆC CÁ NHÂN' },
      { key: 'bld-cong-viec-bld', name: 'CÔNG VIỆC CỦA BLĐ' },
    ],
  },
  {
    key: 'tm',
    label: 'KHỐI THƯƠNG MẠI',
    titleClass: 'text-[#0f766e]',
    deptTitleClass: 'text-[#0d9488]',
    depts: [
      { key: 'tm-hcns', name: 'PHÒNG HCNS' },
      { key: 'tm-kd-go', name: 'PHÒNG KD HOBI GỖ' },
      { key: 'tm-kd-nhua', name: 'PHÒNG KD HOBI NHỰA' },
      { key: 'tm-xuat-khau', name: 'PHÒNG XUẤT KHẨU' },
      { key: 'tm-du-an', name: 'PHÒNG DỰ ÁN' },
      { key: 'tm-cn-hcm', name: 'CHI NHÁNH HCM' },
      { key: 'tm-marketing', name: 'PHÒNG MARKETING' },
      { key: 'tm-ke-toan', name: 'PHÒNG KẾ TOÁN TM' },
      { key: 'tm-kho', name: 'PHÒNG KHO' },
    ],
  },
  {
    key: 'sx',
    label: 'KHỐI SẢN XUẤT',
    titleClass: 'text-[#c2410c]',
    deptTitleClass: 'text-[#ea580c]',
    depts: [
      { key: 'sx-kd-oem', name: 'PHÒNG KD OEM' },
      { key: 'sx-ke-toan', name: 'PHÒNG KẾ TOÁN SẢN XUẤT' },
      { key: 'sx-nm-wilson', name: 'NHÀ MÁY WILSON HB' },
    ],
  },
  {
    key: 'mua',
    label: 'PHÒNG MUA NỘI ĐỊA, QUỐC TẾ',
    titleClass: 'text-[#475569]',
    deptTitleClass: 'text-[#64748b]',
    depts: [
      { key: 'mua-thuong-mai', name: 'MUA THƯƠNG MẠI' },
      { key: 'mua-san-xuat', name: 'MUA SẢN XUẤT' },
    ],
  },
];

const ROMAN = ['I', 'II', 'III', 'IV'] as const;

function findDeptMeta(deptKey: string): {
  blockKey: string;
  blockLabel: string;
  deptName: string;
  deptIndex: number;
  titleClass: string;
  deptTitleClass: string;
} | null {
  for (const block of ORG_BLOCKS) {
    const idx = block.depts.findIndex(d => d.key === deptKey);
    if (idx >= 0) {
      return {
        blockKey: block.key,
        blockLabel: block.label,
        deptName: block.depts[idx].name,
        deptIndex: idx + 1,
        titleClass: block.titleClass,
        deptTitleClass: block.deptTitleClass,
      };
    }
  }
  return null;
}

function flattenDeptOptions() {
  const opts: { value: string; label: string }[] = [];
  ORG_BLOCKS.forEach((block, bi) => {
    const r = ROMAN[bi];
    block.depts.forEach((d, di) => {
      opts.push({
        value: d.key,
        label: `${r}. ${block.label} — ${di + 1}. ${d.name}`,
      });
    });
  });
  return opts;
}

// ─── TASK TYPE & DỮ LIỆU MẪU (theo deptKey) ───────────────────────────────────
type TaskRecord = {
  stt: number;
  kyBaoCao: string;
  congViec: string;
  nguoiGiao: string;
  ngayGiao: string;
  ycXong: string;
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  ketQua: string;
  linkKQ: string;
  tienDo: string;
  vuongMac: string;
  canLD: string;
  anhHuong: number;
};

const MOCK_TASK_NAMES = [
  'Lập kế hoạch tuần',
  'Theo dõi KPI tháng',
  'Rà soát công nợ',
  'Kiểm kê vật tư',
  'Cập nhật tiến độ dự án',
  'Làm việc với nhà cung cấp',
  'Chuẩn bị hồ sơ họp',
  'Báo cáo kết quả thực hiện',
  'Đánh giá rủi ro vận hành',
  'Tối ưu quy trình nội bộ',
];

const MOCK_ASSIGNEES = ['Anh Tuyển', 'Chị Lan', 'Anh Hùng', 'Anh Hòa', 'Chị Mai', 'Mrs Thao', 'Mr Khánh'];
const MOCK_STATUS = ['Hoàn thành', 'Đang làm', 'Quá hạn', 'Chưa bắt đầu'] as const;
const MOCK_PERIOD = ['Tuần', 'Tháng', 'Quý'] as const;

function buildInitialTasksByDept(): Record<string, Record<string, TaskRecord>> {
  const data: Record<string, Record<string, TaskRecord>> = {};

  ORG_BLOCKS.forEach((block, bi) => {
    block.depts.forEach((dept, di) => {
      const deptBucket: Record<string, TaskRecord> = {};
      // Mỗi phòng ban có 8 task mẫu để list dày hơn.
      for (let i = 1; i <= 8; i += 1) {
        const mix = bi * 100 + di * 10 + i;
        const period = MOCK_PERIOD[mix % MOCK_PERIOD.length];
        const status = MOCK_STATUS[mix % MOCK_STATUS.length];
        const assignee = MOCK_ASSIGNEES[mix % MOCK_ASSIGNEES.length];
        const taskName = MOCK_TASK_NAMES[mix % MOCK_TASK_NAMES.length];

        const startDate = dayjs('2026-01-05').add(mix * 2, 'day');
        const dueDate = startDate.add(7 + (mix % 12), 'day');
        const ext1 = status === 'Quá hạn' || mix % 4 === 0 ? dueDate.add(2, 'day') : null;
        const ext2 = status === 'Quá hạn' && mix % 2 === 0 ? dueDate.add(4, 'day') : null;

        const taskKey = `${dept.key}-task-${i}`;
        deptBucket[taskKey] = {
          stt: i,
          kyBaoCao: period,
          congViec: `${taskName} - ${dept.name.toLowerCase()}`,
          nguoiGiao: assignee,
          ngayGiao: startDate.format('DD/MM/YYYY'),
          ycXong: dueDate.format('DD/MM/YYYY'),
          giaHan1: ext1 ? ext1.format('DD/MM/YYYY') : '',
          giaHan2: ext2 ? ext2.format('DD/MM/YYYY') : '',
          giaHan3: '',
          ketQua:
            status === 'Hoàn thành'
              ? 'Đã hoàn thành và nghiệm thu.'
              : status === 'Chưa bắt đầu'
                ? 'Đang chờ bắt đầu theo kế hoạch.'
                : 'Đang cập nhật theo tiến độ thực hiện.',
          linkKQ: `https://docs.google.com/mock/${dept.key}/${i}`,
          tienDo: status,
          vuongMac: status === 'Quá hạn' ? 'Thiếu nguồn lực tại thời điểm triển khai.' : '',
          canLD: status === 'Quá hạn' || mix % 5 === 0 ? 'Có' : 'Không',
          anhHuong: (mix % 4) + 1,
        };
      }
      data[dept.key] = deptBucket;
    });
  });

  return data;
}

const INITIAL_TASKS_BY_DEPT: Record<string, Record<string, TaskRecord>> = buildInitialTasksByDept();

function cloneTasksMap(src: Record<string, Record<string, TaskRecord>>) {
  return structuredClone(src) as Record<string, Record<string, TaskRecord>>;
}

type TreeNodeBase = {
  key: string;
  displayTitle: string;
  isBlock?: boolean;
  isDept?: boolean;
  isLeaf?: boolean;
  blockKey?: string;
  deptKey?: string;
  titleClass?: string;
  deptTitleClass?: string;
  children?: TreeNodeBase[];
};

function buildTreeData(tasksByDept: Record<string, Record<string, TaskRecord>>): TreeNodeBase[] {
  return ORG_BLOCKS.map((block, bi) => {
    const roman = ROMAN[bi];
    const blockTreeKey = `blk-${block.key}`;
    const deptChildren: TreeNodeBase[] = block.depts.map((dept, di) => {
      const deptTreeKey = `dpt-${dept.key}`;
      const bucket = tasksByDept[dept.key] ?? {};
      const taskLeaves: TreeNodeBase[] = Object.entries(bucket).map(([taskKey, task]) => ({
        key: taskKey,
        displayTitle: task.congViec,
        isLeaf: true,
        deptKey: dept.key,
        blockKey: block.key,
      }));
      return {
        key: deptTreeKey,
        displayTitle: `${di + 1}. ${dept.name}`,
        isDept: true,
        blockKey: block.key,
        deptKey: dept.key,
        titleClass: block.titleClass,
        deptTitleClass: block.deptTitleClass,
        children: taskLeaves,
      };
    });
    return {
      key: blockTreeKey,
      displayTitle: `${roman}. ${block.label}`,
      isBlock: true,
      blockKey: block.key,
      titleClass: block.titleClass,
      deptTitleClass: block.deptTitleClass,
      children: deptChildren,
    };
  });
}

const STATUS_CFG: Record<string, { color: string }> = {
  'Hoàn thành': { color: 'success' },
  'Đang làm': { color: 'processing' },
  'Quá hạn': { color: 'error' },
  'Chưa bắt đầu': { color: 'default' },
};

const renderStars = (level: number) => (
  <div className="flex gap-0.5">
    {[...Array(4)].map((_, i) => (
      <Star key={i} size={15} className={i < level ? 'fill-[#F38320] text-[#F38320]' : 'text-gray-300'} />
    ))}
  </div>
);

const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <div className="flex items-start gap-2 md:gap-3 md:w-44 flex-shrink-0">
      <div className="w-5 mt-0.5 text-[#1E386B] flex-shrink-0 text-sm flex justify-center">{icon}</div>
      <div className="flex-1 md:w-auto">
        <Text type="secondary" className="text-[11px] md:text-xs uppercase tracking-wide">
          {label}
        </Text>
      </div>
    </div>
    <div className="flex-1 text-sm font-medium ml-7 md:ml-0">{children}</div>
  </div>
);

type ListScope =
  | { kind: 'block'; blockKey: string }
  | { kind: 'dept'; deptKey: string };

type TableRow = {
  key: string;
  stt: number;
  phongBan: string;
  congViec: string;
  nguoiPhuTrach: string;
  deadline: string;
  deptKey: string;
};

const DEPT_OPTIONS = flattenDeptOptions();

const TaskView: React.FC = () => {
  const { blockKey: blockKeyParam, deptKey: deptKeyParam } = useParams<{ blockKey?: string; deptKey?: string }>();

  const [tasksByDept, setTasksByDept] = useState<Record<string, Record<string, TaskRecord>>>(() =>
    cloneTasksMap(INITIAL_TASKS_BY_DEPT)
  );
  const [detailTask, setDetailTask] = useState<(TaskRecord & { key: string; deptKey: string }) | null>(null);
  const [listScope, setListScope] = useState<ListScope | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!blockKeyParam) {
      setListScope(null);
      setDetailTask(null);
      return;
    }
    const block = ORG_BLOCKS.find(b => b.key === blockKeyParam);
    if (!block) {
      setListScope(null);
      setDetailTask(null);
      return;
    }
    if (deptKeyParam) {
      const dept = block.depts.find(d => d.key === deptKeyParam);
      if (dept) {
        setListScope({ kind: 'dept', deptKey: deptKeyParam });
      } else {
        setListScope({ kind: 'block', blockKey: blockKeyParam });
      }
    } else {
      setListScope({ kind: 'block', blockKey: blockKeyParam });
    }
    setDetailTask(null);
  }, [blockKeyParam, deptKeyParam]);

  const collectRowsForScope = useCallback(
    (scope: ListScope): TableRow[] => {
      const rows: TableRow[] = [];
      if (scope.kind === 'dept') {
        const meta = findDeptMeta(scope.deptKey);
        const bucket = tasksByDept[scope.deptKey] ?? {};
        const label = meta?.deptName ?? scope.deptKey;
        Object.entries(bucket).forEach(([taskKey, t]) => {
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            deadline: t.ycXong,
            deptKey: scope.deptKey,
          });
        });
        rows.sort((a, b) => a.stt - b.stt);
        return rows;
      }
      const block = ORG_BLOCKS.find(b => b.key === scope.blockKey);
      if (!block) return rows;
      block.depts.forEach(dept => {
        const meta = findDeptMeta(dept.key);
        const label = meta?.deptName ?? dept.name;
        const bucket = tasksByDept[dept.key] ?? {};
        Object.entries(bucket).forEach(([taskKey, t]) => {
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            deadline: t.ycXong,
            deptKey: dept.key,
          });
        });
      });
      rows.sort((a, b) => a.stt - b.stt || a.phongBan.localeCompare(b.phongBan));
      return rows;
    },
    [tasksByDept]
  );

  const tableRows = useMemo(
    () => (listScope ? collectRowsForScope(listScope) : []),
    [listScope, collectRowsForScope]
  );

  const listTitle = useMemo(() => {
    if (!listScope) return '';
    if (listScope.kind === 'dept') {
      const m = findDeptMeta(listScope.deptKey);
      if (!m) return listScope.deptKey;
      const bi = ORG_BLOCKS.findIndex(b => b.depts.some(d => d.key === listScope.deptKey));
      if (bi < 0) return `${m.deptIndex}. ${m.deptName}`;
      return `${ROMAN[bi]}. ${ORG_BLOCKS[bi].label} — ${m.deptIndex}. ${m.deptName}`;
    }
    const bi = ORG_BLOCKS.findIndex(b => b.key === listScope.blockKey);
    if (bi < 0) return listScope.blockKey;
    return `${ROMAN[bi]}. ${ORG_BLOCKS[bi].label}`;
  }, [listScope]);

  const openCreateModal = (deptKey?: string) => {
    form.resetFields();
    if (deptKey) form.setFieldsValue({ deptKey });
    setCreateOpen(true);
  };

  const handleCreateSubmit = () => {
    form
      .validateFields()
      .then(values => {
        const dk = values.deptKey as string;
        const deadline = (values.deadline as dayjs.Dayjs).format('DD/MM/YYYY');
        const today = dayjs().format('DD/MM/YYYY');
        setTasksByDept(prev => {
          const next = cloneTasksMap(prev);
          if (!next[dk]) next[dk] = {};
          const existing = Object.values(next[dk]);
          const nextStt = existing.length ? Math.max(...existing.map(t => t.stt)) + 1 : 1;
          const taskKey = `custom-${Date.now()}`;
          next[dk][taskKey] = {
            stt: nextStt,
            kyBaoCao: 'Tháng',
            congViec: values.congViec as string,
            nguoiGiao: values.nguoiPhuTrach as string,
            ngayGiao: today,
            ycXong: deadline,
            giaHan1: '',
            giaHan2: '',
            giaHan3: '',
            ketQua: '',
            linkKQ: '#',
            tienDo: 'Chưa bắt đầu',
            vuongMac: '',
            canLD: 'Không',
            anhHuong: Number(values.anhHuong),
          };
          return next;
        });
        message.success('Đã tạo công việc mới');
        setCreateOpen(false);
        form.resetFields();
      })
      .catch(() => {});
  };

  const openDetail = (taskKey: string, deptKey: string) => {
    const t = tasksByDept[deptKey]?.[taskKey];
    if (!t) return;
    setDetailTask({ ...t, key: taskKey, deptKey });
    setListScope(null);
  };

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
  };

  const tableColumns: ColumnsType<TableRow> = [
    {
      title: <span className="uppercase tracking-wide text-[11px]">STT</span>,
      dataIndex: 'stt',
      key: 'stt',
      width: 64,
      align: 'center',
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">PHÒNG BAN</span>,
      dataIndex: 'phongBan',
      key: 'phongBan',
      ellipsis: true,
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">CÔNG VIỆC</span>,
      dataIndex: 'congViec',
      key: 'congViec',
      ellipsis: true,
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">NGƯỜI PHỤ TRÁCH</span>,
      dataIndex: 'nguoiPhuTrach',
      key: 'nguoiPhuTrach',
      width: 140,
      ellipsis: true,
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">DEADLINE</span>,
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (d: string) => (
        <span
          className={
            dayjs(d, 'DD/MM/YYYY').isValid() && dayjs(d, 'DD/MM/YYYY').isBefore(dayjs(), 'day')
              ? 'text-red-500 font-medium'
              : ''
          }
        >
          {d}
        </span>
      ),
    },
  ];

  const selected = detailTask;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">
      {/* ── TOP BAR ── */}
      <div className="bg-white px-4 md:px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 flex-shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button type="primary" icon={<PlusOutlined />} className="bg-[#1E386B]" onClick={() => openCreateModal()}>
            Tạo công việc mới
          </Button>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Text strong className="text-gray-600 text-sm hidden md:inline">
            Chọn tuần:
          </Text>
          <Select
            showSearch
            value={selectedWeek}
            onChange={handleWeekChange}
            options={WEEK_OPTIONS}
            placeholder="Chọn tuần"
            size="middle"
            className="w-full md:w-64"
          />
        </div>
      </div>

      <Modal
        title="Tạo công việc mới"
        open={createOpen}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="deptKey" label="Phòng ban" rules={[{ required: true, message: 'Chọn phòng ban' }]}>
            <Select showSearch optionFilterProp="label" options={DEPT_OPTIONS} placeholder="Chọn phòng ban" />
          </Form.Item>
          <Form.Item name="congViec" label="Công việc" rules={[{ required: true, message: 'Nhập tên công việc' }]}>
            <Input placeholder="Nội dung công việc" />
          </Form.Item>
          <Form.Item
            name="nguoiPhuTrach"
            label="Người phụ trách"
            rules={[{ required: true, message: 'Nhập người phụ trách' }]}
          >
            <Input placeholder="Họ tên" />
          </Form.Item>
          <Form.Item
            name="anhHuong"
            label="Mức độ ảnh hưởng"
            initialValue={2}
            rules={[{ required: true, message: 'Chọn mức độ ảnh hưởng' }]}
          >
            <Select
              options={[
                { value: 1, label: 'Mức 1 - Thấp' },
                { value: 2, label: 'Mức 2 - Trung bình' },
                { value: 3, label: 'Mức 3 - Cao' },
                { value: 4, label: 'Mức 4 - Rất cao' },
              ]}
              placeholder="Chọn mức độ ảnh hưởng"
            />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline" rules={[{ required: true, message: 'Chọn deadline' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {listScope && !detailTask ? (
            <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-5">
              <div className="bg-[#1E386B] text-white px-4 py-3 rounded-t-lg flex-shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-white/70 m-0 mb-1">Danh sách công việc</p>
                <h2 className="m-0 text-base font-bold uppercase leading-snug">{listTitle}</h2>
              </div>
              <div className="flex-1 overflow-auto bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm p-2 md:p-4">
                <div className="hidden md:block">
                  <Table<TableRow>
                    rowKey="key"
                    columns={tableColumns}
                    dataSource={tableRows}
                    pagination={false}
                    size="small"
                    scroll={{ x: 720 }}
                    locale={{ emptyText: 'Chưa có công việc' }}
                    onRow={record => ({
                      onClick: () => openDetail(record.key, record.deptKey),
                      className: 'cursor-pointer hover:bg-blue-50/50',
                    })}
                  />
                </div>
                <div className="block md:hidden space-y-2">
                  {tableRows.length === 0 ? (
                    <div className="text-center text-gray-400 py-6">Chưa có công việc</div>
                  ) : (
                    tableRows.map(row => (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => openDetail(row.key, row.deptKey)}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 shadow-sm active:scale-[0.99] transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-800 text-sm leading-snug">{row.congViec}</p>
                          <span className="text-[11px] text-gray-500">#{row.stt}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>Phòng ban: <span className="font-medium">{row.phongBan}</span></p>
                          <p>Phụ trách: <span className="font-medium">{row.nguoiPhuTrach}</span></p>
                          <p className={dayjs(row.deadline, 'DD/MM/YYYY').isValid() && dayjs(row.deadline, 'DD/MM/YYYY').isBefore(dayjs(), 'day') ? 'text-red-500 font-medium' : ''}>
                            Deadline: {row.deadline}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="bg-[#1E386B] px-4 md:px-6 py-3 md:py-4 flex-shrink-0 shadow">
                <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 tracking-wide uppercase">Chi tiết công việc</p>
                <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">
                  {selected.congViec}
                </h2>
              </div>

              <div className="flex-1 overflow-auto p-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-[#F38320] text-white text-center font-bold py-2 text-xs tracking-widest rounded-t-xl uppercase">
                    Thông tin công việc
                  </div>

                  <div className="hidden md:block px-5 divide-y divide-gray-100">
                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Thông tin giao việc</p>
                      <InfoRow icon={<span className="text-xs font-bold text-gray-400">#</span>} label="STT">
                        <span className="font-semibold text-[#1E386B]">{selected.stt}</span>
                      </InfoRow>
                      <InfoRow icon={<CheckSquareOutlined />} label="Công việc">
                        <span className="font-medium text-gray-800">{selected.congViec}</span>
                      </InfoRow>
                      <InfoRow icon={<UserOutlined />} label="Người phụ trách">
                        <span className="font-medium text-gray-800">{selected.nguoiGiao}</span>
                      </InfoRow>
                      <InfoRow icon={<CalendarOutlined />} label="Ngày giao">
                        <span className="text-gray-700">{selected.ngayGiao}</span>
                      </InfoRow>
                      <InfoRow icon={<ClockCircleOutlined />} label="Y/C xong">
                        <span
                          className={
                            dayjs(selected.ycXong, 'DD/MM/YYYY').isBefore(dayjs(), 'day')
                              ? 'text-red-500 font-medium'
                              : 'text-gray-700 font-medium'
                          }
                        >
                          {selected.ycXong}
                        </span>
                      </InfoRow>
                    </div>

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Gia hạn</p>
                      <div className="flex items-center gap-2 flex-wrap py-1">
                        {selected.giaHan1 && <Tag color="orange">Lần 1 · {selected.giaHan1}</Tag>}
                        {selected.giaHan2 && (
                          <Tag color="red" style={{ opacity: 0.75 }}>
                            Lần 2 · {selected.giaHan2}
                          </Tag>
                        )}
                        {selected.giaHan3 && (
                          <Tag color="red" style={{ fontWeight: 600 }}>
                            Lần 3 · {selected.giaHan3}
                          </Tag>
                        )}
                        {!selected.giaHan1 && <span className="text-gray-400 text-sm">Chưa gia hạn</span>}
                      </div>
                    </div>

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Kết quả & tiến độ</p>
                      <InfoRow icon={<CheckSquareOutlined />} label="Kết quả">
                        <span className="text-gray-700 font-medium">{selected.ketQua}</span>
                      </InfoRow>
                      <InfoRow icon={<ThunderboltOutlined />} label="Tiến độ">
                        <Tag color={(STATUS_CFG[selected.tienDo] ?? { color: 'default' }).color}>{selected.tienDo}</Tag>
                      </InfoRow>
                      <InfoRow icon={<LinkOutlined />} label="Link KQ">
                        <a
                          href={selected.linkKQ}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1 text-sm"
                        >
                          <LinkOutlined /> Mở link
                        </a>
                      </InfoRow>
                      <InfoRow icon={<span className="text-amber-400">★</span>} label="Mức ảnh hưởng">
                        {renderStars(selected.anhHuong)}
                      </InfoRow>
                    </div>

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Vấn đề</p>
                      <InfoRow icon={<WarningOutlined />} label="Vướng mắc">
                        <span className="text-gray-700 font-medium">{selected.vuongMac || '—'}</span>
                      </InfoRow>
                      <InfoRow icon={<ThunderboltOutlined />} label="Cần LĐ tác động">
                        {selected.canLD === 'Không' ? (
                          <span className="text-gray-400">Không</span>
                        ) : (
                          <Tag color="error">Có</Tag>
                        )}
                      </InfoRow>
                    </div>
                  </div>

                  <div className="block md:hidden p-3 bg-gray-50 rounded-b-xl border-t border-gray-200 min-h-[300px]">
                    {(() => {
                      const borderColorMap: Record<string, string> = {
                        'Hoàn thành': 'bg-green-500',
                        'Đang làm': 'bg-blue-500',
                        'Quá hạn': 'bg-red-500',
                        'Chưa bắt đầu': 'bg-gray-400',
                      };
                      const leftColorClass = borderColorMap[selected.tienDo] || 'bg-gray-400';
                      const finalDateStr = selected.giaHan3 || selected.giaHan2 || selected.giaHan1 || selected.ycXong;
                      const isTaskOverdue =
                        dayjs(finalDateStr, 'DD/MM/YYYY').isValid() &&
                        dayjs().isAfter(dayjs(finalDateStr, 'DD/MM/YYYY'), 'day') &&
                        selected.tienDo !== 'Hoàn thành';

                      const timelineArr: { type: string; text: string }[] = [];
                      if (selected.ycXong) timelineArr.push({ type: 'goc', text: selected.ycXong.slice(0, 5) });
                      if (selected.giaHan1) timelineArr.push({ type: 'l1', text: selected.giaHan1.slice(0, 5) });
                      if (selected.giaHan2) timelineArr.push({ type: 'l2', text: selected.giaHan2.slice(0, 5) });
                      if (selected.giaHan3) timelineArr.push({ type: 'l3', text: selected.giaHan3.slice(0, 5) });

                      return (
                        <div className="relative bg-white border border-gray-200 rounded-lg p-2 shadow-sm mb-2 overflow-hidden flex flex-col transition-all">
                          <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${leftColorClass}`} />

                          <div className="pl-3">
                            <div className="flex flex-row justify-between items-center mb-2">
                              <Tag
                                color={(STATUS_CFG[selected.tienDo] ?? { color: 'default' }).color}
                                className="m-0 text-[11px] font-bold border-none uppercase tracking-tight"
                              >
                                {selected.tienDo}
                              </Tag>
                              <div className="flex items-center bg-orange-50/50 px-1.5 py-0.5 rounded-full border border-orange-100">
                                {renderStars(selected.anhHuong)}
                              </div>
                            </div>

                            <div className="bg-gray-100/80 border border-gray-100 rounded flex flex-wrap items-center gap-1.5 py-1.5 px-2 mt-1 -mx-1">
                              <CalendarOutlined className="text-gray-400 text-[11px]" />
                              {timelineArr.map((item, idx) => {
                                const isLast = idx === timelineArr.length - 1;
                                let textClass = 'text-gray-600';
                                if (item.type === 'l1' || item.type === 'l2') textClass = 'text-orange-500 font-medium';
                                if (item.type === 'l3') textClass = 'text-red-600 font-bold';
                                if (isLast && isTaskOverdue) textClass = 'text-red-600 font-bold';
                                return (
                                  <React.Fragment key={idx}>
                                    {idx > 0 && <span className="text-gray-300 text-[10px]">&rarr;</span>}
                                    <span className={`text-[12px] tracking-tight ${textClass}`}>{item.text}</span>
                                    {isLast && isTaskOverdue && (
                                      <span className="text-[11px] ml-0.5 leading-none" title="Quá hạn">
                                        ⚠️
                                      </span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {(selected.ketQua || selected.vuongMac) && (
                            <div className="mt-2 pl-3 pt-2 border-t border-dashed border-gray-200 space-y-1">
                              {selected.ketQua && (
                                <div className="text-[12px] text-gray-700 leading-tight">
                                  <span className="font-bold text-gray-500">Kết Quả: </span>
                                  {selected.ketQua}
                                </div>
                              )}
                              {selected.vuongMac && (
                                <div className="text-[12px] text-red-600 leading-tight">
                                  <span className="font-bold text-red-400">Vướng Mắc: </span>
                                  {selected.vuongMac}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 md:gap-3 p-6 text-center">
              <CheckSquareOutlined className="text-4xl md:text-6xl text-gray-200" />
              <Text type="secondary" className="text-sm md:text-base max-w-md">
                <span className="md:hidden">Chọn mục trong menu bên trái để xem danh sách công việc, hoặc chọn một công việc để xem chi tiết.</span>
                <span className="hidden md:inline">
                  Chọn khối hoặc phòng ban ở sidebar để xem bảng công việc (STT, Phòng ban, Công việc, Người phụ trách, Deadline), hoặc chọn một công việc để xem chi tiết.
                </span>
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskView;

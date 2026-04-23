import React, { useCallback, useMemo, useState } from 'react';
import {
  Tree,
  Typography,
  Tag,
  Dropdown,
  message,
  Select,
  Drawer,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
} from 'antd';
import type { TreeProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FolderOutlined,
  CheckSquareOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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

const INITIAL_TASKS_BY_DEPT: Record<string, Record<string, TaskRecord>> = {
  'sx-nm-wilson': {
    'nm-3': {
      stt: 1,
      kyBaoCao: 'Tháng',
      congViec: 'Bảo trì máy nghiền gỗ',
      nguoiGiao: 'Chú Hải',
      ngayGiao: '01/04/2026',
      ycXong: '10/04/2026',
      giaHan1: '15/04/2026',
      giaHan2: '18/04/2026',
      giaHan3: '22/04/2026',
      ketQua: 'Đã hoàn thiện phần cơ khí',
      linkKQ: 'https://docs.google.com/bao-tri',
      tienDo: 'Quá hạn',
      vuongMac: 'Đội bảo trì đang rút đi sửa chữa gấp chỗ khác',
      canLD: 'Có',
      anhHuong: 4,
    },
    'nm-4': {
      stt: 2,
      kyBaoCao: 'Tháng',
      congViec: 'Lên kế hoạch sản xuất tháng 5',
      nguoiGiao: 'Anh Tuyển',
      ngayGiao: '14/04/2026',
      ycXong: '28/04/2026',
      giaHan1: '29/04/2026',
      giaHan2: '30/04/2026',
      giaHan3: '02/05/2026',
      ketQua: 'Đang lên danh sách nguyên vật liệu',
      linkKQ: 'https://docs.google.com/kh-t5',
      tienDo: 'Đang làm',
      vuongMac: 'Phòng kinh doanh gửi số liệu chậm',
      canLD: 'Không',
      anhHuong: 3,
    },
    'nm-5': {
      stt: 3,
      kyBaoCao: 'Quý',
      congViec: 'Cập nhật định mức',
      nguoiGiao: 'Anh Hòa',
      ngayGiao: '07/04/2026',
      ycXong: '30/04/2026',
      giaHan1: '02/05/2026',
      giaHan2: '04/05/2026',
      giaHan3: '06/05/2026',
      ketQua: 'Đang đối soát lại giá',
      linkKQ: 'https://docs.google.com/dinh-muc',
      tienDo: 'Đang làm',
      vuongMac: 'Nhà cung cấp chưa chốt giá nguyên liệu',
      canLD: 'Không',
      anhHuong: 2,
    },
  },
  'sx-kd-oem': {
    'oem-1': {
      stt: 1,
      kyBaoCao: 'Tháng',
      congViec: 'Ký hợp đồng OEM',
      nguoiGiao: 'Chị Mai',
      ngayGiao: '07/04/2026',
      ycXong: '30/04/2026',
      giaHan1: '05/05/2026',
      giaHan2: '08/05/2026',
      giaHan3: '12/05/2026',
      ketQua: 'Đang chốt điều khoản pháp lý',
      linkKQ: 'https://docs.google.com/oem1',
      tienDo: 'Đang làm',
      vuongMac: 'Đối tác muốn tăng hạn mức tín dụng',
      canLD: 'Có',
      anhHuong: 4,
    },
    'oem-3': {
      stt: 2,
      kyBaoCao: 'Quý',
      congViec: 'Đánh giá & hạn mức OEM Q2',
      nguoiGiao: 'Chị Mai',
      ngayGiao: '01/04/2026',
      ycXong: '10/05/2026',
      giaHan1: '',
      giaHan2: '',
      giaHan3: '',
      ketQua: 'Đang tổng hợp dữ liệu',
      linkKQ: 'https://docs.google.com/oem3',
      tienDo: 'Chưa bắt đầu',
      vuongMac: 'Chờ số liệu từ kế toán',
      canLD: 'Không',
      anhHuong: 3,
    },
  },
  'tm-kd-go': {
    'tm-1': {
      stt: 1,
      kyBaoCao: 'Tháng',
      congViec: 'Duyệt KPI kinh doanh Q2',
      nguoiGiao: 'Mrs Thao',
      ngayGiao: '14/04/2026',
      ycXong: '25/04/2026',
      giaHan1: '28/04/2026',
      giaHan2: '30/04/2026',
      giaHan3: '02/05/2026',
      ketQua: 'Đang soạn văn bản',
      linkKQ: 'https://docs.google.com/tm1',
      tienDo: 'Chưa bắt đầu',
      vuongMac: 'Sếp chưa phê duyệt lại chỉ tiêu',
      canLD: 'Không',
      anhHuong: 3,
    },
  },
  'tm-ke-toan': {
    'tm-3': {
      stt: 1,
      kyBaoCao: 'Quý',
      congViec: 'Báo cáo doanh thu Q1',
      nguoiGiao: 'Mrs Thao',
      ngayGiao: '01/04/2026',
      ycXong: '10/04/2026',
      giaHan1: '12/04/2026',
      giaHan2: '',
      giaHan3: '',
      ketQua: 'Tổng doanh thu đạt 98% KPI',
      linkKQ: 'https://docs.google.com/tm3',
      tienDo: 'Hoàn thành',
      vuongMac: '',
      canLD: 'Không',
      anhHuong: 3,
    },
    'kt-1': {
      stt: 2,
      kyBaoCao: 'Tháng',
      congViec: 'Báo cáo công nợ tháng 4',
      nguoiGiao: 'Chị Lan',
      ngayGiao: '01/04/2026',
      ycXong: '05/04/2026',
      giaHan1: '06/04/2026',
      giaHan2: '07/04/2026',
      giaHan3: '08/04/2026',
      ketQua: 'Tổng công nợ 4.2 tỷ',
      linkKQ: 'https://docs.google.com/kt1',
      tienDo: 'Hoàn thành',
      vuongMac: 'Kế toán viên nghỉ ốm 1 tuần',
      canLD: 'Không',
      anhHuong: 3,
    },
    'kt-3': {
      stt: 3,
      kyBaoCao: 'Quý',
      congViec: 'Quyết toán thuế Q1',
      nguoiGiao: 'Chị Lan',
      ngayGiao: '01/04/2026',
      ycXong: '30/04/2026',
      giaHan1: '05/05/2026',
      giaHan2: '',
      giaHan3: '',
      ketQua: 'Đang tổng hợp chứng từ',
      linkKQ: 'https://docs.google.com/kt3',
      tienDo: 'Đang làm',
      vuongMac: 'Thiếu hóa đơn từ một số nhà cung cấp',
      canLD: 'Không',
      anhHuong: 3,
    },
  },
  'tm-du-an': {
    'da-2': {
      stt: 1,
      kyBaoCao: 'Tháng',
      congViec: 'Lập dự toán ngân sách dự án',
      nguoiGiao: 'Chị Lan',
      ngayGiao: '01/04/2026',
      ycXong: '30/04/2026',
      giaHan1: '05/05/2026',
      giaHan2: '',
      giaHan3: '',
      ketQua: 'Đang thu thập báo giá',
      linkKQ: 'https://docs.google.com/da2',
      tienDo: 'Đang làm',
      vuongMac: 'Nhà thầu chậm gửi báo giá',
      canLD: 'Có',
      anhHuong: 4,
    },
  },
};

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
  const [tasksByDept, setTasksByDept] = useState<Record<string, Record<string, TaskRecord>>>(() =>
    cloneTasksMap(INITIAL_TASKS_BY_DEPT)
  );
  const [detailTask, setDetailTask] = useState<(TaskRecord & { key: string; deptKey: string }) | null>(null);
  const [listScope, setListScope] = useState<ListScope | null>(null);
  const [treeSelectedKeys, setTreeSelectedKeys] = useState<React.Key[]>([]);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const baseTree = useMemo(() => buildTreeData(tasksByDept), [tasksByDept]);

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
    setTreeSelectedKeys([taskKey]);
    setDrawerOpen(false);
  };

  const onSelect: TreeProps['onSelect'] = (keys, info) => {
    const node = info.node as any;
    if (node.isLeaf && node.deptKey) {
      openDetail(node.key as string, node.deptKey as string);
      return;
    }
    if (node.isDept && node.deptKey) {
      setDetailTask(null);
      setListScope({ kind: 'dept', deptKey: node.deptKey });
      setTreeSelectedKeys(keys);
      setDrawerOpen(false);
      return;
    }
    if (node.isBlock && node.blockKey) {
      setDetailTask(null);
      setListScope({ kind: 'block', blockKey: node.blockKey });
      setTreeSelectedKeys(keys);
      setDrawerOpen(false);
    }
  };

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
    if (window.innerWidth < 768) {
      setDrawerOpen(true);
    }
  };

  const renderTitle = (nodeData: TreeNodeBase, onCtxAdd?: () => void) => {
    const menuItems =
      nodeData.isLeaf
        ? [
            { key: 'edit', label: 'Đổi tên', icon: <EditOutlined /> },
            { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
          ]
        : [
            { key: 'add', label: 'Thêm công việc', icon: <PlusOutlined /> },
            { key: 'edit', label: 'Đổi tên', icon: <EditOutlined /> },
            { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
          ];

    return (
      <Dropdown
        menu={{
          items: menuItems,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'add') {
              onCtxAdd?.();
              return;
            }
            message.info(`${key}: ${nodeData.displayTitle}`);
          },
        }}
        trigger={['contextMenu']}
      >
        <div className="flex items-center gap-1.5 py-0.5 w-full min-w-0">
          {nodeData.isLeaf ? (
            <CheckSquareOutlined className="text-gray-400 text-xs flex-shrink-0" />
          ) : nodeData.isBlock ? (
            <FolderOutlined className={`${nodeData.titleClass} flex-shrink-0`} />
          ) : (
            <FolderOutlined className="text-[#F38320] flex-shrink-0 text-sm" />
          )}
          <span
            className={
              nodeData.isLeaf
                ? 'text-gray-800 text-sm leading-snug flex-1 truncate'
                : nodeData.isBlock
                  ? `font-bold uppercase text-[11px] md:text-xs tracking-wide leading-snug flex-1 ${nodeData.titleClass}`
                  : `font-semibold uppercase text-[10px] md:text-[11px] tracking-wide leading-snug flex-1 ${nodeData.deptTitleClass}`
            }
          >
            {nodeData.displayTitle}
          </span>
        </div>
      </Dropdown>
    );
  };

  const loopTree = (data: TreeNodeBase[]): any[] =>
    data.map(item => {
      const ctxAdd = () => {
        if (item.isDept && item.deptKey) openCreateModal(item.deptKey);
        else if (item.isBlock) openCreateModal(undefined);
      };
      return {
        ...item,
        title: renderTitle(item, item.isLeaf ? undefined : ctxAdd),
        children: item.children ? loopTree(item.children) : undefined,
      };
    });

  const treeData = loopTree(baseTree);

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

      {/* ── MOBILE: NÚT MỞ DRAWER ── */}
      <div className="md:hidden bg-white px-4 py-2 border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-[#1E386B] py-2.5 rounded-lg font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          Danh sách công việc
        </button>
      </div>

      <Drawer
        title={<span className="font-bold text-[#1E386B]">Danh mục công việc</span>}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ body: { padding: '12px 8px' } }}
        width={300}
        destroyOnClose
      >
        <Tree
          blockNode
          defaultExpandAll
          onSelect={onSelect}
          treeData={treeData}
          selectedKeys={treeSelectedKeys}
          className="bg-transparent"
        />
      </Drawer>

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
        <div className="hidden md:flex w-56 lg:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex-col shadow-md transition-all">
          <div className="px-4 py-3 bg-[#1E386B]">
            <h2 className="m-0 text-white font-bold text-sm tracking-wide flex items-center gap-2">
              <FolderOutlined /> Danh mục công việc
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-2 md:p-3">
            <Tree
              blockNode
              defaultExpandAll
              onSelect={onSelect}
              treeData={treeData}
              selectedKeys={treeSelectedKeys}
              className="bg-transparent"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {listScope && !detailTask ? (
            <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-5">
              <div className="bg-[#1E386B] text-white px-4 py-3 rounded-t-lg flex-shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-white/70 m-0 mb-1">Danh sách công việc</p>
                <h2 className="m-0 text-base font-bold uppercase leading-snug">{listTitle}</h2>
              </div>
              <div className="flex-1 overflow-auto bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm p-2 md:p-4">
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
                <span className="md:hidden">Chọn khối / phòng ban trên cây để xem danh sách, hoặc chọn một công việc để xem chi tiết.</span>
                <span className="hidden md:inline">
                  Chọn khối hoặc phòng ban trên cây bên trái để xem bảng công việc (STT, Phòng ban, Công việc, Người phụ trách, Deadline), hoặc chọn một công việc để xem chi tiết.
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

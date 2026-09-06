import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  App as AntdApp,
  Typography,
  Tag,
  Select,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckSquareOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  CloseOutlined,
  FolderOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';
import BackButton from '../components/BackButton';
import TaskActionMenu from '../components/TaskActionMenu';
import TaskCompleteTick from '../components/TaskCompleteTick';
import TaskProgressBar, { clampProgressPercent } from '../components/TaskProgressBar';
import MobileTaskDetailBody from '../components/MobileTaskDetailBody';
import './TaskView.css';
import './TaskView.mobile-detail.css';
import { ORG_BLOCKS } from '../data/orgBlocks';
import type { TaskRecord } from '../types/task';
import {
  formatTaskDate,
  getEffectiveDueDate,
  isTaskOverduePastExtensions,
  normalizeDisplayDate,
  parseTaskDate,
  type TaskDueDatesInput,
  calculateAutomaticStatus,
} from '../utils/taskDate';
import { addDataRow, deleteDataRow, editDataRow, findDataRows } from '../services/dataApi';
import { invalidateDashboardTasksCache } from '../services/dashboardData';
import {
  loadPersonnelSelectOptions,
  mergePersonnelOption,
  mergePersonnelOptions,
  type PersonnelSelectOption,
} from '../services/auxiliaryData';
import PersonnelMultiSelect from '../components/PersonnelMultiSelect';
import TaskDocLinksField from '../components/TaskDocLinksField';
import { useHeaderToolbar } from '../contexts/HeaderToolbarContext';
import {
  buildCompleteTaskRow,
  hasRowKey,
  hydrateSourceRowKey,
  mergeTaskCompletion,
  buildTaskDeleteRow,
  buildTaskEditRow,
  buildTaskRow,
  buildTienDoEditRow,
  isTaskRecordCompleted,
  mapRowsToTasksByDept,
  normalizeTaiLieuLinks,
  normalizeTienDoForForm,
  primaryTaiLieuLink,
  resolveTaskTableName,
  resolveTaskTableNameFromDeptKey,
  TIEN_DO_EDIT_OPTIONS,
} from '../services/taskData';
import { TASK_COMPLETED_STATUS_LABEL } from '../utils/taskDate';

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

const DEPT_OPTIONS = flattenDeptOptions();

function createEmptyTasksByDept(): Record<string, Record<string, TaskRecord>> {
  return {};
}

function cloneTasksMap(src: Record<string, Record<string, TaskRecord>>) {
  return structuredClone(src) as Record<string, Record<string, TaskRecord>>;
}

function mergeTasksMaps(
  ...maps: Array<Record<string, Record<string, TaskRecord>>>
): Record<string, Record<string, TaskRecord>> {
  const out: Record<string, Record<string, TaskRecord>> = {};
  for (const map of maps) {
    for (const [deptKey, bucket] of Object.entries(map)) {
      out[deptKey] = { ...(out[deptKey] ?? {}), ...bucket };
    }
  }
  return out;
}

function listTablesForBlock(blockKey: string): string[] {
  const block = ORG_BLOCKS.find(b => b.key === blockKey);
  if (!block) return [];
  return block.depts
    .map(dept => resolveTaskTableNameFromDeptKey(dept.key))
    .filter((table): table is string => Boolean(table));
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
  [TASK_COMPLETED_STATUS_LABEL]: { color: 'success' },
  'Đang thực hiện': { color: 'processing' },
  'Đang làm': { color: 'processing' },
  'Quá hạn': { color: 'error' },
  'Chưa bắt đầu': { color: 'default' },
  Hủy: { color: 'default' },
  'Tạm dừng': { color: 'warning' },
};

const TIEN_DO_OPTIONS = [...TIEN_DO_EDIT_OPTIONS];

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
  ngayGiao: string;
  deadline: string;
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  tienDo: string;
  tienDoPhanTram: number;
  trangThai: string;
  ngayHoanThanh: string;
  deptKey: string;
  sourceRow?: Record<string, unknown>;
};

const LIST_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'chua_bat_dau', label: 'Chưa bắt đầu' },
  { value: 'dang_lam', label: 'Đang làm' },
  { value: 'qua_han', label: 'Quá hạn' },
  { value: 'hoan_thanh', label: 'Hoàn thành' },
  { value: 'ext_1', label: 'Hoàn thành gia hạn 1' },
  { value: 'ext_2', label: 'Hoàn thành gia hạn 2' },
  { value: 'ext_3', label: 'Hoàn thành gia hạn 3' },
];

function matchListStatusFilter(tienDo: string, filter: string): boolean {
  if (filter === 'all') return true;
  const raw = (tienDo || '').trim();
  const lower = raw.toLowerCase();
  if (filter === 'chua_bat_dau') return lower.includes('chưa bắt đầu') || lower === 'chua bat dau';
  if (filter === 'dang_lam') {
    return raw === 'Đang làm' || lower.includes('đang làm') || lower.includes('đang thực hiện');
  }
  if (filter === 'qua_han') return raw === 'Quá hạn' || lower.includes('quá hạn');
  if (filter === 'hoan_thanh') {
    return lower.includes('hoàn thành') && !lower.includes('gia hạn');
  }
  if (filter === 'ext_1') return lower.includes('gia hạn 1');
  if (filter === 'ext_2') return lower.includes('gia hạn 2');
  if (filter === 'ext_3') return lower.includes('gia hạn 3');
  return true;
}

function matchNgayGiaoRange(
  ngayGiao: string,
  range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
): boolean {
  if (!range || (!range[0] && !range[1])) return true;
  const parsed = parseTaskDate(ngayGiao);
  if (!parsed) return false;
  const day = parsed.startOf('day');
  if (range[0] && day.isBefore(range[0].startOf('day'))) return false;
  if (range[1] && day.isAfter(range[1].startOf('day'))) return false;
  return true;
}

function renderCompletionDateCell(value: string) {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed === '—') {
    return <span className="text-gray-300">—</span>;
  }

  const displayDate = normalizeDisplayDate(trimmed) || trimmed.split(/\s+/)[0];
  const full = trimmed.includes(':') ? trimmed : displayDate;

  return (
    <span className="whitespace-nowrap text-[11px] text-green-700 font-semibold" title={full}>
      {displayDate}
    </span>
  );
}

function taskDueContext(
  row: Pick<TableRow, 'deadline' | 'giaHan1' | 'giaHan2' | 'giaHan3' | 'tienDo' | 'trangThai'>
): TaskDueDatesInput {
  return {
    deadline: row.deadline,
    giaHan1: row.giaHan1,
    giaHan2: row.giaHan2,
    giaHan3: row.giaHan3,
    tienDo: row.tienDo,
    trangThai: row.trangThai,
  };
}

function renderDateCell(value: string, row: TableRow) {
  const display = normalizeDisplayDate(value) || '—';
  const parsed = parseTaskDate(value);
  const overdue = isTaskOverduePastExtensions(taskDueContext(row));
  const effectiveDue = getEffectiveDueDate(taskDueContext(row));
  const isEffectiveColumn =
    overdue && parsed && effectiveDue ? effectiveDue.isSame(parsed, 'day') : false;
  const isPast = parsed ? dayjs().startOf('day').isAfter(parsed.startOf('day')) : false;

  let className = '';
  if (isEffectiveColumn) {
    className = 'task-overdue-blink font-bold';
  } else if (isPast) {
    className = 'text-red-500 font-medium';
  }

  return <span className={className}>{display}</span>;
}

function renderMobileDateLine(label: string, value: string, row: TableRow) {
  const displayValue = normalizeDisplayDate(value) || value || '—';
  const parsed = parseTaskDate(displayValue);
  const overdue = isTaskOverduePastExtensions(taskDueContext(row));
  const effectiveDue = getEffectiveDueDate(taskDueContext(row));
  const isEffectiveColumn =
    overdue && parsed && effectiveDue ? effectiveDue.isSame(parsed, 'day') : false;
  const isPast = parsed ? dayjs().startOf('day').isAfter(parsed.startOf('day')) : false;

  let valueClass = 'font-medium';
  if (isEffectiveColumn) {
    valueClass = 'font-bold task-overdue-blink';
  } else if (isPast) {
    valueClass = 'font-medium text-red-500';
  }

  return (
    <p className={isEffectiveColumn ? 'task-overdue-blink' : ''}>
      {label}: <span className={valueClass}>{displayValue}</span>
    </p>
  );
}

const TaskView: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { blockKey: blockKeyParam, deptKey: deptKeyParam } = useParams<{ blockKey?: string; deptKey?: string }>();

  const [tasksByDept, setTasksByDept] = useState<Record<string, Record<string, TaskRecord>>>(() =>
    createEmptyTasksByDept()
  );
  const [detailTask, setDetailTask] = useState<(TaskRecord & { key: string; deptKey: string }) | null>(null);
  const [listScope, setListScope] = useState<ListScope | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [tienDoModalOpen, setTienDoModalOpen] = useState(false);
  const [savingTienDo, setSavingTienDo] = useState(false);
  const [deletingTaskKey, setDeletingTaskKey] = useState<string | null>(null);
  const [completingTaskKey, setCompletingTaskKey] = useState<string | null>(null);
  const [savingTienDoKey, setSavingTienDoKey] = useState<string | null>(null);
  const [tienDoDraft, setTienDoDraft] = useState('Chưa bắt đầu');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [personnelOptions, setPersonnelOptions] = useState<PersonnelSelectOption[]>([]);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPersonnel, setFilterPersonnel] = useState<string>('all');
  const [filterNgayGiaoRange, setFilterNgayGiaoRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [listSearch, setListSearch] = useState('');
  const { setToolbar, clearToolbar } = useHeaderToolbar();

  const taskTable = useMemo(
    () =>
      resolveTaskTableName(blockKeyParam, deptKeyParam) ??
      (deptKeyParam ? resolveTaskTableNameFromDeptKey(deptKeyParam) : null),
    [blockKeyParam, deptKeyParam]
  );

  const blockTables = useMemo(() => {
    if (!blockKeyParam || deptKeyParam) return [] as string[];
    return listTablesForBlock(blockKeyParam);
  }, [blockKeyParam, deptKeyParam]);

  const loadScopeKey = taskTable ?? (blockTables.length ? `block:${blockKeyParam}` : '');

  useEffect(() => {
    let cancelled = false;
    void loadPersonnelSelectOptions()
      .then(options => {
        if (!cancelled) setPersonnelOptions(options);
      })
      .catch(() => {
        if (!cancelled) setPersonnelOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const detailAssigneeOptions = useMemo(
    () => mergePersonnelOption(personnelOptions, detailTask?.nguoiGiao),
    [personnelOptions, detailTask?.nguoiGiao]
  );

  const detailFollowerOptions = useMemo(
    () => mergePersonnelOptions(personnelOptions, detailTask?.nguoiTheoDoi),
    [personnelOptions, detailTask?.nguoiTheoDoi]
  );

  useEffect(() => {
    let cancelled = false;

    async function probeSupabase() {
      try {
        await findDataRows({ table: 'I.1' });
        if (!cancelled) {
          setSupabaseConnected(true);
        }
      } catch {
        if (!cancelled) {
          setSupabaseConnected(false);
        }
      }
    }

    void probeSupabase();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      if (!loadScopeKey) {
        setTasksByDept(createEmptyTasksByDept());
        return;
      }

      setTaskLoading(true);
      try {
        if (taskTable) {
          const result = await findDataRows({ table: taskTable });
          if (cancelled) return;
          setSupabaseConnected(true);
          setTasksByDept(cloneTasksMap(mapRowsToTasksByDept(result.rows, result.table)));
        } else {
          const results = await Promise.all(
            blockTables.map(async table => {
              const result = await findDataRows({ table });
              return mapRowsToTasksByDept(result.rows, result.table);
            })
          );
          if (cancelled) return;
          setSupabaseConnected(true);
          setTasksByDept(cloneTasksMap(mergeTasksMaps(...results)));
        }
      } catch (error) {
        if (!cancelled) {
          setSupabaseConnected(false);
          setTasksByDept(createEmptyTasksByDept());
          message.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu từ Supabase.');
        }
      } finally {
        if (!cancelled) {
          setTaskLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [loadScopeKey, taskTable, blockTables]);

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

  useEffect(() => {
    // Form chỉ mount khi có detailTask — không gọi API form khi chưa gắn
    if (!detailTask) return;

    detailForm.setFieldsValue({
      congViec: detailTask.congViec,
      nguoiGiao: detailTask.nguoiGiao,
      nguoiTheoDoi: detailTask.nguoiTheoDoi ?? [],
      ngayGiao: parseTaskDate(detailTask.ngayGiao) ?? undefined,
      ycXong: parseTaskDate(detailTask.ycXong) ?? undefined,
      giaHan1: parseTaskDate(detailTask.giaHan1) ?? undefined,
      giaHan2: parseTaskDate(detailTask.giaHan2) ?? undefined,
      giaHan3: parseTaskDate(detailTask.giaHan3) ?? undefined,
      ketQua: detailTask.ketQua,
      taiLieuLinks: detailTask.taiLieuLinks?.length
        ? detailTask.taiLieuLinks
        : detailTask.linkKQ || detailTask.tenTaiLieu
          ? [{ ten: detailTask.tenTaiLieu || '', link: detailTask.linkKQ || '' }]
          : [{ ten: '', link: '' }],
      tienDo: normalizeTienDoForForm(detailTask.tienDo),
      tienDoPhanTram: detailTask.tienDoPhanTram ?? 0,
      vuongMac: detailTask.vuongMac,
      canLD: detailTask.canLD,
      noiDungCanTacDong: detailTask.noiDungCanTacDong || '',
      anhHuong: detailTask.anhHuong,
    });
  }, [detailTask, detailForm]);

  const reloadTasks = useCallback(async () => {
    if (taskTable) {
      const result = await findDataRows({ table: taskTable });
      const mapped = mapRowsToTasksByDept(result.rows, result.table);
      setTasksByDept(cloneTasksMap(mapped));
      return mapped;
    }

    if (blockTables.length > 0) {
      const results = await Promise.all(
        blockTables.map(async table => {
          const result = await findDataRows({ table });
          return mapRowsToTasksByDept(result.rows, result.table);
        })
      );
      const mapped = mergeTasksMaps(...results);
      setTasksByDept(cloneTasksMap(mapped));
      return mapped;
    }

    return null;
  }, [taskTable, blockTables]);

  const resolveDisplayTienDo = useCallback((t: TaskRecord): string => {
    const stored = (t.tienDo || '').trim();
    // Ưu tiên giá trị đã lưu trên Supabase để sửa cột Tiến độ có hiệu lực ngay
    if (stored) {
      const normalized = stored.toLowerCase();
      if (
        stored === 'Đang làm' ||
        stored === 'Đang thực hiện' ||
        stored === 'Hoàn thành' ||
        stored === 'Quá hạn' ||
        stored === 'Hủy' ||
        stored === 'Huỷ' ||
        stored === 'Tạm dừng' ||
        stored === 'Chưa bắt đầu' ||
        normalized.includes('gia hạn')
      ) {
        if (stored === 'Đang làm') return 'Đang thực hiện';
        if (stored === 'Huỷ') return 'Hủy';
        return stored;
      }
    }

    const auto = calculateAutomaticStatus({
      deadline: t.ycXong,
      giaHan1: t.giaHan1,
      giaHan2: t.giaHan2,
      giaHan3: t.giaHan3,
      ngayHoanThanh: t.ngayGioHoanThanh,
    });
    return auto === 'Đang làm' ? 'Đang thực hiện' : auto;
  }, []);

  const collectRowsForScope = useCallback(
    (scope: ListScope): TableRow[] => {
      const rows: TableRow[] = [];
      if (scope.kind === 'dept') {
        const meta = findDeptMeta(scope.deptKey);
        const bucket: Record<string, TaskRecord> = tasksByDept[scope.deptKey] ?? {};
        const label = meta?.deptName ?? scope.deptKey;
        Object.entries(bucket).forEach(([taskKey, t]) => {
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            ngayGiao: t.ngayGiao,
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            tienDo: resolveDisplayTienDo(t),
            tienDoPhanTram: t.tienDoPhanTram ?? 0,
            trangThai: t.trangThai,
            ngayHoanThanh: t.ngayGioHoanThanh,
            deptKey: scope.deptKey,
            sourceRow: t.sourceRow,
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
        const bucket: Record<string, TaskRecord> = tasksByDept[dept.key] ?? {};
        Object.entries(bucket).forEach(([taskKey, t]) => {
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            ngayGiao: t.ngayGiao,
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            tienDo: resolveDisplayTienDo(t),
            tienDoPhanTram: t.tienDoPhanTram ?? 0,
            trangThai: t.trangThai,
            ngayHoanThanh: t.ngayGioHoanThanh,
            deptKey: dept.key,
            sourceRow: t.sourceRow,
          });
        });
      });
      rows.sort((a, b) => a.stt - b.stt || a.phongBan.localeCompare(b.phongBan));
      return rows;
    },
    [tasksByDept, resolveDisplayTienDo]
  );

  const tableRows = useMemo(
    () => (listScope ? collectRowsForScope(listScope) : []),
    [listScope, collectRowsForScope]
  );

  const personnelFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const opt of personnelOptions) {
      if (opt.value.trim()) names.add(opt.value.trim());
    }
    for (const row of tableRows) {
      const name = (row.nguoiPhuTrach || '').trim();
      if (name && name !== '—') names.add(name);
    }
    return [
      { value: 'all', label: 'Tất cả nhân sự' },
      ...Array.from(names)
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map(name => ({ value: name, label: name })),
    ];
  }, [personnelOptions, tableRows]);

  const filteredTableRows = useMemo(() => {
    return tableRows.filter(row => {
      if (!matchListStatusFilter(row.tienDo, filterStatus)) return false;
      if (!matchNgayGiaoRange(row.ngayGiao, filterNgayGiaoRange)) return false;
      if (filterPersonnel !== 'all') {
        const name = (row.nguoiPhuTrach || '').trim();
        if (name !== filterPersonnel) return false;
      }
      return true;
    });
  }, [tableRows, filterStatus, filterNgayGiaoRange, filterPersonnel]);

  const listSearchFiltered = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return filteredTableRows;
    return filteredTableRows.filter(row => (row.congViec || '').toLowerCase().includes(q));
  }, [filteredTableRows, listSearch]);

  const weekGroupLabel = (dateStr: string) => {
    const display = normalizeDisplayDate(dateStr) || dateStr;
    const parsed = parseTaskDate(display);
    if (!parsed) return 'Chưa có thời hạn';
    const monday = parsed.subtract((parsed.day() + 6) % 7, 'day').startOf('day');
    const end = monday.add(6, 'day');
    return `TUẦN ${monday.format('DD/MM')} - ${end.format('DD/MM/YY')}`;
  };

  const groupedListRows = useMemo(() => {
    const groups = new Map<string, typeof listSearchFiltered>();
    for (const row of listSearchFiltered) {
      const label = weekGroupLabel(row.deadline || row.ngayGiao);
      const bucket = groups.get(label);
      if (bucket) bucket.push(row);
      else groups.set(label, [row]);
    }
    return Array.from(groups.entries());
  }, [listSearchFiltered]);

  const hasActiveListFilters =
    filterStatus !== 'all' ||
    filterPersonnel !== 'all' ||
    Boolean(filterNgayGiaoRange?.[0] || filterNgayGiaoRange?.[1]) ||
    Boolean(listSearch.trim());

  const clearListFilters = () => {
    setFilterStatus('all');
    setFilterPersonnel('all');
    setFilterNgayGiaoRange(null);
    setListSearch('');
  };

  const listBadgeMeta = (tienDo: string) => {
    if ((tienDo || '').includes('Hoàn thành')) {
      return { cls: 'task-list-badge--done', label: 'Hoàn thành' };
    }
    if (tienDo === 'Hủy' || tienDo === 'Huỷ') {
      return { cls: 'task-list-badge--cancel', label: 'Hủy' };
    }
    if (tienDo === 'Tạm dừng') {
      return { cls: 'task-list-badge--paused', label: 'Tạm dừng' };
    }
    return { cls: 'task-list-badge--progress', label: 'Đang làm' };
  };

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
    return `TỔNG KHỐI — ${ROMAN[bi]}. ${ORG_BLOCKS[bi].label}`;
  }, [listScope]);

  const listSubtitle = listScope?.kind === 'block'
    ? 'Toàn bộ công việc các phòng ban trong khối'
    : 'Danh sách công việc';

  const openCreateModal = (deptKey?: string) => {
    const targetDeptKey =
      deptKey ??
      deptKeyParam ??
      (listScope?.kind === 'dept' ? listScope.deptKey : undefined);
    setCreateOpen(true);
    // Đợi Modal/Form mount rồi mới gắn giá trị (tránh warning useForm chưa nối Form)
    queueMicrotask(() => {
      form.resetFields();
      form.setFieldsValue({
        ...(targetDeptKey ? { deptKey: targetDeptKey } : {}),
        taiLieuLinks: [{ ten: '', link: '' }],
      });
    });
  };

  const canCreateTask = supabaseConnected === true;

  const addTaskButton = (options?: { size?: 'small' | 'middle' | 'large'; block?: boolean }) => (
    <Button
      type="primary"
      size={options?.size ?? 'middle'}
      block={options?.block}
      icon={<PlusOutlined />}
      className="bg-[#F38320] border-[#F38320] hover:!bg-[#e07518] hover:!border-[#e07518] shadow-sm font-semibold"
      disabled={!canCreateTask}
      loading={supabaseConnected === null}
      title={!canCreateTask && supabaseConnected === false ? 'Chưa kết nối Supabase' : undefined}
      onClick={() => openCreateModal()}
    >
      Thêm
    </Button>
  );

  const handleCreateSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        const dk = (deptKeyParam ?? values.deptKey) as string;
        const deadline = formatTaskDate(values.deadline);
        const giaHan1 = formatTaskDate(values.giaHan1);
        const giaHan2 = formatTaskDate(values.giaHan2);
        const giaHan3 = formatTaskDate(values.giaHan3);

        if (!deadline) {
          message.error('Chọn deadline.');
          return;
        }

        if (!dk) {
          message.error('Chọn phòng ban.');
          return;
        }

        const targetTable = taskTable ?? resolveTaskTableNameFromDeptKey(dk);
        if (!targetTable) {
          message.error('Không xác định được bảng Supabase cho phòng ban này.');
          return;
        }

        if (!supabaseConnected) {
          message.error('Chưa kết nối Supabase.');
          return;
        }

        const existing = Object.values((tasksByDept[dk] ?? {}) as Record<string, TaskRecord>);
        const nextStt = existing.length ? Math.max(...existing.map(t => t.stt)) + 1 : 1;

        setCreatingTask(true);
        try {
          await addDataRow(
            buildTaskRow({
              deptKey: dk,
              congViec: values.congViec as string,
              nguoiPhuTrach: values.nguoiPhuTrach as string,
              nguoiTheoDoi: (values.nguoiTheoDoi as string[] | undefined) ?? [],
              deadline,
              giaHan1,
              giaHan2,
              giaHan3,
              anhHuong: Number(values.anhHuong),
              stt: nextStt,
              taiLieuLinks: normalizeTaiLieuLinks(
                (values.taiLieuLinks as Array<{ ten?: string; link?: string }> | undefined) ?? []
              ),
              tienDoPhanTram: clampProgressPercent(values.tienDoPhanTram),
            }),
            targetTable
          );

          const deptMeta = findDeptMeta(dk);
          if (deptMeta && !blockKeyParam) {
            navigate(`/tasks/${deptMeta.blockKey}/${dk}`);
          } else {
            await reloadTasks();
          }

          message.success('Đã thêm công việc mới vào Supabase.');
          invalidateDashboardTasksCache();
          setCreateOpen(false);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể thêm dòng trên Supabase.');
        } finally {
          setCreatingTask(false);
        }
      })
      .catch(() => {});
  };

  const resolveActiveTable = useCallback(
    (deptKey?: string) => {
      if (taskTable) return taskTable;
      if (deptKey) return resolveTaskTableNameFromDeptKey(deptKey);
      return null;
    },
    [taskTable]
  );

  const handleDetailSave = () => {
    detailForm
      .validateFields()
      .then(async values => {
        if (!detailTask || !supabaseConnected) {
          message.error('Chưa kết nối Supabase.');
          return;
        }

        const activeTable = resolveActiveTable(detailTask.deptKey);
        if (!activeTable) {
          message.error('Không xác định được bảng Supabase.');
          return;
        }

        if (!detailTask.sourceRow) {
          message.error('Không tìm thấy khóa bản ghi (TT) để cập nhật.');
          return;
        }

        const taiLieuLinks = normalizeTaiLieuLinks(
          (values.taiLieuLinks as Array<{ ten?: string; link?: string }> | undefined) ?? []
        );
        const primaryLink = primaryTaiLieuLink(taiLieuLinks);

        const updatedTask: TaskRecord = {
          ...detailTask,
          congViec: values.congViec as string,
          nguoiGiao: values.nguoiGiao as string,
          nguoiTheoDoi: (values.nguoiTheoDoi as string[] | undefined) ?? [],
          ngayGiao: formatTaskDate(values.ngayGiao),
          ycXong: formatTaskDate(values.ycXong),
          giaHan1: formatTaskDate(values.giaHan1),
          giaHan2: formatTaskDate(values.giaHan2),
          giaHan3: formatTaskDate(values.giaHan3),
          ketQua: values.ketQua as string,
          linkKQ: primaryLink.link,
          tenTaiLieu: primaryLink.ten,
          taiLieuLinks,
          tienDo: (values.tienDo as string) || detailTask.tienDo,
          tienDoPhanTram:
            (values.tienDo as string) === 'Hoàn thành'
              ? Math.max(clampProgressPercent(values.tienDoPhanTram), 100)
              : clampProgressPercent(values.tienDoPhanTram),
          ngayGioHoanThanh:
            (values.tienDo as string) === 'Hoàn thành'
              ? detailTask.ngayGioHoanThanh || formatTaskDate(dayjs())
              : (values.tienDo as string) === 'Đang thực hiện' ||
                  (values.tienDo as string) === 'Đang làm' ||
                  (values.tienDo as string) === 'Quá hạn' ||
                  (values.tienDo as string) === 'Hủy' ||
                  (values.tienDo as string) === 'Tạm dừng'
                ? ''
                : detailTask.ngayGioHoanThanh,
          vuongMac: values.vuongMac as string,
          canLD: values.canLD as string,
          noiDungCanTacDong: (values.noiDungCanTacDong as string) || '',
          anhHuong: Number(values.anhHuong),
        };

        setSavingDetail(true);
        try {
          const sourceRow = await hydrateSourceRowKey(detailTask.sourceRow, activeTable);
          if (!hasRowKey(sourceRow, detailTask.rowKey, activeTable)) {
            message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
            return;
          }

          const editRow = buildTaskEditRow(
            { ...updatedTask, sourceRow, rowKey: detailTask.rowKey },
            sourceRow,
            activeTable
          );

          await editDataRow(editRow, activeTable);
          await reloadTasks();
          message.success('Đã cập nhật Supabase.');
          invalidateDashboardTasksCache();
          // Lưu xong tự thoát về danh sách
          setDetailTask(null);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể cập nhật Supabase.');
        } finally {
          setSavingDetail(false);
        }
      })
      .catch(() => {});
  };

  const openTienDoModal = () => {
    if (!detailTask) {
      return;
    }

    const current = normalizeTienDoForForm(detailTask.tienDo);
    const editable = TIEN_DO_EDIT_OPTIONS.some(option => option.value === current);
    setTienDoDraft(editable ? current : 'Đang thực hiện');
    setTienDoModalOpen(true);
  };

  const updateTaskTienDo = useCallback(
    async (taskKey: string, deptKey: string, tienDo: string) => {
      const activeTable = resolveActiveTable(deptKey);
      if (!activeTable || !supabaseConnected) {
        message.error('Chưa kết nối Supabase.');
        return false;
      }

      const task = tasksByDept[deptKey]?.[taskKey];
      if (!task?.sourceRow) {
        message.error('Không tìm thấy bản ghi để cập nhật.');
        return false;
      }

      const currentDisplay = resolveDisplayTienDo(task);
      if (currentDisplay === tienDo) {
        return true;
      }

      const sourceRow = await hydrateSourceRowKey(task.sourceRow, activeTable);
      if (!hasRowKey(sourceRow, task.rowKey, activeTable)) {
        message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
        return false;
      }

      let editRow: Record<string, unknown>;
      try {
        editRow = buildTienDoEditRow(tienDo, sourceRow, new Date(), task.rowKey, activeTable);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Giá trị TIẾN ĐỘ không hợp lệ.');
        return false;
      }

      // Cập nhật UI ngay để Select không bị nhảy lại giá trị cũ
      const optimisticNgay =
        tienDo === 'Hoàn thành'
          ? task.ngayGioHoanThanh || formatTaskDate(dayjs())
          : '';
      const optimisticPercent =
        tienDo === 'Hoàn thành' ? Math.max(task.tienDoPhanTram ?? 0, 100) : task.tienDoPhanTram ?? 0;
      setTasksByDept(prev => {
        const next = cloneTasksMap(prev);
        const current = next[deptKey]?.[taskKey];
        if (!current) return prev;
        next[deptKey][taskKey] = {
          ...current,
          tienDo,
          tienDoPhanTram: optimisticPercent,
          ngayGioHoanThanh: optimisticNgay,
          sourceRow: { ...current.sourceRow, ...editRow },
        };
        return next;
      });
      if (detailTask?.key === taskKey && detailTask.deptKey === deptKey) {
        setDetailTask(prev =>
          prev
            ? {
                ...prev,
                tienDo,
                tienDoPhanTram: optimisticPercent,
                ngayGioHoanThanh: optimisticNgay,
              }
            : prev
        );
        detailForm.setFieldsValue({ tienDo, tienDoPhanTram: optimisticPercent });
      }

      setSavingTienDoKey(taskKey);
      try {
        await editDataRow(editRow, activeTable);
        const mapped = await reloadTasks();
        const refreshed = mapped?.[deptKey]?.[taskKey];
        if (refreshed && detailTask?.key === taskKey && detailTask.deptKey === deptKey) {
          setDetailTask({ ...refreshed, key: taskKey, deptKey });
          detailForm.setFieldsValue({ tienDo: refreshed.tienDo });
        }
        message.success('Đã cập nhật TIẾN ĐỘ trên Supabase.');
        invalidateDashboardTasksCache();
        return true;
      } catch (error) {
        // Rollback nếu lưu lỗi
        await reloadTasks().catch(() => undefined);
        message.error(error instanceof Error ? error.message : 'Không thể cập nhật TIẾN ĐỘ trên Supabase.');
        return false;
      } finally {
        setSavingTienDoKey(null);
      }
    },
    [
      resolveActiveTable,
      supabaseConnected,
      tasksByDept,
      detailTask,
      detailForm,
      reloadTasks,
      message,
      resolveDisplayTienDo,
    ]
  );

  const handleSaveTienDo = async () => {
    if (!detailTask) {
      return;
    }

    setSavingTienDo(true);
    try {
      const ok = await updateTaskTienDo(detailTask.key, detailTask.deptKey, tienDoDraft);
      if (ok) {
        setTienDoModalOpen(false);
      }
    } finally {
      setSavingTienDo(false);
    }
  };

  const openDetail = (taskKey: string, deptKey: string) => {
    const t = tasksByDept[deptKey]?.[taskKey];
    if (!t) return;
    setDetailTask({ ...t, key: taskKey, deptKey });
    // Giữ listScope theo URL (tổng khối / phòng ban) để Quay lại đúng chỗ
  };

  const handleMarkComplete = async (taskKey: string, deptKey: string) => {
    const activeTable = resolveActiveTable(deptKey);
    if (!activeTable || !supabaseConnected) {
      message.error('Chưa kết nối Supabase.');
      return;
    }

    const task = tasksByDept[deptKey]?.[taskKey];
    if (!task?.sourceRow) {
      message.error('Không tìm thấy bản ghi để cập nhật.');
      return;
    }

    if (isTaskRecordCompleted(task)) {
      message.info('Công việc đã được đánh dấu hoàn thành.');
      return;
    }

    const completedAt = new Date();
    const sourceRow = await hydrateSourceRowKey(task.sourceRow, activeTable);
    if (!hasRowKey(sourceRow, task.rowKey, activeTable)) {
      message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
      return;
    }

    const editRow = buildCompleteTaskRow(
      sourceRow,
      completedAt,
      task.rowKey,
      activeTable
    );

    setCompletingTaskKey(taskKey);
    try {
      setTasksByDept(prev => {
        const next = cloneTasksMap(prev);
        const current = next[deptKey]?.[taskKey];
        if (current) {
          next[deptKey][taskKey] = mergeTaskCompletion(current, completedAt, editRow);
        }
        return next;
      });

      await editDataRow(editRow, activeTable);
      const mapped = await reloadTasks();
      const refreshed = mapped?.[deptKey]?.[taskKey];
      if (refreshed && detailTask?.key === taskKey && detailTask.deptKey === deptKey) {
        setDetailTask({ ...refreshed, key: taskKey, deptKey });
      }
      message.success('Đã đánh dấu hoàn thành trên Supabase.');
      invalidateDashboardTasksCache();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể đánh dấu hoàn thành trên Supabase.');
    } finally {
      setCompletingTaskKey(null);
    }
  };

  const handleDeleteTask = async (taskKey: string, deptKey: string) => {
    const task = tasksByDept[deptKey]?.[taskKey];
    if (!task?.sourceRow) {
      message.error('Không tìm thấy khóa bản ghi (TT) để xoá.');
      return;
    }

    const activeTable = resolveActiveTable(deptKey);
    if (!activeTable || !supabaseConnected) {
      message.error('Chưa kết nối Supabase.');
      return;
    }

    const sourceRow = await hydrateSourceRowKey(task.sourceRow, activeTable);
    if (!hasRowKey(sourceRow, task.rowKey, activeTable)) {
      message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
      return;
    }

    setDeletingTaskKey(taskKey);
    try {
      await deleteDataRow(
        buildTaskDeleteRow(sourceRow, task.rowKey, activeTable),
        activeTable
      );
      await reloadTasks();
      if (detailTask?.key === taskKey) {
        setDetailTask(null);
      }
      message.success('Đã xoá công việc trên Supabase.');
      invalidateDashboardTasksCache();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể xoá dòng trên Supabase.');
    } finally {
      setDeletingTaskKey(null);
    }
  };

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
  };

  useEffect(() => {
    const isMobileViewport =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    // Mobile: bỏ thanh toolbar trên (Thêm + Tuần) — đã có trong panel danh sách
    if (isMobileViewport) {
      clearToolbar();
      return () => clearToolbar();
    }

    const weekControls = (
      <>
        <span className="text-gray-600 text-xs font-semibold whitespace-nowrap hidden lg:inline">
          Chọn tuần:
        </span>
        <Select
          showSearch
          value={selectedWeek}
          onChange={handleWeekChange}
          options={WEEK_OPTIONS}
          placeholder="Tuần"
          size="small"
          className="w-[100px] sm:w-[180px] md:w-56 max-w-[42vw]"
          getPopupContainer={trigger => trigger.parentElement ?? document.body}
        />
        {supabaseConnected === true ? (
          <Tag color="success" className="m-0 shrink-0 hidden md:inline-flex">
            Supabase
          </Tag>
        ) : supabaseConnected === false ? (
          <Tag color="error" className="m-0 shrink-0 hidden md:inline-flex">
            Offline
          </Tag>
        ) : null}
      </>
    );

    if (listScope && !detailTask) {
      setToolbar(
        <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
          <BackButton
            size="small"
            fallbackTo={
              listScope.kind === 'dept' && blockKeyParam ? `/tasks/${blockKeyParam}` : '/tasks'
            }
          />
          <div className="min-w-0 flex-1 hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 m-0 leading-tight truncate">
              {listSubtitle}
            </p>
            <p className="m-0 text-sm font-extrabold uppercase text-[#1E386B] leading-snug truncate">
              {listTitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {addTaskButton({ size: 'small' })}
            {weekControls}
          </div>
        </div>
      );
    } else if (detailTask) {
      if (listScope) {
        setToolbar(
          <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
            <BackButton size="small" onClick={() => setDetailTask(null)} />
            <div className="min-w-0 flex-1 hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 m-0 leading-tight truncate">
                {listTitle}
              </p>
              <p className="m-0 text-sm font-extrabold text-[#1E386B] leading-snug truncate">
                {detailTask.congViec}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap justify-end">
              {addTaskButton({ size: 'small' })}
              <div className="flex items-center gap-1.5">
                <TaskCompleteTick
                  completed={isTaskRecordCompleted(detailTask)}
                  loading={completingTaskKey === detailTask.key}
                  disabled={!supabaseConnected}
                  onComplete={() => void handleMarkComplete(detailTask.key, detailTask.deptKey)}
                />
                <span className="text-xs font-semibold text-[#1E386B] hidden sm:inline">
                  {isTaskRecordCompleted(detailTask) ? 'Đã hoàn thành' : 'Hoàn thành'}
                </span>
              </div>
              <Button
                type="primary"
                size="small"
                className="bg-[#F38320] border-[#F38320] font-semibold"
                loading={savingDetail}
                onClick={handleDetailSave}
              >
                Lưu
              </Button>
              {weekControls}
            </div>
          </div>
        );
      } else {
        setToolbar(
          <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
            <BackButton size="small" onClick={() => setDetailTask(null)} />
            <div className="min-w-0 flex-1 hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 m-0 leading-tight">
                Chi tiết công việc
              </p>
              <p className="m-0 text-sm font-extrabold text-[#1E386B] leading-snug truncate">
                {detailTask.congViec}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap justify-end">
              <div className="flex items-center gap-1.5">
                <TaskCompleteTick
                  completed={isTaskRecordCompleted(detailTask)}
                  loading={completingTaskKey === detailTask.key}
                  disabled={!supabaseConnected}
                  onComplete={() => void handleMarkComplete(detailTask.key, detailTask.deptKey)}
                />
                <span className="text-xs font-semibold text-[#1E386B] hidden sm:inline">
                  {isTaskRecordCompleted(detailTask) ? 'Đã hoàn thành' : 'Hoàn thành'}
                </span>
              </div>
              <Button
                type="primary"
                size="small"
                className="bg-[#F38320] border-[#F38320] font-semibold"
                loading={savingDetail}
                onClick={handleDetailSave}
              >
                Lưu
              </Button>
              {weekControls}
            </div>
          </div>
        );
      }
    } else {
      setToolbar(
        <div className="flex items-center gap-2 md:gap-3 min-w-0 ml-auto">{weekControls}</div>
      );
    }

    return () => clearToolbar();
  }, [
    selectedWeek,
    supabaseConnected,
    listScope,
    listTitle,
    listSubtitle,
    detailTask,
    blockKeyParam,
    completingTaskKey,
    savingDetail,
    setToolbar,
    clearToolbar,
  ]);

  const showDeptColumn = listScope?.kind === 'block';

  const tableColumns = useMemo<ColumnsType<TableRow>>(() => {
    const th = (label: string) => <span className="task-th-label uppercase tracking-wide">{label}</span>;

    const columns: ColumnsType<TableRow> = [
      {
        title: th('Hoàn thành'),
        key: 'complete',
        width: 118,
        align: 'center',
        className: 'task-col-complete',
        render: (_, record) => (
          <TaskCompleteTick
            completed={isTaskRecordCompleted(record)}
            loading={completingTaskKey === record.key}
            disabled={!supabaseConnected}
            onComplete={() => void handleMarkComplete(record.key, record.deptKey)}
          />
        ),
      },
      {
        title: th('STT'),
        dataIndex: 'stt',
        key: 'stt',
        width: 64,
        align: 'center',
        className: 'task-col-stt',
      },
    ];

    if (showDeptColumn) {
      columns.push({
        title: th('Phòng ban'),
        dataIndex: 'phongBan',
        key: 'phongBan',
        width: 120,
        ellipsis: true,
        className: 'task-col-phongban',
      });
    }

    columns.push(
      {
        title: th('Công việc'),
        dataIndex: 'congViec',
        key: 'congViec',
        width: showDeptColumn ? 260 : 300,
        ellipsis: true,
        className: 'task-col-congviec',
        render: (text: string, record: TableRow) => (
          <div className="flex items-center gap-1.5 min-w-0">
            {isTaskOverduePastExtensions(taskDueContext(record)) ? (
              <Tag
                color="error"
                className="task-overdue-blink m-0 shrink-0 text-[9px] font-bold uppercase px-1 leading-none"
                title="Quá hạn"
              >
                QH
              </Tag>
            ) : null}
            <span className="truncate" title={text}>
              {text}
            </span>
          </div>
        ),
      },
      {
        title: th('Phụ trách'),
        dataIndex: 'nguoiPhuTrach',
        key: 'nguoiPhuTrach',
        width: 120,
        ellipsis: true,
        className: 'task-col-phutrach',
      },
      {
        title: th('Ngày hoàn thành'),
        dataIndex: 'deadline',
        key: 'deadline',
        width: 160,
        className: 'task-col-deadline',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('GH 1'),
        dataIndex: 'giaHan1',
        key: 'giaHan1',
        width: 78,
        align: 'center',
        className: 'task-col-giahan',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap text-[11px]">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('GH 2'),
        dataIndex: 'giaHan2',
        key: 'giaHan2',
        width: 78,
        align: 'center',
        className: 'task-col-giahan',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap text-[11px]">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('GH 3'),
        dataIndex: 'giaHan3',
        key: 'giaHan3',
        width: 78,
        align: 'center',
        className: 'task-col-giahan',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap text-[11px]">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('Tiến độ CV'),
        dataIndex: 'tienDoPhanTram',
        key: 'tienDoPhanTram',
        width: 150,
        align: 'center',
        className: 'task-col-progress',
        render: (value: number) => <TaskProgressBar value={value} />,
      },
      {
        title: th('Trạng thái'),
        dataIndex: 'tienDo',
        key: 'tienDo',
        width: 120,
        align: 'center',
        className: 'task-col-tiendo',
        render: (value: string, record: TableRow) => {
          const display = value || 'Chưa bắt đầu';
          const editableValue = TIEN_DO_EDIT_OPTIONS.some(option => option.value === display)
            ? display
            : undefined;

          return (
            <div
              className="flex justify-center min-w-0"
              data-task-action
              onClick={event => event.stopPropagation()}
            >
              <Select
                size="small"
                className="task-tiendo-select"
                style={{ width: 108 }}
                value={editableValue}
                placeholder={display}
                title={display}
                loading={savingTienDoKey === record.key}
                disabled={!supabaseConnected}
                options={TIEN_DO_EDIT_OPTIONS}
                popupMatchSelectWidth={120}
                onChange={nextValue => void updateTaskTienDo(record.key, record.deptKey, nextValue)}
              />
            </div>
          );
        },
      },
      {
        title: th('Ngày đã hoàn thành'),
        dataIndex: 'ngayHoanThanh',
        key: 'ngayHoanThanh',
        width: 180,
        align: 'center',
        className: 'task-col-ngayht',
        render: (value: string) => renderCompletionDateCell(value),
      },
      {
        title: th(''),
        key: 'actions',
        width: 56,
        align: 'center',
        className: 'task-col-actions',
        render: (_, record) => {
          const completed = isTaskRecordCompleted(record);
          return (
            <TaskActionMenu
              completed={completed}
              disabled={!supabaseConnected}
              deleting={deletingTaskKey === record.key}
              onEdit={() => openDetail(record.key, record.deptKey)}
              onDelete={() => void handleDeleteTask(record.key, record.deptKey)}
            />
          );
        },
      }
    );

    return columns;
  }, [showDeptColumn, supabaseConnected, completingTaskKey, deletingTaskKey, savingTienDoKey, updateTaskTienDo]);

  const selected = detailTask;
  const screens = Grid.useBreakpoint();
  const isMobileDetail = screens.md === false || screens.md === undefined;

  const statusPillClass = (status: string) => {
    if (status.includes('Hoàn thành')) return 'task-md-status-pill--done';
    if (status === 'Hủy' || status === 'Huỷ') return 'task-md-status-pill--cancel';
    if (status === 'Tạm dừng') return 'task-md-status-pill--paused';
    return 'task-md-status-pill--progress';
  };

  const personInitial = (name: string) => {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const selectedDeptLabel =
    selected && findDeptMeta(selected.deptKey)?.deptName
      ? findDeptMeta(selected.deptKey)!.deptName
      : selected?.deptKey || '—';

  const selectedBlockLabel = (() => {
    if (!selected) return '';
    const meta = findDeptMeta(selected.deptKey);
    if (!meta) return '';
    const block = ORG_BLOCKS.find(b => b.key === meta.blockKey);
    return block?.label || meta.blockKey;
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" style={{ background: '#e9eef7' }}>
      <Modal
        title="Tạo công việc mới"
        open={createOpen}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateOpen(false);
        }}
        afterClose={() => form.resetFields()}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={creatingTask}
        destroyOnHidden
        width={720}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Form form={form} layout="vertical" size="large" className="task-detail-form mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="deptKey"
              label="Phòng ban"
              rules={[{ required: true, message: 'Chọn phòng ban' }]}
              className="sm:col-span-2"
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={DEPT_OPTIONS}
                placeholder="Chọn phòng ban"
                disabled={Boolean(deptKeyParam)}
              />
            </Form.Item>
            <Form.Item
              name="congViec"
              label="Công việc"
              rules={[{ required: true, message: 'Nhập tên công việc' }]}
              className="sm:col-span-2"
            >
              <Input placeholder="Nội dung công việc" />
            </Form.Item>
            <Form.Item
              name="nguoiPhuTrach"
              label="Người phụ trách"
              rules={[{ required: true, message: 'Chọn người phụ trách' }]}
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={personnelOptions}
                optionLabelProp="value"
                optionRender={option => {
                  const data = option.data as PersonnelSelectOption;
                  return (
                    <div className="leading-tight py-0.5">
                      <div className="font-semibold text-[#0f274d]">{data.value}</div>
                      {data.description ? (
                        <div className="text-[11px] text-gray-500">{data.description}</div>
                      ) : null}
                    </div>
                  );
                }}
                placeholder={personnelOptions.length ? 'Chọn từ nhân sự' : 'Chưa có nhân sự — thêm ở mục Nhân sự'}
                notFoundContent={personnelOptions.length ? 'Không khớp' : 'Chưa có dữ liệu nhân sự'}
              />
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
            <Form.Item
              name="nguoiTheoDoi"
              label="Người liên quan"
              className="sm:col-span-2"
              initialValue={[]}
            >
              <PersonnelMultiSelect
                options={personnelOptions}
                placeholder={
                  personnelOptions.length
                    ? 'Tick chọn một hoặc nhiều người liên quan'
                    : 'Chưa có nhân sự — thêm ở mục Nhân sự'
                }
                notFoundContent={personnelOptions.length ? 'Không khớp' : 'Chưa có dữ liệu nhân sự'}
              />
            </Form.Item>
            <Form.Item
              name="deadline"
              label="Ngày hoàn thành"
              rules={[{ required: true, message: 'Chọn ngày hoàn thành' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label="Tiến độ CV (%)"
              required
              extra="Lưu sẽ đồng bộ lên Supabase (key TIẾN ĐỘ CV trong data jsonb)."
            >
              <Space.Compact className="w-full">
                <Form.Item
                  name="tienDoPhanTram"
                  noStyle
                  initialValue={0}
                  rules={[
                    { required: true, message: 'Nhập tiến độ' },
                    { type: 'number', min: 0, max: 100, message: 'Nhập từ 0 đến 100' },
                  ]}
                >
                  <InputNumber className="w-full" min={0} max={100} placeholder="0–100" />
                </Form.Item>
                <Input className="task-percent-suffix" value="%" readOnly tabIndex={-1} />
              </Space.Compact>
            </Form.Item>
            <Form.Item label="Link tài liệu" className="sm:col-span-2 mb-2">
              <TaskDocLinksField name="taiLieuLinks" size="middle" />
            </Form.Item>
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f274d] mb-2">Gia hạn</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                <Form.Item name="giaHan1" label="GIA HẠN 1">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="giaHan2" label="GIA HẠN 2">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="giaHan3" label="GIA HẠN 3">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Sửa tiến độ"
        open={tienDoModalOpen}
        onOk={() => void handleSaveTienDo()}
        onCancel={() => setTienDoModalOpen(false)}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={savingTienDo}
        destroyOnHidden
      >
        <div className="mt-2">
          <Text type="secondary" className="block mb-2">
            Giá trị sẽ ghi vào cột TIẾN ĐỘ trên Supabase.
          </Text>
          <Select
            className="w-full"
            value={tienDoDraft}
            onChange={setTienDoDraft}
            options={TIEN_DO_OPTIONS}
          />
        </div>
      </Modal>

      <div className="flex flex-1 overflow-hidden">
        <div className="task-md-shell">
          {/* Cột danh sách CV */}
          <section
            className={`task-list-panel${!selected ? ' task-list-panel--wide' : ''}${
              selected ? '' : ' is-mobile-visible'
            }`}
          >
            <div className="task-list-head">
              <h2 className="task-list-title">
                {listScope ? 'Danh sách công việc' : 'Chọn đầu mục ở thanh link phía trên'}
              </h2>
              <Input
                className="task-list-search"
                allowClear
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Tìm kiếm công việc"
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                disabled={!listScope}
              />
              {listScope ? (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 md:hidden">
                    {addTaskButton({ size: 'small' })}
                    <Select
                      showSearch
                      value={selectedWeek}
                      onChange={handleWeekChange}
                      options={WEEK_OPTIONS}
                      placeholder="Tuần"
                      size="small"
                      className="min-w-[120px] flex-1"
                      getPopupContainer={trigger => trigger.parentElement ?? document.body}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Select
                      value={filterStatus}
                      onChange={setFilterStatus}
                      options={LIST_STATUS_FILTER_OPTIONS}
                      className="min-w-[120px] flex-1"
                      size="small"
                      placeholder="Trạng thái"
                    />
                    <Text type="secondary" className="text-[12px] shrink-0 font-semibold">
                      {listSearchFiltered.length}/{tableRows.length}
                    </Text>
                  </div>
                  <DatePicker.RangePicker
                    className="task-list-date-range w-full"
                    size="small"
                    format="DD/MM/YYYY"
                    value={filterNgayGiaoRange}
                    onChange={dates =>
                      setFilterNgayGiaoRange(
                        dates ? [dates[0] ?? null, dates[1] ?? null] : null
                      )
                    }
                    placeholder={['Từ ngày', 'Đến ngày']}
                    allowEmpty={[true, true]}
                    disabled={!listScope}
                  />
                  {hasActiveListFilters ? (
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={clearListFilters}
                      className="self-start"
                    >
                      Xóa lọc
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="task-list-scroll">
              {!listScope ? (
                <div className="task-md-empty">Chọn khối hoặc phòng ban ở menu bên trái.</div>
              ) : taskLoading ? (
                <div className="task-md-empty">Đang tải...</div>
              ) : listSearchFiltered.length === 0 ? (
                <div className="task-md-empty space-y-3">
                  <p className="m-0">
                    {hasActiveListFilters ? 'Không có công việc khớp bộ lọc' : 'Chưa có công việc'}
                  </p>
                  {!hasActiveListFilters ? addTaskButton({ block: true }) : (
                    <Button onClick={clearListFilters}>Xóa lọc</Button>
                  )}
                </div>
              ) : (
                groupedListRows.map(([groupLabel, rows]) => (
                  <div key={groupLabel}>
                    <div className="task-list-group-label">{groupLabel}</div>
                    {rows.map(row => {
                      const done = isTaskRecordCompleted(row);
                      const active = selected?.key === row.key;
                      const badge = listBadgeMeta(row.tienDo);
                      const railCls = badge.cls.replace('task-list-badge', 'task-list-card');
                      const deptMeta = findDeptMeta(row.deptKey);
                      const progress = clampProgressPercent(row.tienDoPhanTram);
                      const progressCls =
                        progress >= 100
                          ? 'task-list-progress-tag--done'
                          : progress >= 60
                            ? 'task-list-progress-tag--high'
                            : progress > 0
                              ? 'task-list-progress-tag--mid'
                              : 'task-list-progress-tag--low';
                      return (
                        <button
                          key={row.key}
                          type="button"
                          className={`task-list-item task-list-card${active ? ' is-active' : ''}${
                            done ? ' is-done' : ''
                          } ${railCls}`}
                          onClick={() => openDetail(row.key, row.deptKey)}
                        >
                          <span className="task-list-card-rail" aria-hidden />
                          <div className="task-list-card-body">
                            <div className="task-list-card-head">
                              <p className="task-list-name" title={row.congViec}>
                                {row.congViec}
                              </p>
                              <span
                                className="task-md-person-avatar task-list-card-avatar"
                                title={row.nguoiPhuTrach || 'Chưa gán'}
                              >
                                {personInitial(row.nguoiPhuTrach)}
                              </span>
                            </div>

                            <div className="task-list-card-progress">
                              <TaskProgressBar
                                value={progress}
                                showInfo={false}
                                className="task-list-card-progress-bar"
                              />
                              <span
                                className={`task-list-progress-tag ${progressCls}`}
                                title={`Tiến độ hoàn thành ${progress}%`}
                              >
                                {progress}%
                              </span>
                            </div>

                            <div className="task-list-card-foot">
                              <span
                                role="checkbox"
                                aria-checked={done}
                                aria-label={done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                                title={done ? 'Đã hoàn thành' : 'Tích để hoàn thành'}
                                className={`task-list-check${done ? ' is-done' : ''}${
                                  completingTaskKey === row.key ? ' is-loading' : ''
                                }`}
                                onClick={event => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (done || !supabaseConnected || completingTaskKey === row.key) {
                                    return;
                                  }
                                  void handleMarkComplete(row.key, row.deptKey);
                                }}
                              >
                                {done ? <CheckOutlined /> : null}
                              </span>
                              <span className={`task-list-badge ${badge.cls}`}>{badge.label}</span>
                              <span className="task-list-sub truncate">
                                {deptMeta?.deptName || row.phongBan || row.deptKey}
                                {row.ngayGiao
                                  ? ` · ${normalizeDisplayDate(row.ngayGiao) || row.ngayGiao}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Cột chi tiết */}
          {selected ? (
            <div className="task-md-detail">
              <Form
                form={detailForm}
                layout="vertical"
                size="middle"
                className="task-detail-form task-md-compact-form flex-1 min-h-0"
              >
                {isMobileDetail ? (
                  <MobileTaskDetailBody
                    form={detailForm}
                    taskCode={
                      selected.stt
                        ? `CV-${String(selected.stt).padStart(4, '0')}`
                        : selected.key?.slice(0, 8) || 'CV'
                    }
                    statusLabel={normalizeTienDoForForm(selected.tienDo) || 'Đang thực hiện'}
                    blockLabel={selectedBlockLabel}
                    deptLabel={selectedDeptLabel}
                    ngayGiaoDisplay={
                      normalizeDisplayDate(selected.ngayGiao) || selected.ngayGiao || ''
                    }
                    ngayCapNhatDisplay={
                      normalizeDisplayDate(selected.ngayGioHoanThanh) ||
                      selected.ngayGioHoanThanh ||
                      ''
                    }
                    assigneeName={selected.nguoiGiao || ''}
                    assigneeOptions={detailAssigneeOptions}
                    followerOptions={detailFollowerOptions}
                    saving={savingDetail}
                    canSave={Boolean(supabaseConnected)}
                    onBack={() => setDetailTask(null)}
                    onSave={handleDetailSave}
                    personInitial={personInitial}
                  />
                ) : (
                <div className="task-md-detail-inner">
                  <div className="task-md-main">
                    <div className="task-md-head">
                      <p className="task-md-head-title">Chi tiết công việc</p>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => setDetailTask(null)}
                        aria-label="Đóng chi tiết"
                      />
                    </div>

                    <div className="task-md-body">
                      <Form.Item
                        name="congViec"
                        rules={[{ required: true, message: 'Nhập công việc' }]}
                        className="mb-1"
                      >
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          className="task-md-title-input"
                          placeholder="Tên công việc"
                        />
                      </Form.Item>

                      <div className="mb-1">
                        <div className="task-md-meta-row">
                          <FolderOutlined className="task-md-meta-icon" />
                          <span className="task-md-meta-label">Phòng ban</span>
                          <span className="task-md-meta-value truncate" style={{ color: 'var(--tv-cobalt)' }}>
                            {selectedDeptLabel}
                          </span>
                        </div>
                        <div className="task-md-meta-row">
                          <CalendarOutlined className="task-md-meta-icon" />
                          <span className="task-md-meta-label">Thời hạn</span>
                          <div className="task-md-meta-value">
                            <Form.Item name="ycXong" className="mb-0">
                              <DatePicker
                                className="w-full max-w-[220px]"
                                format="DD/MM/YYYY"
                                placeholder="Chọn thời hạn"
                                size="small"
                                variant="borderless"
                              />
                            </Form.Item>
                          </div>
                        </div>
                        <div className="task-md-meta-row">
                          <ClockCircleOutlined className="task-md-meta-icon" />
                          <span className="task-md-meta-label">TG hoàn thành</span>
                          <span className="task-md-meta-value text-emerald-700">
                            {selected.ngayGioHoanThanh
                              ? normalizeDisplayDate(selected.ngayGioHoanThanh) ||
                                selected.ngayGioHoanThanh
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <Form.Item
                        shouldUpdate={(prev, next) =>
                          prev.tienDo !== next.tienDo || prev.nguoiGiao !== next.nguoiGiao
                        }
                        className="mb-0"
                      >
                        {() => {
                          const status =
                            (detailForm.getFieldValue('tienDo') as string) ||
                            selected.tienDo ||
                            'Đang thực hiện';
                          const assignee =
                            (detailForm.getFieldValue('nguoiGiao') as string) ||
                            selected.nguoiGiao ||
                            '';
                          const assigneeOpt = detailAssigneeOptions.find(
                            o => o.value === assignee
                          );
                          const assigneeRole = assigneeOpt?.description || '';
                          const done = (status || '').includes('Hoàn thành');
                          return (
                            <div className="task-md-status-bar">
                              <div className={`task-md-status-pill ${statusPillClass(status)}`}>
                                <span className="task-md-status-pill-icon">
                                  {done ? <CheckOutlined /> : <CheckCircleOutlined />}
                                </span>
                                <Form.Item name="tienDo" className="mb-0 min-w-0 flex-1">
                                  <Select
                                    size="middle"
                                    variant="borderless"
                                    className="w-full min-w-[120px]"
                                    options={[...TIEN_DO_EDIT_OPTIONS]}
                                    disabled={!supabaseConnected}
                                    suffixIcon={<span style={{ fontSize: 10, color: '#fff' }}>▼</span>}
                                  />
                                </Form.Item>
                              </div>
                              <div className="task-md-status-assignee">
                                <span className="task-md-person-avatar">{personInitial(assignee)}</span>
                                <div className="task-md-status-assignee-text">
                                  <p className="task-md-status-assignee-name">
                                    {assignee || 'Chưa giao'}
                                  </p>
                                  {assigneeRole ? (
                                    <p className="task-md-status-assignee-role">{assigneeRole}</p>
                                  ) : null}
                                </div>
                                <SwapOutlined className="task-md-status-assignee-swap" />
                              </div>
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>
                  </div>

                  <aside className="task-md-aside">
                    <div className="task-md-aside-card task-md-goal-alert">
                      <InfoCircleOutlined />
                      <span>Chưa liên kết với mục tiêu / Lựa chọn mục tiêu</span>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Người phụ trách</p>
                      <Form.Item
                        name="nguoiGiao"
                        className="mb-0"
                        rules={[{ required: true, message: 'Chọn người phụ trách' }]}
                      >
                        <Select
                          showSearch
                          allowClear
                          optionFilterProp="label"
                          options={detailAssigneeOptions}
                          optionLabelProp="value"
                          size="small"
                          placeholder="Chọn nhân sự"
                        />
                      </Form.Item>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Người liên quan</p>
                      <Form.Item name="nguoiTheoDoi" className="mb-0">
                        <PersonnelMultiSelect
                          options={detailFollowerOptions}
                          placeholder="Thêm người liên quan"
                        />
                      </Form.Item>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Thời gian</p>
                      <div className="task-md-time-grid">
                        <div className="task-md-time-item">
                          <span className="task-md-meta-label">TG tạo</span>
                          <p className="task-md-time-value">
                            {normalizeDisplayDate(selected.ngayGiao) || selected.ngayGiao || '—'}
                          </p>
                        </div>
                        <div className="task-md-time-item">
                          <span className="task-md-meta-label">TG cập nhật</span>
                          <p className="task-md-time-value">
                            {normalizeDisplayDate(selected.ngayGioHoanThanh) ||
                              selected.ngayGioHoanThanh ||
                              '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Tiến độ & ảnh hưởng</p>
                      <div className="task-md-progress-block task-md-progress-block--row">
                        <span className="task-md-progress-caption">
                          Tiến độ <span className="text-red-500">*</span>
                        </span>
                        <Form.Item
                          shouldUpdate={(prev, next) => prev.tienDoPhanTram !== next.tienDoPhanTram}
                          noStyle
                        >
                          {() => (
                            <TaskProgressBar
                              value={clampProgressPercent(detailForm.getFieldValue('tienDoPhanTram'))}
                              className="task-md-progress-bar-inline"
                              showInfo={false}
                            />
                          )}
                        </Form.Item>
                        <Space.Compact size="small" className="task-md-progress-compact">
                          <Form.Item
                            name="tienDoPhanTram"
                            noStyle
                            rules={[
                              { required: true, message: 'Nhập tiến độ' },
                              { type: 'number', min: 0, max: 100, message: '0–100' },
                            ]}
                          >
                            <InputNumber min={0} max={100} controls={false} />
                          </Form.Item>
                          <Input className="task-percent-suffix" value="%" readOnly tabIndex={-1} />
                        </Space.Compact>
                      </div>
                      <Form.Item
                        name="anhHuong"
                        label="Mức ảnh hưởng"
                        className="mb-0 mt-2"
                        rules={[{ required: true, message: 'Chọn mức độ' }]}
                      >
                        <Select
                          size="small"
                          options={[1, 2, 3, 4].map(level => ({
                            value: level,
                            label: `${level} sao`,
                          }))}
                        />
                      </Form.Item>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Thông tin khác</p>
                      <Form.Item name="vuongMac" label="Vướng mắc" className="mb-2">
                        <Input.TextArea rows={2} placeholder="Vướng mắc cần hỗ trợ..." />
                      </Form.Item>
                      <Form.Item name="ketQua" label="Kết quả công việc" className="mb-2">
                        <Input.TextArea rows={2} placeholder="Kết quả đạt được..." />
                      </Form.Item>
                      <p className="task-md-field-caption">Link tài liệu</p>
                      <div className="mb-2">
                        <TaskDocLinksField name="taiLieuLinks" size="small" />
                      </div>
                      <div className="grid grid-cols-2 gap-x-2">
                        <Form.Item name="ngayGiao" label="Ngày giao" className="mb-2">
                          <DatePicker className="w-full" format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                        <Form.Item name="canLD" label="Cần LĐ tác động" className="mb-2">
                          <Select
                            size="small"
                            options={[
                              { value: 'Không', label: 'Không' },
                              { value: 'Có', label: 'Có' },
                            ]}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item
                        name="noiDungCanTacDong"
                        label="Nội dung cần tác động"
                        className="mb-2"
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder="Mô tả nội dung cần lãnh đạo tác động..."
                        />
                      </Form.Item>
                      <p className="task-md-field-caption">Gia hạn</p>
                      <div className="grid grid-cols-3 gap-x-2">
                        <Form.Item name="giaHan1" label="GH 1" className="mb-0">
                          <DatePicker className="w-full" format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                        <Form.Item name="giaHan2" label="GH 2" className="mb-0">
                          <DatePicker className="w-full" format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                        <Form.Item name="giaHan3" label="GH 3" className="mb-0">
                          <DatePicker className="w-full" format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="task-md-aside-card">
                      <p className="task-md-aside-label">Lịch sử hoạt động</p>
                      <div className="task-md-activity-empty">
                        Chưa có lịch sử hoạt động cho công việc này.
                      </div>
                    </div>
                  </aside>
                </div>
                )}
              </Form>
              {!isMobileDetail ? (
              <div className="task-md-sticky-save sm:hidden shrink-0">
                <Button
                  type="primary"
                  block
                  size="large"
                  className="bg-[#F38320] border-[#F38320] font-bold h-11"
                  loading={savingDetail}
                  onClick={handleDetailSave}
                  disabled={!supabaseConnected}
                >
                  Lưu
                </Button>
              </div>
              ) : null}
            </div>
          ) : (
            <div className="task-md-detail is-mobile-hidden">
              <div className="task-md-empty">
                {listScope
                  ? 'Chọn một công việc ở danh sách bên trái để xem chi tiết.'
                  : 'Chọn đầu mục ở thanh link phía trên để bắt đầu.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskView;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  DatePicker,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckSquareOutlined,
  CheckCircleOutlined,
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
import { addAppsheetTask, deleteAppsheetTask, editAppsheetTask, findAppsheetTasks } from '../services/appsheetApi';
import {
  buildAppsheetCompleteTaskRow,
  mergeTaskCompletion,
  buildAppsheetDeleteRow,
  buildAppsheetEditRow,
  buildAppsheetTaskRow,
  buildAppsheetTienDoEditRow,
  isTaskRecordCompleted,
  mapAppsheetRowsToTasksByDept,
  resolveAppsheetTableName,
} from '../services/taskAppsheet';
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
  'Đang làm': { color: 'processing' },
  'Quá hạn': { color: 'error' },
  'Chưa bắt đầu': { color: 'default' },
};

/** Giá trị TIẾN ĐỘ AppSheet chấp nhận khi ghi qua API. */
const TIEN_DO_EDIT_OPTIONS = [
  { value: 'Đang làm', label: 'Đang làm' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
  { value: 'Quá hạn', label: 'Quá hạn' },
];

const TIEN_DO_OPTIONS = TIEN_DO_EDIT_OPTIONS;

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
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  tienDo: string;
  trangThai: string;
  ngayHoanThanh: string;
  deptKey: string;
  sourceRow?: Record<string, unknown>;
};

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
  const [appsheetConnected, setAppsheetConnected] = useState<boolean | null>(null);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const appsheetTable = useMemo(
    () => resolveAppsheetTableName(blockKeyParam, deptKeyParam),
    [blockKeyParam, deptKeyParam]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAppsheetTasks() {
      if (!appsheetTable) {
        setAppsheetConnected(null);
        setTasksByDept(createEmptyTasksByDept());
        return;
      }

      setTaskLoading(true);
      try {
        const result = await findAppsheetTasks({ table: appsheetTable });
        if (cancelled) return;

        setAppsheetConnected(true);
        setTasksByDept(cloneTasksMap(mapAppsheetRowsToTasksByDept(result.rows, result.table)));
      } catch (error) {
        if (!cancelled) {
          setAppsheetConnected(false);
          setTasksByDept(createEmptyTasksByDept());
          message.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu AppSheet.');
        }
      } finally {
        if (!cancelled) {
          setTaskLoading(false);
        }
      }
    }

    void loadAppsheetTasks();

    return () => {
      cancelled = true;
    };
  }, [appsheetTable]);

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
    if (!detailTask) {
      detailForm.resetFields();
      return;
    }

    detailForm.setFieldsValue({
      congViec: detailTask.congViec,
      nguoiGiao: detailTask.nguoiGiao,
      ngayGiao: parseTaskDate(detailTask.ngayGiao) ?? formatTaskDate(detailTask.ngayGiao) ?? undefined,
      ycXong: parseTaskDate(detailTask.ycXong) ?? undefined,
      giaHan1: parseTaskDate(detailTask.giaHan1) ?? undefined,
      giaHan2: parseTaskDate(detailTask.giaHan2) ?? undefined,
      giaHan3: parseTaskDate(detailTask.giaHan3) ?? undefined,
      ketQua: detailTask.ketQua,
      linkKQ: detailTask.linkKQ,
      tienDo: detailTask.tienDo,
      vuongMac: detailTask.vuongMac,
      canLD: detailTask.canLD,
      anhHuong: detailTask.anhHuong,
    });
  }, [detailTask, detailForm]);

  const reloadAppsheetTasks = useCallback(async () => {
    if (!appsheetTable) {
      return null;
    }

    const result = await findAppsheetTasks({ table: appsheetTable });
    const mapped = mapAppsheetRowsToTasksByDept(result.rows, result.table);
    setTasksByDept(cloneTasksMap(mapped));
    return mapped;
  }, [appsheetTable]);

  const collectRowsForScope = useCallback(
    (scope: ListScope): TableRow[] => {
      const rows: TableRow[] = [];
      if (scope.kind === 'dept') {
        const meta = findDeptMeta(scope.deptKey);
        const bucket: Record<string, TaskRecord> = tasksByDept[scope.deptKey] ?? {};
        const label = meta?.deptName ?? scope.deptKey;
        Object.entries(bucket).forEach(([taskKey, t]) => {
          let computedTienDo = calculateAutomaticStatus({
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            ngayHoanThanh: t.ngayGioHoanThanh,
          });
          if (computedTienDo === 'Hoàn thành' && t.tienDo && t.tienDo.toLowerCase().includes('gia hạn')) {
            computedTienDo = t.tienDo as any;
          }
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            tienDo: computedTienDo,
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
          let computedTienDo = calculateAutomaticStatus({
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            ngayHoanThanh: t.ngayGioHoanThanh,
          });
          if (computedTienDo === 'Hoàn thành' && t.tienDo && t.tienDo.toLowerCase().includes('gia hạn')) {
            computedTienDo = t.tienDo as any;
          }
          rows.push({
            key: taskKey,
            stt: t.stt,
            phongBan: label,
            congViec: t.congViec,
            nguoiPhuTrach: t.nguoiGiao,
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
            tienDo: computedTienDo,
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
    const targetDeptKey = deptKey ?? deptKeyParam;
    if (targetDeptKey) {
      form.setFieldsValue({ deptKey: targetDeptKey });
    }
    setCreateOpen(true);
  };

  const canCreateTask = Boolean(appsheetTable && appsheetConnected);

  const addTaskButton = (options?: { size?: 'small' | 'middle' | 'large'; block?: boolean }) => (
    <Button
      type="primary"
      size={options?.size ?? 'middle'}
      block={options?.block}
      icon={<PlusOutlined />}
      className="bg-[#F38320] border-[#F38320] hover:!bg-[#e07518] hover:!border-[#e07518] shadow-sm font-semibold"
      disabled={!canCreateTask}
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

        if (!appsheetTable) {
          message.error('Chọn phòng ban trên URL để thêm dòng AppSheet.');
          return;
        }

        if (!appsheetConnected) {
          message.error('Chưa kết nối AppSheet API.');
          return;
        }

        const existing = Object.values((tasksByDept[dk] ?? {}) as Record<string, TaskRecord>);
        const nextStt = existing.length ? Math.max(...existing.map(t => t.stt)) + 1 : 1;

        setCreatingTask(true);
        try {
          await addAppsheetTask(
            buildAppsheetTaskRow({
              deptKey: dk,
              congViec: values.congViec as string,
              nguoiPhuTrach: values.nguoiPhuTrach as string,
              deadline,
              giaHan1,
              giaHan2,
              giaHan3,
              anhHuong: Number(values.anhHuong),
              stt: nextStt,
            }),
            appsheetTable
          );
          await reloadAppsheetTasks();
          message.success('Đã thêm công việc mới vào AppSheet.');
          setCreateOpen(false);
          form.resetFields();
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể thêm dòng trên AppSheet.');
        } finally {
          setCreatingTask(false);
        }
      })
      .catch(() => {});
  };

  const handleDetailSave = () => {
    detailForm
      .validateFields()
      .then(async values => {
        if (!detailTask || !appsheetTable || !appsheetConnected) {
          message.error('Chưa kết nối AppSheet API.');
          return;
        }

        if (!detailTask.sourceRow) {
          message.error('Không tìm thấy khóa bản ghi AppSheet để cập nhật.');
          return;
        }

        const updatedTask: TaskRecord = {
          ...detailTask,
          congViec: values.congViec as string,
          nguoiGiao: values.nguoiGiao as string,
          ngayGiao: formatTaskDate(values.ngayGiao),
          ycXong: formatTaskDate(values.ycXong),
          giaHan1: formatTaskDate(values.giaHan1),
          giaHan2: formatTaskDate(values.giaHan2),
          giaHan3: formatTaskDate(values.giaHan3),
          ketQua: values.ketQua as string,
          linkKQ: values.linkKQ as string,
          tienDo: detailTask.tienDo,
          vuongMac: values.vuongMac as string,
          canLD: values.canLD as string,
          anhHuong: Number(values.anhHuong),
        };

        setSavingDetail(true);
        try {
          const editRow = buildAppsheetEditRow(updatedTask, detailTask.sourceRow);
          if (!editRow.TT) {
            message.error('Không tìm thấy khóa bản ghi AppSheet để cập nhật.');
            return;
          }

          await editAppsheetTask(editRow, appsheetTable);
          const result = await findAppsheetTasks({ table: appsheetTable });
          const mapped = mapAppsheetRowsToTasksByDept(result.rows, result.table);
          setTasksByDept(cloneTasksMap(mapped));
          const refreshed = mapped[detailTask.deptKey]?.[detailTask.key];
          if (refreshed) {
            setDetailTask({ ...refreshed, key: detailTask.key, deptKey: detailTask.deptKey });
          }
          message.success('Đã cập nhật AppSheet.');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể cập nhật AppSheet.');
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

    const current = detailTask.tienDo || 'Chưa bắt đầu';
    const editable = TIEN_DO_EDIT_OPTIONS.some(option => option.value === current);
    setTienDoDraft(editable ? current : 'Đang làm');
    setTienDoModalOpen(true);
  };

  const updateTaskTienDo = useCallback(
    async (taskKey: string, deptKey: string, tienDo: string) => {
      if (!appsheetTable || !appsheetConnected) {
        message.error('Chưa kết nối AppSheet API.');
        return false;
      }

      const task = tasksByDept[deptKey]?.[taskKey];
      if (!task?.sourceRow) {
        message.error('Không tìm thấy bản ghi AppSheet để cập nhật.');
        return false;
      }

      if ((task.tienDo || 'Chưa bắt đầu') === tienDo) {
        return true;
      }

      const editRow = buildAppsheetTienDoEditRow(tienDo, task.sourceRow);
      const tienDoWritten = Object.values(editRow).some(
        value => value === 'Hoàn thành' || value === 'Đang thực hiện' || value === 'Quá hạn'
      );
      if (!tienDoWritten) {
        message.error('Chỉ cập nhật được: Đang làm, Hoàn thành hoặc Quá hạn.');
        return false;
      }

      setSavingTienDoKey(taskKey);
      try {
        await editAppsheetTask(editRow, appsheetTable);
        const mapped = await reloadAppsheetTasks();
        const refreshed = mapped?.[deptKey]?.[taskKey];
        if (refreshed && detailTask?.key === taskKey && detailTask.deptKey === deptKey) {
          setDetailTask({ ...refreshed, key: taskKey, deptKey });
          detailForm.setFieldsValue({ tienDo: refreshed.tienDo });
        }
        message.success('Đã cập nhật TIẾN ĐỘ trên AppSheet.');
        return true;
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Không thể cập nhật TIẾN ĐỘ trên AppSheet.');
        return false;
      } finally {
        setSavingTienDoKey(null);
      }
    },
    [appsheetTable, appsheetConnected, tasksByDept, detailTask, detailForm, reloadAppsheetTasks, message]
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
    setListScope(null);
  };

  const handleMarkComplete = async (taskKey: string, deptKey: string) => {
    if (!appsheetTable || !appsheetConnected) {
      message.error('Chưa kết nối AppSheet API.');
      return;
    }

    const task = tasksByDept[deptKey]?.[taskKey];
    if (!task?.sourceRow) {
      message.error('Không tìm thấy bản ghi AppSheet để cập nhật.');
      return;
    }

    if (isTaskRecordCompleted(task)) {
      message.info('Công việc đã được đánh dấu hoàn thành.');
      return;
    }

    const completedAt = new Date();
    const editRow = buildAppsheetCompleteTaskRow(task.sourceRow, completedAt);
    if (!editRow.TT) {
      message.error('Không tìm thấy khóa bản ghi AppSheet để cập nhật.');
      return;
    }

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

      await editAppsheetTask(editRow, appsheetTable);
      const mapped = await reloadAppsheetTasks();
      const refreshed = mapped?.[deptKey]?.[taskKey];
      if (refreshed && detailTask?.key === taskKey && detailTask.deptKey === deptKey) {
        setDetailTask({ ...refreshed, key: taskKey, deptKey });
      }
      message.success('Đã đánh dấu hoàn thành trên AppSheet.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể đánh dấu hoàn thành trên AppSheet.');
    } finally {
      setCompletingTaskKey(null);
    }
  };

  const handleDeleteTask = async (taskKey: string, deptKey: string) => {
    const task = tasksByDept[deptKey]?.[taskKey];
    if (!task?.sourceRow) {
      message.error('Không tìm thấy khóa bản ghi AppSheet để xoá.');
      return;
    }

    if (!appsheetTable || !appsheetConnected) {
      message.error('Chưa kết nối AppSheet API.');
      return;
    }

    setDeletingTaskKey(taskKey);
    try {
      await deleteAppsheetTask(buildAppsheetDeleteRow(task.sourceRow), appsheetTable);
      await reloadAppsheetTasks();
      if (detailTask?.key === taskKey) {
        setDetailTask(null);
      }
      message.success('Đã xoá công việc trên AppSheet.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể xoá dòng trên AppSheet.');
    } finally {
      setDeletingTaskKey(null);
    }
  };

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
  };

  const showDeptColumn = listScope?.kind === 'block';

  const tableColumns = useMemo<ColumnsType<TableRow>>(() => {
    const th = (label: string) => (
      <span className="uppercase tracking-wide text-[10px] font-semibold">{label}</span>
    );

    const columns: ColumnsType<TableRow> = [
      {
        title: th('STT'),
        dataIndex: 'stt',
        key: 'stt',
        width: 48,
        align: 'center',
      },
    ];

    if (showDeptColumn) {
      columns.push({
        title: th('Phòng ban'),
        dataIndex: 'phongBan',
        key: 'phongBan',
        width: '11%',
        ellipsis: true,
        className: 'task-col-phongban',
      });
    }

    columns.push(
      {
        title: th('Công việc'),
        dataIndex: 'congViec',
        key: 'congViec',
        width: showDeptColumn ? '24%' : '28%',
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
        width: showDeptColumn ? '12%' : '14%',
        ellipsis: true,
        className: 'task-col-phutrach',
      },
      {
        title: th('Deadline'),
        dataIndex: 'deadline',
        key: 'deadline',
        width: 100,
        className: 'task-col-deadline',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('GH 1'),
        dataIndex: 'giaHan1',
        key: 'giaHan1',
        width: 88,
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
        width: 88,
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
        width: 88,
        align: 'center',
        className: 'task-col-giahan',
        render: (d: string, record: TableRow) => (
          <span className="whitespace-nowrap text-[11px]">{renderDateCell(d, record)}</span>
        ),
      },
      {
        title: th('Tiến độ'),
        dataIndex: 'tienDo',
        key: 'tienDo',
        width: 118,
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
                disabled={!appsheetConnected}
                options={TIEN_DO_EDIT_OPTIONS}
                popupMatchSelectWidth={120}
                onChange={nextValue => void updateTaskTienDo(record.key, record.deptKey, nextValue)}
              />
            </div>
          );
        },
      },
      {
        title: th('Ngày hoàn thành'),
        dataIndex: 'ngayHoanThanh',
        key: 'ngayHoanThanh',
        width: 108,
        align: 'center',
        className: 'task-col-ngayht',
        render: (value: string) => renderCompletionDateCell(value),
      },
      {
        title: th(''),
        key: 'actions',
        width: 112,
        align: 'center',
        className: 'task-col-actions',
        render: (_, record) => {
          const completed = isTaskRecordCompleted(record);
          const overdue =
            !completed && isTaskOverduePastExtensions(taskDueContext(record));
          return (
          <div
            className={`flex items-center justify-center gap-0.5${overdue ? ' task-overdue-actions' : ''}`}
            data-task-action
            onClick={event => event.stopPropagation()}
          >
            {!completed ? (
              <Popconfirm
                title={
                  overdue
                    ? 'Công việc đang quá hạn. Xác nhận đánh dấu đã hoàn thành?'
                    : 'Đánh dấu công việc đã hoàn thành?'
                }
                okText="Xác nhận"
                cancelText="Huỷ"
                onConfirm={() => void handleMarkComplete(record.key, record.deptKey)}
                disabled={!appsheetConnected}
              >
                <Button
                  type="text"
                  size="small"
                  className="!px-1 !text-green-700 hover:!text-green-800"
                  icon={<CheckCircleOutlined />}
                  title="Đã hoàn thành"
                  loading={completingTaskKey === record.key}
                  disabled={!appsheetConnected}
                />
              </Popconfirm>
            ) : null}
            <Button
              type="text"
              size="small"
              className="!px-1"
              icon={<EditOutlined />}
              title="Sửa"
              onClick={() => openDetail(record.key, record.deptKey)}
            />
            <Popconfirm
              title="Xoá công việc này trên AppSheet?"
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true, loading: deletingTaskKey === record.key }}
              onConfirm={() => void handleDeleteTask(record.key, record.deptKey)}
              disabled={!appsheetConnected}
            >
              <Button
                type="text"
                size="small"
                danger
                className="!px-1"
                icon={<DeleteOutlined />}
                title="Xóa"
                loading={deletingTaskKey === record.key}
                disabled={!appsheetConnected}
              />
            </Popconfirm>
          </div>
          );
        },
      }
    );

    return columns;
  }, [showDeptColumn, appsheetConnected, completingTaskKey, deletingTaskKey, savingTienDoKey, updateTaskTienDo]);

  const selected = detailTask;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">
      {/* ── TOP BAR ── */}
      <div className="bg-white px-4 md:px-6 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 flex-shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {(!listScope || detailTask) && addTaskButton()}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
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
          {appsheetConnected === true ? (
            <Tag color="success">AppSheet</Tag>
          ) : appsheetConnected === false ? (
            <Tag color="error">Không kết nối AppSheet</Tag>
          ) : null}
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
        confirmLoading={creatingTask}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="deptKey" label="Phòng ban" rules={[{ required: true, message: 'Chọn phòng ban' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={DEPT_OPTIONS}
              placeholder="Chọn phòng ban"
              disabled={Boolean(deptKeyParam)}
            />
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
          <Form.Item name="deadline" label="Y/C xong" rules={[{ required: true, message: 'Chọn deadline' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Gia hạn</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            Giá trị sẽ ghi vào cột TIẾN ĐỘ trên AppSheet.
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {listScope && !detailTask ? (
            <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 min-w-0">
              <div className="flex-1 flex flex-col overflow-hidden max-w-7xl w-full mx-auto min-w-0">
              <div className="bg-[#F38320] text-white px-4 md:px-5 py-3 rounded-t-lg flex-shrink-0 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 m-0 mb-1">Danh sách công việc</p>
                  <h2 className="m-0 text-base font-bold uppercase leading-snug">{listTitle}</h2>
                </div>
                <div className="shrink-0 pt-0.5">{addTaskButton({ size: 'small' })}</div>
              </div>
              <div className="flex-1 overflow-auto bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm p-3 md:p-4">
                <div className="hidden md:block min-w-0">
                  <Table<TableRow>
                    rowKey="key"
                    className="task-table-compact task-table-balanced"
                    columns={tableColumns}
                    dataSource={tableRows}
                    loading={taskLoading}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                    scroll={{ x: showDeptColumn ? 1284 : 1204 }}
                    locale={{ emptyText: 'Chưa có công việc' }}
                    onRow={record => {
                      const overdue =
                        !isTaskRecordCompleted(record) &&
                        isTaskOverduePastExtensions(taskDueContext(record));
                      return {
                        onClick: event => {
                          if ((event.target as HTMLElement).closest('[data-task-action]')) {
                            return;
                          }
                          openDetail(record.key, record.deptKey);
                        },
                        className: overdue
                          ? 'cursor-pointer task-overdue-row'
                          : 'cursor-pointer hover:bg-blue-50/50',
                      };
                    }}
                  />
                </div>
                <div className="block md:hidden space-y-2">
                  {tableRows.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 space-y-3">
                      <p className="m-0">Chưa có công việc</p>
                      {addTaskButton({ block: true })}
                    </div>
                  ) : (
                    tableRows.map(row => {
                      const overdue =
                        !isTaskRecordCompleted(row) &&
                        isTaskOverduePastExtensions(taskDueContext(row));
                      return (
                      <div
                        key={row.key}
                        className={`w-full text-left bg-white border border-gray-200 rounded-lg p-3 shadow-sm${
                          overdue ? ' task-overdue-card' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openDetail(row.key, row.deptKey)}
                          className="w-full text-left active:scale-[0.99] transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm leading-snug flex-1${
                                overdue ? ' task-overdue-title' : ' font-semibold text-gray-800'
                              }`}
                            >
                              {row.congViec}
                            </p>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {overdue ? (
                                <Tag color="error" className="task-overdue-blink m-0 text-[10px] font-bold">
                                  Quá hạn
                                </Tag>
                              ) : null}
                              <span className="text-[11px] text-gray-500">#{row.stt}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {showDeptColumn ? (
                              <p>
                                Phòng ban: <span className="font-medium">{row.phongBan}</span>
                              </p>
                            ) : null}
                            <p>
                              Phụ trách: <span className="font-medium">{row.nguoiPhuTrach}</span>
                            </p>
                            {renderMobileDateLine('Deadline', row.deadline, row)}
                            {renderMobileDateLine('Gia hạn 1', row.giaHan1, row)}
                            {renderMobileDateLine('Gia hạn 2', row.giaHan2, row)}
                            {renderMobileDateLine('Gia hạn 3', row.giaHan3, row)}
                            {row.ngayHoanThanh ? (
                              <p>
                                Ngày hoàn thành:{' '}
                                <span className="font-semibold text-green-700">
                                  {normalizeDisplayDate(row.ngayHoanThanh) || row.ngayHoanThanh}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </button>
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3" data-task-action>
                          {!isTaskRecordCompleted(row) ? (
                            <Popconfirm
                              title="Đánh dấu công việc đã hoàn thành?"
                              okText="Xác nhận"
                              cancelText="Huỷ"
                              onConfirm={() => void handleMarkComplete(row.key, row.deptKey)}
                              disabled={!appsheetConnected}
                            >
                              <Button
                                size="small"
                                type="primary"
                                className="bg-green-600 border-green-600"
                                icon={<CheckCircleOutlined />}
                                loading={completingTaskKey === row.key}
                                disabled={!appsheetConnected}
                              >
                                Đã hoàn thành
                              </Button>
                            </Popconfirm>
                          ) : null}
                          <Button size="small" icon={<EditOutlined />} onClick={() => openDetail(row.key, row.deptKey)}>
                            Sửa
                          </Button>
                          <Popconfirm
                            title="Xoá công việc này trên AppSheet?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true, loading: deletingTaskKey === row.key }}
                            onConfirm={() => void handleDeleteTask(row.key, row.deptKey)}
                            disabled={!appsheetConnected}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              loading={deletingTaskKey === row.key}
                              disabled={!appsheetConnected}
                            >
                              Xoá
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="bg-[#F38320] px-4 md:px-6 py-3 md:py-4 flex-shrink-0 shadow flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 tracking-wide uppercase">Chi tiết công việc</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {isTaskOverduePastExtensions({
                      deadline: selected.ycXong,
                      giaHan1: selected.giaHan1,
                      giaHan2: selected.giaHan2,
                      giaHan3: selected.giaHan3,
                      tienDo: selected.tienDo,
                      trangThai: selected.trangThai,
                    }) ? (
                      <Tag color="error" className="task-overdue-blink m-0 border-0 font-bold uppercase text-[11px]">
                        Quá hạn
                      </Tag>
                    ) : null}
                    <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">
                      {selected.congViec}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  {!isTaskRecordCompleted(selected) ? (
                    <Popconfirm
                      title="Đánh dấu công việc đã hoàn thành?"
                      okText="Xác nhận"
                      cancelText="Huỷ"
                      onConfirm={() => void handleMarkComplete(selected.key, selected.deptKey)}
                      disabled={!appsheetConnected}
                    >
                      <Button
                        type="primary"
                        className="bg-green-600 border-green-600 hover:!bg-green-700 hover:!border-green-700"
                        icon={<CheckCircleOutlined />}
                        loading={completingTaskKey === selected.key}
                        disabled={!appsheetConnected}
                      >
                        Đã hoàn thành
                      </Button>
                    </Popconfirm>
                  ) : null}
                  <Button
                    type="primary"
                    className="bg-[#F38320] border-[#F38320]"
                    loading={savingDetail}
                    onClick={handleDetailSave}
                  >
                    Lưu AppSheet
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-[#1E386B] text-white text-center font-bold py-2 text-xs tracking-widest rounded-t-xl uppercase">
                    Thông tin công việc
                  </div>

                  <Form form={detailForm} layout="vertical" className="px-5 py-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6">
                      <Form.Item name="congViec" label="Công việc" rules={[{ required: true, message: 'Nhập công việc' }]}>
                        <Input.TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="nguoiGiao" label="Người phụ trách" rules={[{ required: true, message: 'Nhập người phụ trách' }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="ngayGiao" label="Ngày giao">
                        <Input placeholder="DD/MM/YYYY" />
                      </Form.Item>
                      <Form.Item name="ycXong" label="Y/C xong">
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                      </Form.Item>
                      <div className="xl:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Gia hạn</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Form.Item label="Tiến độ">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color={(STATUS_CFG[selected.tienDo] ?? { color: 'default' }).color}>
                            {selected.tienDo || 'Chưa bắt đầu'}
                          </Tag>
                          <Button size="small" onClick={openTienDoModal} disabled={isTaskRecordCompleted(selected)}>
                            Sửa tiến độ
                          </Button>
                        </div>
                      </Form.Item>
                      {selected.ngayGioHoanThanh ? (
                        <Form.Item label="Ngày hoàn thành">
                          <Text className="font-medium">{selected.ngayGioHoanThanh}</Text>
                        </Form.Item>
                      ) : null}
                      <Form.Item name="canLD" label="Cần LĐ tác động">
                        <Select
                          options={[
                            { value: 'Không', label: 'Không' },
                            { value: 'Có', label: 'Có' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="anhHuong" label="Mức ảnh hưởng" rules={[{ required: true, message: 'Chọn mức độ' }]}>
                        <Select options={[1, 2, 3, 4].map(level => ({ value: level, label: `${level} sao` }))} />
                      </Form.Item>
                      <Form.Item name="linkKQ" label="Link KQ" className="xl:col-span-2">
                        <Input />
                      </Form.Item>
                      <Form.Item name="ketQua" label="Kết quả" className="xl:col-span-2">
                        <Input.TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="vuongMac" label="Vướng mắc" className="xl:col-span-2">
                        <Input.TextArea rows={2} />
                      </Form.Item>
                    </div>
                  </Form>
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

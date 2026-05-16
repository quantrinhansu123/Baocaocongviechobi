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
import { formatTaskDate, parseTaskDate } from '../utils/taskDate';
import { addAppsheetTask, deleteAppsheetTask, editAppsheetTask, findAppsheetTasks } from '../services/appsheetApi';
import {
  buildAppsheetDeleteRow,
  buildAppsheetEditRow,
  buildAppsheetTaskRow,
  buildAppsheetTienDoEditRow,
  mapAppsheetRowsToTasksByDept,
  resolveAppsheetTableName,
} from '../services/taskAppsheet';

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
  'Đang làm': { color: 'processing' },
  'Quá hạn': { color: 'error' },
  'Chưa bắt đầu': { color: 'default' },
};

const TIEN_DO_OPTIONS = Object.keys(STATUS_CFG).map(status => ({ value: status, label: status }));

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
  deptKey: string;
};

function renderDateCell(value: string) {
  const isOverdue =
    Boolean(value) && dayjs(value, 'DD/MM/YYYY').isValid() && dayjs(value, 'DD/MM/YYYY').isBefore(dayjs(), 'day');

  return <span className={isOverdue ? 'text-red-500 font-medium' : ''}>{value || '—'}</span>;
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
      return;
    }

    const result = await findAppsheetTasks({ table: appsheetTable });
    setTasksByDept(cloneTasksMap(mapAppsheetRowsToTasksByDept(result.rows, result.table)));
  }, [appsheetTable]);

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
            deadline: t.ycXong,
            giaHan1: t.giaHan1,
            giaHan2: t.giaHan2,
            giaHan3: t.giaHan3,
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
        const bucket: Record<string, TaskRecord> = tasksByDept[dept.key] ?? {};
        Object.entries(bucket).forEach(([taskKey, t]) => {
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
    const targetDeptKey = deptKey ?? deptKeyParam;
    if (targetDeptKey) {
      form.setFieldsValue({ deptKey: targetDeptKey });
    }
    setCreateOpen(true);
  };

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

    setTienDoDraft(detailTask.tienDo || 'Chưa bắt đầu');
    setTienDoModalOpen(true);
  };

  const handleSaveTienDo = async () => {
    if (!detailTask || !appsheetTable || !appsheetConnected) {
      message.error('Chưa kết nối AppSheet API.');
      return;
    }

    if (!detailTask.sourceRow) {
      message.error('Không tìm thấy khóa bản ghi AppSheet để cập nhật.');
      return;
    }

    const editRow = buildAppsheetTienDoEditRow(tienDoDraft, detailTask.sourceRow);
    if (!editRow['TIẾN ĐỘ']) {
      message.error('Tiến độ này không được AppSheet chấp nhận. Chọn Đang làm, Hoàn thành hoặc Quá hạn.');
      return;
    }

    setSavingTienDo(true);
    try {
      await editAppsheetTask(editRow, appsheetTable);
      const result = await findAppsheetTasks({ table: appsheetTable });
      const mapped = mapAppsheetRowsToTasksByDept(result.rows, result.table);
      setTasksByDept(cloneTasksMap(mapped));
      const refreshed = mapped[detailTask.deptKey]?.[detailTask.key];
      if (refreshed) {
        setDetailTask({ ...refreshed, key: detailTask.key, deptKey: detailTask.deptKey });
        detailForm.setFieldsValue({ tienDo: refreshed.tienDo });
      }
      setTienDoModalOpen(false);
      message.success('Đã cập nhật TIẾN ĐỘ trên AppSheet.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật TIẾN ĐỘ trên AppSheet.');
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
      render: (d: string) => renderDateCell(d),
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">GIA HẠN 1</span>,
      dataIndex: 'giaHan1',
      key: 'giaHan1',
      width: 110,
      render: (d: string) => renderDateCell(d),
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">GIA HẠN 2</span>,
      dataIndex: 'giaHan2',
      key: 'giaHan2',
      width: 110,
      render: (d: string) => renderDateCell(d),
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">GIA HẠN 3</span>,
      dataIndex: 'giaHan3',
      key: 'giaHan3',
      width: 110,
      render: (d: string) => renderDateCell(d),
    },
    {
      title: <span className="uppercase tracking-wide text-[11px]">Thao tác</span>,
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-1" data-task-action onClick={event => event.stopPropagation()}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openDetail(record.key, record.deptKey)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xoá công việc này trên AppSheet?"
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true, loading: deletingTaskKey === record.key }}
            onConfirm={() => void handleDeleteTask(record.key, record.deptKey)}
            disabled={!appsheetConnected}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingTaskKey === record.key}
              disabled={!appsheetConnected}
            >
              Xoá
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const selected = detailTask;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">
      {/* ── TOP BAR ── */}
      <div className="bg-white px-4 md:px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 flex-shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-[#1E386B]"
            disabled={!appsheetTable || !appsheetConnected}
            onClick={() => openCreateModal()}
          >
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
                    loading={taskLoading}
                    pagination={false}
                    size="small"
                    scroll={{ x: 1180 }}
                    locale={{ emptyText: 'Chưa có công việc' }}
                    onRow={record => ({
                      onClick: event => {
                        if ((event.target as HTMLElement).closest('[data-task-action]')) {
                          return;
                        }
                        openDetail(record.key, record.deptKey);
                      },
                      className: 'cursor-pointer hover:bg-blue-50/50',
                    })}
                  />
                </div>
                <div className="block md:hidden space-y-2">
                  {tableRows.length === 0 ? (
                    <div className="text-center text-gray-400 py-6">Chưa có công việc</div>
                  ) : (
                    tableRows.map(row => (
                      <div
                        key={row.key}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => openDetail(row.key, row.deptKey)}
                          className="w-full text-left active:scale-[0.99] transition"
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
                            <p>Gia hạn 1: <span className="font-medium">{row.giaHan1 || '—'}</span></p>
                            <p>Gia hạn 2: <span className="font-medium">{row.giaHan2 || '—'}</span></p>
                            <p>Gia hạn 3: <span className="font-medium">{row.giaHan3 || '—'}</span></p>
                          </div>
                        </button>
                        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3" data-task-action>
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
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="bg-[#1E386B] px-4 md:px-6 py-3 md:py-4 flex-shrink-0 shadow flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 tracking-wide uppercase">Chi tiết công việc</p>
                  <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">
                    {selected.congViec}
                  </h2>
                </div>
                <Button
                  type="primary"
                  className="bg-[#F38320] border-[#F38320] flex-shrink-0"
                  loading={savingDetail}
                  onClick={handleDetailSave}
                >
                  Lưu AppSheet
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-[#F38320] text-white text-center font-bold py-2 text-xs tracking-widest rounded-t-xl uppercase">
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
                          <Button size="small" onClick={openTienDoModal}>
                            Sửa tiến độ
                          </Button>
                        </div>
                      </Form.Item>
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

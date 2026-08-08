import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Antd from 'antd';
import dayjs from 'dayjs';
import './Dashboard.css';

const Card = Antd.Card as any;
import {
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Select,
  Typography,
  Timeline,
  Tooltip,
  Empty,
  Spin,
  Tabs,
  Grid,
  Pagination,
  Button,
  Segmented,
  message,
  Popconfirm,
  Form,
  Input,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FireOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { X, User, Star } from 'lucide-react';
import TaskActionMenu from '../components/TaskActionMenu';
import TaskCompleteTick from '../components/TaskCompleteTick';
import { ORG_BLOCKS } from '../data/orgBlocks';
import {
  buildDashboardBlockChartData,
  buildDashboardChartData,
  buildDashboardStatusSummary,
  loadDashboardTasks,
  normalizeDashboardChartStatus,
  type DashboardChartRow,
  type DashboardChartStatus,
  type DashboardTask,
} from '../services/dashboardData';
import { deleteDataRow, editDataRow, fetchDataStatus } from '../services/dataApi';
import {
  buildCompleteTaskRow,
  buildTaskDeleteRow,
  buildTaskEditRow,
  hasRowKey,
  hydrateSourceRowKey,
} from '../services/taskData';
import type { TaskRecord } from '../types/task';
import { formatTaskDate, parseTaskDate } from '../utils/taskDate';
const { Title, Text } = Typography;

type ChartGroupPopup = {
  groupKey: string;
  groupName: string;
};

type ChartDrillDown = ChartGroupPopup & {
  status: DashboardChartStatus;
};

type StackBarLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  dataKey?: string | number;
  value?: string | number;
};

function isStackEndSegment(
  row: Pick<DashboardChartRow, 'Hoàn thành' | 'Đang làm' | 'Quá hạn'>,
  dataKey?: string | number
): boolean {
  const key = String(dataKey ?? '');
  if (row['Quá hạn'] > 0) {
    return key === 'Quá hạn';
  }
  if (row['Đang làm'] > 0) {
    return key === 'Đang làm';
  }
  if (row['Hoàn thành'] > 0) {
    return key === 'Hoàn thành';
  }
  return false;
}

function createStackTotalLabel(rows: DashboardChartRow[]) {
  return (props: StackBarLabelProps) => {
    const { x, y, width, height, index, dataKey } = props;
    const row = index != null ? rows[index] : undefined;
    if (x == null || y == null || width == null || height == null || !row?.total) {
      return null;
    }
    if (!isStackEndSegment(row, dataKey)) {
      return null;
    }
    return (
      <text
        x={x + width + 6}
        y={y + height / 2}
        fill="#374151"
        fontSize={11}
        fontWeight={600}
        dominantBaseline="middle"
      >
        {row.total}
      </text>
    );
  };
}

function createCompletedStackLabel() {
  return (props: StackBarLabelProps) => {
    const { x, y, width, height, dataKey, value } = props;
    if (dataKey !== 'Hoàn thành' || !value || Number(value) <= 0) {
      return null;
    }
    if (x == null || y == null || width == null || height == null || width < 18) {
      return null;
    }
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#ffffff"
        fontSize={10}
        fontWeight={600}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {value}
      </text>
    );
  };
}

const ROMAN = ['I', 'II', 'III', 'IV'] as const;

const DEPARTMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả phòng ban' },
  ...ORG_BLOCKS.flatMap((block, blockIndex) =>
    block.depts.map((dept, deptIndex) => ({
      value: dept.key,
      label: `${ROMAN[blockIndex]}. ${block.label} — ${deptIndex + 1}. ${dept.name}`,
    }))
  ),
];

type KpiFilterKey = 'total' | 'completed' | 'overdue' | 'priority';

const KPI_LIST_TITLES: Record<KpiFilterKey, string> = {
  total: 'Danh sách tất cả công việc',
  completed: 'Danh sách công việc đã hoàn thành',
  overdue: 'Danh sách công việc quá hạn',
  priority: 'Danh sách công việc quan trọng (mức 3–4)',
};

const Dashboard: React.FC = () => {
  const [allTasks, setAllTasks] = useState<DashboardTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set());
  const [chartGroupPopup, setChartGroupPopup] = useState<ChartGroupPopup | null>(null);
  const [chartDrillDown, setChartDrillDown] = useState<ChartDrillDown | null>(null);
  const [chartDrillPage, setChartDrillPage] = useState(1);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailForm] = Form.useForm();

  const handleRowClick = (record: DashboardTask) => {
    setSelectedTask(record);
  };

  const openTaskEdit = (task: DashboardTask) => {
    // Giữ modal danh sách mở phía dưới; mở form sửa trực tiếp
    setSelectedTask(task);
  };

  useEffect(() => {
    if (!selectedTask) {
      detailForm.resetFields();
      return;
    }
    detailForm.setFieldsValue({
      congViec: selectedTask.name,
      nguoiGiao: selectedTask.assignee === '—' ? '' : selectedTask.assignee,
      ngayGiao: selectedTask.ngayGiao || undefined,
      ycXong: parseTaskDate(selectedTask.ycXong) ?? undefined,
      giaHan1: parseTaskDate(selectedTask.giaHan1) ?? undefined,
      giaHan2: parseTaskDate(selectedTask.giaHan2) ?? undefined,
      giaHan3: parseTaskDate(selectedTask.giaHan3) ?? undefined,
      ketQua: selectedTask.ketQua || selectedTask.desc,
      linkKQ: selectedTask.linkKQ,
      vuongMac: selectedTask.vuongMac || selectedTask.history,
      canLD: selectedTask.canLD || 'Không',
      anhHuong: selectedTask.impact || 1,
    });
  }, [selectedTask, detailForm]);

  const reloadDashboardTasks = async () => {
    const tasks = await loadDashboardTasks({ force: true });
    setAllTasks(tasks);
    return tasks;
  };

  const handleMarkComplete = async (task: DashboardTask) => {
    if (!task.table || supabaseConnected === false) {
      message.error('Chưa kết nối Supabase.');
      return;
    }
    if (!task.sourceRow) {
      message.error('Không tìm thấy bản ghi để cập nhật.');
      return;
    }
    if (task.status.includes('Hoàn thành')) {
      message.info('Công việc đã được đánh dấu hoàn thành.');
      return;
    }

    const completedAt = new Date();
    const completedStamp = dayjs(completedAt).format('DD/MM/YYYY');
    const optimistic: DashboardTask = {
      ...task,
      status: 'Hoàn thành',
      tienDo: 'Hoàn thành',
      ngayHoanThanh: completedStamp,
      isIssue: false,
    };

    setCompletingTaskId(task.id);
    // Cập nhật UI ngay; không mở modal chi tiết
    setAllTasks(prev => prev.map(item => (item.id === task.id ? optimistic : item)));
    setSelectedTask(null);

    try {
      const sourceRow = await hydrateSourceRowKey(task.sourceRow, task.table);
      if (!hasRowKey(sourceRow, task.rowKey, task.table)) {
        message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
        await reloadDashboardTasks();
        return;
      }
      const editRow = buildCompleteTaskRow(sourceRow, completedAt, task.rowKey, task.table);
      await editDataRow(editRow, task.table);
      await reloadDashboardTasks();
      setSelectedTask(null);
      message.success('Đã đánh dấu hoàn thành.');
    } catch (error) {
      await reloadDashboardTasks();
      message.error(error instanceof Error ? error.message : 'Không thể đánh dấu hoàn thành.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleDeleteTask = async (task: DashboardTask) => {
    if (!task.table || supabaseConnected === false) {
      message.error('Chưa kết nối Supabase.');
      return;
    }
    if (!task.sourceRow) {
      message.error('Không tìm thấy khóa bản ghi (TT) để xoá.');
      return;
    }

    setDeletingTaskId(task.id);
    try {
      const sourceRow = await hydrateSourceRowKey(task.sourceRow, task.table);
      if (!hasRowKey(sourceRow, task.rowKey, task.table)) {
        message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
        return;
      }
      const deleteRow = buildTaskDeleteRow(sourceRow, task.rowKey, task.table);
      await deleteDataRow(deleteRow, task.table);
      await reloadDashboardTasks();
      if (selectedTask?.id === task.id) {
        setSelectedTask(null);
      }
      message.success('Đã xoá công việc trên Supabase.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể xoá công việc.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDetailSave = () => {
    if (!selectedTask) return;
    detailForm
      .validateFields()
      .then(async values => {
        if (!selectedTask.table || supabaseConnected === false) {
          message.error('Chưa kết nối Supabase.');
          return;
        }
        if (!selectedTask.sourceRow) {
          message.error('Không tìm thấy khóa bản ghi (TT) để cập nhật.');
          return;
        }

        const updatedTask: TaskRecord = {
          stt: 0,
          kyBaoCao: selectedTask.week,
          congViec: values.congViec as string,
          nguoiGiao: values.nguoiGiao as string,
          ngayGiao: formatTaskDate(values.ngayGiao),
          ycXong: formatTaskDate(values.ycXong),
          giaHan1: formatTaskDate(values.giaHan1),
          giaHan2: formatTaskDate(values.giaHan2),
          giaHan3: formatTaskDate(values.giaHan3),
          ketQua: (values.ketQua as string) || '',
          linkKQ: (values.linkKQ as string) || '',
          tienDo: selectedTask.tienDo,
          trangThai: '',
          ngayGioHoanThanh: selectedTask.ngayHoanThanh,
          vuongMac: (values.vuongMac as string) || '',
          canLD: (values.canLD as string) || 'Không',
          anhHuong: Number(values.anhHuong) || 1,
          rowKey: selectedTask.rowKey,
          sourceRow: selectedTask.sourceRow,
        };

        setSavingDetail(true);
        try {
          const sourceRow = await hydrateSourceRowKey(selectedTask.sourceRow, selectedTask.table);
          if (!hasRowKey(sourceRow, selectedTask.rowKey, selectedTask.table)) {
            message.error('Không tìm thấy khóa TT trên Supabase. F5 tải lại danh sách.');
            return;
          }
          const editRow = buildTaskEditRow(
            { ...updatedTask, sourceRow, rowKey: selectedTask.rowKey },
            sourceRow,
            selectedTask.table
          );
          await editDataRow(editRow, selectedTask.table);
          const tasks = await reloadDashboardTasks();
          const refreshed = tasks.find(item => item.id === selectedTask.id);
          if (refreshed) {
            setSelectedTask(refreshed);
          }
          message.success('Đã cập nhật Supabase.');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể cập nhật Supabase.');
        } finally {
          setSavingDetail(false);
        }
      })
      .catch(() => {});
  };

  const renderCompleteTick = (task: DashboardTask) => (
    <TaskCompleteTick
      completed={task.status.includes('Hoàn thành')}
      loading={completingTaskId === task.id}
      disabled={supabaseConnected === false}
      onComplete={() => void handleMarkComplete(task)}
    />
  );

  const renderTaskActions = (task: DashboardTask) => {
    const completed = task.status.includes('Hoàn thành');
    return (
      <TaskActionMenu
        completed={completed}
        disabled={supabaseConnected === false}
        deleting={deletingTaskId === task.id}
        onEdit={() => openTaskEdit(task)}
        onDelete={() => void handleDeleteTask(task)}
      />
    );
  };

  const completeColumn = {
    title: 'HOÀN THÀNH',
    key: 'complete',
    width: 130,
    align: 'center' as const,
    render: (_: unknown, record: DashboardTask) => renderCompleteTick(record),
  };

  const blockDeptKeys = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const block of ORG_BLOCKS) {
      map.set(block.key, new Set(block.depts.map(dept => dept.key)));
    }
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setTasksLoading(true);
      try {
        const [tasks, status] = await Promise.all([loadDashboardTasks(), fetchDataStatus()]);
        if (!cancelled) {
          setAllTasks(tasks);
          setSupabaseConnected(Boolean(status.connected));
        }
      } catch {
        if (!cancelled) {
          setAllTasks([]);
          setSupabaseConnected(false);
        }
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleResolveIssue = (issueId: string) => {
    setResolvedIssues(prev => {
      const newSet = new Set(prev);
      newSet.add(issueId);
      return newSet;
    });
    // TODO: Gọi API để cập nhật DB: await updateIssue(issueId, { resolved: true })
  };

  // --- STATE BỘ LỌC ---
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterKey | null>(null);
  const [kpiListPage, setKpiListPage] = useState(1);
  const [chartGroupMode, setChartGroupMode] = useState<'dept' | 'block'>('block');
  const kpiListRef = useRef<HTMLDivElement>(null);

  // --- STATE PHÂN TRANG VƯỚNG MẮC ---
  const [issuePage, setIssuePage] = useState<number>(1);
  const [overduePage, setOverduePage] = useState<number>(1);
  const [importantPage, setImportantPage] = useState<number>(1);

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchWeek = filterWeek === 'all' || task.week === filterWeek;
      const matchDept = filterDept === 'all' || task.deptKey === filterDept;

      let matchPriority = true;
      if (filterPriority === 'high') matchPriority = task.impact >= 3;
      if (filterPriority === 'low') matchPriority = task.impact <= 2;

      let matchStatus = true;
      if (filterStatus === 'in_progress') matchStatus = task.status === 'Đang làm';
      if (filterStatus === 'overdue') matchStatus = task.status === 'Quá hạn';
      if (filterStatus === 'completed') matchStatus = task.status.includes('Hoàn thành');
      if (filterStatus === 'ext_1') matchStatus = task.status === 'Hoàn thành gia hạn 1';
      if (filterStatus === 'ext_2') matchStatus = task.status === 'Hoàn thành gia hạn 2';
      if (filterStatus === 'ext_3') matchStatus = task.status === 'Hoàn thành gia hạn 3';

      return matchWeek && matchDept && matchPriority && matchStatus;
    });
  }, [allTasks, filterWeek, filterDept, filterPriority, filterStatus]);

  // --- TÁCH MẢNG CON TỪ DANH SÁCH ĐÃ LỌC ---
  const displayStats = useMemo(() => {
    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status.includes('Hoàn thành')).length,
      overdue: filteredTasks.filter(t => t.status === 'Quá hạn').length,
      highPriority: filteredTasks.filter(t => t.impact >= 3).length,
    };
  }, [filteredTasks]);

  const displayOverdue = useMemo(() => filteredTasks.filter(t => t.status === 'Quá hạn'), [filteredTasks]);
  const displayImportant = useMemo(() => filteredTasks.filter(t => t.impact >= 3 && !t.status.includes('Hoàn thành')), [filteredTasks]);
  const displayIssues = useMemo(() => filteredTasks.filter(t => t.isIssue && !resolvedIssues.has(t.id)), [filteredTasks, resolvedIssues]);

  // Reset trang vướng mắc về 1 mỗi khi đổi filter làm thay đổi danh sách
  useEffect(() => {
    setIssuePage(1);
  }, [displayIssues]);

  useEffect(() => {
    setOverduePage(1);
  }, [displayOverdue]);

  useEffect(() => {
    setImportantPage(1);
  }, [displayImportant]);

  const kpiDrillDownTasks = useMemo(() => {
    switch (activeKpiFilter) {
      case 'completed':
        return filteredTasks.filter(task => task.status.includes('Hoàn thành'));
      case 'overdue':
        return filteredTasks.filter(task => task.status === 'Quá hạn');
      case 'priority':
        return filteredTasks.filter(task => task.impact >= 3);
      case 'total':
        return filteredTasks;
      default:
        return [];
    }
  }, [activeKpiFilter, filteredTasks]);

  useEffect(() => {
    setKpiListPage(1);
  }, [activeKpiFilter, kpiDrillDownTasks.length]);

  const handleKpiClick = (key: KpiFilterKey) => {
    setActiveKpiFilter(previous => (previous === key ? null : key));
    window.setTimeout(() => {
      kpiListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  // --- MÀU SẮC TAG & TRẠNG THÁI ---
  const getStatusColor = (status: string) => {
    if (status === 'Hoàn thành') return 'success';
    if (status === 'Quá hạn' || status === 'Vướng mắc') return 'error';
    return 'processing';
  };

  const renderStatus = (status: string) => {
    if (status.includes('Hoàn thành')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> {status}
        </span>
      );
    }
    if (status === 'Quá hạn') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Quá hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-[#1E386B] rounded-full text-sm font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F38320]" /> Đang làm
      </span>
    );
  };

  const renderStatusCompact = (status: string) => {
    if (status.includes('Hoàn thành')) {
      return <span className="task-status task-status--done">Hoàn thành</span>;
    }
    if (status === 'Quá hạn') {
      return <span className="task-status task-status--overdue">Quá hạn</span>;
    }
    return <span className="task-status task-status--progress">Đang làm</span>;
  };

  const renderMobileTaskCard = (task: DashboardTask, accent?: 'red' | 'orange' | 'default') => {
    const borderClass =
      accent === 'red' ? 'border-red-100' : accent === 'orange' ? 'border-orange-100' : 'border-gray-200';
    const titleClass =
      accent === 'red' ? 'text-red-600' : accent === 'orange' ? 'text-[#1E386B]' : 'text-[#1E386B]';
    const deadlineClass = accent === 'red' ? 'text-red-600 font-semibold' : 'text-gray-600';

    return (
      <div
        key={task.id}
        onClick={() => handleRowClick(task)}
        className={`dashboard-mobile-task-card relative bg-white shadow-sm border ${borderClass} overflow-hidden active:scale-[0.98] transition-transform cursor-pointer`}
      >
        {accent === 'red' ? <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" /> : null}
        {accent === 'orange' ? <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F38320]" /> : null}
        <div className={accent ? 'pl-1.5' : ''}>
          <p className={`task-title ${titleClass} line-clamp-2`} title={task.name}>
            {task.name}
          </p>
          <div className="task-meta-row">
            <Tag className="task-tag" title={task.department}>
              {task.department}
            </Tag>
            <span className={`task-deadline ${deadlineClass}`}>Ngày hoàn thành: {task.deadline}</span>
          </div>
          <div className="task-footer">
            <span className="task-assignee" title={task.assignee}>
              <User size={10} className="shrink-0" />
              {task.assignee}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span title={task.status}>{renderStatusCompact(task.status)}</span>
              {renderCompleteTick(task)}
            </span>
          </div>
          {task.impact >= 3 ? (
            <div className="task-impact" aria-label={`Mức ảnh hưởng ${task.impact}`}>
              {[...Array(4)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < task.impact ? 'fill-[#F38320] text-[#1E386B]' : 'text-gray-300'}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderImpact = (level: number) => (
    <div className="flex gap-1">
      {[...Array(4)].map((_, i) => (
        <Star key={i} size={16} className={i < level ? 'fill-[#F38320] text-[#1E386B]' : 'text-gray-300'} />
      ))}
    </div>
  );

  const LIST_PAGE_SIZE = 10;
  const LIST_SCROLL_Y = 520;

  const sttColumn = (page: number, pageSize: number) => ({
    title: 'STT',
    key: 'stt',
    width: 72,
    align: 'center' as const,
    render: (_: unknown, __: DashboardTask, index: number) => (
      <span className="font-bold text-[#1E386B]">{(page - 1) * pageSize + index + 1}</span>
    ),
  });

  const overdueColumns = [
    completeColumn,
    sttColumn(overduePage, LIST_PAGE_SIZE),
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text: string, record: DashboardTask) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-red-600 cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      ),
    },
    { title: 'NGƯỜI PHỤ TRÁCH', dataIndex: 'assignee', key: 'assignee', width: 160 },
    {
      title: 'NGÀY HOÀN THÀNH',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (date: string) => <strong className="text-red-600">{date}</strong>,
    },
  ];

  const buildTaskListColumns = (page: number, pageSize: number) => [
    completeColumn,
    sttColumn(page, pageSize),
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (text: string) => <Tag className="chart-drill-tag m-0">{text}</Tag>,
    },
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      ellipsis: true,
      render: (text: string, record: DashboardTask) => (
        <Tooltip title={record.desc || text} placement="topLeft">
          <span className="chart-drill-task-name text-[#1E386B] cursor-pointer hover:underline">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'NGƯỜI PHỤ TRÁCH',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 160,
      ellipsis: true,
      render: (text: string) => <span className="chart-drill-cell-text">{text}</span>,
    },
    {
      title: 'NGÀY HOÀN THÀNH',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (date: string) => <strong className="chart-drill-deadline">{date}</strong>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => renderStatus(status),
    },
    {
      title: '',
      key: 'actions',
      width: 64,
      align: 'center' as const,
      render: (_: unknown, record: DashboardTask) => renderTaskActions(record),
    },
  ];

  const importantColumns = [
    completeColumn,
    sttColumn(importantPage, LIST_PAGE_SIZE),
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (text: string) => <Tag>{text}</Tag>
    },
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text: string, record: any) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-[#1E386B] cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      )
    },
    { title: 'NGƯỜI PHỤ TRÁCH', dataIndex: 'assignee', key: 'assignee', width: 160 },
    {
      title: 'NGÀY HOÀN THÀNH',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (date: string) => <strong className="text-[#1E386B]">{date}</strong>
    },
    {
      title: 'MỨC ĐỘ ẢNH HƯỞNG',
      dataIndex: 'impact',
      key: 'impact',
      width: 190,
      render: (impact: number) => renderImpact(impact)
    },
  ];

  const generateWeekOptions = () => {
    const weeks = [];
    let startDate = dayjs('2026-01-04');
    for (let i = 1; i <= 52; i++) {
      const endDate = startDate.add(6, 'day');
      weeks.push({
        value: `week_${i}`,
        label: `Tuần ${i} (${startDate.format('DD/MM')} - ${endDate.format('DD/MM')})`,
      });
      startDate = startDate.add(7, 'day');
    }
    return weeks;
  };

  const weekOptions = generateWeekOptions();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  useEffect(() => {
    setChartGroupMode(isMobile ? 'block' : 'dept');
  }, [isMobile]);

  const chartDataRecharts = useMemo(() => {
    if (chartGroupMode === 'block') {
      return buildDashboardBlockChartData(filteredTasks);
    }
    return buildDashboardChartData(filteredTasks);
  }, [filteredTasks, chartGroupMode]);

  const chartStatusSummary = useMemo(
    () => buildDashboardStatusSummary(filteredTasks),
    [filteredTasks]
  );

  const chartStatusTotal =
    chartStatusSummary['Hoàn thành'] + chartStatusSummary['Đang làm'] + chartStatusSummary['Quá hạn'];

  const chartHeight = useMemo(() => {
    const rowCount = Math.max(chartDataRecharts.length, 1);
    const rowHeight = isMobile ? 34 : 38;
    return Math.min(560, Math.max(isMobile ? 200 : 220, rowCount * rowHeight + 72));
  }, [chartDataRecharts.length, isMobile]);

  const chartMaxValue = useMemo(() => {
    let max = 0;
    for (const row of chartDataRecharts) {
      max = Math.max(max, row.total);
    }
    return Math.max(max, 1);
  }, [chartDataRecharts]);

  const stackTotalLabel = useMemo(
    () => createStackTotalLabel(chartDataRecharts),
    [chartDataRecharts]
  );
  const completedStackLabel = useMemo(() => createCompletedStackLabel(), []);

  const chartDrillTasks = useMemo(() => {
    if (!chartDrillDown) return [];

    return filteredTasks.filter(task => {
      const matchGroup =
        chartGroupMode === 'dept'
          ? task.deptKey === chartDrillDown.groupKey
          : Boolean(blockDeptKeys.get(chartDrillDown.groupKey)?.has(task.deptKey));

      if (!matchGroup) return false;
      return normalizeDashboardChartStatus(task.status) === chartDrillDown.status;
    });
  }, [blockDeptKeys, chartDrillDown, chartGroupMode, filteredTasks]);

  const chartGroupStatusCounts = useMemo(() => {
    if (!chartGroupPopup) {
      return { 'Hoàn thành': 0, 'Đang làm': 0, 'Quá hạn': 0, total: 0 };
    }

    const tasks = filteredTasks.filter(task =>
      chartGroupMode === 'dept'
        ? task.deptKey === chartGroupPopup.groupKey
        : Boolean(blockDeptKeys.get(chartGroupPopup.groupKey)?.has(task.deptKey))
    );

    const counts = { 'Hoàn thành': 0, 'Đang làm': 0, 'Quá hạn': 0 };
    for (const task of tasks) {
      counts[normalizeDashboardChartStatus(task.status)] += 1;
    }
    return {
      ...counts,
      total: counts['Hoàn thành'] + counts['Đang làm'] + counts['Quá hạn'],
    };
  }, [blockDeptKeys, chartGroupMode, chartGroupPopup, filteredTasks]);

  useEffect(() => {
    setChartDrillPage(1);
  }, [chartDrillDown]);

  const openChartGroupPopup = (data: { payload?: DashboardChartRow }) => {
    const row = data?.payload;
    if (!row?.deptKey) return;
    setChartDrillDown(null);
    setChartGroupPopup({
      groupKey: row.deptKey,
      groupName: row.name,
    });
  };

  const openChartStatusTasks = (status: DashboardChartStatus) => {
    if (!chartGroupPopup) return;
    if (!chartGroupStatusCounts[status]) return;
    setChartDrillDown({
      ...chartGroupPopup,
      status,
    });
  };

  const handleChartBarClick = (_status: DashboardChartStatus) => (data: { payload?: DashboardChartRow }) => {
    openChartGroupPopup(data);
  };

  const chartTitle =
    chartGroupMode === 'block'
      ? 'Trạng thái công việc - theo khối'
      : 'Trạng thái công việc - theo phòng ban';

  const doneCount = chartStatusSummary['Hoàn thành'];
  const progressCount = chartStatusSummary['Đang làm'];
  const overdueCount = chartStatusSummary['Quá hạn'];

  const donePct = chartStatusTotal > 0 ? (doneCount / chartStatusTotal) * 100 : 0;
  const progressPct = chartStatusTotal > 0 ? (progressCount / chartStatusTotal) * 100 : 0;

  const donutConicGradient = useMemo(() => {
    if (chartStatusTotal <= 0) {
      return 'conic-gradient(#E5E7EB 0% 100%)';
    }

    // Thứ tự màu theo legend: Xanh (Hoàn thành) → Đỏ (Quá hạn) → Cam (Đang làm)
    const stops: string[] = [];
    let start = 0;

    const addStop = (color: string, pct: number) => {
      if (pct <= 0) return;
      const end = Math.min(100, start + pct);
      stops.push(`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
      start = end;
    };

    addStop('#10b981', donePct);
    addStop('#ef4444', chartStatusTotal > 0 ? (overdueCount / chartStatusTotal) * 100 : 0);
    addStop('#F38320', progressPct);

    if (start < 100) {
      stops.push(`#E5E7EB ${start.toFixed(2)}% 100%`);
    }

    return `conic-gradient(${stops.join(', ')})`;
  }, [chartStatusTotal, donePct, overdueCount, progressPct]);

  const desktopFiltersNode = (
    <>
      {/* Desktop */}
      <div className="hidden md:flex dashboard-filters flex-row items-center justify-between gap-4 bg-white p-2 md:p-4 rounded-lg shadow-sm">
        <Space wrap className="w-full">
          <Select
            showSearch
            value={filterWeek}
            onChange={setFilterWeek}
            className="filter-select rounded-lg shadow-sm"
            style={{ width: 220 }}
            options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
            placeholder="Chọn tuần làm việc"
          />
          <Select
            value={filterDept}
            onChange={setFilterDept}
            className="filter-select rounded-lg"
            style={{ width: 280 }}
            popupMatchSelectWidth={360}
            options={DEPARTMENT_FILTER_OPTIONS}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            className="filter-select rounded-lg"
            style={{ width: 180 }}
            options={[
              { value: 'all', label: 'Mọi mức độ' },
              { value: 'high', label: '⭐ Quan trọng (3-4)' },
              { value: 'low', label: 'Bình thường (1-2)' },
            ]}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            className="filter-select rounded-lg border-orange-400"
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'in_progress', label: ' Đang Làm' },
              { value: 'overdue', label: ' Quá Hạn' },
              { value: 'completed', label: ' Hoàn Thành' },
              { value: 'ext_1', label: ' Hoàn Thành Gia Hạn 1' },
              { value: 'ext_2', label: ' Hoàn Thành Gia Hạn 2' },
              { value: 'ext_3', label: ' Hoàn Thành Gia Hạn 3' },
            ]}
          />
        </Space>
      </div>
    </>
  );

  // --- MOBILE FILTERS (Tab-specific) ---
  const reportFiltersNode = (
    <div className="block md:hidden bg-white p-2 rounded-lg shadow-sm mb-2">
      <div className="grid grid-cols-2 gap-2">
        <Select
          showSearch
          size="small"
          value={filterWeek}
          onChange={setFilterWeek}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
          placeholder="Chọn tuần"
        />
        <Select
          size="small"
          value={filterDept}
          onChange={setFilterDept}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={DEPARTMENT_FILTER_OPTIONS}
        />
        <Select
          size="small"
          value={filterPriority}
          onChange={setFilterPriority}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: 'Mọi mức độ' },
            { value: 'high', label: '⭐ Quan trọng (3-4)' },
            { value: 'low', label: 'Bình thường (1-2)' },
          ]}
        />
        <Select
          size="small"
          value={filterStatus}
          onChange={setFilterStatus}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'in_progress', label: ' Đang Làm' },
            { value: 'overdue', label: ' Quá Hạn' },
            { value: 'completed', label: ' Hoàn Thành' },
            { value: 'ext_1', label: ' Gia Hạn 1' },
            { value: 'ext_2', label: ' Gia Hạn 2' },
            { value: 'ext_3', label: ' Gia Hạn 3' },
          ]}
        />
      </div>
    </div>
  );

  const alertFiltersNode = (
    <div className="block md:hidden bg-white p-2 rounded-lg shadow-sm mb-2">
      <div className="grid grid-cols-2 gap-2">
        <Select
          showSearch
          size="small"
          value={filterWeek}
          onChange={setFilterWeek}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
          placeholder="Chọn tuần"
        />
        <Select
          size="small"
          value={filterDept}
          onChange={setFilterDept}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={DEPARTMENT_FILTER_OPTIONS}
        />
        <Select
          size="small"
          value={filterPriority}
          onChange={setFilterPriority}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: 'Mọi mức độ' },
            { value: 'high', label: '⭐ Quan trọng (3-4)' },
            { value: 'low', label: 'Bình thường (1-2)' },
          ]}
        />
        <Select
          size="small"
          value={filterStatus}
          onChange={setFilterStatus}
          className="filter-select rounded-sm"
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'in_progress', label: ' Đang Làm' },
            { value: 'overdue', label: ' Quá Hạn' },
            { value: 'completed', label: ' Hoàn Thành' },
            { value: 'ext_1', label: ' Gia Hạn 1' },
            { value: 'ext_2', label: ' Gia Hạn 2' },
            { value: 'ext_3', label: ' Gia Hạn 3' },
          ]}
        />
      </div>
    </div>
  );

  const kpiItems = useMemo(
    () => [
      {
        key: 'total',
        label: 'Tổng công việc',
        shortLabel: 'Tổng CV',
        filterKey: 'total' as const,
        value: displayStats.total,
        icon: FileTextOutlined,
        iconClass: 'text-blue-500',
        valueClass: 'text-[#1e3a8a]',
        cardClass: 'bg-white border-gray-100',
      },
      {
        key: 'completed',
        label: 'Đã hoàn thành',
        shortLabel: 'Hoàn thành',
        filterKey: 'completed' as const,
        value: displayStats.completed,
        icon: CheckCircleOutlined,
        iconClass: 'text-green-500',
        valueClass: 'text-[#10b981]',
        cardClass: 'bg-white border-gray-100',
      },
      {
        key: 'overdue',
        label: 'Quá hạn nộp',
        shortLabel: 'Quá hạn',
        filterKey: 'overdue' as const,
        value: displayStats.overdue,
        icon: ClockCircleOutlined,
        iconClass: 'text-red-600',
        valueClass: 'text-[#dc2626]',
        cardClass: 'bg-red-50 border-red-100',
        labelClass: 'text-red-700 font-medium',
      },
      {
        key: 'priority',
        label: 'Việc quan trọng',
        shortLabel: 'Quan trọng',
        filterKey: 'priority' as const,
        value: displayStats.highPriority,
        icon: FireOutlined,
        iconClass: 'text-orange-600',
        valueClass: 'text-[#ea580c]',
        cardClass: 'bg-orange-50 border-orange-100',
        labelClass: 'text-orange-700 font-medium',
      },
    ],
    [displayStats]
  );

  const kpisNode = (
    <div className="dashboard-kpi-grid">
      {kpiItems.map(item => {
        const Icon = item.icon;
        const isActive = activeKpiFilter === item.filterKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleKpiClick(item.filterKey)}
            className={`dashboard-kpi-card shadow-sm hover:shadow-md transition-shadow text-left w-full ${
              item.cardClass
            } ${isActive ? 'dashboard-kpi-card-active' : ''}`}
          >
            <Icon className={`kpi-icon ${item.iconClass}`} />
            <div className="kpi-body">
              <p className={`kpi-label text-gray-500 line-clamp-1 ${item.labelClass ?? ''}`}>
                <span className="md:hidden">{item.shortLabel}</span>
                <span className="hidden md:inline">{item.label}</span>
              </p>
              <span className={`kpi-value ${item.valueClass}`}>{item.value}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const kpiDrillDownNode =
    activeKpiFilter && kpiDrillDownTasks.length > 0 ? (
      <div ref={kpiListRef}>
        <Card
          title={
            <span className="text-[#1E386B] font-bold text-sm md:text-base">
              {KPI_LIST_TITLES[activeKpiFilter]} ({kpiDrillDownTasks.length})
            </span>
          }
          variant="borderless"
          className="shadow-sm border border-[#1E386B]/15"
          extra={
            <Button type="default" size="small" onClick={() => setActiveKpiFilter(null)} className="font-bold text-[#1E386B]">
              ← Quay lại
            </Button>
          }
          styles={{ body: { padding: 0 } }}
        >
          <div className="hidden md:block p-4">
            <Table
              dataSource={kpiDrillDownTasks}
              columns={buildTaskListColumns(kpiListPage, 8)}
              pagination={{
                current: kpiListPage,
                pageSize: 8,
                onChange: setKpiListPage,
                size: 'small',
                showSizeChanger: false,
              }}
              scroll={{ x: 'max-content', y: LIST_SCROLL_Y }}
              size="middle"
              rowKey="id"
              tableLayout="fixed"
              className="w-full"
              onRow={record => ({ onClick: () => handleRowClick(record) })}
            />
          </div>
          <div className="block md:hidden dashboard-kpi-list-wrap bg-gray-50/50">
            <div className="flex flex-col dashboard-kpi-list-mobile">
              {kpiDrillDownTasks
                .slice((kpiListPage - 1) * 7, kpiListPage * 7)
                .map(task => renderMobileTaskCard(task))}
            </div>
            {kpiDrillDownTasks.length > 7 ? (
              <div className="mt-2 flex justify-center">
                <Pagination
                  current={kpiListPage}
                  pageSize={7}
                  total={kpiDrillDownTasks.length}
                  onChange={setKpiListPage}
                  size="small"
                  showSizeChanger={false}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    ) : activeKpiFilter ? (
      <div ref={kpiListRef}>
        <Card
          variant="borderless"
          className="shadow-sm border border-gray-100"
          extra={
            <Button type="default" size="small" onClick={() => setActiveKpiFilter(null)} className="font-bold text-[#1E386B]">
              ← Quay lại
            </Button>
          }
        >
          <Empty description="Không có công việc trong nhóm này với bộ lọc hiện tại." />
        </Card>
      </div>
    ) : null;

  const listsNode = (
    <div className="space-y-3 md:space-y-5">
      <Card
        title={<span className="text-red-600 font-bold uppercase"><ClockCircleOutlined className="mr-2" />Danh sách việc quá hạn</span>}
        variant="borderless"
        className="shadow-sm border border-red-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-3 md:p-4">
          {displayOverdue.length > 0 ? (
            <Table
              dataSource={displayOverdue}
              columns={overdueColumns}
              pagination={{
                current: overduePage,
                pageSize: LIST_PAGE_SIZE,
                onChange: setOverduePage,
                size: 'small',
                showSizeChanger: false,
                showTotal: total => `Tổng ${total} việc`,
              }}
              scroll={{ x: 'max-content', y: LIST_SCROLL_Y }}
              size="middle"
              rowKey="id"
              tableLayout="fixed"
              className="w-full dashboard-wide-table"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-3 bg-red-50/30">
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 dashboard-kpi-list-mobile">
            {displayOverdue.length > 0 ? displayOverdue.slice((overduePage - 1) * LIST_PAGE_SIZE, overduePage * LIST_PAGE_SIZE).map(task => renderMobileTaskCard(task, 'red')) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
          </div>
          {displayOverdue.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-100 flex justify-center shrink-0">
              <Pagination
                current={overduePage}
                pageSize={LIST_PAGE_SIZE}
                total={displayOverdue.length}
                onChange={setOverduePage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </Card>

      {/* VIỆC ẢNH HƯỞNG CAO */}
      <Card
        title={<span className="text-orange-600 font-bold uppercase"><FireOutlined className="mr-2" />Việc ảnh hưởng cao đang làm (mức 3-4)</span>}
        variant="borderless"
        className="shadow-sm border border-orange-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-3 md:p-4">
          {displayImportant.length > 0 ? (
            <Table
              dataSource={displayImportant}
              columns={importantColumns}
              pagination={{
                current: importantPage,
                pageSize: LIST_PAGE_SIZE,
                onChange: setImportantPage,
                size: 'small',
                showSizeChanger: false,
                showTotal: total => `Tổng ${total} việc`,
              }}
              scroll={{ x: 'max-content', y: LIST_SCROLL_Y }}
              size="middle"
              rowKey="id"
              tableLayout="fixed"
              className="w-full dashboard-wide-table"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Không có công việc quan trọng nào đang làm." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-3 bg-orange-50/30">
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 dashboard-kpi-list-mobile">
            {displayImportant.length > 0 ? displayImportant.slice((importantPage - 1) * LIST_PAGE_SIZE, importantPage * LIST_PAGE_SIZE).map(task => renderMobileTaskCard(task, 'orange')) : <Empty description="Không có công việc quan trọng nào đang làm." />}
          </div>
          {displayImportant.length > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-100 flex justify-center shrink-0">
              <Pagination
                current={importantPage}
                pageSize={LIST_PAGE_SIZE}
                total={displayImportant.length}
                onChange={setImportantPage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const timelineNode = (
    <Card
      title={<span className="text-red-600 font-bold">⚠️ CÁC CÔNG VIỆC VƯỚNG MẮC</span>}
      variant="borderless"
      className="shadow-sm h-full border border-red-100 flex flex-col"
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      {displayIssues.length > 0 ? (
        <div className="flex flex-col h-full">
          {/* Desktop View: Timeline */}
          <div className="hidden md:block flex-1 overflow-y-auto pr-2">
            <Timeline
              items={displayIssues.slice((issuePage - 1) * 3, issuePage * 3).map(issue => ({
                color: issue.status === 'Quá hạn' ? 'red' : 'orange',
                children: (
                  <div
                    className="pb-4 cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-lg transition-colors relative group"
                    onClick={() => handleRowClick(issue)}
                  >
                    <div className="font-bold text-[#1677ff] hover:underline text-sm mb-1">
                      {issue.name}
                    </div>
                    <p className="text-sm text-gray-600 m-0 line-clamp-2">{issue.history}</p>
                    {/* Nút Đã giải quyết */}
                    <div className="mt-2 flex justify-end items-center">
                      <Tag
                        // icon={<CheckOutlined style={{ fontSize: '11px' }} />}
                        className="m-0 bg-green-50 text-green-600 border-none rounded text-[11px] px-2 py-0.5 cursor-pointer hover:bg-green-100 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveIssue(issue.id);
                        }}
                      >
                         Đã Giải quyết
                      </Tag>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>

          {/* Mobile View: Card List */}
          <div className="block md:hidden flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {displayIssues.slice((issuePage - 1) * 3, issuePage * 3).map(issue => (
                <div
                  key={issue.id}
                  onClick={() => handleRowClick(issue)}
                  className="dashboard-mobile-task-card relative bg-white shadow-sm border border-red-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="flex flex-col pl-2">
                    <Text strong className="task-title text-red-600 line-clamp-2">{issue.name}</Text>
                    <p className="text-xs text-gray-600 m-0 line-clamp-2">{issue.history}</p>
                    {/* Nút Đã giải quyết - Mobile */}
                    <div className="mt-2 flex justify-end items-center">
                      <Tag
                        // icon={<CheckOutlined style={{ fontSize: '11px' }} />}
                        className="m-0 bg-green-50 text-green-600 border-none rounded text-[11px] px-2 py-0.5 cursor-pointer hover:bg-green-100 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveIssue(issue.id);
                        }}
                      >
                        Đã Giải quyết
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-gray-100 flex justify-center shrink-0">
            <Pagination
              current={issuePage}
              pageSize={3}
              total={displayIssues.length}
              onChange={(page) => setIssuePage(page)}
              size="small"
              showSizeChanger={false}
            />
          </div>
        </div>
      ) : (
        <Empty description="Mọi thứ đang suôn sẻ, không có vướng mắc nào!" />
      )}
    </Card>
  );

  const chartNode = (
    <Card
      title={chartTitle}
      variant="borderless"
      className="shadow-sm border border-gray-100 dashboard-chart-card"
      extra={
        <Segmented
          size="small"
          value={chartGroupMode}
          onChange={value => setChartGroupMode(value as 'dept' | 'block')}
          options={[
            { label: 'Theo khối', value: 'block' },
            { label: 'Theo phòng ban', value: 'dept' },
          ]}
        />
      }
    >
      {chartDataRecharts.length > 0 ? (
        isMobile ? (
          <div className="dashboard-chart-mobile-layout">
            {chartStatusTotal > 0 ? (
              <div className="dashboard-chart-mobile-summary">
                <div className="dashboard-chart-donut" aria-label={`Tổng ${chartStatusTotal} công việc`}>
                  <div className="dashboard-chart-donut-ring" style={{ background: donutConicGradient }} />
                  <div className="dashboard-chart-donut-center">
                    <div className="dashboard-chart-donut-total">{chartStatusTotal}</div>
                    <div className="dashboard-chart-donut-label">công việc</div>
                  </div>
                </div>
                <div className="dashboard-chart-status-legend dashboard-chart-status-legend--mobile">
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--done">
                    <span className="dashboard-chart-status-dot" />
                    Hoàn thành <strong>{doneCount}</strong>
                  </div>
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--overdue">
                    <span className="dashboard-chart-status-dot" />
                    Quá hạn <strong>{overdueCount}</strong>
                  </div>
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--progress">
                    <span className="dashboard-chart-status-dot" />
                    Đang làm <strong>{progressCount}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="dashboard-chart-mobile-chart">
              <div
                className="dashboard-chart-scroll"
                style={{
                  maxHeight: 260,
                  overflowY: chartDataRecharts.length > 6 ? 'auto' : 'visible',
                }}
              >
                <div style={{ height: chartHeight, minHeight: 200 }} className="dashboard-chart-wrap">
                  <ResponsiveContainer width="100%" height={chartHeight} minHeight={200}>
                    <BarChart
                      layout="vertical"
                      data={chartDataRecharts}
                      margin={{
                        top: 8,
                        right: 8,
                        left: 4,
                        bottom: 8,
                      }}
                      barCategoryGap="18%"
                      barSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        domain={[0, chartMaxValue + 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        label={{
                          value: 'Số công việc',
                          position: 'insideBottom',
                          offset: -2,
                          style: { fontSize: 11, fill: '#9CA3AF' },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={88}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#1E386B', fontWeight: 600 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(30, 56, 107, 0.06)' }}
                        labelFormatter={(_label, payload) => payload?.[0]?.payload?.name ?? _label}
                        formatter={(value: number, name: string) => [`${value} việc`, name]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #F3F4F6',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="Hoàn thành"
                        name="Hoàn thành"
                        fill="#10b981"
                        stackId="status"
                        radius={[0, 0, 0, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Hoàn thành')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                      <Bar
                        dataKey="Đang làm"
                        name="Đang làm"
                        fill="#F38320"
                        stackId="status"
                        radius={[0, 0, 0, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Đang làm')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                      <Bar
                        dataKey="Quá hạn"
                        name="Quá hạn"
                        fill="#ef4444"
                        stackId="status"
                        radius={[0, 4, 4, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Quá hạn')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-chart-desktop-layout">
            {chartStatusTotal > 0 ? (
              <div className="dashboard-chart-desktop-summary">
                <div
                  className="dashboard-chart-donut dashboard-chart-donut--desktop"
                  aria-label={`Tổng ${chartStatusTotal} công việc`}
                >
                  <div className="dashboard-chart-donut-ring" style={{ background: donutConicGradient }} />
                  <div className="dashboard-chart-donut-center">
                    <div className="dashboard-chart-donut-total">{chartStatusTotal}</div>
                    <div className="dashboard-chart-donut-label">công việc</div>
                  </div>
                </div>
                <div className="dashboard-chart-status-legend dashboard-chart-status-legend--desktop">
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--done">
                    <span className="dashboard-chart-status-dot" />
                    Hoàn thành <strong>{doneCount}</strong>
                  </div>
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--overdue">
                    <span className="dashboard-chart-status-dot" />
                    Quá hạn <strong>{overdueCount}</strong>
                  </div>
                  <div className="dashboard-chart-status-legend-item dashboard-chart-status-legend-item--progress">
                    <span className="dashboard-chart-status-dot" />
                    Đang làm <strong>{progressCount}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="dashboard-chart-desktop-chart">
              <div
                className="dashboard-chart-scroll"
                style={{
                  maxHeight: 520,
                  overflowY: chartDataRecharts.length > 6 ? 'auto' : 'visible',
                }}
              >
                <div style={{ height: chartHeight, minHeight: 220 }} className="dashboard-chart-wrap">
                  <ResponsiveContainer width="100%" height={chartHeight} minHeight={220}>
                    <BarChart
                      layout="vertical"
                      data={chartDataRecharts}
                      margin={{
                        top: 8,
                        right: 24,
                        left: 4,
                        bottom: 8,
                      }}
                      barCategoryGap="18%"
                      barSize={14}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        domain={[0, chartMaxValue + 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        label={{
                          value: 'Số công việc',
                          position: 'insideBottom',
                          offset: -2,
                          style: { fontSize: 11, fill: '#9CA3AF' },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={128}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#1E386B', fontWeight: 600 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(30, 56, 107, 0.06)' }}
                        labelFormatter={(_label, payload) => payload?.[0]?.payload?.name ?? _label}
                        formatter={(value: number, name: string) => [`${value} việc`, name]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #F3F4F6',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="Hoàn thành"
                        name="Hoàn thành"
                        fill="#10b981"
                        stackId="status"
                        radius={[0, 0, 0, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Hoàn thành')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                      <Bar
                        dataKey="Đang làm"
                        name="Đang làm"
                        fill="#F38320"
                        stackId="status"
                        radius={[0, 0, 0, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Đang làm')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                      <Bar
                        dataKey="Quá hạn"
                        name="Quá hạn"
                        fill="#ef4444"
                        stackId="status"
                        radius={[0, 4, 4, 0]}
                        cursor="pointer"
                        onClick={handleChartBarClick('Quá hạn')}
                      >
                        <LabelList content={stackTotalLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <Empty description="Không có dữ liệu để hiển thị biểu đồ với bộ lọc hiện tại." />
      )}
    </Card>
  );

  return (
    <Spin spinning={tasksLoading} tip="Đang tải dữ liệu Supabase...">
      <div className="dashboard-container space-y-3 md:space-y-5 bg-gray-50 min-h-screen p-2 md:p-5 relative">
      
      {/* ─── HIỂN THỊ DESKTOP ─── */}
      {!isMobile && (
        <div className="hidden md:block">
          {desktopFiltersNode}
          <div className="mt-6">{kpisNode}</div>
          {kpiDrillDownNode ? <div className="mt-4">{kpiDrillDownNode}</div> : null}
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>{listsNode}</Col>
          </Row>
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>{timelineNode}</Col>
          </Row>
          <Row className="mt-6">
            <Col xs={24}>{chartNode}</Col>
          </Row>
        </div>
      )}

      {/* ─── HIỂN THỊ MOBILE (TABS) ─── */}
      {isMobile && (
        <div className="block md:hidden">
          <Tabs
            centered
            className="mobile-sticky-tabs"
            items={[
              {
                key: '1',
                label: 'Báo cáo',
                children: (
                  <div className="space-y-2">
                    {reportFiltersNode}
                    {kpisNode}
                    {kpiDrillDownNode}
                    {chartNode}
                  </div>
                )
              },
              {
                key: '2',
                label: 'Cảnh báo công việc',
                children: (
                  <div className="space-y-2">
                    {alertFiltersNode}
                    {listsNode}
                    {timelineNode}
                  </div>
                )
              },
              {
                key: '3',
                label: 'CV cần giải quyết',
                children: (
                  <div className="space-y-2 flex flex-col h-full">
                    <Card
                      variant="borderless"
                      className="shadow-sm border border-red-100 flex-1 flex flex-col"
                      styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 } }}
                    >
                      {displayIssues.length > 0 ? (
                        <>
                          <div className="space-y-2 flex-1 overflow-y-auto">
                            {displayIssues.slice((issuePage - 1) * 5, issuePage * 5).map(issue => (
                              <div
                                key={issue.id}
                                onClick={() => handleRowClick(issue)}
                                className="relative bg-white rounded-lg p-3 shadow-sm border border-red-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                <div className="flex items-start justify-between gap-2 pl-2">
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <Text strong className="text-red-600 text-sm leading-tight mb-1 line-clamp-1">{issue.name}</Text>
                                    <p className="text-xs text-gray-600 m-0 line-clamp-1">{issue.history}</p>
                                  </div>
                                  <Tag
                                    className="shrink-0 bg-green-50 text-green-600 border-none text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-semibold cursor-pointer hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResolveIssue(issue.id);
                                    }}
                                  >
                                    Giải
                                  </Tag>
                                </div>
                              </div>
                            ))}
                          </div>
                          {displayIssues.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-red-100 flex justify-center shrink-0">
                              <Pagination
                                current={issuePage}
                                pageSize={5}
                                total={displayIssues.length}
                                onChange={setIssuePage}
                                size="small"
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Empty description="Tuyệt vời! Không có công việc cần xử lý." />
                      )}
                    </Card>
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* --- POPUP TRẠNG THÁI TỪ BIỂU ĐỒ --- */}
      {chartGroupPopup && !chartDrillDown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="bg-[#1E386B] text-white p-4 md:p-5 flex justify-between items-center rounded-t-xl shrink-0">
              <div className="min-w-0 pr-3">
                <h2 className="text-base md:text-lg font-bold truncate">{chartGroupPopup.groupName}</h2>
                <p className="text-xs md:text-sm text-white/80 mt-0.5">
                  Chọn trạng thái · {chartGroupStatusCounts.total} công việc
                </p>
              </div>
              <button
                onClick={() => setChartGroupPopup(null)}
                className="hover:bg-white/20 p-1 rounded transition shrink-0"
                aria-label="Đóng"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {(
                [
                  { status: 'Hoàn thành' as const, color: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-800' },
                  { status: 'Đang làm' as const, color: 'border-orange-200 bg-orange-50 hover:bg-orange-100', dot: 'bg-[#F38320]', text: 'text-[#1E386B]' },
                  { status: 'Quá hạn' as const, color: 'border-red-200 bg-red-50 hover:bg-red-100', dot: 'bg-red-500', text: 'text-red-700' },
                ]
              ).map(item => {
                const count = chartGroupStatusCounts[item.status];
                const disabled = count <= 0;
                return (
                  <button
                    key={item.status}
                    type="button"
                    disabled={disabled}
                    onClick={() => openChartStatusTasks(item.status)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      disabled ? 'opacity-45 cursor-not-allowed border-gray-200 bg-gray-50' : item.color
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${item.dot}`} />
                      <span className={`font-bold text-base ${disabled ? 'text-gray-500' : item.text}`}>
                        {item.status}
                      </span>
                    </span>
                    <span className={`text-lg font-extrabold tabular-nums ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP DANH SÁCH TỪ BIỂU ĐỒ --- */}
      {chartDrillDown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[98vw] md:max-w-[96vw] lg:max-w-[94vw] xl:max-w-[1600px] flex flex-col max-h-[96vh] min-h-[75vh]">
            <div className="bg-[#1E386B] text-white p-4 md:p-5 flex justify-between items-center rounded-t-xl shrink-0">
              <div className="min-w-0 pr-3">
                <h2 className="text-base md:text-lg font-bold truncate">
                  {chartDrillDown.groupName}
                </h2>
                <p className="text-xs md:text-sm text-white/80 mt-0.5">
                  {chartDrillDown.status} · {chartDrillTasks.length} công việc
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="small"
                  className="bg-white/10 text-white border-white/30 hover:!bg-white/20 font-bold"
                  onClick={() => setChartDrillDown(null)}
                >
                  ← Quay lại
                </Button>
                <button
                  onClick={() => {
                    setChartDrillDown(null);
                    setChartGroupPopup(null);
                  }}
                  className="hover:bg-white/20 p-1 rounded transition shrink-0"
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-3 md:p-5 overflow-y-auto min-h-0 flex-1">
              {chartDrillTasks.length > 0 ? (
                <>
                  <div className="hidden md:block chart-drill-table-wrap">
                    <Table
                      className="chart-drill-table w-full"
                      dataSource={chartDrillTasks}
                      columns={buildTaskListColumns(chartDrillPage, 10)}
                      pagination={{
                        current: chartDrillPage,
                        pageSize: 10,
                        onChange: setChartDrillPage,
                        size: 'default',
                        showSizeChanger: false,
                        showTotal: total => `Tổng ${total} việc`,
                      }}
                      size="large"
                      rowKey="id"
                      tableLayout="fixed"
                      scroll={{ x: 'max-content', y: LIST_SCROLL_Y }}
                      onRow={record => ({
                        onClick: () => {
                          handleRowClick(record);
                        },
                      })}
                    />
                  </div>
                  <div className="block md:hidden space-y-2">
                    {chartDrillTasks
                      .slice((chartDrillPage - 1) * 5, chartDrillPage * 5)
                      .map(task => (
                        <div key={task.id} className="space-y-1">
                          <div
                            onClick={() => {
                              handleRowClick(task);
                            }}
                          >
                            {renderMobileTaskCard(
                              task,
                              chartDrillDown.status === 'Quá hạn'
                                ? 'red'
                                : chartDrillDown.status === 'Đang làm'
                                  ? 'orange'
                                  : 'default'
                            )}
                          </div>
                          <div className="flex justify-end items-center gap-2 px-1">
                            {renderCompleteTick(task)}
                            {renderTaskActions(task)}
                          </div>
                        </div>
                      ))}
                    {chartDrillTasks.length > 5 ? (
                      <div className="pt-2 flex justify-center">
                        <Pagination
                          current={chartDrillPage}
                          pageSize={5}
                          total={chartDrillTasks.length}
                          onChange={setChartDrillPage}
                          size="small"
                          showSizeChanger={false}
                        />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <Empty description="Không có công việc liên quan." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT / SỬA TRỰC TIẾP --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[94vh]">
            <div className="bg-[#F38320] text-white p-4 md:p-5 flex flex-wrap justify-between items-start gap-3 rounded-t-xl shrink-0">
              <div className="min-w-0 flex-1 flex items-start gap-3">
                <Button
                  size="small"
                  className="mt-0.5 shrink-0 bg-white/15 text-white border-white/40 hover:!bg-white/25 hover:!text-white hover:!border-white font-bold"
                  onClick={() => setSelectedTask(null)}
                >
                  ← Quay lại
                </Button>
                <div className="min-w-0">
                <p className="text-white/70 text-[10px] md:text-xs m-0 mb-0.5 uppercase tracking-wide">
                  Chi tiết công việc · {selectedTask.department}
                </p>
                <h2 className="text-base md:text-xl font-bold pr-2 m-0 leading-snug line-clamp-2">
                  {selectedTask.name}
                </h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!selectedTask.status.includes('Hoàn thành') ? (
                  <Button
                    type="primary"
                    className="bg-green-600 border-green-600 hover:!bg-green-700"
                    icon={<CheckCircleOutlined />}
                    loading={completingTaskId === selectedTask.id}
                    disabled={supabaseConnected === false}
                    onClick={() => void handleMarkComplete(selectedTask)}
                  >
                    Đã hoàn thành
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  className="bg-[#1E386B] border-[#1E386B]"
                  loading={savingDetail}
                  onClick={handleDetailSave}
                  disabled={supabaseConnected === false}
                >
                  Lưu
                </Button>
                <Popconfirm
                  title="Xoá công việc này trên Supabase?"
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true, loading: deletingTaskId === selectedTask.id }}
                  onConfirm={() => void handleDeleteTask(selectedTask)}
                  disabled={supabaseConnected === false}
                  zIndex={11000}
                  getPopupContainer={() => document.body}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingTaskId === selectedTask.id}
                    disabled={supabaseConnected === false}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="hover:bg-white/20 p-1.5 rounded transition shrink-0"
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5 overflow-y-auto min-h-0 flex-1">
              <Form form={detailForm} layout="vertical" className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <Form.Item
                  name="congViec"
                  label="Công việc"
                  rules={[{ required: true, message: 'Nhập công việc' }]}
                  className="md:col-span-2"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item
                  name="nguoiGiao"
                  label="Người phụ trách"
                  rules={[{ required: true, message: 'Nhập người phụ trách' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="ngayGiao" label="Ngày giao">
                  <Input placeholder="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="ycXong" label="Ngày hoàn thành">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="anhHuong" label="Mức ảnh hưởng">
                  <InputNumber min={1} max={4} className="w-full" />
                </Form.Item>
                <Form.Item name="giaHan1" label="Gia hạn 1">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="giaHan2" label="Gia hạn 2">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="giaHan3" label="Gia hạn 3">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="canLD" label="Cần LĐ tác động">
                  <Select
                    options={[
                      { value: 'Không', label: 'Không' },
                      { value: 'Có', label: 'Có' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="ketQua" label="Kết quả" className="md:col-span-2">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="linkKQ" label="Link kết quả" className="md:col-span-2">
                  <Input placeholder="https://..." />
                </Form.Item>
                <Form.Item name="vuongMac" label="Vướng mắc" className="md:col-span-2">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3 pb-1">
                  <span className="text-sm text-gray-500">Trạng thái:</span>
                  {renderStatus(selectedTask.status)}
                  {selectedTask.ngayHoanThanh ? (
                    <span className="text-sm text-gray-600">
                      Ngày đã hoàn thành: <strong>{selectedTask.ngayHoanThanh}</strong>
                    </span>
                  ) : null}
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}
      </div>
    </Spin>
  );
};

export default Dashboard;
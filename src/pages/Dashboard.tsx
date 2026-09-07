import React, { useState, useMemo, useEffect, useRef, useCallback, startTransition, memo } from 'react';
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
  ConfigProvider,
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
import TaskProgressBar, { clampProgressPercent } from '../components/TaskProgressBar';
import { ORG_BLOCKS } from '../data/orgBlocks';
import {
  buildDashboardBlockChartData,
  buildDashboardChartData,
  buildDashboardStatusSummary,
  invalidateDashboardTasksCache,
  loadDashboardTasks,
  normalizeDashboardChartStatus,
  type DashboardChartRow,
  type DashboardChartStatus,
  type DashboardTask,
} from '../services/dashboardData';
import { deleteDataRow, editDataRow, fetchDataStatus } from '../services/dataApi';
import {
  loadPersonnelSelectOptions,
  mergePersonnelOption,
  mergePersonnelOptions,
  type PersonnelSelectOption,
} from '../services/auxiliaryData';
import PersonnelMultiSelect from '../components/PersonnelMultiSelect';
import TaskDocLinksField from '../components/TaskDocLinksField';
import {
  buildCompleteTaskRow,
  buildTaskDeleteRow,
  buildTaskEditRow,
  hasRowKey,
  hydrateSourceRowKey,
  normalizeTaiLieuLinks,
  normalizeTienDoForForm,
  parseChatMessagesFromRow,
  primaryTaiLieuLink,
  TIEN_DO_EDIT_OPTIONS,
} from '../services/taskData';
import type { TaskRecord } from '../types/task';
import { formatTaskDate, normalizeDisplayDate, parseTaskDate } from '../utils/taskDate';
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

/** Nhãn phòng ban trên trục Y — luôn 1 dòng, không wrap */
function ChartDeptTick(props: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  fill?: string;
  fontSize?: number;
}) {
  const { x = 0, y = 0, payload, fill = '#1E386B', fontSize = 12 } = props;
  const label = payload?.value ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text
        x={-4}
        y={0}
        dy={4}
        textAnchor="end"
        fill={fill}
        fontSize={fontSize}
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
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

type StatusBarChartProps = {
  data: DashboardChartRow[];
  height: number;
  maxValue: number;
  isMobile: boolean;
  stackTotalLabel: (props: StackBarLabelProps) => React.ReactNode;
  onBarClick: (data: { payload?: DashboardChartRow }) => void;
};

/** Memo để mở popup không vẽ lại toàn bộ Recharts (tránh click bị đơ). */
const StatusBarChart = memo(function StatusBarChart({
  data,
  height,
  maxValue,
  isMobile,
  stackTotalLabel,
  onBarClick,
}: StatusBarChartProps) {
  const minHeight = isMobile ? 200 : 220;
  return (
    <div style={{ height, minHeight }} className="dashboard-chart-wrap">
      <ResponsiveContainer width="100%" height={height} minHeight={minHeight}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 8,
            right: isMobile ? 8 : 24,
            left: 4,
            bottom: 8,
          }}
          barCategoryGap="18%"
          barSize={isMobile ? 12 : 14}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis
            type="number"
            allowDecimals={false}
            domain={[0, maxValue + 1]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
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
            width={isMobile ? 130 : 168}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={<ChartDeptTick fontSize={isMobile ? 10 : 12} />}
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
            isAnimationActive={false}
          />
          <Bar
            dataKey="Hoàn thành"
            name="Hoàn thành"
            fill="#10b981"
            stackId="status"
            radius={[0, 0, 0, 0]}
            cursor="pointer"
            isAnimationActive={false}
            onClick={onBarClick}
          />
          <Bar
            dataKey="Đang làm"
            name="Đang làm"
            fill="#F38320"
            stackId="status"
            radius={[0, 0, 0, 0]}
            cursor="pointer"
            isAnimationActive={false}
            onClick={onBarClick}
          />
          <Bar
            dataKey="Quá hạn"
            name="Quá hạn"
            fill="#ef4444"
            stackId="status"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            isAnimationActive={false}
            onClick={onBarClick}
          >
            <LabelList content={stackTotalLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

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
  const [personnelOptions, setPersonnelOptions] = useState<PersonnelSelectOption[]>([]);
  const [detailForm] = Form.useForm();

  const dashboardAssigneeOptions = useMemo(
    () =>
      mergePersonnelOption(
        personnelOptions,
        selectedTask?.assignee === '—' ? '' : selectedTask?.assignee
      ),
    [personnelOptions, selectedTask?.assignee]
  );

  const dashboardFollowerOptions = useMemo(
    () => mergePersonnelOptions(personnelOptions, selectedTask?.followers),
    [personnelOptions, selectedTask?.followers]
  );

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

  const handleRowClick = (record: DashboardTask) => {
    setSelectedTask(record);
  };

  const openTaskEdit = (task: DashboardTask) => {
    // Giữ modal danh sách mở phía dưới; mở form sửa trực tiếp
    setSelectedTask(task);
  };

  useEffect(() => {
    // Form chỉ mount khi có selectedTask — không gọi API form khi chưa gắn
    if (!selectedTask) return;

    detailForm.setFieldsValue({
      congViec: selectedTask.name,
      nguoiGiao: selectedTask.assignee === '—' ? '' : selectedTask.assignee,
      nguoiTheoDoi: selectedTask.followers ?? [],
      ngayGiao: parseTaskDate(selectedTask.ngayGiao) ?? undefined,
      ycXong: parseTaskDate(selectedTask.ycXong) ?? undefined,
      giaHan1: parseTaskDate(selectedTask.giaHan1) ?? undefined,
      giaHan2: parseTaskDate(selectedTask.giaHan2) ?? undefined,
      giaHan3: parseTaskDate(selectedTask.giaHan3) ?? undefined,
      ketQua: selectedTask.ketQua || selectedTask.desc,
      taiLieuLinks: selectedTask.taiLieuLinks?.length
        ? selectedTask.taiLieuLinks
        : selectedTask.linkKQ || selectedTask.tenTaiLieu
          ? [{ ten: selectedTask.tenTaiLieu || '', link: selectedTask.linkKQ || '' }]
          : [{ ten: '', link: '' }],
      tienDo: normalizeTienDoForForm(selectedTask.tienDo || selectedTask.status),
      tienDoPhanTram: selectedTask.tienDoPhanTram ?? 0,
      vuongMac: selectedTask.vuongMac || selectedTask.history,
      canLD: selectedTask.canLD || 'Không',
      noiDungCanTacDong: selectedTask.noiDungCanTacDong || '',
      anhHuong: selectedTask.impact || 1,
    });
    // Chỉ nạp lại khi đổi công việc (theo id), tránh ghi đè khi đang gõ
  }, [selectedTask?.id, detailForm]);

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
      tienDoPhanTram: 100,
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
      invalidateDashboardTasksCache();
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
      invalidateDashboardTasksCache();
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

        const nextTienDo =
          (values.tienDo as string) || selectedTask.tienDo || 'Đang thực hiện';
        const nextPercent =
          nextTienDo === 'Hoàn thành'
            ? Math.max(clampProgressPercent(values.tienDoPhanTram), 100)
            : clampProgressPercent(values.tienDoPhanTram);
        const taiLieuLinks = normalizeTaiLieuLinks(
          (values.taiLieuLinks as Array<{ ten?: string; link?: string }> | undefined) ?? []
        );
        const primaryLink = primaryTaiLieuLink(taiLieuLinks);
        const updatedTask: TaskRecord = {
          stt: 0,
          kyBaoCao: selectedTask.week,
          congViec: values.congViec as string,
          nguoiGiao: values.nguoiGiao as string,
          nguoiTheoDoi: (values.nguoiTheoDoi as string[] | undefined) ?? [],
          ngayGiao: formatTaskDate(values.ngayGiao),
          ycXong: formatTaskDate(values.ycXong),
          giaHan1: formatTaskDate(values.giaHan1),
          giaHan2: formatTaskDate(values.giaHan2),
          giaHan3: formatTaskDate(values.giaHan3),
          ketQua: (values.ketQua as string) || '',
          linkKQ: primaryLink.link,
          tenTaiLieu: primaryLink.ten,
          taiLieuLinks,
          tienDo: nextTienDo,
          tienDoPhanTram: nextPercent,
          trangThai: '',
          ngayGioHoanThanh:
            nextTienDo === 'Hoàn thành'
              ? selectedTask.ngayHoanThanh || formatTaskDate(dayjs())
              : '',
          vuongMac: (values.vuongMac as string) || '',
          canLD: (values.canLD as string) || 'Không',
          noiDungCanTacDong: (values.noiDungCanTacDong as string) || '',
          anhHuong: Number(values.anhHuong) || 1,
          chatMessages: selectedTask.sourceRow
            ? parseChatMessagesFromRow(selectedTask.sourceRow)
            : [],
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
          await reloadDashboardTasks();
          message.success('Đã cập nhật Supabase.');
          invalidateDashboardTasksCache();
          // Lưu xong tự thoát form chi tiết
          setSelectedTask(null);
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
    title: (
      <Tooltip title="Hoàn thành">
        <span>HT</span>
      </Tooltip>
    ),
    key: 'complete',
    width: 48,
    align: 'center' as const,
    className: 'dashboard-col-complete',
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
  const [filterPersonnel, setFilterPersonnel] = useState<string>('all');
  const [filterNgayGiaoRange, setFilterNgayGiaoRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
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
      if (filterStatus === 'in_progress') {
        matchStatus =
          task.status === 'Đang làm' ||
          task.status === 'Đang thực hiện' ||
          task.status === 'Tạm dừng';
      }
      if (filterStatus === 'overdue') matchStatus = task.status === 'Quá hạn';
      if (filterStatus === 'completed') matchStatus = task.status.includes('Hoàn thành');
      if (filterStatus === 'ext_1') matchStatus = task.status === 'Hoàn thành gia hạn 1';
      if (filterStatus === 'ext_2') matchStatus = task.status === 'Hoàn thành gia hạn 2';
      if (filterStatus === 'ext_3') matchStatus = task.status === 'Hoàn thành gia hạn 3';

      let matchPersonnel = true;
      if (filterPersonnel !== 'all') {
        matchPersonnel = (task.assignee || '').trim() === filterPersonnel;
      }

      let matchNgayGiao = true;
      if (filterNgayGiaoRange?.[0] || filterNgayGiaoRange?.[1]) {
        const parsed = parseTaskDate(task.ngayGiao);
        if (!parsed) {
          matchNgayGiao = false;
        } else {
          const day = parsed.startOf('day');
          if (filterNgayGiaoRange[0] && day.isBefore(filterNgayGiaoRange[0].startOf('day'))) {
            matchNgayGiao = false;
          }
          if (filterNgayGiaoRange[1] && day.isAfter(filterNgayGiaoRange[1].startOf('day'))) {
            matchNgayGiao = false;
          }
        }
      }

      return matchWeek && matchDept && matchPriority && matchStatus && matchPersonnel && matchNgayGiao;
    });
  }, [
    allTasks,
    filterWeek,
    filterDept,
    filterPriority,
    filterStatus,
    filterPersonnel,
    filterNgayGiaoRange,
  ]);

  const dashboardPersonnelFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const opt of personnelOptions) {
      if (opt.value.trim()) names.add(opt.value.trim());
    }
    for (const task of allTasks) {
      const name = (task.assignee || '').trim();
      if (name && name !== '—') names.add(name);
    }
    return [
      { value: 'all', label: 'Tất cả nhân sự' },
      ...Array.from(names)
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map(name => ({ value: name, label: name })),
    ];
  }, [personnelOptions, allTasks]);

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
    if (status === 'Hủy' || status === 'Huỷ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Hủy
        </span>
      );
    }
    if (status === 'Tạm dừng') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tạm dừng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-[#1E386B] rounded-full text-sm font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F38320]" /> Đang thực hiện
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
    if (status === 'Hủy' || status === 'Huỷ') {
      return <span className="task-status task-status--cancelled">Hủy</span>;
    }
    if (status === 'Tạm dừng') {
      return <span className="task-status task-status--paused">Tạm dừng</span>;
    }
    return <span className="task-status task-status--progress">Đang thực hiện</span>;
  };

  const renderMobileTaskCard = (task: DashboardTask, accent?: 'red' | 'orange' | 'default') => {
    const borderClass =
      accent === 'red' ? 'border-red-200' : accent === 'orange' ? 'border-orange-200' : 'border-slate-200';
    const titleClass =
      accent === 'red' ? 'text-red-700' : accent === 'orange' ? 'text-[#0047AB]' : 'text-[#0F172A]';
    const deadlineClass = accent === 'red' ? 'text-red-600 font-semibold' : 'text-slate-500';

    return (
      <div
        key={task.id}
        onClick={() => handleRowClick(task)}
        className={`dashboard-mobile-task-card relative bg-white shadow-sm rounded-xl border ${borderClass} overflow-hidden active:scale-[0.98] transition-all cursor-pointer`}
      >
        {accent === 'red' ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" /> : null}
        {accent === 'orange' ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F38320]" /> : null}
        <div className={accent ? 'pl-2' : ''}>
          <div className="flex items-start justify-between gap-2">
            <p className={`task-title ${titleClass} font-bold text-sm line-clamp-2 flex-1 m-0`} title={task.name}>
              {task.name}
            </p>
            {/* Quick Complete Checkbox (Top-right) */}
            <div className="shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
              {renderCompleteTick(task)}
            </div>
          </div>
          <div className="task-meta-row mt-1">
            <Tag className="task-tag dept-name-tag m-0 text-xs" title={task.department}>
              {task.department}
            </Tag>
            <span className={`task-deadline text-xs ${deadlineClass}`}>Hạn: {task.deadline}</span>
          </div>
          <div className="mt-2">
            <TaskProgressBar value={task.tienDoPhanTram} className="max-w-none" />
          </div>
          <div className="task-footer mt-2 flex items-center justify-between text-xs">
            <span className="task-assignee flex items-center gap-1 text-slate-600 font-medium" title={task.assignee}>
              <User size={12} className="shrink-0 text-slate-400" />
              {task.assignee}
            </span>
            <span title={task.status}>{renderStatusCompact(task.status)}</span>
          </div>
          {task.impact >= 3 ? (
            <div className="task-impact mt-1" aria-label={`Mức ảnh hưởng ${task.impact}`}>
              {[...Array(4)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < task.impact ? 'fill-[#F38320] text-[#0047AB]' : 'text-gray-300'}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderImpact = (level: number) => (
    <div className="flex gap-0.5 justify-center">
      {[...Array(4)].map((_, i) => (
        <Star key={i} size={13} className={i < level ? 'fill-[#F38320] text-[#1E386B]' : 'text-gray-300'} />
      ))}
    </div>
  );

  const LIST_PAGE_SIZE = 10;
  const LIST_SCROLL_Y = 720;

  const sttColumn = (page: number, pageSize: number) => ({
    title: 'STT',
    key: 'stt',
    width: 56,
    align: 'center' as const,
    render: (_: unknown, __: DashboardTask, index: number) => (
      <span className="font-bold text-[#1E386B] text-sm">{(page - 1) * pageSize + index + 1}</span>
    ),
  });

  const renderDeptTag = (text: string) => (
    <Tag className="dept-name-tag m-0" title={text}>
      {text}
    </Tag>
  );

  const renderTaskNameCell = (
    text: string,
    record: DashboardTask,
    options?: { danger?: boolean }
  ) => (
    <Tooltip title={record.desc || text} placement="topLeft">
      <span
        className={`dashboard-task-name${options?.danger ? ' dashboard-task-name--danger' : ''}`}
      >
        {text}
      </span>
    </Tooltip>
  );

  const taskNameColumn = (options?: { danger?: boolean; width?: number }) => ({
    title: 'CÔNG VIỆC',
    dataIndex: 'name',
    key: 'name',
    width: options?.width ?? 380,
    className: 'dashboard-col-task',
    render: (text: string, record: DashboardTask) =>
      renderTaskNameCell(text, record, { danger: options?.danger }),
  });

  const overdueColumns = [
    completeColumn,
    sttColumn(overduePage, LIST_PAGE_SIZE),
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      ellipsis: true,
      render: (text: string) => renderDeptTag(text),
    },
    taskNameColumn({ danger: true, width: 380 }),
    {
      title: 'NGƯỜI PHỤ TRÁCH',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 108,
      ellipsis: true,
      className: 'dashboard-col-assignee',
      render: (text: string) => <span className="text-sm font-semibold text-[#0f274d]">{text}</span>,
    },
    {
      title: (
        <Tooltip title="Ngày hoàn thành">
          <span>NGÀY HT</span>
        </Tooltip>
      ),
      dataIndex: 'deadline',
      key: 'deadline',
      width: 96,
      align: 'center' as const,
      className: 'dashboard-col-deadline',
      render: (date: string) => <strong className="text-red-600 text-sm">{date}</strong>,
    },
    {
      title: 'TIẾN ĐỘ CV',
      dataIndex: 'tienDoPhanTram',
      key: 'tienDoPhanTram',
      width: 120,
      align: 'center' as const,
      render: (value: number) => <TaskProgressBar value={value} />,
    },
  ];

  const buildTaskListColumns = (page: number, pageSize: number) => [
    completeColumn,
    sttColumn(page, pageSize),
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text: string) => renderDeptTag(text),
    },
    taskNameColumn({ width: 360 }),
    {
      title: 'NGƯỜI PHỤ TRÁCH',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 108,
      ellipsis: true,
      className: 'dashboard-col-assignee',
      render: (text: string) => <span className="chart-drill-cell-text">{text}</span>,
    },
    {
      title: (
        <Tooltip title="Ngày hoàn thành">
          <span>NGÀY HT</span>
        </Tooltip>
      ),
      dataIndex: 'deadline',
      key: 'deadline',
      width: 96,
      align: 'center' as const,
      className: 'dashboard-col-deadline',
      render: (date: string) => <strong className="chart-drill-deadline">{date}</strong>,
    },
    {
      title: 'TIẾN ĐỘ CV',
      dataIndex: 'tienDoPhanTram',
      key: 'tienDoPhanTram',
      width: 120,
      align: 'center' as const,
      render: (value: number) => <TaskProgressBar value={value} />,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => renderStatus(status),
    },
    {
      title: '',
      key: 'actions',
      width: 52,
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
      width: 120,
      ellipsis: true,
      render: (text: string) => renderDeptTag(text),
    },
    taskNameColumn({ width: 380 }),
    {
      title: 'NGƯỜI PHỤ TRÁCH',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 108,
      ellipsis: true,
      className: 'dashboard-col-assignee',
      render: (text: string) => <span className="text-sm font-semibold text-[#0f274d]">{text}</span>,
    },
    {
      title: (
        <Tooltip title="Ngày hoàn thành">
          <span>NGÀY HT</span>
        </Tooltip>
      ),
      dataIndex: 'deadline',
      key: 'deadline',
      width: 96,
      align: 'center' as const,
      className: 'dashboard-col-deadline',
      render: (date: string) => <strong className="text-sm text-[#1E386B]">{date}</strong>,
    },
    {
      title: 'TIẾN ĐỘ CV',
      dataIndex: 'tienDoPhanTram',
      key: 'tienDoPhanTram',
      width: 120,
      align: 'center' as const,
      render: (value: number) => <TaskProgressBar value={value} />,
    },
    {
      title: (
        <Tooltip title="Mức độ ảnh hưởng">
          <span>ẢH</span>
        </Tooltip>
      ),
      dataIndex: 'impact',
      key: 'impact',
      width: 88,
      align: 'center' as const,
      className: 'dashboard-col-impact',
      render: (impact: number) => renderImpact(impact),
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
  // Khi breakpoint chưa hydrate (undefined), mặc định mobile để tránh flash desktop
  const isMobile = screens.md === false || screens.md === undefined;

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

  const openChartGroupPopup = useCallback((data: { payload?: DashboardChartRow }) => {
    const row = data?.payload;
    if (!row?.deptKey) return;
    startTransition(() => {
      setChartDrillDown(null);
      setChartGroupPopup({
        groupKey: row.deptKey,
        groupName: row.name,
      });
    });
  }, []);

  const openChartStatusTasks = useCallback(
    (status: DashboardChartStatus) => {
      if (!chartGroupPopup) return;
      if (!chartGroupStatusCounts[status]) return;
      startTransition(() => {
        setChartDrillDown({
          ...chartGroupPopup,
          status,
        });
      });
    },
    [chartGroupPopup, chartGroupStatusCounts]
  );

  const handleChartBarClick = useCallback(
    (data: { payload?: DashboardChartRow }) => {
      openChartGroupPopup(data);
    },
    [openChartGroupPopup]
  );

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
      <div className="hidden md:flex dashboard-filters flex-row items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-xl shadow-sm">
        <Space wrap size={[10, 10]} className="w-full">
          <Select
            showSearch
            value={filterWeek}
            onChange={setFilterWeek}
            className="filter-select rounded-lg shadow-sm"
            style={{ width: 260 }}
            options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
            placeholder="Chọn tuần làm việc"
          />
          <Select
            value={filterDept}
            onChange={setFilterDept}
            className="filter-select rounded-lg"
            style={{ width: 300 }}
            popupMatchSelectWidth={360}
            options={DEPARTMENT_FILTER_OPTIONS}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            className="filter-select rounded-lg"
            style={{ width: 210 }}
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
            style={{ width: 250 }}
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
          <Select
            showSearch
            optionFilterProp="label"
            value={filterPersonnel}
            onChange={setFilterPersonnel}
            className="filter-select rounded-lg"
            style={{ width: 240 }}
            options={dashboardPersonnelFilterOptions}
            placeholder="Nhân sự"
          />
          <DatePicker.RangePicker
            className="filter-select rounded-lg"
            format="DD/MM/YYYY"
            value={filterNgayGiaoRange}
            onChange={dates =>
              setFilterNgayGiaoRange(dates ? [dates[0] ?? null, dates[1] ?? null] : null)
            }
            placeholder={['Ngày giao từ', 'Đến ngày']}
            allowEmpty={[true, true]}
          />
        </Space>
      </div>
    </>
  );

  // --- MOBILE FILTERS (Tab-specific) ---
  const reportFiltersNode = (
    <div className="block md:hidden dashboard-mobile-filters mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select
          showSearch
          value={filterWeek}
          onChange={setFilterWeek}
          className="filter-select w-full"
          options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
          placeholder="Chọn tuần"
          popupMatchSelectWidth={false}
        />
        <Select
          value={filterDept}
          onChange={setFilterDept}
          className="filter-select w-full"
          options={DEPARTMENT_FILTER_OPTIONS}
          popupMatchSelectWidth={false}
        />
        <Select
          value={filterPriority}
          onChange={setFilterPriority}
          className="filter-select w-full"
          options={[
            { value: 'all', label: 'Mọi mức độ' },
            { value: 'high', label: '⭐ Quan trọng (3-4)' },
            { value: 'low', label: 'Bình thường (1-2)' },
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          className="filter-select w-full"
          popupMatchSelectWidth={false}
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
        <div className="sm:col-span-2">
          <Select
            showSearch
            optionFilterProp="label"
            value={filterPersonnel}
            onChange={setFilterPersonnel}
            className="filter-select w-full"
            options={dashboardPersonnelFilterOptions}
            placeholder="Tất cả nhân sự"
            popupMatchSelectWidth={false}
          />
        </div>
        <div className="sm:col-span-2">
          <DatePicker.RangePicker
            className="w-full"
            format="DD/MM/YYYY"
            value={filterNgayGiaoRange}
            onChange={dates =>
              setFilterNgayGiaoRange(dates ? [dates[0] ?? null, dates[1] ?? null] : null)
            }
            placeholder={['Ngày giao từ', 'Đến ngày']}
            allowEmpty={[true, true]}
          />
        </div>
      </div>
    </div>
  );

  const alertFiltersNode = (
    <div className="block md:hidden dashboard-mobile-filters mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select
          showSearch
          value={filterWeek}
          onChange={setFilterWeek}
          className="filter-select w-full"
          options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
          placeholder="Chọn tuần"
          popupMatchSelectWidth={false}
        />
        <Select
          value={filterDept}
          onChange={setFilterDept}
          className="filter-select w-full"
          options={DEPARTMENT_FILTER_OPTIONS}
          popupMatchSelectWidth={false}
        />
        <Select
          value={filterPriority}
          onChange={setFilterPriority}
          className="filter-select w-full"
          options={[
            { value: 'all', label: 'Mọi mức độ' },
            { value: 'high', label: '⭐ Quan trọng (3-4)' },
            { value: 'low', label: 'Bình thường (1-2)' },
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          className="filter-select w-full"
          popupMatchSelectWidth={false}
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
        iconClass: 'text-[#0047AB]',
        valueClass: 'text-[#0047AB]',
        cardClass: 'bg-white border-blue-100',
      },
      {
        key: 'completed',
        label: 'Đã hoàn thành',
        shortLabel: 'Hoàn thành',
        filterKey: 'completed' as const,
        value: displayStats.completed,
        icon: CheckCircleOutlined,
        iconClass: 'text-emerald-500',
        valueClass: 'text-[#10b981]',
        cardClass: 'bg-white border-emerald-100',
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
        iconClass: 'text-[#F38320]',
        valueClass: 'text-[#F38320]',
        cardClass: 'bg-orange-50/70 border-orange-100',
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

  const overdueNode = (
    <Card
      title={<span className="text-red-600 font-bold uppercase text-lg md:text-xl tracking-wide"><ClockCircleOutlined className="mr-2" />Danh sách việc quá hạn</span>}
      variant="borderless"
      className="shadow-sm border border-red-100 dashboard-list-card h-full"
      styles={{ body: { padding: 0 }, header: { minHeight: 56, paddingInline: 20 } }}
    >
      {/* Desktop View: Table */}
      <div className="hidden md:block p-4 md:p-5">
        {displayOverdue.length > 0 ? (
          <Table
            dataSource={displayOverdue}
            columns={overdueColumns}
            pagination={{
              current: overduePage,
              pageSize: LIST_PAGE_SIZE,
              onChange: setOverduePage,
              size: 'default',
              showSizeChanger: false,
              showTotal: total => `Tổng ${total} việc`,
            }}
            scroll={{ x: 1020, y: LIST_SCROLL_Y }}
            size="small"
            rowKey="id"
            tableLayout="fixed"
            className="w-full dashboard-wide-table"
            onRow={(record) => ({ onClick: () => handleRowClick(record) })}
          />
        ) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
      </div>

      {/* Mobile View: Card List */}
      <div className="block md:hidden p-3 bg-red-50/30">
        <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1 dashboard-kpi-list-mobile dashboard-scroll">
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
  );

  const importantNode = (
    <Card
      title={<span className="text-orange-600 font-bold uppercase text-lg md:text-xl tracking-wide"><FireOutlined className="mr-2" />Việc ảnh hưởng cao đang làm (mức 3-4)</span>}
      variant="borderless"
      className="shadow-sm border border-orange-100 dashboard-list-card h-full"
      styles={{ body: { padding: 0 }, header: { minHeight: 56, paddingInline: 20 } }}
    >
      {/* Desktop View: Table */}
      <div className="hidden md:block p-4 md:p-5">
        {displayImportant.length > 0 ? (
          <Table
            dataSource={displayImportant}
            columns={importantColumns}
            pagination={{
              current: importantPage,
              pageSize: LIST_PAGE_SIZE,
              onChange: setImportantPage,
              size: 'default',
              showSizeChanger: false,
              showTotal: total => `Tổng ${total} việc`,
            }}
            scroll={{ x: 1100, y: LIST_SCROLL_Y }}
            size="small"
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
  );

  const timelineNode = (
    <Card
      title={<span className="text-red-600 font-bold">⚠️ CÁC CÔNG VIỆC VƯỚNG MẮC</span>}
      variant="borderless"
      className="shadow-sm h-full min-h-[320px] border border-red-100 flex flex-col"
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      {displayIssues.length > 0 ? (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 dashboard-scroll">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayIssues.slice((issuePage - 1) * 6, issuePage * 6).map(issue => {
                const overdue = issue.status === 'Quá hạn';
                return (
                  <div
                    key={issue.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(issue)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(issue);
                      }
                    }}
                    className={`dashboard-issue-card group relative flex flex-col gap-2 rounded-xl border bg-white p-3 pl-3.5 shadow-sm cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                      overdue
                        ? 'border-red-200 hover:border-red-300'
                        : 'border-orange-200 hover:border-orange-300'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${
                        overdue ? 'bg-red-500' : 'bg-[#F38320]'
                      }`}
                      aria-hidden
                    />
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-0.5 shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          overdue ? 'border-red-400 bg-red-50' : 'border-orange-400 bg-orange-50'
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`m-0 font-bold text-sm leading-snug line-clamp-2 group-hover:underline ${
                            overdue ? 'text-red-600' : 'text-[#1E386B]'
                          }`}
                        >
                          {issue.name}
                        </p>
                        {issue.history ? (
                          <p className="m-0 mt-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {issue.history}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <Tag
                        className={`m-0 text-xs font-bold uppercase tracking-wide border-none px-2 py-0.5 ${
                          overdue
                            ? 'bg-red-50 text-red-600'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {overdue ? 'Quá hạn' : 'Vướng mắc'}
                      </Tag>
                      <button
                        type="button"
                        className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 min-h-9"
                        onClick={e => {
                          e.stopPropagation();
                          handleResolveIssue(issue.id);
                        }}
                      >
                        Đã Giải quyết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center shrink-0">
            <Pagination
              current={issuePage}
              pageSize={6}
              total={displayIssues.length}
              onChange={page => setIssuePage(page)}
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
      className="shadow-sm border border-gray-100 dashboard-chart-card h-full"
      extra={
        <Segmented
          size="small"
          value={chartGroupMode}
          onChange={value => {
            startTransition(() => {
              setChartGroupMode(value as 'dept' | 'block');
            });
          }}
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
                <StatusBarChart
                  data={chartDataRecharts}
                  height={chartHeight}
                  maxValue={chartMaxValue}
                  isMobile
                  stackTotalLabel={stackTotalLabel}
                  onBarClick={handleChartBarClick}
                />
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
                <StatusBarChart
                  data={chartDataRecharts}
                  height={chartHeight}
                  maxValue={chartMaxValue}
                  isMobile={false}
                  stackTotalLabel={stackTotalLabel}
                  onBarClick={handleChartBarClick}
                />
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
    <>
    <Spin spinning={tasksLoading} tip="Đang tải dữ liệu Supabase...">
      <div className="dashboard-container space-y-4 md:space-y-6 bg-gray-50 min-h-0 md:min-h-screen p-3 md:p-6 relative">
      
      {/* ─── HIỂN THỊ DESKTOP ─── */}
      {!isMobile && (
        <div className="hidden md:block">
          {desktopFiltersNode}
          <div className="mt-6">{kpisNode}</div>
          {kpiDrillDownNode ? <div className="mt-4">{kpiDrillDownNode}</div> : null}
          <Row gutter={[16, 16]} className="mt-6 items-stretch">
            <Col xs={24} lg={12}>{chartNode}</Col>
            <Col xs={24} lg={12}>{timelineNode}</Col>
          </Row>
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>{importantNode}</Col>
          </Row>
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>{overdueNode}</Col>
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
                    {timelineNode}
                    {importantNode}
                    {overdueNode}
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
                          <div className="grid grid-cols-1 gap-2.5 flex-1 overflow-y-auto dashboard-scroll pr-0.5">
                            {displayIssues.slice((issuePage - 1) * 6, issuePage * 6).map(issue => {
                              const overdue = issue.status === 'Quá hạn';
                              return (
                                <div
                                  key={issue.id}
                                  onClick={() => handleRowClick(issue)}
                                  className={`dashboard-issue-card relative flex flex-col gap-2 rounded-xl border bg-white p-3 pl-3.5 shadow-sm cursor-pointer active:scale-[0.99] transition-transform ${
                                    overdue ? 'border-red-200' : 'border-orange-200'
                                  }`}
                                >
                                  <span
                                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${
                                      overdue ? 'bg-red-500' : 'bg-[#F38320]'
                                    }`}
                                    aria-hidden
                                  />
                                  <p
                                    className={`m-0 font-bold text-sm leading-snug line-clamp-2 ${
                                      overdue ? 'text-red-600' : 'text-[#1E386B]'
                                    }`}
                                  >
                                    {issue.name}
                                  </p>
                                  {issue.history ? (
                                    <p className="m-0 text-xs text-gray-600 line-clamp-2">{issue.history}</p>
                                  ) : null}
                                  <div className="flex items-center justify-between gap-2">
                                    <Tag
                                      className={`m-0 text-xs font-bold uppercase border-none px-2 py-0.5 ${
                                        overdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-700'
                                      }`}
                                    >
                                      {overdue ? 'Quá hạn' : 'Vướng mắc'}
                                    </Tag>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 min-h-9"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleResolveIssue(issue.id);
                                      }}
                                    >
                                      Đã Giải quyết
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {displayIssues.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-red-100 flex justify-center shrink-0">
                              <Pagination
                                current={issuePage}
                                pageSize={6}
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
      </div>
    </Spin>

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
                type="button"
                onClick={() => setChartGroupPopup(null)}
                className="dashboard-modal-close-btn text-white"
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
                  type="button"
                  onClick={() => {
                    setChartDrillDown(null);
                    setChartGroupPopup(null);
                  }}
                  className="dashboard-modal-close-btn text-white"
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
          <ConfigProvider theme={{ token: { zIndexPopupBase: 11000 } }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[96vw] h-[94vh] flex flex-col">
            <div className="bg-[#F38320] text-white p-3 md:p-5 flex flex-wrap justify-between items-center gap-2 rounded-t-xl shrink-0">
              <div className="min-w-0 flex-1 flex items-center gap-2 md:gap-3">
                <Button
                  size="small"
                  className="shrink-0 bg-white/15 text-white border-white/40 hover:!bg-white/25 hover:!text-white hover:!border-white font-bold"
                  onClick={() => setSelectedTask(null)}
                >
                  ← Quay lại
                </Button>
                <div className="min-w-0 hidden sm:block">
                <p className="text-white/70 text-[10px] md:text-xs m-0 mb-0.5 uppercase tracking-wide">
                  Chi tiết công việc · {selectedTask.department}
                </p>
                <h2 className="text-base md:text-xl font-bold pr-2 m-0 leading-snug line-clamp-2">
                  {selectedTask.name}
                </h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">
                <div className="task-detail-complete-header flex items-center gap-1.5">
                  <TaskCompleteTick
                    completed={selectedTask.status.includes('Hoàn thành')}
                    loading={completingTaskId === selectedTask.id}
                    disabled={supabaseConnected === false}
                    onComplete={() => void handleMarkComplete(selectedTask)}
                    className="task-complete-tick--on-orange"
                  />
                  <span className="text-white text-sm font-semibold hidden md:inline select-none">
                    {selectedTask.status.includes('Hoàn thành') ? 'Đã hoàn thành' : 'Hoàn thành'}
                  </span>
                </div>
                <Button
                  type="primary"
                  className="bg-[#1E386B] border-[#1E386B] hidden sm:inline-flex"
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
                  zIndex={12000}
                  getPopupContainer={() => document.body}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingTaskId === selectedTask.id}
                    disabled={supabaseConnected === false}
                    className="px-2 md:px-4"
                  >
                    <span className="hidden sm:inline">Xóa</span>
                  </Button>
                </Popconfirm>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="dashboard-modal-close-btn text-white"
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="sm:hidden px-3 pt-2 pb-1 border-b border-slate-100 bg-white shrink-0">
              <p className="text-slate-500 text-[10px] m-0 uppercase tracking-wide">
                {selectedTask.department}
              </p>
              <h2 className="text-sm font-bold m-0 leading-snug line-clamp-2 text-[#0f274d]">
                {selectedTask.name}
              </h2>
            </div>

            <div className="overflow-y-auto min-h-0 flex-1 bg-white border-t border-slate-200">
              <Form
                form={detailForm}
                layout="vertical"
                size="large"
                className="task-detail-form px-4 py-3 md:px-6 md:py-4 pb-24 sm:pb-4"
              >
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-6 gap-y-3">
                  <div className="xl:col-span-7 space-y-3">
                    <section className="task-form-panel">
                      <p className="task-form-section-title">1. Nội dung</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <Form.Item
                          name="congViec"
                          label="Công việc"
                          rules={[{ required: true, message: 'Nhập công việc' }]}
                          className="sm:col-span-2"
                        >
                          <Input.TextArea rows={3} placeholder="Mô tả công việc" />
                        </Form.Item>
                        <Form.Item
                          name="vuongMac"
                          label="Vướng mắc"
                          className="sm:col-span-2"
                        >
                          <Input.TextArea rows={3} placeholder="Khó khăn cần hỗ trợ..." />
                        </Form.Item>
                        <Form.Item
                          name="nguoiGiao"
                          label="Người phụ trách"
                          rules={[{ required: true, message: 'Chọn người phụ trách' }]}
                        >
                          <Select
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            options={dashboardAssigneeOptions}
                            optionLabelProp="value"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
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
                            placeholder={
                              dashboardAssigneeOptions.length
                                ? 'Chọn từ nhân sự'
                                : 'Chưa có nhân sự — thêm ở mục Nhân sự'
                            }
                            notFoundContent={
                              dashboardAssigneeOptions.length ? 'Không khớp' : 'Chưa có dữ liệu nhân sự'
                            }
                          />
                        </Form.Item>
                        <Form.Item name="anhHuong" label="Mức ảnh hưởng">
                          <Select
                            options={[1, 2, 3, 4].map(level => ({ value: level, label: `${level} sao` }))}
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item name="nguoiTheoDoi" label="Người liên quan" className="sm:col-span-2 mb-0">
                          <PersonnelMultiSelect
                            options={dashboardFollowerOptions}
                            placeholder={
                              dashboardFollowerOptions.length
                                ? 'Tick chọn một hoặc nhiều người liên quan'
                                : 'Chưa có nhân sự — thêm ở mục Nhân sự'
                            }
                            notFoundContent={
                              dashboardFollowerOptions.length ? 'Không khớp' : 'Chưa có dữ liệu nhân sự'
                            }
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                      </div>
                    </section>

                    <section className="task-form-panel">
                      <p className="task-form-section-title">3. Kết quả & tài liệu</p>
                      <div className="grid grid-cols-1 gap-x-4">
                        <Form.Item name="ketQua" label="Kết quả">
                          <Input.TextArea rows={4} placeholder="Kết quả đạt được..." />
                        </Form.Item>
                        <div className="mb-0">
                          <p className="mb-1.5 text-sm font-medium text-[rgba(0,0,0,0.88)]">Link tài liệu</p>
                          <TaskDocLinksField name="taiLieuLinks" size="middle" />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="xl:col-span-5 space-y-3">
                    <section className="task-form-panel">
                      <p className="task-form-section-title">2. Thời hạn</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                        <Form.Item name="ngayGiao" label="Ngày giao">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item name="ycXong" label="Ngày hoàn thành">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                      </div>
                      <div className="grid grid-cols-3 gap-x-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 pt-2 pb-0">
                        <Form.Item name="giaHan1" label="Gia hạn 1" className="mb-2">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="—"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item name="giaHan2" label="Gia hạn 2" className="mb-2">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="—"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item name="giaHan3" label="Gia hạn 3" className="mb-2">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="—"
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                      </div>
                    </section>

                    <section className="task-form-panel">
                      <p className="task-form-section-title">2b. Tiến độ</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                        <Form.Item
                          name="tienDo"
                          label="Trạng thái"
                          rules={[{ required: true, message: 'Chọn trạng thái' }]}
                        >
                          <Select
                            options={[...TIEN_DO_EDIT_OPTIONS]}
                            placeholder="Chọn trạng thái"
                            disabled={supabaseConnected === false}
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item label="Tiến độ CV (%)" required>
                          <Space.Compact className="w-full">
                            <Form.Item
                              name="tienDoPhanTram"
                              noStyle
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
                        <Form.Item
                          shouldUpdate={(prev, next) => prev.tienDoPhanTram !== next.tienDoPhanTram}
                          className="mb-2 sm:col-span-2"
                        >
                          {() => (
                            <TaskProgressBar
                              value={clampProgressPercent(detailForm.getFieldValue('tienDoPhanTram'))}
                              className="max-w-none"
                            />
                          )}
                        </Form.Item>
                        <Form.Item name="canLD" label="Cần LĐ tác động" className="sm:col-span-2 mb-2">
                          <Select
                            options={[
                              { value: 'Không', label: 'Không' },
                              { value: 'Có', label: 'Có' },
                            ]}
                            getPopupContainer={trigger => trigger.parentElement ?? document.body}
                          />
                        </Form.Item>
                        <Form.Item
                          name="noiDungCanTacDong"
                          label="Nội dung cần tác động"
                          className="sm:col-span-2 mb-0"
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder="Mô tả nội dung cần lãnh đạo tác động..."
                          />
                        </Form.Item>
                        {selectedTask.ngayHoanThanh ? (
                          <div className="sm:col-span-2 text-sm text-[#0f274d] font-semibold pt-1">
                            Ngày đã hoàn thành:{' '}
                            {normalizeDisplayDate(selectedTask.ngayHoanThanh) || selectedTask.ngayHoanThanh}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  </div>
                </div>
              </Form>
            </div>

            <div className="sm:hidden dashboard-detail-sticky-footer shrink-0">
              <Button
                type="primary"
                block
                size="large"
                className="bg-[#1E386B] border-[#1E386B] font-bold h-11"
                loading={savingDetail}
                onClick={handleDetailSave}
                disabled={supabaseConnected === false}
              >
                Lưu
              </Button>
            </div>
          </div>
          </ConfigProvider>
        </div>
      )}
    </>
  );
};

export default Dashboard;
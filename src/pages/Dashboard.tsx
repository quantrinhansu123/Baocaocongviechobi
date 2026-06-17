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
} from 'antd';
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FireOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { X, User, Calendar, MessageSquare, Star } from 'lucide-react';
import { ORG_BLOCKS } from '../data/orgBlocks';
import { buildDashboardBlockChartData, buildDashboardChartData, buildDashboardStatusSummary, loadDashboardTasks, type DashboardChartRow, type DashboardTask } from '../services/dashboardData';

const { Title, Text } = Typography;

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

  const handleRowClick = (record: DashboardTask) => {
    setSelectedTask(record);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setTasksLoading(true);
      try {
        const tasks = await loadDashboardTasks();
        if (!cancelled) {
          setAllTasks(tasks);
        }
      } catch {
        if (!cancelled) {
          setAllTasks([]);
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
    if (status.includes('Hoàn thành')) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 {status}</span>;
    if (status === 'Quá hạn') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 Quá Hạn</span>;
    return <span className="px-3 py-1 bg-orange-100 text-[#1E386B] rounded-full text-xs font-semibold">🟡 Đang Làm</span>;
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
            <span className={`task-deadline ${deadlineClass}`}>Hạn: {task.deadline}</span>
          </div>
          <div className="task-footer">
            <span className="task-assignee" title={task.assignee}>
              <User size={10} className="shrink-0" />
              {task.assignee}
            </span>
            <span title={task.status}>{renderStatusCompact(task.status)}</span>
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

  const overdueColumns = [
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DashboardTask) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-red-600 cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    { title: 'NGƯỜI PHỤ TRÁCH', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'DEADLINE',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => <strong className="text-red-600">{date}</strong>,
    },
  ];

  const taskListColumns = [
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DashboardTask) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-[#1E386B] cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    { title: 'NGƯỜI PHỤ TRÁCH', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'DEADLINE',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => <strong>{date}</strong>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatus(status),
    },
  ];

  const importantColumns = [
    {
      title: 'CÔNG VIỆC',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-[#1E386B] cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      )
    },
    { title: 'NGƯỜI PHỤ TRÁCH', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag>{text}</Tag>
    },
    {
      title: 'DEADLINE',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => <strong className="text-[#1E386B]">{date}</strong>
    },
    {
      title: 'MỨC ĐỘ ẢNH HƯỞNG',
      dataIndex: 'impact',
      key: 'impact',
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

  const chartTitle =
    chartGroupMode === 'block'
      ? '📊 Biểu đồ trạng thái theo khối'
      : '📊 Biểu đồ trạng thái theo phòng ban';

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
              { value: 'all', label: 'Tất cả tiến độ' },
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
            { value: 'all', label: 'Tất cả tiến độ' },
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
            { value: 'all', label: 'Tất cả tiến độ' },
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
        label: '🔴 Quá hạn nộp',
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
        label: '⭐ Việc quan trọng',
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
            <Icon className={`kpi-icon md:hidden ${item.iconClass}`} />
            <div className="kpi-body">
              <p className={`kpi-label text-gray-500 line-clamp-1 ${item.labelClass ?? ''}`}>
                <span className="md:hidden">{item.shortLabel}</span>
                <span className="hidden md:inline">{item.label}</span>
              </p>
              <div className="kpi-value-row">
                <Icon className={`kpi-icon hidden md:inline ${item.iconClass}`} />
                <span className={`kpi-value ${item.valueClass}`}>{item.value}</span>
              </div>
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
            <Button type="link" size="small" onClick={() => setActiveKpiFilter(null)} className="text-gray-500">
              Đóng
            </Button>
          }
          styles={{ body: { padding: 0 } }}
        >
          <div className="hidden md:block p-4">
            <Table
              dataSource={kpiDrillDownTasks}
              columns={taskListColumns}
              pagination={{
                current: kpiListPage,
                pageSize: 8,
                onChange: setKpiListPage,
                size: 'small',
                showSizeChanger: false,
              }}
              scroll={{ y: 320 }}
              size="small"
              rowKey="id"
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
        <Card variant="borderless" className="shadow-sm border border-gray-100">
          <Empty description="Không có công việc trong nhóm này với bộ lọc hiện tại." />
        </Card>
      </div>
    ) : null;

  const listsNode = (
    <div className="space-y-3 md:space-y-5">
      <Card
        title={<span className="text-red-600 font-bold uppercase"><ClockCircleOutlined className="mr-2" />🔴 DANH SÁCH VIỆC QUÁ HẠN</span>}
        variant="borderless"
        className="shadow-sm border border-red-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-4">
          {displayOverdue.length > 0 ? (
            <Table
              dataSource={displayOverdue}
              columns={overdueColumns}
              pagination={{ current: overduePage, pageSize: 3, onChange: setOverduePage, size: 'small', showSizeChanger: false }}
              scroll={{ y: 300 }}
              size="small"
              rowKey="id"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-3 bg-red-50/30">
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 dashboard-kpi-list-mobile">
            {displayOverdue.length > 0 ? displayOverdue.slice((overduePage - 1) * 4, overduePage * 4).map(task => renderMobileTaskCard(task, 'red')) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
          </div>
          {displayOverdue.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-100 flex justify-center shrink-0">
              <Pagination
                current={overduePage}
                pageSize={4}
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
        title={<span className="text-orange-600 font-bold uppercase"><FireOutlined className="mr-2" />⭐ VIỆC ẢNH HƯỞNG CAO ĐANG LÀM (MỨC 3-4)</span>}
        variant="borderless"
        className="shadow-sm border border-orange-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-4">
          {displayImportant.length > 0 ? (
            <Table
              dataSource={displayImportant}
              columns={importantColumns}
              pagination={{ current: importantPage, pageSize: 3, onChange: setImportantPage, size: 'small', showSizeChanger: false }}
              scroll={{ y: 300 }}
              size="small"
              rowKey="id"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Không có công việc quan trọng nào đang làm." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-3 bg-orange-50/30">
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 dashboard-kpi-list-mobile">
            {displayImportant.length > 0 ? displayImportant.slice((importantPage - 1) * 4, importantPage * 4).map(task => renderMobileTaskCard(task, 'orange')) : <Empty description="Không có công việc quan trọng nào đang làm." />}
          </div>
          {displayImportant.length > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-100 flex justify-center shrink-0">
              <Pagination
                current={importantPage}
                pageSize={4}
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
            { label: isMobile ? 'Khối' : 'Theo khối', value: 'block' },
            { label: isMobile ? 'Phòng ban' : 'Theo phòng ban', value: 'dept' },
          ]}
        />
      }
    >
      {chartStatusTotal > 0 ? (
        <div className="dashboard-chart-summary">
          <div
            className="dashboard-chart-summary-bar"
            role="img"
            aria-label={`Hoàn thành ${chartStatusSummary['Hoàn thành']}, Đang làm ${chartStatusSummary['Đang làm']}, Quá hạn ${chartStatusSummary['Quá hạn']}`}
          >
            {chartStatusSummary['Hoàn thành'] > 0 ? (
              <span
                className="dashboard-chart-summary-seg dashboard-chart-summary-seg--done"
                style={{ width: `${(chartStatusSummary['Hoàn thành'] / chartStatusTotal) * 100}%` }}
              />
            ) : null}
            {chartStatusSummary['Đang làm'] > 0 ? (
              <span
                className="dashboard-chart-summary-seg dashboard-chart-summary-seg--progress"
                style={{ width: `${(chartStatusSummary['Đang làm'] / chartStatusTotal) * 100}%` }}
              />
            ) : null}
            {chartStatusSummary['Quá hạn'] > 0 ? (
              <span
                className="dashboard-chart-summary-seg dashboard-chart-summary-seg--overdue"
                style={{ width: `${(chartStatusSummary['Quá hạn'] / chartStatusTotal) * 100}%` }}
              />
            ) : null}
          </div>
          <div className="dashboard-chart-summary-legend">
            <span className="dashboard-chart-summary-item dashboard-chart-summary-item--done">
              Hoàn thành <strong>{chartStatusSummary['Hoàn thành']}</strong>
            </span>
            <span className="dashboard-chart-summary-item dashboard-chart-summary-item--progress">
              Đang làm <strong>{chartStatusSummary['Đang làm']}</strong>
            </span>
            <span className="dashboard-chart-summary-item dashboard-chart-summary-item--overdue">
              Quá hạn <strong>{chartStatusSummary['Quá hạn']}</strong>
            </span>
          </div>
        </div>
      ) : null}
      {chartDataRecharts.length > 0 ? (
        <div
          className="dashboard-chart-scroll"
          style={{ maxHeight: isMobile ? 360 : 520, overflowY: chartDataRecharts.length > 6 ? 'auto' : 'visible' }}
        >
          <div
            style={{ height: chartHeight, minHeight: isMobile ? 200 : 220 }}
            className="dashboard-chart-wrap"
          >
          <ResponsiveContainer width="100%" height={chartHeight} minHeight={isMobile ? 200 : 220}>
            <BarChart
              layout="vertical"
              data={chartDataRecharts}
              margin={{
                top: 8,
                right: isMobile ? 16 : 24,
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
                domain={[0, chartMaxValue + 1]}
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
                width={isMobile ? 88 : 128}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: isMobile ? 9 : 11, fill: '#1E386B', fontWeight: 600 }}
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
              <Legend
                iconType="circle"
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingBottom: '8px' }}
              />
              <Bar dataKey="Hoàn thành" name="Hoàn thành" fill="#10b981" stackId="status" radius={[0, 0, 0, 0]}>
                <LabelList content={completedStackLabel} />
                <LabelList content={stackTotalLabel} />
              </Bar>
              <Bar dataKey="Đang làm" name="Đang làm" fill="#F38320" stackId="status" radius={[0, 0, 0, 0]}>
                <LabelList content={stackTotalLabel} />
              </Bar>
              <Bar dataKey="Quá hạn" name="Quá hạn" fill="#ef4444" stackId="status" radius={[0, 4, 4, 0]}>
                <LabelList content={stackTotalLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
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
            <Col xs={24} lg={16}>{listsNode}</Col>
            <Col xs={24} lg={8}>{timelineNode}</Col>
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

      {/* --- MODAL CHI TIẾT --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] md:max-h-[85vh]">

            {/* Header Modal */}
            <div className="bg-[#F38320] text-white p-4 md:p-5 flex justify-between items-center rounded-t-xl shrink-0">
              <h2 className="text-lg md:text-xl font-bold pr-4">{selectedTask.name}</h2>
              <button onClick={() => setSelectedTask(null)} className="hover:bg-white/20 p-1 rounded transition shrink-0">
                <X size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 overflow-y-auto min-h-0">
              {/* Cột trái: Thông tin */}
              <div className="col-span-1 space-y-4 md:space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Người phụ trách</p>
                  <p className="font-semibold flex items-center gap-2"><User size={18} className="text-[#1E386B]" /> {selectedTask.assignee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Deadline</p>
                  <p className="font-semibold flex items-center gap-2"><Calendar size={18} className="text-[#1E386B]" /> {selectedTask.deadline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Trạng thái</p>
                  {selectedTask.isIssue ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Vướng Mắc
                    </span>
                  ) : (
                    renderStatus(selectedTask.status)
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Mức độ ảnh hưởng</p>
                  {renderImpact(selectedTask.impact)}
                </div>
              </div>

              {/* Cột phải: Mô tả & Lịch sử */}
              <div className="col-span-1 md:col-span-2 space-y-4 md:space-y-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-[#1E386B] mb-2 flex items-center gap-2">Mô tả chi tiết</h3>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">{selectedTask.desc}</p>
                </div>

                <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-[#1E386B] mb-2 flex items-center gap-2">Lịch sử cập nhật</h3>
                  <div className="border-l-2 border-[#1E386B] pl-3 md:pl-4 py-1 ml-1 md:ml-2">
                    <p className="text-xs md:text-sm text-gray-500">Hôm qua</p>
                    <p className="text-gray-700 text-sm md:text-base">{selectedTask.history}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal: Comment */}
            <div className="border-t border-gray-200 p-4 md:p-5 bg-gray-50 flex items-start gap-2 md:gap-3 rounded-b-xl shrink-0">
              <MessageSquare className="text-gray-400 mt-2 min-w-[20px]" size={20} />
              <div className="flex-1 w-full">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 md:p-3 outline-none focus:border-[#F38320] focus:ring-1 focus:ring-[#1E386B]/30 transition resize-none text-sm"
                  rows={2}
                  placeholder="Bình luận hoặc cập nhật trạng thái..."
                />
                <div className="flex justify-end mt-2">
                  <button className="bg-[#F38320] text-white px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-[#e07518] transition text-sm">
                    Gửi
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      </div>
    </Spin>
  );
};

export default Dashboard;
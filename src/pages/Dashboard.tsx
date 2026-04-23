import React, { useState, useMemo, useEffect } from 'react';
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

const { Title, Text } = Typography;

// --- DỮ LIỆU TÊN CÔNG VIỆC THỰC TẾ ---
const TASK_NAMES = [
  'Sản xuất đơn Hobi-01', 'Báo cáo công nợ Tháng 9', 'Fix lỗi máy ép viền', 'Nhập nguyên liệu keo',
  'Lên mẫu thiết kế OEM', 'Thanh toán tiền điện', 'Ký hợp đồng OEM-Đại Phát', 'Duyệt KPI kinh doanh Q4',
  'Tuyển dụng thợ mộc NM', 'Lập kế hoạch sản xuất T5', 'Kiểm kê kho TP', 'Đàm phán giá phôi',
  'Bảo trì máy cắt CNC', 'Sản xuất ván ép lô B', 'Đóng gói hàng xuất khẩu', 'Thanh toán lương T4',
  'Báo cáo dòng tiền', 'Mua vật tư phụ đóng thùng', 'Chốt mẫu bàn ghế mới', 'Làm việc cục thuế',
  'Setup xưởng phụ', 'Kiểm định PCCC năm', 'Ký HĐ nhà phân phối', 'Huấn luyện An toàn LĐ',
  'Kiểm tra chất lượng gỗ', 'Nhập lô bản lề giảm chấn', 'Duyệt bảng giá đại lý', 'Tìm xưởng gia công phụ',
  'Bảo trì hệ thống hút bụi', 'Sản xuất đơn TMĐT', 'Báo cáo thuế quý 1', 'Kiểm tra công nợ KH',
  'Lên phương án QC', 'Tối ưu dây chuyền 1', 'Đánh giá NCC ván MDF', 'Họp giao ban tuần',
  'Chạy quảng cáo Tháng 4', 'Đăng ký nhãn hiệu', 'Khảo sát kho chứa mới', 'Lắp đặt máy CNC mới',
  'Phỏng vấn kế toán trưởng', 'Lập ngân sách 2026', 'Tuyển thêm 5 LĐPT', 'Xử lý khiếu nại chất lượng', 'Mở rộng kênh TMĐT'
];
const DEPARTMENTS = [
  'Công việc cá nhân',
  'Công việc của BLĐ',
  'Phòng HCNS',
  'Phòng KD Hobi Gỗ',
  'Phòng KD Hobi Nhựa',
  'Phòng Xuất khẩu',
  'Phòng Dự án',
  'Chi nhánh HCM',
  'Phòng Marketing',
  'Phòng Kế toán TM',
  'Phòng Kho',
  'Phòng KD OEM',
  'Phòng Kế toán sản xuất',
  'Nhà máy Wilson HB',
  'Mua Thương mại',
  'Mua sản xuất',
];
const STATUSES = ['Hoàn thành', 'Đang làm', 'Quá hạn', 'Hoàn thành gia hạn 1', 'Hoàn thành gia hạn 2', 'Hoàn thành gia hạn 3'];
const OWNERS = ['Anh Tài', 'Chị Lan', 'Anh Tuấn', 'Anh Hùng', 'Chị Mai', 'Sếp Tuyển'];
const DEPARTMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả phòng ban' },
  { value: 'Công việc cá nhân', label: 'I. BAN LÃNH ĐẠO — 1. CÔNG VIỆC CÁ NHÂN' },
  { value: 'Công việc của BLĐ', label: 'I. BAN LÃNH ĐẠO — 2. CÔNG VIỆC CỦA BLĐ' },
  { value: 'Phòng HCNS', label: 'II. KHỐI THƯƠNG MẠI — 1. PHÒNG HCNS' },
  { value: 'Phòng KD Hobi Gỗ', label: 'II. KHỐI THƯƠNG MẠI — 2. PHÒNG KD HOBI GỖ' },
  { value: 'Phòng KD Hobi Nhựa', label: 'II. KHỐI THƯƠNG MẠI — 3. PHÒNG KD HOBI NHỰA' },
  { value: 'Phòng Xuất khẩu', label: 'II. KHỐI THƯƠNG MẠI — 4. PHÒNG XUẤT KHẨU' },
  { value: 'Phòng Dự án', label: 'II. KHỐI THƯƠNG MẠI — 5. PHÒNG DỰ ÁN' },
  { value: 'Chi nhánh HCM', label: 'II. KHỐI THƯƠNG MẠI — 6. CHI NHÁNH HCM' },
  { value: 'Phòng Marketing', label: 'II. KHỐI THƯƠNG MẠI — 7. PHÒNG MARKETING' },
  { value: 'Phòng Kế toán TM', label: 'II. KHỐI THƯƠNG MẠI — 8. PHÒNG KẾ TOÁN TM' },
  { value: 'Phòng Kho', label: 'II. KHỐI THƯƠNG MẠI — 9. PHÒNG KHO' },
  { value: 'Phòng KD OEM', label: 'III. KHỐI SẢN XUẤT — 1. PHÒNG KD OEM' },
  { value: 'Phòng Kế toán sản xuất', label: 'III. KHỐI SẢN XUẤT — 2. PHÒNG KẾ TOÁN SẢN XUẤT' },
  { value: 'Nhà máy Wilson HB', label: 'III. KHỐI SẢN XUẤT — 3. NHÀ MÁY WILSON HB' },
  { value: 'Mua Thương mại', label: 'IV. PHÒNG MUA NỘI ĐỊA, QUỐC TẾ — 1. MUA THƯƠNG MẠI' },
  { value: 'Mua sản xuất', label: 'IV. PHÒNG MUA NỘI ĐỊA, QUỐC TẾ — 2. MUA SẢN XUẤT' },
];

// Sinh ra 1500 dữ liệu mẫu khổng lồ, rải đều ngẫu nhiên
const ALL_TASKS = Array.from({ length: 1500 }).map((_, i) => {
  const nameBase = TASK_NAMES[i % TASK_NAMES.length];

  const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const owner = OWNERS[Math.floor(Math.random() * OWNERS.length)];
  const weekNum = Math.floor(Math.random() * 52) + 1; // Từ tuần 1 đến tuần 52
  const priority = Math.floor(Math.random() * 4) + 1; // 1 sao đến 4 sao
  const isOverdue = status === 'Quá hạn';

  return {
    id: `task-${i + 1}`,
    name: nameBase,
    department: dept,
    status: status,
    impact: priority,
    isIssue: isOverdue || Math.random() > 0.8, // 20% khả năng bị vướng mắc
    assignee: owner,
    deadline: dayjs('2026-01-01').add(weekNum * 7 - Math.floor(Math.random() * 7), 'day').format('DD/MM/2026'),
    week: `week_${weekNum}`,
    desc: `Chi tiết công việc: ${nameBase}. Cần phối hợp với bộ phận ${dept} để xử lý dứt điểm.`,
    history: isOverdue ? 'Cảnh báo: Khách hàng / Lãnh đạo đang hối thúc!' : 'Đang theo sát tiến độ, không có vấn đề.',
  };
});

const Dashboard: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set());

  const handleRowClick = (record: any) => {
    setSelectedTask(record);
  };

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

  // --- STATE PHÂN TRANG VƯỚNG MẮC ---
  const [issuePage, setIssuePage] = useState<number>(1);
  const [overduePage, setOverduePage] = useState<number>(1);
  const [importantPage, setImportantPage] = useState<number>(1);

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredTasks = useMemo(() => {
    return ALL_TASKS.filter(task => {
      const matchWeek = filterWeek === 'all' || task.week === filterWeek;
      const matchDept = filterDept === 'all' || task.department === filterDept;

      let matchPriority = true;
      if (filterPriority === 'high') matchPriority = task.impact >= 3;
      if (filterPriority === 'low') matchPriority = task.impact <= 2;

      let matchStatus = true;
      if (filterStatus === 'in_progress') matchStatus = task.status === 'Đang làm';
      if (filterStatus === 'overdue') matchStatus = task.status === 'Quá hạn';
      if (filterStatus === 'completed') matchStatus = task.status === 'Hoàn thành';
      if (filterStatus === 'ext_1') matchStatus = task.status === 'Hoàn thành gia hạn 1';
      if (filterStatus === 'ext_2') matchStatus = task.status === 'Hoàn thành gia hạn 2';
      if (filterStatus === 'ext_3') matchStatus = task.status === 'Hoàn thành gia hạn 3';

      return matchWeek && matchDept && matchPriority && matchStatus;
    });
  }, [filterWeek, filterDept, filterPriority, filterStatus]);

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

  // --- MÀU SẮC TAG & TRẠNG THÁI ---
  const getStatusColor = (status: string) => {
    if (status === 'Hoàn thành') return 'success';
    if (status === 'Quá hạn' || status === 'Vướng mắc') return 'error';
    return 'processing';
  };

  const renderStatus = (status: string) => {
    if (status.includes('Hoàn thành')) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 {status}</span>;
    if (status === 'Quá hạn') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 Quá Hạn</span>;
    return <span className="px-3 py-1 bg-orange-100 text-[#F38320] rounded-full text-xs font-semibold">🟡 Đang Làm</span>;
  };

  const renderImpact = (level: number) => (
    <div className="flex gap-1">
      {[...Array(4)].map((_, i) => (
        <Star key={i} size={16} className={i < level ? 'fill-[#F38320] text-[#F38320]' : 'text-gray-300'} />
      ))}
    </div>
  );

  // --- CHUYỂN ĐỔI DATA CHO RECHARTS ---
  const chartDataRecharts = useMemo(() => {
    const grouped: Record<string, any> = {};
    DEPARTMENTS.forEach(dept => {
      grouped[dept] = { name: dept, 'Hoàn thành': 0, 'Đang làm': 0, 'Quá hạn': 0 };
    });
    filteredTasks.forEach(t => {
      const mappedStatus = t.status.includes('Hoàn thành') ? 'Hoàn thành' : t.status;
      if (grouped[t.department] && grouped[t.department][mappedStatus] !== undefined) {
        grouped[t.department][mappedStatus] += 1;
      }
    });
    return Object.values(grouped);
  }, [filteredTasks]);

  // --- SMART LABEL CHỐNG TRÀN VIỀN ---
  const SmartLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    // Nếu value bằng 0 hoặc undefined -> Ẩn luôn
    if (!value) return null;

    // Chiều rộng (bề ngang) cột quá hẹp (< 25px) trên điện thoại -> Số sẽ đè lên nhau, nên ta ẩn luôn đi (người dùng có thể nhấn vào cột hiện Tooltip)
    if (width < 25) return null;

    // Nếu cột mập mạp (>= 25px) -> Đủ chỗ cho số nằm trong lòng cột
    return (
      <text
        x={x + width / 2}
        y={y + 16}
        fill="#ffffff"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  const overdueColumns = [
    {
      title: 'Công việc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-red-600 cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag>{text}</Tag>
    },
    { title: 'Người phụ trách', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => <strong className="text-red-600">{date}</strong>
    },
  ];

  const importantColumns = [
    {
      title: 'Công việc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Tooltip title={record.desc} placement="topLeft">
          <Text strong className="text-[#F38320] cursor-pointer hover:underline">{text}</Text>
        </Tooltip>
      )
    },
    { title: 'Người phụ trách', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'Mức độ ảnh hưởng',
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

  const kpisNode = (
    <div>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-center h-full">
          <span className="text-gray-500 text-[11px] md:text-sm mb-1 line-clamp-1">Tổng công việc</span>
          <div className="flex items-center flex-row">
            <FileTextOutlined className="text-blue-500 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#1e3a8a] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.total}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-center h-full">
          <span className="text-gray-500 text-[11px] md:text-sm mb-1 line-clamp-1">Đã hoàn thành</span>
          <div className="flex items-center flex-row">
            <CheckCircleOutlined className="text-green-500 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#10b981] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.completed}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-red-50 p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-red-100 flex flex-col justify-center h-full">
          <span className="text-red-700 font-medium text-[11px] md:text-sm mb-1 line-clamp-1">🔴 Quá hạn nộp</span>
          <div className="flex items-center flex-row">
            <ClockCircleOutlined className="text-red-600 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#dc2626] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.overdue}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-orange-50 p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-orange-100 flex flex-col justify-center h-full">
          <span className="text-orange-700 font-medium text-[11px] md:text-sm mb-1 line-clamp-1 font-sans tracking-tight">⭐ Việc quan trọng</span>
          <div className="flex items-center flex-row">
            <FireOutlined className="text-orange-600 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#ea580c] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.highPriority}</span>
          </div>
        </div>

      </div>

      {/* Mobile - Compact */}
      <div className="block md:hidden grid grid-cols-2 gap-2">
        
        {/* Card 1 */}
        <div className="bg-white p-2 rounded-md shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-row items-center gap-1.5">
          <FileTextOutlined className="text-blue-500 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-gray-500 text-[10px] line-clamp-1">Tổng CV</div>
            <div className="text-[#1e3a8a] text-base font-bold leading-none">{displayStats.total}</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-2 rounded-md shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-row items-center gap-1.5">
          <CheckCircleOutlined className="text-green-500 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-gray-500 text-[10px] line-clamp-1">Hoàn thành</div>
            <div className="text-[#10b981] text-base font-bold leading-none">{displayStats.completed}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-red-50 p-2 rounded-md shadow-sm hover:shadow-md transition-shadow border border-red-100 flex flex-row items-center gap-1.5">
          <ClockCircleOutlined className="text-red-600 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-red-700 font-medium text-[10px] line-clamp-1">Quá hạn</div>
            <div className="text-[#dc2626] text-base font-bold leading-none">{displayStats.overdue}</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-orange-50 p-2 rounded-md shadow-sm hover:shadow-md transition-shadow border border-orange-100 flex flex-row items-center gap-1.5">
          <FireOutlined className="text-orange-600 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-orange-700 font-medium text-[10px] line-clamp-1">Quan trọng</div>
            <div className="text-[#ea580c] text-base font-bold leading-none">{displayStats.highPriority}</div>
          </div>
        </div>

      </div>
    </div>
  );

  const listsNode = (
    <div className="space-y-4 md:space-y-6">
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
        <div className="block md:hidden p-4 bg-red-50/30">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {displayOverdue.length > 0 ? displayOverdue.slice((overduePage - 1) * 3, overduePage * 3).map(task => (
              <div
                key={task.id}
                onClick={() => handleRowClick(task)}
                className="relative bg-white rounded-lg p-4 shadow-sm border border-red-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div className="flex flex-col pl-2">
                  <Text strong className="text-red-600 text-base leading-tight mb-2 pr-2 line-clamp-2">{task.name}</Text>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <Tag className="m-0 border-none bg-gray-100 text-gray-700">{task.department}</Tag>
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">Hạn: {task.deadline}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <User size={14} className="mr-1" /> {task.assignee}
                  </div>
                </div>
              </div>
            )) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
          </div>
          {displayOverdue.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-100 flex justify-center shrink-0">
              <Pagination
                current={overduePage}
                pageSize={3}
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
        <div className="block md:hidden p-4 bg-orange-50/30">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {displayImportant.length > 0 ? displayImportant.slice((importantPage - 1) * 3, importantPage * 3).map(task => (
              <div
                key={task.id}
                onClick={() => handleRowClick(task)}
                className="relative bg-white rounded-lg p-4 shadow-sm border border-orange-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F38320]"></div>
                <div className="flex flex-col pl-2">
                  <Text strong className="text-[#F38320] text-base leading-tight mb-2 line-clamp-2">{task.name}</Text>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center">
                      <User size={14} className="mr-1" /> {task.assignee}
                    </span>
                    {/* renderImpact is accessible here */}
                    {renderImpact(task.impact)}
                  </div>
                </div>
              </div>
            )) : <Empty description="Không có công việc quan trọng nào đang làm." />}
          </div>
          {displayImportant.length > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-100 flex justify-center shrink-0">
              <Pagination
                current={importantPage}
                pageSize={3}
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
                  className="relative bg-white rounded-lg p-4 shadow-sm border border-red-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="flex flex-col pl-2">
                    <Text strong className="text-red-600 text-base leading-tight mb-2 line-clamp-2">{issue.name}</Text>
                    <p className="text-sm text-gray-600 m-0 line-clamp-2">{issue.history}</p>
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
    <Card title="📊 BIỂU ĐỒ THEO PHÒNG BAN" variant="borderless" className="shadow-sm border border-gray-100">
      <div style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDataRecharts} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280' }} />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
            <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Hoàn thành" content={<SmartLabel />} />
            </Bar>
            <Bar dataKey="Đang làm" fill="#fa8c16" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Đang làm" content={<SmartLabel />} />
            </Bar>
            <Bar dataKey="Quá hạn" fill="#ef4444" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Quá hạn" content={<SmartLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="dashboard-container space-y-4 md:space-y-6 bg-gray-50 min-h-screen p-3 md:p-6 relative">
      
      {/* ─── HIỂN THỊ DESKTOP ─── */}
      {!isMobile && (
        <div className="hidden md:block">
          {desktopFiltersNode}
          <div className="mt-6">{kpisNode}</div>
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
            <div className="bg-[#1E386B] text-white p-4 md:p-5 flex justify-between items-center rounded-t-xl shrink-0">
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
                  <div className="border-l-2 border-[#F38320] pl-3 md:pl-4 py-1 ml-1 md:ml-2">
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
                  className="w-full border border-gray-300 rounded-lg p-2 md:p-3 outline-none focus:border-[#F38320] focus:ring-1 focus:ring-[#F38320] transition resize-none text-sm"
                  rows={2}
                  placeholder="Bình luận hoặc cập nhật trạng thái..."
                />
                <div className="flex justify-end mt-2">
                  <button className="bg-[#F38320] text-white px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition text-sm">
                    Gửi
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
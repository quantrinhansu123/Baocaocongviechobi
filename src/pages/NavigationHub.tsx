import React, { useState, useMemo } from 'react';
import { Tree, Typography, Tag, Empty, Dropdown, message, Drawer, Select } from 'antd';
import dayjs from 'dayjs';
import type { TreeProps } from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { Menu as MenuIcon } from 'lucide-react';

const { Text } = Typography;

// ─── DỮ LIỆU BÁO CÁO ─────────────────────────────────────────────────────────
const ALL_REPORTS: Record<string, any> = {
  'nm-r2': { stt: 1, name: 'Báo cáo tháng Mr Hùng/phụ trách NM', noidung: 'Tổng hợp tháng tại nhà máy', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mr Hùng – Nhà máy', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/B2' },
  'nm-r3': { stt: 2, name: 'Tổng hợp biên bản xử lý lỗi trong sản xuất cả tháng trước', noidung: 'Xử lý các lỗi trong ca tháng trước', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mr Hùng – Nhà máy', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/C1' },
  'nm-r4': { stt: 3, name: 'Cập nhật định mức sản xuất', noidung: 'Các thay đổi định mức trong sản xuất', ngay: 'Ngày 30 tháng đầu tiên', ky: 'Quý', nguoiGui: 'Mr Hòa – Kế hoạch sx NM', nguoiNhan: 'Mr Tuyển + BLĐ + Kế toán', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/D8' },
  'nm-r5': { stt: 4, name: 'Cập nhật bổ công thức trong sản xuất', noidung: 'Khi có thay đổi công thức đóng hàng', ngay: 'Ngày 5 / Khi thay đổi', ky: 'Tháng', nguoiGui: 'Mr Hòa – Kế hoạch sx NM', nguoiNhan: 'BLĐ + Kế toán', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/E3' },

  'oem-r1': { stt: 1, name: 'Báo cáo công nợ OEM', noidung: 'Theo dõi công nợ khách hàng OEM', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Chị Lan – Kế toán', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com' },
  'oem-r3': { stt: 2, name: 'Tồn kho OEM', noidung: 'Báo cáo tồn kho nguyên liệu OEM', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Anh Hùng – Kho', nguoiNhan: 'Mr Tuyển + Kế toán', luong: 'Base', link: 'https://docs.google.com' },
  'oem-r4': { stt: 3, name: 'Đánh giá & hạn mức OEM', noidung: 'Đánh giá khách hàng và hạn mức tín dụng', ngay: 'Ngày 10', ky: 'Quý', nguoiGui: 'Chị Mai – Kinh doanh', nguoiNhan: 'Mr Tuyển + Kế toán', luong: 'Base', link: 'https://docs.google.com' },

  'tm-r1': { stt: 1, name: 'KPI kinh doanh', noidung: 'Theo dõi KPI đội kinh doanh thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mrs Thao – KD', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com' },
  'tm-r2': { stt: 2, name: 'Công nợ thương mại', noidung: 'Tổng hợp công nợ khách thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Chị Lan – Kế toán', nguoiNhan: 'Mr Tuyển', luong: 'Base', link: 'https://docs.google.com' },
  'tm-r3': { stt: 3, name: 'Tồn kho thương mại', noidung: 'Báo cáo tồn kho sản phẩm thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Anh Hùng – Kho', nguoiNhan: 'Mr Tuyển', luong: 'Base', link: 'https://docs.google.com' },
};

// ─── CÂY THƯ MỤC ──────────────────────────────────────────────────────────────
const TREE_RAW = [
  {
    key: 'nha-may', label: 'Nhà Máy',
    children: ['nm-r2', 'nm-r3', 'nm-r4', 'nm-r5'],
  },
  {
    key: 'oem', label: 'OEM',
    children: ['oem-r1', 'oem-r3', 'oem-r4'],
  },
  {
    key: 'thuong-mai', label: 'Thương Mại',
    children: ['tm-r1', 'tm-r2', 'tm-r3'],
  },
  { key: 'du-an', label: 'Dự Án', children: [] },
  { key: 'marketing', label: 'Marketing', children: [] },
  { key: 'ke-toan', label: 'Kế Toán', children: [] },
  { key: 'khac', label: 'Khác (phát sinh)', children: [] },
];

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

const buildTreeData = (filterPeriod: string) =>
  TREE_RAW.map((dept, idx) => {
    const periods: Record<string, string[]> = {
      'Báo cáo Tuần': [],
      'Báo cáo Tháng': [],
      'Báo cáo Quý': [],
    };

    dept.children.forEach(rKey => {
      const report = ALL_REPORTS[rKey];
      if (!report) return;

      const ky = (report.ky || '').toLowerCase();
      if (ky.includes('tuần')) periods['Báo cáo Tuần'].push(rKey);
      else if (ky.includes('tháng')) periods['Báo cáo Tháng'].push(rKey);
      else if (ky.includes('quý')) periods['Báo cáo Quý'].push(rKey);
      else periods['Báo cáo Tháng'].push(rKey);
    });

    const allowedLabel = filterPeriod !== 'all' ? PERIOD_MAP[filterPeriod] : null;

    const childrenNodes: any[] = [];
    Object.entries(periods).forEach(([pLabel, keys]) => {
      if (keys.length === 0) return;
      if (allowedLabel && pLabel !== allowedLabel) return; // lọc theo kỳ
      childrenNodes.push({
        key: `${dept.key}-${pLabel}`,
        title: pLabel,
        isLeaf: false,
        isPeriod: true,
        children: keys.map(k => ({
          key: k,
          title: ALL_REPORTS[k]?.name ?? k,
          isLeaf: true,
        })),
      });
    });

    return {
      key: dept.key,
      title: dept.label,
      isLeaf: false,
      dept: true,
      index: idx + 1,
      children: childrenNodes,
    };
  });

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const MOCK_DEADLINE = '30/04/2026';
const MOCK_EXTENSION_COUNT = 2;
const MOCK_EXTENSION_DATE = '02/05/2026';
const MOCK_PROGRESS = 65; // %

const parseDDMMYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
};

const calcDaysLeft = (dateStr: string): { days: number; overdue: boolean } => {
  const target = parseDDMMYYYY(dateStr);
  if (!target) return { days: 0, overdue: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { days: Math.abs(diff), overdue: diff < 0 };
};

const STAR_LEVELS: Record<string, number> = {
  'Tuần': 1,
  'Tháng': 2,
  'Quý': 3,
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const NavigationHub: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [filterPeriod] = useState<string>('all');

  const onSelect: TreeProps['onSelect'] = (_, info) => {
    const node = info.node as any;
    if (node.isLeaf) {
      const report = ALL_REPORTS[node.key];
      if (report) {
        setSelectedReport({ ...report, key: node.key });
        setMobileDrawerOpen(false); // Mobile: tự đóng sau khi chọn
      }
    } else {
      setSelectedReport(null);
      setSelectedDept(node.key);
    }
  };

  const renderTitle = (nodeData: any) => (
    <Dropdown
      menu={{
        items: [
          { key: 'add', label: 'Thêm', icon: <PlusOutlined /> },
          { key: 'edit', label: 'Đổi tên', icon: <EditOutlined /> },
          { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
        ],
        onClick: ({ key }) => message.info(`${key}: ${nodeData.title}`),
      }}
      trigger={['contextMenu']}
    >
      <div className="flex items-center gap-1.5 py-0.5 w-full">
        {nodeData.isLeaf
          ? <FileTextOutlined className="text-gray-400 text-xs flex-shrink-0" />
          : nodeData.isPeriod
            ? <FolderOutlined className="text-[#1E386B] flex-shrink-0" />
            : <FolderOutlined className="text-[#F38320] flex-shrink-0" />}
        <span className={nodeData.isLeaf
          ? 'text-gray-700 text-sm leading-snug'
          : 'font-bold text-[#1E386B] text-sm'}>
          {nodeData.isLeaf ? nodeData.title : `${nodeData.title}`}
        </span>
      </div>
    </Dropdown>
  );

  const loopTree = (data: any[]): any[] =>
    data.map(item => ({
      ...item,
      title: renderTitle(item),
      children: item.children ? loopTree(item.children) : undefined,
    }));

  const treeData = useMemo(
    () => loopTree(buildTreeData(filterPeriod)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterPeriod, selectedReport]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">

      {/* ── TOP BAR: CHỌN TUẦN ── */}
      <div className="bg-white px-4 md:px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 flex-shrink-0 gap-3 md:gap-0">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Text strong className="text-gray-600 text-sm hidden md:inline">Chọn tuần:</Text>
          <Select
            showSearch
            value={selectedWeek}
            onChange={setSelectedWeek}
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
          onClick={() => setMobileDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-[#1E386B] py-2.5 rounded-lg font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          Danh sách báo cáo & Menu
        </button>
      </div>

      <Drawer
        title={<span className="font-bold text-[#1E386B] tracking-wide">Cấu trúc báo cáo</span>}
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: '12px 8px' } }}
        width={280}
      >
        <Tree
          blockNode
          defaultExpandAll
          onSelect={onSelect}
          treeData={treeData}
          selectedKeys={selectedReport ? [selectedReport.key] : []}
          className="bg-transparent"
        />
      </Drawer>

      <div className="flex flex-1 overflow-hidden">
        {/* ── CỘT TRÁI: CÂY (Desktop & Tablet) ── */}
        <div className="hidden md:flex flex-col w-56 lg:w-72 flex-shrink-0 bg-white border-r border-gray-200 shadow-md transition-all">
          <div className="px-4 py-3 bg-[#1E386B]">
            <h2 className="m-0 text-white font-bold text-sm tracking-wide flex items-center gap-2">
              <span>📁</span> Cấu trúc báo cáo
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-2 lg:p-3">
            <Tree
              blockNode
              defaultExpandAll
              onSelect={onSelect}
              treeData={treeData}
              selectedKeys={selectedReport ? [selectedReport.key] : []}
              className="bg-transparent"
            />
          </div>
        </div>

        {/* ── CỘT PHẢI: CHI TIẾT ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedReport ? (
          <>
            {/* Header detail */}
            <div className="bg-[#1E386B] px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
              <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 md:mb-1 uppercase tracking-wider">Chi tiết báo cáo</p>
              <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">{selectedReport.name}</h2>
            </div>

            {/* Content detail */}
            <div className="flex-1 overflow-auto py-4 px-2 md:p-6 bg-gray-50">
              <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden rounded-lg shadow border border-gray-100 max-w-[94%] sm:max-w-[360px] xl:max-w-none mx-auto">

                <div className="bg-[#F38320] text-white text-center font-bold py-1.5 text-[11px] xl:py-2 xl:text-sm tracking-widest uppercase">
                  THÔNG TIN CHI TIẾT
                </div>

                {/* --- DESKTOP VIEW (Màn siêu rộng >= 1280px): Dạng Table ngang --- */}
                <div className="hidden xl:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#1E386B] text-white">
                        {['STT', 'Tên báo cáo', 'Nội dung', 'Ngày gửi', 'Kỳ', 'Người gửi', 'Người nhận', 'Luồng', 'Link'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-xs border border-[#2a4a7f] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-3 border border-gray-200 text-center font-bold text-[#1E386B]">{selectedReport.stt}</td>
                        <td className="px-3 py-3 border border-gray-200 font-semibold text-[#1E386B] max-w-[180px] break-words whitespace-normal leading-snug">{selectedReport.name}</td>
                        <td className="px-3 py-3 border border-gray-200 text-gray-600 max-w-[150px] break-words whitespace-normal leading-snug">{selectedReport.noidung}</td>
                        <td className="px-3 py-3 border border-gray-200 whitespace-pre-line text-center">
                          <Tag color="blue" className="text-xs m-0">{selectedReport.ngay}</Tag>
                        </td>
                        <td className="px-3 py-3 border border-gray-200 text-center">
                          <Tag color="geekblue" className="m-0">{selectedReport.ky}</Tag>
                        </td>
                        <td className="px-3 py-3 border border-gray-200">{selectedReport.nguoiGui}</td>
                        <td className="px-3 py-3 border border-gray-200">{selectedReport.nguoiNhan}</td>
                        <td className="px-3 py-3 border border-gray-200 text-center">
                          <Tag color="orange" className="m-0">{selectedReport.luong}</Tag>
                        </td>
                        <td className="px-3 py-3 border border-gray-200">
                          <a href={selectedReport.link} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[#1677ff] hover:underline text-xs whitespace-nowrap bg-blue-50 px-2 py-1 rounded">
                            <LinkOutlined /> Xem
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* --- TABLET & MOBILE VIEW: Ultra Compact Card --- */}
                {(() => {
                  const { days, overdue } = calcDaysLeft(MOCK_DEADLINE);
                  const stars = STAR_LEVELS[selectedReport.ky] ?? 1;
                  const deadlineColor = overdue ? 'text-red-600' : 'text-orange-500';
                  const deadlineLabel = overdue
                    ? `Trễ ${days} ngày`
                    : days === 0 ? 'Hôm nay!' : `Còn ${days} ngày`;
                  const progressColor = overdue ? 'bg-red-500' : MOCK_PROGRESS >= 80 ? 'bg-emerald-500' : 'bg-blue-500';

                  return (
                    <div className="block xl:hidden">
                      {/* Đường kẻ phân cách nhỏ thay header */}
                      <div className="h-[3px] bg-gradient-to-r from-[#1E386B] via-[#F38320] to-transparent" />

                      <div className="p-2 space-y-1.5">

                        {/* Dòng 1: Stars + Tiêu đề */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] shrink-0 leading-none">
                            {''.repeat(stars)}
                          </span>
                          <span className="font-bold text-[#1E386B] text-[13px] truncate leading-tight flex-1">
                            {selectedReport.name}
                          </span>
                          <a
                            href={selectedReport.link}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 flex items-center gap-0.5 text-[#1677ff] bg-blue-50 text-[10px] px-1.5 py-0.5 rounded font-semibold hover:bg-blue-100 active:scale-95 transition-transform"
                            onClick={e => e.stopPropagation()}
                          >
                            <LinkOutlined style={{ fontSize: 10 }} /> Link
                          </a>
                        </div>

                        {/* Dòng 2: Progress bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${MOCK_PROGRESS}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${overdue ? 'text-red-500' : 'text-blue-500'}`}>
                            {MOCK_PROGRESS}%
                          </span>
                        </div>

                        {/* Dòng 3: Deadline + Gia hạn */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`flex items-center gap-1 text-[11px] font-semibold ${deadlineColor}`}>
                            {MOCK_DEADLINE}
                            <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              overdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {deadlineLabel}
                            </span>
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-500 font-medium shrink-0">
                             GH L{MOCK_EXTENSION_COUNT}:
                            <span className="font-bold text-[#1E386B] ml-0.5">{MOCK_EXTENSION_DATE.slice(0, 5)}</span>
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 md:gap-3 p-6 text-center bg-gray-50">
            <div className="bg-white p-6 rounded-full shadow-sm mb-2 border border-gray-100 text-[#1E386B]/20">
              <FileTextOutlined className="text-4xl md:text-6xl" />
            </div>
            <Text type="secondary" className="text-sm md:text-base max-w-sm">
              <span className="md:hidden">Bạn chưa chọn báo cáo nào. Bấm vào nút <strong>"Danh sách báo cáo & Menu"</strong> phía trên để chọn nhé!</span>
              <span className="hidden md:inline">Vui lòng điều hướng và chọn một tên báo cáo từ cây bên tay trái để xem chi tiết nhé!</span>
            </Text>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default NavigationHub;
import React, { useState } from 'react';
import { Tree, Typography, Tag, Dropdown, message, Select, Drawer } from 'antd';
import type { TreeProps } from 'antd';
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

// ─── DỮ LIỆU ĐẦY ĐỦ ─────────────────────────────────────────────────────────
// kyBaoCao: 'Tháng' | 'Quý'
const ALL_TASKS: Record<string, any> = {
  // ── NHÀ MÁY ──
  'nm-3': {
    stt: 1, kyBaoCao: 'Tháng',
    congViec: 'Bảo trì máy nghiền gỗ',
    nguoiGiao: 'Chú Hải', ngayGiao: '01/04/2026', ycXong: '10/04/2026',
    giaHan1: '15/04/2026', giaHan2: '18/04/2026', giaHan3: '22/04/2026',
    ketQua: 'Đã hoàn thiện phần cơ khí', linkKQ: 'https://docs.google.com/bao-tri',
    tienDo: 'Quá hạn', vuongMac: 'Đội bảo trì đang rút đi sửa chữa gấp chỗ khác',
    canLD: 'Có', anhHuong: 4,
  },
  'nm-4': {
    stt: 2, kyBaoCao: 'Tháng',
    congViec: 'Lên kế hoạch sản xuất tháng 5',
    nguoiGiao: 'Anh Tuyển', ngayGiao: '14/04/2026', ycXong: '28/04/2026',
    giaHan1: '29/04/2026', giaHan2: '30/04/2026', giaHan3: '02/05/2026',
    ketQua: 'Đang lên danh sách nguyên vật liệu', linkKQ: 'https://docs.google.com/kh-t5',
    tienDo: 'Đang làm', vuongMac: 'Phòng kinh doanh gửi số liệu chậm',
    canLD: 'Không', anhHuong: 3,
  },
  'nm-5': {
    stt: 3, kyBaoCao: 'Quý',
    congViec: 'Cập nhật định mức',
    nguoiGiao: 'Anh Hòa', ngayGiao: '07/04/2026', ycXong: '30/04/2026',
    giaHan1: '02/05/2026', giaHan2: '04/05/2026', giaHan3: '06/05/2026',
    ketQua: 'Đang đối soát lại giá', linkKQ: 'https://docs.google.com/dinh-muc',
    tienDo: 'Đang làm', vuongMac: 'Nhà cung cấp chưa chốt giá nguyên liệu',
    canLD: 'Không', anhHuong: 2,
  },

  // ── OEM ──
  'oem-1': {
    stt: 1, kyBaoCao: 'Tháng',
    congViec: 'Ký hợp đồng OEM',
    nguoiGiao: 'Chị Mai', ngayGiao: '07/04/2026', ycXong: '30/04/2026',
    giaHan1: '05/05/2026', giaHan2: '08/05/2026', giaHan3: '12/05/2026',
    ketQua: 'Đang chốt điều khoản pháp lý', linkKQ: 'https://docs.google.com/oem1',
    tienDo: 'Đang làm', vuongMac: 'Đối tác muốn tăng hạn mức tín dụng',
    canLD: 'Có', anhHuong: 4,
  },
  'oem-3': {
    stt: 2, kyBaoCao: 'Quý',
    congViec: 'Đánh giá & hạn mức OEM Q2',
    nguoiGiao: 'Chị Mai', ngayGiao: '01/04/2026', ycXong: '10/05/2026',
    giaHan1: '', giaHan2: '', giaHan3: '',
    ketQua: 'Đang tổng hợp dữ liệu', linkKQ: 'https://docs.google.com/oem3',
    tienDo: 'Chưa bắt đầu', vuongMac: 'Chờ số liệu từ kế toán',
    canLD: 'Không', anhHuong: 3,
  },

  // ── THƯƠNG MẠI ──
  'tm-1': {
    stt: 1, kyBaoCao: 'Tháng',
    congViec: 'Duyệt KPI kinh doanh Q2',
    nguoiGiao: 'Mrs Thao', ngayGiao: '14/04/2026', ycXong: '25/04/2026',
    giaHan1: '28/04/2026', giaHan2: '30/04/2026', giaHan3: '02/05/2026',
    ketQua: 'Đang soạn văn bản', linkKQ: 'https://docs.google.com/tm1',
    tienDo: 'Chưa bắt đầu', vuongMac: 'Sếp chưa phê duyệt lại chỉ tiêu',
    canLD: 'Không', anhHuong: 3,
  },
  'tm-3': {
    stt: 2, kyBaoCao: 'Quý',
    congViec: 'Báo cáo doanh thu Q1',
    nguoiGiao: 'Mrs Thao', ngayGiao: '01/04/2026', ycXong: '10/04/2026',
    giaHan1: '12/04/2026', giaHan2: '', giaHan3: '',
    ketQua: 'Tổng doanh thu đạt 98% KPI', linkKQ: 'https://docs.google.com/tm3',
    tienDo: 'Hoàn thành', vuongMac: '',
    canLD: 'Không', anhHuong: 3,
  },

  // ── DỰ ÁN ──
  'da-2': {
    stt: 1, kyBaoCao: 'Tháng',
    congViec: 'Lập dự toán ngân sách dự án',
    nguoiGiao: 'Chị Lan', ngayGiao: '01/04/2026', ycXong: '30/04/2026',
    giaHan1: '05/05/2026', giaHan2: '', giaHan3: '',
    ketQua: 'Đang thu thập báo giá', linkKQ: 'https://docs.google.com/da2',
    tienDo: 'Đang làm', vuongMac: 'Nhà thầu chậm gửi báo giá',
    canLD: 'Có', anhHuong: 4,
  },

  // ── KẾ TOÁN ──
  'kt-1': {
    stt: 1, kyBaoCao: 'Tháng',
    congViec: 'Báo cáo công nợ tháng 4',
    nguoiGiao: 'Chị Lan', ngayGiao: '01/04/2026', ycXong: '05/04/2026',
    giaHan1: '06/04/2026', giaHan2: '07/04/2026', giaHan3: '08/04/2026',
    ketQua: 'Tổng công nợ 4.2 tỷ', linkKQ: 'https://docs.google.com/kt1',
    tienDo: 'Hoàn thành', vuongMac: 'Kế toán viên nghỉ ốm 1 tuần',
    canLD: 'Không', anhHuong: 3,
  },
  'kt-3': {
    stt: 2, kyBaoCao: 'Quý',
    congViec: 'Quyết toán thuế Q1',
    nguoiGiao: 'Chị Lan', ngayGiao: '01/04/2026', ycXong: '30/04/2026',
    giaHan1: '05/05/2026', giaHan2: '', giaHan3: '',
    ketQua: 'Đang tổng hợp chứng từ', linkKQ: 'https://docs.google.com/kt3',
    tienDo: 'Đang làm', vuongMac: 'Thiếu hóa đơn từ một số nhà cung cấp',
    canLD: 'Không', anhHuong: 3,
  },
};

// ─── CÂY THƯ MỤC ─────────────────────────────────────────────────────────────
const TREE_RAW = [
  { key: 'nha-may', label: 'Nhà Máy', tasks: ['nm-3', 'nm-4', 'nm-5'] },
  { key: 'oem', label: 'OEM', tasks: ['oem-1', 'oem-3'] },
  { key: 'thuong-mai', label: 'Thương Mại', tasks: ['tm-1', 'tm-3'] },
  { key: 'du-an', label: 'Dự Án', tasks: ['da-2'] },
  { key: 'ke-toan', label: 'Kế Toán', tasks: ['kt-1', 'kt-3'] },
  { key: 'marketing', label: 'Marketing', tasks: [] },
  { key: 'khac', label: 'Khác (phát sinh)', tasks: [] },
];

// Build tree: Bộ phận → Công việc (FLATTEN - không có cấp trung gian)
const buildTree = () =>
  TREE_RAW.map((dept, idx) => {
    // Hiển thị trực tiếp tất cả công việc dưới bộ phận
    const childrenNodes = dept.tasks.map(tk => {
      const task = ALL_TASKS[tk];
      return {
        key: tk,
        title: task?.congViec ?? tk,
        kyBaoCao: task?.kyBaoCao ?? 'Tháng', // Lưu loại kỳ để dùng trong renderTitle
        isLeaf: true,
      };
    });

    return {
      key: dept.key,
      title: dept.label,
      isLeaf: false,
      isDept: true,
      index: idx + 1,
      children: childrenNodes,
    };
  });

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
        <Text type="secondary" className="text-[11px] md:text-xs uppercase tracking-wide">{label}</Text>
      </div>
    </div>
    <div className="flex-1 text-sm font-medium ml-7 md:ml-0">{children}</div>
  </div>
);

const TaskView: React.FC = () => {
  const [selected, setSelected] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onSelect: TreeProps['onSelect'] = (_, info) => {
    const node = info.node as any;
    if (node.isLeaf) {
      const task = ALL_TASKS[node.key];
      if (task) {
        setSelected({ ...task, key: node.key });
        if (window.innerWidth < 768) setDrawerOpen(false);
      }
    } else {
      setSelected(null);
    }
  };

  const renderTitle = (nodeData: any) => {
    return (
      <Dropdown
        menu={{
          items: [
            { key: 'add', label: 'Thêm công việc', icon: <PlusOutlined /> },
            { key: 'edit', label: 'Đổi tên', icon: <EditOutlined /> },
            { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
          ],
          onClick: ({ key }) => message.info(`${key}: ${nodeData.title}`),
        }}
        trigger={['contextMenu']}
      >
        <div className="flex items-center gap-1.5 py-0.5 w-full">
          {nodeData.isLeaf
            ? <CheckSquareOutlined className="text-gray-400 text-xs flex-shrink-0" />
            : <FolderOutlined className="text-[#F38320] flex-shrink-0" />}
          <span className={
            nodeData.isLeaf
              ? 'text-gray-700 text-sm leading-snug flex items-center gap-2 flex-1'
              : 'font-bold text-[#1E386B] text-sm'
          }>
            {nodeData.title}
          </span>
        </div>
      </Dropdown>
    );
  };

  const loopTree = (data: any[]): any[] =>
    data.map(item => ({
      ...item,
      title: renderTitle(item),
      children: item.children ? loopTree(item.children) : undefined,
    }));

  const treeData = loopTree(buildTree());

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">

      {/* ── TOP BAR ── */}
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
      >
        <Tree
          blockNode
          defaultExpandAll
          onSelect={onSelect}
          treeData={treeData}
          selectedKeys={selected ? [selected.key] : []}
          className="bg-transparent"
        />
      </Drawer>

      <div className="flex flex-1 overflow-hidden">
        {/* ── CỘT TRÁI (Tablet & Desktop) ── */}
        <div className="hidden md:flex w-56 lg:w-72 flex-shrink-0 bg-white border-r border-gray-200 flex-col shadow-md transition-all">
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
              selectedKeys={selected ? [selected.key] : []}
              className="bg-transparent"
            />
          </div>
        </div>

        {/* ── CỘT PHẢI ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="bg-[#1E386B] px-4 md:px-6 py-3 md:py-4 flex-shrink-0 shadow">
                <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 tracking-wide uppercase">Chi tiết công việc</p>
                <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">{selected.congViec}</h2>
              </div>

              <div className="flex-1 overflow-auto p-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-[#F38320] text-white text-center font-bold py-2 text-xs tracking-widest rounded-t-xl uppercase">
                    Thông tin công việc
                  </div>

                  {/* --- DESKTOP VIEW --- */}
                  <div className="hidden md:block px-5 divide-y divide-gray-100">

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Thông tin giao việc</p>
                      <InfoRow icon={<span className="text-xs font-bold text-gray-400">#</span>} label="STT">
                        <span className="font-semibold text-[#1E386B]">{selected.stt}</span>
                      </InfoRow>
                      <InfoRow icon={<CheckSquareOutlined />} label="Công việc">
                        <span className="font-medium text-gray-800">{selected.congViec}</span>
                      </InfoRow>
                      <InfoRow icon={<UserOutlined />} label="Người được giao">
                        <span className="font-medium text-gray-800">{selected.nguoiGiao}</span>
                      </InfoRow>
                      <InfoRow icon={<CalendarOutlined />} label="Ngày giao">
                        <span className="text-gray-700">{selected.ngayGiao}</span>
                      </InfoRow>
                      <InfoRow icon={<ClockCircleOutlined />} label="Y/C xong">
                        <span className={dayjs(selected.ycXong, 'DD/MM/YYYY').isBefore(dayjs(), 'day') ? 'text-red-500 font-medium' : 'text-gray-700 font-medium'}>
                          {selected.ycXong}
                        </span>
                      </InfoRow>
                    </div>

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Gia hạn</p>
                      <div className="flex items-center gap-2 flex-wrap py-1">
                        {selected.giaHan1 && <Tag color="orange">Lần 1 · {selected.giaHan1}</Tag>}
                        {selected.giaHan2 && <Tag color="red" style={{ opacity: 0.75 }}>Lần 2 · {selected.giaHan2}</Tag>}
                        {selected.giaHan3 && <Tag color="red" style={{ fontWeight: 600 }}>Lần 3 · {selected.giaHan3}</Tag>}
                        {!selected.giaHan1 && <span className="text-gray-400 text-sm">Chưa gia hạn</span>}
                      </div>
                    </div>

                    <div className="py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Kết quả & tiến độ</p>
                      <InfoRow icon={<CheckSquareOutlined />} label="Kết quả">
                        <span className="text-gray-700 font-medium">{selected.ketQua}</span>
                      </InfoRow>
                      <InfoRow icon={<ThunderboltOutlined />} label="Tiến độ">
                        <Tag color={(STATUS_CFG[selected.tienDo] ?? { color: 'default' }).color}>
                          {selected.tienDo}
                        </Tag>
                      </InfoRow>
                      <InfoRow icon={<LinkOutlined />} label="Link KQ">
                        <a href={selected.linkKQ} target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1 text-sm">
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

                  {/* --- MOBILE VIEW --- */}
                  <div className="block md:hidden p-3 bg-gray-50 rounded-b-xl border-t border-gray-200 min-h-[300px]">
                    {(() => {
                      const borderColorMap: any = {
                        'Hoàn thành': 'bg-green-500',
                        'Đang làm': 'bg-blue-500',
                        'Quá hạn': 'bg-red-500',
                        'Chưa bắt đầu': 'bg-gray-400',
                      };
                      const leftColorClass = borderColorMap[selected.tienDo] || 'bg-gray-400';
                      const finalDateStr = selected.giaHan3 || selected.giaHan2 || selected.giaHan1 || selected.ycXong;
                      const isTaskOverdue = dayjs('2026-04-19', 'YYYY-MM-DD').isAfter(dayjs(finalDateStr, 'DD/MM/YYYY'), 'day') && selected.tienDo !== 'Hoàn thành';

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
                              <Tag color={(STATUS_CFG[selected.tienDo] ?? { color: 'default' }).color} className="m-0 text-[11px] font-bold border-none uppercase tracking-tight">
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
                                    {isLast && isTaskOverdue && <span className="text-[11px] ml-0.5 leading-none" title="Quá hạn">⚠️</span>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {(selected.ketQua || selected.vuongMac) && (
                            <div className="mt-2 pl-3 pt-2 border-t border-dashed border-gray-200 space-y-1">
                              {selected.ketQua && (
                                <div className="text-[12px] text-gray-700 leading-tight">
                                  <span className="font-bold text-gray-500">Kết Quả: </span>{selected.ketQua}
                                </div>
                              )}
                              {selected.vuongMac && (
                                <div className="text-[12px] text-red-600 leading-tight">
                                  <span className="font-bold text-red-400">Vướng Mắc: </span>{selected.vuongMac}
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
              <Text type="secondary" className="text-sm md:text-base max-w-sm">
                <span className="md:hidden">Bấm nút "Danh sách công việc" bên trên để chọn hiển thị chi tiết nhé!</span>
                <span className="hidden md:inline">Chọn một công việc từ cây bên trái để xem chi tiết nhé!</span>
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskView;

import React, { useState, useEffect } from 'react';
import { Typography, Tag, Select } from 'antd';
import dayjs from 'dayjs';
import {
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { ALL_REPORTS } from '../data/reportNavigation';

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

const STAR_LEVELS: Record<string, number> = {
  'Tuần': 1,
  'Tháng': 2,
  'Quý': 3,
};

const MOCK_DEADLINE = '30/04/2026';
const MOCK_EXTENSION_COUNT = 2;
const MOCK_EXTENSION_DATE = '02/05/2026';
const MOCK_PROGRESS = 65;

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

const NavigationHub: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');

  useEffect(() => {
    const r = searchParams.get('r');
    if (r && ALL_REPORTS[r]) {
      setSelectedReport({ ...ALL_REPORTS[r], key: r });
    } else {
      setSelectedReport(null);
    }
  }, [searchParams]);

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">

      <div className="bg-white px-4 md:px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 flex-shrink-0 gap-3 md:gap-0">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Text strong className="text-gray-600 text-sm hidden md:inline">Chọn tuần:</Text>
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

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedReport ? (
          <>
            <div className="bg-[#1E386B] px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
              <p className="text-white/60 text-[10px] md:text-xs m-0 mb-0.5 md:mb-1 uppercase tracking-wider">Chi tiết báo cáo</p>
              <h2 className="text-white font-bold text-base md:text-lg m-0 leading-snug line-clamp-2 md:line-clamp-none">{selectedReport.name}</h2>
            </div>

            <div className="flex-1 overflow-auto py-4 px-2 md:p-6 bg-gray-50">
              <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden rounded-lg shadow border border-gray-100 max-w-[94%] sm:max-w-[360px] xl:max-w-none mx-auto">

                <div className="bg-[#F38320] text-white text-center font-bold py-1.5 text-[11px] xl:py-2 xl:text-sm tracking-widest uppercase">
                  THÔNG TIN CHI TIẾT
                </div>

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
                      <div className="h-[3px] bg-gradient-to-r from-[#1E386B] via-[#F38320] to-transparent" />

                      <div className="p-2 space-y-1.5">

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
              Mở mục <strong>BÁO CÁO ĐỊNH KỲ</strong> trên thanh bên trái, xổ từng khối (I, II, III…) rồi chọn tên báo cáo để xem chi tiết.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationHub;

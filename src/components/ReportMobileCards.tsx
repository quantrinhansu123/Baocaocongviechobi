import React from 'react';
import { Avatar, Button, Popconfirm, Tag } from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import type { ReportRecord } from '../types/report';
import { normalizeDisplayDate } from '../utils/taskDate';

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === '—') {
    return '?';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function isDriveLink(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

type ReportMobileCardsProps = {
  rows: ReportRecord[];
  selectedKey?: string;
  onSelect: (report: ReportRecord) => void;
  showRowActions?: boolean;
  supabaseConnected?: boolean;
  deletingKey?: string | null;
  onEdit?: (report: ReportRecord) => void;
  onDelete?: (report: ReportRecord) => void;
};

const ReportMobileCards: React.FC<ReportMobileCardsProps> = ({
  rows,
  selectedKey,
  onSelect,
  showRowActions,
  supabaseConnected,
  deletingKey,
  onEdit,
  onDelete,
}) => {
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm px-4">Chưa có báo cáo trong kỳ này.</div>
    );
  }

  return (
    <div className="space-y-2 px-3 pb-2">
      {rows.map((report, index) => {
        const isSelected = selectedKey === report.key;
        const driveUrl = report.link && isDriveLink(report.link) ? report.link : '';
        const viewUrl = report.link || '';
        const displayDate = normalizeDisplayDate(report.ngay);
        const createdDate = normalizeDisplayDate(report.ngayTaoBaoCao);
        const showCreatedDate = createdDate && createdDate !== displayDate;

        return (
          <article
            key={report.key}
            onClick={() => onSelect(report)}
            className={`rounded-xl border bg-white p-2.5 shadow-sm transition-all ${
              isSelected ? 'border-[#fa8c16] ring-1 ring-[#fa8c16]/25' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-[11px] text-gray-400 font-semibold shrink-0 pt-0.5 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-[13px] font-bold text-[#1E386B] leading-snug m-0 line-clamp-2"
                  title={report.name}
                >
                  {report.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  {displayDate ? (
                    <Tag className="m-0 rounded border-0 bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0 leading-5">
                      {displayDate}
                    </Tag>
                  ) : null}
                  {report.ky ? (
                    <Tag className="m-0 rounded border-0 bg-violet-50 text-violet-700 text-[10px] px-1.5 py-0 leading-5">
                      {report.ky}
                    </Tag>
                  ) : null}
                  {showCreatedDate ? (
                    <span className="text-[10px] text-gray-400">Tạo {createdDate}</span>
                  ) : null}
                </div>
                {report.noidung ? (
                  <p className="text-[11px] text-gray-500 leading-snug m-0 mt-1 line-clamp-1">{report.noidung}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 min-w-0 text-[11px]">
              <Avatar size={22} className="bg-[#F38320] text-[9px] font-bold shrink-0">
                {initials(report.nguoiGui || '?')}
              </Avatar>
              <span className="font-medium text-gray-700 truncate max-w-[38%]">{report.nguoiGui || '—'}</span>
              <ArrowRightOutlined className="text-gray-300 text-[10px] shrink-0" />
              <Avatar size={22} className="bg-[#4a6fa5] text-[9px] font-bold shrink-0">
                {initials(report.nguoiNhan || '?')}
              </Avatar>
              <span className="font-medium text-gray-700 truncate max-w-[38%]">{report.nguoiNhan || '—'}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2" onClick={event => event.stopPropagation()}>
              {driveUrl ? (
                <Button
                  type="default"
                  size="small"
                  icon={<GoogleOutlined />}
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md text-[#1E386B] text-xs h-7 px-2"
                >
                  Drive
                </Button>
              ) : null}
              {viewUrl ? (
                <Button
                  type="default"
                  size="small"
                  icon={<EyeOutlined />}
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md text-[#1E386B] text-xs h-7 px-2"
                >
                  Xem
                </Button>
              ) : null}
              {showRowActions ? (
                <>
                  <Button
                    type="default"
                    size="small"
                    icon={<EditOutlined />}
                    className="rounded-md text-xs h-7 px-2"
                    disabled={!supabaseConnected || !report.sourceRow}
                    onClick={() => onEdit?.(report)}
                  >
                    Sửa
                  </Button>
                  <Popconfirm
                    title="Xoá báo cáo này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true, loading: deletingKey === report.key }}
                    onConfirm={() => onDelete?.(report)}
                    disabled={!supabaseConnected || !report.sourceRow}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="rounded-md h-7 w-7 min-w-7 p-0"
                      loading={deletingKey === report.key}
                      disabled={!supabaseConnected || !report.sourceRow}
                      aria-label="Xóa"
                    />
                  </Popconfirm>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ReportMobileCards;

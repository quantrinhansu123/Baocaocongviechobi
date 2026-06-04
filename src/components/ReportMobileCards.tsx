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
  appsheetConnected?: boolean;
  deletingKey?: string | null;
  onEdit?: (report: ReportRecord) => void;
  onDelete?: (report: ReportRecord) => void;
};

const ReportMobileCards: React.FC<ReportMobileCardsProps> = ({
  rows,
  selectedKey,
  onSelect,
  showRowActions,
  appsheetConnected,
  deletingKey,
  onEdit,
  onDelete,
}) => {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm px-4">Chưa có báo cáo trong kỳ này.</div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-2">
      {rows.map((report, index) => {
        const isSelected = selectedKey === report.key;
        const driveUrl = report.link && isDriveLink(report.link) ? report.link : '';
        const viewUrl = report.link || '';

        return (
          <article
            key={report.key}
            onClick={() => onSelect(report)}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
              isSelected ? 'border-[#fa8c16] ring-2 ring-[#fa8c16]/20' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <span className="text-gray-400 font-semibold text-[15px] shrink-0 leading-snug">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-[15px] font-bold text-[#1E386B] leading-snug m-0 line-clamp-2 min-w-0"
                  title={report.name}
                >
                  {report.name}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1 justify-end shrink-0">
                {report.ngay ? (
                  <Tag className="m-0 rounded-md border-0 bg-blue-50 text-blue-700 text-[11px] px-2 py-0">
                    {normalizeDisplayDate(report.ngay)}
                  </Tag>
                ) : null}
                {report.ky ? (
                  <Tag className="m-0 rounded-md border-0 bg-violet-50 text-violet-700 text-[11px] px-2 py-0">
                    {report.ky}
                  </Tag>
                ) : null}
              </div>
            </div>

            {(report.noidung || report.ngayTaoBaoCao) && (
              <div className="mb-4">
                {report.noidung ? (
                  <p className="text-[13px] text-gray-600 leading-relaxed m-0 mb-2">{report.noidung}</p>
                ) : null}
                {report.ngayTaoBaoCao ? (
                  <p className="text-[12px] text-gray-500 m-0">
                    <span className="font-semibold text-gray-600">Ngày tạo báo cáo:</span>{' '}
                    {normalizeDisplayDate(report.ngayTaoBaoCao)}
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mb-4 px-1">
              <div className="flex flex-col items-center min-w-0 flex-1">
                <Avatar size={40} className="bg-[#F38320] text-xs font-bold mb-1.5">
                  {initials(report.nguoiGui || '?')}
                </Avatar>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Người gửi</span>
                <span className="text-xs font-semibold text-gray-800 text-center truncate w-full">
                  {report.nguoiGui || '—'}
                </span>
              </div>

              <ArrowRightOutlined className="text-gray-300 text-sm shrink-0 mt-2" />

              <div className="flex flex-col items-center min-w-0 flex-1">
                <Avatar size={40} className="bg-[#4a6fa5] text-xs font-bold mb-1.5">
                  {initials(report.nguoiNhan || '?')}
                </Avatar>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Người nhận</span>
                <span className="text-xs font-semibold text-gray-800 text-center truncate w-full">
                  {report.nguoiNhan || '—'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2" onClick={event => event.stopPropagation()}>
              {driveUrl ? (
                <Button
                  type="default"
                  size="small"
                  icon={<GoogleOutlined />}
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[100px] rounded-lg border-orange-100 bg-orange-50/80 text-[#1E386B] font-medium h-9"
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
                  className="flex-1 min-w-[100px] rounded-lg border-orange-100 bg-orange-50/80 text-[#1E386B] font-medium h-9"
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
                    className="flex-1 min-w-[100px] rounded-lg font-medium h-9"
                    disabled={!appsheetConnected || !report.sourceRow}
                    onClick={() => onEdit?.(report)}
                  >
                    Sửa
                  </Button>
                  <Popconfirm
                    title="Xoá báo cáo này trên AppSheet?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true, loading: deletingKey === report.key }}
                    onConfirm={() => onDelete?.(report)}
                    disabled={!appsheetConnected || !report.sourceRow}
                  >
                    <Button
                      type="default"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="flex-1 min-w-[100px] rounded-lg font-medium h-9"
                      loading={deletingKey === report.key}
                      disabled={!appsheetConnected || !report.sourceRow}
                    >
                      Xóa
                    </Button>
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

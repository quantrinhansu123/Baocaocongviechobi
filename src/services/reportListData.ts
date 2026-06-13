import dayjs from 'dayjs';
import type { ReportRecord } from '../types/report';
import { loadReportCatalog } from './reportCatalog';

export type ReportListItem = {
  key: string;
  name: string;
  cycle: string;
  deadline: string;
  status: string;
  owner: string;
};

function cycleFromReport(report: ReportRecord): string {
  const combined = `${report.ky} ${report.periodLabel}`.toLowerCase();
  if (combined.includes('tuần')) {
    return 'Tuần';
  }
  if (combined.includes('quý')) {
    return 'Quý';
  }
  if (combined.includes('tháng') || combined.includes('nửa tháng')) {
    return 'Tháng';
  }
  return report.periodLabel.replace(/^Báo cáo\s+/i, '').trim() || 'Tháng';
}

function statusFromReport(report: ReportRecord): string {
  if (report.link?.trim()) {
    return 'Đã nộp';
  }

  const deadline = dayjs(report.ngay, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
  if (deadline.isValid() && deadline.isBefore(dayjs(), 'day')) {
    return 'Trễ';
  }

  return 'Chưa nộp';
}

function mapReportToListItem(report: ReportRecord): ReportListItem {
  return {
    key: report.key,
    name: report.name || report.menuLabel,
    cycle: cycleFromReport(report),
    deadline: report.ngay || report.ngayTaoBaoCao || '—',
    status: statusFromReport(report),
    owner: report.nguoiGui || report.nguoiNhan || '—',
  };
}

export async function loadReportListItems(): Promise<ReportListItem[]> {
  const catalog = await loadReportCatalog();
  return Object.values(catalog.reports)
    .map(mapReportToListItem)
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
}

export async function loadReportById(reportId: string): Promise<ReportRecord | null> {
  const catalog = await loadReportCatalog();
  return catalog.reports[reportId] ?? null;
}

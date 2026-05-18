import type { ReportBlockRecord, ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import { formatAppsheetDate } from '../utils/taskDate';

const REPORT_TABLE_NAME = 'BC định kỳ';

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function normalizeColumnKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatRowDateValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return formatAppsheetDate(
    value instanceof Date ? value : typeof value === 'number' ? value : String(value)
  );
}

function pickDateField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const formatted = formatRowDateValue(row[key]);
    if (formatted) {
      return formatted;
    }
  }

  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeColumnKey(key);
    if (
      normalized.includes('ngay update link') ||
      normalized.includes('update link') ||
      normalized === 'ngay cap nhat link'
    ) {
      const formatted = formatRowDateValue(value);
      if (formatted) {
        return formatted;
      }
    }
  }

  return '';
}

function parseAppsheetLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed) as { Url?: string };
    if (parsed.Url) {
      return parsed.Url;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/** Chuẩn hóa "I BC ..." → "I. BC ..." (kể cả khi La Mã nằm trong một chuỗi duy nhất, không có cột Mã riêng). Idempotent. */
export function formatBlockLabelRomanDot(label: string): string {
  const t = label.trim();
  if (!t) {
    return label;
  }
  if (/^[IVXLCDM]+\.\s/i.test(t)) {
    return t;
  }
  return t.replace(/^([IVXLCDM]+)(\s+)/i, '$1.$2');
}

/** Thêm dấu . sau mã La Mã (I, II, …) khi Mã là cột riêng */
function formatMaWithRomanDot(ma: string): string {
  const t = ma.trim();
  if (!t) {
    return '';
  }
  if (/^[IVXLCDM]+\.$/i.test(t)) {
    return t;
  }
  if (/^[IVXLCDM]+$/i.test(t)) {
    return `${t}.`;
  }
  return t;
}

function buildReportMenuLabel(ma: string, name: string): string {
  const maPart = formatMaWithRomanDot(ma);
  const namePart = name.trim();
  const raw = [maPart, namePart].filter(Boolean).join(' ');
  return formatBlockLabelRomanDot(raw);
}

function periodForKy(ky: string, ngay: string): string {
  const combined = `${ky} ${ngay}`.toLowerCase();
  if (combined.includes('tuần')) {
    return 'Báo cáo Tuần';
  }
  if (combined.includes('quý')) {
    return 'Báo cáo Quý';
  }
  if (combined.includes('tháng') || combined.includes('nửa tháng')) {
    return 'Báo cáo Tháng';
  }
  return 'Báo cáo Tháng';
}

function isReportLeaf(row: Record<string, unknown>, name: string): boolean {
  if (!name) {
    return false;
  }

  if (/^BC\s/i.test(name)) {
    const hasDetail =
      Boolean(pickField(row, ['Nội dung', 'Noi dung'])) ||
      Boolean(pickField(row, ['Link báo cáo', 'Link bao cao'])) ||
      Boolean(pickField(row, ['Người gửi báo cáo', 'Nguoi gui bao cao']));
    return hasDetail;
  }

  return true;
}

export function getReportAppsheetTableName(): string {
  return REPORT_TABLE_NAME;
}

function ensureReportGroup(
  groups: ReportGroupRecord[],
  groupKeys: Set<string>,
  blockKey: string,
  label: string
): string {
  const existing = groups.find(group => group.blockKey === blockKey && group.label === label);
  if (existing) {
    return existing.groupKey;
  }

  const groupKey = `group-${blockKey}-${groups.length + 1}`;
  groupKeys.add(groupKey);
  groups.push({
    groupKey,
    blockKey,
    label,
    order: groups.filter(group => group.blockKey === blockKey).length + 1,
  });
  return groupKey;
}

export function mapAppsheetRowsToReportCatalog(rows: Record<string, unknown>[]): ReportCatalog {
  const reports: Record<string, ReportRecord> = {};
  const blocks: ReportBlockRecord[] = [];
  const groups: ReportGroupRecord[] = [];
  const blockKeys = new Set<string>();
  const groupKeys = new Set<string>();
  let currentMa = '';
  let currentBlockLabel = '';
  let blockIndex = 0;
  const periodCounters = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowMa = pickField(row, ['Mã', 'Ma', 'huybitvvt@gmail.com']);
    const loai = pickField(row, ['Loại báo cáo', 'Loai bao cao']);
    const name = pickField(row, ['Tên báo cáo', 'Ten bao cao']);

    if (rowMa) {
      blockIndex += 1;
      currentMa = rowMa;
      const sectionLabel = buildReportMenuLabel(rowMa, name);
      if (sectionLabel) {
        currentBlockLabel = sectionLabel;
      }

      const nextBlockKey = `bc-${rowMa}`;
      if (!blockKeys.has(nextBlockKey)) {
        blockKeys.add(nextBlockKey);
        blocks.push({
          blockKey: nextBlockKey,
          ma: rowMa,
          blockLabel: formatBlockLabelRomanDot(sectionLabel || rowMa.trim()),
          order: blockIndex,
        });
      }
    }

    const reportBlockKey = `bc-${currentMa || blockIndex}`;

    if (!name && loai && currentMa) {
      ensureReportGroup(groups, groupKeys, reportBlockKey, loai);
      return;
    }

    if (!isReportLeaf(row, name)) {
      return;
    }

    const key =
      pickField(row, ['id', 'ID', 'Id']) ||
      `report-${pickField(row, ['_RowNumber']) || String(index + 1)}`;
    const ky = pickField(row, ['Kỳ báo cáo', 'Ky bao cao']);
    const ngay = pickField(row, ['Ngày báo cáo', 'Ngay bao cao']);
    const ngayTaoBaoCao = pickDateField(row, [
      'Ngày update link',
      'Ngay update link',
      'Ngày Update Link',
      'Ngay Update Link',
      'Ngày Update link',
      'Ngày cập nhật link',
      'Ngay cap nhat link',
    ]);
    const periodLabel = periodForKy(ky, ngay);
    const periodKey = `period-${reportBlockKey}-${periodLabel}`;
    const counterKey = `${reportBlockKey}-${periodLabel}`;
    const nextStt = (periodCounters.get(counterKey) ?? 0) + 1;
    periodCounters.set(counterKey, nextStt);
    const menuLabel = buildReportMenuLabel(rowMa, name) || name;
    const groupKey = loai ? ensureReportGroup(groups, groupKeys, reportBlockKey, loai) : undefined;

    reports[key] = {
      key,
      stt: nextStt,
      ma: rowMa || currentMa,
      name,
      menuLabel,
      noidung: pickField(row, ['Nội dung', 'Noi dung']),
      ngayTaoBaoCao,
      ngay: ngay || ky,
      ky: ky || ngay,
      nguoiGui: pickField(row, ['Người gửi báo cáo', 'Nguoi gui bao cao']),
      nguoiNhan: pickField(row, ['Người nhận báo cáo', 'Nguoi nhan bao cao']),
      luong: pickField(row, ['Luồng báo cáo', 'Luong bao cao']),
      link: parseAppsheetLink(pickField(row, ['Link báo cáo', 'Link bao cao'])),
      loaiBaoCao: loai || currentBlockLabel,
      blockKey: reportBlockKey,
      blockLabel: formatBlockLabelRomanDot(currentBlockLabel || menuLabel || loai),
      periodKey,
      periodLabel,
      groupKey,
      sourceRow: { ...row },
    };
  });

  return { reports, blocks, groups };
}

export function mapAppsheetRowsToReports(rows: Record<string, unknown>[]): Record<string, ReportRecord> {
  return mapAppsheetRowsToReportCatalog(rows).reports;
}

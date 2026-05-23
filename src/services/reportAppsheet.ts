import type { ReportBlockRecord, ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import { formatUnknownAsDisplayDate, normalizeDisplayDate } from '../utils/taskDate';

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
  return formatUnknownAsDisplayDate(value);
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

export function kyLabelFromPeriodLabel(periodLabel: string): string {
  const label = periodLabel.toLowerCase();
  if (label.includes('tuần')) {
    return 'Tuần';
  }
  if (label.includes('tháng') || label.includes('nửa tháng')) {
    return 'Tháng';
  }
  if (label.includes('quý')) {
    return 'Quý';
  }
  return periodLabel.replace(/^Báo cáo\s+/i, '').trim() || 'Tuần';
}

export function buildAppsheetReportRow(input: {
  ma: string;
  loaiBaoCao: string;
  tenBaoCao: string;
  noidung?: string;
  kyBaoCao?: string;
  ngayBaoCao?: string;
  nguoiGui?: string;
  nguoiNhan?: string;
  link?: string;
  ngayUpdateLink?: string;
}): Record<string, unknown> {
  const row: Record<string, unknown> = {
    Mã: input.ma.trim(),
    'Loại báo cáo': input.loaiBaoCao.trim(),
    'Tên báo cáo': input.tenBaoCao.trim(),
  };

  if (input.noidung?.trim()) {
    row['Nội dung'] = input.noidung.trim();
  }
  if (input.kyBaoCao?.trim()) {
    row['Kỳ báo cáo'] = input.kyBaoCao.trim();
  }
  if (input.ngayBaoCao?.trim()) {
    row['Ngày báo cáo'] = input.ngayBaoCao.trim();
  }
  if (input.nguoiGui?.trim()) {
    row['Người gửi báo cáo'] = input.nguoiGui.trim();
  }
  if (input.nguoiNhan?.trim()) {
    row['Người nhận báo cáo'] = input.nguoiNhan.trim();
  }
  if (input.link?.trim()) {
    row['Link báo cáo'] = input.link.trim();
  }
  if (input.ngayUpdateLink?.trim()) {
    row['Ngày update link'] = input.ngayUpdateLink.trim();
  }

  return row;
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
    const ngay = normalizeDisplayDate(pickField(row, ['Ngày báo cáo', 'Ngay bao cao']));
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

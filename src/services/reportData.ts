import type { ReportBlockRecord, ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import { applyRowKey, pickRowKey } from './rowKey';
import { formatRecordDate, formatUnknownAsDisplayDate, normalizeDisplayDate } from '../utils/taskDate';

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
      normalized.includes('ngay bao cao') ||
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

function parseReportLink(value: string): string {
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

export function getReportTableName(): string {
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

const MA_BLOCK_SID_ROOT: Record<string, string> = {
  I: 'sid1',
  II: 'sid2',
  III: 'sid3',
  IV: 'sid4',
};

function normalizeReportMa(ma: string): string {
  return ma.trim().toUpperCase().replace(/\.$/, '');
}

function discoverBlockSidRoot(ma: string, existingRows: Record<string, unknown>[]): string | null {
  const normalized = normalizeReportMa(ma);
  const mapped = MA_BLOCK_SID_ROOT[normalized];
  if (mapped) {
    return mapped;
  }

  for (const row of existingRows) {
    const rowMa = pickField(row, ['Mã', 'Ma']);
    if (normalizeReportMa(rowMa) !== normalized) {
      continue;
    }
    const id = pickField(row, ['id', 'ID', 'Id']);
    if (/^sid\d+$/i.test(id)) {
      return id;
    }
  }

  return null;
}

/** Sinh id kiểu sid1.7 theo khối (I→sid1, II→sid2, …). */
export function generateReportId(
  ma: string,
  existingRows: Record<string, unknown>[] = [],
  blockKey?: string
): string {
  const resolvedMa = resolveReportMa(ma, blockKey);
  const blockRoot = discoverBlockSidRoot(resolvedMa || ma, existingRows);
  if (!blockRoot) {
    const safeMa = resolvedMa || normalizeReportMa(ma) || 'X';
    return `sid-${safeMa}-${Date.now().toString(36)}`;
  }

  let maxSuffix = 0;
  const prefix = `${blockRoot}.`;
  for (const row of existingRows) {
    const id = pickField(row, ['id', 'ID', 'Id']);
    if (!id.startsWith(prefix)) {
      continue;
    }
    const suffix = Number(id.slice(prefix.length));
    if (Number.isFinite(suffix) && suffix > maxSuffix) {
      maxSuffix = Math.trunc(suffix);
    }
  }

  return `${blockRoot}.${maxSuffix + 1}`;
}

/** Số thứ tự tiếp theo (_RowNumber dạng chuỗi). */
export function getNextReportRowNumber(existingRows: Record<string, unknown>[]): number {
  let max = 1;
  for (const row of existingRows) {
    const value = row._RowNumber;
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    if (Number.isFinite(parsed) && parsed > max) {
      max = Math.trunc(parsed);
    }
  }
  return max + 1;
}

function resolveReportMa(ma: string, blockKey?: string): string {
  const fromMa = normalizeReportMa(ma);
  if (fromMa) {
    return fromMa;
  }
  const match = blockKey?.match(/^bc-(.+)$/i);
  return match ? normalizeReportMa(match[1]) : '';
}

export function buildReportRow(input: {
  ma: string;
  blockKey?: string;
  loaiBaoCao: string;
  tenBaoCao: string;
  id?: string;
  existingRows?: Record<string, unknown>[];
  rowNumber?: number;
  noidung?: string;
  kyBaoCao?: string;
  ngayBaoCao?: string;
  nguoiGui?: string;
  nguoiNhan?: string;
  link?: string;
  ngayUpdateLink?: string;
}): Record<string, unknown> {
  const existingRows = input.existingRows ?? [];
  const resolvedMa = resolveReportMa(input.ma, input.blockKey);
  const rowNumber = Math.trunc(
    input.rowNumber ?? getNextReportRowNumber(existingRows)
  );
  const blockRoot = discoverBlockSidRoot(resolvedMa || input.ma, existingRows);
  // Gắn số thứ tự dòng (_RowNumber) vào id: sid1.45 hoặc "45" nếu không có khối sid.
  const defaultId = blockRoot ? `${blockRoot}.${rowNumber}` : String(rowNumber);
  const row: Record<string, unknown> = {
    id: (input.id?.trim() || defaultId).trim(),
    Mã: input.ma.trim() || resolvedMa,
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
    row['Ngày báo cáo'] = formatRecordDate(input.ngayBaoCao) || input.ngayBaoCao.trim();
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

export type ReportFieldUpdates = {
  ma?: string;
  loaiBaoCao?: string;
  tenBaoCao?: string;
  noidung?: string;
  kyBaoCao?: string;
  ngayBaoCao?: string;
  nguoiGui?: string;
  nguoiNhan?: string;
  link?: string;
  ngayUpdateLink?: string;
};

export function buildReportEditRow(
  sourceRow: Record<string, unknown>,
  updates: ReportFieldUpdates,
  reportKey?: string
): Record<string, unknown> {
  const table = getReportTableName();
  const row: Record<string, unknown> = {};

  if (updates.ma !== undefined) {
    row['Mã'] = updates.ma.trim();
  }
  if (updates.loaiBaoCao !== undefined) {
    row['Loại báo cáo'] = updates.loaiBaoCao.trim();
  }
  if (updates.tenBaoCao !== undefined) {
    row['Tên báo cáo'] = updates.tenBaoCao.trim();
  }
  if (updates.noidung !== undefined) {
    row['Nội dung'] = updates.noidung.trim();
  }
  if (updates.kyBaoCao !== undefined) {
    row['Kỳ báo cáo'] = updates.kyBaoCao.trim();
  }
  if (updates.ngayBaoCao !== undefined) {
    const formatted = formatRecordDate(updates.ngayBaoCao) || updates.ngayBaoCao.trim();
    row['Ngày báo cáo'] = formatted;
  }
  if (updates.nguoiGui !== undefined) {
    row['Người gửi báo cáo'] = updates.nguoiGui.trim();
  }
  if (updates.nguoiNhan !== undefined) {
    row['Người nhận báo cáo'] = updates.nguoiNhan.trim();
  }
  if (updates.link !== undefined) {
    row['Link báo cáo'] = updates.link.trim();
  }
  if (updates.ngayUpdateLink !== undefined) {
    row['Ngày update link'] =
      formatRecordDate(updates.ngayUpdateLink) || updates.ngayUpdateLink.trim();
  }

  const rowKey = reportKey?.trim() || pickRowKey(sourceRow, table);
  return applyRowKey(row, sourceRow, rowKey, table);
}

export function buildReportDeleteRow(
  sourceRow: Record<string, unknown>,
  reportKey?: string
): Record<string, unknown> {
  const table = getReportTableName();
  const rowKey = reportKey?.trim() || pickRowKey(sourceRow, table);
  return applyRowKey({}, sourceRow, rowKey, table);
}

function slugifyGroupLabel(label: string): string {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized || 'nhom';
}

function buildStableGroupKey(blockKey: string, label: string, groupKeys: Set<string>): string {
  const base = `group-${blockKey}-${slugifyGroupLabel(label)}`;
  let key = base;
  let suffix = 2;
  while (groupKeys.has(key)) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }
  return key;
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

  const legacyGroupKey = `group-${blockKey}-${groups.length + 1}`;
  const groupKey = buildStableGroupKey(blockKey, label, groupKeys);
  groupKeys.add(groupKey);
  groups.push({
    groupKey,
    blockKey,
    label,
    order: groups.filter(group => group.blockKey === blockKey).length + 1,
    legacyGroupKeys: legacyGroupKey !== groupKey ? [legacyGroupKey] : undefined,
  });
  return groupKey;
}

export function mapRowsToReportCatalog(rows: Record<string, unknown>[]): ReportCatalog {
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
      pickField(row, ['id', 'ID', 'Id']) || `report-${String(index + 1)}`;
    const ky = pickField(row, ['Kỳ báo cáo', 'Ky bao cao']);
    const ngay = pickDateField(row, ['Ngày báo cáo', 'Ngay bao cao', 'Ngày Báo cáo']);
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
      link: parseReportLink(pickField(row, ['Link báo cáo', 'Link bao cao'])),
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

export function mapRowsToReports(rows: Record<string, unknown>[]): Record<string, ReportRecord> {
  return mapRowsToReportCatalog(rows).reports;
}

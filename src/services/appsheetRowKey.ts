import { getReportAppsheetTableName } from './reportAppsheet';

/** Khóa dòng bảng báo cáo BC định kỳ */
export const REPORT_ROW_KEY_COLUMN = 'id';

/** Khóa dòng bảng công việc (I.1, II.3, …) */
export const TASK_ROW_KEY_COLUMN = 'TT';

const REPORT_ID_KEYS = ['id', 'ID', 'Id'];
const TASK_TT_KEYS = ['TT', 'STT', 'Stt', 'stt'];

function parseKeyValue(value: unknown): string | null {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function pickFromKeys(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const parsed = parseKeyValue(row[key]);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

export function isReportAppsheetTable(tableName?: string): boolean {
  if (!tableName) {
    return false;
  }
  return tableName === getReportAppsheetTableName();
}

export function getAppsheetRowKeyColumn(tableName?: string): string {
  return isReportAppsheetTable(tableName) ? REPORT_ROW_KEY_COLUMN : TASK_ROW_KEY_COLUMN;
}

export function pickAppsheetRowKey(
  sourceRow: Record<string, unknown>,
  tableName?: string
): string | null {
  if (isReportAppsheetTable(tableName)) {
    return pickFromKeys(sourceRow, REPORT_ID_KEYS);
  }
  return pickFromKeys(sourceRow, TASK_TT_KEYS);
}

export function hasAppsheetRowKey(
  sourceRow: Record<string, unknown>,
  explicitRowKey?: string | number | null,
  tableName?: string
): boolean {
  const explicit =
    explicitRowKey !== null && explicitRowKey !== undefined ? String(explicitRowKey).trim() : '';
  if (explicit) {
    return true;
  }
  return pickAppsheetRowKey(sourceRow, tableName) != null;
}

export function applyAppsheetRowKey(
  row: Record<string, unknown>,
  sourceRow: Record<string, unknown>,
  explicitRowKey?: string | number | null,
  tableName?: string
): Record<string, unknown> {
  const explicit =
    explicitRowKey !== null && explicitRowKey !== undefined ? String(explicitRowKey).trim() : '';
  const rowKey = explicit || pickAppsheetRowKey(sourceRow, tableName);
  if (rowKey) {
    row[getAppsheetRowKeyColumn(tableName)] = rowKey;
  }
  return row;
}

export function assertAppsheetEditRow(row: Record<string, unknown>, tableName?: string): void {
  const column = getAppsheetRowKeyColumn(tableName);
  if (!parseKeyValue(row[column]) && !pickAppsheetRowKey(row, tableName)) {
    const label = isReportAppsheetTable(tableName) ? 'id' : 'TT';
    throw new Error(`Không có khóa ${label} để cập nhật AppSheet. Hãy F5 tải lại danh sách.`);
  }
}

/** @deprecated */
export const APPSHEET_ROW_KEY_COLUMN = REPORT_ROW_KEY_COLUMN;
export const pickAppsheetRowNumber = pickAppsheetRowKey;

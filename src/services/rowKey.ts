export const REPORT_TABLE_LOGICAL = 'BC định kỳ';

export const REPORT_ROW_KEY_COLUMN = 'id';
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

export function isReportTableName(tableName?: string): boolean {
  if (!tableName) {
    return false;
  }
  return tableName.trim() === REPORT_TABLE_LOGICAL;
}

export function getRowKeyColumn(tableName?: string): string {
  return isReportTableName(tableName) ? REPORT_ROW_KEY_COLUMN : TASK_ROW_KEY_COLUMN;
}

export function pickRowKey(sourceRow: Record<string, unknown>, tableName?: string): string | null {
  if (isReportTableName(tableName)) {
    return pickFromKeys(sourceRow, REPORT_ID_KEYS);
  }
  return pickFromKeys(sourceRow, TASK_TT_KEYS);
}

export function hasRowKey(
  sourceRow: Record<string, unknown>,
  explicitRowKey?: string | number | null,
  tableName?: string
): boolean {
  const explicit =
    explicitRowKey !== null && explicitRowKey !== undefined ? String(explicitRowKey).trim() : '';
  if (explicit) {
    return true;
  }
  return pickRowKey(sourceRow, tableName) != null;
}

export function applyRowKey(
  row: Record<string, unknown>,
  sourceRow: Record<string, unknown>,
  explicitRowKey?: string | number | null,
  tableName?: string
): Record<string, unknown> {
  const explicit =
    explicitRowKey !== null && explicitRowKey !== undefined ? String(explicitRowKey).trim() : '';
  const rowKey = explicit || pickRowKey(sourceRow, tableName);
  if (rowKey) {
    row[getRowKeyColumn(tableName)] = rowKey;
  }
  return row;
}

export function assertEditRow(row: Record<string, unknown>, tableName?: string): void {
  const column = getRowKeyColumn(tableName);
  if (!parseKeyValue(row[column]) && !pickRowKey(row, tableName)) {
    const label = isReportTableName(tableName) ? 'id' : 'TT';
    throw new Error(`Không có khóa ${label} để cập nhật. Hãy F5 tải lại danh sách.`);
  }
}

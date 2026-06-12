const REPORT_TABLE = 'BC định kỳ';
const REPORT_ID_KEYS = ['id', 'ID', 'Id'];
const TASK_TT_KEYS = ['TT', 'STT', 'Stt', 'stt'];

function pickKey(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return null;
}

function isReportTable(table: string): boolean {
  return table === REPORT_TABLE;
}

export function normalizeRowsForKeyAction(
  rows: Record<string, unknown>[],
  action: 'Edit' | 'Delete',
  table: string
): Record<string, unknown>[] {
  const isReport = isReportTable(table);
  const column = isReport ? 'id' : 'TT';
  const keys = isReport ? REPORT_ID_KEYS : TASK_TT_KEYS;

  return rows.map(row => {
    const rowKey = pickKey(row, keys);
    if (!rowKey) {
      throw new Error(
        `Không có giá trị cột ${column} cho thao tác ${action}. Tải lại danh sách.`
      );
    }
    return { ...row, [column]: rowKey };
  });
}

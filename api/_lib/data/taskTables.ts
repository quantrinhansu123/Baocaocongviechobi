/** Tên bảng công việc (map menu I.1 … IV.2). */
const BLOCK_ROMANS = ['I', 'II', 'III', 'IV'] as const;
const BLOCK_DEPT_COUNTS = [3, 9, 3, 2] as const;

export function listTaskTableNames(): string[] {
  return BLOCK_ROMANS.flatMap((block, blockIndex) =>
    Array.from({ length: BLOCK_DEPT_COUNTS[blockIndex] }, (_, deptIndex) => `${block}.${deptIndex + 1}`)
  );
}

export function isTaskTableName(tableName: string): boolean {
  return listTaskTableNames().includes(tableName.trim());
}

/** I.1 → i_1, II.4 → ii_4 */
export function taskTableToSupabaseName(taskTable: string): string {
  const normalized = taskTable.trim();
  const match = normalized.match(/^([IV]+)\.(\d+)$/i);
  if (!match) {
    return normalized.toLowerCase().replace('.', '_');
  }
  return `${match[1].toLowerCase()}_${match[2]}`;
}

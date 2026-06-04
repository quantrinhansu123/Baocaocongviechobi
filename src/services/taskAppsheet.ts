import { findAppsheetTasks } from './appsheetApi';
import {
  applyAppsheetRowKey,
  getAppsheetRowKeyColumn,
  hasAppsheetRowKey,
  pickAppsheetRowKey,
  TASK_ROW_KEY_COLUMN,
} from './appsheetRowKey';
import { ORG_BLOCKS } from '../data/orgBlocks';
import type { TaskRecord } from '../types/task';
import {
  formatAppsheetDate,
  formatUnknownAsDisplayDate,
  normalizeDisplayDateTime,
  TASK_COMPLETED_STATUS_LABEL,
  getEffectiveDueDate,
} from '../utils/taskDate';

const ROMAN = ['I', 'II', 'III', 'IV'] as const;

function normalizeDeptLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

const DEPT_NAME_TO_KEY = new Map<string, string>();
const DEPT_KEY_SET = new Set<string>();
const TABLE_DEPT_KEY: Record<string, string> = {};

for (const block of ORG_BLOCKS) {
  for (const dept of block.depts) {
    DEPT_NAME_TO_KEY.set(normalizeDeptLabel(dept.name), dept.key);
    DEPT_KEY_SET.add(dept.key);
  }
}

ORG_BLOCKS.forEach((block, blockIndex) => {
  block.depts.forEach((dept, deptIndex) => {
    TABLE_DEPT_KEY[`${ROMAN[blockIndex]}.${deptIndex + 1}`] = dept.key;
  });
});

export function listAppsheetTableBindings(): Array<{ table: string; deptKey: string; department: string }> {
  return ORG_BLOCKS.flatMap((block, blockIndex) =>
    block.depts.map((dept, deptIndex) => ({
      table: `${ROMAN[blockIndex]}.${deptIndex + 1}`,
      deptKey: dept.key,
      department: dept.name,
    }))
  );
}

export function resolveAppsheetTableName(blockKey?: string, deptKey?: string): string | null {
  if (!blockKey || !deptKey) {
    return null;
  }

  const blockIndex = ORG_BLOCKS.findIndex(block => block.key === blockKey);
  if (blockIndex < 0) {
    return null;
  }

  const deptIndex = ORG_BLOCKS[blockIndex].depts.findIndex(dept => dept.key === deptKey);
  if (deptIndex < 0) {
    return null;
  }

  return `${ROMAN[blockIndex]}.${deptIndex + 1}`;
}

export function resolveDeptKeyFromAppsheetTable(tableName?: string): string | null {
  if (!tableName) {
    return null;
  }

  const deptKey = TABLE_DEPT_KEY[tableName];
  return deptKey ?? null;
}

function pickFormattedDate(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const formatted = formatUnknownAsDisplayDate(value);
    if (formatted) {
      return formatted;
    }
  }
  return '';
}

/** Tên cột AppSheet (xác nhận bởi người dùng). */
export const APPSHEET_NGAY_HOAN_THANH_COLUMN = 'Ngày hoàn thành';
export const APPSHEET_TIEN_DO_COLUMN = 'TIẾN ĐỘ';
export { hasAppsheetRowKey, pickAppsheetRowKey, TASK_ROW_KEY_COLUMN } from './appsheetRowKey';

function buildTtSelector(tt: string): string {
  const trimmed = tt.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return `Filter([TT], =${Number(trimmed)})`;
  }
  const escaped = trimmed.replace(/"/g, '""');
  return `Filter([TT], ="${escaped}")`;
}

function matchRowByTt(row: Record<string, unknown>, tt: string): boolean {
  const rowTt = pickField(row, ['TT', 'STT', 'Stt', 'stt']);
  return rowTt === tt || String(rowTt) === String(tt);
}

function mergeHydratedRow(
  sourceRow: Record<string, unknown>,
  refreshed: Record<string, unknown>,
  tableName: string
): Record<string, unknown> {
  const column = getAppsheetRowKeyColumn(tableName);
  const rowKey = pickAppsheetRowKey(refreshed, tableName);
  if (!rowKey) {
    return sourceRow;
  }

  return {
    ...sourceRow,
    ...refreshed,
    [column]: rowKey,
  };
}

/** Tải lại cột id từ AppSheet khi bản ghi trong bộ nhớ thiếu khóa dòng. */
export async function hydrateSourceRowAppsheetKey(
  sourceRow: Record<string, unknown>,
  tableName: string
): Promise<Record<string, unknown>> {
  const existingKey = pickAppsheetRowKey(sourceRow, tableName);
  if (existingKey) {
    return { ...sourceRow, [getAppsheetRowKeyColumn(tableName)]: existingKey };
  }

  const tt = pickField(sourceRow, ['TT', 'STT', 'Stt', 'stt']);
  if (!tt) {
    return sourceRow;
  }

  try {
    const selectorResult = await findAppsheetTasks({ table: tableName, selector: buildTtSelector(tt) });
    const fromSelector =
      selectorResult.rows.find(row => matchRowByTt(row, tt)) ?? selectorResult.rows[0];
    if (fromSelector && pickAppsheetRowKey(fromSelector)) {
      return mergeHydratedRow(sourceRow, fromSelector, tableName);
    }

    const fullResult = await findAppsheetTasks({ table: tableName });
    const fromFull = fullResult.rows.find(row => matchRowByTt(row, tt));
    if (fromFull) {
      return mergeHydratedRow(sourceRow, fromFull, tableName);
    }
  } catch {
    return sourceRow;
  }

  return sourceRow;
}

function resolveTienDoColumnKey(row: Record<string, unknown>): string {
  return resolveRowColumnKey(
    row,
    [APPSHEET_TIEN_DO_COLUMN, 'Tiến độ', 'Tien do', 'TienDo', 'tienDo'],
    APPSHEET_TIEN_DO_COLUMN
  );
}

function resolveNgayHoanThanhColumnKey(row: Record<string, unknown>): string {
  return resolveRowColumnKey(
    row,
    [APPSHEET_NGAY_HOAN_THANH_COLUMN, 'NGÀY HOÀN THÀNH', 'Ngay hoan thanh'],
    APPSHEET_NGAY_HOAN_THANH_COLUMN
  );
}

export function pickNgayHoanThanhFromRow(row: Record<string, unknown>): string {
  const key = resolveNgayHoanThanhColumnKey(row);
  const value = row[key];
  if (value === null || value === undefined || String(value).trim() === '') {
    return '';
  }

  const formattedDate = formatUnknownAsDisplayDate(value);
  if (formattedDate) {
    return formattedDate;
  }

  const formattedDateTime = normalizeDisplayDateTime(
    value instanceof Date || typeof value === 'number' ? value : String(value)
  );
  if (formattedDateTime) {
    return formattedDateTime.split(/\s+/)[0] ?? formattedDateTime;
  }

  return '';
}

function resolveRowColumnKey(
  sourceRow: Record<string, unknown>,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(sourceRow, key)) {
      return key;
    }
  }

  const normalizedTargets = new Map(keys.map(key => [key.toLowerCase(), key]));
  for (const sourceKey of Object.keys(sourceRow)) {
    const match = normalizedTargets.get(sourceKey.toLowerCase());
    if (match) {
      return sourceKey;
    }
  }

  return fallback;
}

export function isTaskRecordCompleted(
  task: Pick<TaskRecord, 'tienDo' | 'trangThai'> & { ngayGioHoanThanh?: string; ngayHoanThanh?: string }
): boolean {
  const normalizedTienDo = (task.tienDo ?? '').trim().toLowerCase();
  const normalizedTrangThai = (task.trangThai ?? '').trim().toLowerCase();
  const COMPLETED_SYNONYMS = new Set([
    'hoàn thành',
    'đã hoàn thành',
    'hoan thanh',
    'da hoan thanh',
    'hoàn tất',
    'hoan tat',
    'đã xong',
    'da xong',
    'xong',
    'done',
    'completed',
    'complete'
  ]);

  if (COMPLETED_SYNONYMS.has(normalizedTienDo) || COMPLETED_SYNONYMS.has(normalizedTrangThai)) {
    return true;
  }

  const ngayHoanThanh = (task.ngayGioHoanThanh ?? task.ngayHoanThanh ?? '').trim();
  return Boolean(ngayHoanThanh);
}

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

function pickNumber(row: Record<string, unknown>, keys: string[], fallback = 1): number {
  const raw = pickField(row, keys);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const APPSHEET_TIEN_DO_VALUES = new Set(['Đang thực hiện', 'Hoàn thành', 'Quá hạn']);

export function normalizeAppsheetTienDo(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Chưa bắt đầu';
  }

  if (trimmed === 'Đang thực hiện') {
    return 'Đang làm';
  }

  if (trimmed === 'Đang làm' || trimmed === 'Hoàn thành' || trimmed === 'Quá hạn' || trimmed === 'Chưa bắt đầu') {
    return trimmed;
  }

  return 'Chưa bắt đầu';
}

export function serializeAppsheetTienDo(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed === 'Chưa bắt đầu') {
    return undefined;
  }

  if (trimmed === 'Đang làm') {
    return 'Đang thực hiện';
  }

  if (APPSHEET_TIEN_DO_VALUES.has(trimmed)) {
    return trimmed;
  }

  return undefined;
}

function resolveDeptKey(row: Record<string, unknown>, tableName?: string): string {
  const tableDeptKey = tableName ? TABLE_DEPT_KEY[tableName] : undefined;
  if (tableDeptKey && DEPT_KEY_SET.has(tableDeptKey)) {
    return tableDeptKey;
  }
  const directKey = pickField(row, ['deptKey', 'DeptKey', 'PhongBanKey', 'Phòng ban key']);
  if (DEPT_KEY_SET.has(directKey)) {
    return directKey;
  }

  const deptLabel = pickField(row, [
    'Phòng ban',
    'Phong ban',
    'PhongBan',
    'Department',
    'Don vi',
    'Đơn vị',
    'Bo phan',
    'Bộ phận',
  ]);

  if (deptLabel) {
    const mapped = DEPT_NAME_TO_KEY.get(normalizeDeptLabel(deptLabel));
    if (mapped) {
      return mapped;
    }
  }

  return 'bld-ca-nhan';
}

function resolveTaskKey(row: Record<string, unknown>, index: number, deptKey: string): string {
  const explicit = pickField(row, ['_ComputedKey', 'Row ID', 'RowID', 'ID', 'Id', 'id', 'Key']);
  if (explicit) {
    return `${deptKey}-${explicit}`;
  }
  return `${deptKey}-appsheet-${index + 1}`;
}

export function mapAppsheetRowToTaskRecord(
  row: Record<string, unknown>,
  index: number,
  tableName?: string
): {
  deptKey: string;
  taskKey: string;
  task: TaskRecord;
} {
  const deptKey = resolveDeptKey(row, tableName);
  const taskKey = resolveTaskKey(row, index, deptKey);

  const deadlineVal = pickFormattedDate(row, ['Y/C XONG', 'Yêu cầu xong', 'Yeu cau xong', 'YcXong', 'ycXong', 'Deadline', 'Due date']);
  const giaHan1Val = pickFormattedDate(row, ['GIA HẠN 1', 'Gia hạn 1', 'Gia han 1', 'GiaHan1', 'giaHan1']);
  const giaHan2Val = pickFormattedDate(row, ['GIA HẠN 2', 'Gia hạn 2', 'Gia han 2', 'GiaHan2', 'giaHan2']);
  const giaHan3Val = pickFormattedDate(row, ['GIA HẠN 3', 'Gia hạn 3', 'Gia han 3', 'GiaHan3', 'giaHan3']);

  const dueDatesInput = {
    deadline: deadlineVal,
    giaHan1: giaHan1Val,
    giaHan2: giaHan2Val,
    giaHan3: giaHan3Val
  };
  const effectiveDue = getEffectiveDueDate(dueDatesInput);
  const effectiveDeadlineStr = effectiveDue ? effectiveDue.format('DD/MM/YYYY') : deadlineVal;

  const tienDoVal = normalizeAppsheetTienDo(
    pickField(row, ['TIẾN ĐỘ', 'Tiến độ', 'Tien do', 'TienDo', 'tienDo'])
  );
  const trangThaiVal = pickField(row, [
    'TRẠNG THÁI',
    'Trạng thái',
    'Trang thai',
    'TrangThai',
    'trangThai',
    'Tình trạng',
    'Tinh trang',
  ]);
  const rawNgayHoanThanh = pickNgayHoanThanhFromRow(row);

  const normalizedTienDo = tienDoVal?.trim().toLowerCase() || '';
  const normalizedTrangThai = trangThaiVal?.trim().toLowerCase() || '';
  const COMPLETED_SYNONYMS = new Set([
    'hoàn thành',
    'đã hoàn thành',
    'hoan thanh',
    'da hoan thanh',
    'hoàn tất',
    'hoan tat',
    'đã xong',
    'da xong',
    'xong',
    'done',
    'completed',
    'complete'
  ]);

  const isCompleted = 
    COMPLETED_SYNONYMS.has(normalizedTienDo) || 
    COMPLETED_SYNONYMS.has(normalizedTrangThai) || 
    Boolean(rawNgayHoanThanh);

  const ngayGioHoanThanh = rawNgayHoanThanh;

  return {
    deptKey,
    taskKey,
    task: {
      stt: pickNumber(row, ['TT', 'STT', 'Stt', 'stt'], index + 1),
      kyBaoCao: pickField(row, ['Kỳ báo cáo', 'Ky bao cao', 'KyBaoCao', 'kyBaoCao', 'Period']),
      congViec: pickField(row, ['CÔNG VIỆC', 'Công việc', 'Cong viec', 'CongViec', 'congViec', 'Task', 'Title']),
      nguoiGiao: pickField(row, [
        'NGƯỜI ĐƯỢC GIAO',
        'Người giao',
        'Nguoi giao',
        'NguoiGiao',
        'nguoiGiao',
        'Assignee',
        'Người phụ trách',
      ]),
      ngayGiao: pickFormattedDate(row, ['NGÀY GIAO', 'Ngày giao', 'Ngay giao', 'NgayGiao', 'ngayGiao', 'Start date']),
      ycXong: deadlineVal,
      giaHan1: pickFormattedDate(row, ['GIA HẠN 1', 'Gia hạn 1', 'Gia han 1', 'GiaHan1', 'giaHan1']),
      giaHan2: pickFormattedDate(row, ['GIA HẠN 2', 'Gia hạn 2', 'Gia han 2', 'GiaHan2', 'giaHan2']),
      giaHan3: pickFormattedDate(row, ['GIA HẠN 3', 'Gia hạn 3', 'Gia han 3', 'GiaHan3', 'giaHan3']),
      ketQua: pickField(row, ['KẾT QUẢ', 'Kết quả', 'Ket qua', 'KetQua', 'ketQua', 'Result']),
      linkKQ: pickField(row, ['LINK KQ', 'Link KQ', 'LinkKQ', 'linkKQ', 'Link']),
      tienDo: tienDoVal,
      trangThai: trangThaiVal,
      ngayGioHoanThanh,
      vuongMac: pickField(row, ['VƯỚNG MẮC', 'Vướng mắc', 'Vuong mac', 'VuongMac', 'vuongMac']),
      canLD: pickField(row, ['CẦN LĐ TÁC ĐỘNG', 'Cần LD', 'Can LD', 'CanLD', 'canLD']) || 'Không',
      anhHuong: pickNumber(row, ['MỨC ẢNH HƯỞNG', 'Ảnh hưởng', 'Anh huong', 'AnhHuong', 'anhHuong', 'Priority'], 1),
      appsheetRowKey: pickAppsheetRowKey(row, tableName),
      sourceRow: { ...row },
    },
  };
}

export function mapAppsheetRowsToTasksByDept(
  rows: Record<string, unknown>[],
  tableName?: string
): Record<string, Record<string, TaskRecord>> {
  const tasksByDept: Record<string, Record<string, TaskRecord>> = {};

  rows.forEach((row, index) => {
    const mapped = mapAppsheetRowToTaskRecord(row, index, tableName);
    if (!tasksByDept[mapped.deptKey]) {
      tasksByDept[mapped.deptKey] = {};
    }
    tasksByDept[mapped.deptKey][mapped.taskKey] = mapped.task;
  });

  return tasksByDept;
}

export function buildAppsheetTaskRow(input: {
  deptKey: string;
  congViec: string;
  nguoiPhuTrach: string;
  deadline: string;
  giaHan1?: string;
  giaHan2?: string;
  giaHan3?: string;
  anhHuong: number;
  kyBaoCao?: string;
  stt?: number;
}): Record<string, unknown> {
  return {
    TT: input.stt != null ? String(input.stt) : '',
    'CÔNG VIỆC': input.congViec,
    'NGƯỜI ĐƯỢC GIAO': input.nguoiPhuTrach,
    'NGÀY GIAO': formatAppsheetDate(new Date().toLocaleDateString('vi-VN')),
    'Y/C XONG': formatAppsheetDate(input.deadline),
    'GIA HẠN 1': formatAppsheetDate(input.giaHan1 ?? ''),
    'GIA HẠN 2': formatAppsheetDate(input.giaHan2 ?? ''),
    'GIA HẠN 3': formatAppsheetDate(input.giaHan3 ?? ''),
    'CẦN LĐ TÁC ĐỘNG': 'Không',
    'MỨC ẢNH HƯỞNG': String(input.anhHuong),
  };
}

export function buildAppsheetEditRow(
  task: TaskRecord,
  sourceRow: Record<string, unknown>,
  tableName: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  row['CÔNG VIỆC'] = task.congViec;
  row['NGƯỜI ĐƯỢC GIAO'] = task.nguoiGiao;
  row['NGÀY GIAO'] = formatAppsheetDate(task.ngayGiao);
  row['Y/C XONG'] = formatAppsheetDate(task.ycXong);
  row['GIA HẠN 1'] = formatAppsheetDate(task.giaHan1);
  row['GIA HẠN 2'] = formatAppsheetDate(task.giaHan2);
  row['GIA HẠN 3'] = formatAppsheetDate(task.giaHan3);
  row['KẾT QUẢ'] = task.ketQua;
  row['LINK KQ'] = task.linkKQ;
  row['VƯỚNG MẮC'] = task.vuongMac;
  row['CẦN LĐ TÁC ĐỘNG'] = task.canLD.trim() || 'Không';
  row['MỨC ẢNH HƯỞNG'] = String(task.anhHuong);

  const tienDo = serializeAppsheetTienDo(task.tienDo);
  if (tienDo) {
    row['TIẾN ĐỘ'] = tienDo;
  }

  return applyAppsheetRowKey(row, sourceRow, task.appsheetRowKey, tableName);
}

export function mergeTaskCompletion(
  task: TaskRecord,
  completedAt: Date,
  editRow: Record<string, unknown>
): TaskRecord {
  const mergedSource = { ...(task.sourceRow ?? {}), ...editRow };
  const ngayHoanThanh =
    pickNgayHoanThanhFromRow(mergedSource) || formatAppsheetDate(completedAt);

  return {
    ...task,
    tienDo: 'Hoàn thành',
    trangThai: '',
    ngayGioHoanThanh: ngayHoanThanh,
    appsheetRowKey: pickAppsheetRowKey(mergedSource) ?? task.appsheetRowKey,
    sourceRow: mergedSource,
  };
}

/** Chỉ gửi các cột có thật trên AppSheet: TT, TIẾN ĐỘ, Ngày hoàn thành. */
export function buildAppsheetCompleteTaskRow(
  sourceRow: Record<string, unknown>,
  completedAt: Date = new Date(),
  explicitRowKey?: string | null,
  tableName?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  const tienDoValue = serializeAppsheetTienDo('Hoàn thành') ?? 'Hoàn thành';
  row[APPSHEET_TIEN_DO_COLUMN] = tienDoValue;
  row[APPSHEET_NGAY_HOAN_THANH_COLUMN] = formatAppsheetDate(completedAt);

  return applyAppsheetRowKey(row, sourceRow, explicitRowKey, tableName);
}

export function buildAppsheetTienDoEditRow(
  tienDo: string,
  sourceRow: Record<string, unknown>,
  completedAt: Date = new Date(),
  explicitRowKey?: string | null,
  tableName?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  const serialized = serializeAppsheetTienDo(tienDo);
  if (serialized) {
    row[APPSHEET_TIEN_DO_COLUMN] = serialized;
  }

  if (tienDo.trim() === 'Hoàn thành' && !pickNgayHoanThanhFromRow(sourceRow)) {
    row[APPSHEET_NGAY_HOAN_THANH_COLUMN] = formatAppsheetDate(completedAt);
  }

  return applyAppsheetRowKey(row, sourceRow, explicitRowKey, tableName);
}

export function buildAppsheetDeleteRow(
  sourceRow: Record<string, unknown>,
  explicitRowKey?: string | null,
  tableName?: string
): Record<string, unknown> {
  return applyAppsheetRowKey({}, sourceRow, explicitRowKey, tableName);
}

import { ORG_BLOCKS } from '../data/orgBlocks';
import type { TaskRecord } from '../types/task';
import {
  formatAppsheetDate,
  formatUnknownAsDisplayDate,
  normalizeDisplayDateTime,
  TASK_COMPLETED_STATUS_LABEL,
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

export function isTaskRecordCompleted(task: Pick<TaskRecord, 'tienDo' | 'trangThai'>): boolean {
  if ((task.trangThai ?? '').trim() === TASK_COMPLETED_STATUS_LABEL) {
    return true;
  }

  return (task.tienDo ?? '').trim() === 'Hoàn thành';
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

  return {
    deptKey,
    taskKey,
    task: {
      stt: pickNumber(row, ['TT', 'STT', 'Stt', 'stt', '_RowNumber'], index + 1),
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
      ycXong: pickFormattedDate(row, ['Y/C XONG', 'Yêu cầu xong', 'Yeu cau xong', 'YcXong', 'ycXong', 'Deadline', 'Due date']),
      giaHan1: pickFormattedDate(row, ['GIA HẠN 1', 'Gia hạn 1', 'Gia han 1', 'GiaHan1', 'giaHan1']),
      giaHan2: pickFormattedDate(row, ['GIA HẠN 2', 'Gia hạn 2', 'Gia han 2', 'GiaHan2', 'giaHan2']),
      giaHan3: pickFormattedDate(row, ['GIA HẠN 3', 'Gia hạn 3', 'Gia han 3', 'GiaHan3', 'giaHan3']),
      ketQua: pickField(row, ['KẾT QUẢ', 'Kết quả', 'Ket qua', 'KetQua', 'ketQua', 'Result']),
      linkKQ: pickField(row, ['LINK KQ', 'Link KQ', 'LinkKQ', 'linkKQ', 'Link']),
      tienDo: normalizeAppsheetTienDo(
        pickField(row, ['TIẾN ĐỘ', 'Tiến độ', 'Tien do', 'TienDo', 'tienDo'])
      ),
      trangThai: pickField(row, [
        'TRẠNG THÁI',
        'Trạng thái',
        'Trang thai',
        'TrangThai',
        'trangThai',
        'Tình trạng',
        'Tinh trang',
      ]),
      ngayGioHoanThanh: pickNgayHoanThanhFromRow(row),
      vuongMac: pickField(row, ['VƯỚNG MẮC', 'Vướng mắc', 'Vuong mac', 'VuongMac', 'vuongMac']),
      canLD: pickField(row, ['CẦN LĐ TÁC ĐỘNG', 'Cần LD', 'Can LD', 'CanLD', 'canLD']) || 'Không',
      anhHuong: pickNumber(row, ['MỨC ẢNH HƯỞNG', 'Ảnh hưởng', 'Anh huong', 'AnhHuong', 'anhHuong', 'Priority'], 1),
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

export function buildAppsheetEditRow(task: TaskRecord, sourceRow: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const rowKey = pickField(sourceRow, ['TT', 'STT', 'Stt', 'stt']);

  if (rowKey) {
    row.TT = rowKey;
  } else if (task.stt) {
    row.TT = String(task.stt);
  }

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

  return row;
}

export function mergeTaskCompletion(
  task: TaskRecord,
  completedAt: Date,
  editRow: Record<string, unknown>
): TaskRecord {
  const mergedSource = { ...task.sourceRow, ...editRow };
  const ngayHoanThanh =
    pickNgayHoanThanhFromRow(mergedSource) || formatAppsheetDate(completedAt);

  return {
    ...task,
    tienDo: 'Hoàn thành',
    trangThai: TASK_COMPLETED_STATUS_LABEL,
    ngayGioHoanThanh: ngayHoanThanh,
    sourceRow: mergedSource,
  };
}

export function buildAppsheetCompleteTaskRow(
  sourceRow: Record<string, unknown>,
  completedAt: Date = new Date()
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const rowKey = pickField(sourceRow, ['TT', 'STT', 'Stt', 'stt']);

  if (rowKey) {
    row.TT = rowKey;
  }

  const statusKey = resolveRowColumnKey(
    sourceRow,
    ['TRẠNG THÁI', 'Trạng thái', 'Trang thai', 'Tình trạng', 'Tinh trang'],
    'TRẠNG THÁI'
  );
  const tienDoKey = resolveRowColumnKey(sourceRow, ['TIẾN ĐỘ', 'Tiến độ', 'Tien do', 'TienDo'], 'TIẾN ĐỘ');
  const ngayHoanThanhKey = resolveNgayHoanThanhColumnKey(sourceRow);

  row[statusKey] = TASK_COMPLETED_STATUS_LABEL;
  row[tienDoKey] = 'Hoàn thành';
  row[ngayHoanThanhKey] = formatAppsheetDate(completedAt);

  return row;
}

export function buildAppsheetTienDoEditRow(
  tienDo: string,
  sourceRow: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const rowKey = pickField(sourceRow, ['TT', 'STT', 'Stt', 'stt']);

  if (rowKey) {
    row.TT = rowKey;
  }

  const serialized = serializeAppsheetTienDo(tienDo);
  if (serialized) {
    row['TIẾN ĐỘ'] = serialized;
  }

  return row;
}

export function buildAppsheetDeleteRow(sourceRow: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const rowKey = pickField(sourceRow, ['TT', 'STT', 'Stt', 'stt']);

  if (rowKey) {
    row.TT = rowKey;
  }

  return row;
}

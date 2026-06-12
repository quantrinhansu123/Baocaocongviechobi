import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const DMY_FORMATS = ['DD/MM/YYYY', 'D/M/YYYY', 'DD/M/YYYY', 'D/MM/YYYY'];
const DMY_WITH_TIME_FORMATS = [
  'DD/MM/YYYY HH:mm:ss',
  'DD/MM/YYYY H:mm:ss',
  'DD/MM/YYYY H:mm',
  'D/M/YYYY HH:mm:ss',
];

/** Chuỗi dạng 15/05/2026 (ngày/tháng/năm) */
const DMY_SLASH_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/;

/** Số serial Excel / Google Sheets (vd. 46157 → 15/05/2026) */
const EXCEL_SERIAL_RE = /^\d+(\.\d+)?$/;

/** Google Sheets: ngày 1 = 30/12/1899 */
const SHEETS_SERIAL_EPOCH = '1899-12-30';

function fromSpreadsheetSerial(serial: number): dayjs.Dayjs | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_000_000) {
    return null;
  }

  const parsed = dayjs(SHEETS_SERIAL_EPOCH).add(Math.floor(serial), 'day');
  if (!parsed.isValid() || parsed.year() < 1900 || parsed.year() > 2100) {
    return null;
  }

  return parsed;
}

export function formatSpreadsheetSerialDate(value: string | number): string {
  const serial = typeof value === 'number' ? value : Number(String(value).trim());
  const parsed = fromSpreadsheetSerial(serial);
  return parsed ? parsed.format('DD/MM/YYYY') : '';
}

export type TaskDueDatesInput = {
  deadline: string;
  giaHan1?: string;
  giaHan2?: string;
  giaHan3?: string;
  tienDo?: string;
  trangThai?: string;
};


/** Ngày hạn cuối cùng = max(deadline, gia hạn 1–3). */
export function getEffectiveDueDate(input: TaskDueDatesInput): dayjs.Dayjs | null {
  const candidates = [input.deadline, input.giaHan1, input.giaHan2, input.giaHan3]
    .map(value => parseTaskDate(value))
    .filter((value): value is dayjs.Dayjs => value !== null);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((latest, current) => (current.isAfter(latest) ? current : latest));
}

/** Tự động tính toán trạng thái: Quá hạn, Hoàn thành, Đang làm */
export function calculateAutomaticStatus(input: {
  deadline: string;
  giaHan1?: string;
  giaHan2?: string;
  giaHan3?: string;
  ngayHoanThanh?: string;
}): 'Hoàn thành' | 'Quá hạn' | 'Đang làm' {
  const effectiveDue = getEffectiveDueDate({
    deadline: input.deadline,
    giaHan1: input.giaHan1,
    giaHan2: input.giaHan2,
    giaHan3: input.giaHan3,
  });

  const ngayHTStr = (input.ngayHoanThanh ?? '').trim();
  const hasCompletedDate = Boolean(ngayHTStr && ngayHTStr !== '—');

  if (!hasCompletedDate) {
    if (!effectiveDue) {
      return 'Đang làm';
    }
    const today = dayjs().startOf('day');
    if (today.isAfter(effectiveDue.startOf('day'))) {
      return 'Quá hạn';
    }
    return 'Đang làm';
  } else {
    // Có ngày hoàn thành
    const completedDate = parseTaskDate(ngayHTStr);
    if (!completedDate) {
      return 'Hoàn thành';
    }
    if (!effectiveDue) {
      return 'Hoàn thành';
    }
    if (completedDate.startOf('day').isAfter(effectiveDue.startOf('day'))) {
      return 'Quá hạn';
    }
    return 'Hoàn thành';
  }
}

/** Quá hạn khi hôm nay > hạn cuối (kể cả gia hạn), hoặc ngày hoàn thành > hạn cuối. */
export function isTaskOverduePastExtensions(input: TaskDueDatesInput & { ngayHoanThanh?: string }): boolean {
  return calculateAutomaticStatus({
    deadline: input.deadline,
    giaHan1: input.giaHan1,
    giaHan2: input.giaHan2,
    giaHan3: input.giaHan3,
    ngayHoanThanh: input.ngayHoanThanh,
  }) === 'Quá hạn';
}

export function parseTaskDate(value: string | undefined): dayjs.Dayjs | null {
  if (!value) {
    return null;
  }

  const dmy = dayjs(value, DMY_FORMATS, true);
  if (dmy.isValid()) {
    return dmy;
  }

  const mdy = dayjs(value, 'MM/DD/YYYY', true);
  return mdy.isValid() ? mdy : null;
}

export const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const TASK_COMPLETED_STATUS_LABEL = 'Đã hoàn thành';

/** Chuẩn hóa về dd/mm/yyyy; nếu không parse được (vd. "Thứ 7") giữ nguyên chuỗi gốc. */
export function normalizeDisplayDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  const formatted = formatRecordDate(value);
  return formatted || trimmed;
}

export function formatRecordDate(value: string | number | Date): string {
  if (value instanceof Date) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatSpreadsheetSerialDate(value);
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  if (EXCEL_SERIAL_RE.test(trimmed)) {
    const fromSerial = formatSpreadsheetSerialDate(trimmed);
    if (fromSerial) {
      return fromSerial;
    }
  }

  const datePart = trimmed.split(/\s+/)[0] ?? trimmed;

  if (DMY_SLASH_RE.test(datePart)) {
    const dmy = dayjs(datePart, DMY_FORMATS, true);
    if (dmy.isValid()) {
      return dmy.format('DD/MM/YYYY');
    }
  }

  const dmy = dayjs(datePart, DMY_FORMATS, true);
  if (dmy.isValid()) {
    return dmy.format('DD/MM/YYYY');
  }

  const withTime = dayjs(trimmed, [...DMY_WITH_TIME_FORMATS, 'MM/DD/YYYY HH:mm:ss', 'MM/DD/YYYY H:mm'], true);
  if (withTime.isValid()) {
    return withTime.format('DD/MM/YYYY');
  }

  const mdy = dayjs(datePart, 'MM/DD/YYYY', true);
  if (mdy.isValid()) {
    return mdy.format('DD/MM/YYYY');
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = dayjs(trimmed);
    if (iso.isValid()) {
      return iso.format('DD/MM/YYYY');
    }
  }

  return '';
}

export function formatTaskDate(value: unknown): string {
  if (dayjs.isDayjs(value)) {
    return value.format(DISPLAY_DATE_FORMAT);
  }

  if (value instanceof Date) {
    return normalizeDisplayDate(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatRecordDate(value);
  }

  if (typeof value === 'string') {
    return normalizeDisplayDate(value);
  }

  return '';
}

/** Ghi/đọc ngày giờ hoàn thành → dd/mm/yyyy HH:mm:ss */
export function formatRecordDateTime(value: string | number | Date = new Date()): string {
  if (value instanceof Date) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format(DISPLAY_DATETIME_FORMAT) : '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromSerial = fromSpreadsheetSerial(value);
    return fromSerial ? fromSerial.format(DISPLAY_DATETIME_FORMAT) : '';
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  const withTime = dayjs(trimmed, [...DMY_WITH_TIME_FORMATS, 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ss'], true);
  if (withTime.isValid()) {
    return withTime.format(DISPLAY_DATETIME_FORMAT);
  }

  const dateOnly = formatRecordDate(trimmed);
  if (dateOnly) {
    return `${dateOnly} 00:00:00`;
  }

  const loose = dayjs(trimmed);
  return loose.isValid() ? loose.format(DISPLAY_DATETIME_FORMAT) : trimmed;
}

export function normalizeDisplayDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const formatted = formatRecordDateTime(value instanceof Date ? value : String(value));
  return formatted || String(value).trim();
}

/** Đọc cột ngày từ dòng dữ liệu → dd/mm/yyyy */
export function formatUnknownAsDisplayDate(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date || typeof value === 'number') {
    return normalizeDisplayDate(value);
  }
  return normalizeDisplayDate(String(value));
}

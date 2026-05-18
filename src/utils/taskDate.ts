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

export function formatAppsheetDate(value: string | number | Date): string {
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
    return value.format('DD/MM/YYYY');
  }

  if (typeof value === 'string') {
    return formatAppsheetDate(value);
  }

  return '';
}

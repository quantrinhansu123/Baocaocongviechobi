import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function parseTaskDate(value: string | undefined): dayjs.Dayjs | null {
  if (!value) {
    return null;
  }

  const dmy = dayjs(value, 'DD/MM/YYYY', true);
  if (dmy.isValid()) {
    return dmy;
  }

  const mdy = dayjs(value, 'MM/DD/YYYY', true);
  return mdy.isValid() ? mdy : null;
}

export function formatAppsheetDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const dmy = dayjs(trimmed, 'DD/MM/YYYY', true);
  if (dmy.isValid()) {
    return dmy.format('DD/MM/YYYY');
  }

  const mdy = dayjs(trimmed, 'MM/DD/YYYY', true);
  if (mdy.isValid()) {
    return mdy.format('DD/MM/YYYY');
  }

  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : trimmed;
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

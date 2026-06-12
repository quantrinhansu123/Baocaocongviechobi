import {
  assertAppsheetEditRow,
  applyAppsheetRowKey,
  getAppsheetRowKeyColumn,
  hasAppsheetRowKey,
  pickAppsheetRowKey,
} from './appsheetRowKey';

export type AppsheetStatus = {
  configured: boolean;
  connected: boolean;
  appId?: string;
  table?: string;
  rowCount?: number;
  deploymentId?: string | null;
  message?: string;
};

export type AppsheetFindResponse = {
  table: string;
  rows: Record<string, unknown>[];
  raw: unknown;
};

async function readResponseText(response: Response): Promise<string> {
  return (await response.text()).trim();
}

function parseJsonText<T>(text: string, fallbackMessage: string): T {
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(parseAppsheetErrorMessage(text, fallbackMessage));
  }
}

async function parseJson<T>(response: Response, fallbackMessage = 'Phản hồi API không hợp lệ.'): Promise<T> {
  const text = await readResponseText(response);
  return parseJsonText<T>(text, fallbackMessage);
}

function parseAppsheetErrorMessage(text: string, fallback: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const payload = JSON.parse(trimmed) as { detail?: string; message?: string };
    if (payload.detail) {
      return payload.detail;
    }
    if (payload.message) {
      try {
        const nested = JSON.parse(payload.message) as { detail?: string };
        if (nested.detail) {
          return nested.detail;
        }
      } catch {
        return payload.message;
      }
      return payload.message;
    }
  } catch {
    return trimmed;
  }

  return trimmed || fallback;
}

function prepareWriteRow(
  row: Record<string, unknown>,
  table?: string
): Record<string, unknown> {
  const payload = { ...row };
  const rowKey = pickAppsheetRowKey(payload, table);
  if (!rowKey) {
    const label = getAppsheetRowKeyColumn(table);
    throw new Error(`Không có khóa ${label} trong dữ liệu gửi Supabase. Hãy F5 tải lại danh sách.`);
  }
  return applyAppsheetRowKey(payload, payload, rowKey, table);
}

export async function fetchAppsheetStatus(): Promise<AppsheetStatus> {
  const response = await fetch('/api/appsheet/status');
  return parseJson<AppsheetStatus>(response);
}

export async function findAppsheetTasks(options?: {
  table?: string;
  selector?: string;
  rows?: Record<string, unknown>[];
}): Promise<AppsheetFindResponse> {
  const params = new URLSearchParams();
  if (options?.table) {
    params.set('table', options.table);
  }
  if (options?.selector) {
    params.set('selector', options.selector);
  }

  const response = await fetch(`/api/appsheet/find${params.size ? `?${params}` : ''}`, {
    cache: 'no-store',
  });

  const text = await readResponseText(response);
  if (!response.ok) {
    const payload = parseJsonText<{ message?: string }>(
      text,
      `Tải dữ liệu thất bại (HTTP ${response.status}).`
    );
    throw new Error(payload.message ?? `Tải dữ liệu thất bại (HTTP ${response.status}).`);
  }

  return parseJsonText<AppsheetFindResponse>(text, 'Phản hồi find không phải JSON.');
}

export async function addAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const response = await fetch('/api/appsheet/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [row] }),
  });

  const text = await readResponseText(response);
  if (!response.ok) {
    const payload = parseJsonText<{ message?: string }>(
      text,
      `Thêm dữ liệu thất bại (HTTP ${response.status}).`
    );
    throw new Error(payload.message ?? `Thêm dữ liệu thất bại (HTTP ${response.status}).`);
  }

  return parseJsonText(text, 'Phản hồi add không phải JSON.');
}

export async function editAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const payload = prepareWriteRow(row, table);
  assertAppsheetEditRow(payload, table);
  const response = await fetch('/api/appsheet/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [payload] }),
  });

  const text = await readResponseText(response);
  if (!response.ok) {
    throw new Error(parseAppsheetErrorMessage(text, `Cập nhật thất bại (HTTP ${response.status}).`));
  }

  return parseJsonText(text, 'Phản hồi edit không phải JSON.');
}

export async function deleteAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const payload = prepareWriteRow(row, table);
  const response = await fetch('/api/appsheet/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [payload] }),
  });

  const text = await readResponseText(response);
  if (!response.ok) {
    const payload = parseJsonText<{ message?: string }>(
      text,
      `Xóa thất bại (HTTP ${response.status}).`
    );
    throw new Error(payload.message ?? `Xóa thất bại (HTTP ${response.status}).`);
  }

  return parseJsonText(text, 'Phản hồi delete không phải JSON.');
}

import type { IncomingMessage, ServerResponse } from 'node:http';
import { describeSupabaseConfiguration, isSupabaseConfigured } from './supabaseConfig';
import {
  addSupabaseRows,
  deleteSupabaseRows,
  editSupabaseRows,
  findSupabaseRows,
  isKnownDataTable,
} from './supabaseDataStore';

type JsonRecord = Record<string, unknown>;

const DEFAULT_TABLE = 'I.1';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendNoContent(res: ServerResponse) {
  res.statusCode = 204;
  res.end();
}

function getQueryValue(req: IncomingMessage, key: string): string | undefined {
  const value = new URL(req.url ?? '/', 'http://localhost').searchParams.get(key)?.trim();
  return value || undefined;
}

async function readJsonBody(req: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as JsonRecord;
}

function getPathname(url: string): string {
  return url.split('?')[0] ?? url;
}

function supabaseConfigError(): string | null {
  return describeSupabaseConfiguration();
}

function assertTableSupported(tableName: string): string | null {
  if (!isKnownDataTable(tableName)) {
    return `Bảng không hỗ trợ: ${tableName}`;
  }
  return supabaseConfigError();
}

/** API /api/appsheet/* — backend Supabase (giữ path cũ cho frontend). */
export async function handleAppsheetRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const pathname = getPathname(req.url ?? '');
  if (!pathname.startsWith('/api/appsheet')) {
    return false;
  }

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return true;
  }

  if (!isSupabaseConfigured()) {
    const message = supabaseConfigError() ?? 'Chưa cấu hình Supabase.';
    if (req.method === 'GET' && pathname === '/api/appsheet/status') {
      sendJson(res, 503, { configured: false, connected: false, backend: 'supabase', message });
      return true;
    }
    sendJson(res, 503, { message });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/status') {
    const tableName = getQueryValue(req, 'table') ?? DEFAULT_TABLE;
    const tableError = assertTableSupported(tableName);
    if (tableError) {
      sendJson(res, 400, { configured: true, connected: false, backend: 'supabase', message: tableError });
      return true;
    }

    try {
      const result = await findSupabaseRows(tableName);
      sendJson(res, 200, {
        configured: true,
        connected: true,
        table: tableName,
        rowCount: result.rows.length,
        backend: 'supabase',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối Supabase.';
      const needsSetup =
        message.includes('schema cache') ||
        message.includes('Could not find the table') ||
        message.includes('chưa có trên Supabase');
      sendJson(res, needsSetup ? 503 : 502, {
        configured: true,
        connected: false,
        backend: 'supabase',
        needsSetup,
        message,
      });
    }
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/find') {
    const tableName = getQueryValue(req, 'table') ?? DEFAULT_TABLE;
    const tableError = assertTableSupported(tableName);
    if (tableError) {
      sendJson(res, 400, { table: tableName, message: tableError });
      return true;
    }

    try {
      const selector = getQueryValue(req, 'selector');
      const result = await findSupabaseRows(tableName, { selector });
      sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
    } catch (error) {
      sendJson(res, 502, {
        table: tableName,
        message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.',
      });
    }
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method not allowed.' });
    return true;
  }

  try {
    if (pathname === '/api/appsheet/find') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? DEFAULT_TABLE);
      const tableError = assertTableSupported(tableName);
      if (tableError) {
        sendJson(res, 400, { table: tableName, message: tableError });
        return true;
      }

      const result = await findSupabaseRows(tableName, {
        selector: typeof body.selector === 'string' ? body.selector : undefined,
      });
      sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
      return true;
    }

    if (pathname === '/api/appsheet/add') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? DEFAULT_TABLE);
      const tableError = assertTableSupported(tableName);
      if (tableError) {
        sendJson(res, 400, { table: tableName, message: tableError });
        return true;
      }

      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await addSupabaseRows(tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    if (pathname === '/api/appsheet/edit') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? DEFAULT_TABLE);
      const tableError = assertTableSupported(tableName);
      if (tableError) {
        sendJson(res, 400, { table: tableName, message: tableError });
        return true;
      }

      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await editSupabaseRows(tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    if (pathname === '/api/appsheet/delete') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? DEFAULT_TABLE);
      const tableError = assertTableSupported(tableName);
      if (tableError) {
        sendJson(res, 400, { table: tableName, message: tableError });
        return true;
      }

      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await deleteSupabaseRows(tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    sendJson(res, 404, { message: 'Không tìm thấy endpoint.' });
    return true;
  } catch (error) {
    sendJson(res, 502, {
      message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.',
    });
    return true;
  }
}

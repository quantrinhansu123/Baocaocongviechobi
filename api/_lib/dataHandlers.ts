import { describeSupabaseConfiguration, isSupabaseConfigured } from '../../lib/data/supabaseConfig';
import {
  addSupabaseRows,
  deleteSupabaseRows,
  editSupabaseRows,
  findSupabaseRows,
  isKnownDataTable,
} from '../../lib/data/supabaseDataStore';

const DEFAULT_TABLE = 'I.1';

type ApiResponse = {
  statusCode: number;
  headersSent?: boolean;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
};

function sendJson(res: ApiResponse, status: number, payload: unknown) {
  if (res.headersSent) {
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function withJsonApiHandler(
  handler: (req: unknown, res: ApiResponse) => Promise<void>
): (req: unknown, res: ApiResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : 'Lỗi server khi gọi API dữ liệu.',
      });
    }
  };
}

function tableError(tableName: string): string | null {
  if (!isKnownDataTable(tableName)) {
    return `Bảng không hỗ trợ: ${tableName}`;
  }
  return describeSupabaseConfiguration();
}

export async function handleDataStatus(req: { url?: string }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    const message = describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.';
    sendJson(res, 503, { configured: false, connected: false, backend: 'supabase', message });
    return;
  }

  const url = new URL(req.url ?? '/api/data/status', 'http://localhost');
  const tableName = url.searchParams.get('table')?.trim() || DEFAULT_TABLE;
  const err = tableError(tableName);
  if (err) {
    sendJson(res, 400, { configured: true, connected: false, backend: 'supabase', message: err });
    return;
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
    sendJson(res, 502, {
      configured: true,
      connected: false,
      backend: 'supabase',
      message: error instanceof Error ? error.message : 'Không thể kết nối Supabase.',
    });
  }
}

export async function handleDataFindGet(req: { url?: string }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.' });
    return;
  }

  const url = new URL(req.url ?? '/api/data/find', 'http://localhost');
  const tableName = url.searchParams.get('table')?.trim() || DEFAULT_TABLE;
  const err = tableError(tableName);
  if (err) {
    sendJson(res, 400, { table: tableName, message: err });
    return;
  }

  try {
    const selector = url.searchParams.get('selector')?.trim();
    const result = await findSupabaseRows(tableName, { selector });
    sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
  } catch (error) {
    sendJson(res, 502, {
      table: tableName,
      message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.',
    });
  }
}

async function readBody(req: { on: (e: string, h: (c: Buffer) => void) => void }): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve());
    req.on('error', reject);
  });
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export async function handleDataFindPost(req: { on: (e: string, h: (c: Buffer) => void) => void }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.' });
    return;
  }

  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }

    const result = await findSupabaseRows(tableName, {
      selector: typeof body.selector === 'string' ? body.selector : undefined,
    });
    sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.' });
  }
}

export async function handleDataAdd(req: { on: (e: string, h: (c: Buffer) => void) => void }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.' });
    return;
  }

  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }

    const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    const raw = await addSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.' });
  }
}

export async function handleDataEdit(req: { on: (e: string, h: (c: Buffer) => void) => void }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.' });
    return;
  }

  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }

    const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    const raw = await editSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.' });
  }
}

export async function handleDataDelete(req: { on: (e: string, h: (c: Buffer) => void) => void }, res: Parameters<typeof sendJson>[0]) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? 'Chưa cấu hình Supabase.' });
    return;
  }

  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }

    const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    const raw = await deleteSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : 'Gọi Supabase thất bại.' });
  }
}

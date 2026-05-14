import type { IncomingMessage, ServerResponse } from 'node:http';
import { addAppsheetRows, deleteAppsheetRows, editAppsheetRows, findAppsheetRows } from './appsheetClient';
import { isAppsheetConfigured, loadAppsheetConfig } from './appsheetConfig';

type JsonRecord = Record<string, unknown>;

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
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

export async function handleAppsheetRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const pathname = getPathname(req.url ?? '');
  if (!pathname.startsWith('/api/appsheet')) {
    return false;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/status') {
    if (!isAppsheetConfigured()) {
      sendJson(res, 503, {
        configured: false,
        connected: false,
        message: 'Chưa cấu hình AppSheet API.',
      });
      return true;
    }

    try {
      const config = loadAppsheetConfig();
      const result = await findAppsheetRows(config, config.defaultTable);
      sendJson(res, 200, {
        configured: true,
        connected: true,
        appId: config.appId,
        table: config.defaultTable,
        rowCount: result.rows.length,
        deploymentId: config.deploymentId ?? null,
      });
    } catch (error) {
      sendJson(res, 502, {
        configured: true,
        connected: false,
        message: error instanceof Error ? error.message : 'Không thể kết nối AppSheet API.',
      });
    }
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method not allowed.' });
    return true;
  }

  if (!isAppsheetConfigured()) {
    sendJson(res, 503, { message: 'Chưa cấu hình AppSheet API.' });
    return true;
  }

  const config = loadAppsheetConfig();

  try {
    if (pathname === '/api/appsheet/find') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? config.defaultTable);
      const result = await findAppsheetRows(config, tableName, {
        selector: typeof body.selector === 'string' ? body.selector : undefined,
        rows: Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : undefined,
        properties:
          body.properties && typeof body.properties === 'object'
            ? (body.properties as Record<string, unknown>)
            : undefined,
      });
      sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
      return true;
    }

    if (pathname === '/api/appsheet/add') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? config.defaultTable);
      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await addAppsheetRows(config, tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    if (pathname === '/api/appsheet/edit') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? config.defaultTable);
      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await editAppsheetRows(config, tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    if (pathname === '/api/appsheet/delete') {
      const body = await readJsonBody(req);
      const tableName = String(body.table ?? config.defaultTable);
      const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
      const raw = await deleteAppsheetRows(config, tableName, rows);
      sendJson(res, 200, { table: tableName, raw });
      return true;
    }

    sendJson(res, 404, { message: 'Không tìm thấy endpoint AppSheet.' });
    return true;
  } catch (error) {
    sendJson(res, 502, {
      message: error instanceof Error ? error.message : 'Gọi AppSheet API thất bại.',
    });
    return true;
  }
}

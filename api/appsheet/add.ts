import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await writeAppsheetRows(req, res, 'Add');
}

const REPORT_TABLE = 'BC định kỳ';

const REPORT_ROW_NUMBER_REQUIRED_HINT =
  'Đã gửi _RowNumber và đặt id = số thứ tự dòng, nhưng API Add vẫn không chấp nhận (AppSheet bỏ qua cột _RowNumber). ' +
  'Sửa trong AppSheet: Data → "BC định kỳ" → cột _RowNumber → bỏ Required; khóa dòng chỉ dùng id. Deploy lại app.';

function formatReportAddError(message: string): string {
  if (!message.includes('_RowNumber')) {
    return message;
  }
  return `${REPORT_ROW_NUMBER_REQUIRED_HINT}\n\nChi tiết AppSheet: ${message}`;
}

async function writeAppsheetRows(req: IncomingMessage, res: ServerResponse, action: 'Add' | 'Edit' | 'Delete') {
  let table = clean(process.env.APPSHEET_TABLE) ?? 'I.1';

  try {
    const body = await readJsonBody(req);
    table = String(body.table ?? table);
    const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    const raw = await invokeAppsheet(action, table, rows);
    sendJson(res, 200, { table, raw });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'AppSheet write failed.';
    const message =
      action === 'Add' && table === REPORT_TABLE ? formatReportAddError(rawMessage) : rawMessage;
    sendJson(res, 500, { message });
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

async function invokeAppsheet(action: 'Add' | 'Edit' | 'Delete', table: string, rows: Record<string, unknown>[]) {
  const appId = clean(process.env.APPSHEET_APP_ID);
  const accessKey = clean(process.env.APPSHEET_ACCESS_KEY);
  if (!appId || !accessKey) throw new Error('Missing APPSHEET_APP_ID or APPSHEET_ACCESS_KEY.');
  const regionHost = clean(process.env.APPSHEET_REGION_HOST) || 'www.appsheet.com';
  const endpoint = `https://${regionHost}/api/v2/apps/${encodeURIComponent(appId)}/tables/${encodeURIComponent(table)}/Action`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ApplicationAccessKey: accessKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Action: action,
      Properties: {
        Locale: clean(process.env.APPSHEET_LOCALE) || 'vi-VN',
        Timezone: clean(process.env.APPSHEET_TIMEZONE) || 'SE Asia Standard Time',
      },
      Rows: rows,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `AppSheet returned HTTP ${response.status}.`);
  return text ? JSON.parse(text) : null;
}

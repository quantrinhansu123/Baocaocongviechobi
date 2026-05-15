import type { IncomingMessage, ServerResponse } from 'node:http';

type AppsheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';

type AppsheetConfig = {
  appId: string;
  appName?: string;
  accessKey: string;
  regionHost: string;
  locale: string;
  timezone: string;
  defaultTable: string;
  deploymentId?: string;
};

type JsonRecord = Record<string, unknown>;

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

function loadConfig(): AppsheetConfig {
  const appId = cleanEnvValue(process.env.APPSHEET_APP_ID);
  const accessKey = cleanEnvValue(process.env.APPSHEET_ACCESS_KEY);

  if (!appId || !accessKey) {
    throw new Error('Missing APPSHEET_APP_ID or APPSHEET_ACCESS_KEY.');
  }

  return {
    appId,
    appName: cleanEnvValue(process.env.APPSHEET_APP_NAME),
    accessKey,
    regionHost: cleanEnvValue(process.env.APPSHEET_REGION_HOST) || 'www.appsheet.com',
    locale: cleanEnvValue(process.env.APPSHEET_LOCALE) || 'vi-VN',
    timezone: cleanEnvValue(process.env.APPSHEET_TIMEZONE) || 'SE Asia Standard Time',
    defaultTable: cleanEnvValue(process.env.APPSHEET_TABLE) || 'I.1',
    deploymentId: cleanEnvValue(process.env.APPSHEET_DEPLOYMENT_ID),
  };
}

function isConfigured(): boolean {
  return Boolean(cleanEnvValue(process.env.APPSHEET_APP_ID) && cleanEnvValue(process.env.APPSHEET_ACCESS_KEY));
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendNoContent(res: ServerResponse) {
  res.statusCode = 204;
  res.end();
}

function buildAppsheetUrl(config: AppsheetConfig, tableName: string): string {
  const appId = encodeURIComponent(config.appId);
  const table = encodeURIComponent(tableName);
  return `https://${config.regionHost}/api/v2/apps/${appId}/tables/${table}/Action`;
}

function defaultProperties(config: AppsheetConfig, extra?: Record<string, unknown>) {
  return {
    Locale: config.locale,
    Timezone: config.timezone,
    ...extra,
  };
}

function parseRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { Rows?: unknown }).Rows)) {
    return (payload as { Rows: Record<string, unknown>[] }).Rows;
  }

  return [];
}

function parseError(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const payload = JSON.parse(trimmed) as { detail?: string; message?: string };
    if (payload.detail) {
      return payload.detail;
    }
    if (payload.message) {
      return payload.message;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

async function invokeAction(
  config: AppsheetConfig,
  tableName: string,
  body: { Action: AppsheetAction; Properties?: Record<string, unknown>; Rows?: Record<string, unknown>[] }
): Promise<unknown> {
  const response = await fetch(buildAppsheetUrl(config, tableName), {
    method: 'POST',
    headers: {
      ApplicationAccessKey: config.accessKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseError(text) || `AppSheet API returned HTTP ${response.status}.`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function findRows(
  config: AppsheetConfig,
  tableName: string,
  options?: { selector?: string; rows?: Record<string, unknown>[]; properties?: Record<string, unknown> }
) {
  const properties: Record<string, unknown> = defaultProperties(config, options?.properties);
  if (options?.selector) {
    properties.Selector = options.selector;
  }

  const raw = await invokeAction(config, tableName, {
    Action: 'Find',
    Properties: properties,
    Rows: options?.rows ?? [],
  });

  return { rows: parseRows(raw), raw };
}

async function readJsonBody(req: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as JsonRecord) : {};
}

function getPathname(url: string): string {
  return url.split('?')[0] ?? url;
}

function getQueryValue(req: IncomingMessage, key: string): string | undefined {
  const value = new URL(req.url ?? '/', 'http://localhost').searchParams.get(key)?.trim();
  return value || undefined;
}

export async function handleAppsheetRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = getPathname(req.url ?? '');

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/debug') {
    sendJson(res, 200, {
      configured: isConfigured(),
      hasAppId: Boolean(cleanEnvValue(process.env.APPSHEET_APP_ID)),
      hasAccessKey: Boolean(cleanEnvValue(process.env.APPSHEET_ACCESS_KEY)),
      appId: cleanEnvValue(process.env.APPSHEET_APP_ID) ?? null,
      appName: cleanEnvValue(process.env.APPSHEET_APP_NAME) ?? null,
      defaultTable: cleanEnvValue(process.env.APPSHEET_TABLE) || 'I.1',
      regionHost: cleanEnvValue(process.env.APPSHEET_REGION_HOST) || 'www.appsheet.com',
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/status') {
    if (!isConfigured()) {
      sendJson(res, 503, {
        configured: false,
        connected: false,
        message: 'Missing AppSheet environment variables.',
      });
      return;
    }

    const config = loadConfig();
    try {
      const result = await findRows(config, config.defaultTable);
      sendJson(res, 200, {
        configured: true,
        connected: true,
        appId: config.appId,
        appName: config.appName ?? null,
        table: config.defaultTable,
        rowCount: result.rows.length,
        deploymentId: config.deploymentId ?? null,
      });
    } catch (error) {
      sendJson(res, 502, {
        configured: true,
        connected: false,
        message: error instanceof Error ? error.message : 'Cannot connect to AppSheet API.',
      });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/appsheet/find') {
    if (!isConfigured()) {
      sendJson(res, 503, { message: 'Missing AppSheet environment variables.' });
      return;
    }

    const config = loadConfig();
    try {
      const tableName = getQueryValue(req, 'table') ?? config.defaultTable;
      const selector = getQueryValue(req, 'selector');
      const result = await findRows(config, tableName, { selector });
      sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
    } catch (error) {
      sendJson(res, 502, {
        message: error instanceof Error ? error.message : 'AppSheet find failed.',
      });
    }
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method not allowed.' });
    return;
  }

  if (!isConfigured()) {
    sendJson(res, 503, { message: 'Missing AppSheet environment variables.' });
    return;
  }

  const config = loadConfig();
  const body = await readJsonBody(req);
  const tableName = String(body.table ?? config.defaultTable);
  const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];

  try {
    if (pathname === '/api/appsheet/add') {
      const raw = await invokeAction(config, tableName, {
        Action: 'Add',
        Properties: defaultProperties(config),
        Rows: rows,
      });
      sendJson(res, 200, { table: tableName, raw });
      return;
    }

    if (pathname === '/api/appsheet/edit') {
      const raw = await invokeAction(config, tableName, {
        Action: 'Edit',
        Properties: defaultProperties(config),
        Rows: rows,
      });
      sendJson(res, 200, { table: tableName, raw });
      return;
    }

    if (pathname === '/api/appsheet/delete') {
      const raw = await invokeAction(config, tableName, {
        Action: 'Delete',
        Properties: defaultProperties(config),
        Rows: rows,
      });
      sendJson(res, 200, { table: tableName, raw });
      return;
    }

    sendJson(res, 404, { message: 'Unknown AppSheet endpoint.' });
  } catch (error) {
    sendJson(res, 502, {
      message: error instanceof Error ? error.message : 'AppSheet write failed.',
    });
  }
}

export function sendEndpointError(res: ServerResponse, error: unknown) {
  sendJson(res, 500, {
    message: error instanceof Error ? error.message : 'AppSheet endpoint failed.',
  });
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { Rows?: unknown }).Rows)) {
    return (payload as { Rows: Record<string, unknown>[] }).Rows;
  }
  return [];
}

async function fetchAppsheet(
  appRef: string,
  accessKey: string,
  regionHost: string,
  table: string,
  properties: Record<string, unknown>
) {
  const endpoint = `https://${regionHost}/api/v2/apps/${encodeURIComponent(appRef)}/tables/${encodeURIComponent(table)}/Action`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ApplicationAccessKey: accessKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Action: 'Find', Properties: properties, Rows: [] }),
  });
  return { response, text: await response.text(), appRef };
}

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url ?? '/api/appsheet/find', 'http://localhost');
    const appId = clean(process.env.APPSHEET_APP_ID);
    const appName = clean(process.env.APPSHEET_APP_NAME);
    const accessKey = clean(process.env.APPSHEET_ACCESS_KEY);
    if (!appId || !accessKey) {
      sendJson(res, 503, { message: 'Missing APPSHEET_APP_ID or APPSHEET_ACCESS_KEY.' });
      return;
    }

    const table = url.searchParams.get('table')?.trim() || clean(process.env.APPSHEET_TABLE) || 'I.1';
    const selector = url.searchParams.get('selector')?.trim();
    const regionHost = clean(process.env.APPSHEET_REGION_HOST) || 'www.appsheet.com';
    const locale = clean(process.env.APPSHEET_LOCALE) || 'vi-VN';
    const timezone = clean(process.env.APPSHEET_TIMEZONE) || 'SE Asia Standard Time';
    const properties: Record<string, unknown> = { Locale: locale, Timezone: timezone };
    if (selector) properties.Selector = selector;

    let { response, text, appRef } = await fetchAppsheet(appId, accessKey, regionHost, table, properties);
    if (!response.ok && appName && appName !== appId) {
      const fallback = await fetchAppsheet(appName, accessKey, regionHost, table, properties);
      if (fallback.response.ok || !text) {
        response = fallback.response;
        text = fallback.text;
        appRef = fallback.appRef;
      }
    }

    if (!response.ok) {
      sendJson(res, 502, { message: text || `AppSheet returned HTTP ${response.status}.`, table, appRef });
      return;
    }

    const raw = text ? JSON.parse(text) : null;
    sendJson(res, 200, { table, rows: parseRows(raw), raw, appRef });
  } catch (error) {
    sendJson(res, 500, { message: error instanceof Error ? error.message : 'find failed' });
  }
}

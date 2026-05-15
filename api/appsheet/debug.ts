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

export default async function handler(_req: any, res: any) {
  try {
    sendJson(res, 200, {
      configured: Boolean(clean(process.env.APPSHEET_APP_ID) && clean(process.env.APPSHEET_ACCESS_KEY)),
      hasAppId: Boolean(clean(process.env.APPSHEET_APP_ID)),
      hasAccessKey: Boolean(clean(process.env.APPSHEET_ACCESS_KEY)),
      appId: clean(process.env.APPSHEET_APP_ID) ?? null,
      appName: clean(process.env.APPSHEET_APP_NAME) ?? null,
      defaultTable: clean(process.env.APPSHEET_TABLE) || 'I.1',
      regionHost: clean(process.env.APPSHEET_REGION_HOST) || 'www.appsheet.com',
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    });
  } catch (error) {
    sendJson(res, 500, { message: error instanceof Error ? error.message : 'debug failed' });
  }
}

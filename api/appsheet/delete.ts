import type { IncomingMessage, ServerResponse } from 'node:http';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { handleAppsheetRoute } = await import('../../server/appsheetRoute');
    req.url = '/api/appsheet/delete';
    await handleAppsheetRoute(req, res);
  } catch (error) {
    sendJson(res, 500, {
      message: error instanceof Error ? error.message : 'AppSheet delete endpoint failed.',
    });
  }
}

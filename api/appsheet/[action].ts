import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute } from '../../server/appsheetRoute';

function normalizeDynamicActionUrl(req: IncomingMessage) {
  const url = new URL(req.url ?? '/api/appsheet', 'http://localhost');
  const action = url.searchParams.get('action');

  if (!action || url.pathname.startsWith('/api/appsheet/')) {
    return;
  }

  url.searchParams.delete('action');
  const query = url.searchParams.toString();
  req.url = `/api/appsheet/${action}${query ? `?${query}` : ''}`;
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    normalizeDynamicActionUrl(req);

    const handled = await handleAppsheetRoute(req, res);
    if (!handled) {
      sendJson(res, 404, { message: 'Khong tim thay endpoint AppSheet.' });
    }
  } catch (error) {
    sendJson(res, 500, {
      message: error instanceof Error ? error.message : 'AppSheet API route failed.',
    });
  }
}

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute } from '../server/appsheetRoute';

function normalizeRewrittenUrl(req: IncomingMessage) {
  const url = new URL(req.url ?? '/api/appsheet', 'http://localhost');
  const path = url.searchParams.get('path');

  if (!path) {
    return;
  }

  url.searchParams.delete('path');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const query = url.searchParams.toString();
  req.url = `/api/appsheet${suffix}${query ? `?${query}` : ''}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  normalizeRewrittenUrl(req);

  const handled = await handleAppsheetRoute(req, res);
  if (!handled) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'Không tìm thấy endpoint AppSheet.' }));
  }
}

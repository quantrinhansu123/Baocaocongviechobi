import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute } from '../../server/appsheetRoute';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/api/appsheet/find', 'http://localhost');
  req.url = `/api/appsheet/find${url.search}`;
  await handleAppsheetRoute(req, res);
}

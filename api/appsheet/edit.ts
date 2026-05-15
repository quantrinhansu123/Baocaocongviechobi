import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute } from '../../server/appsheetRoute';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  req.url = '/api/appsheet/edit';
  await handleAppsheetRoute(req, res);
}

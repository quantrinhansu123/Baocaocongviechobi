import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute, sendEndpointError } from './_shared';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    req.url = '/api/appsheet/add';
    await handleAppsheetRoute(req, res);
  } catch (error) {
    sendEndpointError(res, error);
  }
}

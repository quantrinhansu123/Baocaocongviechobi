import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAppsheetRoute, sendEndpointError } from './_shared';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? '/api/appsheet/find', 'http://localhost');
    req.url = `/api/appsheet/find${url.search}`;
    await handleAppsheetRoute(req, res);
  } catch (error) {
    sendEndpointError(res, error);
  }
}

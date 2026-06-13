import { isSupabaseConfigured } from '../_lib/data/supabaseConfig';
import {
  handleDataAdd,
  handleDataDelete,
  handleDataEdit,
  handleDataFindGet,
  handleDataFindPost,
  handleDataStatus,
  withJsonApiHandler,
} from '../_lib/dataHandlers';

type ApiRequest = {
  method?: string;
  url?: string;
  on: (event: string, handler: (chunk: Buffer) => void) => void;
};

type ApiResponse = {
  statusCode: number;
  headersSent?: boolean;
  setHeader: (key: string, value: string) => void;
  end: (body: string) => void;
};

function sendJson(res: ApiResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function resolveAction(req: ApiRequest & { query?: Record<string, string | string[] | undefined> }): string {
  const fromQuery = req.query?.action;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim();
  }
  if (Array.isArray(fromQuery) && fromQuery[0]?.trim()) {
    return fromQuery[0].trim();
  }

  const pathname = new URL(req.url ?? '/api/data', 'http://localhost').pathname;
  const segments = pathname.replace(/^\/api\/data\/?/, '').split('/').filter(Boolean);
  return segments[0] ?? '';
}

async function routeDataApi(req: ApiRequest, res: ApiResponse) {
  const action = resolveAction(req as ApiRequest & { query?: Record<string, string | string[] | undefined> });
  const method = req.method ?? 'GET';

  if (action === 'debug' && method === 'GET') {
    sendJson(res, 200, {
      backend: 'supabase',
      configured: isSupabaseConfigured(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    });
    return;
  }

  if (action === 'status' && method === 'GET') {
    await handleDataStatus(req, res);
    return;
  }

  if (action === 'find') {
    if (method === 'POST') {
      await handleDataFindPost(req, res);
      return;
    }
    if (method === 'GET') {
      await handleDataFindGet(req, res);
      return;
    }
  }

  if (action === 'add' && method === 'POST') {
    await handleDataAdd(req, res);
    return;
  }

  if (action === 'edit' && method === 'POST') {
    await handleDataEdit(req, res);
    return;
  }

  if (action === 'delete' && method === 'POST') {
    await handleDataDelete(req, res);
    return;
  }

  sendJson(res, 404, { message: `Không tìm thấy endpoint /api/data/${action || ''}.` });
}

export default withJsonApiHandler(routeDataApi);

import { isSupabaseConfigured } from '../_lib/data/supabaseConfig';
import { withJsonApiHandler } from '../_lib/dataHandlers';

function sendJson(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void },
  status: number,
  payload: unknown
) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default withJsonApiHandler(async (_req, res) => {
  sendJson(res, 200, {
    backend: 'supabase',
    configured: isSupabaseConfigured(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
});

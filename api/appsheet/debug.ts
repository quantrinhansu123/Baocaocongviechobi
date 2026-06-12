import { isSupabaseConfigured } from '../../server/supabaseConfig';

function sendJson(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(_req: unknown, res: Parameters<typeof sendJson>[0]) {
  sendJson(res, 200, {
    backend: 'supabase',
    configured: isSupabaseConfigured(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}

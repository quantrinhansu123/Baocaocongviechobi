import { isSupabaseConfigured } from '../../api/_lib/data/supabaseConfig';
import { withJsonApiHandler } from '../../api/_lib/dataHandlers';

export default withJsonApiHandler(async (_req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      backend: 'supabase',
      configured: isSupabaseConfigured(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    })
  );
});

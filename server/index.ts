import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { handleDataRoute } from './dataRoute';
import { isSupabaseConfigured } from './supabaseConfig';

dotenv.config({ path: '.env', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const app = express();
const port = Number(process.env.PORT ?? 3002);

app.use(express.json({ limit: '2mb' }));

app.use(async (req, res, next) => {
  const handled = await handleDataRoute(req, res);
  if (!handled) {
    next();
  }
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${port}`);
  if (!isSupabaseConfigured()) {
    console.warn(
      '[supabase] Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env — API /api/data/* trả 503.'
    );
  }
});

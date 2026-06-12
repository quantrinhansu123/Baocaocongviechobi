import type { Plugin } from 'vite';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleDataRoute } from '../../server/dataRoute';
import { isSupabaseConfigured } from '../../server/supabaseConfig';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function syncDataEnv() {
  dotenv.config({ path: path.join(projectRoot, '.env'), override: true });
}

function sendJsonError(res: ServerResponse, error: unknown) {
  if (res.headersSent) {
    return;
  }
  const message = error instanceof Error ? error.message : 'Lỗi server khi gọi API dữ liệu.';
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ message }));
}

export function dataApiPlugin(): Plugin {
  return {
    name: 'data-api',
    configureServer(server) {
      syncDataEnv();

      if (!isSupabaseConfigured()) {
        server.config.logger.warn(
          '[data] Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env — API /api/data/* trả 503.'
        );
      }

      server.middlewares.use(async (req, res, next) => {
        if (!(req as IncomingMessage).url?.startsWith('/api/data')) {
          next();
          return;
        }

        syncDataEnv();
        try {
          const handled = await handleDataRoute(req as IncomingMessage, res as ServerResponse);
          if (!handled) {
            sendJsonError(res as ServerResponse, new Error('Không tìm thấy endpoint API.'));
          }
        } catch (error) {
          sendJsonError(res as ServerResponse, error);
        }
      });
    },
  };
}

import type { Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleAppsheetRoute } from '../../server/appsheetRoute';
import { isSupabaseConfigured } from '../../server/supabaseConfig';

function syncDataEnv() {
  dotenv.config({ path: '.env', override: true });
}

export function appsheetApiPlugin(): Plugin {
  return {
    name: 'data-api',
    configureServer(server) {
      syncDataEnv();

      if (!isSupabaseConfigured()) {
        server.config.logger.warn(
          '[data] Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env — API /api/appsheet/* trả 503.'
        );
      }

      server.middlewares.use(async (req, res, next) => {
        syncDataEnv();
        try {
          const handled = await handleAppsheetRoute(req, res);
          if (!handled) {
            next();
          }
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

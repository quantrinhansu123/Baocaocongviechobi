import type { Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleAppsheetRoute } from '../../server/appsheetRoute';
import { isAppsheetConfigured } from '../../server/appsheetConfig';

function syncAppsheetEnv() {
  dotenv.config({ path: '.env', override: true });
}

export function appsheetApiPlugin(): Plugin {
  return {
    name: 'appsheet-api',
    configureServer(server) {
      syncAppsheetEnv();

      if (!isAppsheetConfigured()) {
        server.config.logger.warn(
          '[appsheet] Thiếu APPSHEET_APP_ID hoặc APPSHEET_ACCESS_KEY trong .env — API /api/appsheet/* trả 503.'
        );
      }

      server.middlewares.use(async (req, res, next) => {
        syncAppsheetEnv();
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

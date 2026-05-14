import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { handleAppsheetRoute } from '../../server/appsheetRoute';

export function appsheetApiPlugin(): Plugin {
  return {
    name: 'appsheet-api',
    configureServer(server) {
      const syncAppsheetEnv = () => {
        const env = loadEnv(server.config.mode, process.cwd(), '');
        Object.assign(process.env, env);
      };

      syncAppsheetEnv();

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

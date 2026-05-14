import dotenv from 'dotenv';

export type AppsheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';

export type AppsheetConfig = {
  appId: string;
  accessKey: string;
  regionHost: string;
  locale: string;
  timezone: string;
  defaultTable: string;
  deploymentId?: string;
};

function readAppsheetEnv(): NodeJS.ProcessEnv {
  dotenv.config({ path: '.env.local', override: true });
  dotenv.config({ override: true });
  return process.env;
}

export function loadAppsheetConfig(env: NodeJS.ProcessEnv = readAppsheetEnv()): AppsheetConfig {
  const appId = env.APPSHEET_APP_ID?.trim();
  const accessKey = env.APPSHEET_ACCESS_KEY?.trim();

  if (!appId || !accessKey) {
    throw new Error('Thiếu APPSHEET_APP_ID hoặc APPSHEET_ACCESS_KEY trong biến môi trường.');
  }

  return {
    appId,
    accessKey,
    regionHost: env.APPSHEET_REGION_HOST?.trim() || 'www.appsheet.com',
    locale: env.APPSHEET_LOCALE?.trim() || 'vi-VN',
    timezone: env.APPSHEET_TIMEZONE?.trim() || 'SE Asia Standard Time',
    defaultTable: env.APPSHEET_TABLE?.trim() || 'I.1',
    deploymentId: env.APPSHEET_DEPLOYMENT_ID?.trim() || undefined,
  };
}

export function isAppsheetConfigured(env: NodeJS.ProcessEnv = readAppsheetEnv()): boolean {
  return Boolean(env.APPSHEET_APP_ID?.trim() && env.APPSHEET_ACCESS_KEY?.trim());
}

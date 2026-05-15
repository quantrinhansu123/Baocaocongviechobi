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

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

export function loadAppsheetConfig(env: NodeJS.ProcessEnv = readAppsheetEnv()): AppsheetConfig {
  const appId = cleanEnvValue(env.APPSHEET_APP_ID);
  const accessKey = cleanEnvValue(env.APPSHEET_ACCESS_KEY);

  if (!appId || !accessKey) {
    throw new Error('Thiếu APPSHEET_APP_ID hoặc APPSHEET_ACCESS_KEY trong biến môi trường.');
  }

  return {
    appId,
    accessKey,
    regionHost: cleanEnvValue(env.APPSHEET_REGION_HOST) || 'www.appsheet.com',
    locale: cleanEnvValue(env.APPSHEET_LOCALE) || 'vi-VN',
    timezone: cleanEnvValue(env.APPSHEET_TIMEZONE) || 'SE Asia Standard Time',
    defaultTable: cleanEnvValue(env.APPSHEET_TABLE) || 'I.1',
    deploymentId: cleanEnvValue(env.APPSHEET_DEPLOYMENT_ID),
  };
}

export function isAppsheetConfigured(env: NodeJS.ProcessEnv = readAppsheetEnv()): boolean {
  return Boolean(cleanEnvValue(env.APPSHEET_APP_ID) && cleanEnvValue(env.APPSHEET_ACCESS_KEY));
}

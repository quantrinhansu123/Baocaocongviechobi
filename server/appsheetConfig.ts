import dotenv from 'dotenv';

export type AppsheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';

export type AppsheetConfig = {
  appId: string;
  appName?: string;
  accessKey: string;
  regionHost: string;
  locale: string;
  timezone: string;
  defaultTable: string;
  deploymentId?: string;
};

function readAppsheetEnv(): NodeJS.ProcessEnv {
  dotenv.config({ path: '.env', override: true });
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

function isPlaceholderAccessKey(accessKey: string | undefined): boolean {
  if (!accessKey) {
    return true;
  }

  const normalized = accessKey.trim().toUpperCase();
  return (
    normalized === 'MY_APPSHEET_ACCESS_KEY' ||
    normalized === 'DAN_APPLICATION_ACCESS_KEY_THAT_DAY_TU_APPSHEET' ||
    normalized.startsWith('YOUR_') ||
    normalized.includes('REPLACE') ||
    normalized.includes('CHANGE_ME') ||
    normalized.includes('THAT_DAY_TU_APPSHEET')
  );
}

export function loadAppsheetConfig(env: NodeJS.ProcessEnv = readAppsheetEnv()): AppsheetConfig {
  const appId = cleanEnvValue(env.APPSHEET_APP_ID);
  const accessKey = cleanEnvValue(env.APPSHEET_ACCESS_KEY);

  if (!appId || !accessKey) {
    throw new Error('Thiếu APPSHEET_APP_ID hoặc APPSHEET_ACCESS_KEY trong biến môi trường.');
  }

  if (isPlaceholderAccessKey(accessKey)) {
    throw new Error(
      'APPSHEET_ACCESS_KEY đang là giá trị mẫu. Dán Application Access Key thật vào file .env (Account → My account → Application access).'
    );
  }

  return {
    appId,
    appName: cleanEnvValue(env.APPSHEET_APP_NAME),
    accessKey,
    regionHost: cleanEnvValue(env.APPSHEET_REGION_HOST) || 'www.appsheet.com',
    locale: cleanEnvValue(env.APPSHEET_LOCALE) || 'vi-VN',
    timezone: cleanEnvValue(env.APPSHEET_TIMEZONE) || 'SE Asia Standard Time',
    defaultTable: cleanEnvValue(env.APPSHEET_TABLE) || 'I.1',
    deploymentId: cleanEnvValue(env.APPSHEET_DEPLOYMENT_ID),
  };
}

export function describeAppsheetConfiguration(env: NodeJS.ProcessEnv = readAppsheetEnv()): string | null {
  const appId = cleanEnvValue(env.APPSHEET_APP_ID);
  const accessKey = cleanEnvValue(env.APPSHEET_ACCESS_KEY);

  if (!appId || !accessKey) {
    return 'Thiếu APPSHEET_APP_ID hoặc APPSHEET_ACCESS_KEY. Thêm vào file .env ở thư mục gốc dự án (xem .env.example).';
  }

  if (isPlaceholderAccessKey(accessKey)) {
    return 'APPSHEET_ACCESS_KEY đang là giá trị mẫu. Vào AppSheet → Account → Application access, tạo key và dán vào .env rồi khởi động lại npm run dev.';
  }

  return null;
}

export function isAppsheetConfigured(env: NodeJS.ProcessEnv = readAppsheetEnv()): boolean {
  return describeAppsheetConfiguration(env) === null;
}

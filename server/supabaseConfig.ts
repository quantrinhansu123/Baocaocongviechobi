import dotenv from 'dotenv';
import { isTaskTableName, listTaskTableNames, taskTableToSupabaseName } from './taskTables';

export const REPORT_TABLE_LOGICAL = 'BC định kỳ';
export const REPORT_TABLE_SUPABASE = 'bc_dinh_ky';

function readEnv(): NodeJS.ProcessEnv {
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

export function isReportTable(tableName: string): boolean {
  return tableName.trim() === REPORT_TABLE_LOGICAL;
}

/** Mọi bảng app dùng — chỉ Supabase. */
export function isSupabaseTable(tableName: string): boolean {
  return isTaskTableName(tableName) || isReportTable(tableName);
}

/** @deprecated */
export function isSupabaseTaskTable(tableName: string): boolean {
  return isTaskTableName(tableName);
}

export function listSupabaseTaskTables(): string[] {
  return listTaskTableNames();
}

export function resolveSupabaseTableName(logicalTable: string): string {
  const normalized = logicalTable.trim();

  if (isReportTable(normalized)) {
    return cleanEnvValue(readEnv().SUPABASE_TABLE_BC_DINH_KY) ?? REPORT_TABLE_SUPABASE;
  }

  const envKey = `SUPABASE_TABLE_${normalized.replace('.', '_').toUpperCase()}`;
  const fromEnv = cleanEnvValue(readEnv()[envKey]);
  if (fromEnv) {
    return fromEnv;
  }

  return taskTableToSupabaseName(normalized);
}

export function loadSupabaseConfig(env: NodeJS.ProcessEnv = readEnv()) {
  const url = cleanEnvValue(env.SUPABASE_URL);
  const anonKey = cleanEnvValue(env.SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env.');
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = readEnv()): boolean {
  const url = cleanEnvValue(env.SUPABASE_URL);
  const anonKey = cleanEnvValue(env.SUPABASE_ANON_KEY);
  return Boolean(url && anonKey);
}

export function describeSupabaseConfiguration(env: NodeJS.ProcessEnv = readEnv()): string | null {
  if (!isSupabaseConfigured(env)) {
    return 'Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY. Thêm vào file .env ở thư mục gốc dự án.';
  }
  return null;
}

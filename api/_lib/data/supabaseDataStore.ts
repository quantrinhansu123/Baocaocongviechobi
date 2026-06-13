import { isAuxiliaryTable, isReportTable } from './supabaseConfig';
import { isTaskTableName } from './taskTables';
import {
  addSupabaseAuxiliaryRows,
  deleteSupabaseAuxiliaryRows,
  editSupabaseAuxiliaryRows,
  findSupabaseAuxiliaryRows,
} from './supabaseAuxiliaryStore';
import {
  addSupabaseReportRows,
  deleteSupabaseReportRows,
  editSupabaseReportRows,
  findSupabaseReportRows,
} from './supabaseReportStore';
import {
  addSupabaseTaskRows,
  deleteSupabaseTaskRows,
  editSupabaseTaskRows,
  findSupabaseTaskRows,
} from './supabaseTaskStore';

export function isKnownDataTable(tableName: string): boolean {
  return isTaskTableName(tableName) || isReportTable(tableName) || isAuxiliaryTable(tableName);
}

export async function findSupabaseRows(
  tableName: string,
  options?: { selector?: string }
): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  if (isReportTable(tableName)) {
    return findSupabaseReportRows(tableName);
  }
  if (isAuxiliaryTable(tableName)) {
    return findSupabaseAuxiliaryRows(tableName);
  }
  if (isTaskTableName(tableName)) {
    return findSupabaseTaskRows(tableName, options);
  }
  throw new Error(`Bảng không hỗ trợ: ${tableName}`);
}

export async function addSupabaseRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  if (isReportTable(tableName)) {
    return addSupabaseReportRows(tableName, rows);
  }
  if (isAuxiliaryTable(tableName)) {
    return addSupabaseAuxiliaryRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return addSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`Bảng không hỗ trợ: ${tableName}`);
}

export async function editSupabaseRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  if (isReportTable(tableName)) {
    return editSupabaseReportRows(tableName, rows);
  }
  if (isAuxiliaryTable(tableName)) {
    return editSupabaseAuxiliaryRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return editSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`Bảng không hỗ trợ: ${tableName}`);
}

export async function deleteSupabaseRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  if (isReportTable(tableName)) {
    return deleteSupabaseReportRows(tableName, rows);
  }
  if (isAuxiliaryTable(tableName)) {
    return deleteSupabaseAuxiliaryRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return deleteSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`Bảng không hỗ trợ: ${tableName}`);
}

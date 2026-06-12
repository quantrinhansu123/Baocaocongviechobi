import { getSupabaseClient } from './supabaseClient';
import { resolveSupabaseTableName, REPORT_TABLE_LOGICAL } from './supabaseConfig';
import { throwSupabaseError } from './supabaseErrors';

type DbReportRow = {
  id: string;
  data: Record<string, unknown>;
};

function pickReportId(row: Record<string, unknown>): string {
  for (const key of ['id', 'ID', 'Id']) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function dbRowToReport(row: DbReportRow): Record<string, unknown> {
  const id = row.id;
  return {
    ...row.data,
    id: pickReportId(row.data) || id,
  };
}

function reportRowToDb(row: Record<string, unknown>): DbReportRow {
  const id = pickReportId(row);
  if (!id) {
    throw new Error('Thiếu cột id để ghi Supabase (báo cáo).');
  }

  const data: Record<string, unknown> = { ...row, id };
  delete data._RowNumber;
  return { id, data };
}

export async function findSupabaseReportRows(
  logicalTable: string = REPORT_TABLE_LOGICAL
): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from(table).select('id,data').order('id', { ascending: true });
  if (error) {
    throwSupabaseError(error.message, table);
  }

  const rows = (data ?? []).map(item => dbRowToReport(item as DbReportRow));
  return { rows, raw: data };
}

export async function addSupabaseReportRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const payload = rows.map(reportRowToDb);

  const { data, error } = await supabase.from(table).insert(payload).select('id,data');
  if (error) {
    throwSupabaseError(error.message, table);
  }

  return (data ?? []).map(item => dbRowToReport(item as DbReportRow));
}

export async function editSupabaseReportRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const updated: Record<string, unknown>[] = [];

  for (const row of rows) {
    const { id, data } = reportRowToDb(row);
    const { data: saved, error } = await supabase
      .from(table)
      .update({ data })
      .eq('id', id)
      .select('id,data')
      .maybeSingle();

    if (error) {
      throwSupabaseError(error.message, table);
    }
    if (!saved) {
      throw new Error(`Không tìm thấy báo cáo id=${id} trong bảng ${table}.`);
    }
    updated.push(dbRowToReport(saved as DbReportRow));
  }

  return updated;
}

export async function deleteSupabaseReportRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();

  for (const row of rows) {
    const id = pickReportId(row);
    if (!id) {
      throw new Error('Thiếu id để xóa báo cáo trên Supabase.');
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      throwSupabaseError(error.message, table);
    }
  }

  return null;
}

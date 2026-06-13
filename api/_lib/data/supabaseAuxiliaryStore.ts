import { getSupabaseClient } from './supabaseClient';
import { auxiliaryTableToSupabaseName } from './auxiliaryTables';
import { throwSupabaseError } from './supabaseErrors';

type DbAuxRow = {
  id: string;
  data: Record<string, unknown>;
};

function pickId(row: Record<string, unknown>): string {
  for (const key of ['id', 'ID', 'Id', 'key', 'Key']) {
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

function dbRowToRecord(row: DbAuxRow): Record<string, unknown> {
  const id = row.id;
  return {
    ...row.data,
    id: pickId(row.data) || id,
    key: pickId(row.data) || id,
  };
}

function recordToDb(row: Record<string, unknown>): DbAuxRow {
  const id = pickId(row);
  if (!id) {
    throw new Error('Thiếu id để ghi Supabase.');
  }

  const data: Record<string, unknown> = { ...row, id, key: id };
  delete data._RowNumber;
  return { id, data };
}

export async function findSupabaseAuxiliaryRows(
  logicalTable: string
): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  const table = auxiliaryTableToSupabaseName(logicalTable);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from(table).select('id,data').order('id', { ascending: true });
  if (error) {
    throwSupabaseError(error.message, table);
  }

  const rows = (data ?? []).map(item => dbRowToRecord(item as DbAuxRow));
  return { rows, raw: data };
}

export async function addSupabaseAuxiliaryRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = auxiliaryTableToSupabaseName(logicalTable);
  const supabase = getSupabaseClient();
  const payload = rows.map(recordToDb);

  const { data, error } = await supabase.from(table).insert(payload).select('id,data');
  if (error) {
    throwSupabaseError(error.message, table);
  }

  return (data ?? []).map(item => dbRowToRecord(item as DbAuxRow));
}

export async function editSupabaseAuxiliaryRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = auxiliaryTableToSupabaseName(logicalTable);
  const supabase = getSupabaseClient();
  const updated: Record<string, unknown>[] = [];

  for (const row of rows) {
    const { id, data } = recordToDb(row);
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
      throw new Error(`Không tìm thấy dòng id=${id} trong bảng ${table}.`);
    }
    updated.push(dbRowToRecord(saved as DbAuxRow));
  }

  return updated;
}

export async function deleteSupabaseAuxiliaryRows(
  logicalTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = auxiliaryTableToSupabaseName(logicalTable);
  const supabase = getSupabaseClient();

  for (const row of rows) {
    const id = pickId(row);
    if (!id) {
      throw new Error('Thiếu id để xóa trên Supabase.');
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      throwSupabaseError(error.message, table);
    }
  }

  return null;
}

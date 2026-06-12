import { getSupabaseClient } from './supabaseClient';
import { resolveSupabaseTableName } from './supabaseConfig';
import { throwSupabaseError } from './supabaseErrors';

type DbTaskRow = {
  tt: string;
  data: Record<string, unknown>;
};

function pickTt(row: Record<string, unknown>): string {
  for (const key of ['TT', 'tt', 'STT', 'Stt', 'stt']) {
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

export function parseTtFromSelector(selector?: string): string | null {
  if (!selector?.trim()) {
    return null;
  }

  const quoted = selector.match(/Filter\(\[TT\],\s*="([^"]+)"\)/i);
  if (quoted?.[1]) {
    return quoted[1].trim();
  }

  const numeric = selector.match(/Filter\(\[TT\],\s*=([^")\s]+)\)/i);
  if (numeric?.[1]) {
    return numeric[1].trim();
  }

  return null;
}

function dbRowToAppsheet(row: DbTaskRow): Record<string, unknown> {
  const tt = row.tt;
  return {
    ...row.data,
    TT: pickTt(row.data) || tt,
  };
}

function appsheetRowToDb(row: Record<string, unknown>): DbTaskRow {
  const tt = pickTt(row);
  if (!tt) {
    throw new Error('Thiếu cột TT để ghi Supabase.');
  }

  const data = { ...row, TT: tt };
  return { tt, data };
}

export async function findSupabaseTaskRows(
  appsheetTable: string,
  options?: { selector?: string }
): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  const table = resolveSupabaseTableName(appsheetTable);
  const supabase = getSupabaseClient();
  const tt = parseTtFromSelector(options?.selector);

  let query = supabase.from(table).select('tt,data').order('tt', { ascending: true });
  if (tt) {
    query = query.eq('tt', tt);
  }

  const { data, error } = await query;
  if (error) {
    throwSupabaseError(error.message, table);
  }

  const rows = (data ?? []).map(item => dbRowToAppsheet(item as DbTaskRow));
  return { rows, raw: data };
}

export async function addSupabaseTaskRows(
  appsheetTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(appsheetTable);
  const supabase = getSupabaseClient();
  const payload = rows.map(appsheetRowToDb);

  const { data, error } = await supabase.from(table).insert(payload).select('tt,data');
  if (error) {
    throwSupabaseError(error.message, table);
  }

  return (data ?? []).map(item => dbRowToAppsheet(item as DbTaskRow));
}

export async function editSupabaseTaskRows(
  appsheetTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(appsheetTable);
  const supabase = getSupabaseClient();
  const updated: Record<string, unknown>[] = [];

  for (const row of rows) {
    const { tt, data } = appsheetRowToDb(row);
    const { data: saved, error } = await supabase
      .from(table)
      .update({ data })
      .eq('tt', tt)
      .select('tt,data')
      .maybeSingle();

    if (error) {
      throwSupabaseError(error.message, table);
    }
    if (!saved) {
      throw new Error(`Không tìm thấy dòng TT=${tt} trong bảng ${table}.`);
    }
    updated.push(dbRowToAppsheet(saved as DbTaskRow));
  }

  return updated;
}

export async function deleteSupabaseTaskRows(
  appsheetTable: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  const table = resolveSupabaseTableName(appsheetTable);
  const supabase = getSupabaseClient();

  for (const row of rows) {
    const tt = pickTt(row);
    if (!tt) {
      throw new Error('Thiếu TT để xóa trên Supabase.');
    }

    const { error } = await supabase.from(table).delete().eq('tt', tt);
    if (error) {
      throwSupabaseError(error.message, table);
    }
  }

  return null;
}

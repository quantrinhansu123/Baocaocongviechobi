import { addDataRow, deleteDataRow, findDataRows } from './dataApi';

export const TABLE_GHI_CHU_PHONG_BAN = 'Ghi chú phòng ban';
export const TABLE_GHI_CHU_CHUNG = 'Ghi chú chung';

export type WorkNoteIdea = {
  id: string;
  blockKey: string;
  deptKey: string;
  title: string;
  lines: string[];
  hidden: boolean;
  createdAt: number;
};

export type GeneralNoteIdea = {
  id: string;
  lines: string[];
  hidden: boolean;
  createdAt: number;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) return [''];
  return value.map(item => String(item ?? ''));
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function rowToWorkNote(row: Record<string, unknown>): WorkNoteIdea | null {
  const id = String(row.id ?? row.key ?? '').trim();
  if (!id) return null;
  return {
    id,
    blockKey: String(row.blockKey ?? ''),
    deptKey: String(row.deptKey ?? ''),
    title: String(row.title ?? '').trim() || 'Ghi chú',
    lines: asStringArray(row.lines),
    hidden: Boolean(row.hidden),
    createdAt: asNumber(row.createdAt, Date.now()),
  };
}

export function workNoteToRow(note: WorkNoteIdea): Record<string, unknown> {
  return {
    id: note.id,
    key: note.id,
    blockKey: note.blockKey,
    deptKey: note.deptKey,
    title: note.title,
    lines: note.lines,
    hidden: note.hidden,
    createdAt: note.createdAt,
  };
}

export function rowToGeneralNote(row: Record<string, unknown>): GeneralNoteIdea | null {
  const id = String(row.id ?? row.key ?? '').trim();
  if (!id) return null;
  return {
    id,
    lines: asStringArray(row.lines),
    hidden: Boolean(row.hidden),
    createdAt: asNumber(row.createdAt, Date.now()),
  };
}

export function generalNoteToRow(note: GeneralNoteIdea): Record<string, unknown> {
  return {
    id: note.id,
    key: note.id,
    lines: note.lines,
    hidden: note.hidden,
    createdAt: note.createdAt,
  };
}

export async function loadWorkNotesFromSupabase(): Promise<WorkNoteIdea[]> {
  const result = await findDataRows({ table: TABLE_GHI_CHU_PHONG_BAN });
  return result.rows
    .map(rowToWorkNote)
    .filter((item): item is WorkNoteIdea => Boolean(item))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function loadGeneralNotesFromSupabase(): Promise<GeneralNoteIdea[]> {
  const result = await findDataRows({ table: TABLE_GHI_CHU_CHUNG });
  return result.rows
    .map(rowToGeneralNote)
    .filter((item): item is GeneralNoteIdea => Boolean(item))
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Ghi từng dòng bằng upsert (onConflict id) — tránh lỗi duplicate key khi sync song song. */
async function upsertAllRows(table: string, localRows: Record<string, unknown>[]) {
  for (const row of localRows) {
    const id = String(row.id ?? '').trim();
    if (!id) continue;
    await addDataRow(row, table);
  }
}

let workNotesSyncChain: Promise<void> = Promise.resolve();
let generalNotesSyncChain: Promise<void> = Promise.resolve();

function enqueueSync(chain: Promise<void>, run: () => Promise<void>): Promise<void> {
  return chain.then(run, run);
}

export async function syncWorkNotesToSupabase(notes: WorkNoteIdea[]): Promise<void> {
  const run = async () => {
    const result = await findDataRows({ table: TABLE_GHI_CHU_PHONG_BAN });
    const remoteIds = new Set(
      result.rows.map(row => String(row.id ?? row.key ?? '').trim()).filter(Boolean)
    );
    const localIds = new Set(notes.map(note => note.id));

    for (const id of remoteIds) {
      if (!localIds.has(id)) {
        await deleteDataRow({ id }, TABLE_GHI_CHU_PHONG_BAN);
      }
    }

    await upsertAllRows(TABLE_GHI_CHU_PHONG_BAN, notes.map(workNoteToRow));
  };

  const next = enqueueSync(workNotesSyncChain, run);
  workNotesSyncChain = next.catch(() => undefined);
  await next;
}

export async function syncGeneralNotesToSupabase(notes: GeneralNoteIdea[]): Promise<void> {
  const run = async () => {
    const result = await findDataRows({ table: TABLE_GHI_CHU_CHUNG });
    const remoteIds = new Set(
      result.rows.map(row => String(row.id ?? row.key ?? '').trim()).filter(Boolean)
    );
    const localIds = new Set(notes.map(note => note.id));

    for (const id of remoteIds) {
      if (!localIds.has(id)) {
        await deleteDataRow({ id }, TABLE_GHI_CHU_CHUNG);
      }
    }

    await upsertAllRows(TABLE_GHI_CHU_CHUNG, notes.map(generalNoteToRow));
  };

  const next = enqueueSync(generalNotesSyncChain, run);
  generalNotesSyncChain = next.catch(() => undefined);
  await next;
}

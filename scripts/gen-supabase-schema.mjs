import { writeFileSync } from 'node:fs';
import { listTaskTableNames, taskTableToSupabaseName } from '../lib/data/taskTables.ts';

const taskTables = listTaskTableNames().map(taskTableToSupabaseName);
const reportTable = 'bc_dinh_ky';

function policySql(table) {
  return `alter table public.${table} enable row level security;
create policy "anon_select_${table}" on public.${table} for select to anon using (true);
create policy "anon_insert_${table}" on public.${table} for insert to anon with check (true);
create policy "anon_update_${table}" on public.${table} for update to anon using (true) with check (true);
create policy "anon_delete_${table}" on public.${table} for delete to anon using (true);

`;
}

function taskTableSql(table) {
  return `create table public.${table} (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
${policySql(table)}`;
}

function reportTableSql(table) {
  return `create table public.${table} (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
${policySql(table)}`;
}

const allTables = [...taskTables, reportTable];

let sql =
  '-- Bảng công việc chi tiết (I.1 … IV.2) + BC định kỳ\n' +
  '-- Chạy TOÀN BỘ file này trong Supabase → SQL Editor → Run.\n' +
  '-- Phần DROP xóa bảng cũ nếu tạo sai schema (mất dữ liệu trong các bảng này).\n\n';

for (const table of allTables) {
  sql += `drop table if exists public.${table} cascade;\n`;
}
sql += '\n';

for (const table of taskTables) {
  sql += taskTableSql(table);
}

sql += `-- BC định kỳ (logical: BC định kỳ)\n`;
sql += reportTableSql(reportTable);

sql += `-- Làm mới cache API sau khi tạo bảng (tránh lỗi "schema cache")\n`;
sql += `notify pgrst, 'reload schema';\n`;

writeFileSync('supabase/schema.sql', sql, 'utf8');
console.log('Wrote', taskTables.length, 'task tables +', reportTable, 'to supabase/schema.sql');

/**
 * Kiểm tra bảng Supabase (truy vấn thật, không dùng HEAD — tránh báo sai).
 * Chạy: node scripts/check-supabase-tables.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), override: true });

function clean(v) {
  const t = v?.trim();
  if (!t) return undefined;
  if ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'")) {
    return t.slice(1, -1).trim() || undefined;
  }
  return t;
}

const url = clean(process.env.SUPABASE_URL);
const key = clean(process.env.SUPABASE_ANON_KEY);
if (!url || !key) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env');
  process.exit(1);
}

const taskTables = [];
for (const block of ['i', 'ii', 'iii', 'iv']) {
  const counts = { i: 3, ii: 9, iii: 3, iv: 2 };
  for (let n = 1; n <= counts[block]; n++) {
    taskTables.push(`${block}_${n}`);
  }
}
const auxiliaryTables = [
  'bc_dinh_ky',
  'cong_no',
  'lich_bao_cao',
  'nguoi_dung',
  'mau_bao_cao',
  'thu_muc',
  'phan_quyen',
  'bc_chi_tiet',
  'canh_bao',
];
const reportTable = clean(process.env.SUPABASE_TABLE_BC_DINH_KY) || 'bc_dinh_ky';

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const missing = [];
const ok = [];

async function probe(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  const msg = error?.message ?? '';
  if (msg.includes('schema cache') || msg.includes('Could not find') || msg.includes('does not exist')) {
    return false;
  }
  if (error) {
    console.warn(`  ! ${table}: ${error.message}`);
    return false;
  }
  return true;
}

for (const table of taskTables) {
  if (await probe(table, 'tt')) ok.push(table);
  else missing.push(table);
}

for (const table of auxiliaryTables) {
  if (table === reportTable) {
    continue;
  }
  if (await probe(table, 'id')) ok.push(table);
  else missing.push(table);
}

if (await probe(reportTable, 'id')) ok.push(reportTable);
else missing.push(reportTable);

const total = taskTables.length + auxiliaryTables.length;
console.log(`Project: ${url.replace(/https?:\/\//, '')}`);
console.log(`OK: ${ok.length}/${total}`);

if (missing.length) {
  console.log('\nChưa có bảng trên Supabase. Làm theo các bước sau:');
  console.log('  1. Mở Supabase Dashboard → SQL Editor');
  console.log('  2. Copy toàn bộ file supabase/schema.sql → Run');
  console.log('  3. node scripts/seed-auxiliary.mjs  (tùy chọn — dữ liệu mẫu)');
  console.log('  4. node scripts/check-supabase-tables.mjs  (chạy lại để xác nhận)');
  console.log('  5. Restart npm run dev → F5 trang web\n');
  console.log('Thiếu:');
  for (const t of missing) console.log(`  - public.${t}`);
  process.exit(1);
}

console.log('Tất cả bảng đã sẵn sàng.');

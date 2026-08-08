/**
 * Chạy supabase/schema.sql lên Postgres của Supabase.
 *
 * Cách 1 (khuyên dùng): thêm vào .env
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
 *   (hoặc URI từ Dashboard → Project Settings → Database → Connection string → URI)
 *
 * Cách 2:
 *   SUPABASE_URL="https://xxxx.supabase.co"
 *   SUPABASE_DB_PASSWORD="mật khẩu DB lúc tạo project"
 *
 * Chạy: node scripts/apply-supabase-schema.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

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

function ensurePg() {
  const require = createRequire(import.meta.url);
  try {
    return require('pg');
  } catch {
    console.log('Đang cài package pg...');
    execSync('npm install pg --no-save', { cwd: root, stdio: 'inherit' });
    return require('pg');
  }
}

function buildConnectionString() {
  const direct = clean(process.env.SUPABASE_DB_URL) || clean(process.env.DATABASE_URL);
  if (direct) return direct;

  const url = clean(process.env.SUPABASE_URL);
  const password = clean(process.env.SUPABASE_DB_PASSWORD);
  if (!url || !password) return undefined;

  const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const ref = host.split('.')[0];
  // Direct connection (port 5432). URL-encode password.
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;
}

const connectionString = buildConnectionString();
if (!connectionString) {
  console.error(`
Thiếu thông tin kết nối Postgres.

Thêm vào .env MỘT trong các cách sau:

1) SUPABASE_DB_URL="postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres"
   (Dashboard → Project Settings → Database → Connection string → URI)

2) SUPABASE_URL + SUPABASE_DB_PASSWORD
   SUPABASE_URL="https://xxxx.supabase.co"
   SUPABASE_DB_PASSWORD="mật khẩu database"

Hoặc tự chạy SQL:
  Supabase Dashboard → SQL Editor → dán file supabase/schema.sql → Run
`);
  process.exit(1);
}

const { Client } = ensurePg();
const sqlPath = path.join(root, 'supabase', 'schema.sql');
const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

console.log('Đang kết nối Postgres và chạy schema.sql ...');
try {
  await client.connect();
  await client.query(sql);
  console.log('OK — đã tạo/reset toàn bộ bảng.');
  console.log('Tiếp theo:');
  console.log('  node scripts/seed-auxiliary.mjs');
  console.log('  node scripts/seed-bc-reports.mjs --force');
  console.log('  node scripts/check-supabase-tables.mjs');
} catch (err) {
  console.error('Lỗi chạy SQL:', err.message || err);
  console.error('\nNếu không kết nối được DB từ máy local, hãy Run thủ công:');
  console.error('  Dashboard → SQL Editor → dán supabase/schema.sql → Run');
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

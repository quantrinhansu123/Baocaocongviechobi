/**
 * Nhập dữ liệu BC định kỳ từ tmp-find-bc.json vào Supabase (bảng bc_dinh_ky).
 * Chạy: node scripts/seed-bc-reports.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env', override: true });

const url = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, '');
const key = process.env.SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '');
const table = process.env.SUPABASE_TABLE_BC_DINH_KY?.trim().replace(/^["']|["']$/g, '') || 'bc_dinh_ky';

if (!url || !key) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env');
  process.exit(1);
}

const jsonPath = 'tmp-find-bc.json';
if (!existsSync(jsonPath)) {
  console.error('Không tìm thấy', jsonPath);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : raw?.Rows ?? [];

function pickId(row) {
  for (const k of ['id', 'ID', 'Id']) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}

const payload = rows
  .map(row => {
    const id = pickId(row);
    if (!id) return null;
    const data = { ...row, id };
    delete data._RowNumber;
    return { id, data };
  })
  .filter(Boolean);

if (!payload.length) {
  console.error('Không có dòng hợp lệ trong', jsonPath);
  process.exit(1);
}

const supabase = createClient(url, key);
const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });

if (error) {
  console.error('Lỗi Supabase:', error.message);
  process.exit(1);
}

console.log(`Đã upsert ${payload.length} báo cáo vào public.${table}`);

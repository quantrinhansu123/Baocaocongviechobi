/**
 * Nhập dữ liệu BC định kỳ vào Supabase (bảng bc_dinh_ky).
 * - Mặc định: sinh menu + báo cáo mẫu theo cây tổ chức.
 * - Nếu có tmp-find-bc.json: dùng file đó thay thế.
 * Chạy: node scripts/seed-bc-reports.mjs
 *       node scripts/seed-bc-reports.mjs --force   (upsert kể cả khi đã có dữ liệu)
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const force = process.argv.includes('--force');

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
const table = clean(process.env.SUPABASE_TABLE_BC_DINH_KY) || 'bc_dinh_ky';

if (!url || !key) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env');
  process.exit(1);
}

const ORG_BLOCKS = [
  {
    ma: 'I',
    label: 'BAN LÃNH ĐẠO',
    depts: ['CÔNG VIỆC CÁ NHÂN', 'CÔNG VIỆC CỦA BLĐ', 'DANH MỤC CÔNG VIỆC'],
  },
  {
    ma: 'II',
    label: 'KHỐI THƯƠNG MẠI',
    depts: [
      'PHÒNG HCNS',
      'PHÒNG KD HOBI GỖ',
      'PHÒNG KD HOBI NHỰA',
      'PHÒNG XUẤT KHẨU',
      'PHÒNG DỰ ÁN',
      'CHI NHÁNH HCM',
      'PHÒNG MARKETING',
      'PHÒNG KẾ TOÁN TM',
      'PHÒNG KHO',
    ],
  },
  {
    ma: 'III',
    label: 'KHỐI SẢN XUẤT',
    depts: ['PHÒNG KD OEM', 'PHÒNG KẾ TOÁN SẢN XUẤT', 'NHÀ MÁY WILSON HB'],
  },
  {
    ma: 'IV',
    label: 'PHÒNG MUA NỘI ĐỊA, QUỐC TẾ',
    depts: ['MUA THƯƠNG MẠI', 'MUA SẢN XUẤT'],
  },
];

const SID_ROOT = { I: 'sid1', II: 'sid2', III: 'sid3', IV: 'sid4' };

function buildDefaultRows() {
  const rows = [];
  let rowNumber = 1;

  for (const block of ORG_BLOCKS) {
    const sidRoot = SID_ROOT[block.ma];
    rows.push({
      id: sidRoot,
      _RowNumber: rowNumber,
      Mã: block.ma,
      'Tên báo cáo': block.label,
    });
    rowNumber += 1;

    let suffix = 1;
    for (const dept of block.depts) {
      const groupId = `${sidRoot}.${suffix}`;
      rows.push({
        id: groupId,
        _RowNumber: rowNumber,
        Mã: block.ma,
        'Loại báo cáo': dept,
      });
      rowNumber += 1;
      suffix += 1;

      const reportId = `${sidRoot}.${suffix}`;
      rows.push({
        id: reportId,
        _RowNumber: rowNumber,
        Mã: block.ma,
        'Loại báo cáo': dept,
        'Tên báo cáo': `BC Tuần ${dept}`,
        'Nội dung': `Báo cáo tuần — ${dept}`,
        'Kỳ báo cáo': 'Tuần 16',
        'Ngày báo cáo': '23/05/2026',
        'Người gửi báo cáo': 'Anh Tuyển',
        'Người nhận báo cáo': 'Ban Lãnh Đạo',
        'Luồng báo cáo': 'Nộp → Duyệt',
        'Link báo cáo': 'https://docs.google.com/spreadsheets/',
        'Ngày update link': '23/05/2026',
      });
      rowNumber += 1;
      suffix += 1;
    }
  }

  return rows;
}

function loadRowsFromFile(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  return Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : raw?.Rows ?? [];
}

function pickId(row) {
  for (const k of ['id', 'ID', 'Id']) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}

function toPayload(rows) {
  return rows
    .map(row => {
      const id = pickId(row);
      if (!id) return null;
      const data = { ...row, id };
      return { id, data };
    })
    .filter(Boolean);
}

const jsonPath = path.join(root, 'tmp-find-bc.json');
const sourceRows = existsSync(jsonPath) ? loadRowsFromFile(jsonPath) : buildDefaultRows();
const payload = toPayload(sourceRows);

if (!payload.length) {
  console.error('Không có dòng hợp lệ để seed.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { count, error: countError } = await supabase.from(table).select('id', { count: 'exact', head: true });
if (countError) {
  console.error('Lỗi đọc bảng:', countError.message);
  process.exit(1);
}

if ((count ?? 0) > 0 && !force) {
  console.log(`= ${table}: đã có ${count} dòng. Chạy với --force để ghi đè/upsert.`);
  process.exit(0);
}

const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
if (error) {
  console.error('Lỗi Supabase:', error.message);
  process.exit(1);
}

const source = existsSync(jsonPath) ? 'tmp-find-bc.json' : 'cây tổ chức mặc định';
console.log(`Đã upsert ${payload.length} báo cáo vào public.${table} (nguồn: ${source}).`);

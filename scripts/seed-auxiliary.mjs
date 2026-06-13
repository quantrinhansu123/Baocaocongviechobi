/**
 * Seed dữ liệu phụ trợ vào Supabase (chỉ insert nếu bảng trống).
 * Chạy: node scripts/seed-auxiliary.mjs
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
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const seeds = {
  cong_no: [
    { id: '1', data: { customer: 'Công ty A', trade: { total: 500, collected: 400, overdue: 100 }, oem: { total: 200, collected: 150, overdue: 50 } } },
    { id: '2', data: { customer: 'Công ty B', trade: { total: 800, collected: 800, overdue: 0 }, oem: { total: 300, collected: 200, overdue: 100 } } },
  ],
  lich_bao_cao: [
    { id: '1', data: { day: 5, month: new Date().getMonth(), title: 'Báo cáo tháng NM', type: 'error', sender: 'Anh Tài (NM)', receiver: 'Sếp Tuyển', time: '08:00' } },
    { id: '2', data: { day: 6, month: new Date().getMonth(), title: 'Công nợ OEM', type: 'warning', sender: 'Chị Lan (KT)', receiver: 'Sếp Tuyển', time: '10:30' } },
    { id: '3', data: { day: 7, month: new Date().getMonth(), title: 'Báo cáo tuần KD', type: 'processing', sender: 'Anh Hùng (KD)', receiver: 'Sếp Tuyển', time: '15:00' } },
    { id: '4', data: { day: 15, month: new Date().getMonth(), title: 'Đối soát tồn kho', type: 'success', sender: 'Bộ phận Kho', receiver: 'Kế toán trưởng', time: '09:00' } },
  ],
  nguoi_dung: [
    { id: '1', data: { name: 'Lê Hoàng Tuyển', email: 'tuyenlh@hobiwood.com', department: 'Ban Giám Đốc', role: 'Super Admin' } },
    { id: '2', data: { name: 'Nguyễn Văn Hùng', email: 'hungnv@hobiwood.com', department: 'Nhà máy', role: 'Quản lý' } },
    { id: '3', data: { name: 'Trần Thị Lan', email: 'lantt@hobiwood.com', department: 'Kế toán', role: 'Nhân viên' } },
  ],
  mau_bao_cao: [
    { id: '1', data: { name: 'Mẫu Báo Cáo Sản Xuất Tuần', type: 'Excel', lastUpdate: '10/04/2026', status: 'Active' } },
    { id: '2', data: { name: 'Biểu Mẫu Đánh Giá OEM', type: 'Word', lastUpdate: '05/04/2026', status: 'Active' } },
    { id: '3', data: { name: 'Phiếu Yêu Cầu Vật Tư', type: 'PDF', lastUpdate: '12/03/2026', status: 'Inactive' } },
  ],
  thu_muc: [
    { id: 'nm', data: { title: 'Nhà máy (Root)' } },
    { id: 'nm-1', data: { title: 'Báo cáo định kỳ', parentId: 'nm' } },
    { id: 'nm-2', data: { title: 'Báo cáo lỗi', parentId: 'nm' } },
    { id: 'oem', data: { title: 'OEM (Root)' } },
  ],
  phan_quyen: [
    { id: '1', data: { feature: 'Thư mục: Nhà máy', read: true, write: true, delete: false, approve: true } },
    { id: '2', data: { feature: 'Thư mục: OEM', read: true, write: false, delete: false, approve: false } },
    { id: '3', data: { feature: 'Báo cáo Cảnh báo', read: true, write: false, delete: false, approve: false } },
  ],
  bc_chi_tiet: [
    { id: '1', data: { reportId: 'sid1.1', name: 'Kiểm tra dây chuyền số 1', deadline: '16/04/2026', status: 'Đang làm', priority: 4, description: 'Kiểm tra trước ca sản xuất mới.' } },
    { id: '2', data: { reportId: 'sid1.1', name: 'Họp với nhà cung cấp vật tư', deadline: '17/04/2026', status: 'Chờ xử lý', priority: 5 } },
    { id: '3', data: { reportId: 'sid1.1', name: 'Hoàn thiện hồ sơ nghiệm thu', deadline: '15/04/2026', status: 'Hoàn thành', priority: 3 } },
    { id: '4', data: { reportId: 'default', name: 'Sản xuất đơn hàng ván sàn A', deadline: '2026-04-23', status: 'Hoàn thành', priority: 4, description: 'Sản xuất 500m2 sàn gỗ ngoài trời 2D.', owner: 'Anh Tài' } },
    { id: '5', data: { reportId: 'default', name: 'Fix lỗi ván ép lô B', deadline: '2026-04-07', status: 'Trễ hạn', priority: 3, description: 'Lô B bị lỗi cong vênh 5%.', owner: 'Anh Tuấn' } },
  ],
  canh_bao: [
    { id: '1', data: { message: 'Công nợ OEM đang tăng cao vượt mức an toàn.' } },
    { id: '2', data: { message: 'Tồn kho vật tư chậm luân chuyển tại kho số 2.' } },
    { id: '3', data: { message: 'Tỷ lệ hàng lỗi line A vượt quá 5% trong tuần này.' } },
  ],
};

async function seedTable(table, rows) {
  const { count, error: countError } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (countError) {
    console.error(`  ! ${table}: ${countError.message}`);
    return;
  }
  if ((count ?? 0) > 0) {
    console.log(`  = ${table}: đã có ${count} dòng, bỏ qua`);
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`  ! ${table}: ${error.message}`);
    return;
  }
  console.log(`  + ${table}: ${rows.length} dòng`);
}

console.log('Seed bảng phụ trợ Supabase...');
for (const [table, rows] of Object.entries(seeds)) {
  await seedTable(table, rows);
}
console.log('Xong.');

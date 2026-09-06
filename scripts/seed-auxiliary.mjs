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
  nhan_su: [
    { id: 'ns-demo-01', data: { name: 'Lê Hoàng Tuyển', department: 'Ban Giám Đốc', position: 'Giám đốc', email: 'tuyenlh@hobiwood.com', phone: '0901001001', status: 'Đang làm', joinDate: '01/01/2018' } },
    { id: 'ns-demo-02', data: { name: 'Phạm Quốc Bảo', department: 'Ban Lãnh Đạo', position: 'Trợ lý BLĐ', email: 'baopq@hobiwood.com', phone: '0901001002', status: 'Đang làm', joinDate: '15/06/2019' } },
    { id: 'ns-demo-03', data: { name: 'Nguyễn Thị Mai', department: 'Phòng HCNS', position: 'Trưởng phòng HCNS', email: 'maint@hobiwood.com', phone: '0902002001', status: 'Đang làm', joinDate: '01/03/2019' } },
    { id: 'ns-demo-04', data: { name: 'Nguyễn Văn Minh', department: 'Phòng KD Hobi Gỗ', position: 'Nhân viên KD', email: 'minhnv@hobiwood.com', phone: '0903003001', status: 'Đang làm', joinDate: '10/02/2021' } },
    { id: 'ns-demo-05', data: { name: 'Trần Thị Hoa', department: 'Phòng KD Hobi Gỗ', position: 'Nhân viên KD', email: 'hoatt@hobiwood.com', phone: '0903003002', status: 'Đang làm', joinDate: '20/08/2022' } },
    { id: 'ns-demo-06', data: { name: 'Lê Quang Huy', department: 'Phòng KD Hobi Gỗ', position: 'Chuyên viên công nợ', email: 'huylq@hobiwood.com', phone: '0903003003', status: 'Đang làm', joinDate: '05/01/2020' } },
    { id: 'ns-demo-07', data: { name: 'Đỗ Thị Lan', department: 'Phòng KD Hobi Nhựa', position: 'Nhân viên KD', email: 'landt@hobiwood.com', phone: '0904004001', status: 'Đang làm', joinDate: '12/04/2021' } },
    { id: 'ns-demo-08', data: { name: 'Võ Minh Tuấn', department: 'Phòng Xuất khẩu', position: 'Chuyên viên XK', email: 'tuanvm@hobiwood.com', phone: '0905005001', status: 'Đang làm', joinDate: '01/09/2020' } },
    { id: 'ns-demo-09', data: { name: 'Hoàng Anh Đức', department: 'Phòng Dự án', position: 'Quản lý dự án', email: 'ducha@hobiwood.com', phone: '0906006001', status: 'Đang làm', joinDate: '18/11/2019' } },
    { id: 'ns-demo-10', data: { name: 'Ngô Thị Hạnh', department: 'Chi nhánh HCM', position: 'Trưởng chi nhánh', email: 'hanhnt@hobiwood.com', phone: '0907007001', status: 'Đang làm', joinDate: '01/07/2018' } },
    { id: 'ns-demo-11', data: { name: 'Bùi Văn Khoa', department: 'Phòng Marketing', position: 'Content & Brand', email: 'khoabv@hobiwood.com', phone: '0908008001', status: 'Thử việc', joinDate: '01/08/2026' } },
    { id: 'ns-demo-12', data: { name: 'Trần Thị Lan', department: 'Phòng Kế toán TM', position: 'Kế toán viên', email: 'lantt@hobiwood.com', phone: '0909009001', status: 'Đang làm', joinDate: '01/06/2021' } },
    { id: 'ns-demo-13', data: { name: 'Lý Văn Phong', department: 'Phòng Kho', position: 'Thủ kho', email: 'phonglv@hobiwood.com', phone: '0910001001', status: 'Đang làm', joinDate: '22/02/2020' } },
    { id: 'ns-demo-14', data: { name: 'Phan Thị Ngọc', department: 'Phòng KD OEM', position: 'Nhân viên KD OEM', email: 'ngocpt@hobiwood.com', phone: '0911001101', status: 'Đang làm', joinDate: '14/05/2021' } },
    { id: 'ns-demo-15', data: { name: 'Đặng Minh Sơn', department: 'Phòng Kế toán Sản xuất', position: 'Kế toán sản xuất', email: 'sondm@hobiwood.com', phone: '0912001201', status: 'Đang làm', joinDate: '03/03/2022' } },
    { id: 'ns-demo-16', data: { name: 'Nguyễn Văn Hùng', department: 'Nhà máy Wilson HB', position: 'Quản lý sản xuất', email: 'hungnv@hobiwood.com', phone: '0913001301', status: 'Đang làm', joinDate: '15/03/2020' } },
    { id: 'ns-demo-17', data: { name: 'Trịnh Thị Yến', department: 'Mua Thương mại', position: 'Nhân viên mua hàng', email: 'yentt@hobiwood.com', phone: '0914001401', status: 'Đang làm', joinDate: '09/09/2021' } },
    { id: 'ns-demo-18', data: { name: 'Cao Đức Thành', department: 'Mua Sản xuất', position: 'Nhân viên mua vật tư', email: 'thanhcd@hobiwood.com', phone: '0915001501', status: 'Nghỉ phép', joinDate: '11/11/2020' } },
    { id: 'ns-demo-19', data: { name: 'Mai Văn Cường', department: 'Nhà máy Wilson HB', position: 'Tổ trưởng ca', email: 'cuongmv@hobiwood.com', phone: '0916001601', status: 'Đang làm', joinDate: '01/04/2019' } },
    { id: 'ns-demo-20', data: { name: 'Hà Thị Phương', department: 'Phòng HCNS', position: 'Nhân viên tuyển dụng', email: 'phuonght@hobiwood.com', phone: '0917001701', status: 'Đã nghỉ', joinDate: '01/01/2023' } },
  ],
  ghi_chu_chung: [
    {
      id: 'gc-demo-01',
      data: {
        id: 'gc-demo-01',
        key: 'gc-demo-01',
        lines: [
          'Họp giao ban tuần 36: chốt KPI doanh thu TM + tiến độ OEM.',
          'Ưu tiên xử lý công nợ quá hạn > 30 ngày trước thứ 6.',
        ],
        hidden: false,
        createdAt: 1756867200000,
      },
    },
    {
      id: 'gc-demo-02',
      data: {
        id: 'gc-demo-02',
        key: 'gc-demo-02',
        lines: [
          'Nhắc các phòng cập nhật tiến độ CV trước 17:00 thứ 6 hàng tuần.',
          'File mẫu báo cáo tuần nằm trong thư mục dùng chung.',
        ],
        hidden: false,
        createdAt: 1756953600000,
      },
    },
    {
      id: 'gc-demo-03',
      data: {
        id: 'gc-demo-03',
        key: 'gc-demo-03',
        lines: ['Lịch nghỉ lễ 02/09 đã gửi — kiểm tra ca trực nhà máy Wilson.'],
        hidden: false,
        createdAt: 1757040000000,
      },
    },
  ],
  ghi_chu_phong_ban: [
    {
      id: 'gp-demo-01',
      data: {
        id: 'gp-demo-01',
        key: 'gp-demo-01',
        blockKey: 'bld',
        deptKey: 'bld-cong-viec-bld',
        title: '2. CÔNG VIỆC CỦA BLĐ',
        lines: [
          'Chuẩn bị slide họp tháng với chủ đề: công nợ + tồn kho chậm luân chuyển.',
          'Gửi BLĐ danh sách CV quá hạn > 7 ngày trước họp.',
        ],
        hidden: false,
        createdAt: 1756867200000,
      },
    },
    {
      id: 'gp-demo-02',
      data: {
        id: 'gp-demo-02',
        key: 'gp-demo-02',
        blockKey: 'tm',
        deptKey: 'tm-kd-go',
        title: '2. PHÒNG KD HOBI GỖ',
        lines: [
          'Follow-up đại lý miền Trung sau chào hàng SPC tuần 36.',
          'Chốt bảng chiết khấu Oak cho đại lý Hà Nội trước 06/09.',
        ],
        hidden: false,
        createdAt: 1756953600000,
      },
    },
    {
      id: 'gp-demo-03',
      data: {
        id: 'gp-demo-03',
        key: 'gp-demo-03',
        blockKey: 'sx',
        deptKey: 'sx-nm-wilson',
        title: '3. NHÀ MÁY WILSON HB',
        lines: [
          'Kiểm tra tỉ lệ lỗi line A — mục tiêu < 5%.',
          'Báo cáo tồn vật tư chậm luân chuyển kho 2.',
        ],
        hidden: false,
        createdAt: 1757126400000,
      },
    },
    {
      id: 'gp-demo-04',
      data: {
        id: 'gp-demo-04',
        key: 'gp-demo-04',
        blockKey: 'mua',
        deptKey: 'mua-thuong-mai',
        title: '1. MUA THƯƠNG MẠI',
        lines: [
          'So sánh báo giá keo + phụ kiện từ 3 NCC trước thứ 4.',
          'Theo dõi lead time hàng nhập khẩu đang trên đường.',
        ],
        hidden: false,
        createdAt: 1757299200000,
      },
    },
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

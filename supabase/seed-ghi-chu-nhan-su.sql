-- =============================================================================
-- DỮ LIỆU MẪU — phần dưới sidebar: Ghi chú chung / Ghi chú phòng ban / Nhân sự
--
-- Cách chạy:
--   Supabase Dashboard → SQL Editor → dán file → Run
--
-- Id bắt đầu bằng gc-/gp-/ns-demo- để dễ xóa / chạy lại.
-- =============================================================================

-- ---------- Nhân sự ----------
delete from public.nhan_su where id like 'ns-demo-%';

insert into public.nhan_su (id, data, created_at, updated_at) values
(
  'ns-demo-01',
  jsonb_build_object(
    'name', 'Lê Hoàng Tuyển',
    'department', 'Ban Giám Đốc',
    'position', 'Giám đốc',
    'email', 'tuyenlh@hobiwood.com',
    'phone', '0901001001',
    'status', 'Đang làm',
    'joinDate', '01/01/2018'
  ),
  now(), now()
),
(
  'ns-demo-02',
  jsonb_build_object(
    'name', 'Phạm Quốc Bảo',
    'department', 'Ban Lãnh Đạo',
    'position', 'Trợ lý BLĐ',
    'email', 'baopq@hobiwood.com',
    'phone', '0901001002',
    'status', 'Đang làm',
    'joinDate', '15/06/2019'
  ),
  now(), now()
),
(
  'ns-demo-03',
  jsonb_build_object(
    'name', 'Nguyễn Thị Mai',
    'department', 'Phòng HCNS',
    'position', 'Trưởng phòng HCNS',
    'email', 'maint@hobiwood.com',
    'phone', '0902002001',
    'status', 'Đang làm',
    'joinDate', '01/03/2019'
  ),
  now(), now()
),
(
  'ns-demo-04',
  jsonb_build_object(
    'name', 'Nguyễn Văn Minh',
    'department', 'Phòng KD Hobi Gỗ',
    'position', 'Nhân viên KD',
    'email', 'minhnv@hobiwood.com',
    'phone', '0903003001',
    'status', 'Đang làm',
    'joinDate', '10/02/2021'
  ),
  now(), now()
),
(
  'ns-demo-05',
  jsonb_build_object(
    'name', 'Trần Thị Hoa',
    'department', 'Phòng KD Hobi Gỗ',
    'position', 'Nhân viên KD',
    'email', 'hoatt@hobiwood.com',
    'phone', '0903003002',
    'status', 'Đang làm',
    'joinDate', '20/08/2022'
  ),
  now(), now()
),
(
  'ns-demo-06',
  jsonb_build_object(
    'name', 'Lê Quang Huy',
    'department', 'Phòng KD Hobi Gỗ',
    'position', 'Chuyên viên công nợ',
    'email', 'huylq@hobiwood.com',
    'phone', '0903003003',
    'status', 'Đang làm',
    'joinDate', '05/01/2020'
  ),
  now(), now()
),
(
  'ns-demo-07',
  jsonb_build_object(
    'name', 'Đỗ Thị Lan',
    'department', 'Phòng KD Hobi Nhựa',
    'position', 'Nhân viên KD',
    'email', 'landt@hobiwood.com',
    'phone', '0904004001',
    'status', 'Đang làm',
    'joinDate', '12/04/2021'
  ),
  now(), now()
),
(
  'ns-demo-08',
  jsonb_build_object(
    'name', 'Võ Minh Tuấn',
    'department', 'Phòng Xuất khẩu',
    'position', 'Chuyên viên XK',
    'email', 'tuanvm@hobiwood.com',
    'phone', '0905005001',
    'status', 'Đang làm',
    'joinDate', '01/09/2020'
  ),
  now(), now()
),
(
  'ns-demo-09',
  jsonb_build_object(
    'name', 'Hoàng Anh Đức',
    'department', 'Phòng Dự án',
    'position', 'Quản lý dự án',
    'email', 'ducha@hobiwood.com',
    'phone', '0906006001',
    'status', 'Đang làm',
    'joinDate', '18/11/2019'
  ),
  now(), now()
),
(
  'ns-demo-10',
  jsonb_build_object(
    'name', 'Ngô Thị Hạnh',
    'department', 'Chi nhánh HCM',
    'position', 'Trưởng chi nhánh',
    'email', 'hanhnt@hobiwood.com',
    'phone', '0907007001',
    'status', 'Đang làm',
    'joinDate', '01/07/2018'
  ),
  now(), now()
),
(
  'ns-demo-11',
  jsonb_build_object(
    'name', 'Bùi Văn Khoa',
    'department', 'Phòng Marketing',
    'position', 'Content & Brand',
    'email', 'khoabv@hobiwood.com',
    'phone', '0908008001',
    'status', 'Thử việc',
    'joinDate', '01/08/2026'
  ),
  now(), now()
),
(
  'ns-demo-12',
  jsonb_build_object(
    'name', 'Trần Thị Lan',
    'department', 'Phòng Kế toán TM',
    'position', 'Kế toán viên',
    'email', 'lantt@hobiwood.com',
    'phone', '0909009001',
    'status', 'Đang làm',
    'joinDate', '01/06/2021'
  ),
  now(), now()
),
(
  'ns-demo-13',
  jsonb_build_object(
    'name', 'Lý Văn Phong',
    'department', 'Phòng Kho',
    'position', 'Thủ kho',
    'email', 'phonglv@hobiwood.com',
    'phone', '0910001001',
    'status', 'Đang làm',
    'joinDate', '22/02/2020'
  ),
  now(), now()
),
(
  'ns-demo-14',
  jsonb_build_object(
    'name', 'Phan Thị Ngọc',
    'department', 'Phòng KD OEM',
    'position', 'Nhân viên KD OEM',
    'email', 'ngocpt@hobiwood.com',
    'phone', '0911001101',
    'status', 'Đang làm',
    'joinDate', '14/05/2021'
  ),
  now(), now()
),
(
  'ns-demo-15',
  jsonb_build_object(
    'name', 'Đặng Minh Sơn',
    'department', 'Phòng Kế toán Sản xuất',
    'position', 'Kế toán sản xuất',
    'email', 'sondm@hobiwood.com',
    'phone', '0912001201',
    'status', 'Đang làm',
    'joinDate', '03/03/2022'
  ),
  now(), now()
),
(
  'ns-demo-16',
  jsonb_build_object(
    'name', 'Nguyễn Văn Hùng',
    'department', 'Nhà máy Wilson HB',
    'position', 'Quản lý sản xuất',
    'email', 'hungnv@hobiwood.com',
    'phone', '0913001301',
    'status', 'Đang làm',
    'joinDate', '15/03/2020'
  ),
  now(), now()
),
(
  'ns-demo-17',
  jsonb_build_object(
    'name', 'Trịnh Thị Yến',
    'department', 'Mua Thương mại',
    'position', 'Nhân viên mua hàng',
    'email', 'yentt@hobiwood.com',
    'phone', '0914001401',
    'status', 'Đang làm',
    'joinDate', '09/09/2021'
  ),
  now(), now()
),
(
  'ns-demo-18',
  jsonb_build_object(
    'name', 'Cao Đức Thành',
    'department', 'Mua Sản xuất',
    'position', 'Nhân viên mua vật tư',
    'email', 'thanhcd@hobiwood.com',
    'phone', '0915001501',
    'status', 'Nghỉ phép',
    'joinDate', '11/11/2020'
  ),
  now(), now()
),
(
  'ns-demo-19',
  jsonb_build_object(
    'name', 'Mai Văn Cường',
    'department', 'Nhà máy Wilson HB',
    'position', 'Tổ trưởng ca',
    'email', 'cuongmv@hobiwood.com',
    'phone', '0916001601',
    'status', 'Đang làm',
    'joinDate', '01/04/2019'
  ),
  now(), now()
),
(
  'ns-demo-20',
  jsonb_build_object(
    'name', 'Hà Thị Phương',
    'department', 'Phòng HCNS',
    'position', 'Nhân viên tuyển dụng',
    'email', 'phuonght@hobiwood.com',
    'phone', '0917001701',
    'status', 'Đã nghỉ',
    'joinDate', '01/01/2023'
  ),
  now(), now()
);

-- ---------- Ghi chú chung ----------
delete from public.ghi_chu_chung where id like 'gc-demo-%';

insert into public.ghi_chu_chung (id, data, created_at, updated_at) values
(
  'gc-demo-01',
  jsonb_build_object(
    'id', 'gc-demo-01',
    'key', 'gc-demo-01',
    'lines', jsonb_build_array(
      'Họp giao ban tuần 36: chốt KPI doanh thu TM + tiến độ OEM.',
      'Ưu tiên xử lý công nợ quá hạn > 30 ngày trước thứ 6.'
    ),
    'hidden', false,
    'createdAt', 1756867200000
  ),
  now(), now()
),
(
  'gc-demo-02',
  jsonb_build_object(
    'id', 'gc-demo-02',
    'key', 'gc-demo-02',
    'lines', jsonb_build_array(
      'Nhắc các phòng cập nhật tiến độ CV trước 17:00 thứ 6 hàng tuần.',
      'File mẫu báo cáo tuần nằm trong thư mục dùng chung.'
    ),
    'hidden', false,
    'createdAt', 1756953600000
  ),
  now(), now()
),
(
  'gc-demo-03',
  jsonb_build_object(
    'id', 'gc-demo-03',
    'key', 'gc-demo-03',
    'lines', jsonb_build_array(
      'Lịch nghỉ lễ 02/09 đã gửi — kiểm tra ca trực nhà máy Wilson.'
    ),
    'hidden', false,
    'createdAt', 1757040000000
  ),
  now(), now()
),
(
  'gc-demo-04',
  jsonb_build_object(
    'id', 'gc-demo-04',
    'key', 'gc-demo-04',
    'lines', jsonb_build_array(
      '(Ẩn) Draft: nội dung thông báo nội bộ quý 4 — chưa phát hành.'
    ),
    'hidden', true,
    'createdAt', 1757126400000
  ),
  now(), now()
);

-- ---------- Ghi chú phòng ban ----------
delete from public.ghi_chu_phong_ban where id like 'gp-demo-%';

insert into public.ghi_chu_phong_ban (id, data, created_at, updated_at) values
(
  'gp-demo-01',
  jsonb_build_object(
    'id', 'gp-demo-01',
    'key', 'gp-demo-01',
    'blockKey', 'bld',
    'deptKey', 'bld-cong-viec-bld',
    'title', '2. CÔNG VIỆC CỦA BLĐ',
    'lines', jsonb_build_array(
      'Chuẩn bị slide họp tháng với chủ đề: công nợ + tồn kho chậm luân chuyển.',
      'Gửi BLĐ danh sách CV quá hạn > 7 ngày trước họp.'
    ),
    'hidden', false,
    'createdAt', 1756867200000
  ),
  now(), now()
),
(
  'gp-demo-02',
  jsonb_build_object(
    'id', 'gp-demo-02',
    'key', 'gp-demo-02',
    'blockKey', 'tm',
    'deptKey', 'tm-kd-go',
    'title', '2. PHÒNG KD HOBI GỖ',
    'lines', jsonb_build_array(
      'Follow-up đại lý miền Trung sau chào hàng SPC tuần 36.',
      'Chốt bảng chiết khấu Oak cho đại lý Hà Nội trước 06/09.'
    ),
    'hidden', false,
    'createdAt', 1756953600000
  ),
  now(), now()
),
(
  'gp-demo-03',
  jsonb_build_object(
    'id', 'gp-demo-03',
    'key', 'gp-demo-03',
    'blockKey', 'tm',
    'deptKey', 'tm-hcns',
    'title', '1. PHÒNG HCNS',
    'lines', jsonb_build_array(
      'Cập nhật hồ sơ nhân sự mới (Marketing — Bùi Văn Khoa).',
      'Nhắc ký hợp đồng thử việc trong tuần.'
    ),
    'hidden', false,
    'createdAt', 1757040000000
  ),
  now(), now()
),
(
  'gp-demo-04',
  jsonb_build_object(
    'id', 'gp-demo-04',
    'key', 'gp-demo-04',
    'blockKey', 'sx',
    'deptKey', 'sx-nm-wilson',
    'title', '3. NHÀ MÁY WILSON HB',
    'lines', jsonb_build_array(
      'Kiểm tra tỉ lệ lỗi line A — mục tiêu < 5%.',
      'Báo cáo tồn vật tư chậm luân chuyển kho 2.'
    ),
    'hidden', false,
    'createdAt', 1757126400000
  ),
  now(), now()
),
(
  'gp-demo-05',
  jsonb_build_object(
    'id', 'gp-demo-05',
    'key', 'gp-demo-05',
    'blockKey', 'sx',
    'deptKey', 'sx-kd-oem',
    'title', '1. PHÒNG KD OEM',
    'lines', jsonb_build_array(
      'Đối soát đơn OEM tuần này với Kế toán SX.',
      'Lên lịch thăm khách OEM miền Bắc tuần 37.'
    ),
    'hidden', false,
    'createdAt', 1757212800000
  ),
  now(), now()
),
(
  'gp-demo-06',
  jsonb_build_object(
    'id', 'gp-demo-06',
    'key', 'gp-demo-06',
    'blockKey', 'mua',
    'deptKey', 'mua-thuong-mai',
    'title', '1. MUA THƯƠNG MẠI',
    'lines', jsonb_build_array(
      'So sánh báo giá keo + phụ kiện từ 3 NCC trước thứ 4.',
      'Theo dõi lead time hàng nhập khẩu đang trên đường.'
    ),
    'hidden', false,
    'createdAt', 1757299200000
  ),
  now(), now()
),
(
  'gp-demo-07',
  jsonb_build_object(
    'id', 'gp-demo-07',
    'key', 'gp-demo-07',
    'blockKey', 'mua',
    'deptKey', 'mua-san-xuat',
    'title', '2. MUA SẢN XUẤT',
    'lines', jsonb_build_array(
      'Đặt gỗ nguyên liệu cho đơn OEM tuần 38.',
      'Xác nhận lịch giao với NCC nội địa.'
    ),
    'hidden', false,
    'createdAt', 1757385600000
  ),
  now(), now()
),
(
  'gp-demo-08',
  jsonb_build_object(
    'id', 'gp-demo-08',
    'key', 'gp-demo-08',
    'blockKey', 'tm',
    'deptKey', 'tm-ke-toan',
    'title', '8. PHÒNG KẾ TOÁN TM',
    'lines', jsonb_build_array(
      'Đối soát công nợ đại lý TM trước ngày 10 hàng tháng.'
    ),
    'hidden', false,
    'createdAt', 1757472000000
  ),
  now(), now()
);

notify pgrst, 'reload schema';

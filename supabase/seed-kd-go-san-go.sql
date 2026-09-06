-- =============================================================================
-- DỮ LIỆU MẪU — PHÒNG KD HOBI GỖ (bảng ii_2 = II.2)
-- Chủ đề: Kinh doanh sàn gỗ — các tình huống thường gặp
--
-- Cách chạy:
--   Supabase Dashboard → SQL Editor → dán file → Run
--
-- Gốc thời gian mẫu: 05/09/2026 (có thể sửa ngày trong JSON nếu cần).
-- tt bắt đầu bằng "sg-" để dễ xóa / chạy lại idempotent.
-- =============================================================================

-- Xóa bản seed cũ (nếu chạy lại)
delete from public.ii_2 where tt like 'sg-%';

insert into public.ii_2 (tt, data, created_at, updated_at) values

-- 1) Đang làm — hạn còn xa, tiến độ thấp (chào hàng dự án)
(
  'sg-01',
  jsonb_build_object(
    'TT', '1',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Chào hàng sàn gỗ công trình chung cư Green Park (SPC 8mm, ~2.500m²)',
    'NGƯỜI ĐƯỢC GIAO', 'Nguyễn Văn Minh',
    'NGÀY GIAO', '25/08/2026',
    'Y/C XONG', '30/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 25,
    'KẾT QUẢ', 'Đã gửi catalogue + bảng giá sơ bộ; chờ CĐT phản hồi',
    'LINK KQ', '',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '3',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 2) Đang làm — gần hạn (báo giá đại lý)
(
  'sg-02',
  jsonb_build_object(
    'TT', '2',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Làm báo giá sàn gỗ tự nhiên Oak cho đại lý Hà Nội (khoảng 180m²)',
    'NGƯỜI ĐƯỢC GIAO', 'Trần Thị Hoa',
    'NGÀY GIAO', '01/09/2026',
    'Y/C XONG', '06/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 70,
    'KẾT QUẢ', 'Đã chốt chủng loại; đang hoàn thiện chiết khấu bậc thang',
    'LINK KQ', '',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '4',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 3) Quá hạn — công nợ đại lý, cần lãnh đạo tác động
(
  'sg-03',
  jsonb_build_object(
    'TT', '3',
    'Kỳ báo cáo', 'Tuần 35/2026',
    'CÔNG VIỆC', 'Thu hồi công nợ đại lý miền Trung — đơn sàn SPC tháng 7 (còn ~185 triệu)',
    'NGƯỜI ĐƯỢC GIAO', 'Lê Quang Huy',
    'NGÀY GIAO', '10/08/2026',
    'Y/C XONG', '28/08/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Quá hạn',
    'TIẾN ĐỘ CV', 40,
    'KẾT QUẢ', 'Đã gọi 3 lần; đại lý xin giãn đến cuối tháng 9',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Đại lý chậm thanh toán; đề xuất tạm dừng giao hàng mới',
    'CẦN LĐ TÁC ĐỘNG', 'Có',
    'MỨC ẢNH HƯỞNG', '5',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 4) Hoàn thành đúng hạn — chốt đơn
(
  'sg-04',
  jsonb_build_object(
    'TT', '4',
    'Kỳ báo cáo', 'Tuần 34/2026',
    'CÔNG VIỆC', 'Chốt đơn sàn gỗ tự nhiên Walnut 500m² — công trình villa Quận 7',
    'NGƯỜI ĐƯỢC GIAO', 'Phạm Anh Tuấn',
    'NGÀY GIAO', '05/08/2026',
    'Y/C XONG', '20/08/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Hoàn thành',
    'TIẾN ĐỘ CV', 100,
    'KẾT QUẢ', 'Đã ký HĐ + thu cọc 30%; giao hàng tuần 35',
    'LINK KQ', 'https://drive.google.com/file/d/mau-hd-villa-q7',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '4',
    'Ngày hoàn thành', '19/08/2026 16:30:00'
  ),
  now(), now()
),

-- 5) Đang làm — đã gia hạn 1 lần (giao hàng công trình)
(
  'sg-05',
  jsonb_build_object(
    'TT', '5',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Điều phối giao + giám sát thi công sàn SPC showroom đại lý Đà Nẵng',
    'NGƯỜI ĐƯỢC GIAO', 'Nguyễn Văn Minh',
    'NGÀY GIAO', '15/08/2026',
    'Y/C XONG', '01/09/2026',
    'GIA HẠN 1', '12/09/2026',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 55,
    'KẾT QUẢ', 'Hàng đã về kho ĐN; thợ đang lát tầng 1',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Công trình chậm mặt bằng 5 ngày → đã gia hạn lần 1',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '3',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 6) Quá hạn + vướng mắc kỹ thuật (khiếu nại cong vênh)
(
  'sg-06',
  jsonb_build_object(
    'TT', '6',
    'Kỳ báo cáo', 'Tuần 35/2026',
    'CÔNG VIỆC', 'Xử lý khiếu nại cong vênh sàn gỗ tự nhiên — căn hộ Masteri Thảo Điền (~45m²)',
    'NGƯỜI ĐƯỢC GIAO', 'Trần Thị Hoa',
    'NGÀY GIAO', '18/08/2026',
    'Y/C XONG', '30/08/2026',
    'GIA HẠN 1', '03/09/2026',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Quá hạn',
    'TIẾN ĐỘ CV', 60,
    'KẾT QUẢ', 'Đã khảo sát hiện trường; chờ QC xác nhận đổi hàng',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Nghi ngờ độ ẩm nền > chuẩn; QC chưa chốt trách nhiệm NCC/thi công',
    'CẦN LĐ TÁC ĐỘNG', 'Có',
    'MỨC ẢNH HƯỞNG', '5',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 7) Đang làm — chương trình khuyến mãi
(
  'sg-07',
  jsonb_build_object(
    'TT', '7',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Triển khai CTKM tháng 9: mua 50m² sàn SPC tặng phụ kiện lắp đặt',
    'NGƯỜI ĐƯỢC GIAO', 'Hoàng Thị Mai',
    'NGÀY GIAO', '28/08/2026',
    'Y/C XONG', '15/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 45,
    'KẾT QUẢ', 'Đã chốt cơ chế CK; đang làm poster + gửi NPP',
    'LINK KQ', '',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '2',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 8) Hoàn thành — khảo sát đối thủ
(
  'sg-08',
  jsonb_build_object(
    'TT', '8',
    'Kỳ báo cáo', 'Tuần 33/2026',
    'CÔNG VIỆC', 'Khảo sát giá sàn SPC/WPC của 5 đối thủ tại thị trường HCM',
    'NGƯỜI ĐƯỢC GIAO', 'Lê Quang Huy',
    'NGÀY GIAO', '01/08/2026',
    'Y/C XONG', '12/08/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Hoàn thành',
    'TIẾN ĐỘ CV', 100,
    'KẾT QUẢ', 'Bảng so sánh giá + điểm mạnh/yếu đã gửi BLĐ',
    'LINK KQ', 'https://drive.google.com/file/d/mau-doi-thu-spc-hcm',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '3',
    'Ngày hoàn thành', '11/08/2026 10:15:00'
  ),
  now(), now()
),

-- 9) Hoàn thành sau gia hạn 1 — đào tạo đại lý
(
  'sg-09',
  jsonb_build_object(
    'TT', '9',
    'Kỳ báo cáo', 'Tuần 34/2026',
    'CÔNG VIỆC', 'Đào tạo kỹ thuật thi công sàn gỗ cho đội thợ đại lý Cần Thơ',
    'NGƯỜI ĐƯỢC GIAO', 'Phạm Anh Tuấn',
    'NGÀY GIAO', '05/08/2026',
    'Y/C XONG', '18/08/2026',
    'GIA HẠN 1', '25/08/2026',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Hoàn thành gia hạn 1',
    'TIẾN ĐỘ CV', 100,
    'KẾT QUẢ', 'Đã đào tạo 8 thợ; checklist nghiệm thu đã bàn giao',
    'LINK KQ', 'https://drive.google.com/file/d/mau-checklist-thi-cong',
    'VƯỚNG MẮC', 'Đại lý dời lịch vì mưa lớn → gia hạn lần 1',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '2',
    'Ngày hoàn thành', '24/08/2026 17:00:00'
  ),
  now(), now()
),

-- 10) Quá hạn sau 2 lần gia hạn — tồn kho mẫu showroom
(
  'sg-10',
  jsonb_build_object(
    'TT', '10',
    'Kỳ báo cáo', 'Tuần 35/2026',
    'CÔNG VIỆC', 'Rà soát & bổ sung mẫu sàn showroom HCM (Oak / Walnut / SPC stone)',
    'NGƯỜI ĐƯỢC GIAO', 'Hoàng Thị Mai',
    'NGÀY GIAO', '20/07/2026',
    'Y/C XONG', '05/08/2026',
    'GIA HẠN 1', '15/08/2026',
    'GIA HẠN 2', '28/08/2026',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Quá hạn',
    'TIẾN ĐỘ CV', 75,
    'KẾT QUẢ', 'Đã đặt mẫu Oak/Walnut; SPC stone chậm từ kho NM',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Nhà máy chưa xuất mẫu SPC stone — cần đẩy sản xuất',
    'CẦN LĐ TÁC ĐỘNG', 'Có',
    'MỨC ẢNH HƯỞNG', '3',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 11) Đang làm — mở đại lý mới / hợp đồng khung
(
  'sg-11',
  jsonb_build_object(
    'TT', '11',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Soạn & đàm phán hợp đồng khung NPP khu vực miền Trung (sàn gỗ + phụ kiện)',
    'NGƯỜI ĐƯỢC GIAO', 'Nguyễn Văn Minh',
    'NGÀY GIAO', '22/08/2026',
    'Y/C XONG', '20/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 35,
    'KẾT QUẢ', 'Draft HĐ đã gửi pháp chế; đang thương lượng mức tồn tối thiểu',
    'LINK KQ', '',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '4',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 12) Đang làm với gia hạn 2 — hỗ trợ layout showroom
(
  'sg-12',
  jsonb_build_object(
    'TT', '12',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Hỗ trợ thiết kế layout display sàn gỗ cho showroom đại lý mới (Bình Dương)',
    'NGƯỜI ĐƯỢC GIAO', 'Trần Thị Hoa',
    'NGÀY GIAO', '10/08/2026',
    'Y/C XONG', '22/08/2026',
    'GIA HẠN 1', '29/08/2026',
    'GIA HẠN 2', '10/09/2026',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 80,
    'KẾT QUẢ', 'Phương án 2 đã duyệt; đang in standee + bảng giá',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Đại lý đổi mặt bằng → gia hạn lần 2',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '2',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 13) Hoàn thành gia hạn 2 — tái ký đại lý
(
  'sg-13',
  jsonb_build_object(
    'TT', '13',
    'Kỳ báo cáo', 'Tuần 32/2026',
    'CÔNG VIỆC', 'Tái ký hợp đồng đại lý năm 2026–2027 — khu vực Đồng Nai',
    'NGƯỜI ĐƯỢC GIAO', 'Lê Quang Huy',
    'NGÀY GIAO', '15/07/2026',
    'Y/C XONG', '31/07/2026',
    'GIA HẠN 1', '10/08/2026',
    'GIA HẠN 2', '20/08/2026',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Hoàn thành gia hạn 2',
    'TIẾN ĐỘ CV', 100,
    'KẾT QUẢ', 'Đã ký; chỉ tiêu doanh số quý 4: 1,2 tỷ',
    'LINK KQ', 'https://drive.google.com/file/d/mau-hd-daily-dong-nai',
    'VƯỚNG MẮC', 'Thương lượng chiết khấu kéo dài 2 vòng',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '4',
    'Ngày hoàn thành', '19/08/2026 11:20:00'
  ),
  now(), now()
),

-- 14) Đang làm — chăm sóc khách hàng lớn / upsell
(
  'sg-14',
  jsonb_build_object(
    'TT', '14',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Upsell sàn gỗ phòng ngủ + phụ kiện len chân tường cho KH dự án Imperia',
    'NGƯỜI ĐƯỢC GIAO', 'Phạm Anh Tuấn',
    'NGÀY GIAO', '02/09/2026',
    'Y/C XONG', '25/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Đang làm',
    'TIẾN ĐỘ CV', 20,
    'KẾT QUẢ', 'Đã hẹn khảo sát tại công trình ngày 08/09',
    'LINK KQ', '',
    'VƯỚNG MẮC', '',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '3',
    'Ngày hoàn thành', ''
  ),
  now(), now()
),

-- 15) Quá hạn hôm nay (hạn = 05/09/2026) — báo cáo doanh số tuần
(
  'sg-15',
  jsonb_build_object(
    'TT', '15',
    'Kỳ báo cáo', 'Tuần 36/2026',
    'CÔNG VIỆC', 'Nộp báo cáo doanh số sàn gỗ tuần 35 (theo kênh đại lý / dự án / bán lẻ)',
    'NGƯỜI ĐƯỢC GIAO', 'Hoàng Thị Mai',
    'NGÀY GIAO', '01/09/2026',
    'Y/C XONG', '04/09/2026',
    'GIA HẠN 1', '',
    'GIA HẠN 2', '',
    'GIA HẠN 3', '',
    'TIẾN ĐỘ', 'Quá hạn',
    'TIẾN ĐỘ CV', 90,
    'KẾT QUẢ', 'Thiếu số liệu kênh bán lẻ showroom — đang chờ kế toán TM',
    'LINK KQ', '',
    'VƯỚNG MẮC', 'Kế toán TM chưa chốt số bán lẻ tuần 35',
    'CẦN LĐ TÁC ĐỘNG', 'Không',
    'MỨC ẢNH HƯỞNG', '2',
    'Ngày hoàn thành', ''
  ),
  now(), now()
);

-- Kiểm tra nhanh
-- select tt, data->>'CÔNG VIỆC' as cong_viec, data->>'TIẾN ĐỘ' as tien_do, data->>'Y/C XONG' as deadline
-- from public.ii_2
-- where tt like 'sg-%'
-- order by tt;

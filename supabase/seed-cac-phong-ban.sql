-- =============================================================================
-- DỮ LIỆU MẪU CÔNG VIỆC — các phòng ban (trừ II.2 KD Gỗ đã có seed-kd-go-san-go.sql)
--
-- Cách chạy:
--   Supabase Dashboard → SQL Editor → dán file → Run
--
-- Prefix tt: demo-* để xóa / chạy lại idempotent.
-- Gốc thời gian mẫu: tuần 36/2026 (~05/09/2026).
-- =============================================================================

-- ========== I.1 CÔNG VIỆC CÁ NHÂN ==========
delete from public.i_1 where tt like 'demo-%';
insert into public.i_1 (tt, data, created_at, updated_at) values
('demo-i1-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Soạn kế hoạch công việc cá nhân tuần 36–37',
  'NGƯỜI ĐƯỢC GIAO','Phạm Quốc Bảo','NGÀY GIAO','01/09/2026','Y/C XONG','06/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',60,'KẾT QUẢ','Đã liệt kê 8 đầu việc ưu tiên',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now()),
('demo-i1-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Cập nhật hồ sơ KPI cá nhân quý 3',
  'NGƯỜI ĐƯỢC GIAO','Lê Hoàng Tuyển','NGÀY GIAO','20/08/2026','Y/C XONG','31/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã nộp lên BLĐ',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','30/08/2026 15:00:00'
), now(), now()),
('demo-i1-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đọc và phản hồi email đối tác chiến lược trong tuần',
  'NGƯỜI ĐƯỢC GIAO','Phạm Quốc Bảo','NGÀY GIAO','02/09/2026','Y/C XONG','05/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',40,'KẾT QUẢ','Còn 3 email chưa trả lời',
  'LINK KQ','','VƯỚNG MẮC','Bận họp đột xuất','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now()),
('demo-i1-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Chuẩn bị nội dung phát biểu họp giao ban tháng 9',
  'NGƯỜI ĐƯỢC GIAO','Lê Hoàng Tuyển','NGÀY GIAO','03/09/2026','Y/C XONG','12/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',25,'KẾT QUẢ','Đã outline 4 điểm chính',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== I.2 CÔNG VIỆC CỦA BLĐ ==========
delete from public.i_2 where tt like 'demo-%';
insert into public.i_2 (tt, data, created_at, updated_at) values
('demo-i2-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Họp BLĐ — rà soát công nợ TM + OEM quá hạn > 30 ngày',
  'NGƯỜI ĐƯỢC GIAO','Lê Hoàng Tuyển','NGÀY GIAO','28/08/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',50,'KẾT QUẢ','Đã có danh sách sơ bộ từ KT TM',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-i2-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Phê duyệt ngân sách marketing quý 4/2026',
  'NGƯỜI ĐƯỢC GIAO','Lê Hoàng Tuyển','NGÀY GIAO','15/08/2026','Y/C XONG','30/08/2026',
  'GIA HẠN 1','05/09/2026','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',70,'KẾT QUẢ','Đang chờ điều chỉnh đề xuất từ Marketing',
  'LINK KQ','','VƯỚNG MẮC','Số liệu ROI chưa đủ','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-i2-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Ký quyết định bổ nhiệm tổ trưởng ca NM Wilson',
  'NGƯỜI ĐƯỢC GIAO','Phạm Quốc Bảo','NGÀY GIAO','01/08/2026','Y/C XONG','20/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã ban hành QD ngày 18/08',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','18/08/2026 11:00:00'
), now(), now()),
('demo-i2-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đánh giá tiến độ dự án showroom miền Bắc',
  'NGƯỜI ĐƯỢC GIAO','Hoàng Anh Đức','NGÀY GIAO','01/09/2026','Y/C XONG','08/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',35,'KẾT QUẢ','Đã nhận báo cáo tuần từ phòng Dự án',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now());

-- ========== II.1 PHÒNG HCNS ==========
delete from public.ii_1 where tt like 'demo-%';
insert into public.ii_1 (tt, data, created_at, updated_at) values
('demo-hc-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Tuyển dụng Content & Brand — hoàn tất hồ sơ thử việc',
  'NGƯỜI ĐƯỢC GIAO','Nguyễn Thị Mai','NGÀY GIAO','25/08/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',80,'KẾT QUẢ','Đã ký HĐ thử việc Bùi Văn Khoa',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-hc-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Chấm công + tính lương tháng 8/2026',
  'NGƯỜI ĐƯỢC GIAO','Nguyễn Thị Mai','NGÀY GIAO','01/09/2026','Y/C XONG','05/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',85,'KẾT QUẢ','Thiếu bảng chấm công NM Wilson ca đêm',
  'LINK KQ','','VƯỚNG MẮC','Nhà máy chưa gửi file ca đêm','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-hc-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Tổ chức đào tạo an toàn lao động cho nhân viên mới',
  'NGƯỜI ĐƯỢC GIAO','Hà Thị Phương','NGÀY GIAO','05/08/2026','Y/C XONG','25/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','12 NV đã ký biên bản tham dự',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành','22/08/2026 16:00:00'
), now(), now()),
('demo-hc-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Cập nhật nội quy lao động phiên bản 2026',
  'NGƯỜI ĐƯỢC GIAO','Nguyễn Thị Mai','NGÀY GIAO','02/09/2026','Y/C XONG','30/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',20,'KẾT QUẢ','Đang lấy ý kiến các trưởng phòng',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== II.3 PHÒNG KD HOBI NHỰA ==========
delete from public.ii_3 where tt like 'demo-%';
insert into public.ii_3 (tt, data, created_at, updated_at) values
('demo-nh-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Chào hàng tấm nhựa PVC tường — công trình văn phòng Cầu Giấy',
  'NGƯỜI ĐƯỢC GIAO','Đỗ Thị Lan','NGÀY GIAO','28/08/2026','Y/C XONG','15/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',40,'KẾT QUẢ','Đã gửi catalogue + mẫu vật',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-nh-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Thu hồi công nợ đại lý nhựa miền Tây (~95 triệu)',
  'NGƯỜI ĐƯỢC GIAO','Đỗ Thị Lan','NGÀY GIAO','10/08/2026','Y/C XONG','31/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',50,'KẾT QUẢ','Đại lý xin giãn đến 15/09',
  'LINK KQ','','VƯỚNG MẮC','Cần BLĐ hỗ trợ đàm phán','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-nh-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Chốt đơn tấm nhựa ngoài trời 1.200m² — dự án resort Phú Quốc',
  'NGƯỜI ĐƯỢC GIAO','Đỗ Thị Lan','NGÀY GIAO','01/08/2026','Y/C XONG','22/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã ký HĐ + thu cọc 20%',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành','20/08/2026 14:20:00'
), now(), now()),
('demo-nh-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Làm bảng giá nhựa WPC quý 4 gửi NPP',
  'NGƯỜI ĐƯỢC GIAO','Đỗ Thị Lan','NGÀY GIAO','03/09/2026','Y/C XONG','20/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',15,'KẾT QUẢ','Đang chờ giá vốn từ Mua SX',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== II.4 PHÒNG XUẤT KHẨU ==========
delete from public.ii_4 where tt like 'demo-%';
insert into public.ii_4 (tt, data, created_at, updated_at) values
('demo-xk-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Làm bộ chứng từ CO + packing list đơn hàng Nhật Bản #JP-0926',
  'NGƯỜI ĐƯỢC GIAO','Võ Minh Tuấn','NGÀY GIAO','01/09/2026','Y/C XONG','08/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',55,'KẾT QUẢ','CO đang chờ phòng ban cấp',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-xk-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Book tàu container 40HC đi Australia — ETD tuần 36',
  'NGƯỜI ĐƯỢC GIAO','Võ Minh Tuấn','NGÀY GIAO','20/08/2026','Y/C XONG','02/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',70,'KẾT QUẢ','Forwarder báo delay chỗ trống',
  'LINK KQ','','VƯỚNG MẮC','Cảng tắc — cần đổi lịch ETD','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-xk-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 33/2026',
  'CÔNG VIỆC','Chốt hợp đồng OEM xuất khẩu Hàn Quốc — 3 container SPC',
  'NGƯỜI ĐƯỢC GIAO','Võ Minh Tuấn','NGÀY GIAO','25/07/2026','Y/C XONG','15/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','LC đã mở; sản xuất đang chạy',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành','14/08/2026 10:00:00'
), now(), now()),
('demo-xk-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Cập nhật leadtime & Incoterms catalogue XK 2026',
  'NGƯỜI ĐƯỢC GIAO','Võ Minh Tuấn','NGÀY GIAO','04/09/2026','Y/C XONG','25/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',10,'KẾT QUẢ','Đang tổng hợp từ logistics',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now());

-- ========== II.5 PHÒNG DỰ ÁN ==========
delete from public.ii_5 where tt like 'demo-%';
insert into public.ii_5 (tt, data, created_at, updated_at) values
('demo-da-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Khảo sát + báo giá dự án chung cư Skyline — sàn gỗ ~8.000m²',
  'NGƯỜI ĐƯỢC GIAO','Hoàng Anh Đức','NGÀY GIAO','20/08/2026','Y/C XONG','15/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',45,'KẾT QUẢ','Đã khảo sát 2 tháp; đang làm BOQ',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-da-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Theo dõi tiến độ thi công showroom đại lý Hải Phòng',
  'NGƯỜI ĐƯỢC GIAO','Hoàng Anh Đức','NGÀY GIAO','05/08/2026','Y/C XONG','28/08/2026',
  'GIA HẠN 1','10/09/2026','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',65,'KẾT QUẢ','Hoàn thiện 70% nội thất',
  'LINK KQ','','VƯỚNG MẮC','Chậm vật liệu kính','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-da-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 32/2026',
  'CÔNG VIỆC','Nghiệm thu hạng mục sàn gỗ dự án biệt thự Vinhomes',
  'NGƯỜI ĐƯỢC GIAO','Hoàng Anh Đức','NGÀY GIAO','10/07/2026','Y/C XONG','05/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Biên bản NT đã ký',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành','04/08/2026 09:30:00'
), now(), now()),
('demo-da-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Lập timeline dự án showroom miền Bắc gửi BLĐ',
  'NGƯỜI ĐƯỢC GIAO','Hoàng Anh Đức','NGÀY GIAO','02/09/2026','Y/C XONG','07/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',30,'KẾT QUẢ','Draft Gantt đã có',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== II.6 CHI NHÁNH HCM ==========
delete from public.ii_6 where tt like 'demo-%';
insert into public.ii_6 (tt, data, created_at, updated_at) values
('demo-hcm-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Chăm sóc 15 đại lý trọng điểm khu vực HCM — tuần 36',
  'NGƯỜI ĐƯỢC GIAO','Ngô Thị Hạnh','NGÀY GIAO','01/09/2026','Y/C XONG','07/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',50,'KẾT QUẢ','Đã thăm 8/15 đại lý',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-hcm-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Giải quyết khiếu nại giao hàng trễ đại lý Quận 7',
  'NGƯỜI ĐƯỢC GIAO','Ngô Thị Hạnh','NGÀY GIAO','22/08/2026','Y/C XONG','30/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',75,'KẾT QUẢ','Đã giao bù; chờ xác nhận hài lòng',
  'LINK KQ','','VƯỚNG MẮC','Kho HCM thiếu 1 mã SPC','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-hcm-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Tổ chức hội thảo sản phẩm sàn gỗ cho kiến trúc sư HCM',
  'NGƯỜI ĐƯỢC GIAO','Ngô Thị Hạnh','NGÀY GIAO','01/08/2026','Y/C XONG','25/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','42 khách tham dự; 6 lead mới',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','24/08/2026 18:00:00'
), now(), now()),
('demo-hcm-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Báo cáo doanh số chi nhánh HCM tháng 8',
  'NGƯỜI ĐƯỢC GIAO','Ngô Thị Hạnh','NGÀY GIAO','02/09/2026','Y/C XONG','06/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',60,'KẾT QUẢ','Đang đối chiếu với KT TM',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== II.7 PHÒNG MARKETING ==========
delete from public.ii_7 where tt like 'demo-%';
insert into public.ii_7 (tt, data, created_at, updated_at) values
('demo-mkt-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Ra mắt chiến dịch FB/TikTok CTKM sàn SPC tháng 9',
  'NGƯỜI ĐƯỢC GIAO','Bùi Văn Khoa','NGÀY GIAO','28/08/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',55,'KẾT QUẢ','Đã duyệt creative; đang set ads',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-mkt-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Thiết kế poster + catalogue CTKM tặng phụ kiện',
  'NGƯỜI ĐƯỢC GIAO','Bùi Văn Khoa','NGÀY GIAO','15/08/2026','Y/C XONG','01/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','File đã gửi KD Gỗ & NPP',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành','31/08/2026 17:00:00'
), now(), now()),
('demo-mkt-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Lập đề xuất ngân sách marketing quý 4 gửi BLĐ',
  'NGƯỜI ĐƯỢC GIAO','Bùi Văn Khoa','NGÀY GIAO','01/09/2026','Y/C XONG','12/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',40,'KẾT QUẢ','Đang hoàn thiện bảng ROI',
  'LINK KQ','','VƯỚNG MẮC','Chờ số liệu bán hàng từ KD','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-mkt-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Chụp ảnh sản phẩm mới WPC cho website',
  'NGƯỜI ĐƯỢC GIAO','Bùi Văn Khoa','NGÀY GIAO','05/08/2026','Y/C XONG','20/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','48 ảnh đã lên CDN',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành','19/08/2026 11:00:00'
), now(), now());

-- ========== II.8 PHÒNG KẾ TOÁN TM ==========
delete from public.ii_8 where tt like 'demo-%';
insert into public.ii_8 (tt, data, created_at, updated_at) values
('demo-kt-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đối soát công nợ đại lý TM đến 31/08/2026',
  'NGƯỜI ĐƯỢC GIAO','Trần Thị Lan','NGÀY GIAO','01/09/2026','Y/C XONG','08/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',55,'KẾT QUẢ','Đã xong nhóm đại lý miền Bắc',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-kt-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Xuất hóa đơn VAT lô hàng showroom Đà Nẵng',
  'NGƯỜI ĐƯỢC GIAO','Trần Thị Lan','NGÀY GIAO','25/08/2026','Y/C XONG','02/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',80,'KẾT QUẢ','Chờ MST / địa chỉ xuất HĐ từ đại lý',
  'LINK KQ','','VƯỚNG MẮC','Đại lý chưa gửi đủ thông tin','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-kt-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Khóa sổ doanh thu TM tháng 7/2026',
  'NGƯỜI ĐƯỢC GIAO','Trần Thị Lan','NGÀY GIAO','01/08/2026','Y/C XONG','10/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã gửi BLĐ báo cáo tháng 7',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành','09/08/2026 16:45:00'
), now(), now()),
('demo-kt-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đối chiếu số bán lẻ showroom tuần 35 cho KD Gỗ',
  'NGƯỜI ĐƯỢC GIAO','Trần Thị Lan','NGÀY GIAO','02/09/2026','Y/C XONG','05/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',70,'KẾT QUẢ','Còn lệch 2 đơn POS',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now());

-- ========== II.9 PHÒNG KHO ==========
delete from public.ii_9 where tt like 'demo-%';
insert into public.ii_9 (tt, data, created_at, updated_at) values
('demo-kho-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Kiểm kê tồn kho SPC/WPC kho trung tâm tuần 36',
  'NGƯỜI ĐƯỢC GIAO','Lý Văn Phong','NGÀY GIAO','01/09/2026','Y/C XONG','07/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',40,'KẾT QUẢ','Đã kiểm khu A–B',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-kho-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Xuất kho giao đại lý Đà Nẵng — đơn SPC showroom',
  'NGƯỜI ĐƯỢC GIAO','Lý Văn Phong','NGÀY GIAO','20/08/2026','Y/C XONG','28/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã xuất đủ + bàn giao vận chuyển',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','27/08/2026 14:00:00'
), now(), now()),
('demo-kho-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Báo cáo vật tư chậm luân chuyển > 90 ngày',
  'NGƯỜI ĐƯỢC GIAO','Lý Văn Phong','NGÀY GIAO','28/08/2026','Y/C XONG','05/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',60,'KẾT QUẢ','Đang lọc mã lỗi hệ thống',
  'LINK KQ','','VƯỚNG MẮC','Phần mềm kho lệch số','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-kho-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Sắp xếp lại khu lưu mẫu sản phẩm showroom',
  'NGƯỜI ĐƯỢC GIAO','Lý Văn Phong','NGÀY GIAO','03/09/2026','Y/C XONG','20/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',15,'KẾT QUẢ','Đã mua kệ mới',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','1','Ngày hoàn thành',''
), now(), now());

-- ========== III.1 PHÒNG KD OEM ==========
delete from public.iii_1 where tt like 'demo-%';
insert into public.iii_1 (tt, data, created_at, updated_at) values
('demo-oem-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Làm báo giá OEM sàn SPC cho khách Đài Loan — 5 container',
  'NGƯỜI ĐƯỢC GIAO','Phan Thị Ngọc','NGÀY GIAO','28/08/2026','Y/C XONG','12/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',50,'KẾT QUẢ','Đã gửi draft; chờ phản hồi spec',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-oem-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Đối soát tiến độ sản xuất đơn OEM Hàn Quốc với NM Wilson',
  'NGƯỜI ĐƯỢC GIAO','Phan Thị Ngọc','NGÀY GIAO','18/08/2026','Y/C XONG','01/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',70,'KẾT QUẢ','Line A đạt 65%; còn thiếu keo',
  'LINK KQ','','VƯỚNG MẮC','Mua SX chậm giao keo','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-oem-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 33/2026',
  'CÔNG VIỆC','Ký PO OEM khách Mỹ — mẫu vân Oak mới',
  'NGƯỜI ĐƯỢC GIAO','Phan Thị Ngọc','NGÀY GIAO','20/07/2026','Y/C XONG','10/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','PO #US-0826 đã ký',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành','08/08/2026 15:00:00'
), now(), now()),
('demo-oem-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Lên lịch thăm khách OEM miền Bắc tuần 37',
  'NGƯỜI ĐƯỢC GIAO','Phan Thị Ngọc','NGÀY GIAO','03/09/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',25,'KẾT QUẢ','Đã hẹn 3 khách',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now());

-- ========== III.2 PHÒNG KẾ TOÁN SẢN XUẤT ==========
delete from public.iii_2 where tt like 'demo-%';
insert into public.iii_2 (tt, data, created_at, updated_at) values
('demo-ktsx-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Tính giá thành đơn OEM Hàn Quốc tuần 35–36',
  'NGƯỜI ĐƯỢC GIAO','Đặng Minh Sơn','NGÀY GIAO','01/09/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',45,'KẾT QUẢ','Đã nhập NVL; chờ giờ công',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-ktsx-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Đối soát công nợ OEM với KD OEM',
  'NGƯỜI ĐƯỢC GIAO','Đặng Minh Sơn','NGÀY GIAO','20/08/2026','Y/C XONG','31/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',80,'KẾT QUẢ','Còn lệch 1 invoice',
  'LINK KQ','','VƯỚNG MẮC','Chờ xác nhận từ khách','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-ktsx-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Khóa sổ chi phí sản xuất tháng 7',
  'NGƯỜI ĐƯỢC GIAO','Đặng Minh Sơn','NGÀY GIAO','01/08/2026','Y/C XONG','12/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Đã gửi BLĐ',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành','11/08/2026 17:00:00'
), now(), now()),
('demo-ktsx-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Lập bảng định mức NVL cho mẫu Oak mới',
  'NGƯỜI ĐƯỢC GIAO','Đặng Minh Sơn','NGÀY GIAO','02/09/2026','Y/C XONG','18/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',20,'KẾT QUẢ','Đang lấy số liệu từ QC',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== III.3 NHÀ MÁY WILSON HB ==========
delete from public.iii_3 where tt like 'demo-%';
insert into public.iii_3 (tt, data, created_at, updated_at) values
('demo-nm-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Sản xuất đơn OEM Hàn Quốc — mục tiêu 2 container tuần 36',
  'NGƯỜI ĐƯỢC GIAO','Nguyễn Văn Hùng','NGÀY GIAO','25/08/2026','Y/C XONG','07/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',65,'KẾT QUẢ','Line A chạy ổn; đạt ~65%',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-nm-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Giảm tỉ lệ lỗi line A xuống dưới 5%',
  'NGƯỜI ĐƯỢC GIAO','Mai Văn Cường','NGÀY GIAO','10/08/2026','Y/C XONG','31/08/2026',
  'GIA HẠN 1','10/09/2026','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',70,'KẾT QUẢ','Tuần 35 còn 5.8%',
  'LINK KQ','','VƯỚNG MẮC','Máy ép cần bảo dưỡng','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-nm-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Bảo dưỡng định kỳ dây chuyền số 2',
  'NGƯỜI ĐƯỢC GIAO','Mai Văn Cường','NGÀY GIAO','01/08/2026','Y/C XONG','15/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Biên bản BD đã ký',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','14/08/2026 16:00:00'
), now(), now()),
('demo-nm-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Báo cáo tồn vật tư chậm luân chuyển kho 2',
  'NGƯỜI ĐƯỢC GIAO','Nguyễn Văn Hùng','NGÀY GIAO','01/09/2026','Y/C XONG','06/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',35,'KẾT QUẢ','Đang đối chiếu với Phòng Kho',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== IV.1 MUA THƯƠNG MẠI ==========
delete from public.iv_1 where tt like 'demo-%';
insert into public.iv_1 (tt, data, created_at, updated_at) values
('demo-mtm-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','So sánh báo giá keo + phụ kiện từ 3 NCC',
  'NGƯỜI ĐƯỢC GIAO','Trịnh Thị Yến','NGÀY GIAO','28/08/2026','Y/C XONG','10/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',50,'KẾT QUẢ','Đã nhận 2/3 báo giá',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now()),
('demo-mtm-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Theo dõi lead time hàng nhập khẩu phụ kiện đang trên đường',
  'NGƯỜI ĐƯỢC GIAO','Trịnh Thị Yến','NGÀY GIAO','15/08/2026','Y/C XONG','01/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',80,'KẾT QUẢ','Tàu delay 5 ngày',
  'LINK KQ','','VƯỚNG MẮC','Cảng đến tắc','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-mtm-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 33/2026',
  'CÔNG VIỆC','Ký hợp đồng khung NCC keo nội địa 2026–2027',
  'NGƯỜI ĐƯỢC GIAO','Trịnh Thị Yến','NGÀY GIAO','20/07/2026','Y/C XONG','15/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','HĐ đã ký 12/08',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành','12/08/2026 10:30:00'
), now(), now()),
('demo-mtm-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đặt hàng phụ kiện CTKM tháng 9 theo đề nghị KD Gỗ',
  'NGƯỜI ĐƯỢC GIAO','Trịnh Thị Yến','NGÀY GIAO','02/09/2026','Y/C XONG','15/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',20,'KẾT QUẢ','Đang chốt số lượng',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành',''
), now(), now());

-- ========== IV.2 MUA SẢN XUẤT ==========
delete from public.iv_2 where tt like 'demo-%';
insert into public.iv_2 (tt, data, created_at, updated_at) values
('demo-msx-01', jsonb_build_object(
  'TT','1','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đặt gỗ nguyên liệu cho đơn OEM tuần 38',
  'NGƯỜI ĐƯỢC GIAO','Cao Đức Thành','NGÀY GIAO','01/09/2026','Y/C XONG','12/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',35,'KẾT QUẢ','Đã gửi RFQ 2 NCC',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','4','Ngày hoàn thành',''
), now(), now()),
('demo-msx-02', jsonb_build_object(
  'TT','2','Kỳ báo cáo','Tuần 35/2026',
  'CÔNG VIỆC','Giao keo cho NM Wilson — đơn OEM Hàn Quốc',
  'NGƯỜI ĐƯỢC GIAO','Cao Đức Thành','NGÀY GIAO','18/08/2026','Y/C XONG','28/08/2026',
  'GIA HẠN 1','05/09/2026','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Quá hạn','TIẾN ĐỘ CV',60,'KẾT QUẢ','NCC giao thiếu 20%',
  'LINK KQ','','VƯỚNG MẮC','NCC trễ — ảnh hưởng line A','CẦN LĐ TÁC ĐỘNG','Có','MỨC ẢNH HƯỞNG','5','Ngày hoàn thành',''
), now(), now()),
('demo-msx-03', jsonb_build_object(
  'TT','3','Kỳ báo cáo','Tuần 34/2026',
  'CÔNG VIỆC','Xác nhận lịch giao NVL nội địa tháng 8',
  'NGƯỜI ĐƯỢC GIAO','Cao Đức Thành','NGÀY GIAO','01/08/2026','Y/C XONG','10/08/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Hoàn thành','TIẾN ĐỘ CV',100,'KẾT QUẢ','Lịch đã chốt với 4 NCC',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','3','Ngày hoàn thành','09/08/2026 11:00:00'
), now(), now()),
('demo-msx-04', jsonb_build_object(
  'TT','4','Kỳ báo cáo','Tuần 36/2026',
  'CÔNG VIỆC','Đánh giá NCC gỗ mới (miền Trung) — mẫu + giá',
  'NGƯỜI ĐƯỢC GIAO','Cao Đức Thành','NGÀY GIAO','03/09/2026','Y/C XONG','25/09/2026',
  'GIA HẠN 1','','GIA HẠN 2','','GIA HẠN 3','',
  'TIẾN ĐỘ','Đang làm','TIẾN ĐỘ CV',10,'KẾT QUẢ','Đã nhận mẫu; chờ QC',
  'LINK KQ','','VƯỚNG MẮC','','CẦN LĐ TÁC ĐỘNG','Không','MỨC ẢNH HƯỞNG','2','Ngày hoàn thành',''
), now(), now());

notify pgrst, 'reload schema';

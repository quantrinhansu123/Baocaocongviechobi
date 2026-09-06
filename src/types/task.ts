export type TaskRecord = {
  stt: number;
  kyBaoCao: string;
  congViec: string;
  nguoiGiao: string;
  /** Danh sách người theo dõi (họ tên) */
  nguoiTheoDoi: string[];
  ngayGiao: string;
  ycXong: string;
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  ketQua: string;
  linkKQ: string;
  /** Tên tài liệu gắn với linkKQ (link đầu tiên — tương thích cũ) */
  tenTaiLieu: string;
  /** Nhiều link tài liệu */
  taiLieuLinks: TaskDocLink[];
  tienDo: string;
  /** Phần trăm tiến độ công việc (0–100) */
  tienDoPhanTram: number;
  trangThai: string;
  ngayGioHoanThanh: string;
  vuongMac: string;
  canLD: string;
  /** Chi tiết khi cần lãnh đạo tác động */
  noiDungCanTacDong: string;
  anhHuong: number;
  /** Khóa dòng (cột TT) — dùng khi Edit/Delete */
  rowKey?: string | null;
  sourceRow?: Record<string, unknown>;
};

export type TaskDocLink = {
  ten: string;
  link: string;
};

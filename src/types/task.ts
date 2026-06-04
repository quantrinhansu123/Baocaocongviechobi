export type TaskRecord = {
  stt: number;
  kyBaoCao: string;
  congViec: string;
  nguoiGiao: string;
  ngayGiao: string;
  ycXong: string;
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  ketQua: string;
  linkKQ: string;
  tienDo: string;
  trangThai: string;
  ngayGioHoanThanh: string;
  vuongMac: string;
  canLD: string;
  anhHuong: number;
  /** Khóa dòng AppSheet (cột TT trên bảng công việc) — dùng khi Edit/Delete */
  appsheetRowKey?: string | null;
  sourceRow?: Record<string, unknown>;
};

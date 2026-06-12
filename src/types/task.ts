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
  /** Khóa dòng (cột TT) — dùng khi Edit/Delete */
  rowKey?: string | null;
  sourceRow?: Record<string, unknown>;
};

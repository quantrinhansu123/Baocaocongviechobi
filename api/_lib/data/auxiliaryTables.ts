/** Bảng phụ trợ (id + data jsonb) — logical name → tên Postgres */
export const AUXILIARY_TABLE_MAP: Record<string, string> = {
  'Công nợ': 'cong_no',
  'Lịch báo cáo': 'lich_bao_cao',
  'Người dùng': 'nguoi_dung',
  'Mẫu báo cáo': 'mau_bao_cao',
  'Thư mục': 'thu_muc',
  'Phân quyền': 'phan_quyen',
  'BC chi tiết': 'bc_chi_tiet',
  'Cảnh báo': 'canh_bao',
};

export const AUXILIARY_LOGICAL_NAMES = Object.keys(AUXILIARY_TABLE_MAP);

export function isAuxiliaryTableName(tableName: string): boolean {
  return tableName.trim() in AUXILIARY_TABLE_MAP;
}

export function auxiliaryTableToSupabaseName(logicalTable: string): string {
  return AUXILIARY_TABLE_MAP[logicalTable.trim()] ?? logicalTable.trim().toLowerCase();
}

export type ReportBlockRecord = {
  blockKey: string;
  ma: string;
  blockLabel: string;
  order: number;
};

export type ReportGroupRecord = {
  groupKey: string;
  blockKey: string;
  label: string;
  order: number;
};

export type ReportCatalog = {
  reports: Record<string, ReportRecord>;
  blocks: ReportBlockRecord[];
  groups: ReportGroupRecord[];
};

export type ReportRecord = {
  key: string;
  stt: number;
  ma: string;
  name: string;
  menuLabel: string;
  noidung: string;
  ngay: string;
  ky: string;
  nguoiGui: string;
  nguoiNhan: string;
  luong: string;
  link: string;
  loaiBaoCao: string;
  blockKey: string;
  blockLabel: string;
  periodKey: string;
  periodLabel: string;
  groupKey?: string;
  sourceRow?: Record<string, unknown>;
};

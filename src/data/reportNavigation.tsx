import React from 'react';
import type { MenuProps } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const monoIcon = (node: React.ReactElement<{ className?: string }>) =>
  React.cloneElement(node, {
    className: ['sidebar-nav-icon', node.props.className].filter(Boolean).join(' '),
  });

/** Dữ liệu báo cáo — dùng chung cho menu sidebar và trang chi tiết */
export const ALL_REPORTS: Record<string, Record<string, unknown> & { name: string; ky?: string }> = {
  'nm-r2': { stt: 1, name: 'Báo cáo tháng Mr Hùng/phụ trách NM', noidung: 'Tổng hợp tháng tại nhà máy', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mr Hùng – Nhà máy', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/B2' },
  'nm-r3': { stt: 2, name: 'Tổng hợp biên bản xử lý lỗi trong sản xuất cả tháng trước', noidung: 'Xử lý các lỗi trong ca tháng trước', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mr Hùng – Nhà máy', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/C1' },
  'nm-r4': { stt: 3, name: 'Cập nhật định mức sản xuất', noidung: 'Các thay đổi định mức trong sản xuất', ngay: 'Ngày 30 tháng đầu tiên', ky: 'Quý', nguoiGui: 'Mr Hòa – Kế hoạch sx NM', nguoiNhan: 'Mr Tuyển + BLĐ + Kế toán', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/D8' },
  'nm-r5': { stt: 4, name: 'Cập nhật bổ công thức trong sản xuất', noidung: 'Khi có thay đổi công thức đóng hàng', ngay: 'Ngày 5 / Khi thay đổi', ky: 'Tháng', nguoiGui: 'Mr Hòa – Kế hoạch sx NM', nguoiNhan: 'BLĐ + Kế toán', luong: 'Base', link: 'https://docs.google.com/spreadsheets/d/E3' },

  'oem-r1': { stt: 1, name: 'Báo cáo công nợ OEM', noidung: 'Theo dõi công nợ khách hàng OEM', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Chị Lan – Kế toán', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com' },
  'oem-r3': { stt: 2, name: 'Tồn kho OEM', noidung: 'Báo cáo tồn kho nguyên liệu OEM', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Anh Hùng – Kho', nguoiNhan: 'Mr Tuyển + Kế toán', luong: 'Base', link: 'https://docs.google.com' },
  'oem-r4': { stt: 3, name: 'Đánh giá & hạn mức OEM', noidung: 'Đánh giá khách hàng và hạn mức tín dụng', ngay: 'Ngày 10', ky: 'Quý', nguoiGui: 'Chị Mai – Kinh doanh', nguoiNhan: 'Mr Tuyển + Kế toán', luong: 'Base', link: 'https://docs.google.com' },

  'tm-r1': { stt: 1, name: 'KPI kinh doanh', noidung: 'Theo dõi KPI đội kinh doanh thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Mrs Thao – KD', nguoiNhan: 'Mr Tuyển + BLĐ', luong: 'Base', link: 'https://docs.google.com' },
  'tm-r2': { stt: 2, name: 'Công nợ thương mại', noidung: 'Tổng hợp công nợ khách thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Chị Lan – Kế toán', nguoiNhan: 'Mr Tuyển', luong: 'Base', link: 'https://docs.google.com' },
  'tm-r3': { stt: 3, name: 'Tồn kho thương mại', noidung: 'Báo cáo tồn kho sản phẩm thương mại', ngay: 'Ngày 5', ky: 'Tháng', nguoiGui: 'Anh Hùng – Kho', nguoiNhan: 'Mr Tuyển', luong: 'Base', link: 'https://docs.google.com' },
};

export const TREE_RAW: { key: string; label: string; children: string[] }[] = [
  { key: 'nha-may', label: 'Nhà Máy', children: ['nm-r2', 'nm-r3', 'nm-r4', 'nm-r5'] },
  { key: 'oem', label: 'OEM', children: ['oem-r1', 'oem-r3', 'oem-r4'] },
  { key: 'thuong-mai', label: 'Thương Mại', children: ['tm-r1', 'tm-r2', 'tm-r3'] },
  { key: 'du-an', label: 'Dự Án', children: [] },
  { key: 'marketing', label: 'Marketing', children: [] },
  { key: 'ke-toan', label: 'Kế Toán', children: [] },
  { key: 'khac', label: 'Khác (phát sinh)', children: [] },
];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}

function periodForKy(ky: string | undefined): 'Báo cáo Tuần' | 'Báo cáo Tháng' | 'Báo cáo Quý' {
  const k = (ky || '').toLowerCase();
  if (k.includes('tuần')) return 'Báo cáo Tuần';
  if (k.includes('quý')) return 'Báo cáo Quý';
  return 'Báo cáo Tháng';
}

/** Mở đủ nhánh menu để thấy báo cáo đang chọn (deep link). */
export function openKeysForReportId(reportId: string | null | undefined): string[] {
  if (!reportId || !ALL_REPORTS[reportId]) return [];
  const dept = TREE_RAW.find(d => d.children.includes(reportId));
  if (!dept) return ['sub-bao-cao'];
  const pName = periodForKy(ALL_REPORTS[reportId].ky as string);
  return ['sub-bao-cao', `dept-${dept.key}`, `period-${dept.key}-${pName}`];
}

/** Cây menu: cấp 1 = số La Mã + tên khối; cấp 2 = 1,2,3… + kỳ; cấp 3 = icon + tên báo cáo */
export function buildReportMenuItems(): NonNullable<MenuProps['items']> {
  return TREE_RAW.map((dept, idx) => {
    const roman = toRoman(idx + 1);
    const periods: Record<string, string[]> = {
      'Báo cáo Tuần': [],
      'Báo cáo Tháng': [],
      'Báo cáo Quý': [],
    };
    dept.children.forEach(rKey => {
      const report = ALL_REPORTS[rKey];
      if (!report) return;
      periods[periodForKy(report.ky as string)].push(rKey);
    });

    const periodChildren: NonNullable<MenuProps['items']> = [];
    let periodIndex = 0;
    (['Báo cáo Tuần', 'Báo cáo Tháng', 'Báo cáo Quý'] as const).forEach(pLabel => {
      const keys = periods[pLabel];
      if (keys.length === 0) return;
      periodIndex += 1;
      periodChildren.push({
        key: `period-${dept.key}-${pLabel}`,
        label: `${periodIndex}. ${pLabel}`,
        children: keys.map(k => ({
          key: `report-${k}`,
          icon: monoIcon(<FileTextOutlined />),
          label: ALL_REPORTS[k]?.name ?? k,
        })),
      });
    });

    const label = `${roman}. ${dept.label}`;
    if (periodChildren.length === 0) {
      return {
        key: `dept-${dept.key}`,
        label,
        disabled: true,
      };
    }
    return {
      key: `dept-${dept.key}`,
      label,
      children: periodChildren,
    };
  });
}

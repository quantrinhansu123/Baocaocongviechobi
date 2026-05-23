export type DeptSpec = { key: string; name: string };

export type BlockSpec = {
  key: string;
  label: string;
  titleClass: string;
  deptTitleClass: string;
  depts: DeptSpec[];
};

export const ORG_BLOCKS: BlockSpec[] = [
  {
    key: 'bld',
    label: 'BAN LÃNH ĐẠO',
    titleClass: 'text-[#1E386B]',
    deptTitleClass: 'text-[#1e40af]',
    depts: [
      { key: 'bld-ca-nhan', name: 'CÔNG VIỆC CÁ NHÂN' },
      { key: 'bld-cong-viec-bld', name: 'CÔNG VIỆC CỦA BLĐ' },
    ],
  },
  {
    key: 'tm',
    label: 'KHỐI THƯƠNG MẠI',
    titleClass: 'text-[#0f766e]',
    deptTitleClass: 'text-[#0d9488]',
    depts: [
      { key: 'tm-hcns', name: 'PHÒNG HCNS' },
      { key: 'tm-kd-go', name: 'PHÒNG KD HOBI GỖ' },
      { key: 'tm-kd-nhua', name: 'PHÒNG KD HOBI NHỰA' },
      { key: 'tm-xuat-khau', name: 'PHÒNG XUẤT KHẨU' },
      { key: 'tm-du-an', name: 'PHÒNG DỰ ÁN' },
      { key: 'tm-cn-hcm', name: 'CHI NHÁNH HCM' },
      { key: 'tm-marketing', name: 'PHÒNG MARKETING' },
      { key: 'tm-ke-toan', name: 'PHÒNG KẾ TOÁN TM' },
      { key: 'tm-kho', name: 'PHÒNG KHO' },
    ],
  },
  {
    key: 'sx',
    label: 'KHỐI SẢN XUẤT',
    titleClass: 'text-[#c2410c]',
    deptTitleClass: 'text-[#ea580c]',
    depts: [
      { key: 'sx-kd-oem', name: 'PHÒNG KD OEM' },
      { key: 'sx-ke-toan', name: 'PHÒNG KẾ TOÁN SẢN XUẤT' },
      { key: 'sx-nm-wilson', name: 'NHÀ MÁY WILSON HB' },
    ],
  },
  {
    key: 'mua',
    label: 'PHÒNG MUA NỘI ĐỊA, QUỐC TẾ',
    titleClass: 'text-[#475569]',
    deptTitleClass: 'text-[#64748b]',
    depts: [
      { key: 'mua-thuong-mai', name: 'MUA THƯƠNG MẠI' },
      { key: 'mua-san-xuat', name: 'MUA SẢN XUẤT' },
    ],
  },
];
